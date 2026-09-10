-- ============================================================================
-- CONFERIDA CONTRA O PROJETO SUPABASE REAL (vaiedrsonmktbnkcktqv) em
-- 2026-09-10, via MCP do Supabase (pg_policies, information_schema.columns,
-- pg_constraint) — não é mais só uma inferência a partir do código cliente.
-- Ver docs/security.md ("Autenticação e autorização") e
-- docs/architecture.md ("Persistência e autenticação") para o contexto, e
-- supabase/README.md para como essa conferência foi feita.
--
-- Divergências encontradas em relação à versão anterior deste arquivo
-- (que era só reconstruída a partir de resumeService.ts/script.js) e
-- corrigidas abaixo:
--   - a coluna `created_at` NÃO existe na tabela real — era um palpite
--     ("convenção comum do Supabase") que não se confirmou; removida;
--   - `resume_name` tem default 'Novo Currículo' no banco real;
--   - `updated_at` usa default `timezone('utc'::text, now())`, não `now()`;
--   - a FK de `user_id` para `auth.users(id)` NÃO tem `ON DELETE CASCADE`
--     no banco real — não há ação definida (NO ACTION), ou seja, apagar um
--     usuário que ainda tem currículos falha por violação de FK em vez de
--     apagar os currículos em cascata;
--   - os nomes das policies no dashboard são descritivos em português
--     ("Usuários podem ver seu próprio currículo" etc.), não os nomes em
--     snake_case da versão anterior deste arquivo;
--   - a policy de UPDATE no banco real só define `using`, sem `with check`
--     explícito. O Postgres reaplica a cláusula USING como WITH CHECK
--     quando ela é omitida (documentado em CREATE POLICY), então o efeito
--     prático de barrar `auth.uid() != user_id` na escrita é o mesmo.
--
-- A lógica de autorização em si (auth.uid() = user_id em SELECT/INSERT/
-- UPDATE/DELETE) já estava correta na versão anterior deste arquivo — ou
-- seja, o IDOR que este arquivo existia para descartar foi descartado:
-- não há divergência de acesso entre o que o client assume e o que o
-- banco real aplica.
--
-- ATUALIZAÇÃO (mesmo dia, migration seguinte): o gap de ON DELETE CASCADE
-- citado acima foi corrigido por
-- 20260910230048_curriculos_user_id_on_delete_cascade.sql. A definição de
-- `user_id` abaixo continua sem `on delete cascade` de propósito — reflete
-- o estado exato no momento em que este arquivo foi escrito, e a migration
-- seguinte é quem aplica a mudança, na ordem em que ela de fato aconteceu.
-- ============================================================================

create table if not exists public.curriculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  resume_name text default 'Novo Currículo'
);

comment on table public.curriculos is
  'Currículos salvos por usuário — um usuário pode ter vários (painel de '
  'currículos, ver frontend-react/src/hooks/useResumeManager.ts). Não tem '
  'coluna created_at.';

alter table public.curriculos enable row level security;

-- O client filtra listagem (listarCurriculos) por user_id, mas busca,
-- atualiza e exclui um currículo específico só por `id`
-- (buscarCurriculoPorId / salvarCurriculo / renomearCurriculo /
-- excluirCurriculoPorId), sem repetir o filtro de dono. As policies abaixo
-- são a ÚNICA barreira real contra um usuário ler, editar ou excluir o
-- currículo de outro — conferidas contra o projeto real, batem com o que o
-- client assume.

create policy "Usuários podem ver seu próprio currículo"
  on public.curriculos
  for select
  using (auth.uid() = user_id);

create policy "Usuários podem criar seu próprio currículo"
  on public.curriculos
  for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seu próprio currículo"
  on public.curriculos
  for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar seu próprio currículo"
  on public.curriculos
  for delete
  using (auth.uid() = user_id);

-- O workflow de backup diário (.github/workflows/backup_supabase.yml) usa a
-- SUPABASE_SERVICE_ROLE_KEY, que ignora RLS por padrão no Supabase — não
-- precisa de policy própria para funcionar, e continua funcionando mesmo
-- que as policies acima mudem.
