import 'dotenv/config';

const n = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: n(process.env.BACKEND_PORT ?? process.env.PORT, 3000),
  moexBaseUrl: process.env.MOEX_ISS_BASE_URL ?? 'https://iss.moex.com/iss',
  defaultEngine: process.env.MOEX_DEFAULT_ENGINE ?? 'stock',
  defaultMarket: process.env.MOEX_DEFAULT_MARKET ?? 'shares',
  defaultBoard: process.env.MOEX_DEFAULT_BOARD ?? 'TQBR',
  moexRequestsPerSecond: n(process.env.MOEX_REQUESTS_PER_SECOND, 3),
  retryAttempts: n(process.env.MOEX_RETRY_ATTEMPTS, 3),
  retryDelayMs: n(process.env.MOEX_RETRY_DELAY_MS, 300),
  wsPollIntervalMs: n(process.env.WS_POLL_INTERVAL_MS, 5000),
};
