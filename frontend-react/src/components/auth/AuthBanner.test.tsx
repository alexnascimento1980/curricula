import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthBanner } from "./AuthBanner";

const logout = vi.fn();
let user: { email: string } | null = null;

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user, logout }),
}));

describe("AuthBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    user = null;
  });

  it("mostra o botão de login quando deslogado", () => {
    const onAbrirLogin = vi.fn();
    render(<AuthBanner onAbrirLogin={onAbrirLogin} />);

    expect(
      screen.getByRole("button", { name: "Fazer Login" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Logado/)).not.toBeInTheDocument();
  });

  it("chama onAbrirLogin ao clicar no botão de login", async () => {
    const onAbrirLogin = vi.fn();
    const usuario = userEvent.setup();
    render(<AuthBanner onAbrirLogin={onAbrirLogin} />);

    await usuario.click(screen.getByRole("button", { name: "Fazer Login" }));
    expect(onAbrirLogin).toHaveBeenCalled();
  });

  it("mostra o e-mail e o botão de sair quando logado", () => {
    user = { email: "logado@teste.com" };
    render(<AuthBanner onAbrirLogin={vi.fn()} />);

    expect(screen.getByText("logado@teste.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fazer Login" }),
    ).not.toBeInTheDocument();
  });

  it("chama logout ao clicar em Sair", async () => {
    user = { email: "logado@teste.com" };
    const usuario = userEvent.setup();
    render(<AuthBanner onAbrirLogin={vi.fn()} />);

    await usuario.click(screen.getByRole("button", { name: "Sair" }));
    expect(logout).toHaveBeenCalled();
  });
});
