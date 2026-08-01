import { type FormEvent, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../Modal";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  emailInicial: string;
}

export function ResetPasswordModal({
  open,
  onClose,
  emailInicial,
}: ResetPasswordModalProps) {
  const { enviarLinkRecuperacao } = useAuth();
  const [email, setEmail] = useState(emailInicial);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Preenche com o e-mail já digitado no modal de login toda vez que este
  // modal é reaberto — ajustado durante o render (padrão recomendado pelo
  // React pra "resetar estado quando uma prop muda"), em vez de um efeito
  // com setState, que causaria uma renderização em cascata desnecessária.
  const [openAnterior, setOpenAnterior] = useState(open);
  if (open !== openAnterior) {
    setOpenAnterior(open);
    if (open) {
      setEmail(emailInicial);
      setErro("");
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const emailLimpo = email.trim();
    if (!emailLimpo || !emailLimpo.includes("@")) {
      setErro("Digite um e-mail válido.");
      return;
    }
    setErro("");
    setEnviando(true);
    const { error } = await enviarLinkRecuperacao(emailLimpo);
    setEnviando(false);
    if (error) {
      setErro("Erro ao enviar e-mail: " + error.message);
      return;
    }
    onClose();
  }

  return (
    <Modal
      id="resetPasswordModal"
      titleId="resetPasswordModalTitle"
      open={open}
      onClose={onClose}
      title={
        <>
          <i className="fas fa-key me-2" aria-hidden="true"></i> Recuperar
          Senha
        </>
      }
    >
      <p className="small text-muted">
        Digite o e-mail da sua conta. Vamos enviar um link pra você definir
        uma nova senha.
      </p>
      <form onSubmit={aoSubmeter}>
        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="reset-email">
            E-mail
          </label>
          <input
            type="email"
            className="form-control"
            id="reset-email"
            placeholder="seu@email.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <div className="d-grid">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
