import { Star } from 'lucide-react';
import { SectionHeader } from '@/components/UI';
import { useNav } from '@/nav';
import { useFavorites } from '@/lib/favorites';
import { kickoffTime, matchState, type FdMatch } from '@/lib/footballApi';

export function MyTeams({ matches }: { matches: FdMatch[] }) {
  const { navigate } = useNav();
  const { favs } = useFavorites();

  if (favs.length === 0) {
    return (
      <section>
        <SectionHeader title="My Teams" subtitle="Follow your favorite teams" />
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#1f262e] p-4 text-sm text-gray-500">
          <Star size={18} className="shrink-0 text-gray-600" />
          Open any team page and tap the star to follow it. Your teams show up here.
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader title="My Teams" subtitle="Latest result and next match" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {favs.map((f) => {
          const mine = matches
            .filter((m) => m.homeTeam.id === f.id || m.awayTeam.id === f.id)
            .sort((a, b) => a.utcDate.localeCompare(b.utcDate));
          const last = [...mine].reverse().find((m) => matchState(m) === 'finished');
          const next = mine.find((m) => ['upcoming', 'live'].includes(matchState(m)));

          const lastText = (() => {
            if (!last) return null;
            const home = last.homeTeam.id === f.id;
            const gf = (home ? last.score.fullTime.home : last.score.fullTime.away) ?? 0;
            const ga = (home ? last.score.fullTime.away : last.score.fullTime.home) ?? 0;
            const opp = home ? last.awayTeam : last.homeTeam;
            const r = gf > ga ? 'W' : gf === ga ? 'D' : 'L';
            return `${r} ${gf}-${ga} vs ${opp.shortName || opp.name}`;
          })();

          const nextText = (() => {
            if (!next) return null;
            const home = next.homeTeam.id === f.id;
            const opp = home ? next.awayTeam : next.homeTeam;
            const day = new Date(next.utcDate).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });
            return `${matchState(next) === 'live' ? 'LIVE vs ' : 'vs '}${opp.shortName || opp.name} - ${day}, ${kickoffTime(next)}`;
          })();

          return (
            <button
              key={f.id}
              onClick={() => navigate('teams', { teamId: String(f.id), league: f.league })}
              className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 text-left transition-colors hover:border-[#16c98d]/40"
            >
              <div className="mb-3 flex items-center gap-3">
                {f.crest && <img src={f.crest} alt="" className="h-9 w-9 object-contain" />}
                <span className="flex-1 truncate font-semibold text-white">{f.name}</span>
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="text-gray-500">
                  Last: <span className="text-gray-300">{lastText ?? 'no match in the last 3 days'}</span>
                </div>
                <div className="text-gray-500">
                  Next: <span className="text-gray-300">{nextText ?? 'nothing in the next 3 days'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}