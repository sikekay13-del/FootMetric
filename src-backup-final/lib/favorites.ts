import { useCallback, useEffect, useState } from 'react';

export interface FavTeam {
  id: number;
  name: string;
  crest: string;
  league: string;
}

const KEY = 'fd-favorites';

function read(): FavTeam[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavTeam[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState<FavTeam[]>(read);

  useEffect(() => {
    const handler = () => setFavs(read());
    window.addEventListener('fd-favs', handler);
    return () => window.removeEventListener('fd-favs', handler);
  }, []);

  const toggle = useCallback((t: FavTeam) => {
    const cur = read();
    const next = cur.some((x) => x.id === t.id) ? cur.filter((x) => x.id !== t.id) : [...cur, t];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('fd-favs'));
  }, []);

  const isFav = useCallback((id: number) => favs.some((x) => x.id === id), [favs]);

  return { favs, toggle, isFav };
}