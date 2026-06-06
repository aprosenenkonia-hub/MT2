CREATE TABLE IF NOT EXISTS symbols (
  id BIGSERIAL PRIMARY KEY,
  tv_symbol TEXT UNIQUE NOT NULL,
  ticker TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  engine TEXT NOT NULL,
  market TEXT NOT NULL,
  board TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stock',
  lot_size NUMERIC,
  minmov INTEGER DEFAULT 1,
  pricescale INTEGER DEFAULT 100,
  currency_code TEXT DEFAULT 'RUB',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candles (
  symbol TEXT NOT NULL,
  resolution TEXT NOT NULL,
  time_ms BIGINT NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(symbol, resolution, time_ms)
);
