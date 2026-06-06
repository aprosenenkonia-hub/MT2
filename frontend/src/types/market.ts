export type Resolution = '1' | '5' | '15' | '60' | 'D' | 'W' | 'M';

export interface Bar {
  /** Unix timestamp in milliseconds, backend returns Moscow candle begin time normalized to UTC ms. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolSearchItem {
  symbol: string;
  full_name: string;
  ticker: string;
  description: string;
  exchange: string;
  type: string;
}

export interface WatchItem {
  symbol: string;
  ticker: string;
  description: string;
  last: number | null;
  change: number;
  changePercent: number;
  volume: number | null;
}

export interface BarsResponse {
  bars: Bar[];
  noData: boolean;
  nextTime?: number;
}
