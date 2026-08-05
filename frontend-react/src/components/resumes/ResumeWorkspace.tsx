import { useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useResumeManager } from "../../hooks/useResumeManager";
import type { Notificacao } from "../../hooks/useNotificacoes";
import { CurriculoForm, type CurriculoFormHandle } from "../form/CurriculoForm";
import { ResumeNameModal } from "./ResumeNameModal";
import { ResumePanel } from "./ResumePanel";
import { SaveStatusIndicator } from "./SaveStatusIndicator";

interface ModalNomeState {
  modo: "criar" | "renomear";
  idAlvo: string | null;
  nomeInicial: string;
}

interface ResumeWorkspaceProps {
  notificar: (mensagem: string, tipo?: Notificacao["tipo"]) => void;
}

export function ResumeWorkspace({ notificar }: ResumeWorkspaceProps) {
  const { user } = useAuth();
  const formRef = useRef<CurriculoFormHandle>(null);
  const resumeManager = useResumeManager(user?.id ?? null, formRef);

  const [painelAberto, setPainelAberto] = useState(false);
  const [modalNome, setModalNome] = useState<ModalNomeState | null>(null);

  async function aoConfirmarNome(nome: string) {
    if (!modalNome) return;

    if (modalNome.modo === "criar") {
      const sucesso = await resumeManager.criar(nome);
      if (!sucesso) {
        notificar("Erro ao criar currículo.", "danger");
        return;
      }
    } else if (modalNome.idAlvo) {
      const sucesso = await resumeManager.renomear(modalNome.idAlvo, nome);
      if (!sucesso) {
        notificar("Erro ao renomear currículo.", "danger");
        return;
      }
    }
    setModalNome(null);
  }

  async function aoExcluir(id: string) {
    if (!confirm("Excluir este currículo? Essa ação não pode ser desfeita.")) {
      return;
    }
    const sucesso = await resumeManager.excluir(id);
    if (!sucesso) notificar("Erro ao excluir currículo.", "danger");
  }

  return (
    <>
      {user && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0" id="current-resume-title">
            <i className="fas fa-file-alt me-2 text-primary" aria-hidden="true"></i>
            {resumeManager.tituloAtual}
          </h2>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setPainelAberto(true)}
          >
            <i className="fas fa-folder-open me-2" aria-hidden="true"></i>
            Meus Currículos
          </button>
        </div>
      )}

      <CurriculoForm
        ref={formRef}
        notificar={notificar}
        onAutosave={resumeManager.salvar}
      />

      <ResumePanel
        open={painelAberto}
        onClose={() => setPainelAberto(false)}
        resumes={resumeManager.resumes}
        currentResumeId={resumeManager.currentResumeId}
        onSelecionar={(id) => {
          resumeManager.selecionar(id);
          setPainelAberto(false);
        }}
        onNovo={() =>
          setModalNome({ modo: "criar", idAlvo: null, nomeInicial: "" })
        }
        onRenomear={(id, nomeAtual) =>
          setModalNome({ modo: "renomear", idAlvo: id, nomeInicial: nomeAtual })
        }
        onExcluir={aoExcluir}
      />

      <ResumeNameModal
        open={modalNome !== null}
        onClose={() => setModalNome(null)}
        modo={modalNome?.modo ?? "criar"}
        nomeInicial={modalNome?.nomeInicial ?? ""}
        onConfirmar={aoConfirmarNome}
      />

      <SaveStatusIndicator status={resumeManager.statusSalvamento} />
    </>
  );
}
