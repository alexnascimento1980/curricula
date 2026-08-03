import { describe, expect, it } from "vitest";
import {
  CONFIGURACAO_PADRAO,
  DADOS_BASICOS_VAZIOS,
  type DadosCurriculo,
} from "../types/curriculo";
import { montarPayloadPdf } from "./montarPayloadPdf";

function dadosBase(): DadosCurriculo {
  return {
    basics: {
      ...DADOS_BASICOS_VAZIOS,
      name: "Fulano de Tal",
      label_pt: "Dev",
      email: "fulano@teste.com",
      phone: "(19) 98290-7060",
      estado: "SP",
      cidade: "Campinas",
      linkedin: "linkedin.com/in/fulano",
      github: "github.com/fulano",
    },
    summary: { pt: ["Resumo aqui."] },
    skills: { technical: ["Python", "React"] },
    config: { ...CONFIGURACAO_PADRAO },
    experience: [
      {
        company: "Empresa X",
        position: "Dev",
        start: "2020-01",
        end: "2022-06",
        isCurrent: false,
        highlights: "Fez isso; Fez aquilo ; ",
      },
    ],
    education: [
      {
        institution: "USP",
        area: "Ciência da Computação",
        start: "2016-01",
        end: "",
        isCurrent: true,
        status: "Cursando",
      },
    ],
    courses: [{ name: "Curso X", institution: "Instituto Y", year: "2023" }],
    projects: [
      {
        name: "Projeto Z",
        tech: "TypeScript",
        link: "github.com/fulano/z",
        desc: "Descrição do projeto.",
      },
    ],
  };
}

describe("montarPayloadPdf", () => {
  it("monta location combinando cidade e estado", () => {
    const payload = montarPayloadPdf(dadosBase(), "pt");
    expect(payload.basics.location).toBe("Campinas, SP");
  });

  it("inclui linkedin/github quando os toggles estão ligados", () => {
    const payload = montarPayloadPdf(dadosBase(), "pt");
    expect(payload.basics.linkedin).toBe("linkedin.com/in/fulano");
    expect(payload.basics.github).toBe("github.com/fulano");
  });

  it("envia linkedin/github vazios quando os toggles estão desligados", () => {
    const dados = dadosBase();
    dados.config.includeLinkedin = false;
    dados.config.includeGithub = false;
    const payload = montarPayloadPdf(dados, "pt");
    expect(payload.basics.linkedin).toBe("");
    expect(payload.basics.github).toBe("");
  });

  it("converte datas para MM/AAAA e usa 'Presente' quando isCurrent", () => {
    const payload = montarPayloadPdf(dadosBase(), "pt");
    expect(payload.experience[0].startDate).toBe("01/2020");
    expect(payload.experience[0].endDate).toBe("06/2022");
    expect(payload.education[0].endDate).toBe("Presente");
  });

  it("divide highlights por ponto-e-vírgula, removendo espaços e itens vazios", () => {
    const payload = montarPayloadPdf(dadosBase(), "pt");
    expect(payload.experience[0].highlights_pt).toEqual([
      "Fez isso",
      "Fez aquilo",
    ]);
  });

  it("envia array vazio (não omite a chave) quando a seção está desmarcada", () => {
    const dados = dadosBase();
    dados.config.includeExperience = false;
    dados.config.includeEducation = false;
    dados.config.includeCourses = false;
    dados.config.includeProjects = false;
    const payload = montarPayloadPdf(dados, "pt");

    expect(payload.experience).toEqual([]);
    expect(payload.education).toEqual([]);
    expect(payload.courses).toEqual([]);
    expect(payload.projects).toEqual([]);
  });

  it("usa o idioma passado, não o salvo em config", () => {
    const dados = dadosBase();
    dados.config.idioma = "pt";
    expect(montarPayloadPdf(dados, "en").lang).toBe("en");
  });
});
