import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
  username: string;
  displayName: string;
  guest?: boolean;
}

interface StoredUser {
  username: string;
  displayName: string;
  salt: string;
  hash: string;
  createdAt: number;
}

interface AuthValue {
  user: AuthUser | null;
  signup: (username: string, password: string) => Promise<string | null>;
  login: (username: string, password: string) => Promise<string | null>;
  guest: () => void;
  logout: () => void;
}

const USERS_KEY = 'fm-users';
const SESSION_KEY = 'fm-session';
const enc = new TextEncoder();

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(bits);
}

function newSalt(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): boolean {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

function readSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readSession);

  const start = useCallback((u: AuthUser) => {
    setUser(u);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    } catch {
      /* ignore */
    }
  }, []);

  const signup = useCallback(
    async (username: string, password: string) => {
      const name = username.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
        return 'Username must be 3-20 letters, numbers or underscores';
      }
      if (password.length < 6) return 'Password must be at least 6 characters';
      const key = name.toLowerCase();
      const users = readUsers();
      if (users.some((u) => u.username === key)) return 'That username is already taken';
      try {
        const salt = newSalt();
        const hash = await hashPassword(password, salt);
        const ok = writeUsers([
          ...users,
          { username: key, displayName: name, salt, hash, createdAt: Date.now() },
        ]);
        if (!ok) return "Your browser couldn't save the account (private mode?)";
        start({ username: key, displayName: name });
        return null;
      } catch {
        return 'Secure sign up is blocked here. Open the site from localhost.';
      }
    },
    [start],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const key = username.trim().toLowerCase();
      if (!key || !password) return 'Enter your username and password';
      const found = readUsers().find((u) => u.username === key);
      if (!found) return 'Wrong username or password';
      try {
        const hash = await hashPassword(password, found.salt);
        if (hash !== found.hash) return 'Wrong username or password';
        start({ username: found.username, displayName: found.displayName });
        return null;
      } catch {
        return 'Secure login is blocked here. Open the site from localhost.';
      }
    },
    [start],
  );

  const guest = useCallback(() => {
    start({ username: 'guest', displayName: 'Guest', guest: true });
  }, [start]);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return <AuthContext.Provider value={{ user, signup, login, guest, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}