import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-muted/70",
        className,
      )}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <section className="bg-card rounded-[28px] p-5 shadow-sm space-y-3">
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

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-[28px] p-8 shadow-sm flex flex-col items-center text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3">
          {icon}
        </div>
      )}
      <div className="text-[15px] font-extrabold">{title}</div>
      <p className="mt-1 text-[12.5px] text-muted-foreground max-w-[260px]">
        {description}
      </p>
    </section>
  );
}
