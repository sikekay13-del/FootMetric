import { ChevronRight } from 'lucide-react';
import { Crest } from '@/components/Crest';
import { useNav } from '@/nav';
import type { Team } from '@/types';

export function TeamCard({ team }: { team: Team }) {
  const { navigate } = useNav();
  const gd = team.gf - team.ga;

  return (
    <button
      onClick={() => navigate('teams', { teamId: team.id })}
      className="card-hover group w-full rounded-xl border border-[#1f262e] bg-[#14181d] p-4 text-left hover:bg-[#181d23]"
    >
      <div className="flex items-center gap-3">
        <Crest team={team} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{team.name}</div>
          <div className="text-xs text-gray-500">{team.league}</div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-500">Pos</span>
          <span className="text-lg font-bold text-[#16c98d]">{team.position}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1 text-center">
        <Stat label="P" value={team.played} />
        <Stat label="W" value={team.won} />
        <Stat label="D" value={team.drawn} />
        <Stat label="L" value={team.lost} />
        <Stat label="GD" value={gd > 0 ? `+${gd}` : gd} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#1f262e] pt-3">
        <span className="text-sm font-bold text-white">{team.points} pts</span>
        <ChevronRight size={16} className="text-gray-600 transition-colors group-hover:text-[#16c98d]" />
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-200">{value}</div>
    </div>
  );
}

export function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = {
    W: 'bg-[#16c98d] text-[#0a0c0f]',
    D: 'bg-gray-600 text-white',
    L: 'bg-red-500/80 text-white',
  };
  return (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${colors[result]}`}>
      {result}
    </span>
  );
}
