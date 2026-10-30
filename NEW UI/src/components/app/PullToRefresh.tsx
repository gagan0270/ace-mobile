import { useRef, useState, type ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const THRESHOLD = 70;
const MAX = 120;

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const canStart = () =>
    (window.scrollY || document.documentElement.scrollTop || 0) <= 0 && !refreshing;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!canStart()) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    // resistance
    const damped = Math.min(MAX, dy * 0.5);
    setPull(damped);
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(1, pull / THRESHOLD);
  const active = pull > 0 || refreshing;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        aria-hidden={!active}
        className={cn(
          "pointer-events-none fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: 12,
          transform: `translate(-50%, ${Math.max(0, pull - 40)}px)`,
        }}
      >
        <div className="w-10 h-10 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowDown
              className="w-4 h-4 transition-transform"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${refreshing ? 40 : pull * 0.6}px)`,
          transition: startY.current == null ? "transform 240ms ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
