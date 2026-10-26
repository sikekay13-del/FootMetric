import type { Team } from '@/types';

interface CrestProps {
  team: Team;
  size?: number;
  className?: string;
}

/**
 * Stylized team crest rendered from the team's brand colors.
 * Generates a unique-looking badge per team using initials + color scheme.
 */
export function Crest({ team, size = 40, className = '' }: CrestProps) {
  const { primary, secondary } = team.colors;
  const id = `crest-${team.id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label={`${team.name} crest`}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={shade(primary, -25)} />
        </linearGradient>
      </defs>
      {/* Shield outline */}
      <path
        d="M50 4 L92 18 V52 C92 78 72 92 50 98 C28 92 8 78 8 52 V18 Z"
        fill={`url(#${id}-grad)`}
        stroke={secondary}
        strokeWidth="3"
      />
      {/* Inner band */}
      <path
        d="M50 12 L84 23 V52 C84 73 68 85 50 90 C32 85 16 73 16 52 V23 Z"
        fill="none"
        stroke={secondary}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Initials */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="30"
        fontWeight="800"
        fontFamily="'Barlow Condensed', sans-serif"
        fill={contrastColor(primary)}
      >
        {team.shortName.slice(0, 3)}
      </text>
    </svg>
  );
}

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0xff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function contrastColor(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0a0c0f' : '#ffffff';
}
