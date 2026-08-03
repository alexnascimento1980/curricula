import { useCallback, useRef, useState } from "react";

export type TipoNotificacao = "info" | "danger" | "success" | "warning";

export interface Notificacao {
  id: number;
  mensagem: string;
  tipo: TipoNotificacao;
}

/**
 * Sistema de notificações toast (canto superior direito), replicando
 * mostrarNotificacao() do script.js original: some sozinha depois de 5s.
 */
export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const proximoId = useRef(0);

  const notificar = useCallback(
    (mensagem: string, tipo: TipoNotificacao = "info") => {
      const id = proximoId.current++;
      setNotificacoes((atual) => [...atual, { id, mensagem, tipo }]);
      setTimeout(() => {
        setNotificacoes((atual) => atual.filter((n) => n.id !== id));
      }, 5000);
    },
    [],
  );

  const dispensar = useCallback((id: number) => {
    setNotificacoes((atual) => atual.filter((n) => n.id !== id));
  }, []);

  return { notificacoes, notificar, dispensar };
}
