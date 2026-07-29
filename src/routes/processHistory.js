import { listUnprocessedEmails, classifyEmail, applyCategory } from "../services/outlookClient.js";
import { withRetry } from "../services/retry.js";
import { processQueue } from "../services/queue.js";
import { BATCH_LIMIT, CONCURRENCY, RETRY_ATTEMPTS, RETRY_DELAY_MS } from "../config/constants.js";

const TIME_BUDGET_MS = 80000; // stay safely under Cloudflare's gateway timeout

// POST /process-history
// Loops through multiple internal batches of unread emails, classifying and
// tagging each, until either the mailbox is caught up or the time budget
// runs out (large mailboxes need several manual calls; this reduces how many).
export async function processHistoryRoute(env) {
  const start = Date.now();

  const totals = {
    processed: 0,
    skipped: 0,
    failed: 0,
    batches: 0,
    errors: []
  };

  let hasMore = true;

  while (hasMore && Date.now() - start < TIME_BUDGET_MS) {
    const list = await listUnprocessedEmails(env, BATCH_LIMIT);

    if (!list.success) {
      totals.errors.push({ error: "Could not list emails.", detail: list });
      break;
    }

    if (list.emails.length === 0) {
      hasMore = false;
      break;
    }

    const results = await processQueue(list.emails, async (email) => {
      if (!email.subject && !email.body) {
        return "skipped";
      }

      const classifyResult = await withRetry(
        () => classifyEmail(env, { subject: email.subject, body: (email.body || "").slice(0, 3000) }),
        { retries: RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
      );

      const category = classifyResult?.data?.data?.category;
      if (!category) {
        throw new Error("Classification did not return a category.");
      }

      const applyResult = await withRetry(
        () => applyCategory(env, { messageId: email.id, category, markRead: true }),
        { retries: RETRY_ATTEMPTS, delayMs: RETRY_DELAY_MS }
      );

      if (!applyResult.status || applyResult.status >= 300) {
        throw new Error(`apply-category failed with status ${applyResult.status}`);
      }

      return "processed";
    }, CONCURRENCY);

    totals.processed += results.processed;
    totals.skipped += results.skipped;
    totals.failed += results.failed;
    totals.errors.push(...results.errors);
    totals.batches += 1;

    hasMore = list.hasMore;
  }

  const durationSeconds = ((Date.now() - start) / 1000).toFixed(1);

  return Response.json({
    processed: totals.processed,
    skipped: totals.skipped,
    failed: totals.failed,
    batches: totals.batches,
    remaining: hasMore ? "more remaining, run again" : 0,
    duration: `${durationSeconds}s`,
    errors: totals.errors
  });
}
