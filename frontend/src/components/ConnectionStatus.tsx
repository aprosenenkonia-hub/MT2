import { useEffect, useState } from 'react';
import { realtimeClient } from '../services/realtime';

export function ConnectionStatus() {
  const [online, setOnline] = useState(false);
  useEffect(() => realtimeClient.onStatus(setOnline), []);
  return <span className={online ? 'status online' : 'status offline'}>{online ? 'WS online' : 'WS offline'}</span>;
}
