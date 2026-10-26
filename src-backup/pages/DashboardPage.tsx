import { Radio, CalendarDays, Goal, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { TeamCard } from '@/components/TeamCard';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { StatCard, SectionHeader, PageHeader } from '@/components/UI';
import { Crest } from '@/components/Crest';
import { matches, teams, players, getTeam } from '@/data/mock';
import { useNav } from '@/nav';
import type { Team } from '@/types';

export function DashboardPage() {
  const { navigate } = useNav();
  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'HT');
  const todaysFixtures = matches.filter((m) => m.date === '2026-10-20');
  const featured = matches.filter((m) => m.status === 'FT').slice(0, 3);
  const topTeams = [...teams].sort((a, b) => b.points - a.points).slice(0, 4);
  const topScorers = [...players].filter((p) => p.position !== 'GK').sort((a, b) => b.goals - a.goals).slice(0, 5);
  const goalsToday = todaysFixtures.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
  const upcoming = matches.filter((m) => m.status === 'UPCOMING').length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back, Football Fan"
        subtitle="Monday, 20 October 2026 — Here's what's happening today"
        icon={<TrendingUp size={22} />}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Matches Today" value={todaysFixtures.length} icon={<CalendarDays size={18} />} accent />
        <StatCard label="Live Matches" value={liveMatches.length} icon={<Radio size={18} />} />
        <StatCard label="Goals Today" value={goalsToday} icon={<Goal size={18} />} />
        <StatCard label="Upcoming" value={upcoming} icon={<Clock size={18} />} />
      </div>

      {/* Live matches */}
      {liveMatches.length > 0 && (
        <section>
          <SectionHeader
            title="Live Now"
            subtitle="Matches currently in progress"
            action={
              <button onClick={() => navigate('live')} className="flex items-center gap-1 text-sm text-[#16c98d] hover:underline">
                View all <ChevronRight size={14} />
              </button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {liveMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* Today's fixtures + featured */}
      <div className="grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <SectionHeader title="Today's Fixtures" subtitle="All matches scheduled for today" />
          <div className="grid gap-4 sm:grid-cols-2">
            {todaysFixtures.map((m) => (
              <MatchCard key={m.id} match={m} compact />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Recent Results" subtitle="Latest finished matches" />
          <div className="space-y-3">
            {featured.map((m) => {
              const home = getTeam(m.homeId);
              const away = getTeam(m.awayId);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate('match', { matchId: m.id })}
                  className="card-hover flex w-full items-center justify-between rounded-xl border border-[#1f262e] bg-[#14181d] p-3 text-left hover:bg-[#181d23]"
                >
                  <div className="flex items-center gap-2">
                    <Crest team={home} size={24} />
                    <span className="text-xs text-gray-400">{home.shortName}</span>
                  </div>
                  <span className="font-bold text-white">
                    {m.homeScore} - {m.awayScore}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{away.shortName}</span>
                    <Crest team={away} size={24} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Top teams + top scorers */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionHeader
            title="Top Teams"
            subtitle="Leading the Premier League"
            action={
              <button onClick={() => navigate('table')} className="flex items-center gap-1 text-sm text-[#16c98d] hover:underline">
                Table <ChevronRight size={14} />
              </button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {topTeams.map((t) => (
              <TeamCard key={t.id} team={t} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            title="Top Scorers"
            subtitle="Golden Boot race leaders"
            action={
              <button onClick={() => navigate('players')} className="flex items-center gap-1 text-sm text-[#16c98d] hover:underline">
                All players <ChevronRight size={14} />
              </button>
            }
          />
          <div className="rounded-xl border border-[#1f262e] bg-[#14181d] divide-y divide-[#1f262e]">
            {topScorers.map((p, i) => {
              const team: Team = getTeam(p.teamId);
              return (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-500">{i + 1}</span>
                  <PlayerAvatar player={p} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Crest team={team} size={14} /> {team.shortName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-[#16c98d]">{p.goals}</div>
                    <div className="text-[10px] text-gray-500">goals</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Mini standings */}
      <section>
        <SectionHeader
          title="League Standings"
          subtitle="Current Premier League table"
          action={
            <button onClick={() => navigate('table')} className="flex items-center gap-1 text-sm text-[#16c98d] hover:underline">
              Full table <ChevronRight size={14} />
            </button>
          }
        />
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
              {topTeams.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => navigate('teams', { teamId: t.id })}
                  className="cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${t.position <= 4 ? 'text-[#16c98d]' : 'text-gray-400'}`}>
                      {t.position}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Crest team={t} size={22} />
                      <span className="font-medium text-white">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.played}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.won}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.drawn}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.lost}</td>
                  <td className="px-3 py-2.5 text-center text-gray-300">{t.gf - t.ga > 0 ? `+${t.gf - t.ga}` : t.gf - t.ga}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-white">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
