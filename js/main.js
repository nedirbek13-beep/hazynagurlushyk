/* ==========================================================
   Hazyna Gurluşyk — shared site behavior (all pages)
   Language model: base text = EN in markup; every translatable
   element carries data-ru (innerHTML) / data-ru-ph (placeholder).
   ========================================================== */
(function () {
  "use strict";

  /* ---------- Language (EN / RU) ---------- */
  var LANG_KEY = "hg-lang";
  var current = "en";

  function applyLang(lang) {
    current = lang === "ru" ? "ru" : "en";

    document.querySelectorAll("[data-ru]").forEach(function (el) {
      if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML;
      el.innerHTML = current === "ru" ? el.dataset.ru : el.dataset.enHtml;
    });
    document.querySelectorAll("[data-ru-ph]").forEach(function (el) {
      if (el.dataset.enPh === undefined) el.dataset.enPh = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", current === "ru" ? el.dataset.ruPh : el.dataset.enPh);
    });

    var titleEl = document.querySelector("title");
    if (titleEl && titleEl.dataset.ru) {
      if (titleEl.dataset.en === undefined) titleEl.dataset.en = titleEl.textContent;
      document.title = current === "ru" ? titleEl.dataset.ru : titleEl.dataset.en;
    }
    var meta = document.querySelector('meta[name="description"]');
    if (meta && meta.dataset.ru) {
      if (meta.dataset.en === undefined) meta.dataset.en = meta.getAttribute("content");
      meta.setAttribute("content", current === "ru" ? meta.dataset.ru : meta.dataset.en);
    }

    document.documentElement.lang = current;
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.lang === current);
    });
    try { localStorage.setItem(LANG_KEY, current); } catch (e) { /* private mode */ }

    document.querySelectorAll(".num[data-done]").forEach(function (el) {
      el.textContent = formatNum(parseInt(el.dataset.count, 10));
    });
  }

  document.querySelectorAll(".lang-btn").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.dataset.lang); });
  });

  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
  if (saved === "ru") applyLang("ru");

  /* ---------- Header ---------- */
  var header = document.getElementById("header");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      nav.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Counters ---------- */
  function formatNum(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, current === "ru" ? " " : ",");
  }
  function animateCounter(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var dur = 1300, start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else el.setAttribute("data-done", "1");
    }
    requestAnimationFrame(tick);
  }
  var nums = document.querySelectorAll(".num[data-count]");
  if ("IntersectionObserver" in window) {
    var no = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCounter(en.target); no.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { no.observe(el); });
  } else {
    nums.forEach(function (el) { el.textContent = formatNum(parseInt(el.dataset.count, 10)); el.setAttribute("data-done", "1"); });
  }

  /* ---------- Project filters ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".p-card[data-cat]");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      cards.forEach(function (card) {
        var show = f === "all" || card.dataset.cat === f;
        card.classList.toggle("hidden", !show);
        card.classList.remove("appear");
        if (show) {
          card.classList.add("in");
          void card.offsetWidth;
          card.classList.add("appear");
        }
      });
    });
  });

  /* ---------- Contact form (mailto compose) ---------- */
  var form = document.getElementById("quoteForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["cf-name", "cf-phone", "cf-msg"].forEach(function (id) {
        var input = document.getElementById(id);
        if (!input) return;
        var field = input.closest(".field");
        var valid = input.value.trim().length > 0;
        field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) return;

      var name = document.getElementById("cf-name").value.trim();
      var phone = document.getElementById("cf-phone").value.trim();
      var email = (document.getElementById("cf-email") || {}).value || "";
      var topicEl = document.getElementById("cf-topic");
      var topic = topicEl ? topicEl.options[topicEl.selectedIndex].text : "";
      var msg = document.getElementById("cf-msg").value.trim();

      var subject = "Website inquiry — " + name + (topic ? " (" + topic + ")" : "");
      var body = msg + "\n\n—\n" + name + "\nPhone: " + phone + (email ? "\nEmail: " + email.trim() : "");
      var mailto = "mailto:hazynagurlusykhk@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailto;
      form.hidden = true;
      var success = document.getElementById("formSuccess");
      if (success) success.hidden = false;
    });
    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field.classList.contains("invalid") && input.value.trim()) field.classList.remove("invalid");
      });
    });
  }

  /* ---------- Intro (home only) ---------- */
  var intro = document.getElementById("intro");
  if (intro) {
    var seen = false;
    try { seen = sessionStorage.getItem("hg-intro") === "1"; } catch (e) { /* ignore */ }
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function killIntro() {
      intro.classList.add("gone");
      document.body.style.overflow = "";
    }
    function dismissIntro() {
      intro.classList.add("done");
      document.body.style.overflow = "";
      setTimeout(killIntro, 850);
    }

    if (seen || reduced) {
      killIntro();
    } else {
      document.body.style.overflow = "hidden";
      try { sessionStorage.setItem("hg-intro", "1"); } catch (e) { /* ignore */ }

      requestAnimationFrame(function () { intro.classList.add("play"); });
      var tReveal = setTimeout(function () { intro.classList.add("reveal"); }, 1950);
      var tDone = setTimeout(dismissIntro, 3350);

      intro.addEventListener("click", function () {
        clearTimeout(tReveal);
        clearTimeout(tDone);
        intro.classList.add("reveal");
        dismissIntro();
      }, { once: true });
    }
  }
})();
