import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { Crest } from '@/components/Crest';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { PageHeader, EmptyState } from '@/components/UI';
import { players, getTeam } from '@/data/mock';
import type { Player } from '@/types';

type SortKey = 'scorers' | 'assists' | 'appearances' | 'goalkeepers';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'scorers', label: 'Top Scorers' },
  { id: 'assists', label: 'Top Assists' },
  { id: 'appearances', label: 'Most Appearances' },
  { id: 'goalkeepers', label: 'Goalkeepers' },
];

export function PlayersPage() {
  const [sort, setSort] = useState<SortKey>('scorers');
  const [query, setQuery] = useState('');

  const filtered: Player[] = (() => {
    let list = [...players];
    if (sort === 'goalkeepers') {
      list = list.filter((p) => p.position === 'GK');
    } else if (sort === 'scorers') {
      list = list.filter((p) => p.position !== 'GK').sort((a, b) => b.goals - a.goals);
    } else if (sort === 'assists') {
      list = list.filter((p) => p.position !== 'GK').sort((a, b) => b.assists - a.assists);
    } else if (sort === 'appearances') {
      list = list.sort((a, b) => b.appearances - a.appearances);
    }
    if (query) {
      list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    }
    return list;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Player Statistics"
        subtitle="Top performers across the Premier League"
        icon={<Users size={22} />}
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                sort === s.id
                  ? 'bg-[#16c98d] text-[#0a0c0f]'
                  : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full rounded-lg border border-[#1f262e] bg-[#14181d] py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#16c98d]/50"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d]">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f262e] text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 text-center font-semibold">Pos</th>
                  <th className="px-3 py-3 text-center font-semibold">Apps</th>
                  <th className="px-3 py-3 text-center font-semibold">Goals</th>
                  <th className="px-3 py-3 text-center font-semibold">Assists</th>
                  <th className="px-3 py-3 text-center font-semibold">Yellow</th>
                  <th className="px-3 py-3 text-center font-semibold">Red</th>
                  <th className="px-4 py-3 text-center font-semibold">Mins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f262e]">
                {filtered.map((p, i) => {
                  const team = getTeam(p.teamId);
                  return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <PlayerAvatar player={p} size={36} />
                          <div>
                            <div className="font-medium text-white">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.nationality} · {p.age}y</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Crest team={team} size={20} />
                          <span className="text-gray-300">{team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-300">{p.position}</span>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-300">{p.appearances}</td>
                      <td className="px-3 py-3 text-center font-bold text-[#16c98d]">{p.goals}</td>
                      <td className="px-3 py-3 text-center text-gray-300">{p.assists}</td>
                      <td className="px-3 py-3 text-center text-yellow-400">{p.yellow}</td>
                      <td className="px-3 py-3 text-center text-red-400">{p.red}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{p.minutes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-[#1f262e] md:hidden">
            {filtered.map((p) => {
              const team = getTeam(p.teamId);
              return (
                <div key={p.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar player={p} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-white">{p.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Crest team={team} size={14} /> {team.shortName} · {p.position}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div><div className="font-bold text-white">{p.appearances}</div><div className="text-[10px] text-gray-500">Apps</div></div>
                    <div><div className="font-bold text-[#16c98d]">{p.goals}</div><div className="text-[10px] text-gray-500">Goals</div></div>
                    <div><div className="font-bold text-gray-200">{p.assists}</div><div className="text-[10px] text-gray-500">Assists</div></div>
                    <div><div className="font-bold text-gray-200">{p.minutes}</div><div className="text-[10px] text-gray-500">Mins</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState message="No players found" />
      )}
    </div>
  );
}
