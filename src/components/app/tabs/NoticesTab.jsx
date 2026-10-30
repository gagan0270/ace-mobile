import { useState } from "react";
import { X, Megaphone, AlertTriangle, Pin, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Pill } from "../../ui/pill.jsx";
import { useFilteredEvents, isNoticeExpired } from "../../../hooks/useFirestoreSync.js";
import { NoticesSkeleton, EmptyState, ErrorState } from "../Skeleton.jsx";
import { cn } from "../../../lib/utils.js";

const parseNoticeDate = (ts) => {
  if (!ts) {
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      year: now.getFullYear(),
      timeStr: "Today",
    };
  }

  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  if (isNaN(d.getTime())) {
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      year: now.getFullYear(),
      timeStr: "Today",
    };
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return { day, month, year, timeStr };
};

export function NoticesTab({ student }) {
  const { events, loading, error, retry } = useFilteredEvents(student);
  const [dismissed, setDismissed] = useState([]);

  const studentClass = student?.class || student?.grade || "";
  const studentSection = student?.section || "";

  const activeEvents = (events || []).filter((n) => !isNoticeExpired(n));

  if (loading && (!events || events.length === 0)) {
    return <NoticesSkeleton />;
  }

  if (error && (!events || events.length === 0)) {
    return (
      <ErrorState
        title="Unable to load notices"
        description={error}
        onRetry={retry}
      />
    );
  }

  if (!activeEvents || activeEvents.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="w-5 h-5" />}
        title="No notices yet"
        description={studentClass ? `There are no active notices for ${studentClass} — ${studentSection || "All Sections"}.` : "There are no active notices published by the school at this time."}
      />
    );
  }

  const visible = activeEvents.filter((n) => !dismissed.includes(n.id));
  const pinned = visible.filter((n) => n.pinned || n.priority === "high" || n.priority === "urgent");
  const others = visible.filter((n) => !n.pinned && n.priority !== "high" && n.priority !== "urgent");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1 animate-in fade-in duration-200">
        <div className="inline-flex items-center gap-2 bg-card border border-border/40 rounded-full px-3 py-1.5 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[12px] font-semibold text-foreground">Live · {studentClass} · {studentSection}</span>
        </div>
        <span className="text-[12px] text-muted-foreground font-semibold">
          {visible.length} notices
        </span>
      </div>

      {pinned.length > 0 && (
        <section className="space-y-3">
          {pinned.map((n, idx) => (
            <NoticeCard
              key={n.id}
              notice={n}
              delay={idx * 70}
              onDismiss={() => setDismissed((d) => [...d, n.id])}
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        {others.map((n, idx) => (
          <NoticeCard key={n.id} notice={n} delay={(pinned.length + idx) * 70} />
        ))}
      </section>
    </div>
  );
}

function NoticeCard({ notice: n, onDismiss, delay = 0 }) {
  const isUrgent =
    n.priority === "high" ||
    n.priority === "urgent" ||
    n.priority === "critical" ||
    n.alert ||
    n.isUrgent ||
    n.urgent ||
    n.type === "alert" ||
    n.type === "urgent" ||
    n.category === "alert" ||
    n.category === "urgent";

  const dateObj = parseNoticeDate(
    n.timestamp || n.date || n.createdAt || n.publishedAt || n.sentAt || n.noticeDate || n.eventDate || n.dateTime
  );

  return (
    <motion.article
      whileTap={{ scale: 0.98 }}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "relative rounded-[28px] p-4 shadow-sm flex items-start gap-4 transition border border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards cursor-pointer",
        isUrgent
          ? "bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30"
          : "bg-card hover:bg-accent/60"
      )}
    >
      {n.pinned && (
        <div className="absolute -top-2.5 left-4 bg-foreground text-background rounded-full px-2.5 py-0.5 text-[10px] font-extrabold flex items-center gap-1 shadow-sm border border-background">
          <Pin className="w-3 h-3" strokeWidth={2.5} />
          PINNED ANNOUNCEMENT
        </div>
      )}

      {/* Prominent, Large Bold Date Badge */}
      <div
        className={cn(
          "shrink-0 rounded-2xl w-16 h-18 flex flex-col items-center justify-center p-2 leading-none border shadow-sm",
          isUrgent
            ? "bg-rose-500 text-white border-rose-400"
            : "bg-foreground text-background border-foreground/20"
        )}
      >
        <span className="text-[22px] font-black tracking-tight tabular-nums">{dateObj.day}</span>
        <span className="text-[10px] font-extrabold uppercase tracking-wider mt-1 opacity-90">{dateObj.month}</span>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        {/* Notice Header with Title and Time */}
        <div className="flex items-center justify-between gap-2 pr-4">
          <div className="flex items-center gap-2 min-w-0">
            {isUrgent && (
              <AlertTriangle
                className="w-4 h-4 text-rose-500 shrink-0"
                strokeWidth={2.4}
              />
            )}
            <h3 className="text-[15px] font-extrabold text-foreground truncate">
              {n.title || n.heading || n.subject || n.name || n.noticeTitle || n.eventTitle || n.noticeName || n.eventName || "School Notice"}
            </h3>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateObj.day} {dateObj.month} {dateObj.year}
          </span>
          {dateObj.timeStr && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dateObj.timeStr}
            </span>
          )}
        </div>

        <p className="mt-2 text-[13px] text-foreground/80 leading-relaxed line-clamp-3">
          {n.description || n.content || n.message || n.body || n.details || n.snippet || n.text || n.noticeContent || n.noticeBody || n.eventDescription || "No details provided."}
        </p>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {(n.type || n.category || n.noticeType || n.eventType) && (
            <Pill tone="muted">{n.type || n.category || n.noticeType || n.eventType}</Pill>
          )}
          {(n.publisher || n.publishedBy || n.authorRole || n.postedBy || n.sentBy || n.from || n.author) && (
            <Pill tone="dark">{String(n.publisher || n.publishedBy || n.authorRole || n.postedBy || n.sentBy || n.from || n.author).toUpperCase()}</Pill>
          )}
          {isUrgent && <Pill tone="danger">Urgent</Pill>}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-foreground/10 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.article>
  );
}
