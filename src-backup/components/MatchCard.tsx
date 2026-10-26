import { ChevronRight } from 'lucide-react';
import { Crest } from '@/components/Crest';
import { getTeam } from '@/data/mock';
import { useNav } from '@/nav';
import type { Match } from '@/types';

export function MatchCard({ match, compact = false }: { match: Match; compact?: boolean }) {
  const { navigate } = useNav();
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const live = match.status === 'LIVE' || match.status === 'HT';
  const finished = match.status === 'FT';
  const upcoming = match.status === 'UPCOMING';

  const statusLabel = () => {
    if (match.status === 'LIVE') return `${match.minute}'`;
    if (match.status === 'HT') return 'HT';
    if (match.status === 'FT') return 'FT';
    return match.kickoff;
  };

  return (
    <button
      onClick={() => navigate('match', { matchId: match.id })}
      className="card-hover group w-full rounded-xl border border-[#1f262e] bg-[#14181d] p-4 text-left hover:bg-[#181d23]"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {match.competition}
        </span>
        <span
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
            live
              ? 'bg-red-500/15 text-red-400'
              : finished
              ? 'bg-gray-700/40 text-gray-400'
              : 'bg-[#16c98d]/10 text-[#16c98d]'
          }`}
        >
          {live && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-dot" />}
          {statusLabel()}
        </span>
      </div>

      <div className="space-y-2.5">
        <TeamRow team={home} score={match.homeScore} showScore={!upcoming} winner={!upcoming && match.homeScore > match.awayScore} />
        <TeamRow team={away} score={match.awayScore} showScore={!upcoming} winner={!upcoming && match.awayScore > match.homeScore} />
      </div>

      {!compact && (
        <div className="mt-3 flex items-center justify-between border-t border-[#1f262e] pt-3">
          <span className="text-[11px] text-gray-500">{match.stadium}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#16c98d] opacity-0 transition-opacity group-hover:opacity-100">
            Details <ChevronRight size={12} />
          </span>
        </div>
      )}
    </button>
  );
}

function TeamRow({
  team, score, showScore, winner,
}: { team: ReturnType<typeof getTeam>; score: number; showScore: boolean; winner: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Crest team={team} size={28} />
        <span className={`truncate text-sm ${winner ? 'font-semibold text-white' : 'text-gray-300'}`}>
          {team.name}
        </span>
      </div>
      {showScore && (
        <span className={`text-lg font-bold tabular-nums ${winner ? 'text-white' : 'text-gray-400'}`}>
          {score}
        </span>
      )}
    </div>
  );
}
