import { CardsSkeleton, ErrorBox } from '@/components/Status';
import { useViewState } from '@/lib/viewState';
import { Shield, Search, ArrowLeft, MapPin, User, Calendar, TrendingUp, Star } from 'lucide-react';
import { PageHeader, EmptyState, StatCard } from '@/components/UI';
import { FdMatchCard } from '@/components/FdMatchCard';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import { useFavorites } from '@/lib/favorites';
import { Countdown } from '@/components/Countdown';
import {
  LEAGUES,
  addDays,
  matchState,
  ymd,
  type MatchesResponse,
  type StandingsResponse,
} from '@/lib/footballApi';

interface TeamDetail {
  id: number;
  name: string;
  shortName: string;
  crest: string;
  founded: number | null;
  venue: string | null;
  coach?: { name: string | null } | null;
  squad?: {
    id: number;
    name: string;
    position: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
  }[];
}

const gd = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function TeamsPage() {
  const { nav } = useNav();
  if (nav.teamId) return <TeamProfile teamId={nav.teamId} league={nav.league ?? 'PL'} />;
  return <TeamsList />;
}

function TeamsList() {
  const { nav, navigate } = useNav();
    const [code, setCode] = useViewState<string>(
    'teams-league',
    LEAGUES.some((l) => l.code === nav.league) ? nav.league! : 'PL',
  );
  const [query, setQuery] = useViewState<string>('teams-query', '');

  const { data, loading, error, reload } = useFd<StandingsResponse>(
    `/competitions/${code}/standings`,
    120_000,
    300_000,
  );

  const rows = (data?.standings.find((s) => s.type === 'TOTAL')?.table ?? []).filter((r) =>
    `${r.team.name} ${r.team.shortName}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Browse the teams of each league"
        icon={<Shield size={22} />}
      />

      <div className="flex flex-wrap gap-2">
        {LEAGUES.map((l) => (
          <button
            key={l.code}
            onClick={() => setCode(l.code)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              code === l.code
                ? 'bg-[#16c98d] text-[#0a0c0f]'
                : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams..."
          className="w-full rounded-lg border border-[#1f262e] bg-[#14181d] py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#16c98d]/50"
        />
      </div>

      {loading && !data && !error && <CardsSkeleton count={8} />}
      {error && !data && <ErrorBox message={error} onRetry={reload} />}

      {data && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((r) => (
            <button
              key={r.team.id}
              onClick={() => navigate('teams', { teamId: String(r.team.id), league: code })}
              className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 text-left transition-colors hover:border-[#16c98d]/40"
            >
              <div className="flex items-center gap-3">
                <img src={r.team.crest} alt="" className="h-10 w-10 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{r.team.shortName}</div>
                  <div className="text-xs text-gray-500">
                    {LEAGUES.find((l) => l.code === code)?.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500">Pos</div>
                  <div className="font-display text-xl font-bold text-[#16c98d]">{r.position}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1 border-t border-[#1f262e] pt-3 text-center">
                <div><div className="text-sm font-bold text-white">{r.playedGames}</div><div className="text-[10px] text-gray-500">P</div></div>
                <div><div className="text-sm font-bold text-white">{r.won}</div><div className="text-[10px] text-gray-500">W</div></div>
                <div><div className="text-sm font-bold text-white">{r.draw}</div><div className="text-[10px] text-gray-500">D</div></div>
                <div><div className="text-sm font-bold text-white">{r.lost}</div><div className="text-[10px] text-gray-500">L</div></div>
                <div><div className="text-sm font-bold text-white">{gd(r.goalDifference)}</div><div className="text-[10px] text-gray-500">GD</div></div>
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{r.points} pts</div>
            </button>
          ))}
        </div>
      )}
      {data && rows.length === 0 && <EmptyState message="No teams found" />}
    </div>
  );
}

function positionGroup(pos: string | null): 'GK' | 'DF' | 'MF' | 'FW' {
  const p = (pos ?? '').toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('back') || p.includes('defen')) return 'DF';
  if (p.includes('midfield')) return 'MF';
  return 'FW';
}

function TeamProfile({ teamId, league }: { teamId: string; league: string }) {
   const { back } = useNav();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = ymd(addDays(today, -45));
  const to = ymd(addDays(today, 45));

  const standings = useFd<StandingsResponse>(`/competitions/${league}/standings`, 120_000);
  const info = useFd<TeamDetail>(`/teams/${teamId}`, 3_600_000);
  const games = useFd<MatchesResponse>(
    `/teams/${teamId}/matches?dateFrom=${from}&dateTo=${to}`,
    300_000,
  );

  const row = standings.data?.standings
    .find((s) => s.type === 'TOTAL')
    ?.table.find((r) => String(r.team.id) === teamId);

  const name = row?.team.name ?? info.data?.name ?? 'Team';
  const crest = row?.team.crest ?? info.data?.crest;
  const leagueName = LEAGUES.find((l) => l.code === league)?.name ?? '';
  const { isFav, toggle } = useFavorites();
  const all = games.data?.matches ?? [];
  const recent = all
    .filter((m) => matchState(m) === 'finished')
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 3);
  const upcoming = all
    .filter((m) => ['upcoming', 'live'].includes(matchState(m)))
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate))
    .slice(0, 3);

  const squad = info.data?.squad ?? [];
  const groups: { key: 'GK' | 'DF' | 'MF' | 'FW'; label: string }[] = [
    { key: 'GK', label: 'Goalkeepers' },
    { key: 'DF', label: 'Defenders' },
    { key: 'MF', label: 'Midfielders' },
    { key: 'FW', label: 'Forwards' },
  ];
  const age = (dob: string | null) =>
    dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;

  return (
    <div className="space-y-6">
      <button
        onClick={back}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back to Teams
      </button>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-[#1f262e] bg-gradient-to-br from-[#16c98d]/10 to-[#14181d] p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {crest && <img src={crest} alt="" className="h-20 w-20 object-contain" />}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              <h1 className="font-display text-3xl font-bold text-white">{name}</h1>
              <button
                onClick={() =>
                  toggle({
                    id: Number(teamId),
                    name: row?.team.shortName ?? name,
                    crest: crest ?? '',
                    league,
                  })
                }
                aria-label="Follow team"
                className="rounded-lg p-1.5 hover:bg-white/5"
              >
                <Star
                  size={22}
                  className={isFav(Number(teamId)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
                />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              {info.data?.coach?.name && (
                <span className="flex items-center gap-1.5 text-gray-300">
                  <User size={15} className="text-gray-500" /> {info.data.coach.name}
                </span>
              )}
              {info.data?.venue && (
                <span className="flex items-center gap-1.5 text-gray-300">
                  <MapPin size={15} className="text-gray-500" /> {info.data.venue}
                </span>
              )}
              {info.data?.founded && (
                <span className="flex items-center gap-1.5 text-gray-300">
                  <Calendar size={15} className="text-gray-500" /> Founded {info.data.founded}
                </span>
              )}
            </div>
          </div>
          {row && (
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-gray-500">Position</div>
              <div className="font-display text-4xl font-bold text-[#16c98d]">{row.position}</div>
              <div className="text-xs text-gray-500">{leagueName}</div>
            </div>
          )}
        </div>
      </div>

      {info.error && <p className="text-sm text-orange-400">Club details unavailable: {info.error}</p>}

      {row && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Played" value={row.playedGames} icon={<TrendingUp size={18} />} />
          <StatCard label="Wins" value={row.won} icon={<TrendingUp size={18} />} accent />
          <StatCard label="Goals For" value={row.goalsFor} icon={<TrendingUp size={18} />} />
          <StatCard label="Goal Diff" value={gd(row.goalDifference)} icon={<TrendingUp size={18} />} />
        </div>
      )}
      {upcoming[0] && matchState(upcoming[0]) === 'upcoming' && (
        <Countdown
          to={upcoming[0].utcDate}
          label={
            'vs ' +
            (upcoming[0].homeTeam.id === Number(teamId) ? upcoming[0].awayTeam : upcoming[0].homeTeam)
              .shortName
          }
        />
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Upcoming Fixtures</h3>
          {games.loading && !games.data && <p className="text-sm text-gray-400">Loading...</p>}
          {games.error && <p className="text-sm text-red-400">{games.error}</p>}
          {games.data && upcoming.length === 0 && <EmptyState message="No upcoming fixtures" />}
          <div className="space-y-3">
            {upcoming.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Recent Results</h3>
          {games.data && recent.length === 0 && <EmptyState message="No recent results" />}
          <div className="space-y-3">
            {recent.map((m) => (
              <FdMatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      </div>

      {squad.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Squad</h3>
          <div className="space-y-5">
            {groups.map((g) => {
              const list = squad.filter((p) => positionGroup(p.position) === g.key);
              if (list.length === 0) return null;
              return (
                <div key={g.key}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {g.label}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-lg border border-[#1f262e] bg-[#14181d] px-3 py-2"
                      >
                        <div className="truncate text-sm font-medium text-white">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.nationality ?? ''}
                          {age(p.dateOfBirth) ? ` - ${age(p.dateOfBirth)}y` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}