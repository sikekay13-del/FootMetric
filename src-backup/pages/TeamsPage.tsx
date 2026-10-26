import { useState } from 'react';
import { Shield, Search, ArrowLeft, MapPin, User, Calendar, TrendingUp } from 'lucide-react';
import { Crest } from '@/components/Crest';
import { TeamCard, FormBadge } from '@/components/TeamCard';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { MatchCard } from '@/components/MatchCard';
import { PageHeader, EmptyState, StatCard } from '@/components/UI';
import { teams, getTeam, getTeamPlayers, getTeamMatches } from '@/data/mock';
import { useNav } from '@/nav';

export function TeamsPage() {
  const { nav, navigate } = useNav();
  const [query, setQuery] = useState('');
  const [league, setLeague] = useState('All');

  if (nav.teamId) {
    return <TeamProfile teamId={nav.teamId} onBack={() => navigate('teams')} />;
  }

  const leagues = ['All', ...Array.from(new Set(teams.map((t) => t.league)))];
  const filtered = teams.filter(
    (t) =>
      (league === 'All' || t.league === league) &&
      t.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        subtitle="Browse all teams across the top competitions"
        icon={<Shield size={22} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full rounded-lg border border-[#1f262e] bg-[#14181d] py-2.5 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#16c98d]/50"
          />
        </div>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="rounded-lg border border-[#1f262e] bg-[#14181d] px-3 py-2.5 text-sm text-white outline-none focus:border-[#16c98d]/50"
        >
          {leagues.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t) => <TeamCard key={t.id} team={t} />)}
        </div>
      ) : (
        <EmptyState message="No teams found" />
      )}
    </div>
  );
}

function TeamProfile({ teamId, onBack }: { teamId: string; onBack: () => void }) {
  const team = getTeam(teamId);
  const squad = getTeamPlayers(teamId);
  const teamMatches = getTeamMatches(teamId);
  const upcoming = teamMatches.filter((m) => m.status === 'UPCOMING').slice(0, 3);
  const recent = teamMatches.filter((m) => m.status === 'FT').slice(0, 3);
  const keyPlayers = [...squad].sort((a, b) => b.goals - a.goals).slice(0, 4);
  const gd = team.gf - team.ga;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back to Teams
      </button>

      {/* Hero banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#1f262e] p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, ${team.colors.primary}33, #14181d 60%)` }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Crest team={team} size={88} />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl font-bold text-white">{team.name}</h1>
            <p className="mt-1 text-sm text-gray-400">{team.description}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              <span className="flex items-center gap-1.5 text-gray-300"><User size={15} className="text-gray-500" /> {team.manager}</span>
              <span className="flex items-center gap-1.5 text-gray-300"><MapPin size={15} className="text-gray-500" /> {team.stadium}</span>
              <span className="flex items-center gap-1.5 text-gray-300"><Calendar size={15} className="text-gray-500" /> Founded {team.founded}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Position</div>
            <div className="font-display text-4xl font-bold text-[#16c98d]">{team.position}</div>
            <div className="text-xs text-gray-500">{team.league}</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Played" value={team.played} icon={<TrendingUp size={18} />} />
        <StatCard label="Wins" value={team.won} icon={<TrendingUp size={18} />} accent />
        <StatCard label="Goals For" value={team.gf} icon={<TrendingUp size={18} />} />
        <StatCard label="Goal Diff" value={gd > 0 ? `+${gd}` : gd} icon={<TrendingUp size={18} />} />
      </div>

      {/* Form */}
      <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-gray-400">Recent Form</h3>
        <div className="flex gap-2">
          {team.form.map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <FormBadge result={r} />
              <span className="text-[9px] text-gray-600">GW{i + 1}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming fixtures */}
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Upcoming Fixtures</h3>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((m) => <MatchCard key={m.id} match={m} compact />)}
            </div>
          ) : (
            <EmptyState message="No upcoming fixtures" />
          )}
        </section>

        {/* Recent results */}
        <section>
          <h3 className="mb-3 font-display text-lg font-bold text-white">Recent Results</h3>
          {recent.length > 0 ? (
            <div className="space-y-3">
              {recent.map((m) => <MatchCard key={m.id} match={m} compact />)}
            </div>
          ) : (
            <EmptyState message="No recent results" />
          )}
        </section>
      </div>

      {/* Key players */}
      <section>
        <h3 className="mb-3 font-display text-lg font-bold text-white">Key Players</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {keyPlayers.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
              <div className="flex items-center gap-3">
                <PlayerAvatar player={p} size={44} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.position} · #{p.number}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                <div><div className="text-sm font-bold text-white">{p.appearances}</div><div className="text-[10px] text-gray-500">Apps</div></div>
                <div><div className="text-sm font-bold text-[#16c98d]">{p.goals}</div><div className="text-[10px] text-gray-500">Goals</div></div>
                <div><div className="text-sm font-bold text-gray-200">{p.assists}</div><div className="text-[10px] text-gray-500">Assists</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
