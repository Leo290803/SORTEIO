import { useEffect, useRef, useState } from "react";

interface SlotReelProps {
  names: string[];
  spinning: boolean;
  finalName: string | null;
  finalSchool?: string | null;
  /** Duração total do giro antes de parar, em ms. Default 1100. */
  duration?: number;
}

/**
 * Efeito cassino: nomes rolando rapidamente, desaceleram e param no nome final.
 */
export const SlotReel = ({ names, spinning, finalName, finalSchool, duration = 1100 }: SlotReelProps) => {
  const [current, setCurrent] = useState(names[0] ?? "");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!spinning) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (finalName) setCurrent(finalName);
      return;
    }

    let speed = 30;
    let elapsed = 0;
    const total = duration;
    let last = performance.now();

    const tick = () => {
      const idx = Math.floor(Math.random() * names.length);
      setCurrent(names[idx] ?? "");
      const now = performance.now();
      const dt = now - last;
      last = now;
      elapsed += dt;

      // Easing: speed decreases as we approach end
      const progress = Math.min(elapsed / total, 1);
      speed = 25 + progress * progress * 200; // 25ms -> 225ms

      if (intervalRef.current) window.clearTimeout(intervalRef.current);
      intervalRef.current = window.setTimeout(tick, speed);
    };

    intervalRef.current = window.setTimeout(tick, speed);

    return () => {
      if (intervalRef.current) window.clearTimeout(intervalRef.current);
    };
  }, [spinning, names, finalName, duration]);

  const settled = !spinning && finalName;

  return (
    <div
      className={`relative mx-auto w-full max-w-3xl rounded-2xl border-2 overflow-hidden transition-all duration-500 ${
        settled
          ? "border-accent shadow-gold animate-glow-pulse"
          : "border-primary/40 shadow-glow"
      }`}
    >
      {/* Top/bottom fade */}
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />

      <div className="bg-card/90 px-6 py-12 md:py-16 grid place-items-center min-h-[180px] md:min-h-[220px]">
        <div className="w-full">
          <div
            key={settled ? "settled" : current}
            className={`font-display font-bold text-center leading-tight break-words ${
              settled
                ? "text-4xl md:text-6xl lg:text-7xl text-accent text-glow-gold animate-winner-pop"
                : "text-3xl md:text-5xl text-foreground"
            }`}
          >
            {settled ? finalName : current}
          </div>
          {settled && finalSchool && (
            <div className="text-sm md:text-lg text-muted-foreground mt-3 font-medium">
              {finalSchool}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
