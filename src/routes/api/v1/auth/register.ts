import { createFileRoute } from "@tanstack/react-router";
import { handleAuthRegister, corsOptionsResponse } from "@/lib/api-v1/auth";

export const Route = createFileRoute("/api/v1/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleAuthRegister(request),
      OPTIONS: async () => corsOptionsResponse(),
    },
  },
});
