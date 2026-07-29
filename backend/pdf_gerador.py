"""Geração do PDF do currículo via HTML + WeasyPrint (PDF/UA).

Substitui o pipeline antigo (LaTeX + pdflatex), que nunca produzia um PDF
com estrutura semântica real — só texto linear + bookmarks. WeasyPrint gera
uma árvore de estrutura de verdade (H1/H2/H3, listas, links) quando pedimos
o variant "pdf/ua-1", o que é exatamente o que leitores de tela precisam.

Uma lacuna real do WeasyPrint hoje: ele não propaga `data-alt`/`aria-label`
do HTML para o texto alternativo (`/Alt`) dos links na árvore de estrutura
do PDF (suporte a atributos ARIA ainda é um pedido de funcionalidade em
aberto no projeto, não implementado). Por isso, aqui: (1) extraímos os
textos alternativos dos elementos `<a data-alt="...">` do HTML já
renderizado, na ordem em que aparecem, e (2) depois de gerar o PDF,
percorremos a árvore de estrutura com pikepdf e preenchemos o `/Alt` de
cada elemento `/Link`, na mesma ordem. Isso foi validado manualmente
(auditoria contra as regras centrais do PDF/UA-1 com pikepdf) antes de
entrar em produção.
"""

import re

import pikepdf
from weasyprint import HTML

_DATA_ALT_PATTERN = re.compile(r'<a\b[^>]*\bdata-alt="([^"]*)"[^>]*>')


def extrair_textos_alt(html_renderizado):
    """Extrai, na ordem em que aparecem, os data-alt de cada <a> do HTML.

    A ordem importa: é assim que casamos cada texto alternativo com o
    elemento /Link correspondente na árvore de estrutura do PDF depois.
    """
    return [
        texto.replace("&amp;", "&").replace("&quot;", '"')
        for texto in _DATA_ALT_PATTERN.findall(html_renderizado)
    ]


def _percorrer_e_marcar_links(elemento, textos_alt, indice):
    """Percorre a árvore de estrutura do PDF em profundidade, preenchendo
    o /Alt de cada /Link na ordem de aparição (índice mutável via lista de
    1 elemento, já que Python não tem 'nonlocal' fácil em recursão simples).
    """
    kids = elemento.get("/K")
    if kids is None:
        return
    if not isinstance(kids, pikepdf.Array):
        kids = [kids]
    for kid in kids:
        if isinstance(kid, pikepdf.Dictionary):
            if str(kid.get("/S")) == "/Link" and indice[0] < len(textos_alt):
                kid["/Alt"] = pikepdf.String(textos_alt[indice[0]])
                indice[0] += 1
            _percorrer_e_marcar_links(kid, textos_alt, indice)


def adicionar_alt_text_nos_links(pdf_bytes, textos_alt):
    """Reabre o PDF gerado e injeta /Alt em cada elemento /Link, na ordem.

    Se não houver StructTreeRoot (não deveria acontecer com pdf/ua-1, mas
    por segurança) ou não houver textos para aplicar, devolve o PDF
    original sem alteração.
    """
    if not textos_alt:
        return pdf_bytes

    import io

    pdf = pikepdf.open(io.BytesIO(pdf_bytes))
    root = pdf.Root
    if "/StructTreeRoot" in root:
        _percorrer_e_marcar_links(root.StructTreeRoot, textos_alt, [0])

    saida = io.BytesIO()
    pdf.save(saida)
    return saida.getvalue()


def gerar_pdf(html_renderizado):
    """Recebe o HTML já renderizado (Jinja) e devolve os bytes do PDF/UA-1
    final, já com o texto alternativo dos links corrigido.
    """
    textos_alt = extrair_textos_alt(html_renderizado)
    pdf_bytes = HTML(string=html_renderizado).write_pdf(pdf_variant="pdf/ua-1")
    return adicionar_alt_text_nos_links(pdf_bytes, textos_alt)
