import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNav } from '@/nav';
import { useFd } from '@/lib/useFd';
import { COMPETITIONS, LEAGUES, type FdTeam } from '@/lib/footballApi';

interface ScorersResponse {
  scorers: {
    player: {
      id: number;
      name: string;
      dateOfBirth?: string | null;
      nationality?: string | null;
      position?: string | null;
      shirtNumber?: number | null;
    };
    team: FdTeam;
    playedMatches: number | null;
    goals: number | null;
    assists?: number | null;
    penalties?: number | null;
  }[];
}

interface WikiInfo {
  photo?: string;
  bio?: string;
  url?: string;
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

async function loadWiki(name: string, dob: string | null): Promise<WikiInfo> {
  const cacheKey = 'wiki:' + name;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) return JSON.parse(raw) as WikiInfo;
  } catch {
    /* ignore */
  }

  let info: WikiInfo = {};
  try {
    const sr = await fetch(
      'https://en.wikipedia.org/w/rest.php/v1/search/page?limit=6&q=' +
        encodeURIComponent(name + ' footballer'),
    );
    if (sr.ok) {
      const sj = await sr.json();
      const pages: { key: string; title: string; description?: string | null }[] = sj.pages ?? [];
      const last = norm(name.split(' ').slice(-1)[0]);
      const year = dob ? dob.slice(0, 4) : '';
      const hit = pages.find((p) => {
        const d = p.description ?? '';
        if (!/football|soccer/i.test(d)) return false;
        if (!norm(p.title).includes(last)) return false;
        const born = d.match(/born (\d{4})/);
        if (year && born && born[1] !== year) return false;
        return true;
      });
      if (hit) {
        const rr = await fetch(
          'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(hit.key),
        );
        if (rr.ok) {
          const rj = await rr.json();
          info = {
            photo: rj.thumbnail?.source ?? rj.originalimage?.source,
            bio: rj.extract,
            url: rj.content_urls?.desktop?.page,
          };
        }
      }
    }
  } catch {
    /* ignore, we just show no bio */
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(info));
  } catch {
    /* ignore */
  }
  return info;
}

function ageOf(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export function PlayerPage() {
  const { nav, navigate } = useNav();
  const league = nav.league ?? 'PL';
  const { data, loading, error } = useFd<ScorersResponse>(
    `/competitions/${league}/scorers?limit=30`,
    600_000,
  );

  const list = data?.scorers ?? [];
  const idx = list.findIndex((s) => String(s.player.id) === nav.playerId);
  const entry = idx >= 0 ? list[idx] : undefined;
  const name = entry?.player.name;
  const dob = entry?.player.dateOfBirth ?? null;

  const [wiki, setWiki] = useState<WikiInfo | null>(null);

  useEffect(() => {
    if (!name) return;
    let cancelled = false;
    setWiki(null);
    loadWiki(name, dob).then((info) => {
      if (!cancelled) setWiki(info);
    });
    return () => {
      cancelled = true;
    };
  }, [name, dob]);

  const back = () =>
    nav.from && nav.from !== 'player' ? navigate(nav.from) : navigate('players', { league });

  const compName = COMPETITIONS.find((c) => c.code === league)?.name ?? '';
  const age = ageOf(dob);
  const goals = entry?.goals ?? 0;
  const games = entry?.playedMatches ?? 0;
  const teamClickable = LEAGUES.some((l) => l.code === league);

  const stat = (label: string, value: string | number, accent?: boolean) => (
    <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
      <div className="text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${accent ? 'text-[#16c98d]' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <button onClick={back} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft size={16} /> Back
      </button>

      {loading && !data && <p className="text-sm text-gray-400">Loading player...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {data && !entry && (
        <p className="text-sm text-gray-500">
          Player not found in the current {compName} top scorers list.
        </p>
      )}

      {entry && (
        <>
          <div className="overflow-hidden rounded-2xl border border-[#1f262e] bg-gradient-to-br from-[#16c98d]/10 to-[#14181d] p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
              {wiki?.photo ? (
                <img
                  src={wiki.photo}
                  alt=""
                  className="h-28 w-28 rounded-full border-2 border-[#16c98d]/40 object-cover object-top"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-[#16c98d]/40 bg-[#14181d] font-display text-3xl font-bold text-[#16c98d]">
                  {initials(entry.player.name)}
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-display text-3xl font-bold text-white">{entry.player.name}</h1>
                <button
                  disabled={!teamClickable}
                  onClick={() =>
                    navigate('teams', { teamId: String(entry.team.id), league })
                  }
                  className="mt-2 inline-flex items-center gap-2 text-sm text-gray-300 disabled:cursor-default"
                >
                  <img src={entry.team.crest} alt="" className="h-5 w-5 object-contain" />
                  {entry.team.name}
                </button>
                <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-gray-400 sm:justify-start">
                  {entry.player.position && <span>{entry.player.position}</span>}
                  {entry.player.nationality && <span>{entry.player.nationality}</span>}
                  {age !== null && <span>{age} years old</span>}
                  {entry.player.shirtNumber ? <span>#{entry.player.shirtNumber}</span> : null}
                </div>
                {dob && (
                  <div className="mt-1 text-xs text-gray-500">
                    Born{' '}
                    {new Date(dob).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-gray-500">{compName}</div>
                <div className="font-display text-4xl font-bold text-[#16c98d]">#{idx + 1}</div>
                <div className="text-xs text-gray-500">in the scorers list</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stat('Goals', goals, true)}
            {stat('Games', games || '-')}
            {stat('Assists', entry.assists ?? '-')}
            {stat('Goals per game', games ? (goals / games).toFixed(2) : '-')}
          </div>

          {wiki?.bio && (
            <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
              <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
                About
              </h3>
              <p className="text-sm leading-relaxed text-gray-300">{wiki.bio}</p>
              {wiki.url && (
                <a
                  href={wiki.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-xs text-[#16c98d] hover:underline"
                >
                  Source: Wikipedia
                </a>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}