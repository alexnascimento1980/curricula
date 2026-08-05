import {
  type FormEvent,
  type Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { blobParaBase64 } from "../../lib/curriculoUtils";
import { montarPayloadPdf } from "../../lib/montarPayloadPdf";
import { useAutosave } from "../../hooks/useAutosave";
import { useCurriculoForm } from "../../hooks/useCurriculoForm";
import { useIbgeLocalidades } from "../../hooks/useIbgeLocalidades";
import type { Notificacao } from "../../hooks/useNotificacoes";
import type { DadosCurriculo } from "../../types/curriculo";
import { CursoSection } from "./CursoSection";
import { DadosBasicosSection } from "./DadosBasicosSection";
import { ExperienciaSection } from "./ExperienciaSection";
import { FormacaoSection } from "./FormacaoSection";
import { HabilidadesSection } from "./HabilidadesSection";
import { ProjetoSection } from "./ProjetoSection";
import { ResumoSection } from "./ResumoSection";

// Em dev/web comum, URL relativa (o proxy do Vite ou o mesmo servidor
// Flask em produção cuidam do resto). No app nativo, precisa do endereço
// completo do backend hospedado.
const API_BASE_URL = window.Capacitor?.isNativePlatform()
  ? "https://careeros-mcau.onrender.com"
  : "";

/**
 * Capacidades expostas via ref pra quem precisa controlar o formulário de
 * fora (o gerenciador de currículos da Fase 4: trocar de currículo precisa
 * forçar o salvamento pendente antes, e carregar os dados do novo).
 */
export interface CurriculoFormHandle {
  carregarDados: (dados: DadosCurriculo) => void;
  resetarFormulario: () => void;
  flushAutosave: () => Promise<void>;
  cancelarAutosave: () => void;
}

interface CurriculoFormProps {
  ref?: Ref<CurriculoFormHandle>;
  notificar: (mensagem: string, tipo?: Notificacao["tipo"]) => void;
  /** Chamado (com debounce) toda vez que os dados do formulário mudam —
   * a persistência de verdade (upsert no Supabase) é responsabilidade de
   * quem usa este componente (useResumeManager, na Fase 4). */
  onAutosave?: (dados: DadosCurriculo) => void | Promise<void>;
}

export function CurriculoForm({
  ref,
  notificar,
  onAutosave,
}: CurriculoFormProps) {
  const form = useCurriculoForm();
  const { estados, statusEstados, cidades, statusCidades } =
    useIbgeLocalidades(form.basics.estado);

  const formRef = useRef<HTMLFormElement>(null);
  const [gerando, setGerando] = useState(false);

  const salvarComDebounce = useCallback(
    (dados: DadosCurriculo) => onAutosave?.(dados),
    [onAutosave],
  );
  const autosave = useAutosave(form.dadosAtuais, salvarComDebounce);

  useImperativeHandle(ref, () => ({
    carregarDados: form.carregarDados,
    resetarFormulario: form.resetarFormulario,
    flushAutosave: autosave.flush,
    cancelarAutosave: autosave.cancelar,
  }));

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formEl = formRef.current;
    if (!formEl) return;

    if (!formEl.checkValidity()) {
      formEl.classList.add("was-validated");
      notificar("Verifique os campos obrigatórios.", "danger");
      return;
    }

    setGerando(true);
    try {
      const payload = montarPayloadPdf(form.dadosAtuais, form.config.idioma);
      const res = await fetch(`${API_BASE_URL}/generate-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const corpo = await res.json().catch(() => ({}));
        notificar(corpo.erro || "Erro ao gerar o PDF.", "danger");
        return;
      }

      const blob = await res.blob();
      const nomeArquivo = `${form.basics.name.trim().replace(/\s+/g, "_")}_curriculo.pdf`;

      if (window.Capacitor?.isNativePlatform()) {
        // Dentro do app, o truque de <a download> do navegador não
        // funciona (o WebView não tem gerenciador de downloads) — grava
        // no armazenamento do app e abre a folha nativa de
        // compartilhamento/salvamento.
        const base64Data = await blobParaBase64(blob);
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const arquivo = await Filesystem.writeFile({
          path: nomeArquivo,
          data: base64Data,
          directory: "CACHE",
        });
        await Share.share({
          title: "Currículo em PDF",
          url: arquivo.uri,
          dialogTitle: "Salvar ou compartilhar currículo",
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        a.click();
      }

      notificar("PDF gerado com sucesso!", "success");
    } catch (erro) {
      console.error("Erro ao gerar/salvar PDF:", erro);
      notificar("Erro ao gerar PDF.", "danger");
    } finally {
      setGerando(false);
    }
  }

  return (
    <form ref={formRef} id="cv-form" noValidate onSubmit={aoSubmeter}>
      <DadosBasicosSection
        basics={form.basics}
        atualizarBasico={form.atualizarBasico}
        estados={estados}
        statusEstados={statusEstados}
        cidades={cidades}
        statusCidades={statusCidades}
        includeLinkedin={form.config.includeLinkedin}
        onMudarIncludeLinkedin={(v) => form.atualizarConfig("includeLinkedin", v)}
        includeGithub={form.config.includeGithub}
        onMudarIncludeGithub={(v) => form.atualizarConfig("includeGithub", v)}
      />

      <ResumoSection
        valor={form.summaryTexto}
        onMudar={form.setSummaryTexto}
      />

      <ExperienciaSection
        itens={form.experience}
        incluido={form.config.includeExperience}
        onMudarIncluido={(v) => form.atualizarConfig("includeExperience", v)}
        onAdicionar={form.adicionarExperiencia}
        onRemover={form.removerExperiencia}
        onAtualizar={form.atualizarExperiencia}
      />

      <FormacaoSection
        itens={form.education}
        incluido={form.config.includeEducation}
        onMudarIncluido={(v) => form.atualizarConfig("includeEducation", v)}
        onAdicionar={form.adicionarFormacao}
        onRemover={form.removerFormacao}
        onAtualizar={form.atualizarFormacao}
      />

      <CursoSection
        itens={form.courses}
        incluido={form.config.includeCourses}
        onMudarIncluido={(v) => form.atualizarConfig("includeCourses", v)}
        onAdicionar={form.adicionarCurso}
        onRemover={form.removerCurso}
        onAtualizar={form.atualizarCurso}
      />

      <ProjetoSection
        itens={form.projects}
        incluido={form.config.includeProjects}
        onMudarIncluido={(v) => form.atualizarConfig("includeProjects", v)}
        onAdicionar={form.adicionarProjeto}
        onRemover={form.removerProjeto}
        onAtualizar={form.atualizarProjeto}
      />

      <HabilidadesSection
        valor={form.skillsTexto}
        onMudar={form.setSkillsTexto}
      />

      <div className="export-box p-4 rounded-3 border mt-5 mb-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <label className="form-label fw-bold" htmlFor="idioma_escolhido">
              Idioma de Saída:
            </label>
            <select
              className="form-select form-select-lg"
              id="idioma_escolhido"
              value={form.config.idioma}
              onChange={(e) =>
                form.atualizarConfig(
                  "idioma",
                  e.target.value as "pt" | "en",
                )
              }
            >
              <option value="pt">🇧🇷 Português</option>
              <option value="en">🇺🇸 Inglês</option>
            </select>
          </div>
          <div className="col-md-4 mt-4 mt-md-0 d-grid">
            <button
              type="submit"
              className="btn btn-generate btn-lg rounded-pill"
              id="btn-gerar"
              disabled={gerando}
            >
              <i
                className={`fas ${gerando ? "fa-spinner fa-spin" : "fa-file-pdf"} me-2`}
                aria-hidden="true"
              ></i>{" "}
              {gerando ? "Gerando..." : "Gerar Currículo"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
