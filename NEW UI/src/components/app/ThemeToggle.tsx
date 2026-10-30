import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const handle = () => {
    // Cartoon "curtain drop": a full-screen panel falls top→down, theme flips
    // when it fully covers, then the curtain rises off the top.
    const next = isDark ? "light" : "dark";
    const curtain = document.createElement("div");
    curtain.className = "theme-curtain";
    curtain.dataset.next = next;
    document.body.appendChild(curtain);

    requestAnimationFrame(() => {
      curtain.classList.add("theme-curtain--fall");
    });

    window.setTimeout(() => toggle(), 430);
    window.setTimeout(() => curtain.classList.add("theme-curtain--lift"), 640);
    window.setTimeout(() => curtain.remove(), 1250);
  };

  return (
    <button
      onClick={handle}
      aria-label="Toggle theme"
      className={cn(
        "relative w-10 h-10 rounded-2xl bg-card flex items-center justify-center overflow-hidden shadow-sm",
        "hover:scale-105 active:scale-95 transition-transform",
        className,
      )}
    >
      <Sun
        className={cn(
          "w-4.5 h-4.5 absolute transition-all duration-500",
          isDark
            ? "opacity-0 rotate-90 scale-50"
            : "opacity-100 rotate-0 scale-100 text-[oklch(0.75_0.16_75)]",
        )}
        strokeWidth={2.4}
      />
      <Moon
        className={cn(
          "w-4.5 h-4.5 absolute transition-all duration-500",
          isDark
            ? "opacity-100 rotate-0 scale-100 text-[oklch(0.9_0.06_260)]"
            : "opacity-0 -rotate-90 scale-50",
        )}
        strokeWidth={2.4}
      />
    </button>
  );
}
