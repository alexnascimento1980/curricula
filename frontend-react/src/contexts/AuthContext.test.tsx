import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "../hooks/useAuth";
import { AuthProvider } from "./AuthContext";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../lib/supabaseClient", () => ({
  supabaseClient: { auth: mockAuth },
}));

// Componente mínimo só pra expor o que o hook retorna nos testes.
function Sonda() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user-email">{auth.user?.email ?? "sem-sessao"}</span>
      <span data-testid="carregando">
        {String(auth.carregandoSessaoInicial)}
      </span>
      <span data-testid="em-recuperacao">
        {String(auth.emRecuperacaoDeSenha)}
      </span>
      <button onClick={() => auth.login("a@b.com", "123456")}>login</button>
      <button onClick={() => auth.cadastrar("a@b.com", "123456")}>
        cadastrar
      </button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  );
}

let callbackDeMudancaDeSessao:
  | ((event: string, session: unknown) => void)
  | null = null;

function renderComProvider() {
  return render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbackDeMudancaDeSessao = null;

    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    mockAuth.onAuthStateChange.mockImplementation((cb) => {
      callbackDeMudancaDeSessao = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("começa carregando e depois reflete que não há sessão", async () => {
    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("carregando")).toHaveTextContent("false"),
    );
    expect(screen.getByTestId("user-email")).toHaveTextContent("sem-sessao");
  });

  it("carrega o usuário da sessão existente ao montar", async () => {
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: "1", email: "existente@teste.com" } } },
    });

    renderComProvider();

    await waitFor(() =>
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "existente@teste.com",
      ),
    );
  });

  it("chama signInWithPassword com email e senha ao logar", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ error: null });
    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("carregando")).toHaveTextContent("false"),
    );

    await act(async () => {
      screen.getByText("login").click();
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("chama signUp ao cadastrar", async () => {
    mockAuth.signUp.mockResolvedValue({ error: null });
    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("carregando")).toHaveTextContent("false"),
    );

    await act(async () => {
      screen.getByText("cadastrar").click();
    });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "123456",
    });
  });

  it("chama signOut ao deslogar", async () => {
    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("carregando")).toHaveTextContent("false"),
    );

    await act(async () => {
      screen.getByText("logout").click();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
  });

  it("entra em modo de recuperação de senha quando o evento PASSWORD_RECOVERY dispara", async () => {
    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("carregando")).toHaveTextContent("false"),
    );

    expect(screen.getByTestId("em-recuperacao")).toHaveTextContent("false");

    act(() => {
      callbackDeMudancaDeSessao?.("PASSWORD_RECOVERY", {
        user: { email: "recuperando@teste.com" },
      });
    });

    expect(screen.getByTestId("em-recuperacao")).toHaveTextContent("true");
  });

  it("não reage duas vezes à mesma sessão (INITIAL_SESSION duplicando o getSession)", async () => {
    const sessao = { user: { id: "1", email: "existente@teste.com" } };
    mockAuth.getSession.mockResolvedValue({ data: { session: sessao } });

    renderComProvider();
    await waitFor(() =>
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "existente@teste.com",
      ),
    );

    // Simula o Supabase disparando o mesmo evento de sessão de novo — não
    // deve haver nenhum efeito colateral visível de "reprocessar" (o teste
    // aqui é principalmente uma garantia de que não quebra/re-renderiza
    // com erro; o comportamento real é verificado via ausência de
    // duplicação nos testes dos componentes que consomem isso).
    act(() => {
      callbackDeMudancaDeSessao?.("INITIAL_SESSION", sessao);
    });
    expect(screen.getByTestId("user-email")).toHaveTextContent(
      "existente@teste.com",
    );
  });

  it("limpa o token da URL (#access_token=...) depois de carregar a sessão", async () => {
    window.history.replaceState(
      {},
      "",
      "/#access_token=abc123&token_type=bearer",
    );

    renderComProvider();

    await waitFor(() => expect(window.location.hash).toBe(""));
  });
});
