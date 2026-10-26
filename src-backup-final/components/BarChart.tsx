export interface Bar {
  label: string;
  value: number;
  crest?: string;
}

export function BarChart({ title, data }: { title: string; data: Bar[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <section className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-5">
      <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h3>
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className="flex items-center gap-3">
            <div className="flex w-28 items-center gap-2 sm:w-40">
              {d.crest && <img src={d.crest} alt="" className="h-5 w-5 object-contain" />}
              <span className="truncate text-xs text-gray-300">{d.label}</span>
            </div>
            <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
              <div
                className="h-full rounded bg-[#16c98d] transition-all"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm font-bold text-white">{d.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}