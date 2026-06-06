import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ColorType,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts';
import { getBars } from '../services/marketData';
import { realtimeClient } from '../services/realtime';
import type { Bar, Resolution } from '../types/market';

const RESOLUTIONS: Resolution[] = ['1', '5', '15', '60', 'D', 'W', 'M'];

function toLwTime(ms: number): UTCTimestamp {
  return Math.floor(ms / 1000) as UTCTimestamp;
}

function toCandle(bar: Bar): CandlestickData {
  return { time: toLwTime(bar.time), open: bar.open, high: bar.high, low: bar.low, close: bar.close };
}

function toVolume(bar: Bar): HistogramData {
  return { time: toLwTime(bar.time), value: bar.volume, color: bar.close >= bar.open ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)' };
}

function defaultFrom(resolution: Resolution): number {
  const now = Math.floor(Date.now() / 1000);
  if (resolution === 'D') return now - 3600 * 24 * 365;
  if (resolution === 'W' || resolution === 'M') return now - 3600 * 24 * 365 * 5;
  return now - 3600 * 24 * 30;
}

export function Chart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [resolution, setResolution] = useState<Resolution>('60');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const subUid = useMemo(() => `lw-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#0f131a' }, textColor: '#d6d9df' },
      grid: { vertLines: { color: '#202938' }, horzLines: { color: '#202938' } },
      rightPriceScale: { borderColor: '#2b3341' },
      timeScale: { borderColor: '#2b3341', timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    });
    const candles = chart.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    const volume = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '' });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    chartRef.current = chart;
    candleSeriesRef.current = candles;
    volumeSeriesRef.current = volume;
    return () => { chart.remove(); chartRef.current = null; candleSeriesRef.current = null; volumeSeriesRef.current = null; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const to = Math.floor(Date.now() / 1000);
    const from = defaultFrom(resolution);
    setLoading(true);
    setError(null);
    realtimeClient.unsubscribe(subUid);

    getBars({ symbol, resolution, from, to }, controller.signal)
      .then((bars) => {
        candleSeriesRef.current?.setData(bars.map(toCandle));
        volumeSeriesRef.current?.setData(bars.map(toVolume));
        chartRef.current?.timeScale().fitContent();
        realtimeClient.subscribe(subUid, symbol, resolution, (bar) => {
          candleSeriesRef.current?.update(toCandle(bar));
          volumeSeriesRef.current?.update(toVolume(bar));
        });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Ошибка загрузки свечей');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => { controller.abort(); realtimeClient.unsubscribe(subUid); };
  }, [symbol, resolution, subUid]);

  return <section className="chart-panel">
    <div className="chart-toolbar">
      <div>
        <strong>{symbol}</strong>
        {loading && <span className="muted">Загрузка...</span>}
      </div>
      <div className="resolution-buttons">
        {RESOLUTIONS.map(r => <button key={r} className={r === resolution ? 'active' : ''} onClick={() => setResolution(r)}>{r}</button>)}
      </div>
    </div>
    {error && <div className="chart-error">{error}</div>}
    <div className="chart" ref={containerRef} />
  </section>;
}
