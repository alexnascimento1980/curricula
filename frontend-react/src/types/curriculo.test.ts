import { describe, expect, it } from "vitest";
import { CONFIGURACAO_PADRAO, normalizarDadosCurriculo } from "./curriculo";

describe("normalizarDadosCurriculo", () => {
  it("preenche tudo com valores padrão quando recebe null/undefined", () => {
    const resultado = normalizarDadosCurriculo(null);
    expect(resultado.basics.name).toBe("");
    expect(resultado.summary.pt).toEqual([]);
    expect(resultado.skills.technical).toEqual([]);
    expect(resultado.experience).toEqual([]);
    expect(resultado.config).toEqual(CONFIGURACAO_PADRAO);
  });

  it("preenche tudo com valores padrão quando recebe objeto vazio (currículo recém-criado)", () => {
    const resultado = normalizarDadosCurriculo({});
    expect(resultado.basics.email).toBe("");
    expect(resultado.courses).toEqual([]);
  });

  it("preserva os dados existentes e só completa o que falta", () => {
    const resultado = normalizarDadosCurriculo({
      basics: {
        name: "Fulano",
        label_pt: "",
        email: "",
        phone: "",
        estado: "",
        cidade: "",
        linkedin: "",
        github: "",
      },
      experience: [
        {
          company: "X",
          position: "Y",
          start: "",
          end: "",
          isCurrent: false,
          highlights: "",
        },
      ],
    });

    expect(resultado.basics.name).toBe("Fulano");
    expect(resultado.experience).toHaveLength(1);
    expect(resultado.education).toEqual([]);
  });
});
