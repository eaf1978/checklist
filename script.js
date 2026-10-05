(() => {
  const STORAGE_KEY = "guia-gravacao-checklist-v2";
  const OLD_KEY = "guia-gravacao-checklist-v1";
  const THEME_KEY = "guia-gravacao-theme-v1";
  const root = document.documentElement;
  const checks = [...document.querySelectorAll('input[type="checkbox"]')];
  const $ = id => document.getElementById(id);
  const toast = $("toast");

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function updateProgress() {
    const done = checks.filter(c => c.checked).length;
    const total = checks.length;
    const all = done === total;
    $("progressText").textContent = `${done} de ${total}`;
    $("progressFill").style.width = `${total ? Math.round(done / total * 100) : 0}%`;
    $("progressTrack").setAttribute("aria-valuenow", done);
    $("progressNote").textContent = all ? "Tudo pronto. Boa gravação!" : done ? "Continue no seu ritmo." : "Marque cada etapa conforme concluir.";
    $("finishTitle").textContent = all ? "Tudo pronto para gravar!" : "Seu preparo começa aqui.";
    $("finishMessage").textContent = all ? "Checklist completo. Respire e comece." : "O progresso fica salvo neste aparelho. Pode fechar e voltar depois.";
    $("footer").classList.toggle("is-done", all);
    document.querySelectorAll(".group").forEach(section => {
      const items = checks.filter(c => c.dataset.group === section.dataset.section);
      const n = items.filter(c => c.checked).length;
      const counter = section.querySelector(".group-count");
      counter.textContent = `${n}/${items.length}`;
      counter.setAttribute("aria-label", `${n} de ${items.length} concluídos`);
      section.classList.toggle("is-done", n === items.length);
    });
  }

  function save() {
    const state = {};
    checks.forEach(c => { if (c.checked) state[c.dataset.id] = true; });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    updateProgress();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw) || {};
      checks.forEach(c => { c.checked = Boolean(state[c.dataset.id]); });
    } else {
      // migra progresso salvo na versão anterior (lista por posição)
      const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
      if (Array.isArray(old)) checks.forEach((c, i) => { c.checked = Boolean(old[i]); });
    }
  } catch (_) {}

  checks.forEach(c => c.addEventListener("change", () => {
    if (c.checked && navigator.vibrate) navigator.vibrate(12);
    save();
  }));

  function setTheme(dark, persist) {
    root.dataset.theme = dark ? "dark" : "light";
    const btn = $("themeToggle");
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    $("themeLabel").textContent = dark ? "Modo claro" : "Modo escuro";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#11181d" : "#f4f6f8";
    if (persist) try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch (_) {}
  }
  setTheme(root.dataset.theme === "dark", false);
  $("themeToggle").addEventListener("click", () => setTheme(root.dataset.theme !== "dark", true));

  const dialog = $("resetDialog");
  function resetAll() {
    checks.forEach(c => { c.checked = false; });
    save();
    showToast("Checklist reiniciado.");
  }
  $("resetButton").addEventListener("click", () => {
    if (!checks.some(c => c.checked)) return showToast("O checklist já está zerado.");
    if (typeof dialog.showModal === "function") dialog.showModal();
    else if (confirm("Desmarcar todas as tarefas? Não dá para desfazer.")) resetAll();
  });
  $("resetCancel").addEventListener("click", () => dialog.close());
  $("resetConfirm").addEventListener("click", () => { dialog.close(); resetAll(); });
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

  updateProgress();
})();
