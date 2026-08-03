import type { Experiencia } from "../../types/curriculo";
import { ExperienciaBlock } from "./ExperienciaBlock";
import { SectionToggleHeader } from "./SectionToggleHeader";

interface ExperienciaSectionProps {
  itens: Experiencia[];
  incluido: boolean;
  onMudarIncluido: (valor: boolean) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
  onAtualizar: <K extends keyof Experiencia>(
    indice: number,
    campo: K,
    valor: Experiencia[K],
  ) => void;
}

export function ExperienciaSection({
  itens,
  incluido,
  onMudarIncluido,
  onAdicionar,
  onRemover,
  onAtualizar,
}: ExperienciaSectionProps) {
  return (
    <>
      <SectionToggleHeader
        numero="03"
        titulo="Experiência Profissional"
        toggleId="include-experience"
        incluido={incluido}
        onMudarIncluido={onMudarIncluido}
      />
      <div id="experiencias-container">
        {itens.map((item, indice) => (
          <ExperienciaBlock
            key={indice}
            indice={indice}
            dados={item}
            obrigatorio={incluido}
            onAtualizar={(campo, valor) => onAtualizar(indice, campo, valor)}
            onRemover={() => onRemover(indice)}
          />
        ))}
      </div>
      <button
        type="button"
        className="btn btn-outline-primary btn-add mb-4"
        onClick={onAdicionar}
      >
        <i className="fas fa-plus" aria-hidden="true"></i> Adicionar
        Experiência
      </button>
    </>
  );
}
