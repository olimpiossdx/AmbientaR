'use client';

import * as React from 'react';
import { countColetaPending } from './offline-write';
import { useOfflineOptional } from '@/lib/offline/hooks';

export function useColetaPendingCount(): number {
  const offline = useOfflineOptional();
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback(async () => {
    const n = await countColetaPending();
    setCount(n);
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh, offline?.isOnline, offline?.pendingOutbox]);

  React.useEffect(() => {
    const onOnline = () => void refresh();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  return count + (offline?.pendingOutbox ?? 0);
}
