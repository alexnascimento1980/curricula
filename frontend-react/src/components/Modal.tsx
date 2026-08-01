import { Modal as BootstrapModal } from "bootstrap";
import { type ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  id: string;
  titleId: string;
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  /** "static" = clicar fora não fecha (usado no modal de nova senha, pra
   * não perder a sessão de recuperação por engano). */
  backdrop?: boolean | "static";
  /** false = tecla Esc não fecha (mesmo caso do "static" acima). */
  keyboard?: boolean;
  children: ReactNode;
}

/**
 * Wrapper declarativo em cima do bootstrap.Modal (imperativo por natureza).
 * Reaproveita o foco/acessibilidade que o Bootstrap já resolve (focus
 * trap, Esc, aria-modal) em vez de reimplementar — o app antigo já
 * validou esse comportamento com NVDA.
 */
export function Modal({
  id,
  titleId,
  title,
  open,
  onClose,
  backdrop = true,
  keyboard = true,
  children,
}: ModalProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const instanciaRef = useRef<BootstrapModal | null>(null);
  const onCloseRef = useRef(onClose);

  // Mantém a ref sempre com a versão mais recente de onClose, sem mutar
  // durante o render (só em efeito, depois de cada render).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Cria a instância do bootstrap.Modal uma vez, e escuta o evento nativo
  // 'hidden.bs.modal' — disparado quando o modal fecha por qualquer via
  // que não seja nosso próprio onClose (clique no backdrop, Esc, botão
  // "X"). Sem isso, o estado do React ficaria dessincronizado do que
  // está na tela.
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const instancia = new BootstrapModal(el, { backdrop, keyboard });
    instanciaRef.current = instancia;

    function aoFecharPeloBootstrap() {
      onCloseRef.current();
    }
    el.addEventListener("hidden.bs.modal", aoFecharPeloBootstrap);

    return () => {
      el.removeEventListener("hidden.bs.modal", aoFecharPeloBootstrap);
      instancia.dispose();
      instanciaRef.current = null;
    };
    // backdrop/keyboard só valem na criação; mudar em runtime não é um
    // caso de uso que a gente precisa suportar aqui.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      instanciaRef.current?.show();
    } else {
      instanciaRef.current?.hide();
    }
  }, [open]);

  return (
    <div
      className="modal fade"
      id={id}
      tabIndex={-1}
      aria-hidden="true"
      aria-labelledby={titleId}
      ref={elRef}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-gradient-primary text-white">
            <h5 className="modal-title fw-bold" id={titleId}>
              {title}
            </h5>
            {keyboard !== false && backdrop !== "static" && (
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Fechar modal"
                onClick={onClose}
              />
            )}
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
