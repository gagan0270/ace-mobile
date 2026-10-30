import { useRef, useState, useEffect } from "react";
import { X, Share2, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { cn } from "../../lib/utils.js";
import { AceLogo } from "../ui/AceLogo.jsx";

function initials(n) {
  if (!n) return "ST";
  return n
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ShareRankCard({ onClose, me, list = [], scopeLabel }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const myRank = list.findIndex((s) => s.isMe) + 1 || 1;
  const total = list.length || 1;

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
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
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
      if (mountedRef.current) setBusy(false);
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
      if (mountedRef.current) setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-[400px] bg-background rounded-[28px] p-4 shadow-xl border border-border/40">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-foreground">Share your rank</div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-[24px] overflow-hidden">
          <div
            ref={cardRef}
            className="p-5 bg-gradient-to-br from-[#111] via-[#1a1a2e] to-[#16213e] text-white"
            style={{ fontFamily: "inherit" }}
          >
            <div className="flex items-center justify-between">
              <AceLogo size="sm" showText={false} />
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
                ACE PORTAL · {scopeLabel}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center font-extrabold text-[20px] ring-2 ring-white/20">
                {me?.photo ? (
                  <img
                    src={me.photo}
                    alt=""
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  initials(me?.name)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold truncate text-white/80">
                  {me?.name || "Student"}
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
                  Score {me?.score || 0}% · {me?.section || "Section"}
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
                      s.isMe && "bg-white/10 ring-1 ring-white/20"
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
              ACE PARENT PORTAL
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={doDownload}
            disabled={busy}
            className="flex-1 h-11 rounded-2xl bg-card border border-border/60 font-semibold text-[13.5px] hover:bg-accent transition inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Save
          </button>
          <button
            onClick={doShare}
            disabled={busy}
            className="flex-1 h-11 rounded-2xl bg-foreground text-background font-semibold text-[13.5px] hover:opacity-90 transition inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
