/* =====================================================
   Hazyna Gurluşyk — site behavior
   ===================================================== */
(function () {
  "use strict";

  /* ---------- Language switching ---------- */
  var LANG_KEY = "hg-lang";
  var HTML_LANG = { tm: "tk", ru: "ru", en: "en" };
  var currentLang = "tm";

  function t(key) {
    var dict = I18N[currentLang] || I18N.tm;
    return dict[key] != null ? dict[key] : (I18N.tm[key] != null ? I18N.tm[key] : null);
  }

  function applyLang(lang) {
    if (!I18N[lang]) lang = "tm";
    currentLang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n"));
      if (val != null) el.innerHTML = val;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var val = t(el.getAttribute("data-i18n-ph"));
      if (val != null) el.setAttribute("placeholder", val);
    });

    document.documentElement.lang = HTML_LANG[lang];
    var metaTitle = t("meta.title");
    if (metaTitle) document.title = metaTitle;
    var metaDescEl = document.querySelector('meta[name="description"]');
    var metaDesc = t("meta.desc");
    if (metaDescEl && metaDesc) metaDescEl.setAttribute("content", metaDesc);

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-lang") === lang);
    });

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }

    // Re-render finished counters with locale-aware grouping
    document.querySelectorAll(".num[data-done]").forEach(function (el) {
      el.textContent = formatNum(parseInt(el.getAttribute("data-count"), 10));
    });
  }

  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang"));
    });
  });

  var savedLang = null;
  try { savedLang = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
  if (savedLang && savedLang !== "tm") applyLang(savedLang);

  /* ---------- Header shadow on scroll ---------- */
  var header = document.getElementById("header");
  function onScrollHeader() {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function closeMenu() {
    nav.classList.remove("open");
    burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  /* ---------- Active nav link ---------- */
  var sections = ["home", "about", "services", "projects", "contact"]
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActiveLink() {
    var pos = window.scrollY + window.innerHeight * 0.35;
    var active = sections[0] ? sections[0].id : null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) active = sec.id;
    });
    document.querySelectorAll(".nav-link").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-link") === active);
    });
  }
  window.addEventListener("scroll", setActiveLink, { passive: true });
  setActiveLink();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Animated counters ---------- */
  function formatNum(n) {
    var s = String(n);
    var sep = currentLang === "en" ? "," : " ";
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var duration = 1400;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.setAttribute("data-done", "1");
      }
    }
    requestAnimationFrame(tick);
  }

  var nums = document.querySelectorAll(".num[data-count]");
  if ("IntersectionObserver" in window) {
    var numObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          numObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { numObserver.observe(el); });
  } else {
    nums.forEach(function (el) {
      el.textContent = formatNum(parseInt(el.getAttribute("data-count"), 10));
      el.setAttribute("data-done", "1");
    });
  }

  /* ---------- Project filters ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projectCards = document.querySelectorAll(".p-card");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      projectCards.forEach(function (card) {
        var show = filter === "all" || card.getAttribute("data-cat") === filter;
        card.classList.toggle("hidden", !show);
        card.classList.remove("appear");
        if (show) {
          // ensure reveal state doesn't hide re-shown cards
          card.classList.add("in");
          void card.offsetWidth; // restart animation
          card.classList.add("appear");
        }
      });
    });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById("quoteForm");
  var success = document.getElementById("formSuccess");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["f-name", "f-phone"].forEach(function (id) {
        var input = document.getElementById(id);
        var field = input.closest(".field");
        var valid = input.value.trim().length > 0;
        field.classList.toggle("invalid", !valid);
        var err = field.querySelector(".field-err");
        if (err) err.hidden = valid;
        if (!valid) ok = false;
      });
      if (!ok) return;

      // NOTE: hook a real backend here (e.g. Formspree, Telegram bot, or your API).
      form.hidden = true;
      success.hidden = false;
    });

    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field.classList.contains("invalid") && input.value.trim()) {
          field.classList.remove("invalid");
          var err = field.querySelector(".field-err");
          if (err) err.hidden = true;
        }
      });
    });
  }
})();
