import { describe, expect, it } from "vitest";
import {
  aplicarMascaraTelefone,
  formatarDataMesAno,
  limparUrlPerfil,
} from "./curriculoUtils";

describe("limparUrlPerfil", () => {
  it.each([
    ["linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["https://linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["http://linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["https://www.linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["www.linkedin.com/in/fulano", "linkedin.com/in/fulano"],
    ["HTTPS://WWW.LINKEDIN.COM/in/fulano", "LINKEDIN.COM/in/fulano"],
    ["", ""],
  ])("limpa %s -> %s", (entrada, esperado) => {
    expect(limparUrlPerfil(entrada)).toBe(esperado);
  });
});

describe("formatarDataMesAno", () => {
  it("converte formato ISO (AAAA-MM) para MM/AAAA", () => {
    expect(formatarDataMesAno("2024-03")).toBe("03/2024");
  });

  it("retorna vazio para valor vazio", () => {
    expect(formatarDataMesAno("")).toBe("");
  });

  it("retorna o valor original se não estiver no formato AAAA-MM", () => {
    expect(formatarDataMesAno("Presente")).toBe("Presente");
  });
});

describe("aplicarMascaraTelefone", () => {
  it("formata celular (11 dígitos) como (XX) XXXXX-XXXX", () => {
    expect(aplicarMascaraTelefone("19982907060")).toBe("(19) 98290-7060");
  });

  it("formata fixo (10 dígitos) como (XX) XXXX-XXXX", () => {
    expect(aplicarMascaraTelefone("1932212345")).toBe("(19) 3221-2345");
  });

  it("ignora caracteres não numéricos digitados", () => {
    expect(aplicarMascaraTelefone("(19) 98290-7060")).toBe("(19) 98290-7060");
  });

  it("trunca em 11 dígitos, ignorando o resto", () => {
    expect(aplicarMascaraTelefone("199829070609999")).toBe("(19) 98290-7060");
  });

  it("formata parcialmente enquanto a pessoa ainda está digitando", () => {
    expect(aplicarMascaraTelefone("19982")).toBe("(19) 982");
  });
});
