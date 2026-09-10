# supabase/

Versão revisável em code review do schema e das policies de Row Level Security (RLS) que hoje protegem a tabela `curriculos` — a única barreira real de acesso aos dados dos usuários (ver `docs/security.md`, seção "Autenticação e autorização (Supabase)").

## Por que isso existe

O client (`frontend-react/src/lib/resumeService.ts`, e o equivalente em `frontend/script.js`) filtra listagem de currículos por `user_id`, mas busca, atualiza e exclui um currículo específico só por `id` — sem repetir o filtro de dono. Isso é seguro *se e somente se* as policies de RLS no Postgres garantirem que `auth.uid() = user_id`. Até agora, essas policies só existiam no dashboard do Supabase: nenhuma mudança nelas passava por revisão de código, e não havia como reconstituir a configuração do zero a partir do git se algo desse errado.

## Estado atual — leia antes de confiar neste arquivo

O arquivo em `migrations/` **não foi extraído do projeto Supabase real**. Foi reconstruído lendo como o client usa a tabela (colunas referenciadas em `resumeService.ts`: `id`, `user_id`, `resume_name`, `dados`, `updated_at`) e assumindo a policy que o comentário de `supabaseClient.ts` diz que deveria existir ("o controle de acesso real fica nas políticas de RLS"). É um ponto de partida plausível para comparação, **não uma cópia fiel do que está rodando em produção agora**.

Antes de tratar este diretório como fonte da verdade:

1. Instale a [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`, ou via scoop/brew).
2. `supabase login`
3. `supabase link --project-ref <ref-do-projeto>` — o ref está no subdomínio da `SUPABASE_URL` usada em `backend/app.py`/`frontend-react/src/lib/supabaseClient.ts` (`https://<ref>.supabase.co`).
4. `supabase db pull` — gera uma migration nova com o schema e as policies **reais**. Compare com `migrations/20260910000000_curriculos_schema_e_rls_reconstruida.sql` e reconcilie qualquer diferença (a versão real prevalece).
5. Depois dessa primeira sincronização, delete ou marque como superada a migration reconstruída, para não haver dois arquivos concorrendo como "a verdade".

## Depois de sincronizado

Toda mudança de policy feita pelo dashboard deveria também virar uma migration aqui (`supabase db diff -f nome_da_mudanca`), e revisões de RLS passam a acontecer em PR como qualquer outra mudança de código — é esse o ganho de trazer isso para o repositório.
