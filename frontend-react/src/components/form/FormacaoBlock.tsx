import type { Formacao } from "../../types/curriculo";

interface FormacaoBlockProps {
  indice: number;
  dados: Formacao;
  obrigatorio: boolean;
  onAtualizar: <K extends keyof Formacao>(
    campo: K,
    valor: Formacao[K],
  ) => void;
  onRemover: () => void;
}

export function FormacaoBlock({
  indice,
  dados,
  obrigatorio,
  onAtualizar,
  onRemover,
}: FormacaoBlockProps) {
  const prefixo = `edu-${indice}`;

  return (
    <div className="card mb-3 shadow-sm border-start border-info border-4 fade-in">
      <div className="card-body bg-white rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0 text-info fw-bold h6">
            <i className="fas fa-university me-2" aria-hidden="true"></i>
            {dados.institution || "Nova Formação"}
          </h3>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={onRemover}
            aria-label="Remover esta formação"
          >
            <i className="fas fa-trash-alt" aria-hidden="true"></i> Remover
          </button>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-institution`}
            >
              Instituição
            </label>
            <input
              type="text"
              id={`${prefixo}-institution`}
              className="form-control"
              required={obrigatorio}
              value={dados.institution}
              onChange={(e) => onAtualizar("institution", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-area`}
            >
              Curso
            </label>
            <input
              type="text"
              id={`${prefixo}-area`}
              className="form-control"
              required={obrigatorio}
              value={dados.area}
              onChange={(e) => onAtualizar("area", e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-start`}
            >
              Mês/Ano Início
            </label>
            <input
              type="month"
              id={`${prefixo}-start`}
              className="form-control"
              required={obrigatorio}
              value={dados.start}
              onChange={(e) => onAtualizar("start", e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-end`}
            >
              Mês/Ano Término
            </label>
            <input
              type="month"
              id={`${prefixo}-end`}
              className="form-control"
              required={obrigatorio && !dados.isCurrent}
              disabled={dados.isCurrent}
              value={dados.isCurrent ? "" : dados.end}
              onChange={(e) => onAtualizar("end", e.target.value)}
            />
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={`chk-${prefixo}`}
                checked={dados.isCurrent}
                onChange={(e) => {
                  onAtualizar("isCurrent", e.target.checked);
                  if (e.target.checked) onAtualizar("end", "");
                }}
              />
              <label
                className="form-check-label text-info fw-bold small"
                htmlFor={`chk-${prefixo}`}
              >
                Cursando atualmente
              </label>
            </div>
          </div>
          <div className="col-md-4">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-status`}
            >
              Status
            </label>
            <input
              type="text"
              id={`${prefixo}-status`}
              className="form-control"
              required={obrigatorio}
              value={dados.status}
              onChange={(e) => onAtualizar("status", e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
