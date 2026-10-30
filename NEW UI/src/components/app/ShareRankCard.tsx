import { useRef, useState } from "react";
import { X, Share2, Download, Trophy } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  section: string;
  score: number;
  photo?: string | null;
  isMe?: boolean;
};

function initials(n: string) {
  return n
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ShareRankCard({
  onClose,
  me,
  list,
  scopeLabel,
}: {
  onClose: () => void;
  me: Row;
  list: Row[];
  scopeLabel: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const myRank = list.findIndex((s) => s.isMe) + 1;
  const total = list.length;

  const capture = async () => {
    if (!cardRef.current) return null;
    return await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "transparent",
    });
  };

  const doShare = async () => {
    setBusy(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "rank.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Rank",
          text: `Rank ${myRank} of ${total} — ${scopeLabel}`,
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "rank.png";
        a.click();
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusy(false);
    }
  };

  const doDownload = async () => {
    setBusy(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "rank.png";
      a.click();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[400px] bg-background rounded-[28px] p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold">Share your rank</div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-[24px] overflow-hidden">
          <div
            ref={cardRef}
            className="p-5 bg-gradient-to-br from-[oklch(0.22_0.04_260)] to-[oklch(0.14_0.03_260)] text-white"
            style={{ fontFamily: "inherit" }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <Trophy className="w-3.5 h-3.5" /> Ace Portal · {scopeLabel}
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center font-extrabold text-[20px] ring-2 ring-white/20">
                {me.photo ? (
                  <img
                    src={me.photo}
                    alt=""
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  initials(me.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold truncate text-white/80">
                  {me.name}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-[11px] font-semibold text-white/60">RANK</span>
                  <span className="text-[42px] font-extrabold leading-none tabular-nums bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                    #{myRank}
                  </span>
                  <span className="text-[13px] font-semibold text-white/60">
                    / {total}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-white/70">
                  Score {me.score}% · {me.section}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/5 p-3 backdrop-blur">
              <div className="text-[10px] uppercase tracking-widest text-white/50 font-semibold mb-2">
                Class Leaderboard
              </div>
              <div className="space-y-1.5">
                {list.slice(0, 5).map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5",
                      s.isMe && "bg-white/10 ring-1 ring-white/20",
                    )}
                  >
                    <div className="w-5 text-[11px] font-extrabold tabular-nums text-white/70">
                      {i + 1}
                    </div>
                    <div className="w-6 h-6 rounded-md overflow-hidden bg-white/10 flex items-center justify-center text-[9px] font-bold">
                      {s.photo ? (
                        <img
                          src={s.photo}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        initials(s.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-[12px] font-semibold truncate">
                      {s.name}
                    </div>
                    <div className="text-[11px] font-extrabold tabular-nums text-white/80">
                      {s.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-center text-[10px] text-white/40 font-semibold uppercase tracking-widest">
              acepportal.app
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={doDownload}
            disabled={busy}
            className="flex-1 h-11 rounded-2xl bg-card font-semibold text-[13.5px] hover:bg-accent transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Save
          </button>
          <button
            onClick={doShare}
            disabled={busy}
            className="flex-1 h-11 rounded-2xl bg-foreground text-background font-semibold text-[13.5px] hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
