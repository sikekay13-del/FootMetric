export const LEAGUES = [
  { code: 'PL', name: 'Premier League' },
  { code: 'PD', name: 'La Liga' },
  { code: 'SA', name: 'Serie A' },
  { code: 'BL1', name: 'Bundesliga' },
  { code: 'FL1', name: 'Ligue 1' },
] as const;

export const COMPETITIONS = [
  ...LEAGUES,
  { code: 'CL', name: 'Champions League' },
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

const PREFIX = 'fd:';
const memory = new Map<string, { time: number; data: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* Saved data: kept in memory and in the browser, so it survives closing the tab */
export function peek<T>(path: string): { data: T; time: number } | null {
  const hit = memory.get(path);
  if (hit) return hit as { data: T; time: number };
  try {
    const raw = localStorage.getItem(PREFIX + path);
    if (raw) {
      const saved = JSON.parse(raw) as { time: number; data: unknown };
      memory.set(path, saved);
      return saved as { data: T; time: number };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function save(path: string, entry: { time: number; data: unknown }) {
  memory.set(path, entry);
  try {
    localStorage.setItem(PREFIX + path, JSON.stringify(entry));
  } catch {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(PREFIX + path, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
}

/* Keeps us under the free plan limit and avoids too many requests at once */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const MAX_PARALLEL = 3;
const stamps: number[] = [];
let active = 0;

function acquire(background: boolean): Promise<void> {
  return new Promise((resolve) => {
    const tryRun = () => {
      const now = Date.now();
      while (stamps.length && now - stamps[0] > WINDOW_MS) stamps.shift();
      const room = background
        ? active === 0 && stamps.length < 5
        : active < MAX_PARALLEL && stamps.length < MAX_PER_WINDOW;
      if (room) {
        active++;
        stamps.push(now);
        resolve();
      } else {
        setTimeout(tryRun, 400);
      }
    };
    tryRun();
  });
}

function release() {
  active = Math.max(0, active - 1);
}

class FatalError extends Error {}

async function request<T>(path: string, background: boolean): Promise<T> {
  let lastErr = 'Request failed';
  for (let attempt = 0; attempt < 4; attempt++) {
    let wait = 0;
    await acquire(background);
    try {
      const res = await fetch('/api/fd' + path);
      if (res.ok) return (await res.json()) as T;
      if (res.status === 429) {
        lastErr = 'Too many requests. Wait a minute and try again.';
        wait = 8000;
      } else if (res.status >= 500) {
        lastErr = `The data service is having trouble (${res.status})`;
        wait = 1200 * (attempt + 1);
      } else {
        throw new FatalError(
          res.status === 403
            ? 'This data is not available on the free plan'
            : `Request failed (${res.status})`,
        );
      }
    } catch (e) {
      if (e instanceof FatalError) throw e;
      lastErr = 'Network problem. Check your connection.';
      wait = 1500 * (attempt + 1);
    } finally {
      release();
    }
    await sleep(wait);
  }
  throw new Error(lastErr);
}

export function fdGet<T>(path: string, ttlMs = 60_000, background = false): Promise<T> {
  const hit = peek<T>(path);
  if (hit && Date.now() - hit.time < ttlMs) return Promise.resolve(hit.data);

  const running = inflight.get(path);
  if (running) return running as Promise<T>;

  const p = request<T>(path, background)
    .then((data) => {
      save(path, { time: Date.now(), data });
      return data;
    })
    .finally(() => inflight.delete(path));

  inflight.set(path, p);
  return p;
}

/* Quietly loads pages ahead of time so they open instantly */
export async function prefetch(paths: string[]) {
  for (const p of paths) {
    try {
      await fdGet(p, 600_000, true);
    } catch {
      /* ignore */
    }
    await sleep(1500);
  }
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
  const codes = COMPETITIONS.map((l) => l.code).join(',');
  return `/competitions/../matches?competitions=${codes}&dateFrom=${ymd(from)}&dateTo=${ymd(to)}`.replace(
    '/competitions/..',
    '',
  );
}