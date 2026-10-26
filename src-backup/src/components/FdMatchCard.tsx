import { LEAGUES, kickoffTime, matchState, type FdMatch } from '@/lib/footballApi';

export function FdMatchCard({ match: m }: { match: FdMatch }) {
  const state = matchState(m);
  const leagueName =
    LEAGUES.find((l) => l.code === m.competition.code)?.name ?? m.competition.name;
  const showScore = state === 'live' || state === 'finished';
  const score = (n: number | null) => (n === null || n === undefined ? '-' : n);

  const badge =
    state === 'live'
      ? 'LIVE'
      : state === 'finished'
        ? 'FT'
        : state === 'upcoming'
          ? kickoffTime(m)
          : m.status.replace('_', ' ');

  const badgeStyle =
    state === 'live'
      ? 'bg-red-500/15 text-red-400'
      : state === 'finished'
        ? 'bg-gray-700/40 text-gray-400'
        : state === 'upcoming'
          ? 'bg-[#16c98d]/10 text-[#16c98d]'
          : 'bg-orange-500/15 text-orange-400';

  const Row = ({ team, goals }: { team: FdMatch['homeTeam']; goals: number | null }) => (
    <div className="flex items-center gap-3">
      <img src={team.crest} alt="" className="h-7 w-7 object-contain" />
      <span className="flex-1 truncate font-medium text-white">{team.shortName || team.name}</span>
      {showScore && (
        <span className="font-display text-xl font-bold text-white">{score(goals)}</span>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 transition-colors hover:border-[#16c98d]/30">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-gray-500">{leagueName}</span>
        <span className={`flex items-center gap-1 rounded px-2 py-0.5 font-bold ${badgeStyle}`}>
          {state === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />}
          {badge}
        </span>
      </div>
      <div className="space-y-3">
        <Row team={m.homeTeam} goals={m.score.fullTime.home} />
        <Row team={m.awayTeam} goals={m.score.fullTime.away} />
      </div>
    </div>
  );
}