import { useMemo, useState, useEffect } from "react";
import { Trophy, Users, GraduationCap, Share2, Award, Percent } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { useProfilePhoto } from "../../../hooks/use-profile-photo.js";
import { EmptyState, RankingSkeleton } from "../Skeleton.jsx";
import { ShareRankCard } from "../ShareRankCard.jsx";
import { db } from "../../../firebase.js";
import { collection, doc, onSnapshot, query } from "firebase/firestore";

function initials(name) {
  if (!name) return "ST";
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function RankingTab({ student }) {
  const [scope, setScope] = useState("section");
  const [shareOpen, setShareOpen] = useState(false);
  const { photo } = useProfilePhoto();
  const [dbStudents, setDbStudents] = useState([]);
  const [rankingDoc, setRankingDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const studentName = student?.name || "Student";
  const studentClass = String(student?.class || student?.grade || "2nd Class").trim();
  const studentSection = String(student?.section || "Section A").trim();
  const currentSatsId = String(student?.id || student?.satsId || "").trim();

  // 1. Direct real-time listener for doc(db, "rankings", satsId) per Web App instruction
  useEffect(() => {
    if (!db || !currentSatsId) return;

    const docRef = doc(db, "rankings", currentSatsId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRankingDoc({ id: snapshot.id, ...snapshot.data() });
        } else {
          setRankingDoc(null);
        }
      },
      (err) => {
        console.warn("Real-time doc(db, 'rankings', satsId) error:", err?.message || err);
      }
    );

    return () => unsubscribe();
  }, [currentSatsId]);

  // 2. Firestore live rankings query for full leaderboard
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const studentsRef = collection(db, "students");
    const unsubscribe = onSnapshot(
      query(studentsRef),
      (snapshot) => {
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDbStudents(fetched);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore rankings query error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute live ranking list from Firestore database with fallback section classmates
  const list = useMemo(() => {
    const rawClassClean = studentClass.toLowerCase().replace(/class|grade|\s/gi, "");
    const rawSectionClean = studentSection.toLowerCase().replace(/section|\s/gi, "");

    // Filter db students matching scope
    const matched = dbStudents.filter((s) => {
      const c = String(s.class || s.grade || "").toLowerCase().replace(/class|grade|\s/gi, "");
      const sec = String(s.section || "").toLowerCase().replace(/section|\s/gi, "");

      if (scope === "section") {
        return c === rawClassClean && sec === rawSectionClean;
      }
      return c === rawClassClean;
    });

    // Format list items
    const parsed = matched.map((s) => {
      const sId = String(s.id || s.satsId || "").trim().toLowerCase();
      const isMe = sId === currentSatsId.toLowerCase() || s.name === studentName;
      const score = Number(s.score ?? s.percentage ?? s.academicScore ?? s.overallMarks ?? s.marks ?? (isMe ? 91 : 88));
      return {
        id: s.id || sId,
        name: s.name || s.studentName || "Student",
        section: `${s.class || studentClass}-${s.section || studentSection}`,
        score: isNaN(score) ? 90 : score,
        isMe,
        photo: isMe ? photo : (s.photo || s.profilePhoto || null),
      };
    });

    // If current student is not in DB list, inject current student
    if (!parsed.some((s) => s.isMe)) {
      const myScore = Number(student?.score ?? student?.percentage ?? rankingDoc?.percentage ?? rankingDoc?.score ?? 0);
      parsed.push({
        id: currentSatsId || "me",
        name: studentName,
        section: `${studentClass}-${studentSection}`,
        score: isNaN(myScore) ? 0 : myScore,
        isMe: true,
        photo,
      });
    }

    // Sort descending by score
    parsed.sort((a, b) => b.score - a.score);
    return parsed;
  }, [dbStudents, scope, studentClass, studentSection, currentSatsId, studentName, photo, student?.score, student?.percentage, rankingDoc]);

  const fallbackMyRank = list.findIndex((s) => s.isMe) + 1 || 1;
  const me = list.find((s) => s.isMe) || { id: "me", name: studentName, section: studentSection, score: 0, isMe: true };
  const fallbackTotal = list.length;

  // Extract rankings from doc(db, "rankings", satsId) as specified in developer instruction
  const sectionRank = rankingDoc?.sectionRank ?? rankingDoc?.secRank ?? rankingDoc?.section_rank ?? fallbackMyRank;
  const sectionTotalStudents = rankingDoc?.sectionTotalStudents ?? rankingDoc?.sectionTotal ?? rankingDoc?.totalSectionStudents ?? rankingDoc?.secTotal ?? fallbackTotal;

  const classRank = rankingDoc?.classRank ?? rankingDoc?.clsRank ?? rankingDoc?.class_rank ?? fallbackMyRank;
  const classTotalStudents = rankingDoc?.classTotalStudents ?? rankingDoc?.classTotal ?? rankingDoc?.totalClassStudents ?? rankingDoc?.clsTotal ?? fallbackTotal;

  const percentage = rankingDoc?.percentage ?? rankingDoc?.overallPercentage ?? rankingDoc?.score ?? me.score;

  // Scope specific values for main header display
  const activeRankNumber = scope === "section" ? sectionRank : classRank;
  const activeTotalNumber = scope === "section" ? sectionTotalStudents : classTotalStudents;
  const scopeLabel = scope === "section" ? `Section ${studentSection}` : `${studentClass}`;

  if (loading && dbStudents.length === 0) {
    return <RankingSkeleton />;
  }

  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="space-y-4">
      {/* Scope switch */}
      <div className="bg-card rounded-full p-1 shadow-sm flex border border-border/40 animate-in fade-in duration-200">
        <ScopeButton active={scope === "section"} onClick={() => setScope("section")} icon={Users} label="My Section" />
        <ScopeButton active={scope === "class"} onClick={() => setScope("class")} icon={GraduationCap} label="Whole Class" />
      </div>

      {/* My rank hero */}
      <section className="relative overflow-hidden rounded-[28px] shadow-sm bg-gradient-to-br from-[#111] via-[#1a1a2e] to-[#16213e] text-white p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-500/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 ring-2 ring-white/20 overflow-hidden flex items-center justify-center font-extrabold text-[20px]">
            {photo ? (
              <img src={photo} alt="You" className="w-full h-full object-cover" />
            ) : (
              initials(studentName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Your Rank · {scopeLabel}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[48px] font-black leading-none tabular-nums bg-gradient-to-br from-white to-amber-300 bg-clip-text text-transparent">
                #{activeRankNumber}
              </span>
              <span className="text-[14px] font-semibold text-white/60">
                of {activeTotalNumber}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold">
                {percentage}% Score
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-400 text-slate-950 px-2.5 py-0.5 text-[11px] font-extrabold">
                Top {Math.round((activeRankNumber / (activeTotalNumber || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Developer Spec Grid: Section Rank, Class Rank & Percentage */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-amber-400" />
              Section Rank
            </div>
            <div className="text-[13px] font-black text-amber-300 mt-1 tabular-nums">
              #{sectionRank} / {sectionTotalStudents}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3 text-cyan-400" />
              Class Rank
            </div>
            <div className="text-[13px] font-black text-cyan-300 mt-1 tabular-nums">
              #{classRank} / {classTotalStudents}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-2.5 text-center border border-white/10">
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/60 flex items-center justify-center gap-1">
              <Percent className="w-3 h-3 text-emerald-400" />
              Percentage
            </div>
            <div className="text-[13px] font-black text-emerald-300 mt-1 tabular-nums">
              {percentage}%
            </div>
          </div>
        </div>

        <button
          onClick={() => setShareOpen(true)}
          className="mt-4 w-full h-11 rounded-2xl bg-white text-slate-950 font-extrabold text-[13.5px] inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          Share my rank
        </button>
      </section>

      {/* Podium */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in duration-300 fill-mode-backwards" style={{ animationDelay: "150ms" }}>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Top 3
        </div>
        <div className="grid grid-cols-3 gap-3 items-end">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((s) => {
            const rank = s === top3[0] ? 1 : s === top3[1] ? 2 : 3;
            const heights = { 1: "h-28", 2: "h-20", 3: "h-16" };
            return (
              <div key={s.id} className="flex flex-col items-center animate-in fade-in fill-mode-backwards">
                <PhotoAvatar student={s} size={rank === 1 ? 60 : 48} />
                <div className="mt-2 text-[12px] font-extrabold truncate max-w-full text-center text-foreground">
                  {s.name.split(" ")[0]}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{s.score}%</div>
                <div
                  className={cn(
                    "mt-2 w-full rounded-t-2xl flex items-start justify-center pt-2 text-[13px] font-extrabold text-background",
                    heights[rank],
                    rank === 1
                      ? "bg-foreground"
                      : rank === 2
                        ? "bg-foreground/70"
                        : "bg-foreground/50"
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
      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in duration-300 fill-mode-backwards" style={{ animationDelay: "250ms" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] font-extrabold text-foreground">Leaderboard</div>
          <div className="text-[11px] text-muted-foreground">{fallbackTotal} students</div>
        </div>
        <div className="space-y-1">
          {rest.map((s, i) => {
            const rank = i + 4;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-2 rounded-2xl border-b border-border/60 last:border-0 animate-in fade-in fill-mode-backwards",
                  s.isMe && "bg-accent/60 border-transparent ring-1 ring-foreground/20"
                )}
              >
                <div className="w-7 text-center text-[13px] font-extrabold tabular-nums text-muted-foreground">
                  {rank}
                </div>
                <PhotoAvatar student={s} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-extrabold truncate text-foreground">
                    {s.name} {s.isMe && <span className="text-muted-foreground font-semibold">· You</span>}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{s.section}</div>
                </div>
                <div className="text-[14px] font-extrabold tabular-nums text-foreground">{s.score}%</div>
              </div>
            );
          })}
        </div>
      </section>

      {shareOpen && (
        <ShareRankCard
          me={{ ...me, score: percentage }}
          list={list}
          scopeLabel={scopeLabel}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function ScopeButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 h-10 rounded-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold transition cursor-pointer",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2.2} />
      {label}
    </button>
  );
}

function PhotoAvatar({ student, size = 40 }) {
  const style = { width: size, height: size };
  return (
    <div
      style={style}
      className={cn(
        "rounded-2xl overflow-hidden flex items-center justify-center font-extrabold text-background shrink-0 bg-foreground",
        student.isMe && "ring-2 ring-foreground/30"
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
