// Vite configuration for TanStack Start app
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts.
    server: { entry: "server" },
  },
  nitro: {
    preset: process.env.NITRO_PRESET || "vercel",
    ...(process.env.NITRO_PRESET === "node-server" || process.env.NITRO_PRESET === "render"
      ? {}
      : {
          output: {
            dir: ".vercel/output",
            serverDir: ".vercel/output/functions/__server.func",
            publicDir: ".vercel/output/static",
          },
        }),
  },
});
