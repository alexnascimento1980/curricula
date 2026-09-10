# Roadmap

Este documento reflete o estado real do projeto, não uma lista de metas aspiracionais com datas. Para o histórico detalhado por versão, ver `CHANGELOG.md`.

## Concluído

- **Backend**: API de geração de currículo (`/generate-cv`), validação de entrada completa, tradução automática PT→EN, rate limiting, cabeçalhos de segurança, Docker + Gunicorn para deploy.
- **PDF acessível (v0.4.0)**: migração do pipeline de geração de LaTeX (`pdflatex`) para WeasyPrint (HTML/CSS → PDF), produzindo PDF/UA-1 de verdade — árvore de estrutura semântica, idioma e metadados corretos, texto alternativo nos links via pós-processamento com `pikepdf`.
- **CI/CD (v0.3.1)**: GitHub Actions para testes, lint/code quality, templates de issue e PR.
- **Persistência e autenticação**: múltiplos currículos por usuário, autenticação por e-mail/senha e Google OAuth, recuperação de senha — via Supabase (Auth + Postgres + RLS).
- **Backup automático**: workflow diário exportando a tabela `curriculos` (o plano gratuito do Supabase não inclui backup).
- **Dependabot**: atualização automática semanal de dependências Python (`/backend`), npm (raiz) e GitHub Actions.
- **App Android**: funcional via Capacitor — login, múltiplos currículos, geração de PDF bilíngue e recuperação de senha testados em aparelho físico.
- **Migração para React** (`frontend-react/`), fases 1 a 4: setup do projeto, autenticação completa, formulário principal completo, painel de currículos com persistência real. Alimenta hoje o build do app Android.

## Em andamento

- **Migração frontend/ → frontend-react/**: a versão React ainda não está ligada ao Flask (que continua servindo `frontend/` na web). Ver `docs/architecture.md` e `docs/frontend.md` para o estado exato dessa divergência.
- **Paridade de acessibilidade** entre os dois frontends — o commit mais recente corrigiu regressões (h1, skip link, CSS de seção) só do lado React; falta confirmar que `frontend/` não tem os mesmos problemas ou já foi corrigido antes.
- **Versionamento das policies de RLS do Supabase**: scaffold criado em `supabase/migrations/`, reconstruído a partir do código cliente — falta a sincronização com o projeto Supabase real (`supabase db pull`) para confirmar que reflete o que está de fato ativo. Ver `supabase/README.md`.

## Considerações em aberto (não comprometidas com prazo)

Levantadas durante revisão do estado do projeto, ainda sem decisão tomada:

- Decidir como e quando o Flask passa a servir o build do `frontend-react` em vez de `frontend/` (ou formalizar uma estratégia de transição), e o que fazer com `frontend/` depois disso.
- Suporte a iOS (requer Mac + Xcode) — mencionado no `README.md`, sem trabalho iniciado.
- Rotas de API cogitadas mas não implementadas: `/resume` (perfil salvo reutilizável), `/cover-letter`, `/match` (aderência a vaga), `/translate` como endpoint isolado.

## Concluído nesta rodada de melhorias

- Limite de tamanho/quantidade em listas aninhadas do payload de `/generate-cv` (`highlights_pt`, `summary.pt`, etc.) — fechava um vetor de amplificação de chamadas ao serviço de tradução.
- `frontend-react/` adicionado ao Dependabot.
- Scaffold de RLS versionado (ver item acima, ainda pendente de sincronização).

## Como este documento é mantido

Atualizar a seção "Concluído" a cada release relevante (ver `CHANGELOG.md` para o formato), e mover itens de "Em andamento"/"Considerações em aberto" conforme decisões forem tomadas — não deixar itens aqui sem dono indefinidamente.
