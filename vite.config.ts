// Vite configuration for TanStack Start app
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    build: {
      target: "es2022",
      sourcemap: false,
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) {
                return "framer-motion";
              }
              if (id.includes("sonner")) {
                return "sonner";
              }
              if (id.includes("lucide-react")) {
                return "lucide-icons";
              }
            }
          },
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts.
    server: { entry: "server" },
  },

  nitro: {
    compressPublicAssets: { brotli: true, gzip: true },
    vercel: {
      regions: ["cpt1"],
      functions: {
        regions: ["cpt1"],
      },
    },
    routeRules: {
      "/images/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/fonts/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      "/sitemap.xml": { headers: { "cache-control": "public, max-age=3600, s-maxage=3600" } },
    },
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
  } as any,
});
// Vite configuration updated
