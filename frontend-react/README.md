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
- [ ] **Fase 2 — Autenticação:** modais de login/cadastro/recuperação de
      senha (Supabase).
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
- **CSS global (`src/styles/global.css`) para as classes de acessibilidade
  em `<html>`** (`.a11y-font-lg`, `.a11y-high-contrast`, etc.) — essas
  classes precisam afetar o documento inteiro, não só a árvore de um
  componente, então não fazem sentido como CSS Module.
- Paleta de cores (`--navy`, `--paper`, `--ink`, etc.) portada
  literalmente do app atual — mantém identidade visual durante a
  transição. Pode evoluir depois que a migração terminar.

## O que ainda não foi portado

Bootstrap e Font Awesome (usados no app atual) ainda não entraram nesse
projeto — o ícone do botão de acessibilidade hoje é um emoji simples como
placeholder. Isso será decidido/portado quando a Fase 3 (formulário
principal) começar, já que é lá que a maior parte da UI baseada em
Bootstrap vive.
