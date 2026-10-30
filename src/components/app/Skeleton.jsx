import { cn } from "../../lib/utils.js";
import { AlertTriangle, RotateCcw } from "lucide-react";

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-muted/70 dark:bg-muted/40",
        className
      )}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <section className="bg-card rounded-[28px] p-5 shadow-sm space-y-3 border border-border/40">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <div className="pt-2 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </section>
  );
}

export function EmptyState({ title, description, icon, action }) {
  return (
    <section className="bg-card rounded-[28px] p-8 shadow-sm flex flex-col items-center text-center border border-border/40 animate-in fade-in zoom-in-95 duration-300">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center mb-4 text-foreground shadow-xs ring-4 ring-background/50">
          {icon}
        </div>
      )}
      <div className="text-[16px] font-extrabold text-foreground tracking-tight">{title}</div>
      <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

export function ErrorState({
  title = "Failed to load data",
  description = "There was a problem communicating with Firebase. Please check your connection and try again.",
  onRetry,
}) {
  return (
    <section className="bg-card rounded-[28px] p-8 shadow-sm flex flex-col items-center text-center border border-rose-500/20 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500 shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div className="text-[16px] font-extrabold text-foreground tracking-tight">{title}</div>
      <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">
        {description}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 rounded-full bg-foreground text-background font-semibold text-[13px] hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </section>
  );
}

// ─── Custom Layout-Matched Skeletons for each tab ───────────────────────────

export function AcademicsSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {[1, 2].map((k) => (
        <section key={k} className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-44" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </section>
      ))}
    </div>
  );
}

export function AttendanceSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Circular Gauge Card Skeleton */}
      <section className="bg-card rounded-[28px] p-6 shadow-sm flex flex-col items-center border border-border/40 space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="w-[180px] h-[180px] rounded-full border-[14px] border-muted/50 flex flex-col items-center justify-center space-y-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </section>

      {/* 4 Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-[20px] p-3 border border-border/40 space-y-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Target Progress Bar Skeleton */}
      <section className="bg-card rounded-[28px] p-5 border border-border/40 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
      </section>

      {/* Day Log List Skeleton */}
      <section className="bg-card rounded-[28px] p-5 border border-border/40 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="min-w-[52px] h-16 rounded-2xl shrink-0" />
          ))}
        </div>
      </section>
    </div>
  );
}

export function RankingSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Scope Switcher Skeleton */}
      <Skeleton className="h-10 w-full rounded-full" />

      {/* Hero Rank Card Skeleton */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-12 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-2xl" />
      </section>

      {/* Podium Top 3 Skeleton */}
      <section className="bg-card rounded-[28px] p-5 border border-border/40 space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="grid grid-cols-3 gap-3 items-end pt-4">
          <Skeleton className="h-24 rounded-t-2xl" />
          <Skeleton className="h-32 rounded-t-2xl" />
          <Skeleton className="h-20 rounded-t-2xl" />
        </div>
      </section>

      {/* Leaderboard List Skeleton */}
      <section className="bg-card rounded-[28px] p-5 border border-border/40 space-y-3">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-2xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function FinancesSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Scope Switcher Skeleton */}
      <Skeleton className="h-10 w-full rounded-full" />

      {/* Main Fee Balance Card Skeleton */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-20 pt-2" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-2 w-full rounded-full mt-2" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </section>

      {/* Receipts Timeline Skeleton */}
      <section className="bg-card rounded-[28px] p-5 border border-border/40 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function NoticesSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Live Badge Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-44 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Notice Cards Skeleton */}
      {[1, 2, 3].map((i) => (
        <section key={i} className="bg-card rounded-[24px] p-4 border border-border/40 flex gap-3">
          <Skeleton className="w-14 h-16 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </section>
      ))}
    </div>
  );
}

export function TabSkeleton({ tab }) {
  switch (tab) {
    case "academics":
      return <AcademicsSkeleton />;
    case "attendance":
      return <AttendanceSkeleton />;
    case "ranking":
      return <RankingSkeleton />;
    case "finances":
      return <FinancesSkeleton />;
    case "notices":
      return <NoticesSkeleton />;
    default:
      return <AcademicsSkeleton />;
  }
}
