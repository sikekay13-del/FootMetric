export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-lg object-contain" />
      <div className="font-display text-lg font-bold leading-none tracking-tight text-white">
       FootMetric 
      </div>
    </div>
  );
}