import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/UI';
import { FdMatchCard } from '@/components/FdMatchCard';
import { LEAGUES, addDays, matchesPath, ymd, type MatchesResponse } from '@/lib/footballApi';
import { useFd } from '@/lib/useFd';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function FixturesPage() {
  const [windowStart, setWindowStart] = useState(() => addDays(startOfToday(), -2));
  const [selected, setSelected] = useState(() => ymd(startOfToday()));
  const [competition, setCompetition] = useState('All');

  const days = Array.from({ length: 5 }, (_, i) => addDays(windowStart, i));
  const path = matchesPath(addDays(windowStart, -1), addDays(windowStart, 6));
  const { data, loading, error, updatedAt } = useFd<MatchesResponse>(path, 60_000, 120_000);

  const shift = (n: number) => {
    const next = addDays(windowStart, n);
    setWindowStart(next);
    setSelected(ymd(addDays(next, 2)));
  };

  const dayMatches = (data?.matches ?? [])
    .filter(
      (m) =>
        ymd(new Date(m.utcDate)) === selected &&
        (competition === 'All' || m.competition.code === competition),
    )
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixtures"
        subtitle="Real fixtures and results for the top 5 leagues"
        icon={<CalendarDays size={22} />}
      />

      {/* Date navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => shift(-5)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {days.map((d) => {
            const key = ymd(d);
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex shrink-0 flex-col items-center rounded-lg px-4 py-2 transition-all ${
                  selected === key
                    ? 'bg-[#16c98d] text-[#0a0c0f]'
                    : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase opacity-70">
                  {d.toLocaleDateString('en-US', { month: 'short' })}
                </span>
                <span className="font-display text-sm font-bold">
                  {d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => shift(5)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* League filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[{ code: 'All', name: 'All' }, ...LEAGUES].map((l) => (
            <button
              key={l.code}
              onClick={() => setCompetition(l.code)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                competition === l.code
                  ? 'border border-[#16c98d]/30 bg-[#16c98d]/15 text-[#16c98d]'
                  : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
        {updatedAt && (
          <span className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString()}</span>
        )}
      </div>

      {loading && !data && <p className="text-sm text-gray-400">Loading fixtures...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {data && dayMatches.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dayMatches.map((m) => (
            <FdMatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
      {data && dayMatches.length === 0 && <EmptyState message="No fixtures for this date" />}
    </div>
  );
}