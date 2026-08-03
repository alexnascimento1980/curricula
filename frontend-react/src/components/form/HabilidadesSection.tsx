interface HabilidadesSectionProps {
  valor: string;
  onMudar: (valor: string) => void;
}

export function HabilidadesSection({ valor, onMudar }: HabilidadesSectionProps) {
  return (
    <>
      <h2 className="mb-0 text-primary section-title border-bottom pb-2 mb-4 mt-5">
        <span className="section-num">07</span> Habilidades e Ferramentas
      </h2>
      <div className="mb-4">
        <label className="visually-hidden-focusable" htmlFor="skills">
          Habilidades e ferramentas
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          id="skills"
          placeholder="Ex: Python, SQL, Excel..."
          required
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
        />
      </div>
    </>
  );
}
