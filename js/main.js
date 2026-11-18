/* Experience layer: loader, liquid glass, dock, pinned work gallery,
   headline reveals and Lenis smooth scroll. The particle world itself is
   js/stage.js. Reduced motion skips the motion and shows everything. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var vh = window.innerHeight;
  window.addEventListener("resize", function () { vh = window.innerHeight; }, { passive: true });
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Loader: counts as the stage actually loads ---------- */

  var loader = document.querySelector(".loader");
  var countEl = loader && loader.querySelector(".loader-count");
  var shown = 0, target = 0.08, stageDone = false, fontsDone = false, finished = false;
  window.addEventListener("stage:progress", function (e) { target = Math.max(target, e.detail * 0.92); });
  window.addEventListener("stage:ready", function () { stageDone = true; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fontsDone = true; target = Math.max(target, 0.2); });
  else fontsDone = true;
  setTimeout(function () { stageDone = true; fontsDone = true; }, 6000);

  function finish() {
    if (finished) return;
    finished = true;
    root.classList.add("is-loaded");
    setTimeout(function () { if (loader) loader.remove(); }, 1600);
  }
  if (reduce || !loader) finish();
  else {
    (function count() {
      if (stageDone && fontsDone) target = 1;
      shown += (target - shown) * 0.08 + (target === 1 ? 0.004 : 0);
      if (shown > target) shown = target;
      var n = Math.round(shown * 100);
      if (countEl) countEl.textContent = n;
      loader.style.setProperty("--lp", shown.toFixed(3));
      if (n >= 100) setTimeout(finish, 250);
      else requestAnimationFrame(count);
    })();
  }

  /* ---------- Liquid glass ---------- */

  // Chromium can refract through backdrop-filter: url(). Build a lens map:
  // neutral in the middle, bending light inward near the edges.
  var chromium = !!(navigator.userAgentData && navigator.userAgentData.brands &&
    navigator.userAgentData.brands.some(function (b) { return /Chromium|Google Chrome|Microsoft Edge/.test(b.brand); }));
  var mapEl = document.querySelector(".lg-map");
  if (chromium && mapEl && !reduce) {
    var S = 128, c = document.createElement("canvas");
    c.width = c.height = S;
    var g = c.getContext("2d"), img = g.createImageData(S, S);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = (x / (S - 1)) * 2 - 1, dy = (y / (S - 1)) * 2 - 1;
      var edge = Math.pow(Math.max(Math.abs(dx), Math.abs(dy)), 6);
      var i = (y * S + x) * 4;
      img.data[i] = 128 - dx * edge * 120;
      img.data[i + 1] = 128 - dy * edge * 120;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    mapEl.setAttribute("href", c.toDataURL());
    root.classList.add("lg");
  }

  // a specular highlight that follows the pointer across each glass surface
  if (fine && !reduce) {
    var hot = null, px = 0, py = 0, queued = false;
    document.addEventListener("pointermove", function (e) {
      hot = e.target.closest && e.target.closest(".glass");
      px = e.clientX; py = e.clientY;
      if (hot && !queued) {
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          if (!hot) return;
          var r = hot.getBoundingClientRect();
          hot.style.setProperty("--gx", ((px - r.left) / r.width * 100).toFixed(1) + "%");
          hot.style.setProperty("--gy", ((py - r.top) / r.height * 100).toFixed(1) + "%");
        });
      }
    }, { passive: true });
  }

  /* ---------- Dock: a glass pill slides to the section in view ---------- */

  var dockLinks = Array.prototype.slice.call(document.querySelectorAll(".dock-links a"));
  var dockTargets = dockLinks.map(function (a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") return document.getElementById(href.slice(1));
    try {
      var url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) return document.getElementById(url.hash.slice(1));
    } catch (err) { /* ignore */ }
    return null;
  });
  var ind = null, activeIdx = -1;
  var dl = document.querySelector(".dock-links");
  if (dl) { ind = document.createElement("span"); ind.className = "dock-ind"; ind.setAttribute("aria-hidden", "true"); dl.insertBefore(ind, dl.firstChild); }
  function setActive(idx) {
    if (idx === activeIdx || !ind) return;
    activeIdx = idx;
    dockLinks.forEach(function (a, i) { a.classList.toggle("is-active", i === idx); if (i === idx) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    if (idx < 0) { ind.classList.remove("is-on"); return; }
    var a = dockLinks[idx];
    ind.style.width = a.offsetWidth + "px";
    ind.style.transform = "translateX(" + a.offsetLeft + "px)";
    ind.classList.add("is-on");
  }

  /* ---------- Headlines sharpen out of blur, word by word ---------- */

  var heads = Array.prototype.slice.call(document.querySelectorAll(".reveal-words"));
  if (!reduce) heads.forEach(function (h) {
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    var words = [];
    function wrapText(node, parent) {
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { parent.appendChild(document.createTextNode(" ")); return; }
        var w = document.createElement("span");
        w.className = "w"; w.setAttribute("aria-hidden", "true"); w.textContent = part;
        parent.appendChild(w); words.push(w);
      });
    }
    Array.prototype.slice.call(h.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { var frag = document.createDocumentFragment(); wrapText(n, frag); h.replaceChild(frag, n); }
      else if (n.nodeType === 1) {
        var inner = Array.prototype.slice.call(n.childNodes);
        n.textContent = "";
        inner.forEach(function (c2) { if (c2.nodeType === 3) wrapText(c2, n); else n.appendChild(c2); });
      }
    });
    h._words = words;
  });

  /* ---------- Soft entrances for cards and panels ---------- */

  var rvEls = Array.prototype.slice.call(document.querySelectorAll(".track, .step, .pillars li, .spot-frame, .reel-frame, .contact-panel, .about blockquote, .section-head .lede"));
  var counters = new Map();
  rvEls.forEach(function (el) {
    var k = counters.get(el.parentNode) || 0;
    counters.set(el.parentNode, k + 1);
    el.style.setProperty("--i", Math.min(k, 5));
    el.classList.add("rv");
  });
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else rvEls.forEach(function (el) { el.classList.add("is-in"); });

  /* ---------- Process line ---------- */

  var steps = document.querySelector(".steps");
  var stepsLine = null;
  if (steps) { stepsLine = document.createElement("span"); stepsLine.className = "steps-line"; stepsLine.setAttribute("aria-hidden", "true"); stepsLine.appendChild(document.createElement("i")); steps.appendChild(stepsLine); }

  /* ---------- Work: pinned horizontal gallery on wide screens ---------- */

  var work = document.querySelector(".work");
  var track = work && work.querySelector(".work-track");
  var count = work && work.querySelector(".work-count");
  var cards = track ? Array.prototype.slice.call(track.querySelectorAll(".card")) : [];
  var pinDist = 0;
  function layoutWork() {
    if (!work || !track) return;
    var wide = window.innerWidth >= 900 && !reduce;
    work.classList.toggle("is-pinned", wide);
    if (!wide) { work.style.height = ""; track.style.removeProperty("--wx"); return; }
    pinDist = Math.max(0, track.scrollWidth - window.innerWidth);
    work.style.height = (window.innerHeight + pinDist) + "px";
  }
  layoutWork();
  window.addEventListener("resize", layoutWork, { passive: true });
  window.addEventListener("load", layoutWork);

  /* ---------- Lenis ---------- */

  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
    window.__lenis = lenis;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || url.search !== location.search || !url.hash || url.hash === "#") return;
      var t = document.querySelector(url.hash);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(url.hash === "#top" ? 0 : t, { offset: t.matches("section") ? -24 : -110, duration: 1.6, easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); } });
      if (history.pushState) history.pushState(null, "", url.hash);
    });
  }

  /* ---------- One frame loop ---------- */

  var frame = 0;
  function tick(t) {
    if (lenis) lenis.raf(t);
    var y = window.scrollY;
    frame++;
    root.classList.toggle("is-scrolled-past", y > 60);

    if (work && work.classList.contains("is-pinned")) {
      var top = work.getBoundingClientRect().top;
      var p = clamp(-top / Math.max(1, pinDist), 0, 1);
      track.style.setProperty("--wx", (-p * pinDist).toFixed(1) + "px");
      if (count && frame % 4 === 0) count.textContent = (Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)) + " / " + cards.length;
    }

    for (var h = 0; h < heads.length; h++) {
      var el = heads[h], ws = el._words;
      if (!ws) continue;
      var r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      var prog = clamp((vh * 0.92 - r.top) / (vh * 0.55), 0, 1);
      for (var i = 0; i < ws.length; i++) {
        var local = clamp((prog * (ws.length + 2) - i) / 2, 0, 1);
        ws[i].style.setProperty("--o", (0.12 + local * 0.88).toFixed(3));
        ws[i].style.setProperty("--b", ((1 - local) * 10).toFixed(1) + "px");
        ws[i].style.setProperty("--ty", ((1 - local) * 12).toFixed(1) + "px");
      }
    }

    if (stepsLine) {
      var sr = steps.getBoundingClientRect();
      stepsLine.style.setProperty("--p", clamp((vh * 0.85 - sr.top) / (vh * 0.5), 0, 1).toFixed(3));
    }

    if (ind && frame % 6 === 0) {
      var idx = -1;
      for (var k = 0; k < dockTargets.length; k++) {
        var s = dockTargets[k];
        if (s && s.getBoundingClientRect().top < vh * 0.5) idx = k;
      }
      setActive(idx);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* Motion work: card loops and the showreel load only as they approach the
   screen and play only while visible. Cards and the reel open in a glass
   case-study viewer. Reduced motion keeps the stills and skips autoplay. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  function load(video) {
    if (video.dataset.loaded) return;
    video.dataset.loaded = "1";
    Array.prototype.forEach.call(video.querySelectorAll("source[data-src]"), function (s) { s.src = s.getAttribute("data-src"); });
    video.load();
  }
  function play(video) {
    load(video);
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  var vids = Array.prototype.slice.call(document.querySelectorAll(".card-video, .reel-video"));
  if (!reduce && !saveData && "IntersectionObserver" in window) {
    var near = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) load(en.target); });
    }, { rootMargin: "600px 600px" });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) play(v); else v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) {
      v.addEventListener("playing", function () { v.classList.add("is-playing"); });
      near.observe(v);
      seen.observe(v);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) vids.forEach(function (v) { v.pause(); });
    });
  }

  /* Viewer */
  var dlg = document.querySelector(".viewer");
  if (!dlg || typeof dlg.showModal !== "function") return;
  var vv = dlg.querySelector(".viewer-video");
  var cap = dlg.querySelector(".viewer-cap");
  var closeBtn = dlg.querySelector(".viewer-close");
  var opener = null;

  function open(btn) {
    var base = btn.getAttribute("data-video");
    opener = btn;
    vv.innerHTML = '<source src="' + base + '.webm" type="video/webm" /><source src="' + base + '.mp4" type="video/mp4" />';
    // size the frame to the clip so portrait work never sits in a letterbox
    fit(/\/reel$/.test(base) ? 16 / 9 : 848 / 1072);
    vv.load();
    cap.textContent = btn.getAttribute("data-caption") || "";
    dlg.showModal();
    if (window.__lenis) window.__lenis.stop();
    var p = vv.play();
    if (p && p.catch) p.catch(function () {});
    closeBtn.focus();
  }
  function fit(ar) {
    vv._ar = ar;
    var maxW = window.innerWidth * 0.94 - 20, maxH = window.innerHeight * 0.92 - 90;
    var w = Math.min(maxW, maxH * ar);
    vv.style.width = Math.round(w) + "px";
    vv.style.height = Math.round(w / ar) + "px";
  }
  vv.addEventListener("loadedmetadata", function () { if (vv.videoWidth) fit(vv.videoWidth / vv.videoHeight); });
  window.addEventListener("resize", function () { if (dlg.open && vv._ar) fit(vv._ar); }, { passive: true });
  function close() { if (dlg.open) dlg.close(); }

  dlg.addEventListener("close", function () {
    vv.pause();
    vv.removeAttribute("src");
    vv.innerHTML = "";
    if (window.__lenis) window.__lenis.start();
    if (opener) opener.focus({ preventScroll: true });
  });
  closeBtn.addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".card-open, .reel-open");
    if (btn) { e.preventDefault(); open(btn); }
  });
})();
