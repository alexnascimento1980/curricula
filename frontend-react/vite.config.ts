/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separa as bibliotecas em arquivos próprios: o código do app é só
        // ~50 kB e muda a cada deploy, já React/Supabase/Bootstrap (~480 kB)
        // quase nunca mudam — com chunks separados o navegador reaproveita o
        // cache deles em vez de baixar tudo de novo a cada atualização.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler"))
            return "react";
          if (id.includes("bootstrap") || id.includes("@popperjs")) return "bootstrap";
          if (id.includes("@capacitor")) return "capacitor";
          return "vendor";
        },
      },
    },
  },
  server: {
    // Em dev, o Vite roda numa porta separada (5173) do backend Flask
    // (5000) — sem isso, fetch("/generate-cv") cairia no próprio Vite, que
    // não tem essa rota. Em produção, quando este app for servido pelo
    // próprio Flask (Fase 5), essa configuração não é usada — a URL já é
    // same-origin naturalmente.
    proxy: {
      "/generate-cv": "http://127.0.0.1:5000",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
  },
});
