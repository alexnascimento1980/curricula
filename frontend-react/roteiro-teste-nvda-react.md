# Roteiro de teste manual — Currícula (versão React) com NVDA

Este é o mesmo tipo de roteiro que usamos pra validar o app antigo (Vanilla
JS) — agora adaptado pra estrutura da versão React, que passou por 5 fases
de migração incremental. A ideia continua a mesma: cada peça foi validada
isoladamente durante a migração, mas nunca testada como um todo, já
integrada, com um leitor de tela de verdade.

## 1. Preparação

1. NVDA já deve estar instalado (mesma instalação de antes).
2. Suba os dois servidores, em terminais separados:
   ```powershell
   # Terminal 1
   cd C:\Dev\CareerOS\CareerOS
   python backend\app.py

   # Terminal 2
   cd C:\Dev\CareerOS\CareerOS\frontend-react
   npm run dev
   ```
3. Abra `http://localhost:5173` no Chrome ou Edge.

## 2. Comandos essenciais (iguais a antes)

| Tecla | O que faz |
|---|---|
| `Tab` / `Shift+Tab` | Move entre elementos interativos |
| `H` / `Shift+H` | Pula pro próximo/anterior cabeçalho |
| `F` | Pula pro próximo campo de formulário |
| `B` | Pula pro próximo botão |
| `Insere + F7` | Lista de elementos (cabeçalhos/links/campos) |
| `Esc` | Fecha modal/painel |

---

## 3. Roteiro de teste

### 3.1 — Skip link e `<h1>` (correções feitas nesta rodada)
- [ ] Recarregue a página e aperte `Tab` uma vez, logo de cara.
- **Esperado:** primeira coisa anunciada é "Pular para o conteúdo principal, link". `Enter` deve levar o foco direto pro conteúdo, pulando a barra de notificações.
- [ ] Aperte `Insere + F7`, escolha "Cabeçalhos".
- **Esperado:** ver **um único** nível 1 ("Currícula") no topo — se aparecer mais de um h1, ou nenhum, é regressão.

### 3.2 — Hierarquia de cabeçalhos do formulário
- **Esperado:** logo abaixo do h1, os títulos numerados (01 Dados Básicos, 02 Resumo Profissional, 03 Experiência Profissional...) aparecem como nível 2, e — depois de adicionar um bloco de Experiência/Formação/Curso/Projeto — o título do bloco ("Nova Experiência" etc.) aparece como nível 3. Não deve pular de 1 direto pra 3.

### 3.3 — Login (Fase 2)
- [ ] Tab até o botão "Fazer Login", `Enter`.
- **Esperado:** o NVDA anuncia "Área do Candidato" ao abrir (não só "diálogo" genérico).
- [ ] Preencha e-mail/senha só por teclado, envie.
- [ ] Teste também "Esqueci minha senha" → deve trocar pro modal de recuperação, anunciando o novo título.
- [ ] `Esc` em qualquer modal deve fechar e devolver o foco pro botão que abriu.

### 3.4 — Formulário principal (Fase 3)
- [ ] Navegue pelos campos de "Dados Básicos" com `F` — cada campo deve anunciar o rótulo certo (Nome Completo, Título Profissional, E-mail, Telefone, Estado, Cidade).
- [ ] Selecione um Estado — confirme que a lista de Cidades é anunciada como atualizada (não trava em "Selecione o estado").
- [ ] Teste os toggles "Incluir?" de LinkedIn/GitHub — desmarcar deve tirar a obrigatoriedade do campo (o NVDA não deve mais anunciar "obrigatório" nesse campo).
- [ ] Adicione um bloco de Experiência (`B` até "Adicionar Experiência", `Enter`) — confirme que o novo bloco aparece e é anunciado.
- [ ] Remova o bloco — confirme que some e o foco não fica "perdido" (idealmente vai pro botão anterior ou pro topo da seção).

### 3.5 — Painel de currículos (Fase 4)
- [ ] Estando logado, Tab até "Meus Currículos", `Enter` — painel deve abrir e anunciar o título.
- [ ] Dentro do painel, cada currículo salvo deve ser anunciado como **botão** (não texto solto), incluindo se é o "atual".
- [ ] Teste os botões de lápis (renomear) e lixeira (excluir) — devem anunciar pra qual currículo se referem.
- [ ] Crie um currículo novo pelo modal — confirme que o formulário reseta e o título "Editando: [nome]" atualiza.

### 3.6 — Geração do PDF
- [ ] Preencha os campos obrigatórios e gere o currículo.
- [ ] Se deixar algo em branco de propósito: o NVDA deve anunciar "Verifique os campos obrigatórios." automaticamente (via `aria-live`), sem precisar navegar até a notificação.

### 3.7 — Barra de acessibilidade (Fase 1)
- [ ] Confirme que o botão flutuante (♿) ainda funciona: abre, foca no primeiro controle, `Esc` fecha e devolve o foco.
- [ ] Teste alto contraste e redução de movimento.

---

## 4. Diferenças esperadas em relação ao app antigo

Duas coisas **propositalmente** diferentes da versão Vanilla JS, não são bugs:
- O ícone do botão de acessibilidade hoje é um emoji (♿) em vez do ícone do Font Awesome — cosmético, ainda não portado.
- O favicon é o raio roxo padrão do Vite, não uma logo da Currícula — pendente.

## 5. Como reportar

Mesmo formato de sempre — pra cada item que não funcionar como esperado:
1. Número do item (ex: "3.4")
2. O que o NVDA disse (ou não disse)
3. O que você esperava ouvir
