// ==========================================
// CONFIGURAÇÃO SUPABASE
// ==========================================
const supabaseUrl = "https://vaiedrsonmktbnkcktqv.supabase.co";
const supabaseKey = "sb_publishable_K1kdVFqNe9olG91GCEe-rg_D6BcQZk8";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// CONFIGURAÇÃO DA API (backend Flask)
// ==========================================
// No navegador (site normal), o frontend é servido pelo próprio Flask, então
// um caminho relativo como "/generate-cv" já aponta pro lugar certo. Dentro
// do app empacotado pelo Capacitor, o HTML/JS roda numa origem própria
// (https://localhost no Android/iOS), então precisa da URL completa do
// backend hospedado.
const API_BASE_URL =
  window.Capacitor && window.Capacitor.isNativePlatform()
    ? "https://careeros-mcau.onrender.com"
    : "";

let currentUser = null;
let currentResumeId = null;
let isSavingToCloud = false;
let isLoadingResume = false;
let modalMode = "new"; // "new" | "rename"
let modalTargetId = null;

// ==========================================
// LÓGICA DE AUTENTICAÇÃO
// ==========================================

// Depois do login via OAuth (Google), o Supabase redireciona de volta com
// os tokens de sessão expostos no #hash da URL (ex: #access_token=...).
// O client do Supabase já lê e usa esses tokens automaticamente, mas eles
// continuam visíveis na barra de endereço até serem removidos manualmente.
// Isso é sensível: qualquer pessoa que veja essa URL (histórico do
// navegador, print de tela, link compartilhado) teria acesso à sessão.
function limparTokenDaURL() {
  if (window.location.hash) {
    const urlLimpa =
      window.location.origin +
      window.location.pathname +
      window.location.search;
    window.history.replaceState({}, document.title, urlLimpa);
  }
}

async function checarSessao() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  atualizarUIAuth(session?.user || null);
  limparTokenDaURL();
  supabaseClient.auth.onAuthStateChange((event, session) => {
    // Chegou aqui através do link de recuperação de senha do e-mail: o
    // Supabase já autentica a pessoa com uma sessão temporária só pra
    // permitir trocar a senha. Mostramos o modal de nova senha em vez do
    // fluxo normal de login.
    if (event === "PASSWORD_RECOVERY") {
      limparTokenDaURL();
      const campoUsername = document.getElementById("new-password-username");
      if (campoUsername) campoUsername.value = session?.user?.email || "";
      new bootstrap.Modal(document.getElementById("newPasswordModal")).show();
      return;
    }

    // O Supabase dispara um evento (ex: INITIAL_SESSION) imediatamente ao
    // registrar este listener, repetindo a mesma sessão que já processamos
    // acima via getSession(). Sem essa checagem, iniciarCurriculosDoUsuario()
    // roda duas vezes em paralelo e pode deixar blocos de experiência/
    // formação duplicados ou "fantasmas" no formulário.
    const novoUserId = session?.user?.id || null;
    if (novoUserId === (currentUser?.id || null)) return;
    atualizarUIAuth(session?.user || null);
    limparTokenDaURL();
  });
}

function atualizarUIAuth(user) {
  currentUser = user;
  const bannerLogin = document.getElementById("login-banner");
  const bannerLogged = document.getElementById("logged-banner");
  const emailDisplay = document.getElementById("user-email-display");

  if (user) {
    bannerLogin.style.setProperty("display", "none", "important");
    bannerLogged.style.setProperty("display", "flex", "important");
    emailDisplay.textContent = user.email;
    iniciarCurriculosDoUsuario(user.id);
  } else {
    bannerLogin.style.setProperty("display", "flex", "important");
    bannerLogged.style.setProperty("display", "none", "important");
    emailDisplay.textContent = "";
    debouncerSalvamento.cancelar();
    currentResumeId = null;
    document.getElementById("resumesList").innerHTML = "";
    document.getElementById("current-resume-title").textContent =
      "Nenhum selecionado";
    limparFormulario();
  }
}

async function fazerCadastro() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");
  if (!email || password.length < 6) {
    errorDiv.textContent = "E-mail inválido ou senha menor que 6 caracteres.";
    errorDiv.style.display = "block";
    return;
  }
  errorDiv.style.display = "none";
  const btn = document.getElementById("btn-register");
  btn.textContent = "Criando...";
  const { error } = await supabaseClient.auth.signUp({ email, password });
  btn.textContent = "Criar Conta";
  if (error) {
    errorDiv.textContent = error.message;
    errorDiv.style.display = "block";
  } else {
    btn.blur();
    bootstrap.Modal.getInstance(document.getElementById("authModal")).hide();
    mostrarNotificacao("Conta criada com sucesso!", "success");
  }
}

async function fazerLogin() {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const errorDiv = document.getElementById("auth-error");
  errorDiv.style.display = "none";
  const btn = document.getElementById("btn-login");
  btn.textContent = "Entrando...";
  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  btn.textContent = "Entrar";
  if (error) {
    errorDiv.textContent = "Falha no login. Verifique e-mail e senha.";
    errorDiv.style.display = "block";
  } else {
    btn.blur();
    bootstrap.Modal.getInstance(document.getElementById("authModal")).hide();
  }
}

// Esquema de URL customizado que o Android/iOS usa pra "devolver" o
// controle ao app depois do login OAuth (configurado no AndroidManifest.xml
// e, futuramente, no Info.plist do iOS).
const OAUTH_CALLBACK_URL = "com.alexnascimento.curricula://auth-callback";

async function loginComGoogle() {
  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

  if (isNative) {
    // Dentro do app: pedimos a URL de login sem redirecionar automaticamente
    // (skipBrowserRedirect), abrimos ela numa aba do navegador do sistema
    // via plugin Browser, e esperamos o Google devolver o controle pro app
    // através do esquema de URL customizado (ver appUrlOpen mais abaixo).
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: OAUTH_CALLBACK_URL,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      mostrarNotificacao("Erro no login com Google: " + error.message, "danger");
      return;
    }
    await window.Capacitor.Plugins.Browser.open({ url: data.url });
  } else {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error)
      mostrarNotificacao("Erro no login com Google: " + error.message, "danger");
  }
}

// Só existe dentro do app nativo: escuta o momento em que o Android/iOS
// reabre o app através do esquema de URL customizado (depois do login no
// navegador do sistema), extrai os tokens da URL e conclui a sessão.
if (window.Capacitor && window.Capacitor.isNativePlatform()) {
  window.Capacitor.Plugins.App.addListener("appUrlOpen", async (evento) => {
    if (!evento.url || !evento.url.startsWith(OAUTH_CALLBACK_URL)) return;

    await window.Capacitor.Plugins.Browser.close().catch(() => {});

    const hash = evento.url.split("#")[1] || "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const ehRecuperacaoSenha = params.get("type") === "recovery";

    if (access_token && refresh_token) {
      const { error } = await supabaseClient.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        mostrarNotificacao("Erro ao concluir login: " + error.message, "danger");
        return;
      }
      // setSession() feito manualmente aqui não dispara o evento automático
      // PASSWORD_RECOVERY do Supabase (esse evento só ocorre quando o
      // próprio client detecta e interpreta a URL sozinho) — por isso
      // precisamos checar o parâmetro "type" e abrir o modal na mão.
      if (ehRecuperacaoSenha) {
        new bootstrap.Modal(document.getElementById("newPasswordModal")).show();
      }
    }
  });

  // O Capacitor não fecha/minimiza o app sozinho quando o botão (ou gesto)
  // Voltar do Android é usado — precisa ser tratado explicitamente. Aqui:
  // se tiver algum modal ou painel aberto, o Voltar fecha ele primeiro
  // (como o usuário espera); só sai do app de verdade quando não há mais
  // nada aberto, seguindo a convenção do Android (sem botão de "Sair" na
  // interface).
  window.Capacitor.Plugins.App.addListener("backButton", ({ canGoBack }) => {
    const modalAberto = document.querySelector(".modal.show");
    if (modalAberto) {
      bootstrap.Modal.getInstance(modalAberto)?.hide();
      return;
    }

    const painelAberto = document.querySelector(".offcanvas.show");
    if (painelAberto) {
      bootstrap.Offcanvas.getInstance(painelAberto)?.hide();
      return;
    }

    if (canGoBack) {
      window.history.back();
    } else {
      window.Capacitor.Plugins.App.exitApp();
    }
  });
}

async function fazerLogout() {
  await supabaseClient.auth.signOut();
}

// ==========================================
// RECUPERAÇÃO DE SENHA
// ==========================================
function abrirModalRecuperarSenha() {
  bootstrap.Modal.getInstance(document.getElementById("authModal"))?.hide();
  document.getElementById("reset-email").value =
    document.getElementById("auth-email").value || "";
  document.getElementById("reset-error").style.display = "none";
  new bootstrap.Modal(document.getElementById("resetPasswordModal")).show();
}

async function enviarLinkRecuperacao() {
  const email = document.getElementById("reset-email").value.trim();
  const errorDiv = document.getElementById("reset-error");
  errorDiv.style.display = "none";

  if (!email || !email.includes("@")) {
    errorDiv.textContent = "Digite um e-mail válido.";
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("btn-send-reset");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: isNative ? OAUTH_CALLBACK_URL : window.location.origin,
  });

  btn.disabled = false;
  btn.textContent = "Enviar link de recuperação";

  if (error) {
    errorDiv.textContent = "Erro ao enviar e-mail: " + error.message;
    errorDiv.style.display = "block";
    return;
  }

  bootstrap.Modal.getInstance(
    document.getElementById("resetPasswordModal"),
  ).hide();
  mostrarNotificacao(
    "Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha.",
    "success",
  );
}

async function salvarNovaSenha() {
  const novaSenha = document.getElementById("new-password").value;
  const confirmacao = document.getElementById("new-password-confirm").value;
  const errorDiv = document.getElementById("new-password-error");
  errorDiv.style.display = "none";

  if (!novaSenha || novaSenha.length < 6) {
    errorDiv.textContent = "A senha precisa ter pelo menos 6 caracteres.";
    errorDiv.style.display = "block";
    return;
  }
  if (novaSenha !== confirmacao) {
    errorDiv.textContent = "As senhas não coincidem.";
    errorDiv.style.display = "block";
    return;
  }

  const btn = document.getElementById("btn-save-new-password");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  const { error } = await supabaseClient.auth.updateUser({
    password: novaSenha,
  });

  btn.disabled = false;
  btn.textContent = "Salvar nova senha";

  if (error) {
    errorDiv.textContent = "Erro ao salvar nova senha: " + error.message;
    errorDiv.style.display = "block";
    return;
  }

  bootstrap.Modal.getInstance(
    document.getElementById("newPasswordModal"),
  ).hide();
  mostrarNotificacao("Senha atualizada com sucesso!", "success");
}

// ==========================================
// VARIÁVEIS E IBGE
// ==========================================
let expCount = 0,
  eduCount = 0,
  projCount = 0,
  cursoCount = 0;
const linkPattern = "https?://.+";

async function carregarEstados() {
  const selectEstado = document.getElementById("estado");
  try {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    );
    const estados = await response.json();
    selectEstado.innerHTML =
      "<option value=\"\" disabled selected>Selecione um estado...</option>";
    estados.forEach(
      (estado) =>
        (selectEstado.innerHTML += `<option value="${estado.sigla}">${estado.nome}</option>`),
    );
  } catch (e) {
    selectEstado.innerHTML =
      "<option value=\"\" disabled selected>Erro ao carregar</option>";
  }
}

async function carregarCidades(uf) {
  const selectCidade = document.getElementById("cidade");
  selectCidade.innerHTML =
    "<option value=\"\" disabled selected>Carregando cidades...</option>";
  selectCidade.disabled = true;
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    );
    const cidades = await response.json();
    selectCidade.innerHTML =
      "<option value=\"\" disabled selected>Selecione uma cidade...</option>";
    cidades.forEach(
      (cidade) =>
        (selectCidade.innerHTML += `<option value="${cidade.nome}">${cidade.nome}</option>`),
    );
    selectCidade.disabled = false;
  } catch (e) {
    selectCidade.innerHTML =
      "<option value=\"\" disabled selected>Erro ao carregar</option>";
  }
}

document.getElementById("estado").addEventListener("change", function () {
  carregarCidades(this.value);
});

document.getElementById("phone").addEventListener("input", function (e) {
  let v = e.target.value.replace(/\D/g, "");
  if (v.length > 11) v = v.substring(0, 11);
  if (v.length <= 10) {
    v = v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  } else {
    v = v
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }
  e.target.value = v;
});

// limparUrlPerfil, formatarDataMesAno e toggleDataFim vêm de utils.js
// (carregado antes deste arquivo em index.html) — extraídas de lá para
// poderem ser testadas isoladamente.
["linkedin", "github"].forEach((id) => {
  document.getElementById(id).addEventListener("blur", function () {
    this.value = limparUrlPerfil(this.value.trim());
  });
});

// --- INJEÇÃO DE HTML ---
function adicionarExperiencia() {
  const isReq = document.getElementById("include-experience").checked
    ? "required"
    : "";
  const n = expCount;
  const html = `
    <div class="card mb-3 exp-block shadow-sm border-start border-primary border-4 fade-in" id="exp-${n}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0 text-primary fw-bold h6"><i class="fas fa-building me-2" aria-hidden="true"></i>Nova Experiência</h3>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('exp-${n}')" aria-label="Remover esta experiência"><i class="fas fa-trash-alt" aria-hidden="true"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small" for="exp-company-${n}">Empresa</label><input type="text" id="exp-company-${n}" class="form-control exp-company" ${isReq}></div>
          <div class="col-md-6"><label class="form-label fw-bold text-muted small" for="exp-position-${n}">Cargo</label><input type="text" id="exp-position-${n}" class="form-control exp-position-pt" ${isReq}></div>
        </div>
        <div class="row mb-3">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small" for="exp-start-${n}">Mês/Ano Início</label><input type="month" id="exp-start-${n}" class="form-control exp-start" ${isReq}></div>
          <div class="col-md-6">
            <label class="form-label fw-bold text-muted small" for="exp-end-${n}">Mês/Ano Fim</label>
            <input type="month" id="exp-end-${n}" class="form-control exp-end input-data-fim" ${isReq}>
            <div class="form-check mt-2">
              <input class="form-check-input exp-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-exp-${n}">
              <label class="form-check-label text-primary fw-bold small" for="chk-exp-${n}">Trabalho aqui atualmente</label>
            </div>
          </div>
        </div>
        <div class="mb-2"><label class="form-label fw-bold text-muted small" for="exp-highlights-${n}">Atividades (separe por ";")</label><textarea id="exp-highlights-${n}" class="form-control exp-highlights-pt" rows="3" ${isReq}></textarea></div>
      </div>
    </div>`;
  document
    .getElementById("experiencias-container")
    .insertAdjacentHTML("beforeend", html);
  expCount++;
}

function adicionarFormacao() {
  const isReq = document.getElementById("include-education").checked
    ? "required"
    : "";
  const n = eduCount;
  const html = `
    <div class="card mb-3 edu-block shadow-sm border-start border-info border-4 fade-in" id="edu-${n}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0 text-info fw-bold h6"><i class="fas fa-university me-2" aria-hidden="true"></i>Nova Formação</h3>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('edu-${n}')" aria-label="Remover esta formação"><i class="fas fa-trash-alt" aria-hidden="true"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-6"><label class="form-label fw-bold text-muted small" for="edu-institution-${n}">Instituição</label><input type="text" id="edu-institution-${n}" class="form-control edu-institution" ${isReq}></div>
          <div class="col-md-6"><label class="form-label fw-bold text-muted small" for="edu-area-${n}">Curso</label><input type="text" id="edu-area-${n}" class="form-control edu-area-pt" ${isReq}></div>
        </div>
        <div class="row mb-2">
          <div class="col-md-4"><label class="form-label fw-bold text-muted small" for="edu-start-${n}">Mês/Ano Início</label><input type="month" id="edu-start-${n}" class="form-control edu-start" ${isReq}></div>
          <div class="col-md-4">
            <label class="form-label fw-bold text-muted small" for="edu-end-${n}">Mês/Ano Término</label>
            <input type="month" id="edu-end-${n}" class="form-control edu-end input-data-fim" ${isReq}>
            <div class="form-check mt-2">
              <input class="form-check-input edu-current" type="checkbox" onchange="toggleDataFim(this)" id="chk-edu-${n}">
              <label class="form-check-label text-info fw-bold small" for="chk-edu-${n}">Cursando atualmente</label>
            </div>
          </div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small" for="edu-status-${n}">Status</label><input type="text" id="edu-status-${n}" class="form-control edu-status" ${isReq}></div>
        </div>
      </div>
    </div>`;
  document
    .getElementById("formacao-container")
    .insertAdjacentHTML("beforeend", html);
  eduCount++;
}

function adicionarCurso() {
  const isReq = document.getElementById("include-courses").checked
    ? "required"
    : "";
  const n = cursoCount;
  const html = `
    <div class="card mb-3 curso-block shadow-sm border-start border-success border-4 fade-in" id="curso-${n}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0 text-success fw-bold h6"><i class="fas fa-award me-2" aria-hidden="true"></i>Novo Curso</h3>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('curso-${n}')" aria-label="Remover este curso"><i class="fas fa-trash-alt" aria-hidden="true"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-5"><label class="form-label fw-bold text-muted small" for="curso-name-${n}">Nome do Curso</label><input type="text" id="curso-name-${n}" class="form-control curso-name" ${isReq}></div>
          <div class="col-md-5"><label class="form-label fw-bold text-muted small" for="curso-inst-${n}">Instituição</label><input type="text" id="curso-inst-${n}" class="form-control curso-inst" ${isReq}></div>
          <div class="col-md-2"><label class="form-label fw-bold text-muted small" for="curso-year-${n}">Ano</label><input type="number" id="curso-year-${n}" class="form-control curso-year" value="2024" ${isReq}></div>
        </div>
      </div>
    </div>`;
  document
    .getElementById("cursos-container")
    .insertAdjacentHTML("beforeend", html);
  cursoCount++;
}

function adicionarProjeto() {
  const isReq = document.getElementById("include-projects").checked
    ? "required"
    : "";
  const n = projCount;
  const html = `
    <div class="card mb-3 proj-block shadow-sm border-start border-warning border-4 fade-in" id="proj-${n}">
      <div class="card-body bg-white rounded">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0 text-warning fw-bold h6"><i class="fas fa-code-branch me-2" aria-hidden="true"></i>Novo Projeto</h3>
          <button type="button" class="btn btn-outline-danger btn-sm rounded-pill" onclick="removerElemento('proj-${n}')" aria-label="Remover este projeto"><i class="fas fa-trash-alt" aria-hidden="true"></i> Remover</button>
        </div>
        <div class="row mb-2">
          <div class="col-md-4"><label class="form-label fw-bold text-muted small" for="proj-name-${n}">Nome</label><input type="text" id="proj-name-${n}" class="form-control proj-name" ${isReq}></div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small" for="proj-tech-${n}">Tecnologias</label><input type="text" id="proj-tech-${n}" class="form-control proj-tech" ${isReq}></div>
          <div class="col-md-4"><label class="form-label fw-bold text-muted small" for="proj-link-${n}">Link</label><input type="text" id="proj-link-${n}" class="form-control proj-link" ${isReq} pattern="${linkPattern}"></div>
        </div>
        <div class="mb-2"><label class="form-label fw-bold text-muted small" for="proj-desc-${n}">Descrição</label><textarea id="proj-desc-${n}" class="form-control proj-desc-pt" rows="2" ${isReq}></textarea></div>
      </div>
    </div>`;
  document
    .getElementById("projetos-container")
    .insertAdjacentHTML("beforeend", html);
  projCount++;
}

function removerElemento(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = "0";
    setTimeout(() => {
      el.remove();
      agendarSalvamentoNuvem();
    }, 300);
  }
}

// aplicarObrigatoriedade (utils.js) liga/desliga "required" nos campos de
// texto/data da seção, sem nunca mexer nas caixinhas de checkbox — extraída
// pra cá justamente porque essa distinção já foi um bug real no passado.
[
  ["include-experience", "experiencias-container"],
  ["include-education", "formacao-container"],
  ["include-courses", "cursos-container"],
  ["include-projects", "projetos-container"],
].forEach(([toggleId, containerId]) => {
  document.getElementById(toggleId).addEventListener("change", function () {
    aplicarObrigatoriedade(document.getElementById(containerId), this.checked);
  });
});

// ==========================================
// PERSISTÊNCIA NA NUVEM
// ==========================================
// criarDebouncer (utils.js): agrupa edições rápidas numa só chamada de
// salvamento, mas permite forçar o salvamento imediato antes de trocar de
// currículo (flush) — ver comentário original desse bug em utils.js.
const debouncerSalvamento = criarDebouncer(() => salvarDadosNuvem(), 1500);

function agendarSalvamentoNuvem() {
  if (!currentUser) return;
  debouncerSalvamento.agendar();
}

async function flushSalvamentoPendente() {
  await debouncerSalvamento.flush();
}

async function salvarDadosNuvem() {
  if (!currentUser || !currentResumeId || isSavingToCloud) return;
  try {
    isSavingToCloud = true;
    mostrarStatusSalvamento(true);
    const r = {
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        estado: document.getElementById("estado").value,
        cidade: document.getElementById("cidade").value,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: { pt: [document.getElementById("summary_pt").value] },
      skills: {
        technical: document
          .getElementById("skills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      },
      config: {
        includeExperience:
          document.getElementById("include-experience").checked,
        includeEducation: document.getElementById("include-education").checked,
        includeCourses: document.getElementById("include-courses").checked,
        includeProjects: document.getElementById("include-projects").checked,
        idioma: document.getElementById("idioma_escolhido").value,
      },
      experience: Array.from(document.querySelectorAll(".exp-block")).map(
        (b) => ({
          company: b.querySelector(".exp-company").value,
          position: b.querySelector(".exp-position-pt").value,
          start: b.querySelector(".exp-start").value,
          end: b.querySelector(".exp-end").value,
          isCurrent: b.querySelector(".exp-current").checked,
          highlights: b.querySelector(".exp-highlights-pt").value,
        }),
      ),
      education: Array.from(document.querySelectorAll(".edu-block")).map(
        (b) => ({
          institution: b.querySelector(".edu-institution").value,
          area: b.querySelector(".edu-area-pt").value,
          start: b.querySelector(".edu-start").value,
          end: b.querySelector(".edu-end").value,
          isCurrent: b.querySelector(".edu-current").checked,
          status: b.querySelector(".edu-status").value,
        }),
      ),
      courses: Array.from(document.querySelectorAll(".curso-block")).map(
        (b) => ({
          name: b.querySelector(".curso-name").value,
          institution: b.querySelector(".curso-inst").value,
          year: b.querySelector(".curso-year").value,
        }),
      ),
      projects: Array.from(document.querySelectorAll(".proj-block")).map(
        (b) => ({
          name: b.querySelector(".proj-name").value,
          tech: b.querySelector(".proj-tech").value,
          link: b.querySelector(".proj-link").value,
          desc: b.querySelector(".proj-desc-pt").value,
        }),
      ),
    };
    const { error } = await supabaseClient
      .from("curriculos")
      .update({
        dados: r,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentResumeId);

    if (error) console.error("Erro ao salvar:", error);
  } catch (e) {
    console.error("Erro inesperado:", e);
  } finally {
    isSavingToCloud = false;
    mostrarStatusSalvamento(false);
  }
}

// ==========================================
// GERENCIAMENTO DE MÚLTIPLOS CURRÍCULOS
// ==========================================

// Roda uma vez no login: descobre quais currículos o usuário já tem, escolhe
// qual carregar (o mais recente) e, se for a primeira vez dele no app, cria
// um currículo inicial automaticamente para não deixar o formulário travado
// sem nada pra salvar.
async function iniciarCurriculosDoUsuario(userId) {
  try {
    const { data, error } = await supabaseClient
      .from("curriculos")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw error;

    if (data && data.length > 0) {
      currentResumeId = data[0].id;
    } else {
      currentResumeId = await criarCurriculoNoBanco(userId, "Meu Currículo");
    }
    if (currentResumeId) {
      await carregarCurriculoPorId(currentResumeId);
    }
  } catch (e) {
    console.error("Erro ao iniciar currículos do usuário:", e);
    limparFormulario();
  }
  await carregarListaCurriculos(userId);
}

async function criarCurriculoNoBanco(userId, nome) {
  const { data, error } = await supabaseClient
    .from("curriculos")
    .insert({ user_id: userId, resume_name: nome, dados: {} })
    .select("id")
    .single();
  if (error) {
    console.error("Erro ao criar currículo:", error);
    mostrarNotificacao("Erro ao criar currículo.", "danger");
    return null;
  }
  return data.id;
}

// Preenche o painel lateral "Meus Currículos" com todos os currículos do
// usuário logado, destacando qual está aberto no formulário no momento.
async function carregarListaCurriculos(userId) {
  const lista = document.getElementById("resumesList");
  const { data, error } = await supabaseClient
    .from("curriculos")
    .select("id, resume_name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  lista.innerHTML = "";
  if (error || !data) return;

  data.forEach((r) => {
    const isActive = r.id === currentResumeId;

    const item = document.createElement("div");
    item.className = "resume-item" + (isActive ? " active" : "");

    const nomeTexto = r.resume_name || "Sem nome";

    // Elemento clicável real (button), não uma div — assim funciona
    // nativamente com Tab, Enter/Espaço e leitores de tela.
    const info = document.createElement("button");
    info.type = "button";
    info.className = "btn btn-link text-start p-0 text-decoration-none text-reset";
    info.style.flex = "1";
    info.setAttribute(
      "aria-label",
      (isActive ? "Currículo atual selecionado: " : "Selecionar currículo: ") +
        nomeTexto,
    );
    info.addEventListener("click", () => selecionarCurriculo(r.id));

    const nomeEl = document.createElement("div");
    nomeEl.textContent = nomeTexto;
    if (isActive) {
      const badge = document.createElement("span");
      badge.className = "badge-current";
      badge.textContent = "atual";
      nomeEl.appendChild(badge);
    }

    const dataEl = document.createElement("div");
    dataEl.className = "resume-item-date";
    dataEl.textContent =
      "Atualizado em " + new Date(r.updated_at).toLocaleString("pt-BR");

    info.appendChild(nomeEl);
    info.appendChild(dataEl);

    const acoes = document.createElement("div");

    const btnRenomear = document.createElement("button");
    btnRenomear.type = "button";
    btnRenomear.className = "btn btn-sm btn-outline-secondary me-1";
    btnRenomear.innerHTML = "<i class=\"fas fa-pen\" aria-hidden=\"true\"></i>";
    btnRenomear.title = "Renomear";
    btnRenomear.setAttribute("aria-label", "Renomear currículo: " + nomeTexto);
    btnRenomear.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirModalRenomear(r.id, r.resume_name || "");
    });

    const btnExcluir = document.createElement("button");
    btnExcluir.type = "button";
    btnExcluir.className = "btn btn-sm btn-outline-danger";
    btnExcluir.innerHTML = "<i class=\"fas fa-trash-alt\" aria-hidden=\"true\"></i>";
    btnExcluir.title = "Excluir";
    btnExcluir.setAttribute("aria-label", "Excluir currículo: " + nomeTexto);
    btnExcluir.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirCurriculo(r.id);
    });

    acoes.appendChild(btnRenomear);
    acoes.appendChild(btnExcluir);

    item.appendChild(info);
    item.appendChild(acoes);
    lista.appendChild(item);
  });
}

// Troca o currículo em edição no formulário para outro já existente.
async function selecionarCurriculo(id) {
  if (id === currentResumeId) return;
  await flushSalvamentoPendente();
  currentResumeId = id;
  await carregarCurriculoPorId(id);
  await carregarListaCurriculos(currentUser.id);
  const painel = document.getElementById("resumePanel");
  const instancia =
    bootstrap.Offcanvas.getInstance(painel) || new bootstrap.Offcanvas(painel);
  instancia.hide();
}

async function excluirCurriculo(id) {
  if (!confirm("Excluir este currículo? Essa ação não pode ser desfeita."))
    return;

  const { error } = await supabaseClient
    .from("curriculos")
    .delete()
    .eq("id", id);
  if (error) {
    mostrarNotificacao("Erro ao excluir currículo.", "danger");
    return;
  }

  if (id === currentResumeId) {
    // Cancela qualquer autosave pendente sem salvar: não faz sentido gravar
    // dados num currículo que acabamos de excluir.
    debouncerSalvamento.cancelar();

    // Precisa de outro currículo pra assumir a edição (ou criar um novo se
    // esse era o único que o usuário tinha).
    const { data } = await supabaseClient
      .from("curriculos")
      .select("id")
      .eq("user_id", currentUser.id)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      currentResumeId = data[0].id;
      await carregarCurriculoPorId(currentResumeId);
    } else {
      currentResumeId = await criarCurriculoNoBanco(
        currentUser.id,
        "Meu Currículo",
      );
      if (currentResumeId) await carregarCurriculoPorId(currentResumeId);
    }
  }
  await carregarListaCurriculos(currentUser.id);
  mostrarNotificacao("Currículo excluído.", "info");
}

function abrirModalNovoCurriculo() {
  modalMode = "new";
  modalTargetId = null;
  document.getElementById("resumeModalTitle").textContent = "Novo Currículo";
  document.getElementById("resumeNameInput").value = "";
  new bootstrap.Modal(document.getElementById("resumeModal")).show();
}

function abrirModalRenomear(id, nomeAtual) {
  modalMode = "rename";
  modalTargetId = id;
  document.getElementById("resumeModalTitle").textContent =
    "Renomear Currículo";
  document.getElementById("resumeNameInput").value = nomeAtual;
  new bootstrap.Modal(document.getElementById("resumeModal")).show();
}

document
  .getElementById("saveResumeNameBtn")
  .addEventListener("click", async () => {
    const nome = document.getElementById("resumeNameInput").value.trim();
    if (!nome) {
      mostrarNotificacao("Informe um nome para o currículo.", "danger");
      return;
    }
    if (!currentUser) return;

    if (modalMode === "new") {
      await flushSalvamentoPendente();
      const novoId = await criarCurriculoNoBanco(currentUser.id, nome);
      if (!novoId) return;
      currentResumeId = novoId;
      limparFormulario();
      document.getElementById("current-resume-title").textContent = nome;
      await carregarListaCurriculos(currentUser.id);
      mostrarNotificacao("Currículo criado! Comece a preencher.", "success");
    } else if (modalMode === "rename") {
      const { error } = await supabaseClient
        .from("curriculos")
        .update({ resume_name: nome })
        .eq("id", modalTargetId);
      if (error) {
        mostrarNotificacao("Erro ao renomear currículo.", "danger");
        return;
      }
      if (modalTargetId === currentResumeId) {
        document.getElementById("current-resume-title").textContent = nome;
      }
      await carregarListaCurriculos(currentUser.id);
    }

    bootstrap.Modal.getInstance(document.getElementById("resumeModal")).hide();
  });

async function carregarCurriculoPorId(id) {
  if (isLoadingResume) return;
  isLoadingResume = true;

  // Limpeza total antes de carregar para evitar duplicação
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
  expCount = 0;
  eduCount = 0;
  projCount = 0;
  cursoCount = 0;

  try {
    const { data, error } = await supabaseClient
      .from("curriculos")
      .select("dados, resume_name")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) throw new Error("Sem dados");

    document.getElementById("current-resume-title").textContent =
      data.resume_name || "Sem nome";
    const r = data.dados || {};

    document.getElementById("name").value = r.basics?.name || "";
    document.getElementById("label_pt").value = r.basics?.label_pt || "";
    document.getElementById("email").value = r.basics?.email || "";
    document.getElementById("phone").value = r.basics?.phone || "";
    document.getElementById("linkedin").value = r.basics?.linkedin || "";
    document.getElementById("github").value = r.basics?.github || "";
    document.getElementById("summary_pt").value = r.summary?.pt?.[0] || "";
    document.getElementById("skills").value =
      r.skills?.technical?.join(", ") || "";

    // Restaura o estado de cada toggle "Incluir no PDF?" ANTES de recriar os
    // blocos abaixo, já que adicionarExperiencia/Formacao/Curso/Projeto leem
    // o checkbox correspondente para decidir se os campos são obrigatórios.
    const cfg = r.config || {};
    document.getElementById("include-experience").checked =
      cfg.includeExperience !== false;
    document.getElementById("include-education").checked =
      cfg.includeEducation !== false;
    document.getElementById("include-courses").checked =
      cfg.includeCourses !== false;
    document.getElementById("include-projects").checked =
      cfg.includeProjects !== false;

    if (r.basics?.estado) {
      document.getElementById("estado").value = r.basics.estado;
      await carregarCidades(r.basics.estado);
      if (r.basics.cidade)
        document.getElementById("cidade").value = r.basics.cidade;
    }

    // Carregamento dinâmico
    if (r.experience?.length) {
      r.experience.forEach((e) => {
        adicionarExperiencia();
        const b = document.getElementById(`exp-${expCount - 1}`);
        b.querySelector(".exp-company").value = e.company || "";
        b.querySelector(".exp-position-pt").value = e.position || "";
        b.querySelector(".exp-start").value = e.start || "";
        b.querySelector(".exp-current").checked = e.isCurrent || false;
        toggleDataFim(b.querySelector(".exp-current"));
        b.querySelector(".exp-end").value = e.end || "";
        b.querySelector(".exp-highlights-pt").value = e.highlights || "";
      });
    } else {
      adicionarExperiencia();
    }

    if (r.education?.length) {
      r.education.forEach((e) => {
        adicionarFormacao();
        const b = document.getElementById(`edu-${eduCount - 1}`);
        b.querySelector(".edu-institution").value = e.institution || "";
        b.querySelector(".edu-area-pt").value = e.area || "";
        b.querySelector(".edu-start").value = e.start || "";
        b.querySelector(".edu-current").checked = e.isCurrent || false;
        toggleDataFim(b.querySelector(".edu-current"));
        b.querySelector(".edu-end").value = e.end || "";
        b.querySelector(".edu-status").value = e.status || "";
      });
    } else {
      adicionarFormacao();
    }

    if (r.courses?.length) {
      r.courses.forEach((c) => {
        adicionarCurso();
        const b = document.getElementById(`curso-${cursoCount - 1}`);
        b.querySelector(".curso-name").value = c.name || "";
        b.querySelector(".curso-inst").value = c.institution || "";
        b.querySelector(".curso-year").value = c.year || "";
      });
    } else {
      adicionarCurso();
    }

    if (r.projects?.length) {
      r.projects.forEach((p) => {
        adicionarProjeto();
        const b = document.getElementById(`proj-${projCount - 1}`);
        b.querySelector(".proj-name").value = p.name || "";
        b.querySelector(".proj-tech").value = p.tech || "";
        b.querySelector(".proj-link").value = p.link || "";
        b.querySelector(".proj-desc-pt").value = p.desc || "";
      });
    } else {
      adicionarProjeto();
    }

    mostrarNotificacao("Currículo carregado com sucesso!", "info");
  } catch (e) {
    // Se der erro ou não tiver dados, garante que o formulário tenha exatamente um bloco de cada
    if (expCount === 0) adicionarExperiencia();
    if (eduCount === 0) adicionarFormacao();
    if (cursoCount === 0) adicionarCurso();
    if (projCount === 0) adicionarProjeto();
  } finally {
    isLoadingResume = false;
  }
}

function limparFormulario() {
  document.getElementById("cv-form").reset();
  document.getElementById("experiencias-container").innerHTML = "";
  document.getElementById("formacao-container").innerHTML = "";
  document.getElementById("cursos-container").innerHTML = "";
  document.getElementById("projetos-container").innerHTML = "";
  expCount = 0;
  eduCount = 0;
  projCount = 0;
  cursoCount = 0;
  adicionarExperiencia();
  adicionarFormacao();
  adicionarCurso();
  adicionarProjeto();
}

function mostrarStatusSalvamento(s = true) {
  const i = document.getElementById("save-status-indicator");
  if (!i) return;
  if (s) {
    i.classList.add("saving");
    i.style.display = "block";
    document.getElementById("save-status-text").textContent = "Salvando...";
  } else {
    i.classList.remove("saving");
    document.getElementById("save-status-text").textContent = "Salvo";
    setTimeout(() => (i.style.display = "none"), 2000);
  }
}

function mostrarNotificacao(m, t = "info") {
  const c = document.getElementById("notificacoes-container");
  if (!c) return;
  const a = document.createElement("div");
  a.className = `alert alert-${t} alert-dismissible fade show`;
  a.innerHTML = `${m}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar notificação"></button>`;
  c.appendChild(a);
  setTimeout(() => a.remove(), 5000);
}

document
  .getElementById("cv-form")
  .addEventListener("input", agendarSalvamentoNuvem);
document
  .getElementById("cv-form")
  .addEventListener("change", agendarSalvamentoNuvem);

window.onload = async function () {
  await carregarEstados();
  await checarSessao();
};

document
  .getElementById("cv-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
      this.classList.add("was-validated");
      mostrarNotificacao("Verifique os campos obrigatórios.", "danger");
      return;
    }
    if (!currentUser) {
      new bootstrap.Modal(document.getElementById("authModal")).show();
      return;
    }
    const b = document.getElementById("btn-gerar");
    const h = b.innerHTML;
    b.innerHTML =
      "<i class=\"fas fa-spinner fa-spin me-2\" aria-hidden=\"true\"></i> Gerando...";
    b.disabled = true;
    await salvarDadosNuvem();
    const p = {
      lang: document.getElementById("idioma_escolhido").value,
      basics: {
        name: document.getElementById("name").value,
        label_pt: document.getElementById("label_pt").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        location: `${document.getElementById("cidade").value}, ${document.getElementById("estado").value}`,
        linkedin: document.getElementById("linkedin").value,
        github: document.getElementById("github").value,
      },
      summary: { pt: [document.getElementById("summary_pt").value] },
      experience: document.getElementById("include-experience").checked
        ? Array.from(document.querySelectorAll(".exp-block")).map((b) => ({
          company: b.querySelector(".exp-company").value,
          position_pt: b.querySelector(".exp-position-pt").value,
          startDate: formatarDataMesAno(b.querySelector(".exp-start").value),
          endDate: b.querySelector(".exp-current").checked
            ? "Presente"
            : formatarDataMesAno(b.querySelector(".exp-end").value),
          highlights_pt: b
            .querySelector(".exp-highlights-pt")
            .value.split(";")
            .map((i) => i.trim())
            .filter((i) => i),
        }))
        : [],
      education: document.getElementById("include-education").checked
        ? Array.from(document.querySelectorAll(".edu-block")).map((b) => ({
          institution: b.querySelector(".edu-institution").value,
          area_pt: b.querySelector(".edu-area-pt").value,
          startDate: formatarDataMesAno(b.querySelector(".edu-start").value),
          endDate: b.querySelector(".edu-current").checked
            ? "Presente"
            : formatarDataMesAno(b.querySelector(".edu-end").value),
          status_pt: b.querySelector(".edu-status").value,
        }))
        : [],
      courses: document.getElementById("include-courses").checked
        ? Array.from(document.querySelectorAll(".curso-block")).map((b) => ({
          name_pt: b.querySelector(".curso-name").value,
          institution: b.querySelector(".curso-inst").value,
          year: b.querySelector(".curso-year").value,
        }))
        : [],
      projects: document.getElementById("include-projects").checked
        ? Array.from(document.querySelectorAll(".proj-block")).map((b) => ({
          name: b.querySelector(".proj-name").value,
          technologies: b.querySelector(".proj-tech").value,
          link: b.querySelector(".proj-link").value,
          description_pt: b.querySelector(".proj-desc-pt").value,
        }))
        : [],
      skills: {
        technical: document
          .getElementById("skills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      },
    };
    try {
      const res = await fetch(`${API_BASE_URL}/generate-cv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!res.ok) {
        let mensagem = "Erro ao gerar PDF.";
        try {
          const erroJson = await res.json();
          mensagem = erroJson.erro || mensagem;
        } catch (_) {
          // resposta de erro não veio em JSON, mantém mensagem padrão
        }
        mostrarNotificacao(mensagem, "danger");
        return;
      }
      const blob = await res.blob();
      const nomeArquivo = `${document.getElementById("name").value.trim().replace(/\s+/g, "_")}_curriculo.pdf`;

      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // Dentro do app, o truque de <a download> do navegador não funciona
        // (o WebView não tem gerenciador de downloads). Em vez disso,
        // gravamos o PDF no armazenamento do app e abrimos a folha nativa
        // de compartilhamento/salvamento do Android/iOS.
        const base64Data = await blobParaBase64(blob);
        const { Filesystem, Share } = window.Capacitor.Plugins;
        const arquivo = await Filesystem.writeFile({
          path: nomeArquivo,
          data: base64Data,
          directory: "CACHE",
        });
        await Share.share({
          title: "Currículo em PDF",
          url: arquivo.uri,
          dialogTitle: "Salvar ou compartilhar currículo",
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        a.click();
      }
      mostrarNotificacao("PDF gerado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao gerar/salvar PDF:", err);
      mostrarNotificacao("Erro ao gerar PDF.", "danger");
    } finally {
      b.innerHTML = h;
      b.disabled = false;
    }
  });
