import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCurriculoForm } from "./useCurriculoForm";

describe("useCurriculoForm", () => {
  it("começa com uma lista de cada bloco (não vazia), pra sempre ter algo pra preencher", () => {
    const { result } = renderHook(() => useCurriculoForm());
    expect(result.current.experience).toHaveLength(1);
    expect(result.current.education).toHaveLength(1);
    expect(result.current.courses).toHaveLength(1);
    expect(result.current.projects).toHaveLength(1);
  });

  it("atualiza um campo básico sem afetar os outros", () => {
    const { result } = renderHook(() => useCurriculoForm());
    act(() => result.current.atualizarBasico("name", "Fulano"));
    act(() => result.current.atualizarBasico("email", "fulano@teste.com"));

    expect(result.current.basics.name).toBe("Fulano");
    expect(result.current.basics.email).toBe("fulano@teste.com");
  });

  it("adiciona e remove blocos de experiência mantendo os outros intactos", () => {
    const { result } = renderHook(() => useCurriculoForm());

    act(() => result.current.atualizarExperiencia(0, "company", "Empresa A"));
    act(() => result.current.adicionarExperiencia());
    act(() => result.current.atualizarExperiencia(1, "company", "Empresa B"));

    expect(result.current.experience).toHaveLength(2);
    expect(result.current.experience[0].company).toBe("Empresa A");
    expect(result.current.experience[1].company).toBe("Empresa B");

    act(() => result.current.removerExperiencia(0));
    expect(result.current.experience).toHaveLength(1);
    expect(result.current.experience[0].company).toBe("Empresa B");
  });

  it("adiciona curso novo já com o ano atual preenchido", () => {
    const { result } = renderHook(() => useCurriculoForm());
    act(() => result.current.adicionarCurso());
    expect(result.current.courses[1].year).toBe(String(new Date().getFullYear()));
  });

  it("dadosAtuais reflete summary como array de 1 elemento e skills separadas por vírgula", () => {
    const { result } = renderHook(() => useCurriculoForm());
    act(() => result.current.setSummaryTexto("Meu resumo profissional."));
    act(() => result.current.setSkillsTexto("Python, React,  Node.js ,,"));

    expect(result.current.dadosAtuais.summary.pt).toEqual([
      "Meu resumo profissional.",
    ]);
    expect(result.current.dadosAtuais.skills.technical).toEqual([
      "Python",
      "React",
      "Node.js",
    ]);
  });

  it("carregarDados restaura tudo, inclusive quando uma seção salva veio vazia", () => {
    const { result } = renderHook(() => useCurriculoForm());

    act(() =>
      result.current.carregarDados({
        basics: {
          name: "Restaurado",
          label_pt: "Cargo",
          email: "r@teste.com",
          phone: "123",
          estado: "SP",
          cidade: "Campinas",
          linkedin: "linkedin.com/in/r",
          github: "github.com/r",
        },
        summary: { pt: ["Resumo restaurado"] },
        skills: { technical: ["Go"] },
        config: {
          includeExperience: false,
          includeEducation: true,
          includeCourses: true,
          includeProjects: true,
          includeLinkedin: true,
          includeGithub: true,
          idioma: "pt",
        },
        experience: [], // seção existe mas veio vazia
        education: [
          {
            institution: "USP",
            area: "CC",
            start: "2020-01",
            end: "",
            isCurrent: true,
            status: "Cursando",
          },
        ],
        courses: [],
        projects: [],
      }),
    );

    expect(result.current.basics.name).toBe("Restaurado");
    expect(result.current.config.includeExperience).toBe(false);
    // Lista vazia restaurada vira 1 bloco em branco pra edição, não fica
    // sem nenhum bloco pra clicar "adicionar".
    expect(result.current.experience).toHaveLength(1);
    expect(result.current.experience[0].company).toBe("");
    expect(result.current.education).toHaveLength(1);
    expect(result.current.education[0].institution).toBe("USP");
  });

  it("resetarFormulario volta tudo ao estado inicial", () => {
    const { result } = renderHook(() => useCurriculoForm());
    act(() => result.current.atualizarBasico("name", "Alguém"));
    act(() => result.current.adicionarExperiencia());
    act(() => result.current.atualizarConfig("includeLinkedin", false));

    act(() => result.current.resetarFormulario());

    expect(result.current.basics.name).toBe("");
    expect(result.current.experience).toHaveLength(1);
    expect(result.current.config.includeLinkedin).toBe(true);
  });
});
