import { useCallback, useState } from 'react';

const store = new Map<string, unknown>();

export function useViewState<T>(
  key: string,
  initial: T | (() => T),
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() =>
    store.has(key)
      ? (store.get(key) as T)
      : typeof initial === 'function'
        ? (initial as () => T)()
        : initial,
  );

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        store.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set];
}