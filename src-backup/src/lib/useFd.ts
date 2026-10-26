import { useCallback, useEffect, useRef, useState } from 'react';
import { fdGet, peek } from './footballApi';

export function useFd<T>(path: string | null, ttlMs = 60_000, refreshMs = 0) {
  const [data, setData] = useState<T | null>(() => (path ? (peek<T>(path)?.data ?? null) : null));
  const [loading, setLoading] = useState(() => (path ? !peek<T>(path) : true));
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(() => {
    const p = path ? peek<T>(path) : null;
    return p ? new Date(p.time) : null;
  });
  const [tick, setTick] = useState(0);
  const force = useRef(false);
  const hasData = useRef(data !== null);

  const reload = useCallback(() => {
    force.current = true;
    setError(null);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    const cached = peek<T>(path);
    if (cached) {
      setData(cached.data);
      setUpdatedAt(new Date(cached.time));
      setLoading(false);
      hasData.current = true;
    } else {
      setData(null);
      setLoading(true);
      hasData.current = false;
    }
    setError(null);

    const load = () => {
      const ttl = force.current ? 0 : ttlMs;
      force.current = false;
      fdGet<T>(path, ttl)
        .then((d) => {
          if (cancelled) return;
          setData(d);
          hasData.current = true;
          setError(null);
          setUpdatedAt(new Date(peek<T>(path)?.time ?? Date.now()));
        })
        .catch((e: Error) => {
          if (!cancelled && !hasData.current) setError(e.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const timer = refreshMs ? setInterval(load, refreshMs) : undefined;
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [path, ttlMs, refreshMs, tick]);

  return { data, loading, error, updatedAt, reload };
}