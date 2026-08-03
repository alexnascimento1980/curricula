/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
