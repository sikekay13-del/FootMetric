import { AnimatedBackground } from '@/components/AnimatedBackground';

export function SplashScreen({ name }: { name: string }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-[#0a0c0f] px-4 text-center">
      <AnimatedBackground balls={5} />
      <div className="fm-bounce-wrap">
        <span className="fm-bounce-ball">⚽</span>
        <span className="fm-bounce-shadow" />
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-white">Welcome, {name}</div>
        <div className="mt-1 text-sm text-gray-400">Warming up the pitch...</div>
      </div>
      <div className="fm-progress">
        <span />
      </div>
    </div>
  );
}