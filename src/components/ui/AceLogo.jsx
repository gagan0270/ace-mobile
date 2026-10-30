import { cn } from "../../lib/utils.js";

export function AceLogo({ size = "md", showText = false, className }) {
  const isPreset = typeof size === "string" && ["sm", "md", "lg", "xl"].includes(size);

  const presetSizes = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const dimension = isPreset ? null : (typeof size === "number" ? `${size}px` : size);

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div
        style={dimension ? { width: dimension, height: dimension } : undefined}
        className={cn(
          "relative flex items-center justify-center shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-xl bg-black",
          isPreset ? presetSizes[size] : "w-12 h-12"
        )}
      >
        <img
          src="/logo.png"
          alt="ACE Logo"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <div className={cn("font-black tracking-tight text-white uppercase flex items-center gap-1.5", isPreset ? textSizes[size] : "text-lg")}>
            <span>ACE</span>
            <span className="text-zinc-400 font-extrabold font-mono">PORTAL</span>
          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
            Academic Network
          </div>
        </div>
      )}
    </div>
  );
}

export default AceLogo;
