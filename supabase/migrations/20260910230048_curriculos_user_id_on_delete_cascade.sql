-- ============================================================================
-- Aplicada no projeto Supabase real (vaiedrsonmktbnkcktqv) em 2026-09-10 via
-- mcp__claude_ai_Supabase__apply_migration, registrada no histórico de
-- migrations do próprio projeto sob esta mesma versão (20260910230048).
--
-- Contexto: a conferência de RLS/schema feita mais cedo neste mesmo dia
-- (ver 20260910000000_curriculos_schema_e_rls_reconstruida.sql) encontrou
-- que a FK de `user_id` para `auth.users(id)` não tinha `ON DELETE CASCADE`
-- no banco real — excluir uma conta com currículos falharia por violação de
-- FK em vez de limpar os currículos. Não havia (e não há) feature de
-- "excluir minha conta" implementada; esta migration só resolve o gap antes
-- que essa feature seja construída, para que ela não precise se preocupar
-- em apagar `curriculos` manualmente antes de chamar `auth.admin.deleteUser`.
--
-- Decisão de produto (não só técnica): excluir a conta agora apaga os
-- currículos do usuário automaticamente. Ver docs/security.md.
-- ============================================================================

alter table public.curriculos
  drop constraint curriculos_user_id_fkey,
  add constraint curriculos_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
