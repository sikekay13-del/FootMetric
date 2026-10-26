import { useState } from 'react';
import { Radio } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/UI';
import { FdMatchCard } from '@/components/FdMatchCard';
import { addDays, matchesPath, matchState, ymd, type MatchesResponse } from '@/lib/footballApi';
import { useFd } from '@/lib/useFd';

type Filter = 'all' | 'live' | 'upcoming' | 'finished';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'finished', label: 'Finished' },
];

export function LiveScoresPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayKey = ymd(now);
  const path = matchesPath(addDays(now, -3), addDays(now, 3));
  const { data, loading, error, updatedAt } = useFd<MatchesResponse>(path, 55_000, 60_000);

  const today = (data?.matches ?? [])
    .filter((m) => ymd(new Date(m.utcDate)) === todayKey)
    .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  const matchesFor = (f: Filter) =>
    today.filter((m) => {
      const s = matchState(m);
      if (f === 'all') return true;
      if (f === 'live') return s === 'live';
      if (f === 'upcoming') return s === 'upcoming';
      return s === 'finished';
    });

  const filtered = matchesFor(filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Scores"
        subtitle="Today's matches."
        icon={<Radio size={22} />}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === f.id
                  ? 'bg-[#16c98d] text-[#0a0c0f]'
                  : 'border border-[#1f262e] bg-[#14181d] text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === f.id ? 'bg-black/20' : 'bg-white/10'
                }`}
              >
                {matchesFor(f.id).length}
              </span>
            </button>
          ))}
        </div>
        {updatedAt && (
          <span className="text-xs text-gray-500">Updated {updatedAt.toLocaleTimeString()}</span>
        )}
      </div>

      {loading && !data && <p className="text-sm text-gray-400">Loading matches...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {data && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <FdMatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
      {data && filtered.length === 0 && (
        <EmptyState message="No matches found for this filter today" />
      )}
    </div>
  );
}