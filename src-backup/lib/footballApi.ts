export const LEAGUES = [
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'FL1', name: 'Ligue 1' },
] as const;

export interface StandingRow {
  position: number;
  team: { id: number; name: string; shortName: string; tla: string; crest: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsResponse {
  competition: { name: string; code: string };
  season: { currentMatchday: number; startDate: string; endDate: string };
  standings: { type: string; table: StandingRow[] }[];
}

const memory = new Map<string, { time: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export async function fdGet<T>(path: string, ttlMs = 60_000): Promise<T> {
  const hit = memory.get(path);
  if (hit && Date.now() - hit.time < ttlMs) return hit.data as T;

  try {
    const raw = sessionStorage.getItem('fd:' + path);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Date.now() - saved.time < ttlMs) {
        memory.set(path, saved);
        return saved.data as T;
      }
    }
  } catch {
    /* ignore */
  }

  const running = inflight.get(path);
  if (running) return running as Promise<T>;

  const request = fetch('/api/fd' + path)
    .then(async (res) => {
      if (res.status === 429) {
        throw new Error('Too many requests. Wait a minute and refresh.');
      }
      if (!res.ok) throw new Error('Request failed (' + res.status + ')');
      const data = await res.json();
      const entry = { time: Date.now(), data };
      memory.set(path, entry);
      try {
        sessionStorage.setItem('fd:' + path, JSON.stringify(entry));
      } catch {
        /* ignore */
      }
      return data as T;
    })
    .finally(() => inflight.delete(path));

  inflight.set(path, request);
  return request;
}
export interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  competition: { id: number; name: string; code: string; emblem: string };
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

export interface MatchesResponse {
  matches: FdMatch[];
}

export type MatchState = 'live' | 'finished' | 'upcoming' | 'other';

export function matchState(m: FdMatch): MatchState {
  if (m.status === 'IN_PLAY' || m.status === 'PAUSED' || m.status === 'LIVE') return 'live';
  if (m.status === 'FINISHED' || m.status === 'AWARDED') return 'finished';
  if (m.status === 'SCHEDULED' || m.status === 'TIMED') return 'upcoming';
  return 'other';
}

export function kickoffTime(m: FdMatch): string {
  return new Date(m.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ymd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function matchesPath(from: Date, to: Date): string {
  const codes = LEAGUES.map((l) => l.code).join(',');
  return `/matches?competitions=${codes}&dateFrom=${ymd(from)}&dateTo=${ymd(to)}`;
}