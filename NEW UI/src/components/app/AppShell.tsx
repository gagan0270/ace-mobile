import { useState, type ReactNode } from "react";
import { LayoutGrid, BookOpen, CalendarCheck, Wallet, Megaphone, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileDrawer } from "./ProfileDrawer";
import { AcademicsTab } from "./tabs/AcademicsTab";
import { AttendanceTab } from "./tabs/AttendanceTab";
import { FinancesTab } from "./tabs/FinancesTab";
import { NoticesTab } from "./tabs/NoticesTab";
import { RankingTab } from "./tabs/RankingTab";
import { useProfilePhoto } from "@/hooks/use-profile-photo";
import { ThemeToggle } from "./ThemeToggle";
import { AlertBanner } from "./AlertBanner";
import { useAlerts } from "@/hooks/use-alerts";

type TabKey = "academics" | "attendance" | "finances" | "notices" | "ranking";

const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "academics", label: "Academics", icon: BookOpen },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "ranking", label: "Ranking", icon: Trophy },
  { key: "finances", label: "Finances", icon: Wallet },
  { key: "notices", label: "Notices", icon: Megaphone },
];

const titles: Record<TabKey, string> = {
  academics: "Academics",
  attendance: "Attendance",
  ranking: "Ranking",
  finances: "Finances",
  notices: "Notices",
};

export function AppShell() {
  const [tab, setTab] = useState<TabKey>("academics");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { photo } = useProfilePhoto();
  const alerts = useAlerts();

  const onRefresh = async () => {
    // remount tab content -> triggers useSimulatedLoading skeleton again
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 650));
  };

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-[440px] min-h-dvh relative pb-32">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-2xl bg-card flex items-center justify-center shadow-sm">
                <LayoutGrid className="w-4.5 h-4.5" strokeWidth={2.2} />
              </button>
              <div className="leading-tight">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Welcome back,
                </div>
                <div className="text-[17px] font-extrabold text-foreground">Gagan V</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-foreground text-background font-bold text-[13px] flex items-center justify-center ring-2 ring-background shadow-sm overflow-hidden"
                aria-label="Open profile"
              >
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  "GV"
                )}
              </button>
            </div>
          </div>
          <h1 className="mt-4 text-[28px] font-extrabold tracking-tight text-foreground">
            {titles[tab]}
          </h1>
        </header>

        <div className="px-5 pt-2">
          <AlertBanner alerts={alerts} />
        </div>
        <TabView tab={tab} refreshKey={refreshKey} />

        {/* Floating bottom nav — compact, contained inside the app frame */}
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(94vw,420px)] px-2">
          <div className="bg-foreground text-background rounded-full p-1 flex items-center gap-0.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
            {tabs.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  aria-label={label}
                  className={cn(
                    "min-w-0 flex-1 h-8 rounded-full flex items-center justify-center gap-1 px-1 transition-all duration-300 active:scale-95",
                    active ? "bg-background text-foreground" : "text-background/70 hover:text-background",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                  <span
                    className={cn(
                      "text-[10.5px] font-semibold overflow-hidden transition-all duration-300 whitespace-nowrap",
                      active ? "max-w-[70px] opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      <ProfileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

function TabView({ tab, refreshKey }: { tab: TabKey; refreshKey: number }) {
  return (
    <div
      key={`${tab}-${refreshKey}`}
      className="px-5 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      {tab === "academics" && <AcademicsTab />}
      {tab === "attendance" && <AttendanceTab />}
      {tab === "ranking" && <RankingTab />}
      {tab === "finances" && <FinancesTab />}
      {tab === "notices" && <NoticesTab />}
    </div>
  );
}

export { AppShell as default };
export type { TabKey };
export { titles as tabTitles };
export { tabs as tabList };
export type { ReactNode };
