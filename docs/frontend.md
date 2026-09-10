# Frontend

O projeto tem dois frontends coexistindo hoje, por causa de uma migração em andamento — não é uma escolha definitiva de arquitetura. Ver `docs/architecture.md` para o porquê e as implicações disso.

## `frontend/` — versão em produção na web (legado)

Vanilla JS + Bootstrap 5, servido diretamente pelo Flask (`backend/app.py`). É o que qualquer pessoa acessando o site hoje efetivamente usa.

- `index.html` — formulário e estrutura da página.
- `script.js` — toda a lógica: autenticação (Supabase), CRUD de currículos, montagem do payload para `/generate-cv`, autosave com debounce.
- `utils.js` — funções puras extraídas para serem testáveis isoladamente (normalização de URL, formatação de data, conversão de arquivo para base64, etc).
- `utils.test.js` — suíte de testes (Vitest + jsdom), 21 testes.
- `vendor/` — Bootstrap, Font Awesome e `supabase-js` empacotados localmente (não via CDN) — ver `docs/security.md` para o motivo (CSP + confiabilidade no app Android empacotado).
- `accessibility.js` — ajustes de acessibilidade específicos dessa versão.

Estado: funcional e testado, mas é a base que está sendo substituída. Novas features de UI não devem mais ser adicionadas aqui — vão para `frontend-react/`.

## `frontend-react/` — reescrita em andamento

React 19 + TypeScript + Vite, com testes via Vitest + Testing Library (`@testing-library/react`, `@testing-library/user-event`). Ainda **não está servida pelo Flask** — hoje ela só alimenta o build do app Android.

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

Depois disso: um commit de correção de regressões de acessibilidade (h1, skip link, CSS de seção) — sinal de que a paridade com `frontend/` (que já tinha passado por ajustes de acessibilidade) ainda está sendo fechada aos poucos.

### O que falta para essa migração ser "completa"

Não há uma Fase 5 formalizada no repositório ainda. Os itens em aberto, na prática:

- Decidir como o Flask passa a servir o build do `frontend-react` em vez de `frontend/` — ou uma estratégia de transição (ex: feature flag, subdomínio de staging).
- Confirmar paridade de funcionalidade com `frontend/` (o vendor local de libs, o `accessibility.js`, comportamento de autosave em cenários de erro de rede).
- Aposentar `frontend/` e `www/` como artefato separado, ou formalizar `www/` como o único destino de build (web e Android a partir da mesma fonte).

## Convenções específicas do React

- Nomes de função/variável em português para lógica de domínio (`salvarCurriculo`, `buscarCurriculoPorId`, `carregarPorId`), mesmo padrão já usado em `frontend/script.js` — consistência deliberada entre os dois frontends durante a migração.
- ESLint do `frontend-react/eslint.config.js` mantém `semi: always` e `quotes: double` — mesmo estilo do ESLint do `frontend/` (`eslint.config.js` na raiz), para reduzir atrito de quem alterna entre os dois códigos durante a transição.
- `dangerouslySetInnerHTML` não é usado em nenhum componente — toda renderização de conteúdo do usuário passa pelo escaping padrão do React.

## Testes

`npm test` (dentro de `frontend-react/`) roda Vitest com ambiente jsdom. `npm run lint` roda ESLint; `npx tsc -b` faz o typecheck completo (build em modo projeto, sem emitir JS — o build real é via `vite build`). Todos os três passam limpos como parte do CI (`.github/workflows/code-quality.yml`).
