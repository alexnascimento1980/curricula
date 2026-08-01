import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AccessibilityPanel } from "./AccessibilityPanel";

describe("AccessibilityPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    document.documentElement.className = "";
  });

  it("começa fechado, sem a classe 'open' e aria-expanded=false", () => {
    render(<AccessibilityPanel />);
    const painel = document.getElementById("a11y-panel");
    const botao = screen.getByRole("button", {
      name: "Abrir opções de acessibilidade",
    });

    expect(painel).not.toHaveClass("open");
    expect(botao).toHaveAttribute("aria-expanded", "false");
  });

  it("abre ao clicar no botão flutuante e move o foco pro primeiro controle", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);

    const botao = screen.getByRole("button", {
      name: "Abrir opções de acessibilidade",
    });
    await user.click(botao);

    const painel = document.getElementById("a11y-panel");
    expect(painel).toHaveClass("open");
    expect(botao).toHaveAttribute("aria-expanded", "true");

    const primeiroControle = within(painel!).getByRole("button", {
      name: /normal/,
    });
    expect(primeiroControle).toHaveFocus();
  });

  it("fecha com Escape e devolve o foco pro botão flutuante", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);

    const botao = screen.getByRole("button", {
      name: "Abrir opções de acessibilidade",
    });
    await user.click(botao);

    const painel = document.getElementById("a11y-panel")!;
    fireEvent.keyDown(painel, { key: "Escape" });

    expect(painel).not.toHaveClass("open");
    expect(botao).toHaveFocus();
  });

  it("fecha ao clicar fora do painel, sem devolver o foco (só Esc faz isso)", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Fora do painel</button>
        <AccessibilityPanel />
      </div>,
    );

    await user.click(
      screen.getByRole("button", { name: "Abrir opções de acessibilidade" }),
    );
    expect(document.getElementById("a11y-panel")).toHaveClass("open");

    await user.click(screen.getByRole("button", { name: "Fora do painel" }));
    expect(document.getElementById("a11y-panel")).not.toHaveClass("open");
  });

  it("alterna o tamanho da fonte, atualiza aria-pressed e a classe em <html>", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);
    await user.click(
      screen.getByRole("button", { name: "Abrir opções de acessibilidade" }),
    );

    const botaoGrande = screen.getByRole("button", { name: /grande/ });
    await user.click(botaoGrande);

    expect(botaoGrande).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("a11y-font-lg");

    const botaoNormal = screen.getByRole("button", { name: /normal/ });
    expect(botaoNormal).toHaveAttribute("aria-pressed", "false");
  });

  it("liga alto contraste e aplica a classe em <html>", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);
    await user.click(
      screen.getByRole("button", { name: "Abrir opções de acessibilidade" }),
    );

    const chk = screen.getByRole("checkbox", { name: "Alto contraste" });
    await user.click(chk);

    expect(chk).toBeChecked();
    expect(document.documentElement).toHaveClass("a11y-high-contrast");
  });

  it("persiste as preferências no localStorage ao alterar", async () => {
    const user = userEvent.setup();
    render(<AccessibilityPanel />);
    await user.click(
      screen.getByRole("button", { name: "Abrir opções de acessibilidade" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: "Reduzir movimento/animações" }),
    );

    const salvo = JSON.parse(
      localStorage.getItem("curricula-a11y-prefs") ?? "{}",
    );
    expect(salvo.reduceMotion).toBe(true);
  });

  it("lê as preferências já salvas no localStorage ao montar", () => {
    localStorage.setItem(
      "curricula-a11y-prefs",
      JSON.stringify({
        fontSize: "lg",
        highContrast: true,
        reduceMotion: false,
      }),
    );

    render(<AccessibilityPanel />);

    expect(document.documentElement).toHaveClass("a11y-font-lg");
    expect(document.documentElement).toHaveClass("a11y-high-contrast");
  });
});
