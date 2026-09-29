/* ============================================================
   广州拓算智云科技有限公司 — 官网交互脚本
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 导航：滚动态 + 移动端菜单 ---------- */
  function initNav() {
    var nav = $(".nav");
    var burger = $(".nav__burger");
    var menu = $(".nav__menu");

    function onScroll() {
      if (window.scrollY > 20) nav.classList.add("is-stuck");
      else nav.classList.remove("is-stuck");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (burger && menu) {
      burger.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });

      // 点击菜单项后自动收起
      $$(".nav__link", menu).forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          burger.classList.remove("is-open");
        });
      });

      // 点击空白处收起
      document.addEventListener("click", function (e) {
        if (!menu.classList.contains("is-open")) return;
        if (menu.contains(e.target) || burger.contains(e.target)) return;
        menu.classList.remove("is-open");
        burger.classList.remove("is-open");
      });
    }
  }

  /* ---------- 1.5 亮/暗主题切换 ---------- */
  function initTheme() {
    var btn = $(".theme-toggle");
    if (!btn) return;

    function sync() {
      var isDark = document.documentElement.getAttribute("data-theme") !== "light";
      btn.setAttribute("aria-pressed", String(!isDark));
      btn.setAttribute("aria-label", isDark ? "切换到亮色模式" : "切换到暗色模式");
      btn.title = isDark ? "切换到亮色模式" : "切换到暗色模式";
    }

    sync();

    btn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("tszy-theme", next); } catch (e) {}
      sync();
      if (typeof window.__tszyApplyParticleTheme === "function") {
        window.__tszyApplyParticleTheme(next);
      }
    });
  }

  /* ---------- 2. 当前页面导航高亮 ---------- */
  function initActiveLink() {
    var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!file || file === "/") file = "index.html";

    $$(".nav__link").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      var target = href.split("#")[0].split("/").pop();
      if (target === file) a.classList.add("is-active");
    });
  }

  /* ---------- 3. 滚动入场动画 ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var delay = parseInt(el.dataset.delay || "0", 10);
        setTimeout(function () { el.classList.add("is-in"); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 4. 数字滚动计数 ---------- */
  function initCounters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;

    function run(el) {
      var raw = el.getAttribute("data-count") || "0";
      var num = parseFloat(raw);
      if (isNaN(num)) { el.textContent = raw; return; }

      var suffix = el.getAttribute("data-suffix") || "";
      var prefix = el.getAttribute("data-prefix") || "";
      var dur = 1500;
      var start = null;

      function tick(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(num * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + raw + suffix;
      }

      if (reduceMotion) { el.textContent = prefix + raw + suffix; return; }
      requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(run);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        run(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. 卡片跟随鼠标的光晕 ---------- */
  function initCardGlow() {
    if (window.matchMedia("(hover: none)").matches) return;

    $$(".card, .stat, .step, .cert, .case").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---------- 6. 客户评价轮播 ---------- */
  function initSlider() {
    var slider = $(".slider");
    if (!slider) return;

    var slides = $$(".slide", slider);
    var dots = $$(".slider__dot", slider);
    var prev = $(".slider__btn--prev", slider);
    var next = $(".slider__btn--next", slider);
    if (slides.length < 1) return;

    var idx = 0;
    var timer = null;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === idx); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === idx); });
    }

    function play() {
      stop();
      if (reduceMotion) return;
      timer = setInterval(function () { show(idx + 1); }, 6000);
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    if (next) next.addEventListener("click", function () { show(idx + 1); play(); });
    if (prev) prev.addEventListener("click", function () { show(idx - 1); play(); });
    dots.forEach(function (d, n) {
      d.addEventListener("click", function () { show(n); play(); });
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", play);

    show(0);
    play();
  }

  /* ---------- 7. 返回顶部 ---------- */
  function initToTop() {
    var btn = $(".to-top");
    if (!btn) return;

    function onScroll() {
      btn.classList.toggle("is-show", window.scrollY > 620);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- 8. Hero 粒子网络背景 ---------- */
  function initParticles() {
    var canvas = document.getElementById("particle-canvas");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var dots = [];
    var raf = null;
    var running = true;

    // 粒子配色随主题切换（亮色下改用更深的蓝，保证可见）
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    var dotFill = isLight ? "rgba(37,99,235,0.6)" : "rgba(140,190,255,0.72)";
    var lineBase = isLight ? "rgba(37,99,235," : "rgba(96,165,250,";

    window.__tszyApplyParticleTheme = function (th) {
      isLight = th === "light";
      dotFill = isLight ? "rgba(37,99,235,0.6)" : "rgba(140,190,255,0.72)";
      lineBase = isLight ? "rgba(37,99,235," : "rgba(96,165,250,";
    };

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(Math.round((w * h) / 15000), 88);
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.34,
          vy: (Math.random() - 0.5) * 0.34,
          r: Math.random() * 1.7 + 0.7
        });
      }
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var linkDist = Math.min(w, h) * 0.16;

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;

        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(140, 190, 255, 0.72)";
        ctx.fill();

        for (var j = i + 1; j < dots.length; j++) {
          var o = dots[j];
          var dx = d.x - o.x;
          var dy = d.y - o.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > linkDist) continue;

          var alpha = (1 - dist / linkDist) * 0.2;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = lineBase + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 220);
    });

    // 页面不可见时暂停，省电
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        draw();
      }
    });

    resize();
    draw();
  }

  /* ---------- 9. 联系表单（前端演示，无后端） ---------- */
  function initForm() {
    var form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var required = $$("[required]", form);
      var bad = null;

      required.forEach(function (el) {
        el.style.borderColor = "";
        if (!el.value.trim()) bad = bad || el;
      });

      if (bad) {
        bad.style.borderColor = "rgba(248, 113, 113, 0.75)";
        bad.focus();
        return;
      }

      var ok = $(".form-ok");
      if (ok) ok.classList.add("is-show");
      form.reset();
    });
  }

  /* ---------- 10. 平滑锚点（兼容 fixed 导航偏移） ---------- */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initNav();
    initTheme();
    initActiveLink();
    initReveal();
    initCounters();
    initCardGlow();
    initSlider();
    initToTop();
    initParticles();
    initForm();
    initAnchors();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
