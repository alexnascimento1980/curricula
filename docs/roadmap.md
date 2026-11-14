# Roadmap

Este documento reflete o estado real do projeto, não uma lista de metas aspiracionais com datas. Para o histórico detalhado por versão, ver `CHANGELOG.md`.

## Concluído

- **Fase 5 (2026-11-13)**: Flask serve o build do React (`frontend-react/dist`, gerado num estágio Node do Dockerfile); `frontend/` legado removido; CSP com `script-src 'self'`. Validada em aparelho físico (Android), com axe-core em Chrome real (0 violações WCAG 2.1 A/AA, contraste incluído), teste `vitest-axe` no CI e leitor de tela NVDA.

- **Backend**: API de geração de currículo (`/generate-cv`), validação de entrada completa, tradução automática PT→EN, rate limiting, cabeçalhos de segurança, Docker + Gunicorn para deploy.
- **PDF acessível (v0.4.0)**: migração do pipeline de geração de LaTeX (`pdflatex`) para WeasyPrint (HTML/CSS → PDF), produzindo PDF/UA-1 de verdade — árvore de estrutura semântica, idioma e metadados corretos, texto alternativo nos links via pós-processamento com `pikepdf`.
- **CI/CD (v0.3.1)**: GitHub Actions para testes, lint/code quality, templates de issue e PR.
- **Persistência e autenticação**: múltiplos currículos por usuário, autenticação por e-mail/senha e Google OAuth, recuperação de senha — via Supabase (Auth + Postgres + RLS).
- **Backup automático**: workflow diário exportando a tabela `curriculos` (o plano gratuito do Supabase não inclui backup).
- **Dependabot**: atualização automática semanal de dependências Python (`/backend`), npm (raiz) e GitHub Actions.
- **App Android**: funcional via Capacitor — login, múltiplos currículos, geração de PDF bilíngue e recuperação de senha testados em aparelho físico.
- **Migração para React** (`frontend-react/`), fases 1 a 5: setup do projeto, autenticação completa, formulário principal, painel de currículos com persistência real e servido pelo Flask. Alimenta a web e o app Android.
- **Produção (2026-11-14)**: deploy da Fase 5 no Render validado (login, geração de PDF, resumo longo, app Android contra o servidor novo).
- **Testes E2E** (Playwright, Flask + Chrome real, job `e2e` no CI): CSP, fallback da SPA, painel de acessibilidade, axe-core e cabeçalhos de segurança.
- **Cache LRU das traduções PT→EN** (`TRADUCAO_CACHE_MAX`) e **bundle separado em chunks** com cache longo nos assets; scripts `npm run android` / `android:open` na raiz.
- **Nome do projeto**: menções ao nome antigo (CareerOS) removidas do repositório; o serviço no Render mantém o endereço `careeros-mcau.onrender.com` por compatibilidade com o app Android já instalado.

## Em andamento

- **Dependências de desenvolvimento**: 7 avisos moderados do `npm audit` (`minimatch` dentro do `typescript-eslint`, só ferramenta de lint) — aguardando versão corrigida do `typescript-eslint`; produção está com 0.
- **Tradução PT→EN**: o cache em memória reduz chamadas repetidas, mas o `deep-translator` segue sendo scraping do Google Translate (sem SLA) — avaliar API oficial (Google Cloud Translation ou DeepL) se o volume crescer.

## Considerações em aberto (não comprometidas com prazo)

Levantadas durante revisão do estado do projeto, ainda sem decisão tomada:

- Suporte a iOS (requer Mac + Xcode) — mencionado no `README.md`, sem trabalho iniciado.
- Rotas de API cogitadas mas não implementadas: `/resume` (perfil salvo reutilizável), `/cover-letter`, `/match` (aderência a vaga), `/translate` como endpoint isolado.

## Concluído nesta rodada de melhorias

- Limite de tamanho/quantidade em listas aninhadas do payload de `/generate-cv` (`highlights_pt`, `summary.pt`, etc.) — fechava um vetor de amplificação de chamadas ao serviço de tradução.
- `frontend-react/` adicionado ao Dependabot.
- **RLS de `curriculos` versionada e conferida contra o projeto Supabase real** (2026-09-10, via MCP) — `supabase/migrations/20260910000000_curriculos_schema_e_rls_reconstruida.sql` agora reflete exatamente o schema e as policies em produção; não havia IDOR. Ver `docs/security.md` e `supabase/README.md`.
- **FK de `curriculos.user_id` corrigida para `ON DELETE CASCADE`** — a divergência encontrada na conferência acima (item anterior) foi aplicada em produção no mesmo dia via `supabase/migrations/20260910230048_curriculos_user_id_on_delete_cascade.sql`.

## Como este documento é mantido

Atualizar a seção "Concluído" a cada release relevante (ver `CHANGELOG.md` para o formato), e mover itens de "Em andamento"/"Considerações em aberto" conforme decisões forem tomadas — não deixar itens aqui sem dono indefinidamente.
