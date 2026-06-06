import { MoexAdapter } from '../adapters/moexAdapter.js';
import type { SearchSymbolResult, TradingViewSymbolInfo } from '../types.js';

export class SymbolService {
  constructor(private readonly moex: MoexAdapter) {}

  async search(query: string): Promise<SearchSymbolResult[]> {
    const symbols = await this.moex.searchSymbols(query);
    return symbols.map(s => ({
      symbol: s.ticker,
      full_name: s.tvSymbol,
      description: s.description,
      exchange: s.exchange,
      ticker: s.tvSymbol,
      type: s.type,
    }));
  }

  async resolve(symbol: string): Promise<TradingViewSymbolInfo | undefined> {
    const s = await this.moex.resolveSymbol(symbol);
    if (!s) return undefined;
    return {
      name: s.tvSymbol,
      ticker: s.tvSymbol,
      full_name: s.tvSymbol,
      description: s.description,
      type: s.type,
      session: s.session,
      exchange: s.exchange,
      listed_exchange: s.exchange,
      timezone: s.timezone,
      format: 'price',
      pricescale: s.pricescale,
      minmov: s.minmov,
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: true,
      supported_resolutions: this.moex.getSupportedResolutions(),
      volume_precision: 0,
      data_status: 'delayed_streaming',
    };
  }
}
