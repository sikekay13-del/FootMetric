import { Crest } from '@/components/Crest';
import { getTeam } from '@/data/mock';
import type { Player } from '@/types';

const POSITION_COLORS: Record<Player['position'], string> = {
  GK: 'bg-yellow-500/15 text-yellow-400',
  DF: 'bg-blue-500/15 text-blue-400',
  MF: 'bg-[#16c98d]/15 text-[#16c98d]',
  FW: 'bg-red-500/15 text-red-400',
};

export function PlayerAvatar({ player, size = 48 }: { player: Player; size?: number }) {
  const team = getTeam(player.teamId);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full border-2"
        style={{ borderColor: team.colors.primary, background: `${team.colors.primary}22` }}
      >
        <span className="font-display text-sm font-bold text-white">
          {player.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </span>
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded px-1 text-[9px] font-bold ${POSITION_COLORS[player.position]}`}
      >
        {player.position}
      </span>
    </div>
  );
}
