import { formatarDataMesAno } from "./curriculoUtils";
import type { DadosCurriculo } from "../types/curriculo";

function dividirEmLista(texto: string, separador: string): string[] {
  return texto
    .split(separador)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Transforma os dados do formulário (shape "de edição", com estado/cidade
 * separados, highlights como texto livre, etc) no payload que a rota
 * /generate-cv espera — aplicando os toggles "Incluir no PDF?" (uma seção
 * ou campo desmarcado não entra no payload de jeito nenhum, não é só
 * "escondido").
 */
export function montarPayloadPdf(dados: DadosCurriculo, lang: "pt" | "en") {
  const { basics, config } = dados;

  return {
    lang,
    basics: {
      name: basics.name,
      label_pt: basics.label_pt,
      email: basics.email,
      phone: basics.phone,
      location: `${basics.cidade}, ${basics.estado}`,
      linkedin: config.includeLinkedin ? basics.linkedin : "",
      github: config.includeGithub ? basics.github : "",
    },
    summary: dados.summary,
    experience: config.includeExperience
      ? dados.experience.map((e) => ({
          company: e.company,
          position_pt: e.position,
          startDate: formatarDataMesAno(e.start),
          endDate: e.isCurrent ? "Presente" : formatarDataMesAno(e.end),
          highlights_pt: dividirEmLista(e.highlights, ";"),
        }))
      : [],
    education: config.includeEducation
      ? dados.education.map((ed) => ({
          institution: ed.institution,
          area_pt: ed.area,
          startDate: formatarDataMesAno(ed.start),
          endDate: ed.isCurrent ? "Presente" : formatarDataMesAno(ed.end),
          status_pt: ed.status,
        }))
      : [],
    courses: config.includeCourses
      ? dados.courses.map((c) => ({
          name_pt: c.name,
          institution: c.institution,
          year: c.year,
        }))
      : [],
    projects: config.includeProjects
      ? dados.projects.map((p) => ({
          name: p.name,
          technologies: p.tech,
          link: p.link,
          description_pt: p.desc,
        }))
      : [],
    skills: dados.skills,
  };
}
