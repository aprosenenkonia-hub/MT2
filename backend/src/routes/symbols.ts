import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SymbolService } from '../services/symbolService.js';

export async function symbolsRoutes(app: FastifyInstance, service: SymbolService) {
  app.get('/api/symbols/search', async (req, reply) => {
    const q = z.object({ query: z.string().optional().default('') }).parse(req.query);
    return service.search(q.query);
  });

  app.get('/api/symbols/:symbol', async (req, reply) => {
    const p = z.object({ symbol: z.string() }).parse(req.params);
    const resolved = await service.resolve(p.symbol);
    if (!resolved) return reply.code(404).send({ error: 'Symbol not found' });
    return resolved;
  });
}
