export class RateLimiter {
  private queue: Array<() => void> = [];
  private active = false;
  constructor(private readonly requestsPerSecond: number) {}
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
      this.pump();
    });
    return fn();
  }
  private pump() {
    if (this.active) return;
    this.active = true;
    const interval = Math.max(1, Math.floor(1000 / Math.max(1, this.requestsPerSecond)));
    const tick = () => {
      const next = this.queue.shift();
      if (next) next();
      if (this.queue.length) setTimeout(tick, interval);
      else this.active = false;
    };
    tick();
  }
}
