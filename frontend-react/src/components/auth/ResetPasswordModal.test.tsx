import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordModal } from "./ResetPasswordModal";

const enviarLinkRecuperacao = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ enviarLinkRecuperacao }),
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

describe("ResetPasswordModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("vem preenchido com o e-mail inicial passado por prop", () => {
    render(
      <ResetPasswordModal
        open
        onClose={vi.fn()}
        emailInicial="ja-digitado@teste.com"
      />,
    );
    expect(screen.getByLabelText("E-mail")).toHaveValue(
      "ja-digitado@teste.com",
    );
  });

  it("valida e-mail vazio/sem @ antes de enviar", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordModal open onClose={vi.fn()} emailInicial="" />);

    await user.click(
      screen.getByRole("button", { name: /Enviar link de recuperação/ }),
    );

    expect(enviarLinkRecuperacao).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Digite um e-mail válido."),
    ).toBeInTheDocument();
  });

  it("envia o link e fecha o modal quando o e-mail é válido", async () => {
    enviarLinkRecuperacao.mockResolvedValue({ error: null });
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ResetPasswordModal open onClose={onClose} emailInicial="ok@teste.com" />,
    );
    await user.click(
      screen.getByRole("button", { name: /Enviar link de recuperação/ }),
    );

    expect(enviarLinkRecuperacao).toHaveBeenCalledWith("ok@teste.com");
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra o erro do Supabase quando o envio falha", async () => {
    enviarLinkRecuperacao.mockResolvedValue({
      error: { message: "rate limit" },
    });
    const user = userEvent.setup();

    render(
      <ResetPasswordModal open onClose={vi.fn()} emailInicial="ok@teste.com" />,
    );
    await user.click(
      screen.getByRole("button", { name: /Enviar link de recuperação/ }),
    );

    expect(
      await screen.findByText(/Erro ao enviar e-mail: rate limit/),
    ).toBeInTheDocument();
  });
});
