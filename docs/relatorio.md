# 📄 Relatório Técnico e Documentação de Deploy: Currícula

**Projeto:** Currícula - Gerador de Currículo ATS Bilíngue Inteligente
**Autor:** Alex Aparecido Pereira do Nascimento
**Repositório:** [https://github.com/alexnascimento1980/curricula](https://github.com/alexnascimento1980/curricula)

---

## 1. Visão Geral do Produto

O **Currícula** é uma aplicação web full-stack projetada para solucionar a ineficiência na criação de currículos otimizados para sistemas ATS (Applicant Tracking Systems).

Idealizado para suportar profissionais com perfis híbridos e em transição de carreira (como a intersecção entre Logística Operacional e Ciência de Dados), o sistema permite a geração dinâmica de currículos em formato PDF de alta precisão tipográfica, utilizando processamento backend e templates dinâmicos.

![Print da Tela Inicial do Currícula](caminho_para_sua_imagem_1.png)
_(Figura 1: Interface principal do Currícula com design responsivo em Bootstrap 5)_

---

## 2. Arquitetura do Sistema

A aplicação adota uma arquitetura Cliente-Servidor clássica, conteinerizada para garantir alta portabilidade e escalabilidade.

### 2.1. Frontend (Interface do Usuário)

- **Core:** HTML5, CSS3 e Vanilla JavaScript (ES6+).
- **UI/UX:** Bootstrap 5 para responsividade e FontAwesome para iconografia.
- **Gerenciamento de Estado:** Utilização da API nativa `localStorage` para implementar uma rotina de _Auto-Save_, garantindo persistência de dados no lado do cliente (Zero Data Loss) sem a necessidade de um banco de dados relacional.
- **Integrações Assíncronas:** Consumo da API pública do IBGE via `fetch` para renderização dinâmica de cascatas de localização (Estado -> Cidade).

### 2.2. Backend (Processamento e Renderização)

- **Framework:** Python 3.10+ operando com Flask e Gunicorn (WSGI HTTP Server para produção).
- **Motor de Tradução:** Integração com a biblioteca `deep-translator` para chamadas em tempo real à IA do Google Translate, gerando matrizes bilíngues do documento (Português/Inglês).
- **Motor de Renderização de PDF:** Template em **HTML5/CSS3** injetado via **Jinja2** (autoescape nativo, sem risco de injeção) e convertido para PDF pelo **WeasyPrint**. O documento final é certificado **PDF/UA-1** (ISO 14289-1) — validado formalmente pelo veraPDF, o validador de referência da indústria, com 0 falhas em 106 regras — garantindo que o currículo seja navegável por leitores de tela, não só "bonito visualmente". Um passo de pós-processamento com `pikepdf` complementa a árvore de estrutura com texto alternativo nos links (e-mail, LinkedIn, GitHub, projetos).

![Diagrama Arquitetural](caminho_para_sua_imagem_2.png)
_(Figura 2: Fluxo de dados e compilação do documento PDF)_

---

## 3. Funcionalidades de Destaque

1. **Seccionamento Condicional (Toggle):**
   - Cada seção do currículo (Experiência, Formação, Cursos, Projetos) e os campos de LinkedIn/GitHub têm uma chave seletora independente que injeta ou remove a obrigatoriedade (DOM `required`) e decide se aquele conteúdo entra ou não no PDF final. Permite exportar, por exemplo, um documento sem redes sociais para quem não as usa, ou sem a seção de projetos para um perfil mais voltado à gestão.
2. **Máscaras e Validação (Regex):**
   - Algoritmos de sanitização no Frontend para campos de telefone, datas (conversão de calendário nativo para formato MM/AAAA) e validação de URIs (LinkedIn e GitHub).
3. **Tradução Silenciosa e Nomenclatura Automática:**
   - O sistema altera os cabeçalhos fixos no nível do template `.html` e os textos dinâmicos no nível do payload JSON.
   - O binário final é devolvido ao navegador já formatado com o nome do candidato (ex: `Alex_Nascimento_curriculo_en.pdf`).
4. **Acessibilidade de ponta a ponta:**
   - Não é só o formulário web que segue WCAG (navegação por teclado, leitores de tela, `aria-live`, barra de opções de fonte/contraste/movimento) — o PDF gerado também é acessível: estrutura semântica real (headings, listas, links), navegável por marcadores de seção, com certificação formal PDF/UA-1.

---

## 4. Documentação de Deploy (Render / Docker)

A aplicação foi desenhada com infraestrutura como código (IaC) utilizando Docker, isolando as dependências de sistema do WeasyPrint (Pango, HarfBuzz, Fontconfig) do sistema operacional base.

### 4.1. Estrutura do Container (`Dockerfile`)

O ambiente de produção é construído sobre uma imagem leve (`python:3.10-slim`, base Debian). Durante o _build_, o gerenciador de pacotes (`apt-get`) instala as bibliotecas de renderização que o WeasyPrint precisa (Pango/HarfBuzz/Fontconfig) e a fonte usada no currículo (Liberation Serif, compatível em métricas com Times New Roman), enquanto o `pip` resolve o ecossistema Python (WeasyPrint, pikepdf, Flask, etc).

### 4.2. Fluxo de Publicação Contínua no Render

O ambiente de produção está hospedado no Render.com, vinculado diretamente à branch `main` do repositório GitHub.

**Passo a Passo de Setup:**

1. Conexão do repositório no dashboard do Render como um **Web Service**.
2. Definição do Runtime para **Docker**.
3. Exposição da porta padrão (`5000`) comandada pelo Gunicorn:
   `CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "90", "app:app"]`
   (o timeout de 90s cobre picos em que a requisição envolve tradução via rede + renderização do PDF)

![Print do painel do Render](caminho_para_sua_imagem_3.png)
_(Figura 3: Monitoramento de deploy contínuo no ambiente Render)_

### 4.3. Instalação e Execução Local (Modo Desenvolvedor)

Caso seja necessário depurar a aplicação em ambiente de desenvolvimento isolado, basta possuir o Docker instalado e executar a seguinte cadeia no terminal:

```bash
# 1. Clonar o projeto
git clone [https://github.com/alexnascimento1980/curricula.git](https://github.com/alexnascimento1980/curricula.git)
cd curricula

# 2. Construir a imagem (Download do Debian slim, Python e dependências do WeasyPrint)
docker build -t career-os-local .

# 3. Executar o container realizando o mapeamento de portas
docker run -p 5000:5000 career-os-local
```
