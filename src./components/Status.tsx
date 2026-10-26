import { AlertTriangle, RefreshCw } from 'lucide-react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />;
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4">
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const busy = /too many/i.test(message);
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 sm:flex-row sm:items-center">
      <AlertTriangle size={20} className="shrink-0 text-red-400" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-white">
          {busy ? 'The data service is busy' : "Couldn't load the data"}
        </div>
        <div className="text-xs text-gray-400">
          {busy
            ? 'The free plan allows 10 requests a minute. Wait a few seconds, then try again.'
            : message}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-[#16c98d] px-4 py-2 text-sm font-semibold text-[#0a0c0f] hover:bg-[#0fa871]"
        >
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </div>
  );
}