import type { Projeto } from "../../types/curriculo";

interface ProjetoBlockProps {
  indice: number;
  dados: Projeto;
  obrigatorio: boolean;
  onAtualizar: <K extends keyof Projeto>(campo: K, valor: Projeto[K]) => void;
  onRemover: () => void;
}

const PADRAO_LINK = "https?://.+";

export function ProjetoBlock({
  indice,
  dados,
  obrigatorio,
  onAtualizar,
  onRemover,
}: ProjetoBlockProps) {
  const prefixo = `proj-${indice}`;

  return (
    <div className="card mb-3 shadow-sm border-start border-warning border-4 fade-in">
      <div className="card-body bg-white rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0 text-warning fw-bold h6">
            <i className="fas fa-code-branch me-2" aria-hidden="true"></i>
            {dados.name || "Novo Projeto"}
          </h3>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={onRemover}
            aria-label="Remover este projeto"
          >
            <i className="fas fa-trash-alt" aria-hidden="true"></i> Remover
          </button>
        </div>

        <div className="row mb-2">
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-name`}
            >
              Nome
            </label>
            <input
              type="text"
              id={`${prefixo}-name`}
              className="form-control"
              required={obrigatorio}
              value={dados.name}
              onChange={(e) => onAtualizar("name", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-tech`}
            >
              Tecnologias
            </label>
            <input
              type="text"
              id={`${prefixo}-tech`}
              className="form-control"
              required={obrigatorio}
              value={dados.tech}
              onChange={(e) => onAtualizar("tech", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-link`}
            >
              Link
            </label>
            <input
              type="text"
              id={`${prefixo}-link`}
              className="form-control"
              required={obrigatorio}
              pattern={PADRAO_LINK}
              value={dados.link}
              onChange={(e) => onAtualizar("link", e.target.value)}
            />
          </div>
        </div>

        <div className="mb-2">
          <label
            className="form-label fw-bold text-muted small"
            htmlFor={`${prefixo}-desc`}
          >
            Descrição
          </label>
          <textarea
            id={`${prefixo}-desc`}
            className="form-control"
            rows={2}
            required={obrigatorio}
            value={dados.desc}
            onChange={(e) => onAtualizar("desc", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
