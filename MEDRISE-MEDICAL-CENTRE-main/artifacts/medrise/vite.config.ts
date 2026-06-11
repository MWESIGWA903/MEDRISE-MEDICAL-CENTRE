import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default async ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, path.resolve(import.meta.dirname), "");
  const rawPort = env.PORT || process.env.PORT || "4173";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH || process.env.BASE_PATH || "/";

  return defineConfig({
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      ...(process.env.NODE_ENV !== "production" ? [runtimeErrorOverlay()] : []),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-query": ["@tanstack/react-query"],
            "vendor-ui": [
              "@radix-ui/react-dialog",
              "@radix-ui/react-select",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-tabs",
              "@radix-ui/react-tooltip",
              "@radix-ui/react-popover",
              "@radix-ui/react-label",
              "@radix-ui/react-checkbox",
            ],
            "vendor-charts": ["recharts"],
            "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
            "vendor-icons": ["lucide-react"],
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
        },
        "/ws": {
          target: "ws://localhost:8080",
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  });
};
