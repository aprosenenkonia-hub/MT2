import { request } from 'undici';
import { config } from '../config.js';
import type { Bar, Resolution, SymbolRecord } from '../types.js';
import { TtlCache } from '../utils/cache.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { retry } from '../utils/retry.js';
import { sortAndDedupeBars } from '../utils/bars.js';

const supportedResolutions: Resolution[] = ['1', '5', '15', '60', 'D', 'W', 'M'];

function columnIndex(columns: string[], name: string): number {
  return columns.findIndex(c => c.toLowerCase() === name.toLowerCase());
}

function value(row: unknown[], columns: string[], name: string): unknown {
  const idx = columnIndex(columns, name);
  return idx >= 0 ? row[idx] : undefined;
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(sec: number): string {
  return new Date(sec * 1000).toISOString().slice(0, 10);
}

function normalizeTvSymbol(input: string): string {
  const trimmed = input.trim().toUpperCase();
  return trimmed.startsWith('MOEX:') ? trimmed : `MOEX:${trimmed}`;
}

function tickerFromTvSymbol(input: string): string {
  return normalizeTvSymbol(input).replace('MOEX:', '');
}

function resolutionToInterval(resolution: Resolution): number {
  const map: Record<Resolution, number> = { '1': 1, '5': 5, '15': 15, '60': 60, D: 24, W: 7, M: 31 };
  return map[resolution];
}

function moexCandleTimeToMs(begin: unknown): number {
  const s = String(begin ?? '');
  // MOEX returns Moscow local timestamps such as 2024-06-03 10:00:00.
  // Use +03:00 to avoid browser/server local timezone drift.
  return Date.parse(s.replace(' ', 'T') + '+03:00');
}

export class MoexAdapter {
  private readonly symbolsCache = new TtlCache<SymbolRecord[]>(10 * 60_000);
  private readonly barsCache = new TtlCache<Bar[]>(30_000);
  private readonly limiter = new RateLimiter(config.moexRequestsPerSecond);

  getSupportedResolutions(): Resolution[] { return supportedResolutions; }

  async searchSymbols(query = '', limit = 30): Promise<SymbolRecord[]> {
    const q = query.trim().toUpperCase();
    const symbols = await this.loadSymbols();
    return symbols
      .filter(s => !q || s.ticker.includes(q) || s.shortName.toUpperCase().includes(q) || s.description.toUpperCase().includes(q))
      .slice(0, limit);
  }

  async resolveSymbol(symbol: string): Promise<SymbolRecord | undefined> {
    const tv = normalizeTvSymbol(symbol);
    const ticker = tickerFromTvSymbol(tv);
    const symbols = await this.loadSymbols();
    return symbols.find(s => s.tvSymbol === tv || s.ticker === ticker);
  }

  async loadSymbols(): Promise<SymbolRecord[]> {
    const cached = this.symbolsCache.get('symbols');
    if (cached) return cached;
    const path = `/engines/${config.defaultEngine}/markets/${config.defaultMarket}/boards/${config.defaultBoard}/securities.json`;
    const json = await this.getJson(path, { 'iss.meta': 'off' });
    const block = json.securities;
    const marketData = json.marketdata;
    const columns: string[] = block?.columns ?? [];
    const rows: unknown[][] = block?.data ?? [];
    const mdColumns: string[] = marketData?.columns ?? [];
    const mdRows: unknown[][] = marketData?.data ?? [];
    const mdBySecId = new Map<string, unknown[]>();
    for (const row of mdRows) mdBySecId.set(String(value(row, mdColumns, 'SECID')), row);

    const symbols: SymbolRecord[] = rows.map(row => {
      const ticker = String(value(row, columns, 'SECID') ?? '');
      const md = mdBySecId.get(ticker);
      const decimals = Math.max(0, toNumber(value(row, columns, 'DECIMALS'), 2));
      const shortName = String(value(row, columns, 'SHORTNAME') ?? ticker);
      return {
        ticker,
        tvSymbol: `MOEX:${ticker}`,
        shortName,
        description: String(value(row, columns, 'SECNAME') ?? shortName),
        exchange: 'MOEX',
        engine: config.defaultEngine,
        market: config.defaultMarket,
        board: config.defaultBoard,
        type: 'stock',
        lotSize: toNumber(value(row, columns, 'LOTSIZE'), 1),
        minmov: 1,
        pricescale: Math.pow(10, decimals),
        currencyCode: String(value(row, columns, 'FACEUNIT') ?? value(md ?? [], mdColumns, 'CURRENCYID') ?? 'RUB'),
        session: '1000-1845',
        timezone: 'Europe/Moscow',
      };
    }).filter(s => s.ticker);

    this.symbolsCache.set('symbols', symbols);
    return symbols;
  }

  async getCandles(args: { symbol: string; resolution: Resolution; from: number; to: number }): Promise<Bar[]> {
    const symbolRecord = await this.resolveSymbol(args.symbol);
    const ticker = symbolRecord?.ticker ?? tickerFromTvSymbol(args.symbol);
    const cacheKey = `${ticker}:${args.resolution}:${args.from}:${args.to}`;
    const cached = this.barsCache.get(cacheKey);
    if (cached) return cached;

    const interval = resolutionToInterval(args.resolution);
    const path = `/engines/${symbolRecord?.engine ?? config.defaultEngine}/markets/${symbolRecord?.market ?? config.defaultMarket}/boards/${symbolRecord?.board ?? config.defaultBoard}/securities/${ticker}/candles.json`;
    const all: Bar[] = [];
    let start = 0;
    while (true) {
      const json = await this.getJson(path, {
        interval: String(interval),
        from: formatDate(args.from),
        till: formatDate(args.to),
        start: String(start),
        'iss.meta': 'off',
      });
      const block = json.candles;
      const columns: string[] = block?.columns ?? [];
      const rows: unknown[][] = block?.data ?? [];
      for (const row of rows) {
        const time = moexCandleTimeToMs(value(row, columns, 'begin'));
        if (time < args.from * 1000 || time > args.to * 1000) continue;
        all.push({
          time,
          open: toNumber(value(row, columns, 'open')),
          high: toNumber(value(row, columns, 'high')),
          low: toNumber(value(row, columns, 'low')),
          close: toNumber(value(row, columns, 'close')),
          volume: toNumber(value(row, columns, 'volume')),
        });
      }
      if (rows.length < 500) break;
      start += rows.length;
      if (start > 20_000) break;
    }
    const bars = sortAndDedupeBars(all);
    this.barsCache.set(cacheKey, bars);
    return bars;
  }

  private async getJson(path: string, query: Record<string, string>): Promise<any> {
    const url = new URL(config.moexBaseUrl.replace(/\/$/, '') + path);
    url.searchParams.set('lang', 'ru');
    for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
    return this.limiter.schedule(() => retry(async () => {
      const res = await request(url, { method: 'GET', headers: { accept: 'application/json' } });
      if (res.statusCode >= 400) throw new Error(`MOEX HTTP ${res.statusCode}: ${url}`);
      return res.body.json();
    }, config.retryAttempts, config.retryDelayMs));
  }
}
