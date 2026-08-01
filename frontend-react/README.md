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
- [ ] **Fase 3 — Formulário principal:** blocos dinâmicos (Experiência,
      Formação, Cursos, Projetos), autosave com debounce, toggles
      "Incluir no PDF?".
- [ ] **Fase 4 — Painel de currículos salvos + geração de PDF.**
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

## O que ainda não foi portado

O fluxo OAuth nativo (Android) está portado e tipado, mas só é
efetivamente testável depois que este projeto entrar de verdade no build
do Capacitor (Fase 5) — hoje `window.Capacitor` nunca existe rodando
`npm run dev` num navegador comum, então esse caminho específico só tem
cobertura de tipos, não de teste automatizado.
