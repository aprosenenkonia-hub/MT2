import { WS_URL } from './api';
import type { Bar, Resolution } from '../types/market';

type RealtimeCallback = (bar: Bar) => void;
type Sub = { symbol: string; resolution: Resolution; cb: RealtimeCallback; lastTime?: number };

export class RealtimeBarsClient {
  private ws?: WebSocket;
  private subs = new Map<string, Sub>();
  private connected = false;
  private listeners = new Set<(connected: boolean) => void>();
  private reconnectTimer?: number;

  onStatus(listener: (connected: boolean) => void) {
    this.listeners.add(listener);
    listener(this.connected);
    return () => this.listeners.delete(listener);
  }

  subscribe(uid: string, symbol: string, resolution: Resolution, cb: RealtimeCallback) {
    this.subs.set(uid, { symbol, resolution, cb });
    this.ensureSocket();
    this.send({ type: 'subscribeBars', subscriberUID: uid, symbol, resolution });
  }

  unsubscribe(uid: string) {
    this.subs.delete(uid);
    this.send({ type: 'unsubscribeBars', subscriberUID: uid });
  }

  close() {
    this.subs.clear();
    this.ws?.close();
  }

  private ensureSocket() {
    if (this.ws && [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.ws.readyState)) return;
    window.clearTimeout(this.reconnectTimer);
    this.ws = new WebSocket(WS_URL);
    this.ws.onopen = () => {
      this.connected = true;
      this.emit();
      for (const [uid, s] of this.subs) this.send({ type: 'subscribeBars', subscriberUID: uid, symbol: s.symbol, resolution: s.resolution });
    };
    this.ws.onclose = () => {
      this.connected = false;
      this.emit();
      if (this.subs.size) this.reconnectTimer = window.setTimeout(() => this.ensureSocket(), 1500);
    };
    this.ws.onerror = () => {
      this.connected = false;
      this.emit();
    };
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type !== 'bar') return;
      const uid = String(msg.key).split('|').at(-1) ?? '';
      const sub = this.subs.get(uid);
      if (!sub) return;
      const bar = msg.bar as Bar;
      // Same candle may update, newer candle may append. Never accept older bars.
      if (typeof sub.lastTime === 'number' && bar.time < sub.lastTime) return;
      sub.lastTime = bar.time;
      sub.cb(bar);
    };
  }

  private send(payload: unknown) {
    this.ensureSocket();
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
    else window.setTimeout(() => this.send(payload), 250);
  }

  private emit() {
    for (const l of this.listeners) l(this.connected);
  }
}

export const realtimeClient = new RealtimeBarsClient();
