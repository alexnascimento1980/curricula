import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResumeManager } from "./useResumeManager";

const listarCurriculos = vi.fn();
const buscarIdMaisRecente = vi.fn();
const criarCurriculo = vi.fn();
const buscarCurriculoPorId = vi.fn();
const salvarCurriculo = vi.fn();
const renomearCurriculo = vi.fn();
const excluirCurriculoPorId = vi.fn();

vi.mock("../lib/resumeService", () => ({
  listarCurriculos: (...args: unknown[]) => listarCurriculos(...args),
  buscarIdMaisRecente: (...args: unknown[]) => buscarIdMaisRecente(...args),
  criarCurriculo: (...args: unknown[]) => criarCurriculo(...args),
  buscarCurriculoPorId: (...args: unknown[]) => buscarCurriculoPorId(...args),
  salvarCurriculo: (...args: unknown[]) => salvarCurriculo(...args),
  renomearCurriculo: (...args: unknown[]) => renomearCurriculo(...args),
  excluirCurriculoPorId: (...args: unknown[]) =>
    excluirCurriculoPorId(...args),
}));

function criarFormHandleFalso() {
  return {
    current: {
      carregarDados: vi.fn(),
      resetarFormulario: vi.fn(),
      flushAutosave: vi.fn().mockResolvedValue(undefined),
      cancelarAutosave: vi.fn(),
    },
  };
}

describe("useResumeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarCurriculos.mockResolvedValue([]);
  });

  it("ao logar, carrega o currículo mais recente e a lista", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({
      nome: "Meu CV",
      dados: { basics: { name: "Fulano" } },
    });
    listarCurriculos.mockResolvedValue([
      { id: "id-1", resume_name: "Meu CV", updated_at: "2024-01-01" },
    ]);
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );

    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));
    expect(result.current.tituloAtual).toBe("Meu CV");
    expect(result.current.resumes).toHaveLength(1);
    expect(formHandle.current.carregarDados).toHaveBeenCalled();
    expect(criarCurriculo).not.toHaveBeenCalled();
  });

  it("cria um currículo padrão se a pessoa nunca teve nenhum", async () => {
    buscarIdMaisRecente.mockResolvedValue(null);
    criarCurriculo.mockResolvedValue("id-novo");
    buscarCurriculoPorId.mockResolvedValue({ nome: "Meu Currículo", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );

    await waitFor(() =>
      expect(result.current.currentResumeId).toBe("id-novo"),
    );
    expect(criarCurriculo).toHaveBeenCalledWith("user-1", "Meu Currículo");
  });

  it("ao deslogar, cancela autosave pendente e reseta o formulário", async () => {
    const formHandle = criarFormHandleFalso();
    const { rerender } = renderHook(
      ({ userId }) => useResumeManager(userId, formHandle),
      { initialProps: { userId: "user-1" as string | null } },
    );
    await waitFor(() => expect(listarCurriculos).toHaveBeenCalled());

    rerender({ userId: null });

    expect(formHandle.current.cancelarAutosave).toHaveBeenCalled();
    expect(formHandle.current.resetarFormulario).toHaveBeenCalled();
  });

  it("selecionar: força o autosave pendente antes de trocar, e não faz nada se já é o atual", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    await act(() => result.current.selecionar("id-1"));
    expect(formHandle.current.flushAutosave).not.toHaveBeenCalled();

    buscarCurriculoPorId.mockResolvedValue({ nome: "B", dados: {} });
    await act(() => result.current.selecionar("id-2"));

    expect(formHandle.current.flushAutosave).toHaveBeenCalledTimes(1);
    expect(result.current.currentResumeId).toBe("id-2");
    expect(result.current.tituloAtual).toBe("B");
  });

  it("criar: força autosave, cria no banco e reseta o formulário pro novo currículo", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    criarCurriculo.mockResolvedValue("id-novo");
    let sucesso = false;
    await act(async () => {
      sucesso = await result.current.criar("Currículo TI");
    });

    expect(sucesso).toBe(true);
    expect(formHandle.current.flushAutosave).toHaveBeenCalled();
    expect(formHandle.current.resetarFormulario).toHaveBeenCalled();
    expect(result.current.currentResumeId).toBe("id-novo");
    expect(result.current.tituloAtual).toBe("Currículo TI");
  });

  it("excluir o currículo atual: cancela autosave e assume outro currículo existente", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    excluirCurriculoPorId.mockResolvedValue({ error: null });
    buscarIdMaisRecente.mockResolvedValue("id-outro");
    buscarCurriculoPorId.mockResolvedValue({ nome: "Outro", dados: {} });

    await act(async () => {
      await result.current.excluir("id-1");
    });

    expect(formHandle.current.cancelarAutosave).toHaveBeenCalled();
    expect(criarCurriculo).not.toHaveBeenCalled();
    expect(result.current.currentResumeId).toBe("id-outro");
  });

  it("excluir o único currículo existente: cria um novo automaticamente", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    excluirCurriculoPorId.mockResolvedValue({ error: null });
    buscarIdMaisRecente.mockResolvedValue(null);
    criarCurriculo.mockResolvedValue("id-reposicao");
    buscarCurriculoPorId.mockResolvedValue({ nome: "Meu Currículo", dados: {} });

    await act(async () => {
      await result.current.excluir("id-1");
    });

    expect(criarCurriculo).toHaveBeenCalledWith("user-1", "Meu Currículo");
    expect(result.current.currentResumeId).toBe("id-reposicao");
  });

  it("excluir um currículo que NÃO é o atual: não mexe no formulário", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    excluirCurriculoPorId.mockResolvedValue({ error: null });
    await act(async () => {
      await result.current.excluir("id-outro-qualquer");
    });

    expect(formHandle.current.cancelarAutosave).not.toHaveBeenCalled();
    expect(result.current.currentResumeId).toBe("id-1");
  });

  it("renomear: atualiza o título só se for o currículo atualmente aberto", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.tituloAtual).toBe("A"));

    renomearCurriculo.mockResolvedValue({ error: null });
    await act(async () => {
      await result.current.renomear("id-outro", "Novo Nome");
    });
    expect(result.current.tituloAtual).toBe("A");

    await act(async () => {
      await result.current.renomear("id-1", "Título Atualizado");
    });
    expect(result.current.tituloAtual).toBe("Título Atualizado");
  });

  it("salvar: chama salvarCurriculo com o id atual", async () => {
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();
    salvarCurriculo.mockResolvedValue({ error: null });

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));

    const dadosFalsos = { basics: { name: "X" } } as never;
    await act(async () => {
      await result.current.salvar(dadosFalsos);
    });

    expect(salvarCurriculo).toHaveBeenCalledWith("id-1", dadosFalsos);
  });

  it("salvar: passa por 'salvando' -> 'salvo' -> 'oculto' (depois de 2s)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "A", dados: {} });
    const formHandle = criarFormHandleFalso();
    salvarCurriculo.mockResolvedValue({ error: null });

    const { result } = renderHook(() =>
      useResumeManager("user-1", formHandle),
    );
    await waitFor(() => expect(result.current.currentResumeId).toBe("id-1"));
    expect(result.current.statusSalvamento).toBe("oculto");

    const promessaSalvar = act(async () => {
      await result.current.salvar({ basics: { name: "X" } } as never);
    });
    await promessaSalvar;
    expect(result.current.statusSalvamento).toBe("salvo");

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.statusSalvamento).toBe("oculto");

    vi.useRealTimers();
  });
});
