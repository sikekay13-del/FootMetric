import { BarChart } from '@/components/BarChart'; 
import { RowsSkeleton, ErrorBox } from '@/components/Status';
import { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/UI';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import { COMPETITIONS, type FdTeam } from '@/lib/footballApi';

interface ScorersResponse {
  scorers: {
    player: {
      id: number;
      name: string;
      nationality?: string | null;
      position?: string | null;
    };
    team: FdTeam;
    playedMatches: number | null;
    goals: number | null;
    assists?: number | null;
  }[];
}

export function PlayersPage() {
  const { nav, navigate } = useNav();
  const [code, setCode] = useState<string>(
    COMPETITIONS.some((c) => c.code === nav.league) ? nav.league! : 'PL',
  );
  const [query, setQuery] = useState('');

  const { data, loading, error, updatedAt, reload } = useFd<ScorersResponse>(
    `/competitions/${code}/scorers?limit=30`,
    600_000,
  );

  const rows = (data?.scorers ?? []).filter((s) =>
    s.player.name.toLowerCase().includes(query.toLowerCase()),
  );
  const compName = COMPETITIONS.find((c) => c.code === code)?.name ?? '';

  const open = (id: number) =>
    navigate('player', { playerId: String(id), league: code, from: 'players' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Top Scorers"
        subtitle={`${compName} top scorers`}
        icon={<Users size={22} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {COMPETITIONS.map((c) => (
            <button
              key={c.code}
              onClick={() => setCode(c.code)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                code === c.code
                  ? 'bg-[#16c98d] text-[#0a0c0f]'
                  : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
              }`}
            >
              {c.name}
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

      {updatedAt && (
        <p className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString()}</p>
      )}
      {loading && !data && !error && <RowsSkeleton rows={10} />}
      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {data && !query && data.scorers.length > 0 && (
        <BarChart
          title={`Goals - top 8 (${compName})`}
          data={data.scorers.slice(0, 8).map((s) => ({
            label: s.player.name,
            value: s.goals ?? 0,
            crest: s.team.crest,
          }))}
        />
      )}
      {data && rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d]">
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f262e] text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Player</th>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 text-center font-semibold">Played</th>
                  <th className="px-3 py-3 text-center font-semibold">Goals</th>
                  <th className="px-4 py-3 text-center font-semibold">Assists</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f262e]">
                {rows.map((s, i) => (
                  <tr
                    key={s.player.id}
                    onClick={() => open(s.player.id)}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.player.name}</div>
                      <div className="text-xs text-gray-500">
                        {[s.player.nationality, s.player.position].filter(Boolean).join(' - ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={s.team.crest} alt="" className="h-5 w-5 object-contain" />
                        <span className="text-gray-300">{s.team.shortName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-300">{s.playedMatches ?? '-'}</td>
                    <td className="px-3 py-3 text-center font-bold text-[#16c98d]">{s.goals ?? 0}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{s.assists ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-[#1f262e] md:hidden">
            {rows.map((s, i) => (
              <div
                key={s.player.id}
                onClick={() => open(s.player.id)}
                className="flex cursor-pointer items-center gap-3 p-4 hover:bg-white/5"
              >
                <span className="w-5 text-center text-sm font-bold text-gray-500">{i + 1}</span>
                <img src={s.team.crest} alt="" className="h-8 w-8 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{s.player.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.team.shortName} - {s.playedMatches ?? '-'} games
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-[#16c98d]">{s.goals ?? 0}</div>
                  <div className="text-[10px] text-gray-500">
                    {s.assists != null ? `${s.assists} ast` : 'goals'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data && rows.length === 0 && <EmptyState message="No players found" />}
    </div>
  );
}