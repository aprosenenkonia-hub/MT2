import type { FastifyInstance } from 'fastify';
import { MoexAdapter } from '../adapters/moexAdapter.js';
import { CandleService } from '../services/candleService.js';

const defaultSymbols = ['MOEX:SBER', 'MOEX:GAZP', 'MOEX:LKOH', 'MOEX:ROSN', 'MOEX:VTBR', 'MOEX:GMKN', 'MOEX:YDEX'];

export async function watchlistRoutes(app: FastifyInstance, moex: MoexAdapter, candles: CandleService) {
  app.get('/api/watchlist', async () => {
    const result = [];
    for (const tvSymbol of defaultSymbols) {
      const s = await moex.resolveSymbol(tvSymbol);
      const bars = await candles.getBars({ symbol: tvSymbol, resolution: 'D', from: Math.floor(Date.now()/1000) - 14*86400, to: Math.floor(Date.now()/1000) });
      const last = bars.bars.at(-1);
      const prev = bars.bars.at(-2);
      const change = last && prev ? last.close - prev.close : 0;
      const changePercent = last && prev && prev.close ? (change / prev.close) * 100 : 0;
      result.push({
        symbol: tvSymbol,
        ticker: s?.ticker ?? tvSymbol.replace('MOEX:', ''),
        description: s?.shortName ?? tvSymbol,
        last: last?.close ?? null,
        change,
        changePercent,
        volume: last?.volume ?? null,
      });
    }
    return result;
  });
}
