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

Pendente: validação manual de acessibilidade com NVDA e teste em aparelho físico (ver `roteiro-teste-nvda-react.md`).

## Convenções específicas do React

- Nomes de função/variável em português para lógica de domínio (`salvarCurriculo`, `buscarCurriculoPorId`, `carregarPorId`) — consistência deliberada entre os dois frontends durante a migração.
- ESLint do `frontend-react/eslint.config.js` mantém `semi: always` e `quotes: double`.
- `dangerouslySetInnerHTML` não é usado em nenhum componente — toda renderização de conteúdo do usuário passa pelo escaping padrão do React.

## Testes

`npm test` (dentro de `frontend-react/`) roda Vitest com ambiente jsdom. `npm run lint` roda ESLint; `npx tsc -b` faz o typecheck completo (build em modo projeto, sem emitir JS — o build real é via `vite build`). Todos os três passam limpos como parte do CI (`.github/workflows/code-quality.yml`).
