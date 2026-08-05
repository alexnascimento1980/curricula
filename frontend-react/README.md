# Currícula — Frontend React (em migração)

Este é o novo frontend em **React + TypeScript + Vite**, construído do lado
do app atual (`frontend/`, Vanilla JS) sem substituí-lo ainda — migração
incremental ("strangler fig"), não reescrita de uma vez. O app antigo
continua em produção normalmente enquanto este vai sendo construído por
fases.

## Por que incremental, e não reescrita completa

O app atual tem 51 testes de backend, 21 de frontend, certificação PDF/UA-1
e acessibilidade validada manualmente com NVDA. Uma reescrita completa de
uma vez arrisca perder rigor de acessibilidade no meio da tradução (timing
de `aria-live`, ordem de foco em modais, etc.) sem ninguém perceber até
tarde. Migrando por fases, cada uma sai testada e validada antes da
próxima começar.

## Fases

- [x] **Fase 0 — Fundação:** projeto Vite + React + TypeScript, ESLint
      (flat config, mesmo estilo do `frontend/` antigo), Vitest +
      Testing Library.
- [x] **Fase 1 — Barra de acessibilidade:** `AccessibilityPanel` —
      tamanho de fonte, alto contraste, redução de movimento. Porta fiel
      do `frontend/accessibility.js` original, incluindo o comportamento
      de foco (abre → foco no primeiro controle; Esc → fecha e devolve o
      foco; clique fora → fecha sem devolver foco).
- [x] **Fase 2 — Autenticação:** login/cadastro/Google, recuperação de
      senha (incluindo o fluxo OAuth nativo Android via
      `window.Capacitor`), `AuthContext` + `useAuth()`. Trouxe Bootstrap
      e Font Awesome via npm nesta fase (antes do previsto — precisava
      dos modais). Componente `Modal` reutilizável envolve o
      `bootstrap.Modal` imperativo numa API declarativa (`open`/`onClose`),
      com sincronia nos dois sentidos (Esc/clique-fora no Bootstrap
      também atualiza o estado do React). 43 testes cobrindo sessão,
      validação de formulário, foco e o próprio `Modal`.
- [x] **Fase 3 — Formulário principal:** blocos dinâmicos (Experiência,
      Formação, Cursos, Projetos) com adicionar/remover, cascata
      Estado→Cidade via API do IBGE, máscara de telefone, limpeza de URL
      do LinkedIn/GitHub ao sair do campo, toggles "Incluir no PDF?" (cada
      um controla o `required` dos campos da sua seção), autosave com
      debounce (mecanismo pronto — o `onAutosave` de verdade entra na
      Fase 4, junto da troca de currículo), geração e download do PDF
      (incluindo o caminho nativo Android via Filesystem+Share). 86
      testes no total do projeto.
- [x] **Fase 4 — Painel de currículos salvos + persistência real:**
      `useResumeManager` orquestra lista, seleção, criação, renomeação e
      exclusão de currículos no Supabase; autosave de verdade conectado
      (com `flush` obrigatório antes de trocar de currículo — o mesmo bug
      que o app antigo já tinha corrigido, replicado aqui); painel lateral
      (`Offcanvas`, análogo ao `Modal` da Fase 2) com a lista; modal
      compartilhado para criar/renomear; indicador de status
      "Salvando.../Salvo". 108 testes no total do projeto.
- [ ] **Fase 5 — Corte final:** desliga `frontend/`, `www/` passa a
      apontar pro build deste projeto, revalida tudo com NVDA + testes.

## Comandos

```bash
npm install       # instalar dependências (rodar dentro de frontend-react/)
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (gera dist/)
npm run lint      # ESLint
npm test          # Vitest (roda uma vez)
npm run test:watch  # Vitest em modo watch
```

## Decisões técnicas

- **TypeScript** em vez de JS puro — pega erro de payload/estado em tempo
  de build.
- **ESLint flat config**, não o `oxlint` que o Vite usa por padrão hoje —
  mantém consistência com o `frontend/eslint.config.js` já existente e com
  o workflow de CI (`code-quality.yml`), que já roda ESLint.
- **Vitest + Testing Library**, não Jest — o projeto já usa Vitest no
  frontend antigo; reaproveitar a mesma ferramenta em vez de introduzir uma
  segunda.
- **Bootstrap + Font Awesome via npm** (não vendorizado manualmente como
  no `frontend/` antigo) — o bundler já resolve isso direito, sem precisar
  da gambiarra de servir `vendor/` por uma rota Flask dedicada.
- **`bootstrap.Modal` real, não uma reimplementação em React** — o
  componente `Modal` é um wrapper fino em cima da classe JS imperativa do
  Bootstrap (focus trap, Esc, aria-modal já resolvidos e validados no app
  antigo com NVDA). Escuta o evento `hidden.bs.modal` pra manter o estado
  do React sincronizado quando o modal fecha por fora (clique no
  backdrop/Esc), não só quando fechamos programaticamente.
- **CSS global (`src/styles/global.css`) para as classes de acessibilidade
  em `<html>`** (`.a11y-font-lg`, `.a11y-high-contrast`, etc.) — essas
  classes precisam afetar o documento inteiro, não só a árvore de um
  componente, então não fazem sentido como CSS Module.
- Paleta de cores (`--navy`, `--paper`, `--ink`, etc.) portada
  literalmente do app atual — mantém identidade visual durante a
  transição. Pode evoluir depois que a migração terminar.
- **Testes de componentes que usam `Modal` mockam o `bootstrap.Modal`**
  (`vi.mock("bootstrap", ...)`) em vez de deixar rodar de verdade — o
  jsdom não suporta bem as transições CSS que o Bootstrap usa
  internamente, e isso causava erros assíncronos vazando entre testes. O
  mock simula só o que os testes precisam (gerenciar `aria-hidden`/
  `aria-modal`, dependendo se abriu ou fechou) — a integração real com o
  Bootstrap de verdade é validada nos testes de `Modal.test.tsx`.

- **Proxy do Vite pro backend Flask em dev** (`vite.config.ts`) — sem
  isso, `fetch("/generate-cv")` cairia no próprio servidor do Vite (porta
  5173), que não tem essa rota. Em produção (Fase 5, quando este app for
  servido pelo próprio Flask) o proxy não é necessário, já é same-origin.
- **`useAutosave` genérico, aceitando um `onAutosave` opcional** — o
  `CurriculoForm` não sabe (nem precisa saber) COMO os dados são
  persistidos; isso mantém o formulário testável isoladamente sem mockar
  Supabase, e deixa a Fase 4 (troca de currículo, upsert de verdade) livre
  pra decidir a estratégia de persistência sem reabrir este componente.
- **Payload calculado sob demanda (`montarPayloadPdf`), não guardado como
  estado** — o formulário guarda os dados "brutos" (estado/cidade
  separados, `highlights` como texto livre); a transformação pro formato
  que a API espera (toggles aplicados, datas formatadas, texto dividido em
  listas) é uma função pura testada isoladamente, chamada só no momento do
  envio.
- **Duas regras novas do `eslint-plugin-react-hooks` pegaram problemas
  reais** durante o desenvolvimento desta fase também (`set-state-in-effect`
  no hook do IBGE) — resolvido derivando o estado quando dava, e um
  comentário `eslint-disable` pontual e justificado quando não dava (o
  padrão de "buscar dados ao mudar uma prop" é uma exceção legítima,
  documentada pelo próprio React).

## Aviso de tamanho do bundle

O build mostra um aviso de chunk grande (~520KB JS antes de gzip,
principalmente Bootstrap + Font Awesome + Supabase). Não é um erro — só
uma sugestão de otimização (code-splitting) pra revisitar depois que a
migração terminar, não antes.

- **`CurriculoForm` expõe um "handle" imperativo via `ref`** (React 19: `ref`
  como prop normal, sem precisar de `forwardRef`) — `carregarDados`,
  `resetarFormulario`, `flushAutosave`, `cancelarAutosave`. Preferi isso a
  levantar o estado do formulário pra fora (o que quebraria todos os
  testes da Fase 3): o formulário continua "dono" do seu próprio estado
  e testável isoladamente; quem gerencia troca de currículo só pede pra
  ele fazer coisas pontuais.
- **`Offcanvas.tsx`** — mesmo padrão do `Modal.tsx` (wrapper declarativo
  em cima da classe imperativa do Bootstrap), reaproveitado pro painel
  lateral de currículos.
- **`useResumeManager` não sabe nada sobre React Router nem sobre telas** —
  só orquestra dados e delega pro `CurriculoFormHandle` via ref. Isso
  mantém a peça mais complexa da Fase 4 testável com hooks puros
  (`renderHook`), sem precisar montar a árvore de componentes inteira.
- **Mais um `eslint-disable` pontual e justificado** (`useResumeManager`,
  ao deslogar) — chamar métodos de um `ref` só pode acontecer num efeito,
  nunca durante o render, então o padrão de "ajustar estado durante o
  render" (usado em outros lugares desta fase) não se aplica aqui.

## O que ainda não foi portado

O fluxo OAuth nativo (Android) está portado e tipado, mas só é
efetivamente testável depois que este projeto entrar de verdade no build
do Capacitor (Fase 5) — hoje `window.Capacitor` nunca existe rodando
`npm run dev` num navegador comum, então esse caminho específico só tem
cobertura de tipos, não de teste automatizado.
