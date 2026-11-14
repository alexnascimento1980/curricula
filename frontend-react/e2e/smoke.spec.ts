import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Smoke: React servido pelo Flask", () => {
  test("carrega a página inicial sem violação de CSP nem erro de JavaScript", async ({
    page,
  }) => {
    const erros: string[] = [];
    page.on("console", (msg) => {
      // Só violações de CSP: falhas de rede (fontes, Supabase) dependem do
      // ambiente e não indicam bug do app.
      if (msg.type() === "error" && /Content Security Policy/i.test(msg.text()))
        erros.push(msg.text());
    });
    page.on("pageerror", (err) => erros.push(err.message));

    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Currícula" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Pular para o conteúdo principal" }),
    ).toBeAttached();

    expect(erros).toEqual([]);
  });

  test("rota inexistente sem extensão cai na SPA; arquivo inexistente dá 404", async ({
    page,
    request,
  }) => {
    await page.goto("/alguma/rota");
    await expect(
      page.getByRole("heading", { level: 1, name: "Currícula" }),
    ).toBeVisible();

    const resposta = await request.get("/assets/nao-existe.js");
    expect(resposta.status()).toBe(404);
  });

  test("painel de acessibilidade abre e fecha com Esc devolvendo o foco", async ({
    page,
  }) => {
    await page.goto("/");
    const botao = page.locator("#a11y-toggle-btn");
    await botao.click();
    await expect(page.locator("#a11y-panel")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#a11y-panel")).toBeHidden();
    await expect(botao).toBeFocused();
  });

  test("axe-core: nenhuma violação WCAG 2.1 A/AA (contraste incluído)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Currícula" }),
    ).toBeVisible();
    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(resultado.violations).toEqual([]);
  });

  test("cabeçalhos de segurança: CSP estrita e sem inline script", async ({
    request,
  }) => {
    const resposta = await request.get("/");
    const csp = resposta.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("unsafe-eval");
    expect(resposta.headers()["x-content-type-options"]).toBe("nosniff");
  });
});
