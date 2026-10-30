import { AlertTriangle, Phone, Pin } from "lucide-react";

export function AlertBanner({ alerts = [] }) {
  if (!alerts || !alerts.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((a) => {
        const title =
          a.title ||
          a.subject ||
          a.topic ||
          a.heading ||
          (a.teacherName ? `${a.teacherName.toUpperCase()} (TEACHER)` : "SCHOOL ANNOUNCEMENT");

        const message =
          a.message ||
          a.body ||
          a.description ||
          a.details ||
          a.text ||
          a.issue_details ||
          a.snippet ||
          "";

        if (!message && !a.title && !a.subject) return null;

        const teacherMobile = a.callbackNumber || a.teacher_mobile || a.teacherMobile || "";

        return (
          <div
            key={a.id}
            className="rounded-2xl border-2 border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/50 p-3.5 shadow-sm relative animate-in fade-in slide-in-from-top-2 duration-300"
          >
            {/* Pinned Badge indicating permanent alert */}
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-rose-500 bg-rose-500/15 dark:bg-rose-500/20 px-2 py-0.5 rounded-full">
                <Pin className="w-3 h-3" strokeWidth={2.5} />
                PINNED ALERT · ACTION REQUIRED
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-foreground">{title}</div>
                {message && (
                  <div className="text-[12.5px] text-foreground/90 font-medium leading-relaxed mt-0.5">
                    {message}
                  </div>
                )}
                {teacherMobile && /^[+\d][\d\s\-()]{6,20}$/.test(String(teacherMobile).trim()) && (
                  <button
                    onClick={() => {
                      const cleanPhone = String(teacherMobile).trim();
                      if (/^[+\d][\d\s\-()]{6,20}$/.test(cleanPhone)) {
                        window.open("tel:" + cleanPhone);
                      }
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold cursor-pointer hover:bg-rose-600 active:scale-95 transition shadow-xs"
                  >
                    <Phone className="w-3 h-3" /> CALL NOW
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AlertBanner;
