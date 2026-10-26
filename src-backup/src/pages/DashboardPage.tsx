import { useState } from 'react';
import { Radio, CalendarDays, Goal, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { StatCard, SectionHeader, PageHeader } from '@/components/UI';
import { FdMatchCard } from '@/components/FdMatchCard';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import {
  COMPETITIONS,
  LEAGUES,
  addDays,
  matchesPath,
  matchState,
  ymd,
  type FdTeam,
  type MatchesResponse,
  type StandingsResponse,
} from '@/lib/footballApi';

interface ScorersResponse {
  scorers: {
    player: { id: number; name: string };
    team: FdTeam;
    playedMatches: number | null;
    goals: number | null;
  }[];
}

interface Req<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
}

const SCORER_TABS = [{ code: 'ALL', name: 'All leagues' }, ...COMPETITIONS];
const DOMESTIC = ['PL', 'PD', 'SA', 'BL1', 'FL1'];

function Tabs({
  items,
  value,
  onChange,
}: {
  items: readonly { code: string; name: string }[];
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((t) => (
        <button
          key={t.code}
          onClick={() => onChange(t.code)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            value === t.code
              ? 'border border-[#16c98d]/30 bg-[#16c98d]/15 text-[#16c98d]'
              : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
          }`}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { navigate } = useNav();
  const [scorerTab, setScorerTab] = useState<string>('ALL');
  const [standingsTab, setStandingsTab] = useState<string>('PL');

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayKey = ymd(now);
  const tomorrowStart = addDays(now, 1).getTime();

  // Matches: last 3 days to next 3 days, all 5 leagues + Champions League
  const matchesReq = useFd<MatchesResponse>(
    matchesPath(addDays(now, -3), addDays(now, 3)),
    55_000,
    60_000,
  );

  const all = matchesReq.data?.matches ?? [];
  const today = all
    .filter((m) => ymd(new Date(m.utcDate)) === todayKey)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
  const live = today.filter((m) => matchState(m) === 'live');
  const upcomingToday = today.filter((m) => matchState(m) === 'upcoming');
  const goalsToday = today
    .filter((m) => ['live', 'finished'].includes(matchState(m)))
    .reduce((sum, m) => sum + (m.score.fullTime.home ?? 0) + (m.score.fullTime.away ?? 0), 0);

  const recent = all
    .filter((m) => matchState(m) === 'finished')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 6);

  const comingUp = all
    .filter((m) => matchState(m) === 'upcoming' && new Date(m.utcDate).getTime() >= tomorrowStart)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 6);

  // Top scorers: each league is only requested when its tab needs it
  const scorerPath = (code: string) => {
    const needed = scorerTab === 'ALL' ? DOMESTIC.includes(code) : scorerTab === code;
    return needed ? `/competitions/${code}/scorers?limit=10` : null;
  };
  const sc: Record<string, Req<ScorersResponse>> = {
    PL: useFd<ScorersResponse>(scorerPath('PL'), 600_000),
    PD: useFd<ScorersResponse>(scorerPath('PD'), 600_000),
    SA: useFd<ScorersResponse>(scorerPath('SA'), 600_000),
    BL1: useFd<ScorersResponse>(scorerPath('BL1'), 600_000),
    FL1: useFd<ScorersResponse>(scorerPath('FL1'), 600_000),
    CL: useFd<ScorersResponse>(scorerPath('CL'), 600_000),
  };
  const scorerCodes = scorerTab === 'ALL' ? DOMESTIC : [scorerTab];
  const scorersLoading = scorerCodes.some((c) => sc[c].loading && !sc[c].data);
  const scorersError = scorerCodes.map((c) => sc[c].error).find(Boolean) ?? null;
  const scorerRows = scorerCodes
    .flatMap((c) => (sc[c].data?.scorers ?? []).map((s) => ({ ...s, code: c })))
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, 8);
  const leagueName = (code: string) => COMPETITIONS.find((l) => l.code === code)?.name ?? code;

  // Standings: one league at a time
  const standingsReq = useFd<StandingsResponse>(
    `/competitions/${standingsTab}/standings`,
    120_000,
    300_000,
  );
  const table = standingsReq.data?.standings.find((s) => s.type === 'TOTAL')?.table ?? [];
  const topTeams = table.slice(0, 5);

  const dateText = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const gd = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  const viewAll = (label: string, onClick: () => void) => (
    <button onClick={onClick} className="flex items-center gap-1 text-sm text-[#16c98d] hover:underline">
      {label} <ChevronRight size={14} />
    </button>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back, Football Fan"
        subtitle={`${dateText}${
          matchesReq.updatedAt ? ' - updated ' + matchesReq.updatedAt.toLocaleTimeString() : ''
        }`}
        icon={<TrendingUp size={22} />}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Matches Today" value={today.length} icon={<CalendarDays size={18} />} accent />
        <StatCard label="Live Matches" value={live.length} icon={<Radio size={18} />} />
        <StatCard label="Goals Today" value={goalsToday} icon={<Goal size={18} />} />
        <StatCard label="Still To Play" value={upcomingToday.length} icon={<Clock size={18} />} />
      </div>

      {matchesReq.error && <p className="text-sm text-red-400">{matchesReq.error}</p>}

      {/* Live matches */}
      {live.length > 0 && (
        <section>
          <SectionHeader
            title="Live Now"
            subtitle="Matches currently in progress"
            action={viewAll('View all', () => navigate('live'))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {live.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Today's fixtures + recent results */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader
            title="Today's Matches"
            subtitle="Top 5 leagues and Champions League"
            action={viewAll('Fixtures', () => navigate('fixtures'))}
          />
          {matchesReq.loading && !matchesReq.data && (
            <p className="text-sm text-gray-400">Loading matches...</p>
          )}
          {matchesReq.data && today.length === 0 && (
            <p className="text-sm text-gray-500">No matches today. See what's coming up below.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {today.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Recent Results" subtitle="Last few days" />
          {matchesReq.data && recent.length === 0 && (
            <p className="text-sm text-gray-500">No recent results.</p>
          )}
          <div className="space-y-3">
            {recent.map((m) => (
              <div
                key={m.id}
                className="flex w-full items-center justify-between rounded-xl border border-[#1f262e] bg-[#14181d] p-3"
              >
                <div className="flex items-center gap-2">
                  <img src={m.homeTeam.crest} alt="" className="h-6 w-6 object-contain" />
                  <span className="text-xs text-gray-400">{m.homeTeam.tla}</span>
                </div>
                <span className="font-bold text-white">
                  {m.score.fullTime.home ?? '-'} - {m.score.fullTime.away ?? '-'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{m.awayTeam.tla}</span>
                  <img src={m.awayTeam.crest} alt="" className="h-6 w-6 object-contain" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Coming up: only when today is quiet */}
      {today.length < 4 && comingUp.length > 0 && (
        <section>
          <SectionHeader
            title="Coming Up"
            subtitle="Next matches in the next few days"
            action={viewAll('Fixtures', () => navigate('fixtures'))}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {comingUp.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Top scorers */}
      <section>
        <SectionHeader
          title="Top Scorers"
          subtitle="Golden Boot race across the top leagues"
          action={viewAll('All players', () => navigate('players'))}
        />
        <Tabs items={SCORER_TABS} value={scorerTab} onChange={setScorerTab} />
        {scorersLoading && scorerRows.length === 0 && (
          <p className="text-sm text-gray-400">Loading scorers...</p>
        )}
        {scorersError && <p className="mb-2 text-sm text-red-400">{scorersError}</p>}
        {scorerRows.length > 0 && (
          <div className="divide-y divide-[#1f262e] rounded-xl border border-[#1f262e] bg-[#14181d]">
            {scorerRows.map((s, i) => (
              <div key={`${s.code}-${s.player.id}`} className="flex items-center gap-3 p-3">
                <span className="w-5 text-center text-sm font-bold text-gray-500">{i + 1}</span>
                <img src={s.team.crest} alt="" className="h-8 w-8 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{s.player.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.team.shortName} - {leagueName(s.code)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-[#16c98d]">{s.goals ?? 0}</div>
                  <div className="text-[10px] text-gray-500">goals</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mini standings */}
      <section>
        <SectionHeader
          title="League Standings"
          subtitle="Top 5 of the selected league"
          action={viewAll('Full table', () => navigate('table', { league: standingsTab }))}
        />
        <Tabs items={LEAGUES} value={standingsTab} onChange={setStandingsTab} />
        {standingsReq.loading && !standingsReq.data && (
          <p className="text-sm text-gray-400">Loading standings...</p>
        )}
        {standingsReq.error && <p className="text-sm text-red-400">{standingsReq.error}</p>}
        {topTeams.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[#1f262e] bg-[#14181d]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f262e] text-left text-[11px] uppercase text-gray-500">
                  <th className="px-4 py-2.5 font-semibold">#</th>
                  <th className="px-4 py-2.5 font-semibold">Team</th>
                  <th className="px-3 py-2.5 text-center font-semibold">P</th>
                  <th className="px-3 py-2.5 text-center font-semibold">W</th>
                  <th className="px-3 py-2.5 text-center font-semibold">D</th>
                  <th className="px-3 py-2.5 text-center font-semibold">L</th>
                  <th className="px-3 py-2.5 text-center font-semibold">GD</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f262e]">
                {topTeams.map((r) => (
                  <tr
                    key={r.team.id}
                    onClick={() => navigate('table', { league: standingsTab })}
                    className="cursor-pointer transition-colors hover:bg-white/5"
                  >
                    <td className="px-4 py-2.5 font-bold text-[#16c98d]">{r.position}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={r.team.crest} alt="" className="h-5 w-5 object-contain" />
                        <span className="font-medium text-white">{r.team.shortName}</span>
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
        )}
      </section>
    </div>
  );
}