import type { Experiencia } from "../../types/curriculo";

interface ExperienciaBlockProps {
  indice: number;
  dados: Experiencia;
  obrigatorio: boolean;
  onAtualizar: <K extends keyof Experiencia>(
    campo: K,
    valor: Experiencia[K],
  ) => void;
  onRemover: () => void;
}

export function ExperienciaBlock({
  indice,
  dados,
  obrigatorio,
  onAtualizar,
  onRemover,
}: ExperienciaBlockProps) {
  const prefixo = `exp-${indice}`;

  return (
    <div className="card mb-3 shadow-sm border-start border-primary border-4 fade-in">
      <div className="card-body bg-white rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0 text-primary fw-bold h6">
            <i className="fas fa-building me-2" aria-hidden="true"></i>
            {dados.company || "Nova Experiência"}
          </h3>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm rounded-pill"
            onClick={onRemover}
            aria-label="Remover esta experiência"
          >
            <i className="fas fa-trash-alt" aria-hidden="true"></i> Remover
          </button>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-company`}
            >
              Empresa
            </label>
            <input
              type="text"
              id={`${prefixo}-company`}
              className="form-control"
              required={obrigatorio}
              value={dados.company}
              onChange={(e) => onAtualizar("company", e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-position`}
            >
              Cargo
            </label>
            <input
              type="text"
              id={`${prefixo}-position`}
              className="form-control"
              required={obrigatorio}
              value={dados.position}
              onChange={(e) => onAtualizar("position", e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
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
          <div className="col-md-6">
            <label
              className="form-label fw-bold text-muted small"
              htmlFor={`${prefixo}-end`}
            >
              Mês/Ano Fim
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
                className="form-check-label text-primary fw-bold small"
                htmlFor={`chk-${prefixo}`}
              >
                Trabalho aqui atualmente
              </label>
            </div>
          </div>
        </div>

        <div className="mb-2">
          <label
            className="form-label fw-bold text-muted small"
            htmlFor={`${prefixo}-highlights`}
          >
            Atividades (separe por ";")
          </label>
          <textarea
            id={`${prefixo}-highlights`}
            className="form-control"
            rows={3}
            required={obrigatorio}
            value={dados.highlights}
            onChange={(e) => onAtualizar("highlights", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
