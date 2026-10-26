interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  trend?: string;
}

export function StatCard({ label, value, icon, accent, trend }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        accent
          ? 'border-[#16c98d]/30 bg-gradient-to-br from-[#16c98d]/10 to-transparent'
          : 'border-[#1f262e] bg-[#14181d]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <span className={accent ? 'text-[#16c98d]' : 'text-gray-600'}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-white">{value}</div>
      {trend && <div className="mt-1 text-[11px] text-gray-500">{trend}</div>}
    </div>
  );
}

export function SectionHeader({
  title, subtitle, action,
}: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title, subtitle, icon,
}: { title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      {icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#16c98d]/10 text-[#16c98d]">
          {icon}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#1f262e] py-12 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
