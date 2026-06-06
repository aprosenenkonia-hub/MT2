import { z } from 'zod';
import { MoexAdapter } from '../adapters/moexAdapter.js';
import type { Bar, Resolution } from '../types.js';
import { sortAndDedupeBars } from '../utils/bars.js';

const resolutionSchema = z.enum(['1', '5', '15', '60', 'D', 'W', 'M']);

export class CandleService {
  constructor(private readonly moex: MoexAdapter) {}

  parseResolution(input: string): Resolution {
    return resolutionSchema.parse(input);
  }

  async getBars(args: { symbol: string; resolution: string; from: number; to: number }): Promise<{ bars: Bar[]; noData: boolean; nextTime?: number }> {
    const resolution = this.parseResolution(args.resolution);
    if (!args.symbol || !Number.isFinite(args.from) || !Number.isFinite(args.to) || args.from >= args.to) {
      return { bars: [], noData: true };
    }
    const bars = sortAndDedupeBars(await this.moex.getCandles({ symbol: args.symbol, resolution, from: args.from, to: args.to }));
    return { bars, noData: bars.length === 0 };
  }

  async getLatestBar(symbol: string, resolution: string, lookbackSeconds = 7 * 24 * 60 * 60): Promise<Bar | undefined> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - lookbackSeconds;
    const result = await this.getBars({ symbol, resolution, from, to });
    return result.bars.at(-1);
  }
}
