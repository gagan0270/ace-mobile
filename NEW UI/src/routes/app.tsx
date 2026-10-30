import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — ACE Parent Portal" },
      {
        name: "description",
        content: "Your child's academics, attendance, fees and notices at a glance.",
      },
    ],
  }),
  component: AppShell,
});
