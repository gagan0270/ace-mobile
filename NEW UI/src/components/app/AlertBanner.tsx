import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export type AppAlert = {
  id: string;
  title: string;
  message: string;
};

const DISMISS_KEY = "ace.dismissedAlerts";

function loadDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function AlertBanner({ alerts }: { alerts: AppAlert[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  const visible = alerts.filter((a) => !dismissed.includes(a.id));
  if (!visible.length) return null;

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-[oklch(0.85_0.12_60)]/50 bg-[oklch(0.98_0.03_75)] dark:bg-[oklch(0.28_0.05_60)] p-3 pr-10 shadow-sm relative animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <button
            onClick={() => dismiss(a.id)}
            aria-label="Dismiss"
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[oklch(0.85_0.15_60)] text-[oklch(0.25_0.1_60)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-extrabold">{a.title}</div>
              <div className="text-[12px] text-foreground/70 leading-relaxed">
                {a.message}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
