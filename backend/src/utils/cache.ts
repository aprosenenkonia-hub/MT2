export class TtlCache<T> {
  private values = new Map<string, { expiresAt: number; value: T }>();
  constructor(private readonly ttlMs: number) {}
  get(key: string): T | undefined {
    const item = this.values.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.values.delete(key);
      return undefined;
    }
    return item.value;
  }
  set(key: string, value: T): void {
    this.values.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
  delete(key: string): void { this.values.delete(key); }
  clear(): void { this.values.clear(); }
}
