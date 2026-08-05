import { Offcanvas as BootstrapOffcanvas } from "bootstrap";
import { type ReactNode, useEffect, useRef } from "react";

interface OffcanvasProps {
  id: string;
  titleId: string;
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/** Mesma ideia do componente Modal: wrapper declarativo em cima do
 * bootstrap.Offcanvas imperativo, com sincronia nos dois sentidos. */
export function Offcanvas({
  id,
  titleId,
  title,
  open,
  onClose,
  children,
}: OffcanvasProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const instanciaRef = useRef<BootstrapOffcanvas | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const instancia = new BootstrapOffcanvas(el);
    instanciaRef.current = instancia;

    function aoFecharPeloBootstrap() {
      onCloseRef.current();
    }
    el.addEventListener("hidden.bs.offcanvas", aoFecharPeloBootstrap);

    return () => {
      el.removeEventListener("hidden.bs.offcanvas", aoFecharPeloBootstrap);
      instancia.dispose();
      instanciaRef.current = null;
    };
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
      className="offcanvas offcanvas-end"
      tabIndex={-1}
      id={id}
      aria-labelledby={titleId}
      ref={elRef}
    >
      <div className="offcanvas-header bg-gradient-primary text-white">
        <h5 className="offcanvas-title fw-bold" id={titleId}>
          {title}
        </h5>
        <button
          type="button"
          className="btn-close btn-close-white"
          aria-label="Fechar painel"
          onClick={onClose}
        />
      </div>
      <div className="offcanvas-body p-0">{children}</div>
    </div>
  );
}
