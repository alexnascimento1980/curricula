import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "./useAutosave";

describe("useAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("NÃO salva na primeira renderização (evita salvar ao carregar um currículo existente)", () => {
    const onSalvar = vi.fn();
    renderHook(({ dados }) => useAutosave(dados, onSalvar, 1000), {
      initialProps: { dados: { nome: "inicial" } },
    });

    vi.advanceTimersByTime(2000);
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it("salva depois do delay quando os dados mudam", () => {
    const onSalvar = vi.fn();
    const { rerender } = renderHook(
      ({ dados }) => useAutosave(dados, onSalvar, 1000),
      { initialProps: { dados: { nome: "inicial" } } },
    );

    rerender({ dados: { nome: "mudou" } });
    expect(onSalvar).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(onSalvar).toHaveBeenCalledWith({ nome: "mudou" });
    expect(onSalvar).toHaveBeenCalledTimes(1);
  });

  it("agrupa mudanças rápidas numa única chamada (debounce de verdade)", () => {
    const onSalvar = vi.fn();
    const { rerender } = renderHook(
      ({ dados }) => useAutosave(dados, onSalvar, 1000),
      { initialProps: { dados: { nome: "a" } } },
    );

    rerender({ dados: { nome: "ab" } });
    vi.advanceTimersByTime(300);
    rerender({ dados: { nome: "abc" } });
    vi.advanceTimersByTime(300);
    rerender({ dados: { nome: "abcd" } });
    vi.advanceTimersByTime(1000);

    expect(onSalvar).toHaveBeenCalledTimes(1);
    expect(onSalvar).toHaveBeenCalledWith({ nome: "abcd" });
  });

  it("sempre usa a versão mais recente de onSalvar, mesmo se ela mudar entre chamadas", () => {
    const onSalvarAntigo = vi.fn();
    const onSalvarNovo = vi.fn();
    const { rerender } = renderHook(
      ({ dados, cb }) => useAutosave(dados, cb, 1000),
      { initialProps: { dados: { nome: "a" }, cb: onSalvarAntigo } },
    );

    rerender({ dados: { nome: "b" }, cb: onSalvarNovo });
    vi.advanceTimersByTime(1000);

    expect(onSalvarAntigo).not.toHaveBeenCalled();
    expect(onSalvarNovo).toHaveBeenCalledWith({ nome: "b" });
  });
});
