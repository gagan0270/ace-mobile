/**
 * AttendanceTab.jsx — Full-Month Calendar Grid
 *
 * Bug #5 Fix: Replaced the horizontal swipeable day-strip (which was intercepted
 * by AppShell's global swipe gesture handler causing tab navigation instead of
 * calendar scrolling) with a full static 7×5/6 month grid.
 *
 * The grid shows all days of the selected month at once. Users navigate months
 * with visible ◀ ▶ arrow buttons in the header — no swipe required.
 * Attendance indicators (present/absent dots) are mapped per calendar day.
 * Tapping a day cell opens the existing DayDetail modal.
 */
import { useState, useMemo } from "react";
import { CalendarDays, Flame, Hourglass, X, CheckCircle2, XCircle, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState, ErrorState, AttendanceSkeleton } from "../Skeleton.jsx";
import { useStudentAttendance } from "../../../hooks/useFirestoreSync.js";
import { cn } from "../../../lib/utils.js";
import { triggerHaptic } from "../../../lib/haptics.js";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Build a calendar grid for a given year/month ────────────────────────── */
function buildCalendarGrid(year, month) {
  // month is 0-indexed (like Date)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let week = [];

  // Leading empty cells
  for (let i = 0; i < firstDay; i++) week.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  // Trailing empty cells
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

/* ── Map dayLog entries to a lookup keyed by "YYYY-MM-DD" or day number ──── */
function buildAttendanceMap(dayLog) {
  const map = {};
  dayLog.forEach((entry) => {
    // If date is a real date string (YYYY-MM-DD or DD/MM/YYYY etc), use it
    const dateStr = entry.date;
    // Try ISO parse first
    if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      map[dateStr] = entry;
    } else if (dateStr && /^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
      // DD/MM/YYYY → YYYY-MM-DD
      const [dd, mm, yyyy] = dateStr.split("/");
      map[`${yyyy}-${mm}-${dd}`] = entry;
    }
    // Always store by sequential day number as fallback
    if (entry.day) {
      map[`day_${entry.day}`] = entry;
    }
  });
  return map;
}

export function AttendanceTab({ student }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  const studentId = student?.id || student?.satsId || "";
  const { dayLogs: subLogs, attendanceMap: subAttendanceMap, stats, loading, error, retry } = useStudentAttendance(studentId, student);

  // ── Data extraction from student document ──────────────────────────
  const rawHistory =
    student?.attendanceMatrix?.history ||
    student?.attendanceHistory ||
    student?.attendanceLogs ||
    student?.dailyAttendance ||
    student?.attendanceRecords ||
    student?.attendance?.history ||
    student?.attendance?.logs;

  let directLogs = [];
  if (Array.isArray(rawHistory)) {
    directLogs = rawHistory.map((item, idx) => ({
      day: idx + 1,
      date: item.date || item.day || `Day ${idx + 1}`,
      status: String(item.status || item.state || "present").toLowerCase().includes("absent") ? "absent" : "present",
      checkIn: item.checkIn || (String(item.status || "").toLowerCase().includes("absent") ? undefined : "08:15 AM"),
      checkOut: item.checkOut || (String(item.status || "").toLowerCase().includes("absent") ? undefined : "03:30 PM"),
      note: item.note || (String(item.status || "").toLowerCase().includes("absent") ? "Marked absent by teacher." : "Full day attended."),
    }));
  }

  // Combine subcollection logs with direct document logs
  const combinedLogsMap = new Map();
  directLogs.forEach((l) => {
    if (l.date) combinedLogsMap.set(l.date, l);
  });
  (subLogs || []).forEach((l) => {
    const dateKey = l.date || l.id;
    if (dateKey) {
      combinedLogsMap.set(dateKey, {
        ...l,
        date: dateKey,
        status: String(l.status || "").toLowerCase().includes("absent") ? "absent" : "present",
      });
    }
  });

  const dayLog = Array.from(combinedLogsMap.values());

  const daysPresent = stats?.daysPresent ?? 0;
  const daysAbsent = stats?.daysAbsent ?? 0;
  const totalWorkingDays = stats?.totalWorkingDays ?? (daysPresent + daysAbsent);
  const pct = stats?.percentage ?? (totalWorkingDays > 0 ? Math.round((daysPresent / totalWorkingDays) * 100) : 0);
  const remainingDays = Math.max(0, totalWorkingDays - daysPresent - daysAbsent);
  const target = 85;

  if (loading && dayLog.length === 0 && totalWorkingDays === 0) {
    return <AttendanceSkeleton />;
  }

  if (error && dayLog.length === 0 && totalWorkingDays === 0) {
    return (
      <ErrorState
        title="Unable to load attendance"
        description={error}
        onRetry={retry}
      />
    );
  }

  if (totalWorkingDays === 0 && dayLog.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-5 h-5" />}
        title="No attendance logged yet"
        description="Attendance will appear here as soon as your school starts syncing daily records."
      />
    );
  }

  const radius = 78;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  // ── Build attendance lookup map and calendar grid ─────────────────────
  const attendanceMap = useMemo(() => {
    const parsed = buildAttendanceMap(dayLog);
    return { ...parsed, ...(subAttendanceMap || {}) };
  }, [dayLog, subAttendanceMap]);
  const calendarGrid = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth]);

  const prevMonth = () => {
    triggerHaptic("selection");
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    triggerHaptic("selection");
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  // Get attendance entry for a specific calendar day
  const getEntry = (day) => {
    if (!day) return null;
    const isoKey = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceMap[isoKey] || null;
  };

  const isToday = (day) =>
    day === today.getDate() &&
    calMonth === today.getMonth() &&
    calYear === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* ── Overall Attendance Ring ─────────────────────────────────────── */}
      <section className="bg-card rounded-[28px] p-6 shadow-sm flex flex-col items-center border border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Attendance
        </div>
        <div className="relative mt-4 w-[200px] h-[200px]">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r={radius} stroke="var(--color-accent)" strokeWidth="14" fill="none" />
            <circle
              cx="100"
              cy="100"
              r={radius}
              stroke="var(--color-foreground)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[44px] font-extrabold leading-none tabular-nums text-foreground">
              {pct}
              <span className="text-[22px] align-top">%</span>
            </div>
            <div className="mt-1 text-[12px] text-muted-foreground font-medium">
              {daysPresent} / {totalWorkingDays} working days
            </div>
          </div>
        </div>
      </section>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard icon={CalendarDays} label="Present" value={String(daysPresent)} delay={100} />
        <MetricCard icon={UserX} label="Absent" value={String(daysAbsent)} tone="danger" delay={150} />
        <MetricCard icon={Flame} label="Ratio" value={`${pct}%`} delay={200} />
        <MetricCard icon={Hourglass} label="Left" value={String(remainingDays)} delay={250} />
      </div>

      {/* ── Target Progress Bar ─────────────────────────────────────────── */}
      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in duration-300 fill-mode-backwards" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Target Active Ratio
            </div>
            <div className="mt-1 text-[15px] font-extrabold text-foreground">
              {pct}% <span className="text-muted-foreground font-semibold">/ {target}% target</span>
            </div>
          </div>
          <div className="text-[12px] font-semibold text-emerald-500">
            {pct >= target ? "On track" : "Needs attention"}
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-accent overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full rounded-full bg-foreground transition-all duration-700"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/40"
            style={{ left: `${target}%` }}
            aria-hidden
          />
        </div>
      </section>

      {/* ── Bug #5 Fix: Full-Month Calendar Grid ────────────────────────── */}
      {/* No swipe needed — uses prev/next arrow buttons instead.           */}
      {/* Conflict with AppShell's global touch handler is fully eliminated. */}
      <section
        className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in duration-300 fill-mode-backwards"
        style={{ animationDelay: "350ms" }}
        data-no-swipe="true"
      >
        {/* Month Header with nav arrows */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={prevMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-background border border-border/60 text-foreground hover:bg-accent transition cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${calYear}-${calMonth}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="text-[15px] font-extrabold text-foreground"
            >
              {MONTH_NAMES[calMonth]} {calYear}
            </motion.div>
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={nextMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-background border border-border/60 text-foreground hover:bg-accent transition cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-1.5">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar day cells */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`grid-${calYear}-${calMonth}`}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {calendarGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  const entry = day ? getEntry(day) : null;
                  const isPresent = entry?.status === "present";
                  const isAbsent = entry?.status === "absent";
                  const todayFlag = day ? isToday(day) : false;

                  return (
                    <div key={di} className="flex items-center justify-center py-0.5">
                      {day ? (
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            if (entry) {
                              triggerHaptic("light");
                              setSelected(entry);
                            }
                          }}
                          disabled={!entry}
                          className={cn(
                            "w-9 h-9 rounded-full flex flex-col items-center justify-center relative transition-colors duration-150",
                            !entry && "cursor-default",
                            entry && "cursor-pointer hover:bg-accent",
                            todayFlag && !entry && "ring-1 ring-foreground/30",
                            isPresent && "bg-emerald-500/15 hover:bg-emerald-500/25",
                            isAbsent && "bg-rose-500/15 hover:bg-rose-500/25",
                            selected?.date === entry?.date && "ring-2 ring-foreground"
                          )}
                          aria-label={day ? `Day ${day}${entry ? `, ${entry.status}` : ""}` : undefined}
                        >
                          <span
                            className={cn(
                              "text-[13px] font-semibold leading-none",
                              todayFlag ? "text-foreground font-extrabold" : "text-foreground/80",
                              isAbsent && "text-rose-600 dark:text-rose-400 font-bold",
                              isPresent && "text-emerald-700 dark:text-emerald-400 font-bold"
                            )}
                          >
                            {day}
                          </span>
                          {/* Attendance dot */}
                          {entry && (
                            <span
                              className={cn(
                                "absolute bottom-0.5 w-1.5 h-1.5 rounded-full",
                                isPresent ? "bg-emerald-500" : "bg-rose-500"
                              )}
                            />
                          )}
                          {/* Today ring */}
                          {todayFlag && (
                            <span className="absolute inset-0 rounded-full ring-1 ring-foreground/40 pointer-events-none" />
                          )}
                        </motion.button>
                      ) : (
                        <div className="w-9 h-9" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            Present
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            Absent
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-border shrink-0" />
            No record
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground">Tap for details</div>
        </div>
      </section>

      {selected && <DayDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/* ── Day Detail Modal ────────────────────────────────────────────────────── */
function DayDetail({ entry, onClose }) {
  const present = entry.status === "present";
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] bg-background rounded-[28px] p-5 shadow-xl relative border border-border/40"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-card flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {entry.date}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {present ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-500" />
          )}
          <div className="text-[20px] font-extrabold text-foreground">
            {present ? "Present" : "Absent"}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <DetailRow label="Check In" value={entry.checkIn ?? "—"} />
          <DetailRow label="Check Out" value={entry.checkOut ?? "—"} />
          <DetailRow label="Session" value={present ? "Full day" : "Not attended"} />
        </div>

        {entry.note && (
          <div className="mt-4 p-3 rounded-2xl bg-card text-[12.5px] text-muted-foreground leading-relaxed border border-border/40">
            {entry.note}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="text-[13.5px] font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone, delay = 0 }) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "bg-card rounded-[20px] p-3 shadow-sm border border-border/40 animate-in fade-in duration-200 fill-mode-backwards",
        tone === "danger" && "bg-rose-500/10 border-rose-500/20"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          tone === "danger"
            ? "bg-rose-500 text-white"
            : "bg-background text-foreground"
        )}
      >
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="mt-2 text-[18px] font-extrabold leading-none tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
