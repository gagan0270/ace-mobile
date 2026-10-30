import { useState } from "react";
import { Download, Bus, School } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { Pill } from "../../ui/pill.jsx";
import { useStudentReceipts, useBusRoutes } from "../../../hooks/useFirestoreSync.js";
import { FinancesSkeleton, ErrorState } from "../Skeleton.jsx";

const fmt = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

const formatTimestamp = (ts) => {
  if (!ts) return "Pending";
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
};

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadReceipt(receipt, student) {
  // Handle all possible amount field names from different Admin Dashboard formats
  const amount =
    receipt.amountPaid ??
    receipt.amount ??
    receipt.paidAmount ??
    receipt.total ??
    receipt.fee ??
    receipt.price ??
    0;

  // Handle all possible date field names
  const dateTs =
    receipt.paymentDate ??
    receipt.date ??
    receipt.createdAt ??
    receipt.timestamp ??
    receipt.paidAt ??
    null;

  const formattedAmount = escapeHtml(fmt(amount));
  const formattedDate = escapeHtml(formatTimestamp(dateTs));
  const receiptNo = escapeHtml(
    receipt.receiptNo ??
    receipt.receiptNumber ??
    receipt.receipt_no ??
    receipt.transactionId ??
    receipt.txnId ??
    `ACE-REC-${receipt.id || "UNKNOWN"}`
  );
  const studentName = escapeHtml(student?.name || "N/A");
  const studentSatsId = escapeHtml(student?.id || student?.satsId || "N/A");
  const studentClass = escapeHtml(student?.class || "N/A");
  const studentSection = escapeHtml(student?.section || "N/A");
  const purpose = escapeHtml(
    receipt.purpose ??
    receipt.desc ??
    receipt.description ??
    receipt.title ??
    receipt.feeType ??
    receipt.type ??
    "Term Fee Settlement"
  );
  const paymentMode = escapeHtml(
    receipt.paymentMethod ??
    receipt.paymentMode ??
    receipt.mode ??
    receipt.method ??
    "Online Banking / UPI Verified"
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt ${receiptNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 40px; background-color: #ffffff; }
          .receipt-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8B5CF6; padding-bottom: 24px; margin-bottom: 30px; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .logo { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #8B5CF6, #06D6E0); display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; font-size: 24px; }
          .brand-name h1 { margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; }
          .brand-name p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; text-transform: uppercase; }
          .receipt-badge h2 { margin: 0; font-size: 14px; font-weight: 800; color: #8B5CF6; }
          .receipt-id { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #475569; margin-top: 4px; font-weight: 700; }
          .grid-matrix { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .matrix-section { background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; }
          .matrix-section h3 { margin: 0 0 12px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .info-row { display: grid; grid-template-columns: 45% 55%; font-size: 13px; margin-bottom: 8px; }
          .info-label { color: #64748b; font-weight: 500; }
          .info-value { color: #0f172a; font-weight: 600; }
          .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .ledger-table th { background-color: #0f172a; color: #ffffff; padding: 12px 16px; font-size: 11px; text-transform: uppercase; }
          .ledger-table td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
          .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 40px; }
          .total-amount { font-size: 24px; font-weight: 900; color: #10b981; }
          .footer { text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div class="brand">
              <div class="logo">A</div>
              <div class="brand-name">
                <h1>ACE ACADEMY</h1>
                <p>Official Academic Network</p>
              </div>
            </div>
            <div class="receipt-badge">
              <h2>OFFICIAL PAYMENT RECEIPT</h2>
              <div class="receipt-id">${receiptNo}</div>
            </div>
          </div>
          <div class="grid-matrix">
            <div class="matrix-section">
              <h3>Student Identity</h3>
              <div class="info-row"><span class="info-label">Student:</span><span class="info-value">${studentName}</span></div>
              <div class="info-row"><span class="info-label">SATS ID:</span><span class="info-value">${studentSatsId}</span></div>
              <div class="info-row"><span class="info-label">Class:</span><span class="info-value">${studentClass} - ${studentSection}</span></div>
            </div>
            <div class="matrix-section">
              <h3>Settlement Info</h3>
              <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${formattedDate}</span></div>
              <div class="info-row"><span class="info-label">Payment Mode:</span><span class="info-value">${paymentMode}</span></div>
              <div class="info-row"><span class="info-label">Status:</span><span class="info-value" style="color: #10b981;">PAID</span></div>
            </div>
          </div>
          <table class="ledger-table">
            <thead><tr><th>Description</th><th style="text-align: right;">Amount Paid</th></tr></thead>
            <tbody><tr><td>${purpose}</td><td style="text-align: right;">${formattedAmount}</td></tr></tbody>
          </table>
          <div class="total-row">
            <div><div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase;">Total Settled</div><div class="total-amount">${formattedAmount}</div></div>
          </div>
          <div class="footer">Computer-generated official receipt · ACE Portal Network</div>
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); }</script>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${receiptNo}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FinancesTab({ student }) {
  const satsId = student?.id || student?.satsId || "";
  const { receipts, loading: loadingReceipts, error: errorReceipts, retry: retryReceipts } = useStudentReceipts(satsId, student);
  const { routes: busRoutes } = useBusRoutes();
  const [scope, setScope] = useState("school");

  // Filter receipts helper
  const isBusReceipt = (r) => {
    if (!r) return false;
    const kind = String(r.kind || r.type || r.feeType || r.category || r.paymentType || "").toLowerCase();
    const purpose = String(r.purpose || r.desc || r.description || r.title || "").toLowerCase();
    return (
      kind.includes("bus") ||
      kind.includes("transport") ||
      kind.includes("transit") ||
      purpose.includes("bus") ||
      purpose.includes("transport") ||
      purpose.includes("transit")
    );
  };

  const schoolReceipts = (receipts || []).filter((r) => !isBusReceipt(r));
  const busReceipts = (receipts || []).filter((r) => isBusReceipt(r));

  const receiptsSchoolPaidSum = schoolReceipts.reduce((sum, r) => sum + (Number(r.amountPaid || r.amount) || 0), 0);
  const receiptsBusPaidSum = busReceipts.reduce((sum, r) => sum + (Number(r.amountPaid || r.amount) || 0), 0);

  // School Fee Calculation (Strictly real data only, no arbitrary 50,000 fallback)
  const rawTotalSchool = student?.totalAllocatedFee ?? student?.totalFee ?? student?.allocatedFee ?? student?.schoolFee;
  const rawPaidSchool = student?.totalPaidFee ?? student?.paidAmount ?? student?.paidFee ?? student?.amountPaid;

  const paidSchool = rawPaidSchool !== undefined && rawPaidSchool !== null && Number(rawPaidSchool) >= 0
    ? Number(rawPaidSchool)
    : receiptsSchoolPaidSum;

  const totalSchool = rawTotalSchool !== undefined && rawTotalSchool !== null && Number(rawTotalSchool) > 0
    ? Number(rawTotalSchool)
    : (paidSchool > 0 ? paidSchool : 0);

  const rawOutstandingSchool = student?.outstandingBalance ?? student?.feeBalance ?? student?.balance ?? student?.dueAmount;
  const outstandingSchool = rawOutstandingSchool !== undefined && rawOutstandingSchool !== null
    ? Number(rawOutstandingSchool)
    : Math.max(0, totalSchool - paidSchool);

  const pctSchool = totalSchool > 0 ? Math.round((paidSchool / totalSchool) * 100) : (paidSchool > 0 ? 100 : 0);

  // Bus / Transport Fee Calculation
  const assignedBus = student?.assignedBusNumber ?? student?.busNumber ?? student?.bus ?? student?.transportBus ?? student?.route;
  const busStr = String(assignedBus || "").trim().toLowerCase();

  const isExplicitlyNoBus =
    !assignedBus ||
    assignedBus === "—" ||
    busStr === "" ||
    busStr === "none" ||
    busStr === "no bus" ||
    busStr === "nobus" ||
    busStr === "null" ||
    busStr === "undefined" ||
    student?.usesBus === false ||
    student?.hasBus === false ||
    student?.transportStatus === "inactive" ||
    student?.transportStatus === "none" ||
    student?.transportStatus === "no bus";

  const usesBus = !isExplicitlyNoBus;

  const rawPaidBus =
    student?.busTotalPaid ??
    student?.transportTotalPaid ??
    student?.busPaid ??
    student?.transportPaid ??
    student?.busPaidAmount ??
    student?.paidBus ??
    student?.paidTransport;

  const paidBus = rawPaidBus !== undefined && rawPaidBus !== null && Number(rawPaidBus) >= 0
    ? Number(rawPaidBus)
    : receiptsBusPaidSum;

  const rawTotalBus =
    student?.busTotalAllocated ??
    student?.transportTotalAllocated ??
    student?.busFee ??
    student?.transportFee ??
    student?.busAmount ??
    student?.transportAmount ??
    student?.busTotalFee ??
    student?.allocatedBusFee ??
    student?.allocatedTransportFee ??
    student?.routeFee ??
    student?.busRouteFee ??
    student?.busFare ??
    student?.fare ??
    student?.busCharge ??
    student?.busCharges ??
    student?.transportCharge ??
    student?.transportCharges ??
    student?.annualBusFee ??
    student?.annualTransportFee ??
    student?.bus_fee ??
    student?.transport_fee ??
    student?.feeDetails?.bus ??
    student?.feeDetails?.transport ??
    student?.fees?.bus ??
    student?.fees?.transport ??
    student?.feeStructure?.bus ??
    student?.feeStructure?.transport;

  // Real-time lookup from /bus_routes and /buses collection
  let routeCollectionFee = null;
  if (usesBus && busRoutes && busRoutes.length > 0) {
    const matchedRoute = busRoutes.find((r) => {
      if (!r) return false;
      const rName = String(r.name || r.title || r.busNumber || r.routeName || r.routeNumber || r.id || "").toLowerCase();
      return rName === busStr || busStr.includes(rName) || rName.includes(busStr);
    });
    if (matchedRoute) {
      routeCollectionFee = matchedRoute.fee ?? matchedRoute.amount ?? matchedRoute.fare ?? matchedRoute.price ?? matchedRoute.cost;
    }
  }

  const resolvedTotalBus = rawTotalBus ?? routeCollectionFee ?? student?.assignedBusFee ?? student?.assignedRouteFee;

  const totalBus = resolvedTotalBus !== undefined && resolvedTotalBus !== null && Number(resolvedTotalBus) > 0
    ? Number(resolvedTotalBus)
    : (usesBus ? paidBus : 0);

  const rawOutstandingBus =
    student?.busOutstandingBalance ??
    student?.transportOutstanding ??
    student?.transportFeeBalance ??
    student?.busFeeBalance ??
    student?.busDue ??
    student?.transportDue;

  const outstandingBus = rawOutstandingBus !== undefined && rawOutstandingBus !== null
    ? Number(rawOutstandingBus)
    : Math.max(0, totalBus - paidBus);

  const pctBus = totalBus > 0 ? Math.round((paidBus / totalBus) * 100) : (paidBus > 0 ? 100 : 0);

  if (loadingReceipts && (!receipts || receipts.length === 0) && rawTotalSchool === undefined) {
    return <FinancesSkeleton />;
  }

  if (errorReceipts && (!receipts || receipts.length === 0) && rawTotalSchool === undefined) {
    return (
      <ErrorState
        title="Unable to load fee ledger"
        description={errorReceipts}
        onRetry={retryReceipts}
      />
    );
  }

  const filteredReceipts = scope === "bus" ? busReceipts : schoolReceipts;

  return (
    <div className="space-y-4">
      {/* Scope switch */}
      <div className="bg-card rounded-full p-1 shadow-sm flex border border-border/40 animate-in fade-in duration-200">
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
        <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-background border border-border/60 flex items-center justify-center text-foreground">
              <School className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
              School Fee
            </div>
          </div>
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Outstanding
          </div>
          <div className="text-[32px] font-extrabold leading-none tabular-nums mt-1 text-foreground">
            {fmt(outstandingSchool)}
          </div>
          <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-700"
              style={{ width: `${Math.min(100, pctSchool)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">
              {fmt(paidSchool)} / {fmt(totalSchool)}
            </span>
            <span className="font-extrabold text-foreground">{pctSchool}% paid</span>
          </div>
        </section>
      ) : (
        <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-background border border-border/60 flex items-center justify-center text-foreground">
              <Bus className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
              Bus Fee
            </div>
          </div>
          {usesBus ? (
            <>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Outstanding
              </div>
              <div className="text-[32px] font-extrabold leading-none tabular-nums mt-1 text-foreground">
                {fmt(outstandingBus)}
              </div>
              <div className="mt-1 text-[11px] font-semibold text-muted-foreground">Assigned Transit: {assignedBus}</div>
              <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-700"
                  style={{ width: `${Math.min(100, pctBus)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  {fmt(paidBus)} / {fmt(totalBus)}
                </span>
                <span className="font-extrabold text-foreground">{pctBus}% paid</span>
              </div>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="text-[42px] leading-none">🚶</div>
              <div className="mt-2 text-[14px] font-extrabold text-foreground">Not on any bus</div>
              <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed max-w-[240px]">
                No transport fee recorded.
              </div>
            </div>
          )}
        </section>
      )}

      <section className="bg-card rounded-[28px] p-5 shadow-sm border border-border/40 animate-in fade-in duration-300 fill-mode-backwards" style={{ animationDelay: "150ms" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[15px] font-extrabold text-foreground">
            {scope === "school" ? "School" : "Bus"} Receipts
          </div>
          <div className="text-[11px] text-muted-foreground">
            {filteredReceipts.length} entries
          </div>
        </div>
        {filteredReceipts.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-muted-foreground font-medium">
            No {scope} receipts recorded yet.
          </div>
        ) : (
          <div>
            {filteredReceipts.map((r, idx) => (
              <div
                key={r.id}
                style={{ animationDelay: `${200 + idx * 60}ms` }}
                className="flex items-center justify-between gap-3 py-3.5 border-b border-border/60 last:border-0 animate-in fade-in fill-mode-backwards"
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-extrabold tabular-nums text-foreground">{fmt(r.amountPaid || r.amount)}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                    {r.purpose || r.desc || (scope === "bus" ? "Transport Fee" : "Tuition Fee")} · {formatTimestamp(r.paymentDate || r.date)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Pill tone="muted">{r.receiptNo || r.id}</Pill>
                  </div>
                </div>
                <button
                  onClick={() => downloadReceipt(r, student)}
                  aria-label={`Download receipt ${r.id}`}
                  className="w-10 h-10 rounded-full bg-background border border-border/60 flex items-center justify-center text-foreground hover:bg-accent transition active:scale-95 cursor-pointer"
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
