import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useNav } from '@/nav';
import { LEAGUES, kickoffTime, matchState, type FdMatch } from '@/lib/footballApi';

const PRIORITY = ['CL', 'PL', 'PD', 'SA', 'BL1', 'FL1'];
const prio = (m: FdMatch) => {
  const i = PRIORITY.indexOf(m.competition.code);
  return i === -1 ? 99 : i;
};

function pickFeatured(matches: FdMatch[]): FdMatch | null {
  const live = matches.filter((m) => matchState(m) === 'live').sort((a, b) => prio(a) - prio(b));
  if (live[0]) return live[0];

  const now = Date.now();
  const upcoming = matches
    .filter((m) => matchState(m) === 'upcoming')
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const soon = upcoming.filter((m) => new Date(m.utcDate).getTime() - now < 24 * 3600_000);
  const pool = soon.length ? soon : upcoming.slice(0, 6);
  if (pool.length) {
    return [...pool].sort((a, b) => prio(a) - prio(b) || a.utcDate.localeCompare(b.utcDate))[0];
  }

  const finished = matches
    .filter((m) => matchState(m) === 'finished')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate));
  return finished[0] ?? null;
}

export function FeaturedMatch({ matches }: { matches: FdMatch[] }) {
  const { navigate } = useNav();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const m = pickFeatured(matches);
  if (!m) return null;

  const state = matchState(m);
  const leagueName = LEAGUES.find((l) => l.code === m.competition.code)?.name ?? m.competition.name;
  const go = () => navigate('match', { matchId: String(m.id), from: 'dashboard' });

  const mins = Math.max(0, Math.floor((new Date(m.utcDate).getTime() - now) / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const mm = mins % 60;
  const countdown = d > 0 ? `${d}d ${h}h ${mm}m` : `${h}h ${mm}m`;

  const Side = ({ team }: { team: FdMatch['homeTeam'] }) => (
    <div className="flex flex-col items-center gap-3 text-center">
      <img
        src={team.crest}
        alt=""
        className="h-16 w-16 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] sm:h-24 sm:w-24"
      />
      <span className="font-display text-lg font-bold text-white sm:text-2xl">
        {team.shortName || team.name}
      </span>
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter') go();
      }}
      className="fm-hero relative overflow-hidden rounded-2xl border border-[#16c98d]/25 bg-gradient-to-br from-[#16c98d]/10 via-[#14181d] to-[#0d1115] p-6 sm:p-8"
    >
      <div className="fm-hero-glow -left-24 -top-24" />
      <div className="fm-hero-glow -bottom-32 -right-24" style={{ animationDelay: '-3s' }} />

      <div className="relative">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#16c98d]">
            {state === 'live' && <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />}
            {state === 'live' ? 'Live now' : state === 'upcoming' ? 'Match of the day' : 'Latest result'}
          </span>
          <span className="text-xs text-gray-400">{leagueName}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <Side team={m.homeTeam} />
          <div className="text-center">
            {state === 'upcoming' ? (
              <>
                <div className="font-display text-4xl font-bold text-white sm:text-5xl">{kickoffTime(m)}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {new Date(m.utcDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </>
            ) : (
              <div className="font-display text-5xl font-bold text-white sm:text-6xl">
                {m.score.fullTime.home ?? 0}
                <span className="mx-2 text-gray-600">:</span>
                {m.score.fullTime.away ?? 0}
              </div>
            )}
          </div>
          <Side team={m.awayTeam} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1f262e] pt-4 text-sm">
          <span className="text-gray-400">
            {state === 'upcoming' ? `Kicks off in ${countdown}` : state === 'live' ? 'In progress' : 'Full time'}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#16c98d]">
            Match center <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </div>
  );
}