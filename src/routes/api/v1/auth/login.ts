import { createFileRoute } from "@tanstack/react-router";
import { handleAuthLogin, corsOptionsResponse } from "@/lib/api-v1/auth";

export const Route = createFileRoute("/api/v1/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleAuthLogin(request),
      OPTIONS: async () => corsOptionsResponse(),
    },
  },
});
