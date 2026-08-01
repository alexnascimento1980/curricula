import { useCallback, useEffect, useState } from "react";

export type TamanhoFonte = "normal" | "md" | "lg";

export interface PreferenciasAcessibilidade {
  fontSize: TamanhoFonte;
  highContrast: boolean;
  reduceMotion: boolean;
}

const STORAGE_KEY = "curricula-a11y-prefs";

const PADRAO: PreferenciasAcessibilidade = {
  fontSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

function lerPreferenciasSalvas(): PreferenciasAcessibilidade {
  try {
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      fontSize: salvo.fontSize ?? PADRAO.fontSize,
      highContrast: Boolean(salvo.highContrast),
      reduceMotion: Boolean(salvo.reduceMotion),
    };
  } catch {
    return PADRAO;
  }
}

function salvarPreferencias(prefs: PreferenciasAcessibilidade) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Se o localStorage estiver indisponível (ex: modo privado em alguns
    // navegadores), a aplicação continua funcionando sem persistência —
    // as preferências só duram a sessão atual.
  }
}

/**
 * Gerencia as preferências de acessibilidade (tamanho de fonte, alto
 * contraste, redução de movimento), persistindo no localStorage e
 * aplicando as classes correspondentes em <html> — são classes globais
 * porque precisam afetar o documento inteiro, não só a árvore de
 * componentes deste painel.
 */
export function useAccessibilityPreferences() {
  const [preferencias, setPreferencias] =
    useState<PreferenciasAcessibilidade>(lerPreferenciasSalvas);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("a11y-font-md", "a11y-font-lg");
    if (preferencias.fontSize === "md") root.classList.add("a11y-font-md");
    if (preferencias.fontSize === "lg") root.classList.add("a11y-font-lg");

    root.classList.toggle("a11y-high-contrast", preferencias.highContrast);
    root.classList.toggle("a11y-reduce-motion", preferencias.reduceMotion);

    salvarPreferencias(preferencias);
  }, [preferencias]);

  const definirTamanhoFonte = useCallback((fontSize: TamanhoFonte) => {
    setPreferencias((atual) => ({ ...atual, fontSize }));
  }, []);

  const definirAltoContraste = useCallback((highContrast: boolean) => {
    setPreferencias((atual) => ({ ...atual, highContrast }));
  }, []);

  const definirReduzirMovimento = useCallback((reduceMotion: boolean) => {
    setPreferencias((atual) => ({ ...atual, reduceMotion }));
  }, []);

  return {
    preferencias,
    definirTamanhoFonte,
    definirAltoContraste,
    definirReduzirMovimento,
  };
}
