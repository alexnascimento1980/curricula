# Arquitetura

## Visão Geral

Currícula é uma aplicação full-stack que gera currículos em PDF acessíveis (PDF/UA) a partir de um formulário web, com autenticação, múltiplos currículos por usuário e tradução automática PT→EN.

```
                    ┌───────────────────────┐
                    │   Supabase (Postgres)  │
                    │  Auth · RLS · storage   │
                    └───────────┬────────────┘
                                │
                 ┌──────────────┼──────────────┐
                 │              │              │
        ┌────────▼───────┐ ┌────▼──────┐ ┌─────▼──────┐
        │ frontend/       │ │frontend-  │ │  (futuro)  │
        │ (Vanilla JS)    │ │react/     │ │   iOS      │
        │ servido pelo    │ │(React+TS) │ │            │
        │ Flask — web     │ │→ www/ →   │ │            │
        │                 │ │ Capacitor │ │            │
        │                 │ │ → Android │ │            │
        └────────┬────────┘ └───────────┘ └────────────┘
                 │ POST /generate-cv
        ┌────────▼────────┐
        │  Flask (app.py)  │
        │  valida + traduz │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Jinja2 (autoescape) │
        │ → HTML renderizado  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ WeasyPrint       │
        │ → PDF/UA-1       │
        │ + pikepdf (Alt   │
        │   text dos links)│
        └─────────────────┘
```

## Componentes

### Backend (`backend/`)

Flask servido via Gunicorn em produção (ver `Dockerfile`). Responsabilidades:

- `app.py` — rotas HTTP, cabeçalhos de segurança, validação de entrada (`validar_dados_cv`), orquestração da tradução e chamada ao gerador de PDF. É a única parte do sistema que fala com a internet além dos clients (Supabase à parte).
- `pdf_gerador.py` — recebe o HTML já renderizado pelo Jinja2 e devolve os bytes do PDF, usando WeasyPrint para o render e pikepdf para pós-processar a árvore de estrutura do PDF (preenche `/Alt` nos links, já que o WeasyPrint ainda não propaga `data-alt`/`aria-label` nativamente).
- `texto_utils.py` — utilitários de limpeza de texto (remoção de emojis) aplicados via filtro Jinja2.
- `templates/base_ats.html` — único template HTML, fonte de todo PDF gerado. Não versiona por idioma: o mesmo template recebe `dados` (com campos `_pt`/`_en`) e a variável `lang`.
- `gerador.py` — script de linha de comando para gerar um PDF de exemplo direto do terminal (usa `sample-data/dados.json`), sem subir o Flask. Não faz parte do runtime de produção, só de desenvolvimento local — por isso fica de fora da cobertura de testes.

O backend **não tem banco de dados próprio**. Toda persistência de currículos e autenticação de usuário vive no Supabase; o Flask só processa a requisição de geração de PDF (que recebe os dados diretamente do client, não os lê do banco).

### Frontends — dois, hoje, por causa de uma migração em andamento

Esse é o ponto mais importante para quem for mexer no projeto agora:

- **`frontend/`** (HTML/CSS/JS puro + Bootstrap) é o que o Flask efetivamente serve como site (`app.py` aponta `FRONTEND_DIR` para essa pasta, e é o que o `Dockerfile` empacota). **É a versão em produção na web hoje.**
- **`frontend-react/`** (React 19 + TypeScript + Vite) é a reescrita em andamento, com testes (Vitest + Testing Library), autenticação, formulário e painel de currículos já migrados. **Ainda não está ligada ao backend Flask** — hoje ela só alimenta o build do app Android (`npm run build:android` gera `www/`, que o Capacitor empacota).

Na prática: a versão web e a versão Android rodam bases de código diferentes até que alguém decida trocar o que o Flask serve, ou aposentar `frontend/`. Enquanto isso não acontecer, uma correção feita só em um dos dois (como já aconteceu com os ajustes de acessibilidade do commit `6d66d80`, que só chegou ao Android) não se propaga para o outro automaticamente — isso precisa ser lembrado manualmente em cada mudança de UI.

`www/` é build artefato (gerado, não escrito à mão) e está versionado no git — não editar diretamente; qualquer mudança deve entrar via `frontend-react/src` e depois `npm run build:android`.

### Persistência e autenticação (Supabase)

- Autenticação por e-mail/senha, OAuth Google e recuperação de senha via Supabase Auth (cliente configurado em `frontend-react/src/lib/supabaseClient.ts` e, na versão legada, no topo de `frontend/script.js`).
- Currículos ficam na tabela `curriculos`, isolados por usuário via Row Level Security (RLS) do Postgres — o client usa a chave `publishable` do Supabase (segura para expor no bundle por design) e o controle de acesso real acontece nas policies de RLS, avaliadas a cada query com o JWT do usuário. Existe um scaffold dessas policies em `supabase/migrations/`, mas **reconstruído a partir do código cliente, não extraído do projeto real** — ainda precisa ser sincronizado com o Supabase de verdade (`supabase db pull`) antes de valer como documentação confiável. Ver `supabase/README.md` e `docs/security.md` para o risco associado.
- Backup diário automatizado via GitHub Actions (`.github/workflows/backup_supabase.yml`), usando a service role key (armazenada como GitHub Secret) para contornar RLS e exportar a tabela inteira.

### Mobile (Android via Capacitor)

`android/` é o projeto nativo gerado pelo Capacitor. `capacitor.config.json` aponta `webDir: "www"` — o conteúdo web empacotado no APK é o build do `frontend-react`. `npx cap sync android` copia `www/` para o projeto Android; não há build automático embutido nesse passo, o `npm run build:android` precisa rodar antes.

Não há suporte a iOS hoje (requer Mac + Xcode).

## Fluxo de uma geração de PDF

1. Client monta o payload (dados do formulário) e faz `POST /generate-cv`.
2. `validar_dados_cv` valida estrutura, tipos, tamanhos e formato de campos (e-mail, LinkedIn, GitHub). Payload inválido → `400` com mensagem específica.
3. Se `lang == "en"`, `traduzir_payload` dispara todas as traduções em paralelo (até 20 threads) via `deep-translator`/Google Translate. Falha de tradução → `502`, nunca um PDF parcialmente traduzido.
4. O payload validado (e traduzido, se aplicável) é renderizado pelo template Jinja2 (`autoescape` ligado — nenhuma entrada do usuário vira HTML cru).
5. `pdf_gerador.gerar_pdf` gera o PDF via WeasyPrint (`pdf_variant="pdf/ua-1"`) e pós-processa com pikepdf.
6. PDF devolvido como anexo (`send_file`), nomeado com o nome do candidato.

Rate limit: 10 requisições/minuto, 60/hora, por IP (`Flask-Limiter`), porque cada chamada combina tráfego de rede (tradução) com uso pesado de CPU (renderização).

## Princípios adotados

- **Validação no servidor, não só no client** — o backend nunca confia em validação feita no navegador.
- **Escaping por padrão** — nenhum `| safe` no Jinja2; entrada do usuário nunca vira HTML/CSS interpretado.
- **Falha explícita em vez de degradação silenciosa** — tradução que falha aborta a geração do PDF em vez de devolver conteúdo parcial sem avisar.
- **RLS como fronteira de autorização** — o client nunca decide sozinho quem pode ler/editar um currículo; isso é responsabilidade do banco.

Esses princípios estão implementados de forma consistente no backend; a divergência entre os dois frontends é a principal exceção arquitetural em aberto hoje (ver seção acima).
