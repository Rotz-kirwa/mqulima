import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { StorageService, type UploadCategory } from "../../../services/storage";

const UploadPresignSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  fileType: z.string().min(1, "fileType is required"),
  fileSize: z.number().positive("fileSize must be positive"),
  category: z.enum(["profiles", "diagnoses", "marketplace", "community", "products"] as const),
  csrfToken: z.string().min(1, "CSRF token is required"),
});

export const Route = createFileRoute("/api/upload/presign")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // 1. User Authentication Check
          const { getCurrentUser, getCurrentAdminUser } = await import("@/lib/auth-server");
          const user = (await getCurrentUser()) || (await getCurrentAdminUser());

          if (!user) {
            return new Response(
              JSON.stringify({ error: "Unauthorized. Authentication required to request upload URL." }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }

          const body = await request.json();
          const parseResult = UploadPresignSchema.safeParse(body);

          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                error: "Invalid request payload",
                details: parseResult.error.flatten().fieldErrors,
              }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const { fileName, fileType, fileSize, category, csrfToken } = parseResult.data;

          // 2. Mandatory CSRF Validation
          const { validateCsrfToken } = await import("@/lib/csrf-verify.server");
          validateCsrfToken(csrfToken);

          // 3. Category RBAC Authorization Check
          if (category === "products" && user.role !== "admin" && user.role !== "super_admin") {
            return new Response(
              JSON.stringify({ error: "Forbidden. Administrative privileges required to upload product assets." }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }

          const presignedData = StorageService.createPresignedUpload({
            fileName,
            fileType,
            fileSize,
            category: category as UploadCategory,
          });

          return new Response(JSON.stringify(presignedData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          });
        } catch (err: any) {
          console.error("[ERROR] Failed to generate presigned upload URL:", err);
          return new Response(
            JSON.stringify({
              error: err.message || "Failed to process presigned upload URL request.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
