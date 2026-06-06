import { useEffect, useState } from 'react';
import { getWatchlist, searchSymbols } from '../services/marketData';
import type { WatchItem } from '../types/market';

export function Watchlist({ selected, onSelect }: { selected: string; onSelect: (symbol: string) => void }) {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWatchlist().then(setItems).catch(e => setError(e.message));
  }, []);

  async function onSearch(q: string) {
    setQuery(q);
    setError(null);
    try {
      if (!q.trim()) return setItems(await getWatchlist());
      const found = await searchSymbols(q);
      setItems(found.map(s => ({ symbol: s.full_name, ticker: s.ticker ?? s.symbol, description: s.description, last: null, change: 0, changePercent: 0, volume: null })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка поиска');
    }
  }

  return <aside className="watchlist">
    <div className="watch-title">MOEX Watchlist</div>
    <input value={query} onChange={e => onSearch(e.target.value)} placeholder="Поиск: SBER, GAZP..." />
    {error && <div className="error">{error}</div>}
    <table>
      <thead><tr><th>Тикер</th><th>Last</th><th>%</th></tr></thead>
      <tbody>
        {items.map(item => <tr key={item.symbol} className={selected === item.symbol ? 'active' : ''} onClick={() => onSelect(item.symbol)}>
          <td><b>{item.ticker}</b><small>{item.description}</small></td>
          <td>{item.last == null ? '—' : item.last.toFixed(2)}</td>
          <td className={item.changePercent >= 0 ? 'pos' : 'neg'}>{item.last == null ? '—' : item.changePercent.toFixed(2)}</td>
        </tr>)}
      </tbody>
    </table>
  </aside>;
}
