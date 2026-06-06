import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { CandleService } from './candleService.js';
import type { Bar } from '../types.js';

type Client = Parameters<NonNullable<FastifyInstance['websocketServer']['on']>>[1];

type Sub = { symbol: string; resolution: string; lastBar?: Bar };

function send(socket: any, payload: unknown) {
  if (socket.readyState === 1) socket.send(JSON.stringify(payload));
}

export async function registerWs(app: FastifyInstance, candles: CandleService) {
  const subscriptions = new Map<any, Map<string, Sub>>();

  app.get('/ws', { websocket: true }, (socket: any) => {
    subscriptions.set(socket, new Map());
    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'subscribeBars') {
          const key = `${msg.symbol}|${msg.resolution}|${msg.subscriberUID}`;
          subscriptions.get(socket)?.set(key, { symbol: msg.symbol, resolution: msg.resolution });
          send(socket, { type: 'subscribed', key });
        }
        if (msg.type === 'unsubscribeBars') {
          for (const [key] of subscriptions.get(socket) ?? []) {
            if (key.endsWith(`|${msg.subscriberUID}`)) subscriptions.get(socket)?.delete(key);
          }
        }
      } catch (error) {
        send(socket, { type: 'error', message: error instanceof Error ? error.message : 'Invalid WS message' });
      }
    });
    socket.on('close', () => subscriptions.delete(socket));
  });

  setInterval(async () => {
    for (const [socket, subs] of subscriptions) {
      for (const [key, sub] of subs) {
        try {
          const bar = await candles.getLatestBar(sub.symbol, sub.resolution);
          if (!bar) continue;
          // TradingView requires monotonic time. Same candle may update, newer candle may append.
          // Never send an older candle through subscribeBars.
          if (sub.lastBar && bar.time < sub.lastBar.time) continue;
          if (sub.lastBar && bar.time === sub.lastBar.time && JSON.stringify(bar) === JSON.stringify(sub.lastBar)) continue;
          sub.lastBar = bar;
          send(socket, { type: 'bar', key, symbol: sub.symbol, resolution: sub.resolution, bar });
        } catch (error) {
          send(socket, { type: 'error', key, message: error instanceof Error ? error.message : 'Polling failed' });
        }
      }
    }
  }, config.wsPollIntervalMs).unref();
}
