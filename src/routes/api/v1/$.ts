import { createFileRoute } from "@tanstack/react-router";
import { handleApiV1Request } from "@/lib/api-v1/router";

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
      POST: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
      PUT: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
      DELETE: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
      PATCH: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
      OPTIONS: async ({ request }: { request: Request }) => handleApiV1Request(request, new URL(request.url)),
    },
  },
});
