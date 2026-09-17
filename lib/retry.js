// Retries a failing async call a couple of times before giving up —
// smooths over brief mobile-network hiccups instead of showing an error immediately.
export async function withRetry(fn, times = 2, delayMs = 700) {
  let lastErr;
  for (let i = 0; i <= times; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < times) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
