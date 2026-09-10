# Padrões de Código

## Python (`backend/`)

- **Black** — formatação, `line-length = 88`, `target-version = "py311"` (`pyproject.toml`).
- **Ruff** — lint, mesma `line-length` e `target-version` do Black.
- **isort** — ordenação de imports, `profile = "black"` (compatível com a formatação do Black, evita os dois brigarem).
- Exceções a regras de lint são anotadas inline com o motivo, nunca silenciadas sem explicação — ex: `# noqa: BLE001` em `traduzir_texto` (`backend/app.py`), com comentário explicando por que um `except Exception` genérico é a escolha certa ali (biblioteca de terceiros que não documenta quais exceções lança).

Rodar antes de abrir PR:

```bash
ruff check .
black --check .
isort --check-only .
```

## JavaScript / TypeScript (`frontend/` e `frontend-react/`)

- **ESLint** — configuração própria em cada projeto (`eslint.config.js` na raiz para `frontend/`, `frontend-react/eslint.config.js` para o React). Ambos fixam `semi: ["error", "always"]` e `quotes: ["error", "double"]` deliberadamente iguais, para reduzir atrito de quem alterna entre os dois códigos durante a migração.
- **Prettier** — `.prettierrc` na raiz: `printWidth: 100`, `semi: true`, `singleQuote: false` (aspas duplas, consistente com o ESLint), `tabWidth: 2`, `trailingComma: "none"`.
- **TypeScript** (só `frontend-react/`) — `strict` via `typescript-eslint` recomendado + `tsc -b` no CI antes do build; nenhum `any` implícito deve passar sem justificativa.
- `frontend-react/` usa `eslint-plugin-react-hooks` (regras de hooks) e `eslint-plugin-react-refresh` (garante que arquivos de componente só exportem componentes, necessário para Fast Refresh funcionar).

Rodar antes de abrir PR:

```bash
# frontend/ (raiz)
npm run lint

# frontend-react/
cd frontend-react
npm run lint
npx tsc -b
```

## Nomenclatura

Funções, variáveis e mensagens de erro voltadas ao domínio do produto (formulário de currículo, validação, autenticação) são nomeadas **em português** — ex: `validar_dados_cv`, `traduzir_payload`, `normalizar_url_perfil` no backend; `salvarCurriculo`, `buscarCurriculoPorId`, `carregarPorId` no frontend. Termos técnicos de infraestrutura (nomes de bibliotecas, padrões de projeto, convenções de commit) seguem o inglês padrão da comunidade. Essa mistura é intencional e consistente nos dois frontends — não é inconsistência a ser corrigida.

## Comentários

O padrão do projeto é comentar o **porquê**, não o **o quê** — o código já diz o que faz; o comentário existe para registrar a decisão que não seria óbvia lendo só o código (trade-off de segurança, bug real que motivou uma escolha, limitação de uma biblioteca de terceiros). Exemplos reais no próprio código: os comentários sobre CSP e vendorização local de libs em `backend/app.py`, ou sobre por que `pikepdf` precisa pós-processar o PDF em `backend/pdf_gerador.py`. Evitar comentários que só parafraseiam a linha de código abaixo.

## Testes

- **Backend**: `pytest`, arquivos em `backend/tests/test_*.py`, um teste por comportamento (não por função) — ex: `test_validar_dados_cv_linkedin_dominio_errado`, `test_validar_dados_cv_experience_excede_limite`. Fixtures e parametrização (`@pytest.mark.parametrize`) usadas para variações do mesmo caso (ex: diferentes formatos de e-mail inválido).
- **Frontend (`frontend/`)**: Vitest + jsdom, testando a lógica extraída para `utils.js` — funções puras, sem depender de DOM real quando possível.
- **Frontend-react**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/user-event`). Convenção: arquivo de teste ao lado do arquivo testado (`Componente.tsx` + `Componente.test.tsx`), não em pasta separada.
- Testes de regressão específicos existem para comportamento não-óbvio, ex: a estrutura semântica do PDF/UA gerado (árvore de estrutura, idioma, texto alternativo dos links) — não é só "o PDF foi gerado", é "o PDF tem a estrutura de acessibilidade correta".

## Commits

Conventional Commits, com escopo entre parênteses indicando a área afetada — padrão observado no histórico real do projeto:

```
feat(frontend-react): Fase 4 da migração — painel de currículos e persistência real
fix(frontend-react): corrige regressões de acessibilidade (h1, skip link, CSS de seção)
build(deps): bump flask from 3.0.2 to 3.1.3 in /backend
chore(deps): corrige vulnerabilidades do npm audit em dependências de dev
```

Prefixos usados: `feat`, `fix`, `build`, `chore`, `docs`, `refactor`, `test`, `ci`. Mensagens de commit descrevem o que mudou e, quando relevante, por quê — não só "update file".

## CI

Todo push/PR roda `.github/workflows/code-quality.yml` (ruff, black, isort, eslint dos dois frontends, typecheck e build do `frontend-react`) e `.github/workflows/tests.yml` (pytest, Vitest da raiz, Vitest do `frontend-react`). PR não deveria ser aberto com qualquer um desses vermelho.
