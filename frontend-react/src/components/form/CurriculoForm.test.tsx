import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CurriculoForm } from "./CurriculoForm";

function mockFetchPadrao() {
  return vi.fn((url: string) => {
    if (typeof url === "string" && url.includes("/estados?")) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            { sigla: "SP", nome: "São Paulo" },
          ]),
      }) as unknown as Promise<Response>;
    }
    if (typeof url === "string" && url.includes("/municipios")) {
      return Promise.resolve({
        json: () => Promise.resolve([{ nome: "Campinas" }]),
      }) as unknown as Promise<Response>;
    }
    if (typeof url === "string" && url.includes("/generate-cv")) {
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(["%PDF-fake"])),
      }) as unknown as Promise<Response>;
    }
    return Promise.reject(new Error(`URL não mockada: ${url}`));
  });
}

async function preencherCamposObrigatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome Completo"), "Fulano de Tal");
  await user.type(screen.getByLabelText("Título Profissional"), "Dev");
  await user.type(screen.getByLabelText("E-mail"), "fulano@teste.com");
  await user.type(screen.getByLabelText("Telefone"), "19982907060");

  await waitFor(() =>
    expect(
      screen.getByRole("option", { name: "São Paulo" }),
    ).toBeInTheDocument(),
  );
  await user.selectOptions(screen.getByLabelText("Estado"), "SP");
  await waitFor(() =>
    expect(
      screen.getByRole("option", { name: "Campinas" }),
    ).toBeInTheDocument(),
  );
  await user.selectOptions(screen.getByLabelText("Cidade"), "Campinas");

  await user.type(screen.getByLabelText("LinkedIn"), "linkedin.com/in/fulano");
  await user.type(screen.getByLabelText("GitHub"), "github.com/fulano");

  await user.type(
    screen.getByLabelText("Resumo profissional"),
    "Resumo de teste.",
  );

  const blocoExperiencia = screen
    .getByText("Nova Experiência")
    .closest(".card") as HTMLElement;
  await user.type(
    within(blocoExperiencia).getByLabelText("Empresa"),
    "Empresa X",
  );
  await user.type(within(blocoExperiencia).getByLabelText("Cargo"), "Dev");
  const inicioExp = within(blocoExperiencia).getByLabelText(
    "Mês/Ano Início",
  ) as HTMLInputElement;
  const fireEvent = (await import("@testing-library/react")).fireEvent;
  fireEvent.change(inicioExp, { target: { value: "2020-01" } });
  await user.click(
    within(blocoExperiencia).getByLabelText("Trabalho aqui atualmente"),
  );
  await user.type(
    within(blocoExperiencia).getByLabelText("Atividades (separe por \";\")"),
    "Fez coisas.",
  );

  const blocoFormacao = screen
    .getByText("Nova Formação")
    .closest(".card") as HTMLElement;
  await user.type(
    within(blocoFormacao).getByLabelText("Instituição"),
    "USP",
  );
  await user.type(within(blocoFormacao).getByLabelText("Curso"), "CC");
  fireEvent.change(within(blocoFormacao).getByLabelText("Mês/Ano Início"), {
    target: { value: "2016-01" },
  });
  await user.click(
    within(blocoFormacao).getByLabelText("Cursando atualmente"),
  );
  await user.type(within(blocoFormacao).getByLabelText("Status"), "Cursando");

  const blocoCurso = screen.getByText("Novo Curso").closest(".card") as HTMLElement;
  await user.type(within(blocoCurso).getByLabelText("Nome do Curso"), "Curso X");
  await user.type(within(blocoCurso).getByLabelText("Instituição"), "Instituto Y");

  const blocoProjeto = screen
    .getByText("Novo Projeto")
    .closest(".card") as HTMLElement;
  await user.type(within(blocoProjeto).getByLabelText("Nome"), "Projeto Z");
  await user.type(within(blocoProjeto).getByLabelText("Tecnologias"), "TS");
  await user.type(
    within(blocoProjeto).getByLabelText("Link"),
    "https://github.com/fulano/z",
  );
  await user.type(
    within(blocoProjeto).getByLabelText("Descrição"),
    "Descrição.",
  );

  await user.type(screen.getByLabelText("Habilidades e ferramentas"), "Python, React");
}

describe("CurriculoForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetchPadrao());
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:fake"),
    });
  });

  it("renderiza todas as 7 seções", async () => {
    render(<CurriculoForm notificar={vi.fn()} />);
    expect(await screen.findByText(/Dados Básicos/)).toBeInTheDocument();
    expect(screen.getByText(/Resumo Profissional/)).toBeInTheDocument();
    expect(screen.getByText(/Experiência Profissional/)).toBeInTheDocument();
    expect(screen.getByText(/Formação Acadêmica/)).toBeInTheDocument();
    expect(screen.getByText(/Cursos Complementares/)).toBeInTheDocument();
    expect(screen.getByText(/Projetos Técnicos/)).toBeInTheDocument();
    expect(screen.getByText(/Habilidades e Ferramentas/)).toBeInTheDocument();
  });

  it("adiciona um novo bloco de experiência ao clicar em Adicionar Experiência", async () => {
    const user = userEvent.setup();
    render(<CurriculoForm notificar={vi.fn()} />);

    expect(screen.getAllByText("Nova Experiência")).toHaveLength(1);
    await user.click(
      screen.getByRole("button", { name: /Adicionar Experiência/ }),
    );
    expect(screen.getAllByText("Nova Experiência")).toHaveLength(2);
  });

  it("remove um bloco de experiência", async () => {
    const user = userEvent.setup();
    render(<CurriculoForm notificar={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: /Adicionar Experiência/ }),
    );
    expect(screen.getAllByText("Nova Experiência")).toHaveLength(2);

    const botoesRemover = screen.getAllByRole("button", {
      name: "Remover esta experiência",
    });
    await user.click(botoesRemover[0]);
    expect(screen.getAllByText("Nova Experiência")).toHaveLength(1);
  });

  it("desmarcar 'Incluir no PDF?' de uma seção tira o required dos campos dela", async () => {
    const user = userEvent.setup();
    render(<CurriculoForm notificar={vi.fn()} />);

    const campoEmpresa = screen.getByLabelText("Empresa");
    expect(campoEmpresa).toBeRequired();

    await user.click(
      screen.getAllByRole("checkbox", { name: "Incluir no PDF?" })[0],
    );
    // (o primeiro toggle "Incluir no PDF?" na ordem do DOM é o de
    // Experiência, já que é a primeira seção com esse controle)

    expect(campoEmpresa).not.toBeRequired();
  });

  it("bloqueia o envio com campos obrigatórios vazios e avisa a pessoa", async () => {
    const user = userEvent.setup();
    const notificar = vi.fn();
    render(<CurriculoForm notificar={notificar} />);

    await user.click(screen.getByRole("button", { name: /Gerar Currículo/ }));

    expect(notificar).toHaveBeenCalledWith(
      "Verifique os campos obrigatórios.",
      "danger",
    );
    expect(
      (screen.getByRole("button", { name: /Gerar Currículo/ }).closest(
        "form",
      ) as HTMLElement),
    ).toHaveClass("was-validated");
  });

  it("envia o payload certo pro backend e dispara o download quando tudo está preenchido", async () => {
    const user = userEvent.setup();
    const notificar = vi.fn();
    render(<CurriculoForm notificar={notificar} />);

    await preencherCamposObrigatorios(user);
    await user.click(screen.getByRole("button", { name: /Gerar Currículo/ }));

    await waitFor(() =>
      expect(notificar).toHaveBeenCalledWith(
        "PDF gerado com sucesso!",
        "success",
      ),
    );

    const chamadaFetch = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (chamada: unknown[]) =>
        typeof chamada[0] === "string" && chamada[0].includes("/generate-cv"),
    ) as [string, { body: string }] | undefined;
    expect(chamadaFetch).toBeDefined();
    const payloadEnviado = JSON.parse(chamadaFetch![1].body);
    expect(payloadEnviado.basics.name).toBe("Fulano de Tal");
    expect(payloadEnviado.basics.location).toBe("Campinas, SP");
    expect(payloadEnviado.experience[0].endDate).toBe("Presente");
  }, 15000);
});
