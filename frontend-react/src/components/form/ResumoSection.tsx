// Mesmo limite do backend (LIMITE_CARACTERES_RESUMO em backend/app.py).
export const LIMITE_RESUMO = 1500;

interface ResumoSectionProps {
  valor: string;
  onMudar: (valor: string) => void;
}

export function ResumoSection({ valor, onMudar }: ResumoSectionProps) {
  return (
    <>
      <h2 className="mb-0 text-primary section-title border-bottom pb-2 mb-4 mt-5">
        <span className="section-num">02</span> Resumo Profissional
      </h2>
      <div className="mb-4">
        <label className="visually-hidden-focusable" htmlFor="summary_pt">
          Resumo profissional
        </label>
        <textarea
          className="form-control"
          id="summary_pt"
          rows={6}
          required
          maxLength={LIMITE_RESUMO}
          aria-describedby="summary_pt_contador"
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
        />
        <div id="summary_pt_contador" className="form-text text-end">
          {valor.length} / {LIMITE_RESUMO} caracteres
        </div>
      </div>
    </>
  );
}
