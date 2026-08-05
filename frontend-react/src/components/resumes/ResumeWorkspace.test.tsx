import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeWorkspace } from "./ResumeWorkspace";

let usuarioAtual: { id: string; email: string } | null = null;

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: usuarioAtual }),
}));

vi.mock("bootstrap", () => ({
  Modal: vi.fn().mockImplementation(function MockModal(el: HTMLElement) {
    return {
      show: () => {
        el.removeAttribute("aria-hidden");
        el.setAttribute("aria-modal", "true");
      },
      hide: () => el.setAttribute("aria-hidden", "true"),
      dispose: vi.fn(),
    };
  }),
  Offcanvas: vi.fn().mockImplementation(function MockOffcanvas(el: HTMLElement) {
    return {
      show: () => {
        el.removeAttribute("aria-hidden");
        el.classList.add("show");
      },
      hide: () => el.classList.remove("show"),
      dispose: vi.fn(),
    };
  }),
}));

const listarCurriculos = vi.fn();
const buscarIdMaisRecente = vi.fn();
const criarCurriculo = vi.fn();
const buscarCurriculoPorId = vi.fn();
const salvarCurriculo = vi.fn();
const renomearCurriculo = vi.fn();
const excluirCurriculoPorId = vi.fn();

vi.mock("../../lib/resumeService", () => ({
  listarCurriculos: (...args: unknown[]) => listarCurriculos(...args),
  buscarIdMaisRecente: (...args: unknown[]) => buscarIdMaisRecente(...args),
  criarCurriculo: (...args: unknown[]) => criarCurriculo(...args),
  buscarCurriculoPorId: (...args: unknown[]) => buscarCurriculoPorId(...args),
  salvarCurriculo: (...args: unknown[]) => salvarCurriculo(...args),
  renomearCurriculo: (...args: unknown[]) => renomearCurriculo(...args),
  excluirCurriculoPorId: (...args: unknown[]) =>
    excluirCurriculoPorId(...args),
}));

vi.stubGlobal(
  "fetch",
  vi.fn(() =>
    Promise.resolve({ json: () => Promise.resolve([]) }),
  ) as unknown as typeof fetch,
);

describe("ResumeWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usuarioAtual = null;
    listarCurriculos.mockResolvedValue([]);
  });

  it("não mostra a barra de título do currículo quando deslogado", () => {
    render(<ResumeWorkspace notificar={vi.fn()} />);
    expect(
      screen.queryByRole("button", { name: /Meus Currículos/ }),
    ).not.toBeInTheDocument();
  });

  it("mostra o título do currículo atual e o botão do painel quando logado", async () => {
    usuarioAtual = { id: "user-1", email: "a@b.com" };
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "CV de Teste", dados: {} });

    render(<ResumeWorkspace notificar={vi.fn()} />);

    expect(
      await screen.findByRole("button", { name: /Meus Currículos/ }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("CV de Teste")).toBeInTheDocument(),
    );
  });

  it("abre o painel de currículos ao clicar no botão", async () => {
    usuarioAtual = { id: "user-1", email: "a@b.com" };
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "CV", dados: {} });
    const user = userEvent.setup();

    render(<ResumeWorkspace notificar={vi.fn()} />);
    await screen.findByRole("button", { name: /Meus Currículos/ });

    await user.click(screen.getByRole("button", { name: /Meus Currículos/ }));

    expect(
      screen.getByRole("button", { name: /Novo Currículo/ }),
    ).toBeInTheDocument();
  });

  it("abre o modal de novo currículo e chama criar() ao confirmar", async () => {
    usuarioAtual = { id: "user-1", email: "a@b.com" };
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "CV", dados: {} });
    criarCurriculo.mockResolvedValue("id-novo");
    const user = userEvent.setup();

    render(<ResumeWorkspace notificar={vi.fn()} />);
    await screen.findByRole("button", { name: /Meus Currículos/ });
    await user.click(screen.getByRole("button", { name: /Meus Currículos/ }));
    await user.click(screen.getByRole("button", { name: /Novo Currículo/ }));

    await user.type(
      screen.getByLabelText("Nome do Currículo"),
      "Currículo Novo",
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criarCurriculo).toHaveBeenCalledWith("user-1", "Currículo Novo"),
    );
  });

  it("pede confirmação antes de excluir, e não exclui se a pessoa cancelar", async () => {
    usuarioAtual = { id: "user-1", email: "a@b.com" };
    buscarIdMaisRecente.mockResolvedValue("id-1");
    buscarCurriculoPorId.mockResolvedValue({ nome: "CV", dados: {} });
    listarCurriculos.mockResolvedValue([
      { id: "id-1", resume_name: "CV", updated_at: "2024-01-01T00:00:00Z" },
    ]);
    vi.stubGlobal("confirm", vi.fn(() => false));
    const user = userEvent.setup();

    render(<ResumeWorkspace notificar={vi.fn()} />);
    await screen.findByRole("button", { name: /Meus Currículos/ });
    await user.click(screen.getByRole("button", { name: /Meus Currículos/ }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /Excluir currículo: CV/ }),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: /Excluir currículo: CV/ }),
    );

    expect(excluirCurriculoPorId).not.toHaveBeenCalled();
  });
});
