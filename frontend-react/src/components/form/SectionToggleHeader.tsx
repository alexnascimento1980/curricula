interface SectionToggleHeaderProps {
  numero: string;
  titulo: string;
  toggleId: string;
  incluido: boolean;
  onMudarIncluido: (valor: boolean) => void;
}

export function SectionToggleHeader({
  numero,
  titulo,
  toggleId,
  incluido,
  onMudarIncluido,
}: SectionToggleHeaderProps) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-4 mt-5">
      <h2 className="mb-0 text-primary section-title">
        <span className="section-num">{numero}</span> {titulo}
      </h2>
      <div className="form-check form-switch fs-5">
        <input
          className="form-check-input"
          type="checkbox"
          id={toggleId}
          checked={incluido}
          onChange={(e) => onMudarIncluido(e.target.checked)}
        />
        <label className="form-check-label" htmlFor={toggleId}>
          Incluir no PDF?
        </label>
      </div>
    </div>
  );
}
