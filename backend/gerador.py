"""Script de linha de comando para gerar currículos de exemplo rapidamente,
sem precisar subir o Flask — útil para conferir o resultado visual do
template depois de mexer em backend/templates/base_ats.html.

Uso: python gerador.py
"""

import json
import os

from jinja2 import Environment, FileSystemLoader, select_autoescape
from pdf_gerador import gerar_pdf
from texto_utils import remover_emojis

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DADOS_PATH = os.path.join(BASE_DIR, "sample-data", "dados.json")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
SAIDA_DIR = os.path.join(BASE_DIR, "..", "saida")


def gerar_curriculos():
    with open(DADOS_PATH, "r", encoding="utf-8") as f:
        dados_cv = json.load(f)

    ambiente_jinja = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(["html"]),
    )
    ambiente_jinja.filters["limpar"] = remover_emojis
    template = ambiente_jinja.get_template("base_ats.html")

    if not os.path.exists(SAIDA_DIR):
        os.makedirs(SAIDA_DIR)

    for lang in ("pt", "en"):
        print(f"Gerando para: {lang}")
        html_renderizado = template.render(dados=dados_cv, lang=lang)
        pdf_bytes = gerar_pdf(html_renderizado)

        output_filename = os.path.join(SAIDA_DIR, f"curriculo_ats_{lang}.pdf")
        with open(output_filename, "wb") as f:
            f.write(pdf_bytes)
        print(f"Arquivo gerado: {output_filename}")


if __name__ == "__main__":
    gerar_curriculos()
