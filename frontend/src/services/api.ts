export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws';

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ''}`);
  }
  return res.json() as Promise<T>;
}
