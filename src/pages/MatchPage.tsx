import { ArrowLeft, Calendar, MapPin, Trophy } from 'lucide-react';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import {
  LEAGUES,
  addDays,
  kickoffTime,
  matchState,
  ymd,
  type FdMatch,
  type FdTeam,
  type MatchesResponse,
  type StandingRow,
  type StandingsResponse,
} from '@/lib/footballApi';

interface MatchDetail extends FdMatch {
  matchday?: number | null;
  venue?: string | null;
  stage?: string | null;
  referees?: { name: string; type: string }[];
  score: FdMatch['score'] & { halfTime?: { home: number | null; away: number | null } };
}

interface H2HResponse {
  aggregates?: {
    numberOfMatches: number;
    totalGoals: number;
    homeTeam: { id: number; wins: number; draws: number; losses: number };
    awayTeam: { id: number; wins: number; draws: number; losses: number };
  };
  matches?: FdMatch[];
}

type Result = 'W' | 'D' | 'L';

const gd = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function formOf(teamId: number, data: MatchesResponse | null): Result[] {
  return (data?.matches ?? [])
    .filter(
      (x) =>
        matchState(x) === 'finished' &&
        x.score.fullTime.home !== null &&
        x.score.fullTime.away !== null,
    )
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 5)
    .reverse()
    .map((x): Result => {
      const isHome = x.homeTeam.id === teamId;
      const gf = (isHome ? x.score.fullTime.home : x.score.fullTime.away) ?? 0;
      const ga = (isHome ? x.score.fullTime.away : x.score.fullTime.home) ?? 0;
      return gf > ga ? 'W' : gf === ga ? 'D' : 'L';
    });
}

function FormBadge({ r }: { r: Result }) {
  const color = r === 'W' ? 'bg-[#16c98d]' : r === 'L' ? 'bg-red-500' : 'bg-gray-600';
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white ${color}`}>
      {r}
    </span>
  );
}

function TeamBlock({ team, onClick }: { team: FdTeam; onClick?: () => void }) {
  return (
    <button
      disabled={!onClick}
      onClick={onClick}
      className="flex flex-col items-center gap-2 text-center disabled:cursor-default"
    >
      <img src={team.crest} alt="" className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
      <span className="font-display text-base font-bold text-white sm:text-lg">
        {team.shortName || team.name}
      </span>
    </button>
  );
}

function CompareRow({
  label,
  home,
  away,
  lowerIsBetter,
  signed,
}: {
  label: string;
  home: number;
  away: number;
  lowerIsBetter?: boolean;
  signed?: boolean;
}) {
  const homeBetter = lowerIsBetter ? home < away : home > away;
  const awayBetter = lowerIsBetter ? away < home : away > home;
  const show = (n: number) => (signed ? gd(n) : String(n));
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2.5">
      <span className={`text-right text-sm font-bold ${homeBetter ? 'text-[#16c98d]' : 'text-white'}`}>
        {show(home)}
      </span>
      <span className="w-28 text-center text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-bold ${awayBetter ? 'text-[#16c98d]' : 'text-white'}`}>
        {show(away)}
      </span>
    </div>
  );
}

export function MatchPage() {
  const { nav, navigate } = useNav();
  const id = nav.matchId;
  const back = () => navigate(nav.from && nav.from !== 'match' ? nav.from : 'fixtures');

  const matchReq = useFd<MatchDetail>(id ? `/matches/${id}` : null, 55_000, 60_000);
  const m = matchReq.data;
  const code = m?.competition.code;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = ymd(addDays(today, -45));
  const to = ymd(addDays(today, 1));

  const standingsReq = useFd<StandingsResponse>(
    code ? `/competitions/${code}/standings` : null,
    300_000,
  );
  const h2hReq = useFd<H2HResponse>(m ? `/matches/${id}/head2head?limit=10` : null, 3_600_000);
  const homeGames = useFd<MatchesResponse>(
    m ? `/teams/${m.homeTeam.id}/matches?dateFrom=${from}&dateTo=${to}` : null,
    600_000,
  );
  const awayGames = useFd<MatchesResponse>(
    m ? `/teams/${m.awayTeam.id}/matches?dateFrom=${from}&dateTo=${to}` : null,
    600_000,
  );

  if (!id) {
    return (
      <div className="py-12 text-center text-gray-500">
        Match not found.
        <button onClick={back} className="ml-2 text-[#16c98d] hover:underline">Go back</button>
      </div>
    );
  }

  const rowFor = (teamId: number): StandingRow | undefined => {
    for (const s of standingsReq.data?.standings ?? []) {
      if (s.type !== 'TOTAL') continue;
      const r = s.table.find((x) => x.team.id === teamId);
      if (r) return r;
    }
    return undefined;
  };

  const teamLink = (t: FdTeam) =>
    code && LEAGUES.some((l) => l.code === code)
      ? () => navigate('teams', { teamId: String(t.id), league: code })
      : undefined;

  const state = m ? matchState(m) : 'other';
  const homeRow = m ? rowFor(m.homeTeam.id) : undefined;
  const awayRow = m ? rowFor(m.awayTeam.id) : undefined;
  const homeForm = m ? formOf(m.homeTeam.id, homeGames.data) : [];
  const awayForm = m ? formOf(m.awayTeam.id, awayGames.data) : [];
  const h2h = h2hReq.data;
  const h2hMatches = (h2h?.matches ?? [])
    .sort((a, b) => b.utcDate.localeCompare(a.utcDate))
    .slice(0, 5);
  const leagueName = m
    ? (LEAGUES.find((l) => l.code === m.competition.code)?.name ?? m.competition.name)
    : '';
  const referee = m?.referees?.[0]?.name;

  return (
    <div className="space-y-6">
      <button onClick={back} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back
      </button>

      {matchReq.loading && !m && <p className="text-sm text-gray-400">Loading match...</p>}
      {matchReq.error && <p className="text-sm text-red-400">{matchReq.error}</p>}

      {m && (
        <>
          {/* Header */}
          <div className="overflow-hidden rounded-2xl border border-[#1f262e] bg-gradient-to-b from-[#181d23] to-[#14181d]">
            <div className="flex items-center justify-center gap-2 border-b border-[#1f262e] px-4 py-2.5 text-xs">
              <Trophy size={13} className="text-[#16c98d]" />
              <span className="font-semibold uppercase tracking-wider text-gray-400">
                {leagueName}
                {m.matchday ? ` - Matchday ${m.matchday}` : ''}
              </span>
            </div>

            <div className="px-4 py-8 sm:px-8">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
                <div className="flex justify-center sm:justify-end">
                  <TeamBlock team={m.homeTeam} onClick={teamLink(m.homeTeam)} />
                </div>

                <div className="text-center">
                  {state === 'upcoming' ? (
                    <div>
                      <div className="font-display text-3xl font-bold text-gray-200">{kickoffTime(m)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500">kickoff</div>
                    </div>
                  ) : (
                    <div className="font-display text-5xl font-bold text-white sm:text-6xl">
                      {m.score.fullTime.home ?? 0}
                      <span className="mx-2 text-gray-600">:</span>
                      {m.score.fullTime.away ?? 0}
                    </div>
                  )}
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        state === 'live'
                          ? 'bg-red-500/15 text-red-400'
                          : state === 'finished'
                            ? 'bg-gray-700/40 text-gray-400'
                            : 'bg-[#16c98d]/10 text-[#16c98d]'
                      }`}
                    >
                      {state === 'live' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />}
                      {state === 'live'
                        ? 'LIVE'
                        : state === 'finished'
                          ? 'Full time'
                          : state === 'upcoming'
                            ? 'Upcoming'
                            : m.status.replace('_', ' ')}
                    </span>
                  </div>
                  {m.score.halfTime && m.score.halfTime.home !== null && state !== 'upcoming' && (
                    <div className="mt-2 text-xs text-gray-500">
                      Half time {m.score.halfTime.home} - {m.score.halfTime.away}
                    </div>
                  )}
                </div>

                <div className="flex justify-center sm:justify-start">
                  <TeamBlock team={m.awayTeam} onClick={teamLink(m.awayTeam)} />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(m.utcDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                  , {kickoffTime(m)}
                </span>
                {m.venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} /> {m.venue}
                  </span>
                )}
                {referee && <span>Referee: {referee}</span>}
              </div>
            </div>
          </div>

          {/* Team comparison */}
          {homeRow && awayRow && (
            <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
              <h3 className="mb-2 text-center font-display text-sm font-bold uppercase tracking-wider text-gray-400">
                Team Comparison
              </h3>
              <div className="divide-y divide-[#1f262e]">
                <CompareRow label="Position" home={homeRow.position} away={awayRow.position} lowerIsBetter />
                <CompareRow label="Points" home={homeRow.points} away={awayRow.points} />
                <CompareRow label="Played" home={homeRow.playedGames} away={awayRow.playedGames} />
                <CompareRow label="Won" home={homeRow.won} away={awayRow.won} />
                <CompareRow label="Goals scored" home={homeRow.goalsFor} away={awayRow.goalsFor} />
                <CompareRow
                  label="Goals conceded"
                  home={homeRow.goalsAgainst}
                  away={awayRow.goalsAgainst}
                  lowerIsBetter
                />
                <CompareRow
                  label="Goal difference"
                  home={homeRow.goalDifference}
                  away={awayRow.goalDifference}
                  signed
                />
              </div>
            </section>
          )}

          {/* Recent form */}
          {(homeForm.length > 0 || awayForm.length > 0) && (
            <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
              <h3 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-wider text-gray-400">
                Recent Form
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { team: m.homeTeam, form: homeForm },
                  { team: m.awayTeam, form: awayForm },
                ].map((x) => (
                  <div key={x.team.id} className="flex flex-col items-center gap-3">
                    <span className="text-sm font-medium text-white">{x.team.shortName || x.team.name}</span>
                    <div className="flex gap-1.5">
                      {x.form.length > 0 ? (
                        x.form.map((r, i) => <FormBadge key={i} r={r} />)
                      ) : (
                        <span className="text-xs text-gray-500">No recent games</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-gray-500">Oldest to newest, all competitions</p>
            </section>
          )}

          {/* Head to head */}
          {h2h && h2hMatches.length > 0 && (
            <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
              <h3 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-wider text-gray-400">
                Head to Head
              </h3>
              {h2h.aggregates && (
                <div className="mb-4 grid grid-cols-3 text-center">
                  <div>
                    <div className="font-display text-2xl font-bold text-white">{h2h.aggregates.homeTeam.wins}</div>
                    <div className="text-xs text-gray-500">{m.homeTeam.shortName || m.homeTeam.name} wins</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold text-gray-300">{h2h.aggregates.homeTeam.draws}</div>
                    <div className="text-xs text-gray-500">Draws</div>
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold text-white">{h2h.aggregates.awayTeam.wins}</div>
                    <div className="text-xs text-gray-500">{m.awayTeam.shortName || m.awayTeam.name} wins</div>
                  </div>
                </div>
              )}
              <div className="divide-y divide-[#1f262e]">
                {h2hMatches.map((x) => (
                  <div key={x.id} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-3 py-2.5 text-sm">
                    <span className="text-xs text-gray-500">
                      {new Date(x.utcDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </span>
                    <span className="truncate text-right text-white">{x.homeTeam.shortName || x.homeTeam.name}</span>
                    <span className="font-bold text-white">
                      {x.score.fullTime.home ?? '-'} - {x.score.fullTime.away ?? '-'}
                    </span>
                    <span className="truncate text-white">{x.awayTeam.shortName || x.awayTeam.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}