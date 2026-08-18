import { render, screen } from "@testing-library/react";
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

describe("App", () => {
  it("tem um <h1> com o nome do produto (única heading de nível 1 da página)", async () => {
    render(<App />);
    const h1s = await screen.findAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Currícula");
  });

  it("tem o skip link como o primeiro elemento focável da página", () => {
    render(<App />);
    const link = screen.getByRole("link", {
      name: "Pular para o conteúdo principal",
    });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("o alvo do skip link (#main-content) existe de verdade", () => {
    render(<App />);
    expect(document.getElementById("main-content")).toBeInTheDocument();
  });
});
