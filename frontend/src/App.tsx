import { useState } from 'react';
import { Chart } from './components/Chart';
import { Watchlist } from './components/Watchlist';
import { ConnectionStatus } from './components/ConnectionStatus';
import './styles.css';

export default function App() {
  const [symbol, setSymbol] = useState('MOEX:SBER');
  return <div className="app">
    <header><div className="brand">MOEX Terminal MVP</div><div>{symbol}</div><ConnectionStatus /></header>
    <main><Watchlist selected={symbol} onSelect={setSymbol} /><Chart symbol={symbol} /></main>
  </div>;
}
