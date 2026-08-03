import { aplicarMascaraTelefone, limparUrlPerfil } from "../../lib/curriculoUtils";
import type { DadosBasicos } from "../../types/curriculo";

interface EstadoOpcao {
  sigla: string;
  nome: string;
}
interface CidadeOpcao {
  nome: string;
}

interface DadosBasicosSectionProps {
  basics: DadosBasicos;
  atualizarBasico: <K extends keyof DadosBasicos>(
    campo: K,
    valor: DadosBasicos[K],
  ) => void;
  estados: EstadoOpcao[];
  statusEstados: "carregando" | "pronto" | "erro";
  cidades: CidadeOpcao[];
  statusCidades: "carregando" | "pronto" | "erro";
  includeLinkedin: boolean;
  onMudarIncludeLinkedin: (valor: boolean) => void;
  includeGithub: boolean;
  onMudarIncludeGithub: (valor: boolean) => void;
}

export function DadosBasicosSection({
  basics,
  atualizarBasico,
  estados,
  statusEstados,
  cidades,
  statusCidades,
  includeLinkedin,
  onMudarIncludeLinkedin,
  includeGithub,
  onMudarIncludeGithub,
}: DadosBasicosSectionProps) {
  return (
    <>
      <h2 className="mb-0 text-primary section-title border-bottom pb-2 mb-4">
        <span className="section-num">01</span> Dados Básicos
      </h2>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="name">
            Nome Completo
          </label>
          <input
            type="text"
            className="form-control"
            id="name"
            required
            value={basics.name}
            onChange={(e) => atualizarBasico("name", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="label_pt">
            Título Profissional
          </label>
          <input
            type="text"
            className="form-control"
            id="label_pt"
            required
            value={basics.label_pt}
            onChange={(e) => atualizarBasico("label_pt", e.target.value)}
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="email">
            E-mail
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            required
            value={basics.email}
            onChange={(e) => atualizarBasico("email", e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="phone">
            Telefone
          </label>
          <input
            type="tel"
            className="form-control"
            id="phone"
            required
            value={basics.phone}
            onChange={(e) =>
              atualizarBasico("phone", aplicarMascaraTelefone(e.target.value))
            }
          />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="estado">
            Estado
          </label>
          <select
            className="form-select"
            id="estado"
            required
            value={basics.estado}
            onChange={(e) => {
              atualizarBasico("estado", e.target.value);
              atualizarBasico("cidade", "");
            }}
          >
            <option value="" disabled>
              {statusEstados === "erro"
                ? "Erro ao carregar"
                : "Selecione um estado..."}
            </option>
            {estados.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-bold" htmlFor="cidade">
            Cidade
          </label>
          <select
            className="form-select"
            id="cidade"
            required
            disabled={!basics.estado}
            value={basics.cidade}
            onChange={(e) => atualizarBasico("cidade", e.target.value)}
          >
            <option value="" disabled>
              {statusCidades === "erro"
                ? "Erro ao carregar"
                : "Selecione uma cidade..."}
            </option>
            {cidades.map((c) => (
              <option key={c.nome} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-bold mb-0" htmlFor="linkedin">
              LinkedIn
            </label>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="include-linkedin"
                checked={includeLinkedin}
                onChange={(e) => onMudarIncludeLinkedin(e.target.checked)}
              />
              <label
                className="form-check-label small text-muted"
                htmlFor="include-linkedin"
              >
                Incluir?
              </label>
            </div>
          </div>
          <input
            type="text"
            className="form-control"
            id="linkedin"
            placeholder="linkedin.com/in/seu-usuario"
            required={includeLinkedin}
            value={basics.linkedin}
            onChange={(e) => atualizarBasico("linkedin", e.target.value)}
            onBlur={(e) =>
              atualizarBasico("linkedin", limparUrlPerfil(e.target.value.trim()))
            }
          />
        </div>
        <div className="col-md-6">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-bold mb-0" htmlFor="github">
              GitHub
            </label>
            <div className="form-check form-switch mb-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="include-github"
                checked={includeGithub}
                onChange={(e) => onMudarIncludeGithub(e.target.checked)}
              />
              <label
                className="form-check-label small text-muted"
                htmlFor="include-github"
              >
                Incluir?
              </label>
            </div>
          </div>
          <input
            type="text"
            className="form-control"
            id="github"
            placeholder="github.com/seu-usuario"
            required={includeGithub}
            value={basics.github}
            onChange={(e) => atualizarBasico("github", e.target.value)}
            onBlur={(e) =>
              atualizarBasico("github", limparUrlPerfil(e.target.value.trim()))
            }
          />
        </div>
      </div>
    </>
  );
}
