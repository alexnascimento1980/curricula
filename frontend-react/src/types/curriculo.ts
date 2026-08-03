export interface Experiencia {
  company: string;
  position: string;
  start: string;
  end: string;
  isCurrent: boolean;
  highlights: string;
}

export interface Formacao {
  institution: string;
  area: string;
  start: string;
  end: string;
  isCurrent: boolean;
  status: string;
}

export interface Curso {
  name: string;
  institution: string;
  year: string;
}

export interface Projeto {
  name: string;
  tech: string;
  link: string;
  desc: string;
}

export interface DadosBasicos {
  name: string;
  label_pt: string;
  email: string;
  phone: string;
  estado: string;
  cidade: string;
  linkedin: string;
  github: string;
}

export interface ConfiguracaoInclusao {
  includeExperience: boolean;
  includeEducation: boolean;
  includeCourses: boolean;
  includeProjects: boolean;
  includeLinkedin: boolean;
  includeGithub: boolean;
  idioma: "pt" | "en";
}

export interface DadosCurriculo {
  basics: DadosBasicos;
  summary: { pt: string[] };
  skills: { technical: string[] };
  config: ConfiguracaoInclusao;
  experience: Experiencia[];
  education: Formacao[];
  courses: Curso[];
  projects: Projeto[];
}

export const CONFIGURACAO_PADRAO: ConfiguracaoInclusao = {
  includeExperience: true,
  includeEducation: true,
  includeCourses: true,
  includeProjects: true,
  includeLinkedin: true,
  includeGithub: true,
  idioma: "pt",
};

export const EXPERIENCIA_VAZIA: Experiencia = {
  company: "",
  position: "",
  start: "",
  end: "",
  isCurrent: false,
  highlights: "",
};

export const FORMACAO_VAZIA: Formacao = {
  institution: "",
  area: "",
  start: "",
  end: "",
  isCurrent: false,
  status: "",
};

export const CURSO_VAZIO: Curso = {
  name: "",
  institution: "",
  year: String(new Date().getFullYear()),
};

export const PROJETO_VAZIO: Projeto = {
  name: "",
  tech: "",
  link: "",
  desc: "",
};

export const DADOS_BASICOS_VAZIOS: DadosBasicos = {
  name: "",
  label_pt: "",
  email: "",
  phone: "",
  estado: "",
  cidade: "",
  linkedin: "",
  github: "",
};
