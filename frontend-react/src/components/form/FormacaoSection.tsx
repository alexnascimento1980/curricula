import type { Formacao } from "../../types/curriculo";
import { FormacaoBlock } from "./FormacaoBlock";
import { SectionToggleHeader } from "./SectionToggleHeader";

interface FormacaoSectionProps {
  itens: Formacao[];
  incluido: boolean;
  onMudarIncluido: (valor: boolean) => void;
  onAdicionar: () => void;
  onRemover: (indice: number) => void;
  onAtualizar: <K extends keyof Formacao>(
    indice: number,
    campo: K,
    valor: Formacao[K],
  ) => void;
}

export function FormacaoSection({
  itens,
  incluido,
  onMudarIncluido,
  onAdicionar,
  onRemover,
  onAtualizar,
}: FormacaoSectionProps) {
  return (
    <>
      <SectionToggleHeader
        numero="04"
        titulo="Formação Acadêmica"
        toggleId="include-education"
        incluido={incluido}
        onMudarIncluido={onMudarIncluido}
      />
      <div id="formacao-container">
        {itens.map((item, indice) => (
          <FormacaoBlock
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
        className="btn btn-outline-info btn-add mb-4"
        onClick={onAdicionar}
      >
        <i className="fas fa-plus" aria-hidden="true"></i> Adicionar Formação
      </button>
    </>
  );
}
