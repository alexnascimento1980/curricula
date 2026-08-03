import type { Curso } from "../../types/curriculo";

interface CursoBlockProps {
  indice: number;
  dados: Curso;
  obrigatorio: boolean;
  onAtualizar: <K extends keyof Curso>(campo: K, valor: Curso[K]) => void;
  onRemover: () => void;
}

export function CursoBlock({
  indice,
  dados,
  obrigatorio,
  onAtualizar,
  onRemover,
}: CursoBlockProps) {
  const prefixo = `curso-${indice}`;

  return (
    <div className="card mb-3 shadow-sm border-start border-success border-4 fade-in">
      <div className="card-body bg-white rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0 text-success fw-bold h6">
            <i className="fas fa-award me-2" aria-hidden="true"></i>
            {dados.name || "Novo Curso"}
          </h3>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={onRemover}
            aria-label="Remover este curso"
          >
            <i className="fas fa-trash-alt" aria-hidden="true"></i> Remover
          </button>
        </div>

        <div className="row mb-2">
          <div className="col-md-5">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-name`}
            >
              Nome do Curso
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
          <div className="col-md-5">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-inst`}
            >
              Instituição
            </label>
            <input
              type="text"
              id={`${prefixo}-inst`}
              className="form-control"
              required={obrigatorio}
              value={dados.institution}
              onChange={(e) => onAtualizar("institution", e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-year`}
            >
              Ano
            </label>
            <input
              type="number"
              id={`${prefixo}-year`}
              className="form-control"
              required={obrigatorio}
              value={dados.year}
              onChange={(e) => onAtualizar("year", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
