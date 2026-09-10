# Segurança

Este documento descreve o que está de fato implementado hoje, e não uma lista de boas intenções — inclui também os pontos que ainda dependem de configuração fora do repositório ou que são riscos residuais conscientes.

## Transporte e cabeçalhos HTTP

Aplicados a toda resposta do Flask (`backend/app.py`, `adicionar_cabecalhos_seguranca`):

| Cabeçalho | Valor | Por quê |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Força HTTPS em requisições futuras. Inofensivo em dev local (navegador ignora em HTTP puro). |
| `X-Frame-Options` | `DENY` | Bloqueia clickjacking (embutir o site em `<iframe>` de outro domínio). |
| `X-Content-Type-Options` | `nosniff` | Impede o navegador de reinterpretar o tipo de um arquivo diferente do `Content-Type` declarado. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Não vaza a URL completa em navegação cross-site. |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Desliga APIs de hardware que o app não usa. |
| `Content-Security-Policy` | ver abaixo | Restringe de onde script/estilo/fonte podem carregar. |

**CSP**: `default-src 'self'`, com `script-src`/`style-src` liberando `'unsafe-inline'` (necessário porque `frontend/index.html` ainda usa `onclick="..."` e `style="..."` inline — enfraquece a proteção contra XSS via script inline, mas continua bloqueando carregar recursos de domínios de terceiros não listados). Bootstrap, Font Awesome e `supabase-js` são vendorizados localmente (`frontend/vendor/`) em vez de vir de CDN — não é só uma questão de CSP: resolveu um bug real em que o login quebrava silenciosamente no app Android quando o CDN falhava ao carregar num aparelho físico. `connect-src` libera explicitamente a URL do projeto Supabase e a API do IBGE (usada para o autocomplete de cidade/estado).

**Nota importante**: esses cabeçalhos protegem só a versão web (servida via HTTP pelo Flask). O app Android/iOS carrega uma cópia empacotada do HTML localmente — a proteção equivalente ali vem do sandbox do sistema operacional, não desses cabeçalhos.

## Validação de entrada

`validar_dados_cv` (`backend/app.py`) roda antes de qualquer processamento em `/generate-cv`: tipo de cada bloco, presença de campos obrigatórios, formato de e-mail, domínio de LinkedIn/GitHub, limite de itens por lista (`experience` ≤ 30, `education` ≤ 15, `courses`/`projects` ≤ 30) e tamanho máximo do nome (200 caracteres). Coberto por 39 testes em `backend/tests/test_app.py`.

**Gap conhecido**: os limites acima cobrem quantos *itens* cada lista pode ter, mas não quantas strings (`highlights`, por exemplo) cada item individual pode conter, nem o tamanho de cada string além do limite geral de payload (`MAX_CONTENT_LENGTH = 2 MB`). Como cada string vira uma chamada de tradução via `ThreadPoolExecutor`, um payload dentro do limite de 2 MB mas com muitas strings curtas pode gerar um volume desproporcional de chamadas de saída ao serviço de tradução por requisição — possível vetor de abuso/amplificação, ainda sem limite dedicado nem teste de regressão.

## Escaping / prevenção de XSS no PDF

O template Jinja2 usa `autoescape=select_autoescape(["html"])` e **nenhum filtro `| safe`** é usado em `base_ats.html` — toda entrada do usuário é escapada antes de virar HTML. Isso é o que impede alguém de injetar `<script>` ou quebrar o layout do PDF via campos de texto do formulário (nome, resumo, highlights, etc).

## Rate limiting

`/generate-cv` é limitado a 10 requisições/minuto e 60/hora por IP (`Flask-Limiter`), porque cada chamada combina uma chamada de rede (tradução) com uso pesado de CPU (renderização do PDF via WeasyPrint) — sem isso, uma única pessoa repetindo a requisição conseguiria sobrecarregar o servidor. Em produção atrás de proxy/load balancer, `X-Forwarded-For` precisa estar configurado corretamente, senão todas as requisições contam como vindas do mesmo IP (o proxy).

## CORS

Restrito via variável de ambiente `ALLOWED_ORIGINS` (lista separada por vírgulas). **Se não configurada, o padrão é `"*"`** (liberado geral) — isso é intencional para facilitar desenvolvimento local, mas precisa ser setado explicitamente no deploy de produção. Vale conferir isso no checklist de deploy; hoje não há nada que force essa configuração (a aplicação sobe normalmente sem ela).

## Tamanho de payload e modo debug

- `MAX_CONTENT_LENGTH = 2 MB` — protege contra payloads absurdamente grandes.
- `debug=True` só liga com `FLASK_DEBUG=1` explícito, nunca por padrão — evita expor o debugger interativo do Werkzeug (execução de código arbitrário) em produção por engano.

## Erros e vazamento de informação

Exceções não tratadas em `/generate-cv` são logadas com detalhe completo só no servidor (`app.logger.exception`); o client recebe uma mensagem genérica (`"Erro interno ao gerar o PDF"`), sem stack trace, caminho de arquivo ou versão de biblioteca.

## Autenticação e autorização (Supabase)

- Autenticação delegada inteiramente ao Supabase Auth (e-mail/senha, OAuth Google, recuperação de senha). O backend Flask não gerencia sessão nem cookie de autenticação — ele nem sabe quem é o usuário, só processa o payload de geração de PDF.
- A chave usada no client (`sb_publishable_...`) é uma chave **publishable**, projetada para ser exposta no bundle JS — não é um segredo. O controle de acesso real é feito pelas **policies de Row Level Security (RLS)** do Postgres, avaliadas a cada query usando o JWT do usuário autenticado.
- As chamadas ao Supabase no client (`frontend-react/src/lib/resumeService.ts`) filtram os currículos só por `id`, sem repetir o filtro por `user_id` — a segurança desse acesso depende inteiramente das policies de RLS estarem corretas no lado do Supabase. Isso é uma prática aceitável em apps Supabase (é o modelo pretendido), desde que as policies de fato apliquem `auth.uid() = user_id`.
- **Confirmado em 2026-09-10** contra o projeto Supabase real (`vaiedrsonmktbnkcktqv`, via MCP — `pg_policies`, `information_schema.columns`, `pg_constraint`): as 4 policies (`select`/`insert`/`update`/`delete`) aplicam exatamente `auth.uid() = user_id`, sem exceção. **Não há IDOR** — o acesso por `id` sem filtro de dono no client é seguro porque o banco barra qualquer linha que não pertença ao usuário autenticado. `supabase/migrations/20260910000000_curriculos_schema_e_rls_reconstruida.sql` foi atualizado para refletir exatamente o schema e as policies reais (nomes das policies, defaults de coluna, ausência de `created_at`) — ver o cabeçalho do arquivo para o detalhe de cada divergência que existia na versão anterior (reconstruída só a partir do código cliente). Esse arquivo agora pode ser tratado como documentação confiável do que está ativo em produção.
- A FK de `curriculos.user_id` para `auth.users(id)` não tinha `ON DELETE CASCADE` no projeto real — apagar uma conta com currículos falharia por violação de FK em vez de limpar os currículos em cascata. Corrigido em produção no mesmo dia (`supabase/migrations/20260910230048_curriculos_user_id_on_delete_cascade.sql`): a FK agora tem `ON DELETE CASCADE`, então excluir um usuário no `auth.users` apaga seus currículos automaticamente.

## Segredos e credenciais

- Nenhum segredo real está commitado no repositório. `.env`/`.env.*` estão no `.gitignore`.
- A `SUPABASE_SERVICE_ROLE_KEY` (que ignora RLS, usada só no backup diário) fica em GitHub Secrets, nunca no código — ver `.github/workflows/backup_supabase.yml`.
- A URL do Supabase é hardcoded no client como fallback, mas pode ser sobrescrita por `SUPABASE_URL` no backend (usada só para liberar no CSP).

## Dependências

- Dependabot ativo para `pip` (`/backend`), `npm` (raiz) e GitHub Actions, com PR automático semanal. **`frontend-react/` ainda não está coberto pelo Dependabot** — é o projeto mais novo e mais ativo, e hoje depende de atualização manual.
- `npm audit` acusa vulnerabilidades pontuais (`@xmldom/xmldom` via `@capacitor/cli`, `nanoid`/`undici` em devDependencies) — todas em ferramental de build/CLI, não em código que roda no navegador do usuário final. Risco baixo, mas vale rodar `npm audit fix` periodicamente.

## Resumo de riscos residuais conhecidos

1. Sem limite de tamanho/quantidade em listas aninhadas (`highlights` etc.) — possível amplificação de chamadas de tradução.
2. `ALLOWED_ORIGINS` cai para `"*"` se esquecido no deploy.
3. `frontend-react/` fora do Dependabot.

Nenhum desses é uma vulnerabilidade explorada ou com exploit conhecido hoje — são pontos de atenção para quem for mexer nessas áreas, não incêndios.
