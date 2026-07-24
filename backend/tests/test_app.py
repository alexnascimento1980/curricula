"""
Testes automatizados do backend (app.py).

Rodar com: pytest -v
"""

import os
import sys
from unittest.mock import patch

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as app_module
from latex_utils import escapar_latex


def payload_valido():
    """Payload mínimo que deve passar em validar_dados_cv sem erros."""
    return {
        "lang": "pt",
        "basics": {
            "name": "Fulano de Tal",
            "email": "fulano@example.com",
            "linkedin": "",
            "github": "",
        },
        "summary": {"pt": ["Resumo profissional de teste."]},
        "skills": {"technical": ["Python", "SQL"]},
        "experience": [{"company": "Empresa Teste", "position_pt": "Analista"}],
        "education": [],
    }


@pytest.fixture
def client():
    """Cliente de teste do Flask, com rate limiting desligado (senão os
    próprios testes rodando em sequência esbarrariam no limite de 10/min
    pensado para o uso real, não para uma bateria de testes)."""
    app_module.app.config["TESTING"] = True
    app_module.app.config["RATELIMIT_ENABLED"] = False
    with app_module.app.test_client() as c:
        yield c


# ==========================================
# normalizar_url_perfil
# ==========================================
@pytest.mark.parametrize(
    "entrada,esperado",
    [
        ("linkedin.com/in/fulano", "linkedin.com/in/fulano"),
        ("https://linkedin.com/in/fulano", "linkedin.com/in/fulano"),
        ("http://linkedin.com/in/fulano", "linkedin.com/in/fulano"),
        ("https://www.linkedin.com/in/fulano", "linkedin.com/in/fulano"),
        ("www.linkedin.com/in/fulano", "linkedin.com/in/fulano"),
        ("HTTPS://WWW.LINKEDIN.COM/in/fulano", "LINKEDIN.COM/in/fulano"),
        ("", ""),
        (None, ""),
    ],
)
def test_normalizar_url_perfil(entrada, esperado):
    assert app_module.normalizar_url_perfil(entrada) == esperado


# ==========================================
# escapar_latex
# ==========================================
def test_escapar_latex_caracteres_especiais():
    assert escapar_latex("P&D") == r"P\&D"
    assert escapar_latex("100%") == r"100\%"
    assert escapar_latex("C#") == r"C\#"
    assert escapar_latex("a_b") == r"a\_b"
    assert escapar_latex("R$ 100") == r"R\$ 100"
    assert escapar_latex("{chave}") == r"\{chave\}"


def test_escapar_latex_valores_vazios():
    assert escapar_latex(None) == ""
    assert escapar_latex("") == ""


def test_escapar_latex_texto_sem_caracteres_especiais_nao_muda():
    assert escapar_latex("Texto normal 123") == "Texto normal 123"


def test_escapar_latex_barra_invertida():
    assert escapar_latex("\\") == r"\textbackslash{}"


# ==========================================
# validar_dados_cv
# ==========================================
def test_validar_dados_cv_payload_valido_passa():
    ok, _ = app_module.validar_dados_cv(payload_valido())
    assert ok is True


@pytest.mark.parametrize("payload_invalido", [None, "string", 123, ["lista"]])
def test_validar_dados_cv_payload_nao_dict(payload_invalido):
    ok, _ = app_module.validar_dados_cv(payload_invalido)
    assert ok is False


def test_validar_dados_cv_lang_invalido():
    d = payload_valido()
    d["lang"] = "fr"
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "lang" in msg


def test_validar_dados_cv_nome_vazio():
    d = payload_valido()
    d["basics"]["name"] = "   "
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is False


def test_validar_dados_cv_nome_muito_longo():
    d = payload_valido()
    d["basics"]["name"] = "a" * 201
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is False


@pytest.mark.parametrize("email_invalido", ["sememail", "com espaco@x.com", ""])
def test_validar_dados_cv_email_invalido(email_invalido):
    d = payload_valido()
    d["basics"]["email"] = email_invalido
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is False


def test_validar_dados_cv_linkedin_dominio_errado():
    d = payload_valido()
    d["basics"]["linkedin"] = "facebook.com/fulano"
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "linkedin" in msg


def test_validar_dados_cv_linkedin_com_https_ainda_passa():
    # a validação normaliza antes de checar o domínio
    d = payload_valido()
    d["basics"]["linkedin"] = "https://www.linkedin.com/in/fulano"
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is True


def test_validar_dados_cv_github_dominio_errado():
    d = payload_valido()
    d["basics"]["github"] = "gitlab.com/fulano"
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "github" in msg


def test_validar_dados_cv_linkedin_github_vazios_sao_permitidos():
    # campos opcionais: vazio não deve travar a validação
    d = payload_valido()
    d["basics"]["linkedin"] = ""
    d["basics"]["github"] = ""
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is True


def test_validar_dados_cv_experience_tipo_errado():
    d = payload_valido()
    d["experience"] = "não é uma lista"
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "experience" in msg


def test_validar_dados_cv_experience_sem_company():
    d = payload_valido()
    d["experience"] = [{"position_pt": "Dev"}]
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "company" in msg


def test_validar_dados_cv_experience_vazia_e_permitida():
    # seção opcional via toggle "Incluir no PDF?" no frontend: lista vazia
    # precisa continuar sendo válida no backend
    d = payload_valido()
    d["experience"] = []
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is True


def test_validar_dados_cv_experience_excede_limite():
    d = payload_valido()
    d["experience"] = [{"company": "X"}] * 31
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "limite" in msg


def test_validar_dados_cv_falta_bloco_obrigatorio():
    d = payload_valido()
    del d["education"]
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "education" in msg


def test_validar_dados_cv_skills_tipo_errado():
    d = payload_valido()
    d["skills"]["technical"] = "não é uma lista"
    ok, _ = app_module.validar_dados_cv(d)
    assert ok is False


def test_validar_dados_cv_courses_item_nao_dict():
    d = payload_valido()
    d["courses"] = ["não é um objeto"]
    ok, msg = app_module.validar_dados_cv(d)
    assert ok is False
    assert "courses" in msg


# ==========================================
# /generate-cv (integração ponta a ponta, incluindo pdflatex de verdade)
# ==========================================
def test_generate_cv_payload_invalido_retorna_400(client):
    resp = client.post("/generate-cv", json={"lang": "pt"})
    assert resp.status_code == 400
    assert "erro" in resp.get_json()


def test_generate_cv_pt_gera_pdf_valido(client):
    resp = client.post("/generate-cv", json=payload_valido())
    assert resp.status_code == 200
    assert resp.mimetype == "application/pdf"
    assert resp.data[:4] == b"%PDF"


# ==========================================
# Cabeçalhos de segurança HTTP
# ==========================================
def test_cabecalhos_seguranca_presentes_em_qualquer_resposta(client):
    # Confere numa rota de sucesso (/) e numa de erro (400), já que o
    # after_request precisa rodar independente do status da resposta.
    for resp in [
        client.get("/"),
        client.post("/generate-cv", json={"lang": "pt"}),
    ]:
        assert resp.headers.get("X-Frame-Options") == "DENY"
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
        assert "Content-Security-Policy" in resp.headers
        assert "Strict-Transport-Security" in resp.headers


def test_csp_restringe_a_dominios_especificos_nao_libera_geral(client):
    resp = client.get("/")
    csp = resp.headers["Content-Security-Policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp
    # não pode liberar geral (isso anularia a proteção)
    assert "script-src *" not in csp
    assert "default-src *" not in csp


def test_generate_cv_caracteres_especiais_nao_quebra_compilacao(client):
    d = payload_valido()
    d["experience"][0]["company"] = "Logística & Cia 100% Foco #1"
    resp = client.post("/generate-cv", json=d)
    assert resp.status_code == 200
    assert resp.data[:4] == b"%PDF"


def test_generate_cv_linkedin_url_completa_fica_normalizada_no_pdf(client):
    d = payload_valido()
    d["basics"]["linkedin"] = "https://www.linkedin.com/in/fulano"
    resp = client.post("/generate-cv", json=d)
    assert resp.status_code == 200
    # o bug original gerava "https://https://..." no PDF
    assert b"https://https" not in resp.data


def test_generate_cv_en_traducao_com_sucesso_mockada(client):
    d = payload_valido()
    d["lang"] = "en"
    with patch("app.traduzir_texto", return_value=("translated", True)):
        resp = client.post("/generate-cv", json=d)
    assert resp.status_code == 200
    assert resp.data[:4] == b"%PDF"


def test_generate_cv_en_traducao_falhando_retorna_502_em_vez_de_pdf_quebrado(client):
    d = payload_valido()
    d["lang"] = "en"
    with patch("app.traduzir_texto", return_value=("original", False)):
        resp = client.post("/generate-cv", json=d)
    assert resp.status_code == 502
    assert "erro" in resp.get_json()


def test_generate_cv_erro_generico_nao_vaza_detalhe_interno(client):
    d = payload_valido()
    with patch(
        "app.Environment", side_effect=RuntimeError("caminho secreto do servidor")
    ):
        resp = client.post("/generate-cv", json=d)
    assert resp.status_code == 500
    corpo = resp.get_json()
    assert "caminho secreto" not in corpo["erro"]


# ==========================================
# Rate limiting (com o limiter LIGADO de propósito, ao contrário dos demais)
# ==========================================
def test_rate_limit_bloqueia_apos_10_requisicoes_por_minuto():
    app_module.app.config["TESTING"] = True
    app_module.app.config["RATELIMIT_ENABLED"] = True
    app_module.limiter.reset()
    with app_module.app.test_client() as c:
        respostas = [
            c.post("/generate-cv", json={"lang": "pt"}).status_code for _ in range(12)
        ]
    # payload inválido (400) já é o suficiente pra contar contra o limite,
    # já que o limite é aplicado antes da lógica da rota
    assert respostas.count(429) >= 2
    app_module.limiter.reset()
