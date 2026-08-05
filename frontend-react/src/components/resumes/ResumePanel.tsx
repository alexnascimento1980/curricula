import type { ResumoDeCurriculo } from "../../lib/resumeService";
import { Offcanvas } from "../Offcanvas";

interface ResumePanelProps {
  open: boolean;
  onClose: () => void;
  resumes: ResumoDeCurriculo[];
  currentResumeId: string | null;
  onSelecionar: (id: string) => void;
  onNovo: () => void;
  onRenomear: (id: string, nomeAtual: string) => void;
  onExcluir: (id: string) => void;
}

export function ResumePanel({
  open,
  onClose,
  resumes,
  currentResumeId,
  onSelecionar,
  onNovo,
  onRenomear,
  onExcluir,
}: ResumePanelProps) {
  return (
    <Offcanvas
      id="resumePanel"
      titleId="resumePanelTitle"
      open={open}
      onClose={onClose}
      title={
        <>
          <i className="fas fa-folder-open me-2" aria-hidden="true"></i> Meus
          Currículos
        </>
      }
    >
      <div className="p-3 border-bottom">
        <button
          type="button"
          className="btn btn-primary w-100"
          onClick={onNovo}
        >
          <i className="fas fa-plus me-2" aria-hidden="true"></i> Novo
          Currículo
        </button>
      </div>

      {resumes.length === 0 && (
        <p className="text-muted text-center p-3">
          Nenhum currículo salvo ainda.
        </p>
      )}

      {resumes.map((r) => {
        const isActive = r.id === currentResumeId;
        const nome = r.resume_name || "Sem nome";
        return (
          <div
            key={r.id}
            className={"resume-item" + (isActive ? " active" : "")}
          >
            <button
              type="button"
              className="btn btn-link text-start p-0 text-decoration-none text-reset flex-grow-1"
              aria-label={
                (isActive
                  ? "Currículo atual selecionado: "
                  : "Selecionar currículo: ") + nome
              }
              onClick={() => onSelecionar(r.id)}
            >
              <div>
                {nome}
                {isActive && <span className="badge-current">atual</span>}
              </div>
              <div className="resume-item-date">
                Atualizado em {new Date(r.updated_at).toLocaleString("pt-BR")}
              </div>
            </button>

            <div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary me-1"
                aria-label={"Renomear currículo: " + nome}
                onClick={() => onRenomear(r.id, r.resume_name || "")}
              >
                <i className="fas fa-pen" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                aria-label={"Excluir currículo: " + nome}
                onClick={() => onExcluir(r.id)}
              >
                <i className="fas fa-trash-alt" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        );
      })}
    </Offcanvas>
  );
}
