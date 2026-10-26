import { useCallback, useEffect, useRef, useState } from 'react';
import { fdGet } from './footballApi';

export function useFd<T>(path: string | null, ttlMs = 60_000, refreshMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const force = useRef(false);

  const reload = useCallback(() => {
    force.current = true;
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    const load = () => {
      const ttl = force.current ? 0 : ttlMs;
      force.current = false;
      fdGet<T>(path, ttl)
        .then((d) => {
          if (cancelled) return;
          setData(d);
          setError(null);
          setUpdatedAt(new Date());
        })
        .catch((e: Error) => !cancelled && setError(e.message))
        .finally(() => !cancelled && setLoading(false));
    };

    setLoading(true);
    load();
    const timer = refreshMs ? setInterval(load, refreshMs) : undefined;
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [path, ttlMs, refreshMs, tick]);

  return { data, loading, error, updatedAt, reload };
}