// accessibility.js
// Controla o painel flutuante de opções de acessibilidade: tamanho da
// fonte, modo de alto contraste e redução de movimento. As preferências
// são salvas no localStorage e reaplicadas a cada visita.

(function () {
  const STORAGE_KEY = "curricula-a11y-prefs";
  const root = document.documentElement;

  function lerPreferencias() {
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        fontSize: salvo.fontSize || "normal",
        highContrast: !!salvo.highContrast,
        reduceMotion: !!salvo.reduceMotion,
      };
    } catch {
      return { fontSize: "normal", highContrast: false, reduceMotion: false };
    }
  }

  function salvarPreferencias(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Se localStorage estiver indisponível (ex: modo privado em alguns
      // navegadores), a aplicação continua funcionando sem persistência.
    }
  }

  function aplicarFontSize(tamanho) {
    root.classList.remove("a11y-font-md", "a11y-font-lg");
    if (tamanho === "md") root.classList.add("a11y-font-md");
    if (tamanho === "lg") root.classList.add("a11y-font-lg");

    document
      .querySelectorAll("#a11y-font-group button")
      .forEach((btn) => {
        btn.setAttribute(
          "aria-pressed",
          btn.dataset.fontSize === tamanho ? "true" : "false",
        );
      });
  }

  function aplicarHighContrast(ativo) {
    root.classList.toggle("a11y-high-contrast", ativo);
    const chk = document.getElementById("a11y-high-contrast");
    if (chk) chk.checked = ativo;
  }

  function aplicarReduceMotion(ativo) {
    root.classList.toggle("a11y-reduce-motion", ativo);
    const chk = document.getElementById("a11y-reduce-motion");
    if (chk) chk.checked = ativo;
  }

  function aplicarTudo(prefs) {
    aplicarFontSize(prefs.fontSize);
    aplicarHighContrast(prefs.highContrast);
    aplicarReduceMotion(prefs.reduceMotion);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const prefs = lerPreferencias();
    aplicarTudo(prefs);

    const toggleBtn = document.getElementById("a11y-toggle-btn");
    const panel = document.getElementById("a11y-panel");
    if (!toggleBtn || !panel) return;

    function abrirPainel() {
      panel.classList.add("open");
      toggleBtn.setAttribute("aria-expanded", "true");
      const primeiroFoco = panel.querySelector(
        "button, input, [tabindex]",
      );
      if (primeiroFoco) primeiroFoco.focus();
    }

    function fecharPainel({ devolverFoco = false } = {}) {
      panel.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      if (devolverFoco) toggleBtn.focus();
    }

    toggleBtn.addEventListener("click", function () {
      const aberto = panel.classList.contains("open");
      if (aberto) {
        fecharPainel();
      } else {
        abrirPainel();
      }
    });

    // Fecha com Esc, devolvendo o foco ao botão que abriu o painel.
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        fecharPainel({ devolverFoco: true });
      }
    });

    // Fecha ao clicar fora do painel/botão.
    document.addEventListener("click", function (e) {
      if (
        panel.classList.contains("open") &&
        !panel.contains(e.target) &&
        e.target !== toggleBtn &&
        !toggleBtn.contains(e.target)
      ) {
        fecharPainel();
      }
    });

    document
      .querySelectorAll("#a11y-font-group button")
      .forEach((btn) => {
        btn.addEventListener("click", function () {
          const novoTamanho = btn.dataset.fontSize;
          const atuais = lerPreferencias();
          atuais.fontSize = novoTamanho;
          salvarPreferencias(atuais);
          aplicarFontSize(novoTamanho);
        });
      });

    const chkContraste = document.getElementById("a11y-high-contrast");
    if (chkContraste) {
      chkContraste.addEventListener("change", function () {
        const atuais = lerPreferencias();
        atuais.highContrast = chkContraste.checked;
        salvarPreferencias(atuais);
        aplicarHighContrast(chkContraste.checked);
      });
    }

    const chkMovimento = document.getElementById("a11y-reduce-motion");
    if (chkMovimento) {
      chkMovimento.addEventListener("change", function () {
        const atuais = lerPreferencias();
        atuais.reduceMotion = chkMovimento.checked;
        salvarPreferencias(atuais);
        aplicarReduceMotion(chkMovimento.checked);
      });
    }
  });
})();
