export type PageId =
  | 'dashboard'
  | 'live'
  | 'fixtures'
  | 'table'
  | 'teams'
  | 'players'
  | 'match'
  | 'player'
  | 'champions'
  | 'compare';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  league: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  manager: string;
  stadium: string;
  founded: number;
  colors: { primary: string; secondary: string };
  form: ('W' | 'D' | 'L')[];
  description: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  number: number;
  age: number;
  nationality: string;
  appearances: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  minutes: number;
  rating: number;
}

export type MatchStatus = 'LIVE' | 'HT' | 'FT' | 'UPCOMING';

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'sub' | 'var' | 'penalty';
  team: 'home' | 'away';
  player: string;
  detail?: string;
}

export interface MatchStat {
  label: string;
  home: number;
  away: number;
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

export interface Match {
  id: string;
  competition: string;
  date: string;
  kickoff: string;
  stadium: string;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  minute?: number;
  events: MatchEvent[];
  stats: MatchStat[];
  formation: { home: string; away: string };
  lineups: {
    home: { starting: LineupPlayer[]; subs: LineupPlayer[] };
    away: { starting: LineupPlayer[]; subs: LineupPlayer[] };
  };
}
