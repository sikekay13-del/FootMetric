import { createContext, useContext } from 'react';
import type { PageId } from '@/types';

export interface NavOpts {
  matchId?: string;
  teamId?: string;
  league?: string;
}

export interface NavState extends NavOpts {
  page: PageId;
}

export interface NavContextValue {
  nav: NavState;
  navigate: (page: PageId, opts?: NavOpts) => void;
}

export const NavContext = createContext<NavContextValue | null>(null);

export const useNav = (): NavContextValue => {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavContext');
  return ctx;
};