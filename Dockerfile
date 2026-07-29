# 1. Usa uma imagem oficial do Python, leve e baseada em Linux (Debian)
FROM python:3.10-slim

# 2. Define a pasta onde tudo vai acontecer dentro do container
WORKDIR /app

# 3. Instala as bibliotecas de sistema que o WeasyPrint precisa para
# renderizar (Pango cuida do layout de texto e é o motor por trás do PDF
# com tags de acessibilidade — desde a v53 o WeasyPrint não depende mais de
# cairo/GdkPixbuf, só de Pango/HarfBuzz/Fontconfig) + a fonte usada no
# currículo (Liberation Serif, compatível em métricas com Times New Roman).
# O comando rm -rf limpa o cache após instalar, deixando a imagem mais leve.
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libharfbuzz-subset0 \
    libfontconfig1 \
    fonts-liberation \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# 4. Copia apenas o arquivo de dependências primeiro
COPY backend/requirements.txt backend/requirements.txt

# 5. Instala as bibliotecas do Python (Flask, Jinja2, tradutor, etc.)
RUN pip install --no-cache-dir -r backend/requirements.txt

# 6. Copia todo o resto do seu projeto (backend/, frontend/, etc.)
COPY . .

# 7. Informa que o container vai se comunicar pela porta 5000
EXPOSE 5000

# 8. Roda a partir da pasta backend/, onde o app.py de fato mora.
WORKDIR /app/backend

# 9. Liga o servidor usando o Gunicorn em vez do Flask puro.
# --timeout 90: cada requisição pode envolver chamadas de tradução (rede) +
# renderização do PDF via WeasyPrint; o padrão do Gunicorn (30s) poderia
# matar o worker no meio do processo em picos de carga, gerando um 502 feio
# em vez do erro tratado que o app.py devolveria sozinho.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "90", "app:app"]