/* Shared page wiring: config links, commitment gates, nav, forms.
   Home and inner pages load this. The 3D stage and motion layer stay in
   js/main.js and js/stage.js, which only the homepage should load. */
(function () {
  var config = window.VELOX_CONFIG || {};

  document.querySelectorAll("[data-config]").forEach(function (el) {
    var path = el.getAttribute("data-config").split(".");
    var value = path.reduce(function (obj, key) { return obj && obj[key]; }, config);
    // a link still waiting on its real URL stays out of sight instead of going nowhere
    if (el.tagName === "A" && (!value || /PLACEHOLDER/.test(value))) { el.hidden = true; return; }
    if (!value) return;
    if (el.getAttribute("data-config") === "email") {
      el.textContent = value;
      el.href = "mailto:" + value;
      return;
    }
    if (el.tagName === "A") el.href = value;
    if (el.tagName === "FORM") el.setAttribute("data-endpoint", value);
  });

  var commitments = window.VELOX_COMMITMENTS;
  var previewQuery = new URLSearchParams(window.location.search).get("preview");
  var spotsOn = commitments && commitments.limitedSpotsVisible({
    showLimitedSpots: config.showLimitedSpots,
    preview: previewQuery,
    hostname: window.location.hostname
  });
  var guaranteesOn = commitments && commitments.guaranteesVisible && commitments.guaranteesVisible({
    showGuarantees: config.showGuarantees,
    preview: previewQuery,
    hostname: window.location.hostname
  });
  document.querySelectorAll("[data-preview-only]").forEach(function (el) {
    var type = el.getAttribute("data-preview-only");
    if (type === "guarantee") {
      if (guaranteesOn) el.hidden = false;
    } else if (spotsOn) {
      el.hidden = false;
    }
  });
  if (guaranteesOn) {
    document.querySelectorAll("[data-guarantee]").forEach(function (el) { el.hidden = false; });
  }

  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");
  var sheet = document.getElementById("nav-sheet");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var skip = document.querySelector(".skip-link");
  if (skip) {
    skip.addEventListener("click", function () {
      var main = document.getElementById("main");
      if (main) main.focus({ preventScroll: true });
    });
  }

  if (nav) {
    var last = 0;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (window.matchMedia("(min-width: 1024px)").matches) {
          nav.classList.toggle("is-hidden", y > last && y > 80);
        } else {
          nav.classList.remove("is-hidden");
        }
        nav.classList.toggle("is-scrolled", y > 80);
        last = y;
        ticking = false;
      });
    }, { passive: true });
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    if (toggle) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
      toggle.focus();
    }
  }

  if (toggle && sheet) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "Menu" : "Close";
      sheet.hidden = open;
      if (!open) {
        var first = sheet.querySelector("a");
        if (first) first.focus();
      }
    });
    sheet.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeSheet);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeSheet();
    });
  }

  document.querySelectorAll(".ticker").forEach(function (ticker) {
    var btn = ticker.querySelector(".ticker-pause");
    if (!btn) return;
    if (reduce) {
      btn.hidden = true;
      return;
    }
    btn.addEventListener("click", function () {
      var paused = !ticker.classList.contains("is-paused");
      ticker.classList.toggle("is-paused", paused);
      btn.setAttribute("aria-pressed", String(paused));
      var play = btn.getAttribute("data-label-play");
      var stop = btn.getAttribute("data-label-pause");
      btn.setAttribute("aria-label", paused ? play : stop);
    });
  });

  var track = document.querySelector(".work-track");
  var count = document.querySelector(".work-count");
  if (track && count) {
    var cards = Array.prototype.slice.call(track.querySelectorAll(".card"));
    function updateCount() {
      var mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      cards.forEach(function (card, index) {
        var box = card.getBoundingClientRect();
        var dist = Math.abs(box.left + box.width / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      count.textContent = (best + 1) + " / " + cards.length;
    }
    track.addEventListener("scroll", updateCount, { passive: true });
    track.addEventListener("keydown", function (event) {
      var delta = Math.round(track.clientWidth * 0.85);
      if (event.key === "ArrowRight") track.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
      if (event.key === "ArrowLeft") track.scrollBy({ left: -delta, behavior: reduce ? "auto" : "smooth" });
    });
    updateCount();
  }

  var topic = new URLSearchParams(window.location.search).get("topic");
  if (topic) {
    var select = document.querySelector('#contact select[name="topic"]');
    if (select && Array.prototype.some.call(select.options, function (option) { return option.value === topic; })) {
      select.value = topic;
    }
  }

  var suggest = document.querySelector("[data-lang-suggest]");
  if (suggest && document.documentElement.lang === "en") {
    var wantsSpanish = (navigator.language || "").toLowerCase().indexOf("es") === 0;
    if (wantsSpanish && !sessionStorage.getItem("vl-lang-dismiss")) suggest.hidden = false;
    var dismiss = suggest.querySelector("[data-lang-dismiss]");
    if (dismiss) {
      dismiss.addEventListener("click", function () {
        suggest.hidden = true;
        sessionStorage.setItem("vl-lang-dismiss", "1");
      });
    }
  }

  function showSendError(sendErr, message) {
    if (!sendErr) return;
    var fallback = sendErr.querySelector(".form-fallback");
    var lead = sendErr.querySelector("[data-send-lead]");
    if (!lead) {
      lead = document.createElement("span");
      lead.setAttribute("data-send-lead", "");
      var text = "";
      var node = sendErr.firstChild;
      while (node && node !== fallback) {
        var next = node.nextSibling;
        if (node.nodeType === 3) {
          text += node.textContent;
          sendErr.removeChild(node);
        }
        node = next;
      }
      lead.setAttribute("data-default", text);
      sendErr.insertBefore(lead, fallback || null);
    }
    var notice = message && String(message).trim();
    lead.textContent = notice ? notice + " " : (lead.getAttribute("data-default") || "");
    sendErr.hidden = false;
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var err = form.querySelector(".form-error");
    var sendErr = form.querySelector(".form-send-error");
    var ok = form.querySelector(".form-ok");
    var requiredMsg = form.getAttribute("data-msg-required") || "Fill in this field.";
    var emailMsg = form.getAttribute("data-msg-email") || "Enter a valid email.";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (ok) ok.hidden = true;
      if (sendErr) sendErr.hidden = true;
      var trap = form.querySelector('[name="company_website"]');
      if (trap && trap.value) return;
      var bad = null;
      var fields = {};
      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (field.name === "company_website") return;
        field.removeAttribute("aria-invalid");
        var empty = field.required && !String(field.value).trim();
        var badEmail = field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
        if ((empty || badEmail) && !bad) bad = field;
        if (empty || badEmail) field.setAttribute("aria-invalid", "true");
        if (field.name) fields[field.name] = field.value;
      });
      if (bad) {
        if (err) {
          err.hidden = false;
          err.textContent = bad.type === "email" && bad.value ? emailMsg : requiredMsg;
        }
        bad.focus();
        return;
      }
      if (err) err.hidden = true;
      var button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      var offer = form.getAttribute("data-offer") || form.getAttribute("data-form");
      var payload = {
        form: form.getAttribute("data-form"),
        offer: offer,
        language: document.documentElement.lang,
        page: window.location.pathname
      };
      Object.keys(fields).forEach(function (key) { payload[key] = fields[key]; });
      payload._subject = "VeloxLab lead · " + offer;
      payload._template = "table";
      payload._captcha = "false";
      var forms = window.VELOX_FORMS;
      forms.postLead(form.getAttribute("data-endpoint") || config.formEndpoint, payload).then(function (result) {
        if (forms.formOutcome(result) === "success") {
          if (ok) ok.hidden = false;
          if (window.VELOX_ATTRIBUTION && window.VELOX_ATTRIBUTION.emit) {
            window.VELOX_ATTRIBUTION.emit("spec_form");
          }
          return;
        }
        if (button) button.disabled = false;
        showSendError(sendErr, result && result.message);
      });
    });
  });

  var citaHeader = document.querySelector(".cita-header");
  if (citaHeader) {
    window.addEventListener("scroll", function () {
      citaHeader.classList.toggle("is-scrolled", window.scrollY > 80);
    }, { passive: true });
  }

  var bookBar = document.querySelector(".book-bar");
  var ctaPanel = document.getElementById("cta");
  if (bookBar && ctaPanel && "IntersectionObserver" in window) {
    var ctaInView = false;
    function syncBar() {
      bookBar.classList.toggle("is-hidden", ctaInView);
      bookBar.setAttribute("aria-hidden", ctaInView ? "true" : "false");
    }
    new IntersectionObserver(function (entries) {
      ctaInView = entries.some(function (entry) { return entry.isIntersecting; });
      syncBar();
    }, { threshold: 0.35 }).observe(ctaPanel);
  }

  // Pages without the homepage loader would otherwise wait on boot.js's
  // 7s safety net, because CSS hides .hero until html.is-loaded.
  if (!document.querySelector(".loader")) {
    document.documentElement.classList.add("is-loaded");
  }

})();
