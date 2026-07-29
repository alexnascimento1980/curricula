# Currícula — Gerador de Currículo ATS Bilíngue

![CI](https://img.shields.io/github/actions/workflow/status/alexnascimento1980/curricula/tests.yml?branch=main&label=tests)
![Code Quality](https://img.shields.io/github/actions/workflow/status/alexnascimento1980/curricula/code-quality.yml?branch=main&label=code%20quality)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

O **Currícula** é uma aplicação web full-stack para gerar currículos profissionais otimizados para sistemas ATS (Applicant Tracking Systems). O candidato preenche um formulário dinâmico, o backend valida e processa os dados, e um PDF acessível (PDF/UA) é gerado a partir de um template HTML via WeasyPrint — com suporte a múltiplos currículos salvos por usuário e tradução automática para inglês.

## 🚀 Funcionalidades

- **Múltiplos currículos por usuário:** crie, liste, alterne, renomeie e exclua diferentes versões do currículo (ex: uma para vagas de gestão, outra para tecnologia), todas salvas na nuvem.
- **Autenticação completa:** cadastro e login por e-mail/senha, login com Google (OAuth), e recuperação de senha por e-mail — tudo via Supabase Auth.
- **Interface dinâmica:** formulário em Vanilla JS + Bootstrap, com blocos repetíveis (Experiências, Formações, Cursos, Projetos) adicionados/removidos sob demanda.
- **Seções opcionais ("Incluir no PDF?"):** cada seção (Experiência, Formação, Cursos, Projetos) pode ser individualmente incluída ou ocultada do documento final, sem exigir preenchimento de seções que o candidato não quer usar.
- **Tradução automática (PT → EN):** com um clique, todo o conteúdo do currículo é traduzido para inglês. Se o serviço de tradução falhar, o sistema recusa gerar o PDF em vez de entregar um documento parcialmente traduzido.
- **PDF acessível (PDF/UA):** gerado via WeasyPrint a partir de um template HTML — o PDF final tem árvore de estrutura semântica real (headings, listas, links com texto alternativo), navegável por leitores de tela e com marcadores (bookmarks) por seção, não só texto solto numa página.
- **Backup automático diário:** workflow do GitHub Actions que exporta os dados dos currículos todo dia, já que o plano gratuito do Supabase não inclui backups.
- **Pronto para produção:** Docker + Gunicorn, rate limiting, CORS restrito, e modo debug desligado por padrão.

## 🔒 Segurança

Pontos que receberam atenção específica durante o desenvolvimento:

- **Row Level Security (RLS)** no Postgres/Supabase: cada usuário só acessa seus próprios currículos, reforçado por políticas de `SELECT`/`INSERT`/`UPDATE`/`DELETE`.
- **Validação rigorosa no backend:** tipos, tamanhos, limites de itens e formato de campos (e-mail, LinkedIn, GitHub) são checados no servidor, não só no navegador.
- **Escaping automático via Jinja2:** o template usa autoescape nativo de HTML — entradas do usuário nunca são injetadas cruas, prevenindo XSS/quebra de layout no PDF gerado.
- **Rate limiting** no endpoint de geração de PDF (10/min, 60/hora), já que cada requisição dispara tradução (rede) + renderização do PDF (uso de CPU).
- **Mensagens de erro genéricas** para o cliente — detalhes internos (stack traces, caminhos de arquivo) ficam só no log do servidor.

Encontrou uma vulnerabilidade? Veja a política de segurança do repositório para saber como reportar.

## 🧪 Testes Automatizados

O backend tem uma suíte com **51 testes** (`pytest`), cobrindo validação de dados, normalização de URLs, o endpoint de geração de PDF de ponta a ponta (incluindo renderização real via WeasyPrint), e testes de regressão específicos da estrutura PDF/UA do arquivo gerado (árvore de estrutura semântica, idioma, texto alternativo dos links).

O frontend tem uma suíte com **21 testes** (`Vitest` + `jsdom`), cobrindo a lógica extraída para `frontend/utils.js`: normalização de URLs, formatação de datas, conversão de arquivo para base64, o toggle "Incluir no PDF?" (sem nunca marcar caixas de seleção como obrigatórias) e o debounce do autosave (incluindo o cenário de trocar de currículo rapidamente).

Ambas rodam automaticamente via GitHub Actions a cada push/PR, junto com um workflow separado de lint/code quality (`ruff`, `black`, `isort`, `eslint`).

## 🛠️ Tecnologias Utilizadas

**Frontend:**

- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 5
- Supabase JS Client (autenticação e banco de dados)

**Backend & Infraestrutura:**

- Python 3.12+, Flask
- Jinja2 (templating do HTML)
- WeasyPrint (renderização do PDF acessível a partir de HTML/CSS)
- pikepdf (pós-processamento de acessibilidade: texto alternativo dos links no PDF)
- Flask-Limiter (rate limiting), Flask-Cors
- deep-translator (tradução PT → EN)
- Supabase (PostgreSQL + Auth + RLS)
- Docker & Gunicorn (deploy e servidor de produção)
- pytest / Vitest (testes automatizados)
- ruff, black, isort, ESLint, Prettier (qualidade de código)
- GitHub Actions (CI de testes, lint e backup diário)

## 📂 Estrutura do Projeto

```
Currícula/
├── .github/
│   └── workflows/
│       ├── tests.yml              # CI: roda a suíte de testes a cada push/PR
│       ├── code-quality.yml       # CI: lint (ruff, black, isort, eslint)
│       └── backup_supabase.yml    # Backup diário automático da tabela curriculos
├── .vscode/                       # Configurações recomendadas do editor
├── android/                       # Projeto nativo Android (Capacitor)
├── assets/                        # Imagens e recursos estáticos do projeto
├── backend/
│   ├── app.py                     # Servidor Flask e rotas da API
│   ├── pdf_gerador.py             # Renderiza o PDF via WeasyPrint + pós-processa acessibilidade (Alt text dos links)
│   ├── texto_utils.py             # Limpeza de emojis/pictogramas do texto do usuário
│   ├── gerador.py                 # Script standalone de geração (fora do fluxo web)
│   ├── templates/
│   │   └── base_ats.html          # Template do currículo em HTML/CSS (fonte do PDF)
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

Acesse `http://127.0.0.1:5000`. Diferente do pipeline antigo (LaTeX), não é preciso instalar nenhum programa externo pro PDF funcionar — o WeasyPrint já vem via `pip install` no passo 3. Em Linux, se faltar alguma biblioteca de sistema do Pango (raro em distribuições recentes), o próprio erro ao rodar `python backend/app.py` indica qual pacote instalar (veja o `Dockerfile` para a lista usada em produção).

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
