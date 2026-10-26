import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, User, Radio, Medal, GitCompare, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { useAuth } from '@/lib/auth';

type Mode = 'login' | 'signup';

const inputCls =
  'w-full rounded-lg border border-[#1f262e] bg-[#0d1115] py-3 pl-10 pr-10 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#16c98d]/60';

export function LoginPage({ onEntered }: { onEntered: () => void }) {
  const { login, signup, guest } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup' && password !== confirm) {
      setError('The two passwords do not match');
      return;
    }
    setBusy(true);
    const err = mode === 'login' ? await login(username, password) : await signup(username, password);
    setBusy(false);
    if (err) setError(err);
    else onEntered();
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0c0f] px-4 py-10">
      <AnimatedBackground balls={9} />

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="fm-shine text-center font-display text-3xl font-bold sm:text-4xl">Your football, live.</h1>
        <p className="mt-2 text-center text-sm text-gray-400">
          Scores, tables, fixtures and stats for the top leagues and the Champions League.
        </p>

        <div className="mt-7 rounded-2xl border border-[#1f262e] bg-[#14181d]/85 p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-black/30 p-1 text-sm font-semibold">
            {(['login', 'signup'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-md py-2 transition-colors ${
                  mode === m ? 'bg-[#16c98d] text-[#0a0c0f]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                className={inputCls}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#16c98d] py-3 text-sm font-bold text-[#0a0c0f] transition-colors hover:bg-[#0fa871] disabled:opacity-70"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-gray-600">
            <div className="h-px flex-1 bg-[#1f262e]" /> or <div className="h-px flex-1 bg-[#1f262e]" />
          </div>

          <button
            type="button"
            onClick={() => {
              guest();
              onEntered();
            }}
            className="w-full rounded-lg border border-[#1f262e] py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Continue as guest
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 rounded-full border border-[#1f262e] bg-[#14181d]/70 px-3 py-1.5">
            <Radio size={13} className="text-[#16c98d]" /> Live scores
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#1f262e] bg-[#14181d]/70 px-3 py-1.5">
            <Medal size={13} className="text-[#16c98d]" /> 6 competitions
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#1f262e] bg-[#14181d]/70 px-3 py-1.5">
            <GitCompare size={13} className="text-[#16c98d]" /> Compare players
          </span>
        </div>
        <p className="mt-4 text-center text-[11px] text-gray-600">Accounts are saved on this device.</p>
      </div>
    </div>
  );
}