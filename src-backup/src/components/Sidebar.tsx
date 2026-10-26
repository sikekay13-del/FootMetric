import { useState } from 'react';
import {
  LayoutDashboard, Radio, CalendarDays, ListOrdered, Shield,
  Users, Search, Bell, User, Menu, X, Trophy,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useNav } from '@/nav';
import { LEAGUES } from '@/lib/footballApi';
import type { PageId } from '@/types';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'live', label: 'Live Scores', icon: Radio },
  { id: 'fixtures', label: 'Fixtures', icon: CalendarDays },
  { id: 'table', label: 'League Table', icon: ListOrdered },
  { id: 'teams', label: 'Teams', icon: Shield },
  { id: 'players', label: 'Players', icon: Users },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { nav, navigate } = useNav();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleNav = (page: PageId) => {
    navigate(page);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-[#1f262e] bg-[#0d1115] transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#1f262e] px-5">
          <Logo />
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4">
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Menu
          </div>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = nav.page === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNav(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#16c98d]/10 text-[#16c98d] border-l-2 border-[#16c98d]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Competitions
          </div>
          <ul className="space-y-1">
            {LEAGUES.map((l) => {
              const active = nav.page === 'table' && (nav.league ?? 'PL') === l.code;
              return (
                <li key={l.code}>
                  <button
                    onClick={() => {
                      navigate('table', { league: l.code });
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-[#16c98d]/10 text-[#16c98d]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Trophy size={15} className={active ? 'text-[#16c98d]' : 'text-gray-600'} />
                    {l.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-[#1f262e] p-4">
          <div className="rounded-lg bg-gradient-to-br from-[#16c98d]/15 to-transparent p-3">
            <div className="text-xs font-semibold text-white">Go Premium</div>
            <div className="mt-1 text-[11px] text-gray-400">Unlock advanced stats & insights</div>
            <button
              onClick={() => setShowUpgrade(true)}
              className="mt-2 w-full rounded-md bg-[#16c98d] py-1.5 text-xs font-semibold text-[#0a0c0f] hover:bg-[#0fa871] transition-colors"
            >
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-[#1f262e] bg-[#14181d] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-bold text-white">Premium is coming soon</div>
            <p className="mt-2 text-sm text-gray-400">
              Advanced stats and insights aren't available yet. Stay tuned!
            </p>
            <button
              onClick={() => setShowUpgrade(false)}
              className="mt-4 rounded-md bg-[#16c98d] px-4 py-2 text-sm font-semibold text-[#0a0c0f]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { navigate } = useNav();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#1f262e] bg-[#0a0c0f]/90 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="hidden sm:flex items-center text-sm text-gray-500">
        <button onClick={() => navigate('dashboard')} className="hover:text-white">
          Home
        </button>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Search teams, players..."
                className="w-44 sm:w-64 rounded-lg border border-[#1f262e] bg-[#14181d] py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#16c98d]/50 sm:w-72"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Notifications */}
      <button
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#16c98d]" />
      </button>

      {/* Profile */}
      <button
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        aria-label="Profile"
      >
        <User size={18} />
      </button>
    </header>
  );
}