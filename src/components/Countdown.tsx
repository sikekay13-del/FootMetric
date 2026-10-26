import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function Countdown({ to, label }: { to: string; label: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const diff = new Date(to).getTime() - now;
  const mins = Math.max(0, Math.floor(diff / 60_000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  const text = diff <= 0 ? 'Kicking off now' : d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#1f262e] bg-[#14181d] px-4 py-3">
      <Clock size={18} className="text-[#16c98d]" />
      <div className="text-sm text-gray-400">
        Next match {label} in <span className="font-bold text-white">{text}</span>
      </div>
    </div>
  );
}