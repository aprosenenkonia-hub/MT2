export async function retry<T>(fn: () => Promise<T>, attempts: number, delayMs: number): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (error) {
      last = error;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
    }
  }
  throw last;
}
