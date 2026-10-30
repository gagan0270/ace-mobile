import { useState } from "react";
import { Download, Wallet, Bus, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/pill";
import { useSimulatedLoading } from "@/hooks/use-simulated-loading";
import { SkeletonCard, EmptyState } from "../Skeleton";

type FeeScope = "school" | "bus";

// School fee
const totalSchool = 66000;
const paidSchool = 42000;
const outstandingSchool = totalSchool - paidSchool;
const pctSchool = Math.round((paidSchool / totalSchool) * 100);

// Bus fee — toggle to demo empty state
const usesBus = true;
const totalBus = 18000;
const paidBus = 14000;
const outstandingBus = totalBus - paidBus;
const pctBus = Math.round((paidBus / totalBus) * 100);

type Receipt = { id: string; amount: number; desc: string; date: string; kind: "school" | "bus" };

const receipts: Receipt[] = [
  { id: "RCP-2841", amount: 24000, desc: "Term 1 Tuition", date: "12 Jun 2025", kind: "school" },
  { id: "RCP-2755", amount: 14000, desc: "Transport · Route 7", date: "04 May 2025", kind: "bus" },
  { id: "RCP-2612", amount: 8000, desc: "Uniform & Books", date: "22 Apr 2025", kind: "school" },
  { id: "RCP-2540", amount: 6000, desc: "Activity Fee", date: "10 Apr 2025", kind: "school" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function downloadReceipt(r: Receipt) {
  const content = [
    "ACE PARENT PORTAL — PAYMENT RECEIPT",
    "===================================",
    "",
    `Receipt No     : ${r.id}`,
    `Date           : ${r.date}`,
    `Description    : ${r.desc}`,
    `Amount Paid    : ${fmt(r.amount)}`,
    "",
    "Student        : Gagan Venkatesh",
    "Admission No   : 2025-SATS-0091",
    "Grade / Section: 8 / B",
    "",
    "Status         : PAID",
    "",
    "This is a computer-generated receipt.",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FinancesTab() {
  const loading = useSimulatedLoading();
  const [scope, setScope] = useState<FeeScope>("school");

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (!receipts.length && outstandingSchool === 0 && outstandingBus === 0) {
    return (
      <EmptyState
        icon={<Wallet className="w-5 h-5" />}
        title="No fee activity yet"
        description="Payment history and pending invoices will appear here once your school posts them."
      />
    );
  }

  const filteredReceipts = receipts.filter((r) => r.kind === scope);

  return (
    <div className="space-y-4">
      {/* Scope switch — mirrors Ranking tab */}
      <div className="bg-card rounded-full p-1 shadow-sm flex">
        <ScopeButton
          active={scope === "school"}
          onClick={() => setScope("school")}
          icon={School}
          label="School Fee"
        />
        <ScopeButton
          active={scope === "bus"}
          onClick={() => setScope("bus")}
          icon={Bus}
          label="Bus Fee"
        />
      </div>

      {scope === "school" ? (
        <section className="bg-card rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center">
              <School className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider">
              School Fee
            </div>
          </div>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Outstanding
          </div>
          <div className="text-[32px] font-extrabold leading-none tabular-nums mt-1">
            {fmt(outstandingSchool)}
          </div>
          <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-700"
              style={{ width: `${pctSchool}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">
              {fmt(paidSchool)} / {fmt(totalSchool)}
            </span>
            <span className="font-extrabold">{pctSchool}% paid</span>
          </div>
          <button className="mt-4 w-full h-11 rounded-2xl bg-foreground text-background font-extrabold text-[13.5px] hover:opacity-90 transition">
            Pay Now
          </button>
        </section>
      ) : (
        <section className="bg-card rounded-[28px] p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center">
              <Bus className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider">
              Bus Fee
            </div>
          </div>
          {usesBus ? (
            <>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Outstanding
              </div>
              <div className="text-[32px] font-extrabold leading-none tabular-nums mt-1">
                {fmt(outstandingBus)}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Route 7 · Jayanagar</div>
              <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-700"
                  style={{ width: `${pctBus}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  {fmt(paidBus)} / {fmt(totalBus)}
                </span>
                <span className="font-extrabold">{pctBus}% paid</span>
              </div>
              <button className="mt-4 w-full h-11 rounded-2xl bg-foreground text-background font-extrabold text-[13.5px] hover:opacity-90 transition">
                Pay Now
              </button>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="text-[42px] leading-none">🚶</div>
              <div className="mt-2 text-[14px] font-extrabold">Not on any bus</div>
              <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed max-w-[240px]">
                No transport fee. Enjoy the walk!
              </div>
            </div>
          )}
        </section>
      )}

      <section className="bg-card rounded-[28px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[15px] font-extrabold">
            {scope === "school" ? "School" : "Bus"} Receipts
          </div>
          <div className="text-[11px] text-muted-foreground">
            {filteredReceipts.length} entries
          </div>
        </div>
        {filteredReceipts.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-muted-foreground">
            No {scope} receipts yet.
          </div>
        ) : (
          <div>
            {filteredReceipts.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 py-3.5 border-b border-border/60 last:border-0"
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold tabular-nums">{fmt(r.amount)}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                    {r.desc} · {r.date}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Pill tone={r.kind === "bus" ? "warning" : "muted"}>
                      {r.kind === "bus" ? "Bus" : "School"}
                    </Pill>
                    <Pill tone="muted">{r.id}</Pill>
                  </div>
                </div>
                <button
                  onClick={() => downloadReceipt(r)}
                  aria-label={`Download receipt ${r.id}`}
                  className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center hover:bg-accent transition active:scale-95"
                >
                  <Download className="w-4 h-4" strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
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
  icon: typeof School;
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
