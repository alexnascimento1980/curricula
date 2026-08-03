import type { Curso } from "../../types/curriculo";
import { CursoBlock } from "./CursoBlock";
import { SectionToggleHeader } from "./SectionToggleHeader";

interface CursoSectionProps {
  itens: Curso[];
  incluido: boolean;
  onMudarIncluido: (valor: boolean) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
  onAtualizar: <K extends keyof Curso>(
    indice: number,
    campo: K,
    valor: Curso[K],
  ) => void;
}

export function CursoSection({
  itens,
  incluido,
  onMudarIncluido,
  onAdicionar,
  onRemover,
  onAtualizar,
}: CursoSectionProps) {
  return (
    <>
      <SectionToggleHeader
        numero="05"
        titulo="Cursos Complementares"
        toggleId="include-courses"
        incluido={incluido}
        onMudarIncluido={onMudarIncluido}
      />
      <div id="cursos-container">
        {itens.map((item, indice) => (
          <CursoBlock
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
        className="btn btn-outline-success btn-add mb-4"
        onClick={onAdicionar}
      >
        <i className="fas fa-plus" aria-hidden="true"></i> Adicionar Curso
      </button>
    </>
  );
}
