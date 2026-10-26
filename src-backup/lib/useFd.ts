import { useEffect, useState } from 'react';
import { fdGet } from './footballApi';

export function useFd<T>(path: string | null, ttlMs = 60_000, refreshMs = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;

    const load = () => {
      fdGet<T>(path, ttlMs)
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
  }, [path, ttlMs, refreshMs]);

  return { data, loading, error, updatedAt };
}