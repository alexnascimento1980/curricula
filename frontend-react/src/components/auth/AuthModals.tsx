import { useState } from "react";
import { AuthBanner } from "./AuthBanner";
import { AuthModal } from "./AuthModal";
import { NewPasswordModal } from "./NewPasswordModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

type ModalAtivo = "nenhum" | "login" | "recuperar-senha";

/**
 * Ponto único de entrada pra tudo relacionado a autenticação: o banner do
 * topo e os 3 modais (login/cadastro, recuperar senha, definir nova
 * senha). O modal de nova senha não é controlado por este componente —
 * ele observa o contexto diretamente, porque pode ser aberto de fora
 * (link de e-mail / callback OAuth), não só por um clique na tela.
 */
export function AuthModals() {
  const [modalAtivo, setModalAtivo] = useState<ModalAtivo>("nenhum");
  const [emailParaReset, setEmailParaReset] = useState("");

  return (
    <>
      <AuthBanner onAbrirLogin={() => setModalAtivo("login")} />

      <AuthModal
        open={modalAtivo === "login"}
        onClose={() => setModalAtivo("nenhum")}
        onEsqueciSenha={(emailDigitado) => {
          setEmailParaReset(emailDigitado);
          setModalAtivo("recuperar-senha");
        }}
      />

      <ResetPasswordModal
        open={modalAtivo === "recuperar-senha"}
        onClose={() => setModalAtivo("nenhum")}
        emailInicial={emailParaReset}
      />

      <NewPasswordModal />
    </>
  );
}
