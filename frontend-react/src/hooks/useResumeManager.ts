import { type RefObject, useCallback, useEffect, useState } from "react";
import type { CurriculoFormHandle } from "../components/form/CurriculoForm";
import {
  buscarCurriculoPorId,
  buscarIdMaisRecente,
  criarCurriculo,
  excluirCurriculoPorId,
  listarCurriculos,
  renomearCurriculo,
  salvarCurriculo,
  type ResumoDeCurriculo,
} from "../lib/resumeService";
import { normalizarDadosCurriculo, type DadosCurriculo } from "../types/curriculo";

const NOME_PADRAO = "Meu Currículo";
const TITULO_SEM_SELECAO = "Nenhum selecionado";

export function useResumeManager(
  userId: string | null,
  formHandle: RefObject<CurriculoFormHandle | null>,
) {
  const [resumes, setResumes] = useState<ResumoDeCurriculo[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [tituloAtual, setTituloAtual] = useState(TITULO_SEM_SELECAO);
  const [carregando, setCarregando] = useState(false);
  const [statusSalvamento, setStatusSalvamento] = useState<
    "oculto" | "salvando" | "salvo"
  >("oculto");

  const recarregarLista = useCallback(async (uid: string) => {
    setResumes(await listarCurriculos(uid));
  }, []);

  const carregarPorId = useCallback(
    async (id: string) => {
      const resultado = await buscarCurriculoPorId(id);
      if (!resultado) return;
      setTituloAtual(resultado.nome);
      formHandle.current?.carregarDados(
        normalizarDadosCurriculo(resultado.dados),
      );
    },
    [formHandle],
  );

  // Ao logar: carrega o currículo mais recente (ou cria um, se a pessoa
  // nunca teve nenhum) e a lista completa. Ao deslogar: limpa tudo.
  useEffect(() => {
    if (!userId) {
      formHandle.current?.cancelarAutosave();
      // Chamar métodos do ref do formulário só pode acontecer num efeito
      // (nunca durante o render) — então o padrão de "ajustar estado
      // durante o render" não se aplica aqui; os setState abaixo fazem
      // parte da mesma sincronização com o formulário externo.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentResumeId(null);
      setResumes([]);
      setTituloAtual(TITULO_SEM_SELECAO);
      formHandle.current?.resetarFormulario();
      return;
    }

    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        let id = await buscarIdMaisRecente(userId);
        if (!id) id = await criarCurriculo(userId, NOME_PADRAO);
        if (cancelado) return;

        if (id) {
          setCurrentResumeId(id);
          await carregarPorId(id);
        }
        if (!cancelado) await recarregarLista(userId);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const selecionar = useCallback(
    async (id: string) => {
      if (id === currentResumeId) return;
      await formHandle.current?.flushAutosave();
      setCurrentResumeId(id);
      await carregarPorId(id);
      if (userId) await recarregarLista(userId);
    },
    [currentResumeId, formHandle, carregarPorId, userId, recarregarLista],
  );

  const criar = useCallback(
    async (nome: string) => {
      if (!userId) return false;
      await formHandle.current?.flushAutosave();
      const novoId = await criarCurriculo(userId, nome);
      if (!novoId) return false;

      setCurrentResumeId(novoId);
      formHandle.current?.resetarFormulario();
      setTituloAtual(nome);
      await recarregarLista(userId);
      return true;
    },
    [userId, formHandle, recarregarLista],
  );

  const renomear = useCallback(
    async (id: string, nome: string) => {
      const { error } = await renomearCurriculo(id, nome);
      if (error) return false;

      if (id === currentResumeId) setTituloAtual(nome);
      if (userId) await recarregarLista(userId);
      return true;
    },
    [currentResumeId, userId, recarregarLista],
  );

  const excluir = useCallback(
    async (id: string) => {
      const { error } = await excluirCurriculoPorId(id);
      if (error) return false;

      if (id === currentResumeId) {
        // Cancela (não força) o salvamento pendente — não faz sentido
        // gravar dados num currículo que acabamos de excluir.
        formHandle.current?.cancelarAutosave();

        let novoId = userId ? await buscarIdMaisRecente(userId) : null;
        if (!novoId && userId) novoId = await criarCurriculo(userId, NOME_PADRAO);

        if (novoId) {
          setCurrentResumeId(novoId);
          await carregarPorId(novoId);
        }
      }
      if (userId) await recarregarLista(userId);
      return true;
    },
    [currentResumeId, userId, formHandle, carregarPorId, recarregarLista],
  );

  const salvar = useCallback(
    async (dados: DadosCurriculo) => {
      if (!currentResumeId) return;
      setStatusSalvamento("salvando");
      try {
        await salvarCurriculo(currentResumeId, dados);
      } finally {
        setStatusSalvamento("salvo");
        setTimeout(() => setStatusSalvamento("oculto"), 2000);
      }
    },
    [currentResumeId],
  );

  return {
    resumes,
    currentResumeId,
    tituloAtual,
    carregando,
    statusSalvamento,
    selecionar,
    criar,
    renomear,
    excluir,
    salvar,
  };
}
