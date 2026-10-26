import { useEffect, useRef, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { SplashScreen } from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/lib/auth';
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

function AppShell() {
  const [nav, setNav] = useState<NavState>({ page: 'dashboard' });
  const [menuOpen, setMenuOpen] = useState(false);
  const baseTitle = useRef(document.title);

  useEffect(() => {
    document.title = `${TITLES[nav.page]} - ${baseTitle.current}`;
  }, [nav.page]);

  const navigate = (page: PageId, opts?: NavOpts) => {
    setNav({ page, ...opts });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <NavContext.Provider value={{ nav, navigate }}>
      <div className="relative isolate flex min-h-screen bg-[#0a0c0f]">
        <AnimatedBackground />
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div
              className="mx-auto max-w-7xl animate-fade-in-up"
              key={`${nav.page}-${nav.matchId ?? ''}-${nav.teamId ?? ''}-${nav.league ?? ''}-${nav.playerId ?? ''}`}
            >
              {renderPage()}
            </div>
          </main>
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