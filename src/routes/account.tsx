import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "overview",
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/dashboard",
      search: { tab: (search.tab as any) || "overview" } as any,
    });
  },
  component: () => null,
});

