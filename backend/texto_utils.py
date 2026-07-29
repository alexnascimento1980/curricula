import re

# Emojis e símbolos pictográficos (e seus modificadores, como o seletor de
# variação U+FE0F) não têm glifo nas fontes usadas para gerar o PDF
# (Liberation Serif/DejaVu, sem cobertura de emoji colorido) — sem isso,
# eles saem como um quadradinho vazio ("tofu") no currículo final. Como é
# comum colar textos com emoji (LinkedIn, WhatsApp), removemos esses
# caracteres em vez de deixar um símbolo quebrado no PDF.
_EMOJI_PATTERN = re.compile(
    "["
    "\U0001f300-\U0001faff"  # símbolos e pictogramas diversos, emoticons, transporte, etc.
    "\U00002600-\U000027bf"  # símbolos diversos e dingbats (☀, ✅, ➡ etc.)
    "\U0001f1e6-\U0001f1ff"  # bandeiras (pares de indicadores regionais)
    "\U00002190-\U000021ff"  # setas
    "\U00002b00-\U00002bff"  # setas e formas diversas
    "\U0000fe00-\U0000fe0f"  # seletores de variação (ex.: o que forma o 🛠️)
    "\U0000200d"  # zero-width joiner (usado em emojis compostos)
    "]+",
    flags=re.UNICODE,
)


def remover_emojis(texto):
    """Remove emojis e pictogramas que atrapalham o texto final do PDF."""
    if texto is None:
        return ""
    return _EMOJI_PATTERN.sub("", str(texto))
