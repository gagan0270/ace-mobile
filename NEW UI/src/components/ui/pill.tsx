import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "dark" | "success" | "danger" | "warning" | "muted";

const tones: Record<Tone, string> = {
  neutral: "bg-accent text-foreground",
  dark: "bg-[#111] text-white",
  success: "bg-[oklch(0.94_0.06_155)] text-[oklch(0.35_0.1_155)]",
  danger: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.15_25)]",
  warning: "bg-[oklch(0.95_0.06_80)] text-[oklch(0.42_0.1_60)]",
  muted: "bg-background text-muted-foreground border border-border",
};

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
