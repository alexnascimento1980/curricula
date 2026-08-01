import { useEffect, useRef, useState } from "react";
import {
  type TamanhoFonte,
  useAccessibilityPreferences,
} from "../hooks/useAccessibilityPreferences";
import "./AccessibilityPanel.css";

const OPCOES_FONTE: { valor: TamanhoFonte; rotulo: string; rotuloCompleto: string }[] = [
  { valor: "normal", rotulo: "A", rotuloCompleto: "normal" },
  { valor: "md", rotulo: "A+", rotuloCompleto: "médio" },
  { valor: "lg", rotulo: "A++", rotuloCompleto: "grande" },
];

export function AccessibilityPanel() {
  const {
    preferencias,
    definirTamanhoFonte,
    definirAltoContraste,
    definirReduzirMovimento,
  } = useAccessibilityPreferences();

  const [aberto, setAberto] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const primeiroBotaoRef = useRef<HTMLButtonElement>(null);

  // Ao abrir, move o foco pro primeiro controle do painel — replica o
  // comportamento esperado de um popover/menu acessível.
  useEffect(() => {
    if (aberto) {
      primeiroBotaoRef.current?.focus();
    }
  }, [aberto]);

  // Fecha ao clicar fora do painel/botão (mas sem devolver o foco — só
  // Esc faz isso, igual ao comportamento original).
  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(alvo) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener("click", aoClicarFora);
    return () => document.removeEventListener("click", aoClicarFora);
  }, [aberto]);

  function aoTecla(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (evento.key === "Escape") {
      setAberto(false);
      toggleBtnRef.current?.focus();
    }
  }

  return (
    <>
      <button
        ref={toggleBtnRef}
        type="button"
        id="a11y-toggle-btn"
        aria-expanded={aberto}
        aria-controls="a11y-panel"
        aria-label="Abrir opções de acessibilidade"
        onClick={() => setAberto((atual) => !atual)}
      >
        <span aria-hidden="true">♿</span>
      </button>

      <div
        ref={panelRef}
        id="a11y-panel"
        role="region"
        aria-label="Opções de acessibilidade"
        className={aberto ? "open" : undefined}
        onKeyDown={aoTecla}
      >
        <h2>Acessibilidade</h2>

        <div className="a11y-row">
          <label id="a11y-font-label">Tamanho da fonte</label>
          <div
            id="a11y-font-group"
            role="group"
            aria-labelledby="a11y-font-label"
          >
            {OPCOES_FONTE.map((opcao, indice) => (
              <button
                key={opcao.valor}
                ref={indice === 0 ? primeiroBotaoRef : undefined}
                type="button"
                aria-pressed={preferencias.fontSize === opcao.valor}
                onClick={() => definirTamanhoFonte(opcao.valor)}
              >
                {opcao.rotulo}
                <span className="visually-hidden-focusable">
                  {" "}
                  {opcao.rotuloCompleto}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="a11y-row form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="a11y-high-contrast"
            checked={preferencias.highContrast}
            onChange={(evento) => definirAltoContraste(evento.target.checked)}
          />
          <label className="form-check-label" htmlFor="a11y-high-contrast">
            Alto contraste
          </label>
        </div>

        <div className="a11y-row form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="a11y-reduce-motion"
            checked={preferencias.reduceMotion}
            onChange={(evento) =>
              definirReduzirMovimento(evento.target.checked)
            }
          />
          <label className="form-check-label" htmlFor="a11y-reduce-motion">
            Reduzir movimento/animações
          </label>
        </div>
      </div>
    </>
  );
}
