import { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Goal, Clock, Repeat, Flag, Trophy } from 'lucide-react';
import { Crest } from '@/components/Crest';
import { getMatch, getTeam } from '@/data/mock';
import { useNav } from '@/nav';
import type { MatchEvent } from '@/types';

type Tab = 'overview' | 'statistics' | 'lineups' | 'timeline';

export function MatchDetailsPage() {
  const { nav, navigate } = useNav();
  const [tab, setTab] = useState<Tab>('overview');
  const match = nav.matchId ? getMatch(nav.matchId) : undefined;

  if (!match) {
    return (
      <div className="py-12 text-center text-gray-500">
        Match not found.
        <button onClick={() => navigate('live')} className="ml-2 text-[#16c98d] hover:underline">Back to Live Scores</button>
      </div>
    );
  }

  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const live = match.status === 'LIVE' || match.status === 'HT';
  const upcoming = match.status === 'UPCOMING';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'lineups', label: 'Lineups' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('live')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back to Matches
      </button>

      {/* Score header */}
      <div className="overflow-hidden rounded-2xl border border-[#1f262e] bg-gradient-to-b from-[#181d23] to-[#14181d]">
        <div className="flex items-center justify-center gap-2 border-b border-[#1f262e] px-4 py-2.5 text-xs">
          <Trophy size={13} className="text-[#16c98d]" />
          <span className="font-semibold uppercase tracking-wider text-gray-400">{match.competition}</span>
        </div>

        <div className="px-4 py-8 sm:px-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-end">
              <div className="text-center sm:text-right">
                <div className="font-display text-lg font-bold text-white">{home.name}</div>
                <div className="text-xs text-gray-500">{home.shortName}</div>
              </div>
              <Crest team={home} size={64} />
            </div>

            {/* Score */}
            <div className="text-center">
              {upcoming ? (
                <div>
                  <div className="font-display text-2xl font-bold text-gray-300">{match.kickoff}</div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500">kickoff</div>
                </div>
              ) : (
                <div className="font-display text-5xl font-bold text-white sm:text-6xl">
                  {match.homeScore}<span className="mx-2 text-gray-600">:</span>{match.awayScore}
                </div>
              )}
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  live ? 'bg-red-500/15 text-red-400' : match.status === 'FT' ? 'bg-gray-700/40 text-gray-400' : 'bg-[#16c98d]/10 text-[#16c98d]'
                }`}>
                  {live && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse-dot" />}
                  {match.status === 'LIVE' ? `${match.minute}' LIVE` : match.status === 'HT' ? 'Half Time' : match.status === 'FT' ? 'Full Time' : 'Upcoming'}
                </span>
              </div>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-start">
              <Crest team={away} size={64} />
              <div className="text-center sm:text-left">
                <div className="font-display text-lg font-bold text-white">{away.name}</div>
                <div className="text-xs text-gray-500">{away.shortName}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {match.date}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} /> {match.kickoff}</span>
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {match.stadium}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#1f262e]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-[#16c98d] text-[#16c98d]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && <OverviewTab match={match} />}
      {tab === 'statistics' && <StatisticsTab match={match} />}
      {tab === 'lineups' && <LineupsTab match={match} />}
      {tab === 'timeline' && <TimelineTab match={match} />}
    </div>
  );
}

function OverviewTab({ match }: { match: NonNullable<ReturnType<typeof getMatch>> }) {
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const goals = match.events.filter((e) => e.type === 'goal');
  const cards = match.events.filter((e) => e.type === 'card');
  const subs = match.events.filter((e) => e.type === 'sub');

  const EventRow = ({ event }: { event: MatchEvent }) => {
    const team = event.team === 'home' ? home : away;
    const opp = event.team === 'home' ? away : home;
    return (
      <div className="flex items-center gap-3 py-2">
        {event.team === 'home' ? (
          <>
            <EventIcon type={event.type} />
            <div className="flex-1 text-right">
              <div className="text-sm font-medium text-white">{event.player}</div>
              {event.detail && <div className="text-xs text-gray-500">{event.detail}</div>}
            </div>
            <Crest team={team} size={24} />
            <span className="w-8 text-center text-sm font-bold text-gray-400">{event.minute}'</span>
            <div className="w-6" />
          </>
        ) : (
          <>
            <div className="w-6" />
            <span className="w-8 text-center text-sm font-bold text-gray-400">{event.minute}'</span>
            <Crest team={team} size={24} />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">{event.player}</div>
              {event.detail && <div className="text-xs text-gray-500">{event.detail}</div>}
            </div>
            <EventIcon type={event.type} />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {goals.length > 0 && (
        <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
            <Goal size={15} className="text-[#16c98d]" /> Goals
          </h3>
          <div className="divide-y divide-[#1f262e]">
            {goals.map((e, i) => <EventRow key={i} event={e} />)}
          </div>
        </section>
      )}

      {cards.length > 0 && (
        <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
            <Flag size={15} className="text-yellow-400" /> Cards
          </h3>
          <div className="divide-y divide-[#1f262e]">
            {cards.map((e, i) => <EventRow key={i} event={e} />)}
          </div>
        </section>
      )}

      {subs.length > 0 && (
        <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
          <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
            <Repeat size={15} className="text-blue-400" /> Substitutions
          </h3>
          <div className="divide-y divide-[#1f262e]">
            {subs.map((e, i) => <EventRow key={i} event={e} />)}
          </div>
        </section>
      )}

      {goals.length === 0 && cards.length === 0 && subs.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#1f262e] py-12 text-center text-sm text-gray-500">
          No events yet — match hasn't started.
        </div>
      )}
    </div>
  );
}

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  if (type === 'goal') return <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#16c98d]/15"><Goal size={14} className="text-[#16c98d]" /></div>;
  if (type === 'card') return <div className="h-5 w-3.5 rounded-sm bg-yellow-400" />;
  if (type === 'sub') return <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15"><Repeat size={14} className="text-blue-400" /></div>;
  return <div className="h-6 w-6" />;
}

function StatisticsTab({ match }: { match: NonNullable<ReturnType<typeof getMatch>> }) {
  if (match.stats.length === 0) {
    return <div className="rounded-xl border border-dashed border-[#1f262e] py-12 text-center text-sm text-gray-500">Statistics will be available once the match begins.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Crest team={getTeam(match.homeId)} size={32} />
          <span className="font-display text-sm font-bold uppercase tracking-wider text-gray-400">Match Stats</span>
          <Crest team={getTeam(match.awayId)} size={32} />
        </div>
        <div className="space-y-4">
          {match.stats.map((stat) => {
            const total = stat.home + stat.away || 1;
            const homePct = (stat.home / total) * 100;
            const awayPct = (stat.away / total) * 100;
            return (
              <div key={stat.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-bold text-white tabular-nums">{stat.home}</span>
                  <span className="text-xs font-medium text-gray-400">{stat.label}</span>
                  <span className="font-bold text-white tabular-nums">{stat.away}</span>
                </div>
                <div className="flex h-1.5 gap-1">
                  <div className="flex flex-1 justify-end">
                    <div className="h-full rounded-l-full bg-[#16c98d]" style={{ width: `${homePct}%` }} />
                  </div>
                  <div className="flex flex-1">
                    <div className="h-full rounded-r-full bg-gray-600" style={{ width: `${awayPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LineupsTab({ match }: { match: NonNullable<ReturnType<typeof getMatch>> }) {
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);

  if (match.lineups.home.starting.length === 0) {
    return <div className="rounded-xl border border-dashed border-[#1f262e] py-12 text-center text-sm text-gray-500">Lineups will be published before kickoff.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <LineupColumn team={home} formation={match.formation.home} lineup={match.lineups.home} />
        <LineupColumn team={away} formation={match.formation.away} lineup={match.lineups.away} />
      </div>
    </div>
  );
}

function LineupColumn({ team, formation, lineup }: {
  team: ReturnType<typeof getTeam>;
  formation: string;
  lineup: { starting: { name: string; number: number; position: string }[]; subs: { name: string; number: number; position: string }[] };
}) {
  return (
    <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
      <div className="mb-4 flex items-center gap-3 border-b border-[#1f262e] pb-3">
        <Crest team={team} size={36} />
        <div>
          <div className="font-display text-base font-bold text-white">{team.name}</div>
          <div className="text-xs text-gray-500">Formation: {formation}</div>
        </div>
      </div>

      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Starting XI</div>
      <div className="divide-y divide-[#1f262e]">
        {lineup.starting.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-xs font-bold text-gray-300">{p.number}</span>
            <span className="flex-1 text-sm text-white">{p.name}</span>
            <span className="text-[10px] text-gray-500">{p.position}</span>
          </div>
        ))}
      </div>

      <div className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Substitutes</div>
      <div className="divide-y divide-[#1f262e]">
        {lineup.subs.map((p, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-white/5 text-xs font-bold text-gray-300">{p.number}</span>
            <span className="flex-1 text-sm text-gray-400">{p.name}</span>
            <span className="text-[10px] text-gray-600">{p.position}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineTab({ match }: { match: NonNullable<ReturnType<typeof getMatch>> }) {
  const home = getTeam(match.homeId);
  const away = getTeam(match.awayId);
  const sorted = [...match.events].sort((a, b) => a.minute - b.minute);

  if (sorted.length === 0) {
    return <div className="rounded-xl border border-dashed border-[#1f262e] py-12 text-center text-sm text-gray-500">No events yet — timeline will populate as the match progresses.</div>;
  }

  return (
    <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
      <div className="relative">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[#1f262e]" />
        <div className="space-y-4">
          {sorted.map((event, i) => {
            const team = event.team === 'home' ? home : away;
            const isHome = event.team === 'home';
            return (
              <div key={i} className="relative flex items-center gap-4">
                {isHome ? (
                  <>
                    <div className="flex flex-1 items-center justify-end gap-2 text-right">
                      <div>
                        <div className="text-sm font-medium text-white">{event.player}</div>
                        <div className="text-xs text-gray-500">{event.type === 'goal' ? 'Goal' : event.type === 'card' ? 'Card' : 'Substitution'}{event.detail ? ` · ${event.detail}` : ''}</div>
                      </div>
                      <Crest team={team} size={24} />
                    </div>
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1f262e] bg-[#0d1115] text-xs font-bold text-[#16c98d]">
                      {event.minute}'
                    </div>
                    <div className="flex-1" />
                  </>
                ) : (
                  <>
                    <div className="flex-1" />
                    <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#1f262e] bg-[#0d1115] text-xs font-bold text-[#16c98d]">
                      {event.minute}'
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                      <Crest team={team} size={24} />
                      <div>
                        <div className="text-sm font-medium text-white">{event.player}</div>
                        <div className="text-xs text-gray-500">{event.type === 'goal' ? 'Goal' : event.type === 'card' ? 'Card' : 'Substitution'}{event.detail ? ` · ${event.detail}` : ''}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
