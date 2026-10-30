import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../hooks/use-theme.js";
import { cn } from "../../lib/utils.js";
import { triggerHaptic } from "../../lib/haptics.js";

export function ThemeToggle({ className }) {
  const { toggle, isDark } = useTheme();

  const handleToggle = () => {
    triggerHaptic("selection");
    toggle();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={cn(
        "relative min-h-[44px] inline-flex items-center justify-center p-1 cursor-pointer select-none active:scale-[0.97] transition-transform duration-150",
        className
      )}
    >
      {/* 3D Track */}
      <div
        className={cn(
          "relative w-[78px] h-[38px] rounded-full transition-colors duration-200 p-[3px] flex items-center justify-between",
          isDark
            ? "bg-[#131929] border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(0,0,0,0.4)]"
            : "bg-[#e2e8f0] border border-black/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(0,0,0,0.08)]"
        )}
      >
        {/* Sliding 3D Raised Knob */}
        <motion.div
          layout
          initial={false}
          animate={{ x: isDark ? 40 : 0 }}
          transition={{
            type: "spring",
            stiffness: 460,
            damping: 30,
            mass: 0.8,
          }}
          className={cn(
            "absolute top-[3px] left-[3px] w-[30px] h-[30px] rounded-full pointer-events-none transition-colors duration-200",
            isDark
              ? "bg-[#253049] border border-white/20 shadow-[0_2px_6px_rgba(0,0,0,0.55),0_1px_2px_rgba(0,0,0,0.3)]"
              : "bg-white border border-white/90 shadow-[0_2px_5px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.1)]"
          )}
        />

        {/* Sun Icon (Left) */}
        <div className="relative z-10 w-[30px] h-[30px] flex items-center justify-center pointer-events-none">
          <Sun
            className={cn(
              "w-4 h-4 transition-all duration-200",
              !isDark
                ? "text-amber-500 opacity-100 scale-105"
                : "text-slate-400 opacity-45 scale-90"
            )}
            strokeWidth={!isDark ? 2.6 : 2.0}
          />
        </div>

        {/* Moon Icon (Right) */}
        <div className="relative z-10 w-[30px] h-[30px] flex items-center justify-center pointer-events-none">
          <Moon
            className={cn(
              "w-4 h-4 transition-all duration-200",
              isDark
                ? "text-indigo-400 opacity-100 scale-105"
                : "text-slate-500 opacity-45 scale-90"
            )}
            strokeWidth={isDark ? 2.6 : 2.0}
          />
        </div>
      </div>
    </button>
  );
}

export default ThemeToggle;
