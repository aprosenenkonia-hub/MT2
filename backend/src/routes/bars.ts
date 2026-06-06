import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CandleService } from '../services/candleService.js';

export async function barsRoutes(app: FastifyInstance, service: CandleService) {
  app.get('/api/bars', async (req, reply) => {
    const q = z.object({
      symbol: z.string(),
      resolution: z.string(),
      from: z.coerce.number(),
      to: z.coerce.number(),
    }).parse(req.query);
    return service.getBars(q);
  });

  app.get('/api/server-time', async () => ({ serverTime: Math.floor(Date.now() / 1000) }));
}
