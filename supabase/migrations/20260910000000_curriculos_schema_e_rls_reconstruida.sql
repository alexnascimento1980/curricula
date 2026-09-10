-- ============================================================================
-- RECONSTRUÍDA A PARTIR DO CÓDIGO CLIENTE — NÃO EXTRAÍDA DO PROJETO SUPABASE
-- REAL. NÃO TRATAR COMO FONTE DA VERDADE ATÉ VALIDAR (ver supabase/README.md).
--
-- Este arquivo existe porque as policies de RLS que hoje protegem os dados
-- de currículo só existem no dashboard do Supabase (ver docs/security.md,
-- seção "Autenticação e autorização") — não havia nenhuma versão delas
-- revisável por code review. O schema e as policies abaixo foram inferidos
-- a partir de como o client usa a tabela `curriculos`
-- (frontend-react/src/lib/resumeService.ts e frontend/script.js),
-- NÃO copiados do banco real.
--
-- Como substituir isto pelo estado real (fazer assim que possível):
--   1. supabase login
--   2. supabase link --project-ref <ref-do-projeto>
--   3. supabase db pull
--      → gera uma migration nova com o schema/policies REAIS, que deve
--        substituir (ou ser reconciliada com) este arquivo.
-- ============================================================================

create table if not exists public.curriculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_name text,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.curriculos is
  'Currículos salvos por usuário — um usuário pode ter vários (painel de '
  'currículos, ver frontend-react/src/hooks/useResumeManager.ts). Colunas '
  'inferidas do que o client lê/escreve em resumeService.ts; created_at é '
  'um palpite razoável (convenção comum do Supabase), não confirmado no '
  'código cliente — pode não existir de verdade, ou ter outro nome.';

alter table public.curriculos enable row level security;

-- O client filtra listagem (listarCurriculos) por user_id, mas busca,
-- atualiza e exclui um currículo específico só por `id`
-- (buscarCurriculoPorId / salvarCurriculo / renomearCurriculo /
-- excluirCurriculoPorId), sem repetir o filtro de dono. Isto é: as policies
-- abaixo são a ÚNICA barreira real contra um usuário ler, editar ou excluir
-- o currículo de outro. Se as policies REAIS (as do dashboard) não forem
-- equivalentes a estas, há um IDOR de leitura/escrita/exclusão — ver
-- docs/security.md, seção "Resumo de riscos residuais conhecidos".

create policy "curriculos_select_proprio_usuario"
  on public.curriculos
  for select
  using (auth.uid() = user_id);

create policy "curriculos_insert_proprio_usuario"
  on public.curriculos
  for insert
  with check (auth.uid() = user_id);

create policy "curriculos_update_proprio_usuario"
  on public.curriculos
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "curriculos_delete_proprio_usuario"
  on public.curriculos
  for delete
  using (auth.uid() = user_id);

-- O workflow de backup diário (.github/workflows/backup_supabase.yml) usa a
-- SUPABASE_SERVICE_ROLE_KEY, que ignora RLS por padrão no Supabase — não
-- precisa de policy própria para funcionar, e continua funcionando mesmo
-- que as policies acima mudem.
