import type { Notificacao } from "../hooks/useNotificacoes";

interface NotificacaoContainerProps {
  notificacoes: Notificacao[];
  onDispensar: (id: number) => void;
}

export function NotificacaoContainer({
  notificacoes,
  onDispensar,
}: NotificacaoContainerProps) {
  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1100 }}
      aria-live="assertive"
      role="alert"
    >
      {notificacoes.map((n) => (
        <div
          key={n.id}
          className={`alert alert-${n.tipo} alert-dismissible fade show`}
        >
          {n.mensagem}
          <button
            type="button"
            className="btn-close"
            aria-label="Fechar notificação"
            onClick={() => onDispensar(n.id)}
          />
        </div>
      ))}
    </div>
  );
}
