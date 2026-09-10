# API

O backend Flask (`backend/app.py`) expõe uma única rota de API de verdade — o restante são rotas de arquivo estático. Não há autenticação no lado do Flask: quem cuida de login/sessão é o Supabase, direto do client.

## `POST /generate-cv`

Recebe os dados do currículo e devolve um PDF acessível (PDF/UA) gerado na hora.

**Rate limit**: 10 requisições/minuto e 60/hora, por IP.

**CORS**: restrito pela variável de ambiente `ALLOWED_ORIGINS` (lista separada por vírgula); `"*"` se não configurada.

### Request

`Content-Type: application/json`, corpo até 2 MB (`MAX_CONTENT_LENGTH`).

```jsonc
{
  "lang": "pt",                     // "pt" ou "en" — default "pt"
  "basics": {
    "name": "string",               // obrigatório, até 200 caracteres
    "email": "string",              // obrigatório, precisa conter "@" e não ter espaço
    "linkedin": "string",           // opcional; se preenchido, precisa conter "linkedin.com"
    "github": "string",             // opcional; se preenchido, precisa conter "github.com"
    "label_pt": "string"            // título/cargo, traduzido se lang="en"
  },
  "summary": {
    "pt": ["string", "..."]         // obrigatório (pode ser lista vazia)
  },
  "skills": {
    "technical": ["string", "..."]  // obrigatório (pode ser lista vazia)
  },
  "experience": [                   // obrigatório (pode ser lista vazia), até 30 itens
    {
      "company": "string",          // obrigatório por item
      "position_pt": "string",
      "highlights_pt": ["string", "..."]
    }
  ],
  "education": [                    // obrigatório (pode ser lista vazia), até 15 itens
    { "area_pt": "string", "status_pt": "string" }
  ],
  "courses": [                      // opcional, até 30 itens
    { "name_pt": "string" }
  ],
  "projects": [                     // opcional, até 30 itens
    { "description_pt": "string" }
  ]
}
```

Links de LinkedIn/GitHub podem vir com `https://`, `http://` ou `www.` — o backend normaliza antes de montar o link final no template (evita `https://https://...` duplicado).

### Responses

| Status | Quando | Corpo |
|---|---|---|
| `200` | Sucesso | PDF (`application/pdf`), como anexo (`Content-Disposition: attachment`), nome do arquivo `{nome_do_candidato}_curriculo_{lang}.pdf` |
| `400` | Payload inválido (campo faltando, tipo errado, limite excedido, e-mail/LinkedIn/GitHub mal formado) | `{"erro": "mensagem específica do problema"}` |
| `429` | Rate limit excedido | Resposta padrão do Flask-Limiter |
| `502` | `lang="en"` e a tradução falhou (após 2 tentativas) — nunca é devolvido um PDF parcialmente traduzido | `{"erro": "Não foi possível traduzir o currículo para inglês no momento..."}` |
| `500` | Erro inesperado no processamento (renderização/PDF) | `{"erro": "Erro interno ao gerar o PDF. Tente novamente."}` — detalhe real só no log do servidor |

### Exemplo

```bash
curl -X POST http://localhost:5000/generate-cv \
  -H "Content-Type: application/json" \
  -d '{
    "lang": "pt",
    "basics": {"name": "Maria Silva", "email": "maria@example.com"},
    "summary": {"pt": ["Profissional de dados com 5 anos de experiência."]},
    "skills": {"technical": ["Python", "SQL"]},
    "experience": [{"company": "Acme", "position_pt": "Analista de Dados"}],
    "education": []
  }' \
  -o curriculo.pdf
```

## Rotas de arquivo estático

Servem a versão web legada (`frontend/`) — ver `docs/architecture.md` sobre por que isso ainda não é o build do `frontend-react`.

| Rota | Serve |
|---|---|
| `GET /` | `frontend/index.html` |
| `GET /script.js` | `frontend/script.js` |
| `GET /utils.js` | `frontend/utils.js` |
| `GET /accessibility.js` | `frontend/accessibility.js` |
| `GET /vendor/<caminho>` | `frontend/vendor/<caminho>` (Bootstrap, Font Awesome, `supabase-js` vendorizados localmente) |

Nenhuma dessas rotas tem rate limit próprio — são arquivos estáticos, sem processamento.

## O que não é API deste backend

Persistência de currículos (criar, listar, renomear, excluir, salvar automaticamente), autenticação e recuperação de senha **não passam pelo Flask** — o client (`frontend/script.js` ou `frontend-react/src/lib/resumeService.ts`) fala direto com a API REST do Supabase, usando a chave `publishable` e as policies de RLS para controle de acesso. Ver `docs/security.md`.

## Rotas ainda não implementadas

O roadmap já cogitou rotas como `/resume` (gerar a partir de um perfil salvo, sem reenviar tudo), `/cover-letter` (carta de apresentação), `/match` (aderência a uma vaga) e `/translate` como endpoint isolado — nenhuma existe hoje. `/generate-cv` é a única rota de processamento da API.
