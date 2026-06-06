import { apiGet } from './api';
import type { Bar, BarsResponse, Resolution, SymbolSearchItem, WatchItem } from '../types/market';

export function normalizeSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  return s.startsWith('MOEX:') ? s : `MOEX:${s}`;
}

export async function getBars(args: { symbol: string; resolution: Resolution; from: number; to: number }, signal?: AbortSignal): Promise<Bar[]> {
  const symbol = encodeURIComponent(normalizeSymbol(args.symbol));
  const res = await apiGet<BarsResponse>(`/api/bars?symbol=${symbol}&resolution=${encodeURIComponent(args.resolution)}&from=${args.from}&to=${args.to}`, signal);
  return dedupeAndSort(res.bars ?? []);
}

export async function searchSymbols(query: string): Promise<SymbolSearchItem[]> {
  return apiGet<SymbolSearchItem[]>(`/api/symbols/search?query=${encodeURIComponent(query)}`);
}

export async function getWatchlist(): Promise<WatchItem[]> {
  return apiGet<WatchItem[]>('/api/watchlist');
}

function dedupeAndSort(bars: Bar[]): Bar[] {
  const sorted = [...bars].sort((a, b) => a.time - b.time);
  return sorted.filter((bar, i) => i === 0 || bar.time !== sorted[i - 1].time);
}
