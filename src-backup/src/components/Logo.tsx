export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Football Dashboard logo">
        <defs>
          <linearGradient id="fd-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#16c98d" />
            <stop offset="100%" stopColor="#0a8f5f" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="#14181d" stroke="#1f262e" strokeWidth="1" />
        <circle cx="24" cy="24" r="14" fill="url(#fd-grad)" />
        <circle cx="24" cy="24" r="14" fill="none" stroke="#0a0c0f" strokeWidth="1" opacity="0.3" />
        {/* Football pentagon pattern */}
        <polygon points="24,18 28,21 26.5,25.5 21.5,25.5 20,21" fill="#0a0c0f" />
        <path d="M24 18 L24 10 M28 21 L34 19 M26.5 25.5 L31 30 M21.5 25.5 L17 30 M20 21 L14 19"
          stroke="#0a0c0f" strokeWidth="1.2" opacity="0.6" fill="none" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-lg font-bold tracking-wide text-white">
          FOOTBALL
        </div>
        <div className="font-display text-[11px] font-semibold tracking-[0.25em] text-[#16c98d] -mt-0.5">
          DASHBOARD
        </div>
      </div>
    </div>
  );
}
