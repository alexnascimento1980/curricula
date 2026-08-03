import type { Projeto } from "../../types/curriculo";
import { ProjetoBlock } from "./ProjetoBlock";
import { SectionToggleHeader } from "./SectionToggleHeader";

interface ProjetoSectionProps {
  itens: Projeto[];
  incluido: boolean;
  onMudarIncluido: (valor: boolean) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
  onAtualizar: <K extends keyof Projeto>(
    indice: number,
    campo: K,
    valor: Projeto[K],
  ) => void;
}

export function ProjetoSection({
  itens,
  incluido,
  onMudarIncluido,
  onAdicionar,
  onRemover,
  onAtualizar,
}: ProjetoSectionProps) {
  return (
    <>
      <SectionToggleHeader
        numero="06"
        titulo="Projetos Técnicos"
        toggleId="include-projects"
        incluido={incluido}
        onMudarIncluido={onMudarIncluido}
      />
      <div id="projetos-container">
        {itens.map((item, indice) => (
          <ProjetoBlock
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
        className="btn btn-outline-warning btn-add mb-4"
        onClick={onAdicionar}
      >
        <i className="fas fa-plus" aria-hidden="true"></i> Adicionar Projeto
      </button>
    </>
  );
}
