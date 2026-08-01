import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

const show = vi.fn();
const hide = vi.fn();
const dispose = vi.fn();
let opcoesRecebidas: { backdrop?: boolean | string; keyboard?: boolean } = {};

vi.mock("bootstrap", () => ({
  Modal: vi.fn().mockImplementation(function MockModal(
    el: HTMLElement,
    opcoes: { backdrop?: boolean | string; keyboard?: boolean },
  ) {
    opcoesRecebidas = opcoes;
    return {
      show: (...args: unknown[]) => {
        el.removeAttribute("aria-hidden");
        el.setAttribute("aria-modal", "true");
        show(...args);
      },
      hide: (...args: unknown[]) => {
        el.setAttribute("aria-hidden", "true");
        el.removeAttribute("aria-modal");
        hide(...args);
      },
      dispose,
    };
  }),
}));

describe("Modal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    opcoesRecebidas = {};
  });

  it("cria a instância do bootstrap.Modal com backdrop/keyboard corretos", () => {
    render(
      <Modal
        id="teste-modal"
        titleId="teste-titulo"
        title="Título"
        open={false}
        onClose={vi.fn()}
        backdrop="static"
        keyboard={false}
      >
        conteúdo
      </Modal>,
    );
    expect(opcoesRecebidas).toEqual({ backdrop: "static", keyboard: false });
  });

  it("chama show() quando open passa a true", () => {
    const { rerender } = render(
      <Modal
        id="m"
        titleId="t"
        title="Título"
        open={false}
        onClose={vi.fn()}
      >
        conteúdo
      </Modal>,
    );
    // O efeito também roda na montagem inicial (open=false → hide()) —
    // limpamos aqui pra isolar só o que acontece na transição que importa.
    vi.clearAllMocks();

    rerender(
      <Modal id="m" titleId="t" title="Título" open onClose={vi.fn()}>
        conteúdo
      </Modal>,
    );
    expect(show).toHaveBeenCalledTimes(1);
    expect(hide).not.toHaveBeenCalled();
  });

  it("chama hide() quando open passa a false", () => {
    const { rerender } = render(
      <Modal id="m" titleId="t" title="Título" open onClose={vi.fn()}>
        conteúdo
      </Modal>,
    );

    rerender(
      <Modal
        id="m"
        titleId="t"
        title="Título"
        open={false}
        onClose={vi.fn()}
      >
        conteúdo
      </Modal>,
    );
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it("sincroniza de volta pro React quando o bootstrap fecha por conta própria (backdrop/Esc)", () => {
    const onClose = vi.fn();
    render(
      <Modal id="m" titleId="t" title="Título" open onClose={onClose}>
        conteúdo
      </Modal>,
    );

    // Simula o Bootstrap disparando o evento nativo de "fechou" — o que
    // aconteceria de verdade ao clicar no backdrop ou apertar Esc.
    document
      .getElementById("m")!
      .dispatchEvent(new Event("hidden.bs.modal", { bubbles: false }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("usa sempre a versão mais recente de onClose no listener (sem fechar sobre uma versão antiga)", () => {
    const onCloseAntigo = vi.fn();
    const onCloseNovo = vi.fn();
    const { rerender } = render(
      <Modal id="m" titleId="t" title="Título" open onClose={onCloseAntigo}>
        conteúdo
      </Modal>,
    );

    rerender(
      <Modal id="m" titleId="t" title="Título" open onClose={onCloseNovo}>
        conteúdo
      </Modal>,
    );

    document
      .getElementById("m")!
      .dispatchEvent(new Event("hidden.bs.modal", { bubbles: false }));

    expect(onCloseAntigo).not.toHaveBeenCalled();
    expect(onCloseNovo).toHaveBeenCalledTimes(1);
  });

  it("mostra o botão de fechar por padrão", () => {
    render(
      <Modal id="m" titleId="t" title="Título" open onClose={vi.fn()}>
        conteúdo
      </Modal>,
    );
    expect(
      screen.getByRole("button", { name: "Fechar modal" }),
    ).toBeInTheDocument();
  });

  it("esconde o botão de fechar quando backdrop='static' e keyboard=false", () => {
    render(
      <Modal
        id="m"
        titleId="t"
        title="Título"
        open
        onClose={vi.fn()}
        backdrop="static"
        keyboard={false}
      >
        conteúdo
      </Modal>,
    );
    expect(
      screen.queryByRole("button", { name: "Fechar modal" }),
    ).not.toBeInTheDocument();
  });

  it("faz dispose() da instância ao desmontar", () => {
    const { unmount } = render(
      <Modal id="m" titleId="t" title="Título" open={false} onClose={vi.fn()}>
        conteúdo
      </Modal>,
    );
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
