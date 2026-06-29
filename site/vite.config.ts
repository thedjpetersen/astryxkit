import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const siteRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  base: "/astryxkit/",
  root: siteRoot,
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "@stylexjs/babel-plugin",
            {
              dev: process.env.NODE_ENV !== "production",
              runtimeInjection: true,
              treeshakeCompensation: true,
              unstable_moduleResolution: {
                rootDir: repoRoot,
                type: "commonJS",
              },
            },
          ],
        ],
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  preview: {
    host: "127.0.0.1",
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
});
