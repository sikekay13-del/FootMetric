import { useState } from 'react';
import { Radio } from 'lucide-react';
import { MatchCard } from '@/components/MatchCard';
import { PageHeader, EmptyState } from '@/components/UI';
import { matches } from '@/data/mock';
import type { MatchStatus } from '@/types';

type Filter = 'all' | 'live' | 'upcoming' | 'finished';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'finished', label: 'Finished' },
];

export function LiveScoresPage() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = matches.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'LIVE' || m.status === 'HT';
    if (filter === 'upcoming') return m.status === 'UPCOMING';
    if (filter === 'finished') return m.status === 'FT';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Scores"
        subtitle="Real-time scores and match updates across all competitions"
        icon={<Radio size={22} />}
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.id === 'all'
              ? matches.length
              : f.id === 'live'
              ? matches.filter((m) => m.status === 'LIVE' || m.status === 'HT').length
              : f.id === 'upcoming'
              ? matches.filter((m) => m.status === 'UPCOMING').length
              : matches.filter((m) => m.status === 'FT').length;
          return (
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
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${filter === f.id ? 'bg-black/20' : 'bg-white/10'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <EmptyState message="No matches found for this filter" />
      )}
    </div>
  );
}
