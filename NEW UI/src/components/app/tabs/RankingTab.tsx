import { useMemo, useState } from "react";
import { Trophy, Users, GraduationCap, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/pill";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { SkeletonCard, EmptyState } from "../Skeleton";
import { ShareRankCard } from "../ShareRankCard";

type Scope = "section" | "class";

type Student = {
  id: string;
  name: string;
  section: string;
  score: number;
  photo?: string | null;
  isMe?: boolean;
};

const baseSection: Student[] = [
  { id: "1", name: "Ishita Rao", section: "8-B", score: 96 },
  { id: "2", name: "Arjun Mehta", section: "8-B", score: 94 },
  { id: "me", name: "Gagan Venkatesh", section: "8-B", score: 91, isMe: true },
  { id: "4", name: "Priya Nair", section: "8-B", score: 89 },
  { id: "5", name: "Rohan Das", section: "8-B", score: 86 },
  { id: "6", name: "Sana Iqbal", section: "8-B", score: 84 },
  { id: "7", name: "Vikram Shah", section: "8-B", score: 81 },
];

const baseClass: Student[] = [
  { id: "c1", name: "Ishita Rao", section: "8-B", score: 96 },
  { id: "c2", name: "Aditya Kulkarni", section: "8-A", score: 95 },
  { id: "c3", name: "Arjun Mehta", section: "8-B", score: 94 },
  { id: "c4", name: "Neha Bhat", section: "8-C", score: 93 },
  { id: "me", name: "Gagan Venkatesh", section: "8-B", score: 91, isMe: true },
  { id: "c6", name: "Kabir Sen", section: "8-A", score: 90 },
  { id: "c7", name: "Priya Nair", section: "8-B", score: 89 },
  { id: "c8", name: "Meera Joshi", section: "8-C", score: 88 },
  { id: "c9", name: "Rohan Das", section: "8-B", score: 86 },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RankingTab() {
  const loading = useSimulatedLoading();
  const [scope, setScope] = useState<Scope>("section");
  const [shareOpen, setShareOpen] = useState(false);
  const { photo } = useProfilePhoto();

  const list = useMemo(() => {
    const src = scope === "section" ? baseSection : baseClass;
    return src.map((s) => (s.isMe ? { ...s, photo } : s));
  }, [scope, photo]);

  const myRank = list.findIndex((s) => s.isMe) + 1;
  const me = list.find((s) => s.isMe)!;
  const total = list.length;
  const scopeLabel = scope === "section" ? "Section 8-B" : "Grade 8";

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (!list.length) {
    return (
      <EmptyState
        icon={<Trophy className="w-5 h-5" />}
        title="No rankings yet"
        description="Rankings will appear once results are published for the term."
      />
    );
  }

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="space-y-4">
      {/* Scope switch */}
      <div className="bg-card rounded-full p-1 shadow-sm flex">
        <ScopeButton active={scope === "section"} onClick={() => setScope("section")} icon={Users} label="My Section" />
        <ScopeButton active={scope === "class"} onClick={() => setScope("class")} icon={GraduationCap} label="Whole Class" />
      </div>

      {/* My rank hero — highlighted */}
      <section className="relative overflow-hidden rounded-[28px] shadow-sm bg-gradient-to-br from-[oklch(0.22_0.04_260)] to-[oklch(0.12_0.03_260)] text-white p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[oklch(0.82_0.14_80)]/25 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 ring-2 ring-white/20 overflow-hidden flex items-center justify-center font-extrabold text-[20px]">
            {photo ? (
              <img src={photo} alt="You" className="w-full h-full object-cover" />
            ) : (
              "GV"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Your Rank · {scopeLabel}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[52px] font-black leading-none tabular-nums bg-gradient-to-br from-white to-[oklch(0.82_0.14_80)] bg-clip-text text-transparent">
                #{myRank}
              </span>
              <span className="text-[14px] font-semibold text-white/60">
                of {total}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold">
                Score {me.score}%
              </span>
              <span className="inline-flex items-center rounded-full bg-[oklch(0.82_0.14_80)] text-[oklch(0.25_0.08_60)] px-2.5 py-0.5 text-[11px] font-extrabold">
                Top {Math.round((myRank / total) * 100)}%
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShareOpen(true)}
          className="mt-4 w-full h-11 rounded-2xl bg-white text-[oklch(0.15_0.03_260)] font-extrabold text-[13.5px] inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition"
        >
          <Share2 className="w-4 h-4" />
          Share my rank
        </button>
      </section>

      {/* Podium */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Top 3
        </div>
        <div className="grid grid-cols-3 gap-3 items-end">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((s) => {
            const rank = s === top3[0] ? 1 : s === top3[1] ? 2 : 3;
            const heights = { 1: "h-28", 2: "h-20", 3: "h-16" } as const;
            return (
              <div key={s.id} className="flex flex-col items-center">
                <PhotoAvatar student={s} size={rank === 1 ? 60 : 48} />
                <div className="mt-2 text-[12px] font-extrabold truncate max-w-full text-center">
                  {s.name.split(" ")[0]}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{s.score}%</div>
                <div
                  className={cn(
                    "mt-2 w-full rounded-t-2xl flex items-start justify-center pt-2 text-[13px] font-extrabold text-background",
                    heights[rank as 1 | 2 | 3],
                    rank === 1
                      ? "bg-foreground"
                      : rank === 2
                        ? "bg-foreground/70"
                        : "bg-foreground/50",
                  )}
                >
                  #{rank}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full leaderboard */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold">Leaderboard</div>
          <div className="text-[11px] text-muted-foreground">{total} students</div>
        </div>
        <div className="space-y-1">
          {rest.map((s, i) => {
            const rank = i + 4;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-2 rounded-2xl border-b border-border/60 last:border-0",
                  s.isMe && "bg-accent/60 border-transparent ring-1 ring-foreground/20",
                )}
              >
                <div className="w-7 text-center text-[13px] font-extrabold tabular-nums text-muted-foreground">
                  {rank}
                </div>
                <PhotoAvatar student={s} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-extrabold truncate">
                    {s.name} {s.isMe && <span className="text-muted-foreground font-semibold">· You</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.section}</div>
                </div>
                <div className="text-[14px] font-extrabold tabular-nums">{s.score}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {shareOpen && (
        <ShareRankCard
          me={me}
          list={list}
          scopeLabel={scopeLabel}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-10 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2.2} />
      {label}
    </button>
  );
}

function PhotoAvatar({ student, size = 40 }: { student: Student; size?: number }) {
  const style = { width: size, height: size };
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-background shrink-0 bg-foreground",
        student.isMe && "ring-2 ring-foreground/30",
      )}
    >
      {student.photo ? (
        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
      ) : (
        <span style={{ fontSize: Math.max(10, size / 3) }}>{initials(student.name)}</span>
      )}
    </div>
  );
}
