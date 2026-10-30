import { Pill } from "@/components/ui/pill";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { SkeletonCard, EmptyState } from "../Skeleton";
import { BookOpen } from "lucide-react";

type Subject = { name: string; scored: number; min: number; max: number };
type Exam = { name: string; term: string; subjects: Subject[] };

const exams: Exam[] = [
  {
    name: "Midterm Examination",
    term: "Term 1 · 2025",
    subjects: [
      { name: "Mathematics", scored: 82, min: 35, max: 100 },
      { name: "Science", scored: 74, min: 35, max: 100 },
      { name: "English", scored: 88, min: 35, max: 100 },
      { name: "Social Studies", scored: 69, min: 35, max: 100 },
      { name: "Kannada", scored: 31, min: 35, max: 100 },
    ],
  },
  {
    name: "Final Examination",
    term: "Term 2 · 2025",
    subjects: [
      { name: "Mathematics", scored: 91, min: 35, max: 100 },
      { name: "Science", scored: 84, min: 35, max: 100 },
      { name: "English", scored: 79, min: 35, max: 100 },
      { name: "Social Studies", scored: 76, min: 35, max: 100 },
      { name: "Kannada", scored: 68, min: 35, max: 100 },
    ],
  },
];

export function AcademicsTab() {
  const loading = useSimulatedLoading();

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-5 h-5" />}
        title="No exam results yet"
        description="Your child's exam scores and term performance will appear here once results are published."
      />
    );
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const total = exam.subjects.reduce((s, x) => s + x.scored, 0);
        const max = exam.subjects.reduce((s, x) => s + x.max, 0);
        const pct = Math.round((total / max) * 100);
        return (
          <section key={exam.name} className="bg-card rounded-[28px] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {exam.term}
                </div>
                <h2 className="mt-1 text-[18px] font-extrabold text-foreground">{exam.name}</h2>
              </div>
              <Pill tone="dark" className="text-[12px] px-3 py-1.5">
                {pct}% Overall
              </Pill>
            </div>

            <div className="mt-4 space-y-1">
              {exam.subjects.map((s) => {
                const passed = s.scored >= s.min;
                return (
                  <div
                    key={s.name}
                    className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-foreground truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Min pass {s.min} · Max {s.max}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[15px] font-extrabold tabular-nums">{s.scored}</div>
                      </div>
                      <Pill tone={passed ? "success" : "danger"}>{passed ? "PASS" : "FAIL"}</Pill>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-[12px] text-muted-foreground">
                {exam.subjects.length} subjects evaluated
              </div>
              <div className="text-[14px] font-extrabold tabular-nums">
                {total}
                <span className="text-muted-foreground font-semibold">/{max}</span>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
