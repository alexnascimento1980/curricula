# supabase/

Versão revisável em code review do schema e das policies de Row Level Security (RLS) que hoje protegem a tabela `curriculos` — a única barreira real de acesso aos dados dos usuários (ver `docs/security.md`, seção "Autenticação e autorização (Supabase)").

## Por que isso existe

O client (`frontend-react/src/lib/resumeService.ts`, e o equivalente em `frontend/script.js`) filtra listagem de currículos por `user_id`, mas busca, atualiza e exclui um currículo específico só por `id` — sem repetir o filtro de dono. Isso é seguro *se e somente se* as policies de RLS no Postgres garantirem que `auth.uid() = user_id`. Até agora, essas policies só existiam no dashboard do Supabase: nenhuma mudança nelas passava por revisão de código, e não havia como reconstituir a configuração do zero a partir do git se algo desse errado.

## Estado atual — conferido contra o projeto real

O arquivo em `migrations/` foi originalmente reconstruído só a partir de como o client usa a tabela (`resumeService.ts`), sem nunca ter sido comparado ao projeto Supabase de verdade. Em 2026-09-10 essa comparação foi feita — via MCP do Supabase (consultas a `pg_policies`, `information_schema.columns` e `pg_constraint` no projeto `vaiedrsonmktbnkcktqv`) — e o arquivo foi corrigido para bater com a realidade. Divergências encontradas (todas sem impacto de segurança — a lógica de RLS já estava certa):

- a coluna `created_at` não existe de verdade na tabela;
- `resume_name` tem default `'Novo Currículo'` no banco;
- `updated_at` usa default `timezone('utc'::text, now())`, não `now()`;
- a FK de `user_id` para `auth.users(id)` não tinha `ON DELETE CASCADE` (corrigido no mesmo dia — ver abaixo);
- os nomes das policies no dashboard são frases descritivas em português, não os identificadores em snake_case usados na primeira versão deste arquivo;
- a policy de `update` só define `using`, sem `with check` explícito (efeito prático idêntico, já que o Postgres reaplica `using` como `with check` quando ele é omitido).

A ausência de `ON DELETE CASCADE` foi corrigida em produção no mesmo dia, via `migrations/20260910230048_curriculos_user_id_on_delete_cascade.sql` — não havia (nem há) feature de "excluir minha conta" implementada, então era um gap dormente; foi fechado antes que alguém precisasse descobrir isso na hora de construir essa feature.

Ver o cabeçalho de `migrations/20260910000000_curriculos_schema_e_rls_reconstruida.sql` para o detalhe completo, e `docs/security.md`/`docs/architecture.md` para como isso afeta a avaliação de risco do projeto.

Esse arquivo pode agora ser tratado como fonte da verdade do schema e das policies de `curriculos`. Se quiser confirmar de forma independente (ou detectar uma mudança futura feita só pelo dashboard, sem passar por aqui), use a Supabase CLI:

1. Instale a [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`, ou via scoop/brew).
2. `supabase login`
3. `supabase link --project-ref vaiedrsonmktbnkcktqv`
4. `supabase db pull` — gera uma migration nova com o schema e as policies reais nesse momento; compare com o arquivo existente aqui e reconcilie qualquer diferença nova (a versão real sempre prevalece).

## Depois de sincronizado

Toda mudança de policy feita pelo dashboard deveria também virar uma migration aqui (`supabase db diff -f nome_da_mudanca`), e revisões de RLS passam a acontecer em PR como qualquer outra mudança de código — é esse o ganho de trazer isso para o repositório.
