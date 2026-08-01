import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "./AuthModal";

const login = vi.fn();
const cadastrar = vi.fn();
const loginComGoogle = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ login, cadastrar, loginComGoogle }),
}));

// O comportamento real do bootstrap.Modal (animação, backdrop) é testado
// à parte em Modal.test.tsx, com mais cuidado sobre as peculiaridades do
// jsdom. Aqui o foco é a lógica do formulário — mockar evita erros
// assíncronos de transição/animação vazando entre os testes.
vi.mock("bootstrap", () => ({
  Modal: vi.fn().mockImplementation(function MockModal(el: HTMLElement) {
    return {
      show: () => {
        el.removeAttribute("aria-hidden");
        el.setAttribute("aria-modal", "true");
        el.classList.add("show");
      },
      hide: () => {
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("aria-modal");
        el.classList.remove("show");
      },
      dispose: vi.fn(),
    };
  }),
}));

describe("AuthModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama onClose depois de um login bem-sucedido", async () => {
    login.mockResolvedValue({ error: null });
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <AuthModal open onClose={onClose} onEsqueciSenha={vi.fn()} />,
    );

    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(login).toHaveBeenCalledWith("teste@teste.com", "123456");
    expect(onClose).toHaveBeenCalled();
  });

  it("mostra mensagem genérica de erro quando o login falha (não revela qual campo)", async () => {
    login.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const user = userEvent.setup();

    render(<AuthModal open onClose={vi.fn()} onEsqueciSenha={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");
    await user.type(screen.getByLabelText("Senha"), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Falha no login. Verifique e-mail e senha."),
    ).toBeInTheDocument();
  });

  it("valida localmente antes de tentar cadastrar (senha curta)", async () => {
    const user = userEvent.setup();
    render(<AuthModal open onClose={vi.fn()} onEsqueciSenha={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail"), "teste@teste.com");
    await user.type(screen.getByLabelText("Senha"), "123");
    await user.click(screen.getByRole("button", { name: "Criar Conta" }));

    expect(cadastrar).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/senha menor que 6 caracteres/),
    ).toBeInTheDocument();
  });

  it("cadastra com sucesso e fecha o modal", async () => {
    cadastrar.mockResolvedValue({ error: null });
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<AuthModal open onClose={onClose} onEsqueciSenha={vi.fn()} />);

    await user.type(screen.getByLabelText("E-mail"), "novo@teste.com");
    await user.type(screen.getByLabelText("Senha"), "123456");
    await user.click(screen.getByRole("button", { name: "Criar Conta" }));

    expect(cadastrar).toHaveBeenCalledWith("novo@teste.com", "123456");
    expect(onClose).toHaveBeenCalled();
  });

  it("aciona o login com Google", async () => {
    loginComGoogle.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    render(<AuthModal open onClose={vi.fn()} onEsqueciSenha={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Google/ }));

    expect(loginComGoogle).toHaveBeenCalled();
  });

  it("aciona onEsqueciSenha com o e-mail já digitado", async () => {
    const onEsqueciSenha = vi.fn();
    const user = userEvent.setup();

    render(<AuthModal open onClose={vi.fn()} onEsqueciSenha={onEsqueciSenha} />);
    await user.type(screen.getByLabelText("E-mail"), "meuemail@teste.com");
    await user.click(screen.getByText("Esqueci minha senha"));

    expect(onEsqueciSenha).toHaveBeenCalledWith("meuemail@teste.com");
  });
});
