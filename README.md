# MOEX Terminal MVP

GitHub-ready MVP торгового терминала для российских инструментов MOEX.

В этой версии фронтенд использует **TradingView Lightweight Charts** (`lightweight-charts`) — open-source библиотеку, которую можно установить из npm. Проприетарная TradingView Charting Library больше не нужна.

## Что внутри

- Backend: Node.js + TypeScript + Fastify
- Market data: MOEX ISS candles API
- Realtime: WebSocket polling latest candle from backend to frontend
- Frontend: React + TypeScript + Vite
- Charts: `lightweight-charts`
- Watchlist: базовая таблица инструментов
- Docker Compose: PostgreSQL заготовка под дальнейший кэш свечей

## Архитектура

```text
React/Vite frontend
  ├─ Watchlist REST /api/watchlist
  ├─ Symbol search REST /api/symbols/search
  └─ Lightweight Charts
       ├─ History REST /api/bars
       └─ Updates WS /ws

Fastify backend
  ├─ routes: symbols, bars, watchlist
  ├─ wsHub: subscribeBars/unsubscribeBars
  ├─ candleService: noData, latest bar, sorting/dedupe
  └─ moexAdapter
       ├─ symbols load
       ├─ candles pagination
       ├─ MOEX board/engine/market mapping
       ├─ TTL cache
       ├─ rate limiter
       └─ retry policy
```

## Быстрый запуск

```bash
cp .env.example .env
npm install
npm run dev
```

Открой frontend: `http://localhost:5173`

Backend по умолчанию: `http://localhost:3000`

## Отдельный запуск

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Основные endpoints

```text
GET /api/symbols/search?query=SBER
GET /api/symbols/MOEX:SBER
GET /api/bars?symbol=MOEX:SBER&resolution=60&from=1717000000&to=1719600000
GET /api/watchlist
GET /api/server-time
WS  /ws
```

## WebSocket protocol

Subscribe:

```json
{ "type": "subscribeBars", "subscriberUID": "uid", "symbol": "MOEX:SBER", "resolution": "60" }
```

Update:

```json
{ "type": "bar", "key": "MOEX:SBER|60|uid", "bar": { "time": 1719507600000, "open": 1, "high": 1, "low": 1, "close": 1, "volume": 1 } }
```

## Поддерживаемые таймфреймы

`1`, `5`, `15`, `60`, `D`, `W`, `M`

## Важные детали MVP

- `time` у свечей в миллисекундах.
- Backend сортирует и дедуплицирует свечи.
- WebSocket не отправляет свечу старее последней отправленной по подписке.
- Same-time candle может обновляться, новая candle добавляется.
- `noData` корректно возвращается из `/api/bars`.
- MOEX timestamp нормализуется как Moscow time `+03:00`.

## Ограничения MVP

- Реального streaming market data от MOEX здесь нет: near-real-time сделан polling последней свечи.
- PostgreSQL включён как заготовка; текущий быстрый кэш — in-memory TTL.
- Нет заявок, брокерской авторизации, портфеля, стакана и риск-модуля.
- Торговые сессии заданы базово для TQBR; для production нужно использовать календарь/режимы торгов MOEX.

## Следующие улучшения

- ClickHouse/PostgreSQL persistent candle cache.
- Инкрементальная догрузка истории при прокрутке графика влево.
- Стакан и сделки, если подключен подходящий источник данных.
- Пользователи, брокерская авторизация, портфель, заявки.
- Тесты адаптера MOEX и контрактные тесты REST/WS.
