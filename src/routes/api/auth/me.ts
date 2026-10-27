import { createFileRoute } from "@tanstack/react-router";
import { handleAuthMe, corsOptionsResponse } from "@/lib/api-v1/auth";

export const Route = createFileRoute("/api/auth/me")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleAuthMe(request),
      OPTIONS: async () => corsOptionsResponse(),
    },
  },
});
