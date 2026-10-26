import { useEffect, useRef, useState, type RefObject } from 'react';
import { Search, Bell, User, Menu, X, RefreshCw, LogIn } from 'lucide-react';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import {
  fdGet,
  LEAGUES,
  addDays,
  kickoffTime,
  matchesPath,
  matchState,
  type FdTeam,
  type MatchesResponse,
  type StandingsResponse,
} from '@/lib/footballApi';
import type { PageId } from '@/types';

/* ---------- helpers ---------- */

function useClickOutside(ref: RefObject<HTMLElement>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------- search ---------- */

interface Hit {
  key: string;
  kind: string;
  title: string;
  sub: string;
  crest?: string;
  go: () => void;
}
interface TeamEntry { team: FdTeam; league: string }
interface PlayerEntry { id: number; name: string; team: FdTeam; goals: number; league: string }
interface ScorersResponse {
  scorers: { player: { id: number; name: string }; team: FdTeam; goals: number | null }[];
}

const PAGES: { id: PageId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'live', label: 'Live Scores' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'table', label: 'League Table' },
  { id: 'teams', label: 'Teams' },
  { id: 'players', label: 'Players' },
];

// Waits between real network calls so we stay under the free plan limit
async function timed<T>(path: string): Promise<T | null> {
  const start = Date.now();
  try {
    return await fdGet<T>(path, 600_000);
  } catch {
    return null;
  } finally {
    if (Date.now() - start > 300) await sleep(6500);
  }
}

function SearchBox() {
  const { navigate } = useNav();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<TeamEntry[]>([]);
  const [players, setPlayers] = useState<PlayerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  useClickOutside(box, () => setOpen(false));

  useEffect(() => {
    if (!open || loaded.current) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const t: TeamEntry[] = [];
      const p: PlayerEntry[] = [];

      for (const l of LEAGUES) {
        if (cancelled) return;
        const d = await timed<StandingsResponse>(`/competitions/${l.code}/standings`);
        const rows = d?.standings.find((s) => s.type === 'TOTAL')?.table ?? [];
        rows.forEach((r) => t.push({ team: r.team, league: l.code }));
        setTeams([...t]);
      }
      for (const l of LEAGUES) {
        if (cancelled) return;
        const d = await timed<ScorersResponse>(`/competitions/${l.code}/scorers?limit=30`);
        (d?.scorers ?? []).forEach((s) =>
          p.push({ id: s.player.id, name: s.player.name, team: s.team, goals: s.goals ?? 0, league: l.code }),
        );
        setPlayers([...p]);
      }
      loaded.current = true;
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const leagueName = (c: string) => LEAGUES.find((l) => l.code === c)?.name ?? c;
  const q = norm(query.trim());
  const results: Hit[] = [];

  if (q) {
    PAGES.filter((p) => norm(p.label).includes(q)).forEach((p) =>
      results.push({ key: 'page-' + p.id, kind: 'page', title: p.label, sub: 'Open page', go: () => navigate(p.id) }),
    );
    LEAGUES.filter((l) => norm(l.name).includes(q)).forEach((l) =>
      results.push({
        key: 'league-' + l.code,
        kind: 'league',
        title: l.name,
        sub: 'Open league table',
        go: () => navigate('table', { league: l.code }),
      }),
    );
    teams
      .filter((t) => norm(`${t.team.name} ${t.team.shortName}`).includes(q))
      .forEach((t) =>
        results.push({
          key: 'team-' + t.team.id,
          kind: 'team',
          title: t.team.shortName || t.team.name,
          sub: leagueName(t.league),
          crest: t.team.crest,
          go: () => navigate('teams', { teamId: String(t.team.id), league: t.league }),
        }),
      );
    players
      .filter((p) => norm(p.name).includes(q))
      .forEach((p) =>
        results.push({
          key: 'player-' + p.id,
          kind: 'player',
          title: p.name,
          sub: `${p.team.shortName} - ${p.goals} goals`,
          crest: p.team.crest,
                    go: () => navigate('player', { playerId: String(p.id), league: p.league }),
        }),
      );
    results.sort((a, b) => Number(norm(b.title).startsWith(q)) - Number(norm(a.title).startsWith(q)));
  }
  const shown = results.slice(0, 8);

  const select = (h: Hit) => {
    h.go();
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={box} className="relative">
      {open ? (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter' && shown[0]) select(shown[0]);
            }}
            placeholder="Search teams, players..."
            className="w-44 rounded-lg border border-[#1f262e] bg-[#14181d] py-2 pl-9 pr-8 text-sm text-white placeholder-gray-500 outline-none focus:border-[#16c98d]/50 sm:w-72"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      )}

      {open && q && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d] shadow-xl">
          {shown.length > 0 ? (
            <ul className="divide-y divide-[#1f262e]">
              {shown.map((h) => (
                <li key={h.key}>
                  <button
                    onClick={() => select(h)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    {h.crest ? (
                      <img src={h.crest} alt="" className="h-6 w-6 object-contain" />
                    ) : (
                      <div className="h-6 w-6" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{h.title}</div>
                      <div className="truncate text-xs text-gray-500">{h.sub}</div>
                    </div>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-gray-400">
                      {h.kind}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500">
              {loading ? 'No match yet, still loading teams and players...' : 'No results found'}
            </div>
          )}
          {loading && shown.length > 0 && (
            <div className="border-t border-[#1f262e] px-3 py-2 text-[11px] text-gray-500">
              Still loading more teams and players...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- notifications ---------- */

interface Note {
  id: string;
  order: number;
  title: string;
  text: string;
}

function NotificationBell() {
  const { navigate } = useNav();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  // Same request as Dashboard and Live Scores, so it adds no extra calls
  const { data } = useFd<MatchesResponse>(
    matchesPath(addDays(start, -3), addDays(start, 3)),
    55_000,
    60_000,
  );

  const nowMs = Date.now();
  const notes: Note[] = (data?.matches ?? [])
    .flatMap((m): Note[] => {
      const state = matchState(m);
      const t = new Date(m.utcDate).getTime();
      const home = m.homeTeam.shortName || m.homeTeam.name;
      const away = m.awayTeam.shortName || m.awayTeam.name;
      const score = `${home} ${m.score.fullTime.home ?? 0} - ${m.score.fullTime.away ?? 0} ${away}`;
      if (state === 'live') {
        return [{ id: `live-${m.id}-${score}`, order: 0, title: 'Live now', text: score }];
      }
      if (state === 'upcoming' && t > nowMs && t - nowMs <= 3 * 3600_000) {
        return [{ id: `soon-${m.id}`, order: 1, title: `Kicks off at ${kickoffTime(m)}`, text: `${home} vs ${away}` }];
      }
      if (state === 'finished' && nowMs - t <= 8 * 3600_000) {
        return [{ id: `ft-${m.id}`, order: 2, title: 'Full time', text: score }];
      }
      return [];
    })
    .sort((a, b) => a.order - b.order)
    .slice(0, 10);

  const unseen = notes.filter((n) => !seen.has(n.id)).length;

  const toggle = () => {
    if (!open) setSeen(new Set(notes.map((n) => n.id)));
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unseen > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#16c98d]" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d] shadow-xl">
          <div className="border-b border-[#1f262e] px-3 py-2.5 text-sm font-semibold text-white">
            Notifications
          </div>
          {notes.length > 0 ? (
            <ul className="divide-y divide-[#1f262e]">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      navigate('live');
                      setOpen(false);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-white/5"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#16c98d]">
                      {n.title}
                    </div>
                    <div className="text-sm text-white">{n.text}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-5 text-sm text-gray-500">
              Nothing new right now. Live matches, kickoffs and final scores will show up here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- profile ---------- */

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const refreshData = () => {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('fd:'))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Profile"
      >
        <User size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d] shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#1f262e] px-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16c98d]/15 text-[#16c98d]">
              <User size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Football Fan</div>
              <div className="text-xs text-gray-500">Guest</div>
            </div>
          </div>
          <button
            onClick={refreshData}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5"
          >
            <RefreshCw size={16} className="text-gray-500" /> Refresh data
          </button>
          <div className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-600">
            <LogIn size={16} /> Sign in
            <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase">Soon</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- top bar ---------- */

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { navigate } = useNav();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#1f262e] bg-[#0a0c0f]/90 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenuClick}
        className="text-gray-400 hover:text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="hidden items-center text-sm text-gray-500 sm:flex">
        <button onClick={() => navigate('dashboard')} className="hover:text-white">
          Home
        </button>
      </div>

      <div className="flex-1" />

      <SearchBox />
      <NotificationBell />
      <ProfileMenu />
    </header>
  );
}