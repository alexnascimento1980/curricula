# Currícula — Gerador de Currículo ATS Bilíngue

![CI](https://img.shields.io/github/actions/workflow/status/alexnascimento1980/curricula/tests.yml?branch=main&label=tests)
![Code Quality](https://img.shields.io/github/actions/workflow/status/alexnascimento1980/curricula/code-quality.yml?branch=main&label=code%20quality)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

O **Currícula** é uma aplicação web full-stack para gerar currículos profissionais otimizados para sistemas ATS (Applicant Tracking Systems). O candidato preenche um formulário dinâmico, o backend valida e processa os dados, e um PDF é compilado com o motor de tipografia LaTeX — com suporte a múltiplos currículos salvos por usuário e tradução automática para inglês.

## 🚀 Funcionalidades

- **Múltiplos currículos por usuário:** crie, liste, alterne, renomeie e exclua diferentes versões do currículo (ex: uma para vagas de gestão, outra para tecnologia), todas salvas na nuvem.
- **Autenticação completa:** cadastro e login por e-mail/senha, login com Google (OAuth), e recuperação de senha por e-mail — tudo via Supabase Auth.
- **Interface dinâmica:** formulário em Vanilla JS + Bootstrap, com blocos repetíveis (Experiências, Formações, Cursos, Projetos) adicionados/removidos sob demanda.
- **Seções opcionais ("Incluir no PDF?"):** cada seção (Experiência, Formação, Cursos, Projetos) pode ser individualmente incluída ou ocultada do documento final, sem exigir preenchimento de seções que o candidato não quer usar.
- **Tradução automática (PT → EN):** com um clique, todo o conteúdo do currículo é traduzido para inglês. Se o serviço de tradução falhar, o sistema recusa gerar o PDF em vez de entregar um documento parcialmente traduzido.
- **Motor LaTeX:** renderização de alta precisão tipográfica via Jinja2 injetando dados no template `.tex`, com escaping automático de caracteres especiais (`&`, `%`, `#`, `_`, etc.) para evitar quebra de compilação.
- **Backup automático diário:** workflow do GitHub Actions que exporta os dados dos currículos todo dia, já que o plano gratuito do Supabase não inclui backups.
- **Pronto para produção:** Docker + Gunicorn, rate limiting, CORS restrito, e modo debug desligado por padrão.
- **Acessibilidade (WCAG):** navegação completa por teclado, compatibilidade com leitores de tela (labels associados, `aria-live`, modais anunciados corretamente), barra de opções de fonte/contraste/redução de movimento, e PDF gerado com metadados e marcadores de navegação (bookmarks) por seção. Veja a seção "Acessibilidade" abaixo.

## 🔒 Segurança

Pontos que receberam atenção específica durante o desenvolvimento:

- **Row Level Security (RLS)** no Postgres/Supabase: cada usuário só acessa seus próprios currículos, reforçado por políticas de `SELECT`/`INSERT`/`UPDATE`/`DELETE`.
- **Validação rigorosa no backend:** tipos, tamanhos, limites de itens e formato de campos (e-mail, LinkedIn, GitHub) são checados no servidor, não só no navegador.
- **Escaping de LaTeX:** entradas do usuário nunca são injetadas cruas no template, prevenindo tanto falhas de compilação quanto injeção de comandos LaTeX.
- **Rate limiting** no endpoint de geração de PDF (10/min, 60/hora), já que cada requisição dispara compilação LaTeX (uso pesado de CPU).
- **Mensagens de erro genéricas** para o cliente — detalhes internos (stack traces, caminhos de arquivo) ficam só no log do servidor.

Encontrou uma vulnerabilidade? Veja a política de segurança do repositório para saber como reportar.

## ♿ Acessibilidade

O formulário e o PDF gerado foram revisados com foco em WCAG e uso real com leitor de tela (testado manualmente com NVDA):

**Formulário web**

- Todos os campos (estáticos e os gerados dinamicamente em Experiência/Formação/Cursos/Projetos) têm `<label>` associado via `for`/`id`.
- Skip link ("Pular para o conteúdo principal"), hierarquia de headings correta (`<h1>` único, seções como `<h2>`), e foco visível reforçado em todos os elementos interativos.
- Notificações, indicador de "Salvando..." e mensagens de erro usam `aria-live`, sendo anunciados automaticamente por leitores de tela.
- Modais e o painel lateral de currículos têm `aria-labelledby`, anunciando o título correto ao abrir — e o item de currículo salvo é um `<button>` real, operável por teclado.
- **Barra de opções de acessibilidade** (botão flutuante ♿): tamanho de fonte em 3 níveis, alto contraste e redução de movimento (`prefers-reduced-motion` respeitado nativamente), com preferências salvas em `localStorage` (`frontend/accessibility.js`).

**PDF gerado**

- Metadados embutidos (título com o nome do candidato, autor, idioma `pdflang`), para leitores de tela e visualizadores de PDF identificarem o documento corretamente.
- Marcadores de navegação (bookmarks) por seção via `\pdfbookmark`, permitindo pular direto entre Resumo/Experiência/Formação/etc. sem alterar o layout visual.
- **Limitação conhecida:** o PDF ainda não é totalmente "tagged" (PDF/UA completo) — o texto é lido em ordem correta e a navegação por bookmarks funciona, mas uma auditoria formal (Acrobat Accessibility Checker) ainda reprovaria pela falta da árvore de estrutura semântica completa. Resolver isso exigiria trocar o motor de geração (LuaLaTeX + `tagpdf`, ou HTML→PDF via Prince/WeasyPrint).

## 🧪 Testes Automatizados

O backend tem uma suíte com **44 testes** (`pytest`), cobrindo validação de dados, escaping de LaTeX, normalização de URLs, e o endpoint de geração de PDF de ponta a ponta (incluindo compilação real com `pdflatex`).

O frontend tem uma suíte com **21 testes** (`Vitest` + `jsdom`), cobrindo a lógica extraída para `frontend/utils.js`: normalização de URLs, formatação de datas, conversão de arquivo para base64, o toggle "Incluir no PDF?" (sem nunca marcar caixas de seleção como obrigatórias) e o debounce do autosave (incluindo o cenário de trocar de currículo rapidamente).

Ambas rodam automaticamente via GitHub Actions a cada push/PR, junto com um workflow separado de lint/code quality (`ruff`, `black`, `isort`, `eslint` — com versões fixadas para evitar quebras inesperadas quando essas ferramentas lançam releases com regras novas habilitadas por padrão). O **Dependabot** (`.github/dependabot.yml`) monitora semanalmente dependências pip, npm e as GitHub Actions usadas nos workflows, abrindo PR automaticamente quando há atualização — cada PR já roda a suíte de CI antes de você decidir se aceita.

## 🛠️ Tecnologias Utilizadas

**Frontend:**

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- Supabase JS Client (autenticação e banco de dados)

**Backend & Infraestrutura:**

- Python 3.12+, Flask
- Jinja2 (templating do LaTeX)
- Flask-Limiter (rate limiting), Flask-Cors
- deep-translator (tradução PT → EN)
- TeX Live / pdflatex (motor de PDF)
- Supabase (PostgreSQL + Auth + RLS)
- Docker & Gunicorn (deploy e servidor de produção)
- pytest / Vitest (testes automatizados)
- ruff, black, isort, ESLint, Prettier (qualidade de código)
- GitHub Actions (CI de testes, lint e backup diário)

## 📂 Estrutura do Projeto

```
Currícula/
├── .github/
│   ├── dependabot.yml              # Atualização automática semanal de dependências (pip/npm/actions)
│   └── workflows/
│       ├── tests.yml              # CI: roda a suíte de testes a cada push/PR
│       ├── code-quality.yml       # CI: lint (ruff, black, isort, eslint)
│       └── backup_supabase.yml    # Backup diário automático da tabela curriculos
├── .vscode/                       # Configurações recomendadas do editor
├── android/                       # Projeto nativo Android (Capacitor)
├── assets/                        # Imagens e recursos estáticos do projeto
├── backend/
│   ├── app.py                     # Servidor Flask e rotas da API
│   ├── latex_utils.py             # Escaping de caracteres especiais do LaTeX
│   ├── gerador.py                 # Script standalone de geração (fora do fluxo web)
│   ├── templates/
│   │   └── base_ats.tex           # Template do currículo em LaTeX
│   ├── tests/
│   │   └── test_app.py            # Suíte de testes automatizados (pytest)
│   ├── sample-data/
│   │   └── dados.json             # Dado de exemplo usado pelo gerador.py
│   ├── requirements.txt           # Dependências de produção
│   └── requirements-dev.txt       # Dependências de desenvolvimento/teste
├── docs/                          # Documentação estendida do projeto
├── frontend/
│   ├── index.html                 # Interface do usuário (formulário)
│   ├── script.js                  # Lógica de frontend (auth, currículos, envio de dados)
│   ├── accessibility.js           # Barra de opções de acessibilidade (fonte/contraste/movimento)
│   ├── utils.js                   # Funções puras extraídas (testáveis isoladamente)
│   └── utils.test.js              # Suíte de testes do frontend (Vitest)
├── www/                           # Cópia web empacotada pelo Capacitor (sincronizada de frontend/)
├── capacitor.config.json
├── CHANGELOG.md                   # Histórico de versões do projeto
├── CONTRIBUTING.md                # Guia de contribuição
├── Dockerfile                     # Receita de infraestrutura para nuvem
├── LICENSE.md                     # Licença MIT
├── package.json
├── pyproject.toml                 # Configuração de ferramentas Python (ruff/black/isort)
├── pytest.ini                     # Configuração do pytest
├── eslint.config.js               # Configuração de lint do frontend
├── vitest.config.js
├── .dockerignore
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .hintrc
├── .prettierignore
├── .prettierrc
└── README.md
```

> **Nota:** `www/` é uma cópia gerada pelo Capacitor a partir de `frontend/` — sempre edite os arquivos em `frontend/` e rode `npx cap sync android` para propagar a mudança pro app mobile.

## ▶️ Como rodar localmente

```
# 1. Clone o repositório
git clone https://github.com/alexnascimento1980/curricula.git
cd curricula

# 2. Crie e ative um ambiente virtual
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Instale as dependências
pip install -r backend/requirements.txt

# 4. Configure as credenciais do Supabase em frontend/script.js
#    (supabaseUrl e supabaseKey no topo do arquivo)

# 5. Rode o servidor
python backend/app.py
```

Acesse `http://127.0.0.1:5000`. É necessário ter o TeX Live (`pdflatex`) instalado no sistema para a geração de PDF funcionar.

Para rodar os testes automatizados:

```
# Backend (Python)
pip install -r backend/requirements-dev.txt
pytest backend/tests/ -v

# Frontend (JavaScript)
npm install
npm test
```

Para checar lint/formatação antes de abrir um PR:

```
# Backend
ruff check .
black --check .
isort --check-only .

# Frontend
npm run lint
```

## 📱 Aplicativo Mobile

O app Android (via Capacitor) já está funcional — login (e-mail/senha e Google), múltiplos currículos, geração de PDF bilíngue e recuperação de senha testados em aparelho físico. Veja `docs/mobile.md` para detalhes de build e configuração.

## 🗺️ Roadmap

- [ ] Versão iOS (requer Mac + Xcode)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja o [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo de branches, padrão de commits e checklist de PR antes de abrir sua contribuição.

## 📄 Licença

Este projeto está licenciado sob a licença MIT — veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.
