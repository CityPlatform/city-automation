export async function withRetry(fn, { retries, delayMs } = {}) {
  const maxRetries = retries ?? 2;
  const wait = delayMs ?? 300;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
  }

  throw lastError;
}
