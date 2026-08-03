import { useCallback, useMemo, useState } from "react";
import {
  CONFIGURACAO_PADRAO,
  CURSO_VAZIO,
  DADOS_BASICOS_VAZIOS,
  type Curso,
  type DadosBasicos,
  type DadosCurriculo,
  EXPERIENCIA_VAZIA,
  type Experiencia,
  FORMACAO_VAZIA,
  type Formacao,
  type ConfiguracaoInclusao,
  PROJETO_VAZIO,
  type Projeto,
} from "../types/curriculo";

function criarListaEditavel<T>(itemVazio: T) {
  return {
    inicial: [itemVazio] as T[],
  };
}

export function useCurriculoForm() {
  const [basics, setBasics] = useState<DadosBasicos>(DADOS_BASICOS_VAZIOS);
  const [summaryTexto, setSummaryTexto] = useState("");
  const [skillsTexto, setSkillsTexto] = useState("");
  const [config, setConfig] = useState<ConfiguracaoInclusao>(
    CONFIGURACAO_PADRAO,
  );
  const [experience, setExperience] = useState<Experiencia[]>(
    criarListaEditavel(EXPERIENCIA_VAZIA).inicial,
  );
  const [education, setEducation] = useState<Formacao[]>(
    criarListaEditavel(FORMACAO_VAZIA).inicial,
  );
  const [courses, setCourses] = useState<Curso[]>(
    criarListaEditavel(CURSO_VAZIO).inicial,
  );
  const [projects, setProjects] = useState<Projeto[]>(
    criarListaEditavel(PROJETO_VAZIO).inicial,
  );

  const atualizarBasico = useCallback(
    <K extends keyof DadosBasicos>(campo: K, valor: DadosBasicos[K]) => {
      setBasics((atual) => ({ ...atual, [campo]: valor }));
    },
    [],
  );

  const atualizarConfig = useCallback(
    <K extends keyof ConfiguracaoInclusao>(
      campo: K,
      valor: ConfiguracaoInclusao[K],
    ) => {
      setConfig((atual) => ({ ...atual, [campo]: valor }));
    },
    [],
  );

  // --- Experiência ---
  const adicionarExperiencia = useCallback(() => {
    setExperience((atual) => [...atual, { ...EXPERIENCIA_VAZIA }]);
  }, []);
  const removerExperiencia = useCallback((indice: number) => {
    setExperience((atual) => atual.filter((_, i) => i !== indice));
  }, []);
  const atualizarExperiencia = useCallback(
    <K extends keyof Experiencia>(
      indice: number,
      campo: K,
      valor: Experiencia[K],
    ) => {
      setExperience((atual) =>
        atual.map((item, i) =>
          i === indice ? { ...item, [campo]: valor } : item,
        ),
      );
    },
    [],
  );

  // --- Formação ---
  const adicionarFormacao = useCallback(() => {
    setEducation((atual) => [...atual, { ...FORMACAO_VAZIA }]);
  }, []);
  const removerFormacao = useCallback((indice: number) => {
    setEducation((atual) => atual.filter((_, i) => i !== indice));
  }, []);
  const atualizarFormacao = useCallback(
    <K extends keyof Formacao>(indice: number, campo: K, valor: Formacao[K]) => {
      setEducation((atual) =>
        atual.map((item, i) =>
          i === indice ? { ...item, [campo]: valor } : item,
        ),
      );
    },
    [],
  );

  // --- Cursos ---
  const adicionarCurso = useCallback(() => {
    setCourses((atual) => [
      ...atual,
      { ...CURSO_VAZIO, year: String(new Date().getFullYear()) },
    ]);
  }, []);
  const removerCurso = useCallback((indice: number) => {
    setCourses((atual) => atual.filter((_, i) => i !== indice));
  }, []);
  const atualizarCurso = useCallback(
    <K extends keyof Curso>(indice: number, campo: K, valor: Curso[K]) => {
      setCourses((atual) =>
        atual.map((item, i) =>
          i === indice ? { ...item, [campo]: valor } : item,
        ),
      );
    },
    [],
  );

  // --- Projetos ---
  const adicionarProjeto = useCallback(() => {
    setProjects((atual) => [...atual, { ...PROJETO_VAZIO }]);
  }, []);
  const removerProjeto = useCallback((indice: number) => {
    setProjects((atual) => atual.filter((_, i) => i !== indice));
  }, []);
  const atualizarProjeto = useCallback(
    <K extends keyof Projeto>(indice: number, campo: K, valor: Projeto[K]) => {
      setProjects((atual) =>
        atual.map((item, i) =>
          i === indice ? { ...item, [campo]: valor } : item,
        ),
      );
    },
    [],
  );

  const carregarDados = useCallback((dados: DadosCurriculo) => {
    setBasics(dados.basics);
    setSummaryTexto(dados.summary.pt[0] ?? "");
    setSkillsTexto(dados.skills.technical.join(", "));
    setConfig(dados.config);
    setExperience(
      dados.experience.length > 0 ? dados.experience : [EXPERIENCIA_VAZIA],
    );
    setEducation(
      dados.education.length > 0 ? dados.education : [FORMACAO_VAZIA],
    );
    setCourses(dados.courses.length > 0 ? dados.courses : [CURSO_VAZIO]);
    setProjects(dados.projects.length > 0 ? dados.projects : [PROJETO_VAZIO]);
  }, []);

  const resetarFormulario = useCallback(() => {
    setBasics(DADOS_BASICOS_VAZIOS);
    setSummaryTexto("");
    setSkillsTexto("");
    setConfig(CONFIGURACAO_PADRAO);
    setExperience([{ ...EXPERIENCIA_VAZIA }]);
    setEducation([{ ...FORMACAO_VAZIA }]);
    setCourses([{ ...CURSO_VAZIO, year: String(new Date().getFullYear()) }]);
    setProjects([{ ...PROJETO_VAZIO }]);
  }, []);

  const dadosAtuais: DadosCurriculo = useMemo(
    () => ({
      basics,
      summary: { pt: [summaryTexto] },
      skills: {
        technical: skillsTexto
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
      config,
      experience,
      education,
      courses,
      projects,
    }),
    [basics, summaryTexto, skillsTexto, config, experience, education, courses, projects],
  );

  return {
    basics,
    summaryTexto,
    setSummaryTexto,
    skillsTexto,
    setSkillsTexto,
    config,
    experience,
    education,
    courses,
    projects,
    dadosAtuais,

    atualizarBasico,
    atualizarConfig,

    adicionarExperiencia,
    removerExperiencia,
    atualizarExperiencia,

    adicionarFormacao,
    removerFormacao,
    atualizarFormacao,

    adicionarCurso,
    removerCurso,
    atualizarCurso,

    adicionarProjeto,
    removerProjeto,
    atualizarProjeto,

    carregarDados,
    resetarFormulario,
  };
}
