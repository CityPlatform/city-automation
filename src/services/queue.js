// Sequential in-request processing queue with per-item error isolation.
// Not backed by a persistent queue yet — swap the loop body for
// Cloudflare Queues later without changing callers (processHistory route).
export async function processQueue(items, handler) {
  const result = {
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };

  for (const item of items) {
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

  return result;
}
