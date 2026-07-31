// Vite configuration for TanStack Start app
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts.
    server: { entry: "server" },
  },
  vite: {
    build: {
      target: "esnext",
      cssMinify: true,
      minify: "esbuild",
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }
              if (id.includes("@tanstack")) {
                return "vendor-tanstack";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("framer-motion")) {
                return "vendor-motion";
              }
              if (id.includes("@radix-ui")) {
                return "vendor-radix";
              }
            }
          },
        },
      },
    },
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

