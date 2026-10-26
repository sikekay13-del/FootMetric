import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import {
  addDays,
  kickoffTime,
  matchesPath,
  matchState,
  type FdMatch,
  type MatchesResponse,
} from '@/lib/footballApi';

const rank = (m: FdMatch) => {
  const s = matchState(m);
  return s === 'live' ? 0 : s === 'upcoming' ? 1 : 2;
};

export function Ticker() {
  const { nav, navigate } = useNav();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data } = useFd<MatchesResponse>(
    matchesPath(addDays(start, -3), addDays(start, 3)),
    55_000,
    60_000,
  );

  const now = Date.now();
  const window30h = 30 * 3600_000;
  const items = (data?.matches ?? [])
    .filter((m) => {
      const s = matchState(m);
      const t = new Date(m.utcDate).getTime();
      if (s === 'live') return true;
      if (s === 'finished') return now - t < window30h;
      if (s === 'upcoming') return t - now < window30h;
      return false;
    })
    .sort((a, b) => rank(a) - rank(b) || a.utcDate.localeCompare(b.utcDate))
    .slice(0, 20);

  if (items.length === 0) return null;

  const row = items.map((m) => {
    const s = matchState(m);
    return (
      <button
        key={m.id}
        onClick={() => navigate('match', { matchId: String(m.id), from: nav.page })}
        className="flex shrink-0 items-center gap-2 border-r border-[#1f262e] px-5 text-xs text-gray-300 hover:text-white"
      >
        {s === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />}
        <img src={m.homeTeam.crest} alt="" className="h-4 w-4 object-contain" />
        <span className="font-semibold">{m.homeTeam.tla}</span>
        <span className={`font-display text-sm font-bold ${s === 'live' ? 'text-red-300' : 'text-white'}`}>
          {s === 'upcoming'
            ? kickoffTime(m)
            : `${m.score.fullTime.home ?? 0} - ${m.score.fullTime.away ?? 0}`}
        </span>
        <span className="font-semibold">{m.awayTeam.tla}</span>
        <img src={m.awayTeam.crest} alt="" className="h-4 w-4 object-contain" />
      </button>
    );
  });

  return (
    <div className="fm-ticker border-b border-[#1f262e] bg-[#0d1115]/80 backdrop-blur">
      <div
        className="fm-ticker-track"
        style={{ animationDuration: `${Math.max(30, items.length * 5)}s` }}
      >
        <div className="flex">{row}</div>
        <div className="flex" aria-hidden="true">{row}</div>
      </div>
    </div>
  );
}