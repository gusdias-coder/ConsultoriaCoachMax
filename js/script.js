(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const WA = "5551980130227";
  const header = $(".site-header");

  /* ---------- Entrada da página ---------- */
  const ready = () => requestAnimationFrame(() => root.classList.add("ready"));
  if (document.readyState === "complete") ready(); else addEventListener("load", ready);
  setTimeout(ready, 1800);

  /* ---------- Menu mobile ---------- */
  const toggle = $(".menu-toggle"), nav = $("#main-nav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  addEventListener("resize", () => innerWidth > 1040 && setMenu(false));

  /* ---------- Rolagem suave com easing ---------- */
  let raf = 0;
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const stop = () => cancelAnimationFrame(raf);
  ["wheel", "touchstart", "keydown"].forEach((ev) => addEventListener(ev, stop, { passive: true }));
  function glideTo(y) {
    stop();
    const from = scrollY, dist = y - from;
    if (reduce || Math.abs(dist) < 2) return scrollTo(0, y);
    const dur = Math.min(1500, Math.max(800, Math.abs(dist) * .55));
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      scrollTo(0, from + dist * ease(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = id === "#topo" ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    const y = id === "#inicio" || id === "#topo" ? 0 : target.getBoundingClientRect().top + scrollY - 63;
    setTimeout(() => glideTo(y), nav.classList.contains("is-open") ? 0 : 0);
    history.replaceState(null, "", id);
  }));

  /* ---------- Header, progresso, parallax ---------- */
  const bar = $(".progress i"), wa = $(".floating-wa");
  const par = $$("[data-parallax]");
  let ticking = false;
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 24);
    bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    wa.classList.toggle("show", y > innerHeight * .6);
    if (!reduce && innerWidth > 0) par.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      img.style.setProperty("--py", `${(-p * 6).toFixed(2)}%`);
    });
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Revelações ao rolar ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------- Menu ativo + indicador deslizante ---------- */
  const links = $$("#main-nav a:not(.nav-cta)");
  const ind = $(".nav-indicator");
  function moveInd(a) {
    if (!a || innerWidth <= 1040) return;
    ind.style.opacity = 1;
    ind.style.width = a.offsetWidth - 28 + "px";
    ind.style.transform = `translateX(${a.offsetLeft + 14}px)`;
  }
  const secs = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const a = links.find((l) => l.getAttribute("href") === "#" + en.target.id);
    links.forEach((l) => l.classList.toggle("active", l === a));
    moveInd(a);
  }), { rootMargin: "-45% 0px -50% 0px" });
  secs.forEach((s) => spy.observe(s));
  addEventListener("resize", () => moveInd($("#main-nav a.active")));

  /* ---------- Botões magnéticos + tilt do hero (só com mouse) ---------- */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * .15).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * .25).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
    const hv = $(".hero-visual"), hf = $(".hero-frame");
    hv.addEventListener("pointermove", (e) => {
      const r = hv.getBoundingClientRect();
      hf.style.setProperty("--ry", (((e.clientX - r.left) / r.width - .5) * 8).toFixed(2) + "deg");
      hf.style.setProperty("--rx", (((e.clientY - r.top) / r.height - .5) * -6).toFixed(2) + "deg");
    });
    hv.addEventListener("pointerleave", () => { hf.style.setProperty("--ry", "0deg"); hf.style.setProperty("--rx", "0deg"); });
  }

  /* ---------- Vídeo da hero: autoplay, loop e transição suave ---------- */
  const vid = $(".hero-video");
  if (vid) {
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.loop = true;
    vid.setAttribute("muted", "");
    vid.setAttribute("playsinline", "");
    vid.setAttribute("loop", "");

    let heroVisible = true;
    let loopTimer = 0;
    const show = () => vid.classList.add("is-ready");
    vid.addEventListener("playing", show, { once: true });

    // O loop nativo evita reinicializações manuais; preload e poster cobrem o carregamento.
    const play = () => {
      if (reduce || document.hidden || !heroVisible) return;
      const attempt = vid.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(() => {
        // Alguns navegadores só permitem iniciar o vídeo após a primeira interação.
      });
    };
    const pause = () => vid.pause();

    if (reduce) {
      vid.removeAttribute("autoplay");
      pause();
      vid.classList.add("is-ready");
    } else {
      play();
      addEventListener("touchstart", play, { once: true, passive: true });
      addEventListener("pointerdown", play, { once: true, passive: true });
      const heroObserver = new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting;
        if (heroVisible) play(); else pause();
      }, { threshold: .08 });
      heroObserver.observe(vid);
      document.addEventListener("visibilitychange", () => document.hidden ? pause() : play());

      // Proteção para browsers que ficam presos num estado de pausa após voltar à aba.
      vid.addEventListener("ended", () => { vid.currentTime = 0; play(); });
      vid.addEventListener("error", () => vid.classList.remove("is-ready"));
      vid.addEventListener("canplay", () => { if (!document.hidden && heroVisible) play(); }, { once: true });
    }
  }

  /* ---------- Planos → WhatsApp ---------- */
  const PLANS = [
    { id: "Mensal", label: "Plano Mensal", sub: "Para começar · 1 mês", note: "começar com um ciclo mensal" },
    { id: "Bimestral", label: "Plano Bimestral", sub: "Para ganhar continuidade · 2 meses", note: "ganhar continuidade em dois meses" },
    { id: "Trimestral", label: "Plano Trimestral", sub: "Para construir consistência · 3 meses", note: "construir consistência ao longo de três meses", rec: true }
  ];
  const makeMsg = (service, p) =>
    `Olá, Herbert! Vim pelo site e tenho interesse na ${service}, no ${p.label} (${p.sub.split(" · ")[1]}). Quero ${p.note}. Pode me passar as condições e o investimento?`;

  $$(".plans").forEach((box) => {
    const service = box.dataset.service, name = "plano-" + box.dataset.group;
    box.setAttribute("role", "radiogroup");
    box.setAttribute("aria-label", "Plano de " + service);
    box.innerHTML = PLANS.map((p) => `
      <label class="plan"><input type="radio" name="${name}" value="${p.id}"${p.rec ? " checked" : ""}>
        <span class="plan-body">
          <span class="plan-check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
          <span class="plan-text"><b>${p.label}</b><small>${p.sub}</small></span>
          ${p.rec ? '<span class="badge">Recomendado</span>' : ""}
        </span></label>`).join("") +
      `<div class="plan-send"><div class="bubble" aria-live="polite"></div>
        <a class="btn btn-wa" target="_blank" rel="noopener noreferrer"><span>Enviar no WhatsApp</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div>`;
    const bubble = $(".bubble", box), cta = $(".btn-wa", box);
    const update = (id, animate) => {
      const p = PLANS.find((x) => x.id === id), msg = makeMsg(service, p);
      cta.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
      bubble.innerHTML = `<small>Mensagem que será enviada</small>${msg}`;
      if (animate) { bubble.classList.remove("swap"); void bubble.offsetWidth; bubble.classList.add("swap"); }
    };
    update("Trimestral", false);
    $$("input", box).forEach((inp) => inp.addEventListener("change", () => {
      update(inp.value, true);
      const body = inp.nextElementSibling;
      const r = body.getBoundingClientRect(), s = document.createElement("span");
      s.className = "ripple";
      s.style.left = (box._x ?? r.width / 2) + "px"; s.style.top = (box._y ?? r.height / 2) + "px";
      body.appendChild(s); setTimeout(() => s.remove(), 900);
    }));
    $$(".plan", box).forEach((l) => l.addEventListener("pointerdown", (e) => {
      const r = l.getBoundingClientRect(); box._x = e.clientX - r.left; box._y = e.clientY - r.top;
    }));
  });

  /* ---------- FAQ (acordeão animado) ---------- */
  const items = $$(".acc-item");
  items.forEach((it) => $("button", it).addEventListener("click", () => {
    const open = !it.classList.contains("open");
    items.forEach((o) => { o.classList.remove("open"); $("button", o).setAttribute("aria-expanded", "false"); });
    if (open) { it.classList.add("open"); $("button", it).setAttribute("aria-expanded", "true"); }
  }));

  const y = $("#current-year"); if (y) y.textContent = new Date().getFullYear();
})();
