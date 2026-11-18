/* Experience layer (Molten Ace, style guide §8): hero video pause, hero
   parallax, the seam reveal, Lenis, the hero entrance, word drift, the nav
   ring and the process line. Config links, commitment gates, nav, forms,
   the work rail, ?topic= and the language hint live in js/site.js. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var video = document.querySelector(".hero-loop");
  var pauseBtn = document.querySelector(".hero-pause");
  if (video && pauseBtn) {
    var userPaused = false;
    var inView = true;
    function syncPause() {
      var paused = video.paused;
      pauseBtn.setAttribute("aria-pressed", String(paused));
      pauseBtn.setAttribute("aria-label", paused ? "Play background video" : "Pause background video");
    }
    pauseBtn.addEventListener("click", function () {
      if (video.paused) {
        userPaused = false;
        video.play();
      } else {
        userPaused = true;
        video.pause();
      }
      syncPause();
    });
    if (!reduce) {
      video.play().catch(function () {});
      var heroWatch = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (!inView) video.pause();
        else if (!userPaused) video.play().catch(function () {});
        syncPause();
      }, { threshold: 0.25 });
      heroWatch.observe(video);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) video.pause();
        else if (!userPaused && inView) video.play().catch(function () {});
        syncPause();
      });
    }
    video.addEventListener("play", syncPause);
    video.addEventListener("pause", syncPause);
  }

  var screen = document.querySelector(".hero-screen");
  if (screen && fine && !reduce) {
    screen.addEventListener("pointermove", function (event) {
      var rect = screen.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - 0.5;
      var y = (event.clientY - rect.top) / rect.height - 0.5;
      screen.querySelectorAll(".shift").forEach(function (el) {
        var depth = Number(el.getAttribute("data-depth")) || 0;
        el.style.transform = "translate(" + (x * depth) + "px, " + (y * depth) + "px)";
      });
    });
    screen.addEventListener("pointerleave", function () {
      screen.querySelectorAll(".shift").forEach(function (el) {
        el.style.transform = "";
      });
    });
  }

  var seam = document.querySelector(".seam-wrap");
  var stage = document.querySelector(".split-stage");
  if (seam && stage) {
    if (reduce) {
      seam.classList.add("is-in");
    } else {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) seam.classList.add("is-in");
      }, { threshold: 0.35 }).observe(stage);
    }
  }

})();

/* Signature layer (style guide §8): Lenis smooth scroll, the one hero
   entrance, words drifting apart as the robot dissolves, the nav's active
   ring and the process line. Nothing else moves. Reduced motion skips it all. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vh = window.innerHeight;
  var vw = window.innerWidth;
  window.addEventListener("resize", function () { vh = window.innerHeight; vw = window.innerWidth; }, { passive: true });
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* Hero words: phones fit long words (CONSTRUYE) to the column */
  var screen = document.querySelector(".hero-screen");
  var kws = Array.prototype.slice.call(document.querySelectorAll(".hero-screen .kw"));
  function fitWords() {
    kws.forEach(function (kw) {
      kw.style.fontSize = "";
      if (window.innerWidth >= 768) return;
      var inner = kw.querySelector(".shift") || kw;
      var avail = kw.clientWidth;
      var need = inner.scrollWidth;
      if (need > avail && avail > 0) {
        var size = parseFloat(getComputedStyle(kw).fontSize);
        kw.style.fontSize = Math.floor(size * (avail / need) * 0.98) + "px";
      }
    });
  }
  fitWords();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);
  window.addEventListener("resize", fitWords, { passive: true });

  /* The one orchestrated entrance, after fonts so nothing shifts mid-move */
  function loaded() { root.classList.add("is-loaded"); }
  if (reduce) loaded();
  else {
    var done = false;
    var go = function () { if (done) return; done = true; requestAnimationFrame(function () { requestAnimationFrame(loaded); }); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
    setTimeout(go, 700);
  }

  /* Nav: a 1px amber ring slides to the section in view */
  var pill = document.querySelector(".nav-pill");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-pill a"));
  var navTargets = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var ring = null, activeIdx = -1;
  if (pill) {
    ring = document.createElement("span");
    ring.className = "pill-ring";
    ring.setAttribute("aria-hidden", "true");
    pill.insertBefore(ring, pill.firstChild);
  }
  function setActive(idx) {
    if (idx === activeIdx || !ring) return;
    activeIdx = idx;
    navLinks.forEach(function (a, i) { a.classList.toggle("is-active", i === idx); });
    if (idx < 0) { ring.classList.remove("is-on"); return; }
    var a = navLinks[idx];
    ring.style.width = a.offsetWidth + "px";
    ring.style.transform = "translateX(" + a.offsetLeft + "px)";
    ring.classList.add("is-on");
  }

  /* Process: an amber line fills as the steps come into view */
  var steps = document.querySelector(".steps");
  var bar = null;
  if (steps) {
    bar = document.createElement("span");
    bar.className = "steps-progress";
    bar.setAttribute("aria-hidden", "true");
    steps.appendChild(bar);
  }

  /* Lenis smooth scroll and eased anchor jumps */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname || url.search !== location.search || !url.hash || url.hash === "#") return;
      var target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -84, duration: 1.4, easing: function (x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); } });
      if (history.pushState) history.pushState(null, "", url.hash);
    });
  }

  var frame = 0;
  function tick(t) {
    if (lenis) lenis.raf(t);
    var y = window.scrollY;
    frame++;

    // hero words drift apart (up to 6vw) as the robot dissolves; transform only
    if (screen && !reduce && vw >= 768) {
      var p = clamp(y / (screen.offsetHeight || vh), 0, 1);
      if (p < 1) {
        kws.forEach(function (k, i) {
          var dir = i === 1 ? 1 : -1;
          k.style.transform = "translate3d(" + (dir * p * vw * 0.06).toFixed(1) + "px,0,0)";
        });
      }
    }

    if (bar) {
      var sr = steps.getBoundingClientRect();
      bar.style.setProperty("--p", clamp((vh * 0.85 - sr.top) / (vh * 0.5), 0, 1).toFixed(3));
    }

    if (ring && frame % 6 === 0) {
      var idx = -1;
      for (var i = 0; i < navTargets.length; i++) {
        var s = navTargets[i];
        if (s && s.getBoundingClientRect().top < vh * 0.45) idx = i;
      }
      setActive(idx);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
