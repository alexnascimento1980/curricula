import { defineConfig } from "@playwright/test";

// Testes ponta a ponta: sobem o Flask de verdade servindo o build do React
// (como em produção) e abrem num Chrome real. Rodar `npm run build` antes.
// Usa o Chrome instalado na máquina (channel "chrome"), sem baixar browsers.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:5050",
    channel: "chrome",
  },
  webServer: {
    command: "python -m flask --app backend/app run --port 5050",
    cwd: "..",
    url: "http://127.0.0.1:5050",
    reuseExistingServer: !process.env.CI,
    
    timeout: 60_000,
  },
});
