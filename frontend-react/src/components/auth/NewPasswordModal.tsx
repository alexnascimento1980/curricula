import { type FormEvent, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../Modal";

export function NewPasswordModal() {
  const { emRecuperacaoDeSenha, emailParaRecuperacao, salvarNovaSenha, fecharFluxoDeRecuperacao } =
    useAuth();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();

    if (!novaSenha || novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setErro("");
    setEnviando(true);
    const { error } = await salvarNovaSenha(novaSenha);
    setEnviando(false);

    if (error) {
      setErro("Erro ao salvar nova senha: " + error.message);
      return;
    }
    setNovaSenha("");
    setConfirmacao("");
  }

  return (
    <Modal
      id="newPasswordModal"
      titleId="newPasswordModalTitle"
      open={emRecuperacaoDeSenha}
      onClose={fecharFluxoDeRecuperacao}
      backdrop="static"
      keyboard={false}
      title={
        <>
          <i className="fas fa-key me-2" aria-hidden="true"></i> Definir Nova
          Senha
        </>
      }
    >
      <p className="small text-muted">
        Você clicou num link de recuperação de senha. Escolha uma nova senha
        pra continuar.
      </p>
      <form onSubmit={aoSubmeter}>
        {/* Campo oculto exigido pelas boas práticas de acessibilidade de
            formulários de senha: ajuda gerenciadores de senha e leitores
            de tela a associarem a nova senha à conta certa, mesmo sem um
            campo de login visível nesta tela. */}
        <input
          type="email"
          id="new-password-username"
          name="username"
          autoComplete="username"
          className="visually-hidden-focusable"
          tabIndex={-1}
          aria-hidden="true"
          readOnly
          value={emailParaRecuperacao}
        />
        <div className="mb-3">
          <label className="form-label fw-bold" htmlFor="new-password">
            Nova senha
          </label>
          <input
            type="password"
            className="form-control"
            id="new-password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label
            className="form-label fw-bold"
            htmlFor="new-password-confirm"
          >
            Confirmar nova senha
          </label>
          <input
            type="password"
            className="form-control"
            id="new-password-confirm"
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
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
            {enviando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
