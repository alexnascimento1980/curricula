## [0.4.0]

### Changed

- Motor de geração do PDF migrado de LaTeX (`pdflatex`) para WeasyPrint (HTML/CSS → PDF), produzindo um PDF acessível (PDF/UA): árvore de estrutura semântica real, idioma e metadados corretos, marcadores de navegação por seção, e texto alternativo nos links.
- `backend/latex_utils.py` renomeado para `backend/texto_utils.py` (só resta a limpeza de emojis; o escaping de LaTeX não é mais necessário com o autoescape nativo de HTML do Jinja2).
- `backend/templates/base_ats.tex` substituído por `backend/templates/base_ats.html`.
- `Dockerfile` não instala mais TeX Live; instala as bibliotecas de sistema do WeasyPrint (Pango/HarfBuzz/Fontconfig) em vez disso.

### Added

- `backend/pdf_gerador.py`: novo módulo que gera o PDF via WeasyPrint e pós-processa a árvore de estrutura com `pikepdf` para preencher o texto alternativo dos links (lacuna atual do WeasyPrint, que ainda não propaga `aria-label`/`data-alt` do HTML nativamente).
- Testes de regressão específicos da estrutura PDF/UA do arquivo gerado.

## [0.3.1]

### Added

- GitHub Actions
- CI
- Code Quality
- Release Workflow
- Issue Templates
- Pull Request Template
