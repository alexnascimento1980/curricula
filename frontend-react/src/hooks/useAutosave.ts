import { useEffect, useRef } from "react";

/**
 * Chama onSalvar(dados) automaticamente, com debounce, toda vez que
 * `dados` muda — mas nunca na primeira renderização (evita salvar
 * imediatamente ao carregar/restaurar um currículo já existente).
 */
export function useAutosave<T>(
  dados: T,
  onSalvar: (dados: T) => void,
  delayMs = 1500,
) {
  const primeiraRenderizacao = useRef(true);
  const onSalvarRef = useRef(onSalvar);

  useEffect(() => {
    onSalvarRef.current = onSalvar;
  });

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      onSalvarRef.current(dados);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [dados, delayMs]);
}
