# Currícula — Frontend React

Frontend em **React + TypeScript + Vite**. Desde a Fase 5 ele é o único
frontend do projeto: o Flask serve o build (`dist/`) na web, e o mesmo
build é empacotado pelo Capacitor no app Android. O antigo `frontend/`
(Vanilla JS) foi removido.

## Como a migração foi feita

A migração foi incremental ("strangler fig"), em fases, para não perder
rigor de acessibilidade (timing de `aria-live`, ordem de foco em modais,
etc.) numa reescrita de uma vez. Cada fase saiu testada antes da próxima.

- [x] **Fase 0 — Fundação:** Vite + React + TypeScript, ESLint (flat
      config), Vitest + Testing Library.
- [x] **Fase 1 — Barra de acessibilidade:** `AccessibilityPanel` (tamanho
      de fonte, alto contraste, redução de movimento), com gerenciamento
      de foco (abre → primeiro controle; Esc → fecha e devolve o foco).
- [x] **Fase 2 — Autenticação:** login/cadastro/Google, recuperação de
      senha, fluxo OAuth nativo Android (`@capacitor/*`), `AuthContext` +
      `useAuth()`, componente `Modal` sobre o `bootstrap.Modal`.
- [x] **Fase 3 — Formulário principal:** blocos dinâmicos, cascata
      Estado→Cidade (IBGE), máscaras, toggles "Incluir no PDF?", autosave
      com debounce, geração e download do PDF (inclusive no Android).
- [x] **Fase 4 — Currículos salvos:** `useResumeManager` (lista, criação,
      renomeação, exclusão no Supabase), autosave com `flush` antes de
      trocar de currículo, painel lateral e indicador "Salvando.../Salvo".
- [x] **Fase 5 — Corte final:** Flask serve o build do React, `frontend/`
      removido, CSP `script-src 'self'`. Validada em aparelho físico
      Android, com axe-core em Chrome real (0 violações), teste
      `vitest-axe` no CI e NVDA.

## Comandos

```bash
npm install       # instalar dependências (rodar dentro de frontend-react/)
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (gera dist/)
npm run build:android  # builda direto para ../www (usado pelo Capacitor/Android)
npm run lint      # ESLint
npm test          # Vitest (roda uma vez)
npm run test:watch  # Vitest em modo watch
```

Para rodar tudo servido pelo Flask: `npm run build` aqui e, na raiz,
`python backend/app.py` (abre em `http://127.0.0.1:5000`).

Depois de `build:android`, sincronize com o projeto nativo (rodar a partir
da raiz do repositório, não daqui de dentro):
```bash
cd ..
npx cap sync android
```

## Decisões técnicas

- **TypeScript** em vez de JS puro — pega erro de payload/estado em tempo
  de build.
- **ESLint flat config**, não o `oxlint` que o Vite usa por padrão hoje —
  consistente com o workflow de CI (`code-quality.yml`), que roda ESLint.
- **Vitest + Testing Library**, não Jest — uma ferramenta só, integrada ao
  Vite. `vitest-axe` cobre acessibilidade automatizada.
- **Bootstrap + Font Awesome via npm** — o bundler resolve
  isso, sem servir `vendor/` por uma rota Flask dedicada.
- **`bootstrap.Modal` real, não uma reimplementação em React** — o
  componente `Modal` é um wrapper fino em cima da classe JS imperativa do
  Bootstrap (focus trap, Esc, aria-modal já resolvidos e validados com NVDA). Escuta o evento `hidden.bs.modal` pra manter o estado
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
  5173), que não tem essa rota. Em produção o Flask serve o build, então
  é same-origin e o proxy não é necessário.
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

## Bundle

O `vite.config.ts` separa as bibliotecas em chunks (`react`, `supabase`,
`bootstrap`, `capacitor`, `vendor`); o código do app fica em ~52 kB. O Flask
serve `assets/` com cache de 1 ano (`immutable`), já que os nomes têm hash.

## Android

`npm run build:android` builda direto para `../www` (não versionado) em vez
de gerar em `dist/` e copiar — evita o bug antigo de cópia aninhada no
PowerShell. Na raiz, `npm run android` faz build + `cap sync`, e
`npm run android:open` abre o Android Studio. Teste em aparelho físico: o
emulador pode falhar em algumas máquinas.

## Acessibilidade

Roteiro manual com NVDA em `roteiro-teste-nvda-react.md` (repetir a cada
mudança grande de UI). O axe-core roda no CI via `vitest-axe`.
