import { listUnprocessedEmails, classifyEmail, applyCategory } from "../services/outlookClient.js";
import { withRetry } from "../services/retry.js";
import { processQueue } from "../services/queue.js";
import { BATCH_LIMIT, CONCURRENCY, RETRY_ATTEMPTS, RETRY_DELAY_MS } from "../config/constants.js";

// POST /process-history
// Processes all unread emails in the mailbox (up to BATCH_LIMIT per call),
// classifying and tagging each. One failed email does not stop the batch.
export async function processHistoryRoute(env) {
  const start = Date.now();

  const list = await listUnprocessedEmails(env, BATCH_LIMIT);

  if (!list.success) {
    return Response.json(
      { success: false, error: "Could not list emails.", detail: list },
      { status: 500 }
    );
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

  const durationSeconds = ((Date.now() - start) / 1000).toFixed(1);

  return Response.json({
    processed: results.processed,
    skipped: results.skipped,
    failed: results.failed,
    remaining: list.hasMore ? `more than ${BATCH_LIMIT}, run again` : 0,
    duration: `${durationSeconds}s`,
    errors: results.errors
  });
}
