import { Medal } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/UI';
import { FdMatchCard } from '@/components/FdMatchCard';
import { BarChart } from '@/components/BarChart';
import { RowsSkeleton, CardsSkeleton, ErrorBox } from '@/components/Status';
import { useFd } from '@/lib/useFd';
import { addDays, matchState, ymd, type FdMatch, type FdTeam, type StandingRow } from '@/lib/footballApi';

interface ClStanding {
  stage?: string;
  type: string;
  group?: string | null;
  table: StandingRow[];
}
interface ClStandingsResponse {
  standings: ClStanding[];
}
interface ClMatchesResponse {
  matches: FdMatch[];
}
interface ScorersResponse {
  scorers: { player: { id: number; name: string }; team: FdTeam; goals: number | null }[];
}

const gd = (n: number) => (n > 0 ? `+${n}` : `${n}`);

const zone = (pos: number, total: number) => {
  if (total >= 30) {
    if (pos <= 8) return 'border-l-[#16c98d]';
    if (pos <= 24) return 'border-l-orange-400';
    return 'border-l-red-500';
  }
  return pos <= 2 ? 'border-l-[#16c98d]' : 'border-l-transparent';
};

const label = (s?: string | null) =>
  (s ?? '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function ChampionsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const table = useFd<ClStandingsResponse>('/competitions/CL/standings', 300_000, 600_000);
  const games = useFd<ClMatchesResponse>(
    `/competitions/CL/matches?dateFrom=${ymd(addDays(today, -7))}&dateTo=${ymd(addDays(today, 14))}`,
    120_000,
    300_000,
  );
  const scorers = useFd<ScorersResponse>('/competitions/CL/scorers?limit=10', 600_000);

  const blocks = (table.data?.standings ?? []).filter((s) => s.type === 'TOTAL');
  const all = games.data?.matches ?? [];
  const recent = all
    .filter((m) => matchState(m) === 'finished')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 6);
  const upcoming = all
    .filter((m) => ['upcoming', 'live'].includes(matchState(m)))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Champions League"
        subtitle="Standings, results and top scorers"
        icon={<Medal size={22} />}
      />

      {/* Standings */}
      <section className="space-y-4">
        {table.loading && !table.data && !table.error && <RowsSkeleton rows={10} />}
        {table.error && !table.data && <ErrorBox message={table.error} onRetry={table.reload} />}
        {blocks.map((b, bi) => (
          <div key={bi}>
            {(b.group || blocks.length > 1) && (
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
                {label(b.group) || label(b.stage)}
              </h3>
            )}
            {b.table.length >= 30 && (
              <div className="mb-3 flex flex-wrap gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-[#16c98d]" /> Top 8: Round of 16</span>
                <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-orange-400" /> 9-24: Play-offs</span>
                <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-red-500" /> 25+: Out</span>
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-[#1f262e] bg-[#14181d]">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-[#1f262e] text-left text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Team</th>
                    <th className="px-3 py-3 text-center font-semibold">P</th>
                    <th className="px-3 py-3 text-center font-semibold">W</th>
                    <th className="px-3 py-3 text-center font-semibold">D</th>
                    <th className="px-3 py-3 text-center font-semibold">L</th>
                    <th className="px-3 py-3 text-center font-semibold">GD</th>
                    <th className="px-4 py-3 text-center font-semibold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f262e]">
                  {b.table.map((r) => (
                    <tr
                      key={r.team.id}
                      className={`border-l-[3px] hover:bg-white/5 ${zone(r.position, b.table.length)}`}
                    >
                      <td className="px-4 py-2.5 font-bold text-gray-300">{r.position}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <img src={r.team.crest} alt="" className="h-5 w-5 object-contain" />
                          <span className="font-medium text-white">{r.team.shortName || r.team.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{r.playedGames}</td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{r.won}</td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{r.draw}</td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{r.lost}</td>
                      <td className="px-3 py-2.5 text-center text-gray-300">{gd(r.goalDifference)}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-white">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Matches */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Upcoming</h3>
          {games.loading && !games.data && !games.error && <CardsSkeleton count={2} />}
          {games.error && !games.data && <ErrorBox message={games.error} onRetry={games.reload} />}
          {games.data && upcoming.length === 0 && <EmptyState message="No matches in the next 2 weeks" />}
          <div className="space-y-3">
            {upcoming.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Recent Results</h3>
          {games.data && recent.length === 0 && <EmptyState message="No results in the last week" />}
          <div className="space-y-3">
            {recent.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      </div>

      {/* Scorers chart */}
      {scorers.data && scorers.data.scorers.length > 0 && (
        <BarChart
          title="Top scorers"
          data={scorers.data.scorers.slice(0, 8).map((s) => ({
            label: s.player.name,
            value: s.goals ?? 0,
            crest: s.team.crest,
          }))}
        />
      )}
    </div>
  );
}