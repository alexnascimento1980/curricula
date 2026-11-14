# Frontend

O frontend é `frontend-react/` (React + TypeScript + Vite). O antigo `frontend/` (Vanilla JS) foi removido após a migração; o histórico dele está no git.

## `frontend-react/`

React 19 + TypeScript + Vite, com testes via Vitest + Testing Library (`@testing-library/react`, `@testing-library/user-event`). Desde a Fase 5, o Flask serve o build dela (`frontend-react/dist`, gerado por `npm run build`) quando ele existe; sem o build, cai no `frontend/` legado. O mesmo código alimenta o app Android (`npm run build:android` → `www/`).

### Estrutura

```
frontend-react/src/
├── components/
│   ├── auth/          # Modais de login, cadastro, recuperação de senha
│   ├── form/           # Formulário do currículo (seções: básicos, resumo,
│   │                   #   experiência, formação, cursos, projetos, habilidades)
│   └── resumes/         # Painel de múltiplos currículos (listar/criar/
│                        #   renomear/excluir/selecionar)
├── contexts/
│   └── AuthContext.tsx  # Sessão do Supabase Auth, fluxo OAuth nativo
│                        #   (Capacitor) e recuperação de senha
├── hooks/
│   ├── useAuth.ts
│   ├── useAutosave.ts        # Debounce de salvamento automático
│   ├── useCurriculoForm.ts   # Estado do formulário
│   ├── useIbgeLocalidades.ts # Autocomplete de cidade/estado (API do IBGE)
│   └── useResumeManager.ts   # CRUD de currículos + troca entre eles
├── lib/
│   ├── curriculoUtils.ts
│   ├── montarPayloadPdf.ts   # Monta o payload enviado a /generate-cv
│   ├── resumeService.ts      # Chamadas ao Supabase (tabela `curriculos`)
│   └── supabaseClient.ts
└── types/
    └── curriculo.ts
```

Cada componente/hook com lógica não-trivial tem um `*.test.tsx`/`*.test.ts` ao lado — não existe uma pasta `__tests__` separada, os testes ficam colocados junto do código que testam.

### Migração — fases concluídas

1. **Fase 1** — setup do projeto (Vite + TS + estrutura inicial), build alimentando `www/` para o Android.
2. **Fase 2** — autenticação completa (login, cadastro, Google OAuth, recuperação de senha), incluindo o fluxo OAuth nativo via Capacitor (`AuthContext.tsx`).
3. **Fase 3** — formulário principal completo (todas as seções, incluindo os blocos repetíveis de experiência/formação/cursos/projetos).
4. **Fase 4** — painel de currículos (múltiplos currículos por usuário) e persistência real via Supabase (`resumeService.ts`, `useResumeManager.ts`), substituindo o que antes era só estado local.

5. **Fase 5** — o Flask serve o build (`frontend-react/dist`); `frontend/` legado removido; CSP com `script-src 'self'`.

Validado (2026-11-13): leitor de tela NVDA, teste em aparelho físico (Android) e axe-core em Chrome real (0 violações WCAG 2.1 A/AA, incluindo contraste). O CI roda um teste `vitest-axe` na árvore do `App` (estrutura/ARIA; contraste não, porque o jsdom não calcula cores — por isso as cores `info`/`warning` do Bootstrap foram escurecidas em `styles/global.css`).

Roteiro do NVDA: `frontend-react/roteiro-teste-nvda-react.md` (repetir a cada mudança grande de UI).

## Convenções específicas do React

- Nomes de função/variável em português para lógica de domínio (`salvarCurriculo`, `buscarCurriculoPorId`, `carregarPorId`) — consistência deliberada entre os dois frontends durante a migração.
- ESLint do `frontend-react/eslint.config.js` mantém `semi: always` e `quotes: double`.
- `dangerouslySetInnerHTML` não é usado em nenhum componente — toda renderização de conteúdo do usuário passa pelo escaping padrão do React.

## Testes

`npm test` (dentro de `frontend-react/`) roda Vitest com ambiente jsdom. `npm run lint` roda ESLint; `npx tsc -b` faz o typecheck completo (build em modo projeto, sem emitir JS — o build real é via `vite build`). Todos os três passam limpos como parte do CI (`.github/workflows/code-quality.yml`).

## Testes ponta a ponta (E2E)

`frontend-react/e2e/` tem testes Playwright que sobem o Flask servindo o build do React e abrem o Chrome instalado na máquina (`channel: "chrome"`, sem baixar browsers): carregamento sem violação de CSP, fallback da SPA, painel de acessibilidade, axe-core em Chrome real e cabeçalhos de segurança. Rodar: `npm run build` e depois `npm run test:e2e` em `frontend-react/` (precisa de Python com `backend/requirements.txt` instalado). No CI é o job `e2e` de `tests.yml`.
