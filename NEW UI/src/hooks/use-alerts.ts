import type { AppAlert } from "@/components/app/AlertBanner";

export function useAlerts(): AppAlert[] {
  return [
    {
      id: "alert-math-assignment",
      title: "Ms. Anitha R. · Mathematics",
      message:
        "Incomplete assignment from yesterday. Please call the teacher to discuss.",
    },
    {
      id: "alert-fee-due",
      title: "Term 2 Fee Due · 30 Aug",
      message: "₹28,000 outstanding. Pay before the due date to avoid late fees.",
    },
  ];
}
