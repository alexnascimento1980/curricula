import { type FormEvent, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../Modal";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onEsqueciSenha: (emailDigitado: string) => void;
}

export function AuthModal({ open, onClose, onEsqueciSenha }: AuthModalProps) {
  const { login, cadastrar, loginComGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviandoLogin, setEnviandoLogin] = useState(false);
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);

  async function aoSubmeterLogin(evento: FormEvent) {
    evento.preventDefault();
    setErro("");
    setEnviandoLogin(true);
    const { error } = await login(email, senha);
    setEnviandoLogin(false);
    if (error) {
      setErro("Falha no login. Verifique e-mail e senha.");
      return;
    }
    onClose();
  }

  async function aoClicarCriarConta() {
    if (!email || senha.length < 6) {
      setErro("E-mail inválido ou senha menor que 6 caracteres.");
      return;
    }
    setErro("");
    setEnviandoCadastro(true);
    const { error } = await cadastrar(email, senha);
    setEnviandoCadastro(false);
    if (error) {
      setErro(error.message);
      return;
    }
    onClose();
  }

  async function aoClicarGoogle() {
    setErro("");
    const { error } = await loginComGoogle();
    if (error) setErro("Erro no login com Google: " + error.message);
  }

  return (
    <Modal
      id="authModal"
      titleId="authModalTitle"
      open={open}
      onClose={onClose}
      title={
        <>
          <i className="fas fa-lock me-2" aria-hidden="true"></i> Área do
          Candidato
        </>
      }
    >
      <form onSubmit={aoSubmeterLogin}>
        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="auth-email">
            E-mail
          </label>
          <input
            type="email"
            className="form-control"
            id="auth-email"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="form-label fw-bold" htmlFor="auth-password">
            Senha
          </label>
          <input
            type="password"
            className="form-control"
            id="auth-password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && (
          <div
            className="text-danger small mb-3 fw-bold"
            aria-live="assertive"
            role="alert"
          >
            {erro}
          </div>
        )}

        <div className="d-grid gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={enviandoLogin}
          >
            {enviandoLogin ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={enviandoCadastro}
            onClick={aoClicarCriarConta}
          >
            {enviandoCadastro ? "Criando..." : "Criar Conta"}
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={aoClicarGoogle}
          >
            <i className="fab fa-google me-2" aria-hidden="true"></i> Google
          </button>
        </div>
        <div className="text-center mt-3">
          <a
            href="#"
            className="small text-muted"
            onClick={(e) => {
              e.preventDefault();
              onEsqueciSenha(email);
            }}
          >
            Esqueci minha senha
          </a>
        </div>
      </form>
    </Modal>
  );
}
