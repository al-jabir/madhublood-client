import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
export default defineConfig(({ mode }) => {
  const clientEnv = loadEnv(
    mode,
    fileURLToPath(new URL(".", import.meta.url)),
    "API_",
  );
  const apiTarget =
    process.env.API_PROXY_TARGET ||
    clientEnv.API_PROXY_TARGET ||
    "http://127.0.0.1:5000";
  return {
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            forms: ["zod", "react-hook-form", "@hookform/resolvers/zod"],
            query: ["@tanstack/react-query", "axios"],
          },
        },
      },
    },
  };
});
