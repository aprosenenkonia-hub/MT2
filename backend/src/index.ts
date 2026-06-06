import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config.js';
import { MoexAdapter } from './adapters/moexAdapter.js';
import { SymbolService } from './services/symbolService.js';
import { CandleService } from './services/candleService.js';
import { symbolsRoutes } from './routes/symbols.js';
import { barsRoutes } from './routes/bars.js';
import { watchlistRoutes } from './routes/watchlist.js';
import { registerWs } from './services/wsHub.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);

const moex = new MoexAdapter();
const symbolService = new SymbolService(moex);
const candleService = new CandleService(moex);

app.get('/health', async () => ({ ok: true, now: Date.now() }));
await symbolsRoutes(app, symbolService);
await barsRoutes(app, candleService);
await watchlistRoutes(app, moex, candleService);
await registerWs(app, candleService);

await app.listen({ port: config.port, host: '0.0.0.0' });
