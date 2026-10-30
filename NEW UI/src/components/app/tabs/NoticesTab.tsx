import { useState } from "react";
import { Phone, X, Megaphone, AlertTriangle, Pin } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { SkeletonCard, EmptyState } from "../Skeleton";
import { cn } from "@/lib/utils";

type Notice = {
  id: string;
  title: string;
  snippet: string;
  date: string; // e.g. "18 Aug 2025"
  pinned?: boolean;
  alert?: boolean;
};

const notices: Notice[] = [
  {
    id: "n0",
    title: "Ms. Anitha R. — Please call back",
    snippet:
      "Regarding Gagan's incomplete Mathematics assignment submitted yesterday. It'll take just 5 minutes.",
    date: "19 Aug 2025",
    pinned: true,
    alert: true,
  },
  {
    id: "n1",
    title: "Annual Sports Day — 24 Aug",
    snippet:
      "House captains report to the ground by 7:30 AM. Full sports uniform mandatory. Water bottles labelled.",
    date: "18 Aug 2025",
  },
  {
    id: "n2",
    title: "PTA meeting rescheduled",
    snippet:
      "The parent-teacher meeting originally scheduled for Saturday has been moved to next Monday, 4:00 PM.",
    date: "15 Aug 2025",
  },
  {
    id: "n3",
    title: "Science project submission",
    snippet:
      "Grade 8 students must submit their working-model reports by end of week. Late entries won't be graded.",
    date: "12 Aug 2025",
  },
  {
    id: "n4",
    title: "Library book returns",
    snippet: "All borrowed books to be returned before term break to avoid a ₹20/day fine.",
    date: "09 Aug 2025",
  },
];

function parseDate(d: string) {
  const [day, mon, year] = d.split(" ");
  return { day, mon: mon.toUpperCase(), year };
}

export function NoticesTab() {
  const loading = useSimulatedLoading();
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="w-5 h-5" />}
        title="No notices yet"
        description="You'll see school announcements and teacher messages here as soon as they're posted."
      />
    );
  }

  const visible = notices.filter((n) => !dismissed.includes(n.id));
  const pinned = visible.filter((n) => n.pinned);
  const others = visible.filter((n) => !n.pinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-2 bg-card rounded-full px-3 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.16_155)] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.65_0.16_155)]" />
          </span>
          <span className="text-[12px] font-semibold">Live · Grade 8 · Section B</span>
        </div>
        <span className="text-[12px] text-muted-foreground font-semibold">
          {visible.length} notices
        </span>
      </div>

      {pinned.length > 0 && (
        <section className="space-y-3">
          {pinned.map((n) => (
            <NoticeCard
              key={n.id}
              notice={n}
              onDismiss={() => setDismissed((d) => [...d, n.id])}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        {others.map((n) => (
          <NoticeCard key={n.id} notice={n} />
        ))}
      </section>
    </div>
  );
}

function NoticeCard({
  notice: n,
  onDismiss,
}: {
  notice: Notice;
  onDismiss?: () => void;
}) {
  const d = parseDate(n.date);
  return (
    <article
      className={cn(
        "relative rounded-[24px] p-4 shadow-sm flex gap-3 transition",
        n.alert
          ? "bg-[oklch(0.97_0.03_60)] dark:bg-[oklch(0.28_0.05_60)] border border-[oklch(0.85_0.1_60)]/50"
          : "bg-card hover:bg-accent/60",
      )}
    >
      {n.pinned && (
        <div className="absolute -top-2 -left-2 bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1 shadow">
          <Pin className="w-3 h-3" strokeWidth={2.5} />
          PINNED
        </div>
      )}

      {/* Highlighted date block */}
      <div
        className={cn(
          "shrink-0 rounded-2xl w-14 flex flex-col items-center justify-center py-2 leading-none",
          n.alert
            ? "bg-[oklch(0.85_0.15_60)] text-[oklch(0.25_0.1_60)]"
            : "bg-foreground text-background",
        )}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
          {d.mon}
        </div>
        <div className="text-[26px] font-black tabular-nums mt-0.5">{d.day}</div>
        <div className="text-[9px] font-semibold opacity-70 mt-0.5">{d.year}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 pr-6">
          {n.alert && (
            <AlertTriangle
              className="w-4 h-4 text-[oklch(0.55_0.18_60)] shrink-0"
              strokeWidth={2.4}
            />
          )}
          <h3 className="text-[14px] font-extrabold text-foreground truncate">
            {n.title}
          </h3>
        </div>
        <p className="mt-1 text-[12.5px] text-foreground/70 leading-relaxed line-clamp-2">
          {n.snippet}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {n.alert && <Pill tone="danger">Alert</Pill>}
          {n.alert && (
            <button className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-foreground text-background text-[11.5px] font-semibold hover:opacity-90 transition">
              <Phone className="w-3 h-3" strokeWidth={2.4} />
              Call
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-foreground/10"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </article>
  );
}
