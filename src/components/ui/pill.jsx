import { cn } from "../../lib/utils.js";

const tones = {
  neutral: "bg-accent text-foreground",
  dark: "bg-[#111] text-white dark:bg-white dark:text-[#111]",
  success: "bg-[oklch(0.94_0.06_155)] text-[oklch(0.35_0.1_155)] dark:bg-[oklch(0.3_0.08_155)] dark:text-[oklch(0.95_0.05_155)]",
  danger: "bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.15_25)] dark:bg-[oklch(0.3_0.08_25)] dark:text-[oklch(0.95_0.05_25)]",
  warning: "bg-[oklch(0.95_0.06_80)] text-[oklch(0.42_0.1_60)] dark:bg-[oklch(0.3_0.08_80)] dark:text-[oklch(0.95_0.05_80)]",
  muted: "bg-background text-muted-foreground border border-border",
};

export function Pill({ children, tone = "neutral", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone] || tones.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}
