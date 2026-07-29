// Concurrency-limited processing queue with per-item error isolation.
// Runs multiple items in parallel (bounded) instead of one-at-a-time,
// so a batch finishes well within the request time limit.
// Not backed by a persistent queue yet — swap this for Cloudflare Queues
// later without changing callers (processHistory route).
export async function processQueue(items, handler, concurrency = 5) {
  const result = {
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  let index = 0;

  async function worker() {
    while (index < items.length) {
      const item = items[index++];
      try {
        const outcome = await handler(item);
        if (outcome === "skipped") {
          result.skipped++;
        } else {
          result.processed++;
        }
      } catch (err) {
        result.failed++;
        result.errors.push({ id: item.id, error: err.message });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);

  return result;
}
