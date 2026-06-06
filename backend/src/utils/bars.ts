import type { Bar } from '../types.js';

export function sortAndDedupeBars(bars: Bar[]): Bar[] {
  const map = new Map<number, Bar>();
  for (const bar of bars) {
    if (!Number.isFinite(bar.time)) continue;
    if ([bar.open, bar.high, bar.low, bar.close].some(v => !Number.isFinite(v))) continue;
    map.set(bar.time, bar);
  }
  return [...map.values()].sort((a, b) => a.time - b.time);
}

export function isNewerOrSameLastBar(candidate: Bar, previous?: Bar): boolean {
  return !previous || candidate.time >= previous.time;
}
