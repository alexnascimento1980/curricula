import { useCallback, useEffect, useRef } from "react";

export interface ControleAutosave {
  /** Executa o salvamento pendente imediatamente (se houver) e cancela o
   * timer, sem esperar o debounce. Usado antes de trocar de currículo —
   * sem isso, o timer antigo dispararia depois da troca e salvaria dados
   * errados no currículo novo. */
  flush: () => Promise<void>;
  /** Descarta o salvamento agendado sem executá-lo — usado ao excluir o
   * currículo que está sendo editado no momento. */
  cancelar: () => void;
}

/**
 * Chama onSalvar(dados) automaticamente, com debounce, toda vez que
 * `dados` muda — mas nunca na primeira renderização (evita salvar
 * imediatamente ao carregar/restaurar um currículo já existente).
 */
export function useAutosave<T>(
  dados: T,
  onSalvar: (dados: T) => void | Promise<void>,
  delayMs = 1500,
): ControleAutosave {
  const primeiraRenderizacao = useRef(true);
  const onSalvarRef = useRef(onSalvar);
  const dadosRef = useRef(dados);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onSalvarRef.current = onSalvar;
  });

  useEffect(() => {
    dadosRef.current = dados;
  });

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      onSalvarRef.current(dadosRef.current);
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [dados, delayMs]);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      await onSalvarRef.current(dadosRef.current);
    }
  }, []);

  const cancelar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { flush, cancelar };
}
