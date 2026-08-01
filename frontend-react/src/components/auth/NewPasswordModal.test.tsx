import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewPasswordModal } from "./NewPasswordModal";

const salvarNovaSenha = vi.fn();
const fecharFluxoDeRecuperacao = vi.fn();
let emRecuperacaoDeSenha = true;
let emailParaRecuperacao = "recuperando@teste.com";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    emRecuperacaoDeSenha,
    emailParaRecuperacao,
    salvarNovaSenha,
    fecharFluxoDeRecuperacao,
  }),
}));

vi.mock("bootstrap", () => ({
  Modal: vi.fn().mockImplementation(function MockModal(el: HTMLElement) {
    return {
      show: () => {
        el.removeAttribute("aria-hidden");
        el.setAttribute("aria-modal", "true");
      },
      hide: () => {
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("aria-modal");
      },
      dispose: vi.fn(),
    };
  }),
}));

describe("NewPasswordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emRecuperacaoDeSenha = true;
    emailParaRecuperacao = "recuperando@teste.com";
  });

  it("preenche o campo oculto de username com o e-mail da recuperação (acessibilidade de autofill)", () => {
    render(<NewPasswordModal />);
    expect(document.getElementById("new-password-username")).toHaveValue(
      "recuperando@teste.com",
    );
  });

  it("valida tamanho mínimo da senha", async () => {
    const user = userEvent.setup();
    render(<NewPasswordModal />);

    await user.type(screen.getByLabelText("Nova senha"), "123");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123");
    await user.click(
      screen.getByRole("button", { name: /Salvar nova senha/ }),
    );

    expect(salvarNovaSenha).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/pelo menos 6 caracteres/),
    ).toBeInTheDocument();
  });

  it("valida que as duas senhas coincidem", async () => {
    const user = userEvent.setup();
    render(<NewPasswordModal />);

    await user.type(screen.getByLabelText("Nova senha"), "123456");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "654321");
    await user.click(
      screen.getByRole("button", { name: /Salvar nova senha/ }),
    );

    expect(salvarNovaSenha).not.toHaveBeenCalled();
    expect(
      await screen.findByText("As senhas não coincidem."),
    ).toBeInTheDocument();
  });

  it("salva a nova senha quando válida e confirmada", async () => {
    salvarNovaSenha.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<NewPasswordModal />);

    await user.type(screen.getByLabelText("Nova senha"), "123456");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "123456");
    await user.click(
      screen.getByRole("button", { name: /Salvar nova senha/ }),
    );

    expect(salvarNovaSenha).toHaveBeenCalledWith("123456");
  });

  it("não tem botão de fechar (backdrop estático, só sai daqui salvando a senha)", () => {
    render(<NewPasswordModal />);
    expect(
      screen.queryByRole("button", { name: "Fechar modal" }),
    ).not.toBeInTheDocument();
  });
});
