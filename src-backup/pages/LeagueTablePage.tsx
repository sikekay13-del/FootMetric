import { ListOrdered } from 'lucide-react';
import { PageHeader } from '@/components/UI';
import { useNav } from '@/nav';
import { LEAGUES, type StandingsResponse } from '@/lib/footballApi';
import { useFd } from '@/lib/useFd';

export function LeagueTablePage() {
  const { nav, navigate } = useNav();
  const code = LEAGUES.some((l) => l.code === nav.league) ? nav.league! : 'PL';
  const league = LEAGUES.find((l) => l.code === code)!;

  const { data, loading, error, updatedAt } = useFd<StandingsResponse>(
    `/competitions/${code}/standings`,
    60_000,
    120_000,
  );

  const rows = data?.standings.find((s) => s.type === 'TOTAL')?.table ?? [];
  const relegationSpots = rows.length === 18 ? 2 : 3;

  let season = '';
  if (data) {
    const y = new Date(data.season.startDate).getFullYear();
    season = `${y}/${String(y + 1).slice(2)} season`;
  }

  const zone = (pos: number) => {
    if (pos <= 4) return 'champions';
    if (pos <= 6) return 'europa';
    if (rows.length && pos > rows.length - relegationSpots) return 'relegation';
    return 'none';
  };

  const accent = (pos: number) => {
    const z = zone(pos);
    if (z === 'champions') return 'border-l-[3px] border-l-[#16c98d]';
    if (z === 'europa') return 'border-l-[3px] border-l-orange-400';
    if (z === 'relegation') return 'border-l-[3px] border-l-red-500';
    return 'border-l-[3px] border-l-transparent';
  };

  const posColor = (pos: number) => {
    const z = zone(pos);
    if (z === 'champions') return 'text-[#16c98d]';
    if (z === 'europa') return 'text-orange-400';
    if (z === 'relegation') return 'text-red-400';
    return 'text-gray-400';
  };

  const gd = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="League Table"
        subtitle={`${league.name} standings${season ? ' - ' + season : ''}`}
        icon={<ListOrdered size={22} />}
      />

      {/* League picker */}
      <div className="flex flex-wrap gap-2">
        {LEAGUES.map((l) => (
          <button
            key={l.code}
            onClick={() => navigate('table', { league: l.code })}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              l.code === code
                ? 'border-[#16c98d] bg-[#16c98d] text-black'
                : 'border-[#1f262e] bg-[#14181d] text-gray-300 hover:bg-white/5'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      {/* Legend + updated time */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-[#16c98d]" /> European places (approx.)</span>
          <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-orange-400" /> Europa places (approx.)</span>
          <span className="flex items-center gap-2"><span className="h-3 w-1 rounded bg-red-500" /> Relegation</span>
        </div>
        {updatedAt && <span>Updated {updatedAt.toLocaleTimeString()}</span>}
      </div>

      {loading && !data && <p className="text-sm text-gray-400">Loading standings...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f262e] text-left text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Team</th>
                  <th className="px-3 py-3 text-center font-semibold">P</th>
                  <th className="px-3 py-3 text-center font-semibold">W</th>
                  <th className="px-3 py-3 text-center font-semibold">D</th>
                  <th className="px-3 py-3 text-center font-semibold">L</th>
                  <th className="px-3 py-3 text-center font-semibold">GF</th>
                  <th className="px-3 py-3 text-center font-semibold">GA</th>
                  <th className="px-3 py-3 text-center font-semibold">GD</th>
                  <th className="px-4 py-3 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f262e]">
                {rows.map((r) => (
                  <tr key={r.team.id} className={`transition-colors hover:bg-white/5 ${accent(r.position)}`}>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${posColor(r.position)}`}>{r.position}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={r.team.crest} alt="" className="h-6 w-6 object-contain" />
                        <span className="font-medium text-white">{r.team.shortName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.playedGames}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.won}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.draw}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.lost}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.goalsFor}</td>
                    <td className="px-3 py-3 text-center text-gray-300">{r.goalsAgainst}</td>
                    <td className="px-3 py-3 text-center font-medium text-gray-200">{gd(r.goalDifference)}</td>
                    <td className="px-4 py-3 text-center font-display text-base font-bold text-white">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {rows.map((r) => (
              <div
                key={r.team.id}
                className={`flex w-full items-center gap-3 rounded-lg border border-[#1f262e] bg-[#14181d] p-3 ${accent(r.position)}`}
              >
                <span className={`w-5 text-center text-sm font-bold ${posColor(r.position)}`}>{r.position}</span>
                <img src={r.team.crest} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-sm font-medium text-white">{r.team.shortName}</span>
                <span className="text-xs text-gray-400">{r.playedGames}P</span>
                <span className="font-display text-lg font-bold text-white">{r.points}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}