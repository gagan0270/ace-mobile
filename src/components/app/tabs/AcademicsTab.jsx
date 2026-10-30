import { Pill } from "../../ui/pill.jsx";
import { EmptyState, ErrorState, AcademicsSkeleton } from "../Skeleton.jsx";
import { BookOpen } from "lucide-react";
import { useStudentMarks } from "../../../hooks/useFirestoreSync.js";

function extractScore(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return Number(val) || 0;
  if (typeof val === "object") {
    const raw =
      val.scored ??
      val.score ??
      val.mark ??
      val.marks ??
      val.obtained ??
      val.obtainedMarks ??
      val.initialScore ??
      val.val ??
      val.value ??
      val.points ??
      val.grade ??
      0;
    return Number(raw) || 0;
  }
  return 0;
}

function formatSubjectName(raw) {
  if (!raw) return "Subject";
  return String(raw)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function parseExamBlock(block) {
  if (!block || typeof block !== "object") return [];

  // Array of subjects: [{ subject: "Maths", marks: 95 }, { name: "Science", score: 88 }]
  if (Array.isArray(block)) {
    return block.map((item, idx) => {
      const name = formatSubjectName(item.name || item.subject || item.subjectName || `Subject ${idx + 1}`);
      const scored = extractScore(item);
      const min = Number(item.minPass ?? item.minPassing ?? item.passing_marks ?? item.min ?? 35) || 35;
      const max = Number(item.maxMarks ?? item.max_marks ?? item.max ?? 100) || 100;
      return { name, scored, min, max };
    });
  }

  // Nested subjects array/object
  if (block.subjects) {
    if (Array.isArray(block.subjects)) {
      return block.subjects.map((item, idx) => {
        const name = formatSubjectName(item.name || item.subject || item.subjectName || `Subject ${idx + 1}`);
        const scored = extractScore(item);
        const min = Number(item.minPass ?? item.minPassing ?? item.passing_marks ?? item.min ?? 35) || 35;
        const max = Number(item.maxMarks ?? item.max_marks ?? item.max ?? 100) || 100;
        return { name, scored, min, max };
      });
    }
    if (typeof block.subjects === "object") {
      return Object.entries(block.subjects).map(([subKey, subVal]) => {
        const name = formatSubjectName(subVal?.name || subVal?.subject || subKey);
        const scored = extractScore(subVal);
        const min = Number(subVal?.minPass ?? subVal?.minPassing ?? subVal?.passing_marks ?? block.passing_marks ?? 35) || 35;
        const max = Number(subVal?.maxMarks ?? subVal?.max_marks ?? subVal?.max ?? block.max_marks ?? 100) || 100;
        return { name, scored, min, max };
      });
    }
  }

  // Scores object: { Math: 95, Science: 88 }
  if (block.scores && typeof block.scores === "object") {
    return Object.entries(block.scores).map(([subKey, scoreVal]) => ({
      name: formatSubjectName(subKey),
      scored: extractScore(scoreVal),
      min: Number(block.passing_marks ?? block.minPassing ?? 35) || 35,
      max: Number(block.max_marks ?? block.maxMarks ?? 100) || 100,
    }));
  }

  // Direct key-value subject entries on the block
  const reservedKeys = [
    "date",
    "createdAt",
    "timestamp",
    "term",
    "max_marks",
    "maxMarks",
    "passing_marks",
    "minPassing",
    "status",
    "published",
    "id",
    "examName",
    "title",
  ];

  const directEntries = Object.entries(block).filter(([k]) => !reservedKeys.includes(k));
  if (directEntries.length > 0) {
    return directEntries.map(([subKey, subVal]) => {
      const name = formatSubjectName(subVal?.name || subVal?.subject || subKey);
      const scored = extractScore(subVal);
      const min = Number(subVal?.minPass ?? subVal?.minPassing ?? subVal?.passing_marks ?? block.passing_marks ?? 35) || 35;
      const max = Number(subVal?.maxMarks ?? subVal?.max_marks ?? subVal?.max ?? block.max_marks ?? 100) || 100;
      return { name, scored, min, max };
    });
  }

  return [];
}

export function AcademicsTab({ student }) {
  const satsId = student?.id || student?.satsId || "";
  const { marksData, loading, error, retry } = useStudentMarks(satsId, student);

  const rawMarks = marksData || student?.marks || student?.examMarks || student?.academics || student?.results;

  if (loading && !rawMarks) {
    return <AcademicsSkeleton />;
  }

  if (error && !rawMarks) {
    return (
      <ErrorState
        title="Unable to load academic results"
        description={error}
        onRetry={retry}
      />
    );
  }

  const marksObj = rawMarks || {};

  // If marks is directly an array or simple subject object, wrap inside an Academic Record block
  let examEntries = [];
  if (Array.isArray(rawMarks)) {
    examEntries = [["academic_record", { subjects: rawMarks }]];
  } else if (typeof rawMarks === "object") {
    // Check if values are direct subject entries or nested exam blocks
    const values = Object.values(rawMarks);
    const isDirectSubjectObj = values.some(
      (v) => typeof v === "number" || (typeof v === "object" && (v?.scored !== undefined || v?.score !== undefined || v?.mark !== undefined || v?.marks !== undefined))
    );

    if (isDirectSubjectObj && !rawMarks.subjects) {
      examEntries = [["academic_results", rawMarks]];
    } else {
      examEntries = Object.entries(rawMarks);
    }
  }

  if (examEntries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="w-5 h-5" />}
        title="No exam results yet"
        description="Your child's exam scores and term performance will appear here once results are published by the school administration."
      />
    );
  }

  return (
    <div className="space-y-4">
      {examEntries.map(([examId, examData], cardIndex) => {
        const subjects = parseExamBlock(examData);
        if (subjects.length === 0) return null;

        const total = subjects.reduce((s, x) => s + x.scored, 0);
        const max = subjects.reduce((s, x) => s + x.max, 0);
        const pct = max > 0 ? Math.round((total / max) * 100) : 0;
        const cleanExamId = (examData?.title || examData?.name || examId.replace(/_/g, " ")).trim();
        const examName = /exam/i.test(cleanExamId) ? cleanExamId : `${cleanExamId} Examination`;

        return (
          <section
            key={examId}
            style={{ animationDelay: `${cardIndex * 100}ms` }}
            className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-backwards"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Academic Record
                </div>
                <h2 className="mt-1 text-[18px] font-extrabold text-foreground capitalize">{examName}</h2>
              </div>
              <Pill tone="dark" className="text-[12px] px-3 py-1.5">
                {pct}% Overall
              </Pill>
            </div>

            <div className="mt-4 space-y-1">
              {subjects.map((s, idx) => {
                const passed = s.scored >= s.min;
                return (
                  <div
                    key={s.name}
                    style={{ animationDelay: `${cardIndex * 100 + idx * 50}ms` }}
                    className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0 animate-in fade-in duration-200 fill-mode-backwards"
                  >
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-foreground truncate">
                        {formatSubjectName(s.name)}
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
                {subjects.length} subjects evaluated
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
