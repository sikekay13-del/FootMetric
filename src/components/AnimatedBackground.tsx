const LEFTS = [6, 18, 31, 44, 57, 69, 80, 91, 24, 62];

export function AnimatedBackground({ balls = 0 }: { balls?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="fm-grid absolute inset-0" />
      <div className="fm-blob fm-blob-a" />
      <div className="fm-blob fm-blob-b" />
      <div className="fm-blob fm-blob-c" />
      {Array.from({ length: balls }, (_, i) => (
        <span
          key={i}
          className="fm-ball"
          style={{
            left: `${LEFTS[i % LEFTS.length]}%`,
            animationDelay: `${i * -3.3}s`,
            animationDuration: `${16 + (i % 4) * 5}s`,
            fontSize: `${18 + (i % 3) * 10}px`,
          }}
        >
          ⚽
        </span>
      ))}
    </div>
  );
}