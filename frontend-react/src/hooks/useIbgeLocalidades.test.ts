import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useIbgeLocalidades } from "./useIbgeLocalidades";

describe("useIbgeLocalidades", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/estados?")) {
          return Promise.resolve({
            json: () =>
              Promise.resolve([
                { sigla: "SP", nome: "São Paulo" },
                { sigla: "RJ", nome: "Rio de Janeiro" },
              ]),
          });
        }
        if (url.includes("/estados/SP/municipios")) {
          return Promise.resolve({
            json: () =>
              Promise.resolve([
                { nome: "Campinas" },
                { nome: "São Paulo" },
              ]),
          });
        }
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }) as unknown as typeof fetch,
    );
  });

  it("carrega a lista de estados ao montar", async () => {
    const { result } = renderHook(() => useIbgeLocalidades(""));

    expect(result.current.statusEstados).toBe("carregando");
    await waitFor(() => expect(result.current.statusEstados).toBe("pronto"));
    expect(result.current.estados).toHaveLength(2);
    expect(result.current.estados[0].sigla).toBe("SP");
  });

  it("carrega as cidades do estado selecionado", async () => {
    const { result, rerender } = renderHook(
      ({ estado }) => useIbgeLocalidades(estado),
      { initialProps: { estado: "" } },
    );

    rerender({ estado: "SP" });

    await waitFor(() => expect(result.current.cidades).toHaveLength(2));
    expect(result.current.cidades.map((c) => c.nome)).toContain("Campinas");
  });

  it("limpa as cidades quando o estado é desmarcado", async () => {
    const { result, rerender } = renderHook(
      ({ estado }) => useIbgeLocalidades(estado),
      { initialProps: { estado: "SP" } },
    );
    await waitFor(() => expect(result.current.cidades.length).toBeGreaterThan(0));

    rerender({ estado: "" });
    await waitFor(() => expect(result.current.cidades).toHaveLength(0));
  });

  it("marca erro se a API de estados falhar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("rede fora"))),
    );
    const { result } = renderHook(() => useIbgeLocalidades(""));

    await waitFor(() => expect(result.current.statusEstados).toBe("erro"));
  });
});
