import { useEffect, useState } from "react";

interface EstadoIbge {
  sigla: string;
  nome: string;
}

interface CidadeIbge {
  nome: string;
}

type StatusCarregamento = "carregando" | "pronto" | "erro";

/**
 * Busca a lista de estados uma vez ao montar, e a lista de cidades toda
 * vez que o estado selecionado muda — replicando carregarEstados() /
 * carregarCidades() do script.js original.
 */
export function useIbgeLocalidades(estadoSelecionado: string) {
  const [estados, setEstados] = useState<EstadoIbge[]>([]);
  const [statusEstados, setStatusEstados] =
    useState<StatusCarregamento>("carregando");

  const [cidades, setCidades] = useState<CidadeIbge[]>([]);
  const [statusCidades, setStatusCidades] =
    useState<StatusCarregamento>("pronto");

  useEffect(() => {
    let cancelado = false;

    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data: EstadoIbge[]) => {
        if (cancelado) return;
        setEstados(data);
        setStatusEstados("pronto");
      })
      .catch(() => {
        if (cancelado) return;
        setStatusEstados("erro");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!estadoSelecionado) return;

    let cancelado = false;

    // Padrão documentado pelo próprio React para "buscar dados quando uma
    // prop muda, com estado de carregamento" (guia "You Might Not Need an
    // Effect" / seção de fetching) — o aviso do lint sobre setState
    // síncrono no corpo do efeito é sobre casos onde dá pra derivar o
    // estado sem um efeito; aqui não dá, já que é uma chamada de rede de
    // verdade disparada pela mudança do estado selecionado.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatusCidades("carregando");

    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios?orderBy=nome`,
    )
      .then((res) => res.json())
      .then((data: CidadeIbge[]) => {
        if (cancelado) return;
        setCidades(data);
        setStatusCidades("pronto");
      })
      .catch(() => {
        if (cancelado) return;
        setStatusCidades("erro");
      });

    return () => {
      cancelado = true;
    };
  }, [estadoSelecionado]);

  return {
    estados,
    statusEstados,
    // Sem estado selecionado, não há cidades pra mostrar — computado
    // aqui em vez de limpo via setState num efeito (mais simples e evita
    // uma renderização extra).
    cidades: estadoSelecionado ? cidades : [],
    statusCidades: estadoSelecionado ? statusCidades : "pronto",
  };
}
