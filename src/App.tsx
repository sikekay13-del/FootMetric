import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { Ticker } from '@/components/Ticker';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/lib/auth';
import { COMPETITIONS, LEAGUES, prefetch } from '@/lib/footballApi';
import { NavContext, type NavState, type NavOpts } from '@/nav';
import type { PageId } from '@/types';
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveScoresPage } from '@/pages/LiveScoresPage';
import { FixturesPage } from '@/pages/FixturesPage';
import { LeagueTablePage } from '@/pages/LeagueTablePage';
import { TeamsPage } from '@/pages/TeamsPage';
import { PlayersPage } from '@/pages/PlayersPage';
import { MatchPage } from '@/pages/MatchPage';
import { PlayerPage } from '@/pages/PlayerPage';
import { ChampionsPage } from '@/pages/ChampionsPage';
import { ComparePage } from '@/pages/ComparePage';
import { LoginPage } from '@/pages/LoginPage';

const TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  live: 'Live Scores',
  fixtures: 'Fixtures',
  table: 'League Table',
  teams: 'Teams',
  players: 'Players',
  match: 'Match',
  player: 'Player',
  champions: 'Champions League',
  compare: 'Compare Players',
};

const FOOTER_LINKS: { id: PageId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'live', label: 'Live Scores' },
  { id: 'fixtures', label: 'Fixtures' },
  { id: 'table', label: 'League Table' },
  { id: 'champions', label: 'Champions League' },
  { id: 'compare', label: 'Compare Players' },
];

function AppShell() {
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const baseTitle = useRef(document.title);
  const stack = useRef<{ state: NavState; scrollY: number }[]>([]);

  useEffect(() => {
    document.title = `${TITLES[nav.page]} - ${baseTitle.current}`;
  }, [nav.page]);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Quietly loads the league tables and scorers in the background
  useEffect(() => {
    const t = setTimeout(() => {
      prefetch([
        ...LEAGUES.map((l) => `/competitions/${l.code}/standings`),
        ...COMPETITIONS.map((c) => `/competitions/${c.code}/scorers?limit=30`),
        '/competitions/CL/standings',
      ]);
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const navigate = (page: PageId, opts?: NavOpts) => {
    if (page === nav.page && !opts) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    stack.current.push({ state: nav, scrollY: window.scrollY });
    if (stack.current.length > 40) stack.current.shift();
    setNav({ page, ...opts });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    const prev = stack.current.pop();
    if (!prev) {
      setNav({ page: 'dashboard' });
      return;
    }
    setNav(prev.state);
    setTimeout(() => window.scrollTo({ top: prev.scrollY, behavior: 'auto' }), 60);
  };

  const renderPage = () => {
    switch (nav.page) {
      case 'dashboard': return <DashboardPage />;
      case 'live': return <LiveScoresPage />;
      case 'fixtures': return <FixturesPage />;
      case 'table': return <LeagueTablePage />;
      case 'teams': return <TeamsPage />;
      case 'players': return <PlayersPage />;
      case 'match': return <MatchPage />;
      case 'player': return <PlayerPage />;
      case 'champions': return <ChampionsPage />;
      case 'compare': return <ComparePage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <NavContext.Provider value={{ nav, navigate, back }}>
      <div className="relative isolate flex min-h-screen bg-[#0a0c0f]">
        <AnimatedBackground />
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          {!online && (
            <div className="bg-orange-500/15 px-4 py-2 text-center text-xs text-orange-300">
              You're offline. Showing the last saved data.
            </div>
          )}
          <TopBar onMenuClick={() => setMenuOpen(true)} />
          <Ticker />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div
              className="mx-auto max-w-7xl animate-fade-in-up"
              key={`${nav.page}-${nav.matchId ?? ''}-${nav.teamId ?? ''}-${nav.league ?? ''}-${nav.playerId ?? ''}`}
            >
              {renderPage()}
            </div>
          </main>
          <footer className="border-t border-[#1f262e] bg-[#0d1115]/70 px-4 py-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="font-display text-base font-bold text-white">FootMetric</span>
                <span>Live football, simplified.</span>
              </div>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-500">
                {FOOTER_LINKS.map((l) => (
                  <button key={l.id} onClick={() => navigate(l.id)} className="hover:text-white">
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-600">© {new Date().getFullYear()} FootMetric</div>
            </div>
          </footer>
        </div>
      </div>
    </NavContext.Provider>
  );
}

function Gate() {
  const { user } = useAuth();
  const [splash, setSplash] = useState(false);

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), 2400);
    return () => clearTimeout(t);
  }, [splash]);

  if (!user) return <LoginPage onEntered={() => setSplash(true)} />;
  if (splash) return <SplashScreen name={user.displayName} />;
  return <AppShell />;
}

function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

export default App;