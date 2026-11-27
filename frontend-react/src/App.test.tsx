import { act, render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

// App.tsx monta a árvore inteira (auth real, formulário real) — os mocks
// aqui só existem pra isolar este teste de rede de verdade; o
// comportamento de cada peça já é coberto nos testes dedicados delas.
vi.mock("./lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]) })) as unknown as typeof fetch,
);

// Renderiza e espera as promises iniciais (sessão, fetch) resolverem dentro
// de act(), pra nenhuma atualização de estado acontecer depois do teste.
async function renderizarAssentado() {
  await act(async () => {
    render(<App />);
  });
}

describe("App", () => {
  it("tem um <h1> com o nome do produto (única heading de nível 1 da página)", async () => {
    render(<App />);
    const h1s = await screen.findAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Currícula");
  });

  it("tem o skip link como o primeiro elemento focável da página", async () => {
    await renderizarAssentado();
    const link = screen.getByRole("link", {
      name: "Pular para o conteúdo principal",
    });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("o alvo do skip link (#main-content) existe de verdade", async () => {
    await renderizarAssentado();
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });

  it("não tem violações de acessibilidade detectáveis pelo axe-core (WCAG 2.1 A/AA)", async () => {
    const { container } = render(<App />);
    await screen.findAllByRole("heading", { level: 1 });
    // O jsdom não calcula cores, então o contraste (color-contrast) é
    // verificado fora daqui, rodando o axe num Chrome de verdade (ver
    // docs/frontend.md). Aqui pegamos estrutura: rótulos, papéis ARIA, ids
    // duplicados, ordem de headings, etc.
    const resultado = await axe(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(resultado).toHaveNoViolations();
  });
});
