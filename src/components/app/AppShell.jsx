import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, CalendarCheck, Wallet, Megaphone, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils.js";
import { ProfileDrawer } from "./ProfileDrawer.jsx";
import { AcademicsTab } from "./tabs/AcademicsTab.jsx";
import { AttendanceTab } from "./tabs/AttendanceTab.jsx";
import { RankingTab } from "./tabs/RankingTab.jsx";
import { FinancesTab } from "./tabs/FinancesTab.jsx";
import { NoticesTab } from "./tabs/NoticesTab.jsx";
import { useProfilePhoto } from "../../hooks/use-profile-photo.js";
import { useStudentProfile, useStudentAlerts } from "../../hooks/useFirestoreSync.js";
import { ThemeToggle } from "./ThemeToggle.jsx";
import { AlertBanner } from "./AlertBanner.jsx";
import { AceLogo } from "../ui/AceLogo.jsx";
import { ElasticScroll } from "./ElasticScroll.jsx";
import { triggerHaptic } from "../../lib/haptics.js";
import { useTranslation } from "../../lib/i18n.jsx";

export function AppShell({ satsId, initialStudent, onLogout }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("academics");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const { photo } = useProfilePhoto();
  const { student: liveStudent } = useStudentProfile(satsId);
  const student = liveStudent || initialStudent;
  const { alerts } = useStudentAlerts(satsId, student);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const tabs = [
    { key: "academics", label: "Marks", icon: BookOpen },
    { key: "attendance", label: t("attendance"), icon: CalendarCheck },
    { key: "ranking", label: t("ranking"), icon: Trophy },
    { key: "finances", label: t("finances"), icon: Wallet },
    { key: "notices", label: t("notices"), icon: Megaphone },
  ];

  const titles = {
    academics: "Academic Marks",
    attendance: t("attendance"),
    ranking: t("ranking"),
    finances: t("finances"),
    notices: t("notices"),
  };

  // Touch gesture swipe support
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);

  // Tab switch handler with instant fluid transition and haptic feedback
  const handleTabChange = useCallback((newTabKey) => {
    if (newTabKey === tab) return;
    triggerHaptic("selection");
    setTab(newTabKey);
  }, [tab]);

  // Horizontal Touch Swipe Handlers (Strictly ignores vertical scrolling)
  // Also respects data-no-swipe="true" on child elements (e.g. calendar grid)
  const handleTouchStart = (e) => {
    // Cancel swipe if the touch originates inside a no-swipe zone or horizontal scroller
    const target = e.target;
    if (target.closest("[data-no-swipe='true']")) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }
    // Cancel if inside a horizontally scrollable container
    let el = target;
    while (el && el !== e.currentTarget) {
      const style = window.getComputedStyle(el);
      if (style.overflowX === "auto" || style.overflowX === "scroll") {
        setTouchStartX(null);
        setTouchStartY(null);
        return;
      }
      el = el.parentElement;
    }
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 2.2) {
      const currentIndex = tabs.findIndex((t) => t.key === tab);
      if (diffX > 0 && currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1].key);
      } else if (diffX < 0 && currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1].key);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const studentName = student?.name || student?.studentName || "Student";

  const initialsStr = studentName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="w-full h-dvh flex flex-col bg-background text-foreground overflow-hidden relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Universal Transparent Header */}
      <header className="shrink-0 bg-transparent px-5 pt-3 pb-2 safe-top border-none z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AceLogo size="sm" showText={false} />
            <div className="leading-tight">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Welcome back,
              </div>
              <div className="text-[17px] font-extrabold text-foreground truncate max-w-[130px] sm:max-w-[180px]">
                {studentName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHaptic("light");
                setDrawerOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-foreground text-background font-bold text-[13px] flex items-center justify-center ring-2 ring-background shadow-xs overflow-hidden cursor-pointer active:scale-95 transition-transform"
              aria-label="Open profile"
            >
              {photo ? (
                <img src={photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initialsStr
              )}
            </motion.button>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={tab}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
            className="mt-2 text-[26px] font-extrabold tracking-tight text-foreground"
          >
            {titles[tab]}
          </motion.h1>
        </AnimatePresence>
      </header>

      {/* Pure Native 100% Smooth Scrolling Container */}
      <ElasticScroll>
        <div className="px-5 pt-2">
          <AlertBanner alerts={alerts} />
        </div>
        {!isOnline && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-2xl mx-5 mb-2 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Offline Mode — Showing local cached data</span>
          </div>
        )}
        <div className="px-5 pt-2 pb-36 safe-bottom">
          <div className={cn(tab === "academics" ? "block animate-in fade-in duration-150" : "hidden")}>
            <AcademicsTab student={student} />
          </div>
          <div className={cn(tab === "attendance" ? "block animate-in fade-in duration-150" : "hidden")}>
            <AttendanceTab student={student} />
          </div>
          <div className={cn(tab === "ranking" ? "block animate-in fade-in duration-150" : "hidden")}>
            <RankingTab student={student} />
          </div>
          <div className={cn(tab === "finances" ? "block animate-in fade-in duration-150" : "hidden")}>
            <FinancesTab student={student} />
          </div>
          <div className={cn(tab === "notices" ? "block animate-in fade-in duration-150" : "hidden")}>
            <NoticesTab student={student} />
          </div>
        </div>
      </ElasticScroll>

      {/* Fixed Floating Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,440px)] px-2 safe-bottom pointer-events-auto">
        <div className="bg-card text-foreground rounded-full p-1.5 flex items-center gap-1 shadow-2xl overflow-hidden border border-border/80 backdrop-blur-xl">
          {tabs.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTabChange(key)}
                aria-label={label}
                className={cn(
                  "min-w-0 flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 px-2 transition-colors duration-150 cursor-pointer",
                  active ? "bg-foreground text-background shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span
                  className={cn(
                    "text-[11px] font-semibold overflow-hidden transition-all duration-200 whitespace-nowrap",
                    active ? "max-w-[88px] opacity-100" : "max-w-0 opacity-0"
                  )}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <ProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        student={student}
        satsId={satsId}
        onLogout={onLogout}
      />
    </div>
  );
}

export default AppShell;
