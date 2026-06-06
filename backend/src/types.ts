export type Resolution = '1' | '5' | '15' | '60' | 'D' | 'W' | 'M';

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolRecord {
  ticker: string;
  tvSymbol: string;
  shortName: string;
  description: string;
  exchange: 'MOEX';
  engine: string;
  market: string;
  board: string;
  type: 'stock' | 'bond' | 'etf' | 'index' | 'unknown';
  lotSize: number;
  minmov: number;
  pricescale: number;
  currencyCode: string;
  session: string;
  timezone: string;
}

export interface SearchSymbolResult {
  symbol: string;
  full_name: string;
  description: string;
  exchange: string;
  ticker: string;
  type: string;
}

export interface TradingViewSymbolInfo {
  name: string;
  ticker: string;
  full_name: string;
  description: string;
  type: string;
  session: string;
  exchange: string;
  listed_exchange: string;
  timezone: string;
  format: 'price';
  pricescale: number;
  minmov: number;
  has_intraday: boolean;
  has_daily: boolean;
  has_weekly_and_monthly: boolean;
  supported_resolutions: Resolution[];
  volume_precision: number;
  data_status: 'streaming' | 'endofday' | 'delayed_streaming';
}
