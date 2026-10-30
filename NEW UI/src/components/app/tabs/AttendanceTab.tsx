import { useState } from "react";
import { CalendarDays, Flame, Hourglass, X, CheckCircle2, XCircle, UserX } from "lucide-react";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { SkeletonCard, EmptyState } from "../Skeleton";
import { cn } from "@/lib/utils";

const present = 142;
const total = 168;
const absent = total - present - 0; // just present + absent from working days accounted so far
const workedSoFar = 154;
const absentCount = workedSoFar - present; // 12
const pct = Math.round((present / total) * 100);
const target = 90;

type DayEntry = {
  day: number;
  date: string;
  status: "present" | "absent";
  checkIn?: string;
  checkOut?: string;
  note?: string;
};

const dayLog: DayEntry[] = Array.from({ length: 14 }).map((_, i) => {
  const day = 14 - i;
  const isAbsent = i === 3 || i === 9;
  return {
    day,
    date: `${String(day).padStart(2, "0")} Aug 2025`,
    status: isAbsent ? "absent" : "present",
    checkIn: isAbsent ? undefined : "08:12 AM",
    checkOut: isAbsent ? undefined : "03:22 PM",
    note: isAbsent ? "Marked absent by class teacher. Reason not filed." : "Full day attended.",
  };
});

export function AttendanceTab() {
  const loading = useSimulatedLoading();
  const [selected, setSelected] = useState<DayEntry | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-4 gap-2">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (dayLog.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-5 h-5" />}
        title="No attendance logged yet"
        description="Attendance will appear here as soon as your school starts syncing daily records."
      />
    );
  }

  const radius = 78;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;
  void absent;

  return (
    <div className="space-y-4">
      <section className="bg-card rounded-[28px] p-6 shadow-sm flex flex-col items-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Attendance
        </div>
        <div className="relative mt-4 w-[200px] h-[200px]">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r={radius} stroke="var(--color-accent)" strokeWidth="14" fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="var(--color-foreground)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[44px] font-extrabold leading-none tabular-nums">
              {pct}
              <span className="text-[22px] align-top">%</span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground font-medium">
              {present} / {total} working days
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-2">
        <MetricCard icon={CalendarDays} label="Present" value={String(present)} />
        <MetricCard
          icon={UserX}
          label="Absent"
          value={String(absentCount)}
          tone="danger"
        />
        <MetricCard icon={Flame} label="Streak" value="14d" />
        <MetricCard icon={Hourglass} label="Left" value="26" />
      </div>

      <section className="bg-card rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Active Ratio
            </div>
            <div className="mt-1 text-[15px] font-extrabold">
              {pct}% <span className="text-muted-foreground font-semibold">/ {target}% target</span>
            </div>
          </div>
          <div className="text-[12px] font-semibold text-[oklch(0.45_0.15_155)]">On track</div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-accent overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-foreground transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/40"
            style={{ left: `${target}%` }}
            aria-hidden
          />
        </div>
      </section>

      <section className="bg-card rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[15px] font-extrabold">Daily Log History</div>
          <div className="text-[11px] text-muted-foreground">Tap a day for details</div>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-none">
          {dayLog.map((entry) => {
            const isActive = selected?.day === entry.day;
            return (
              <button
                key={entry.day}
                onClick={() => setSelected(entry)}
                className={cn(
                  "min-w-[52px] rounded-2xl py-3 flex flex-col items-center border transition",
                  isActive
                    ? "bg-foreground text-background border-transparent"
                    : "bg-background border-border/60 hover:border-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] uppercase tracking-wider",
                    isActive ? "text-background/70" : "text-muted-foreground",
                  )}
                >
                  Day
                </div>
                <div className="text-[15px] font-extrabold mt-0.5">{entry.day}</div>
                <div
                  className={cn(
                    "mt-2 w-2 h-2 rounded-full",
                    entry.status === "present"
                      ? "bg-[oklch(0.65_0.16_155)]"
                      : "bg-[oklch(0.65_0.18_25)]",
                  )}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">
          Attendance logs update automatically once synced from school.
        </p>
      </section>

      {selected && <DayDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DayDetail({ entry, onClose }: { entry: DayEntry; onClose: () => void }) {
  const present = entry.status === "present";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[400px] bg-background rounded-[28px] p-5 shadow-xl relative animate-in slide-in-from-bottom-4 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {entry.date}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {present ? (
            <CheckCircle2 className="w-5 h-5 text-[oklch(0.55_0.16_155)]" />
          ) : (
            <XCircle className="w-5 h-5 text-[oklch(0.6_0.18_25)]" />
          )}
          <div className="text-[20px] font-extrabold">
            {present ? "Present" : "Absent"}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <DetailRow label="Check In" value={entry.checkIn ?? "—"} />
          <DetailRow label="Check Out" value={entry.checkOut ?? "—"} />
          <DetailRow label="Session" value={present ? "Full day" : "Not attended"} />
        </div>

        {entry.note && (
          <div className="mt-4 p-3 rounded-2xl bg-card text-[12.5px] text-muted-foreground leading-relaxed">
            {entry.note}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="text-[13.5px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div
      className={cn(
        "bg-card rounded-[20px] p-3 shadow-sm",
        tone === "danger" && "bg-[oklch(0.97_0.04_25)] dark:bg-[oklch(0.28_0.06_25)]",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          tone === "danger"
            ? "bg-[oklch(0.85_0.15_25)] text-[oklch(0.28_0.1_25)]"
            : "bg-background",
        )}
      >
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="mt-2 text-[18px] font-extrabold leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
