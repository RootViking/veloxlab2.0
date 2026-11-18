/* Shared sample-ad card and tab row. Videos stay out of the HTML:
   sources are injected only when a card is activated. One card plays
   at a time. Placeholder cards stay as posters. */
(function (root) {
  function langOf() {
    return (root.document && document.documentElement.lang) || "en";
  }

  function motionFlags() {
    var reduce = !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var saveData = !!(root.navigator && root.navigator.connection && root.navigator.connection.saveData);
    return { reduce: reduce, saveData: saveData };
  }

  function shouldAutoplay(opts) {
    var options = opts || {};
    if (options.status === "placeholder") return false;
    if (options.reduce || options.saveData) return false;
    return true;
  }

  function videoSources(base) {
    if (!base) return [];
    return [
      { type: "video/webm", src: base + ".webm" },
      { type: "video/mp4", src: base + ".mp4" }
    ];
  }

  function injectSources(video, base) {
    if (!video || !base || video.dataset.loaded === "1") return false;
    videoSources(base).forEach(function (item) {
      var source = video.ownerDocument.createElement("source");
      source.type = item.type;
      source.src = item.src;
      video.appendChild(source);
    });
    video.dataset.loaded = "1";
    if (typeof video.load === "function") video.load();
    return true;
  }

  function unloadVideo(video) {
    if (!video) return;
    try { video.pause(); } catch (err) { /* ignore */ }
    video.removeAttribute("src");
    video.querySelectorAll("source").forEach(function (source) { source.remove(); });
    delete video.dataset.loaded;
    if (typeof video.load === "function") video.load();
  }

  function pickLabel(map, lang) {
    if (!map) return "";
    if (typeof map === "string") return map;
    return map[lang] || map.en || "";
  }

  function labelsFor(lang) {
    if (lang === "es") {
      return { play: "Ver el anuncio", pause: "Pausar el anuncio", soundOn: "Activar sonido", soundOff: "Quitar sonido", sound: "Sonido" };
    }
    return { play: "Play the ad", pause: "Pause the ad", soundOn: "Sound on", soundOff: "Sound off", sound: "Sound" };
  }

  var activeCard = null;

  function pauseOthers(except) {
    if (!root.document) return;
    root.document.querySelectorAll(".ad-card video").forEach(function (video) {
      var card = video.closest(".ad-card");
      if (card === except) return;
      try { video.pause(); } catch (err) { /* ignore */ }
      video.muted = true;
      var sound = card && card.querySelector(".ad-sound");
      if (sound) sound.setAttribute("aria-pressed", "false");
    });
  }

  function setPlayState(card, playing) {
    var btn = card.querySelector(".ad-play");
    if (!btn) return;
    var lang = langOf();
    var labels = labelsFor(lang);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute("aria-label", playing ? labels.pause : labels.play);
  }

  function wireCard(card) {
    if (!card || card.dataset.wired === "1") return;
    card.dataset.wired = "1";
    var video = card.querySelector("video");
    var playBtn = card.querySelector(".ad-play");
    var soundBtn = card.querySelector(".ad-sound");
    var isPlaceholder = card.getAttribute("data-status") === "placeholder";
    var flags = motionFlags();
    var base = video && video.getAttribute("data-src");

    if (isPlaceholder) {
      if (playBtn) playBtn.hidden = true;
      if (soundBtn) soundBtn.hidden = true;
      return;
    }

    function activate() {
      if (video) injectSources(video, base);
    }

    function playMuted() {
      if (!video) return;
      activate();
      pauseOthers(card);
      activeCard = card;
      video.muted = true;
      if (soundBtn) soundBtn.setAttribute("aria-pressed", "false");
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }

    if (playBtn) {
      setPlayState(card, false);
      playBtn.addEventListener("click", function () {
        if (!video) return;
        activate();
        if (!video.paused && !video.ended) {
          video.pause();
          setPlayState(card, false);
          return;
        }
        pauseOthers(card);
        activeCard = card;
        var play = video.play();
        if (play && play.catch) play.catch(function () {});
      });
    }
    if (soundBtn) {
      var soundLabels = labelsFor(langOf());
      soundBtn.setAttribute("aria-pressed", "false");
      soundBtn.setAttribute("aria-label", soundLabels.soundOn);
      soundBtn.addEventListener("click", function () {
        if (!video) return;
        activate();
        video.muted = !video.muted;
        soundBtn.setAttribute("aria-pressed", video.muted ? "false" : "true");
        soundBtn.setAttribute("aria-label", video.muted ? soundLabels.soundOn : soundLabels.soundOff);
      });
    }
    if (video) {
      video.addEventListener("play", function () { setPlayState(card, true); });
      video.addEventListener("pause", function () { setPlayState(card, false); });
    }

    if (video && shouldAutoplay({ status: card.getAttribute("data-status"), reduce: flags.reduce, saveData: flags.saveData }) && "IntersectionObserver" in root) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) playMuted();
          else if (video) video.pause();
        });
      }, { threshold: [0, 0.6, 1] });
      io.observe(card);
      card._io = io;
    }

    root.document.addEventListener("visibilitychange", function () {
      if (root.document.hidden && video) video.pause();
    });
  }

  function posterMarkup(niche, lang, doc) {
    var poster = niche.poster;
    var alt = pickLabel(niche.alt, lang);
    var picture = doc.createElement("picture");
    var source = doc.createElement("source");
    source.type = "image/avif";
    source.srcset = poster + ".avif";
    var img = doc.createElement("img");
    img.src = poster + ".webp";
    img.alt = alt;
    img.width = 720;
    img.height = 1280;
    img.loading = "lazy";
    img.decoding = "async";
    picture.appendChild(source);
    picture.appendChild(img);
    return picture;
  }

  function renderCard(niche, lang, doc, isHero) {
    var card = doc.createElement("figure");
    card.className = "ad-card" + (isHero ? " is-hero" : "");
    card.setAttribute("data-ad", niche.id);
    card.setAttribute("data-status", niche.status || "");
    if (niche.placeholderId) card.setAttribute("data-placeholder", niche.placeholderId);

    var media = doc.createElement("div");
    media.className = "ad-media";
    media.appendChild(posterMarkup(niche, lang, doc));

    var video = doc.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.loop = true;
    video.preload = "none";
    video.setAttribute("data-src", niche.src);
    video.setAttribute("aria-hidden", "true");
    video.tabIndex = -1;
    if (niche.tracks && niche.status !== "placeholder") {
      ["en", "es"].forEach(function (code) {
        if (!niche.tracks[code]) return;
        var track = doc.createElement("track");
        track.kind = "captions";
        track.srclang = code;
        track.label = code === "es" ? "Español" : "English";
        track.src = niche.tracks[code];
        if (code === lang) track.default = true;
        video.appendChild(track);
      });
    }
    media.appendChild(video);

    var play = doc.createElement("button");
    play.className = "ad-play";
    play.type = "button";
    play.setAttribute("aria-pressed", "false");
    play.setAttribute("aria-label", labelsFor(lang).play);
    play.textContent = "";
    var sound = doc.createElement("button");
    sound.className = "ad-sound";
    sound.type = "button";
    sound.setAttribute("aria-pressed", "false");
    sound.textContent = lang === "es" ? "Sonido" : "Sound";
    media.appendChild(play);
    media.appendChild(sound);
    card.appendChild(media);

    var cap = doc.createElement("figcaption");
    cap.textContent = pickLabel(niche.caption, lang);
    card.appendChild(cap);
    if (niche.status === "placeholder") {
      play.hidden = true;
      sound.hidden = true;
    }
    return card;
  }

  function enabledNiches(filter) {
    var all = (root.VELOX_NICHES || []).filter(function (n) { return n && n.enabled !== false; });
    if (!filter || !filter.length) return all;
    return all.filter(function (n) { return filter.indexOf(n.id) !== -1; });
  }

  function mountTabs(rootEl) {
    var doc = rootEl.ownerDocument;
    var lang = langOf();
    var layout = rootEl.getAttribute("data-ad-tabs-layout") || "split";
    var filterAttr = rootEl.getAttribute("data-niches");
    var filter = filterAttr ? filterAttr.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : null;
    var niches = enabledNiches(filter);
    if (!niches.length) return;

    var wrap = doc.createElement("div");
    wrap.className = "ad-tabs ad-tabs--" + layout;

    var tablist = doc.createElement("div");
    tablist.className = "ad-tablist";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-orientation", layout === "split" ? "vertical" : "horizontal");
    if (lang === "es") tablist.setAttribute("aria-label", "Tipos de negocio");
    else tablist.setAttribute("aria-label", "Business types");

    var panel = doc.createElement("div");
    panel.className = "ad-panel";
    panel.setAttribute("role", "tabpanel");
    panel.id = (rootEl.id || "samples") + "-panel";
    panel.setAttribute("tabindex", "0");

    var tabs = [];

    function select(index, user) {
      niches.forEach(function (niche, i) {
        var selected = i === index;
        tabs[i].setAttribute("aria-selected", selected ? "true" : "false");
        tabs[i].tabIndex = selected ? 0 : -1;
        tabs[i].classList.toggle("is-active", selected);
      });
      var previous = panel.querySelector(".ad-card");
      if (previous) {
        var prevVideo = previous.querySelector("video");
        if (prevVideo) unloadVideo(prevVideo);
        previous.remove();
      }
      var card = renderCard(niches[index], lang, doc, false);
      if (!motionFlags().reduce) card.classList.add("is-entering");
      panel.appendChild(card);
      panel.setAttribute("aria-labelledby", tabs[index].id);
      wireCard(card);
      if (user && tabs[index]) tabs[index].focus();
    }

    niches.forEach(function (niche, index) {
      var tab = doc.createElement("button");
      tab.type = "button";
      tab.className = "ad-tab";
      tab.setAttribute("role", "tab");
      tab.id = (rootEl.id || "samples") + "-tab-" + niche.id;
      tab.setAttribute("aria-controls", panel.id);
      tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
      tab.tabIndex = index === 0 ? 0 : -1;
      var thumb = doc.createElement("span");
      thumb.className = "ad-thumb";
      thumb.setAttribute("aria-hidden", "true");
      var img = doc.createElement("img");
      img.src = niche.poster + ".webp";
      img.alt = "";
      img.width = 64;
      img.height = 114;
      img.loading = "lazy";
      img.decoding = "async";
      thumb.appendChild(img);
      var label = doc.createElement("span");
      label.className = "ad-tab-label";
      label.textContent = pickLabel(niche.label, lang);
      tab.appendChild(thumb);
      tab.appendChild(label);
      tab.addEventListener("click", function () { select(index, false); });
      tablist.appendChild(tab);
      tabs.push(tab);
    });

    tablist.addEventListener("keydown", function (event) {
      var current = tabs.findIndex(function (t) { return t === doc.activeElement; });
      if (current < 0) current = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
      var next = current;
      var vertical = tablist.getAttribute("aria-orientation") === "vertical";
      if (event.key === "ArrowRight" || (vertical && event.key === "ArrowDown")) next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || (vertical && event.key === "ArrowUp")) next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(current, false);
        return;
      } else return;
      event.preventDefault();
      tabs[next].focus();
    });

    wrap.appendChild(tablist);
    wrap.appendChild(panel);
    var mount = rootEl.querySelector("[data-ad-tabs-mount]") || rootEl;
    mount.appendChild(wrap);
    select(0, false);
  }

  function init() {
    if (!root.document) return;
    root.document.querySelectorAll("[data-ad-tabs]").forEach(mountTabs);
    root.document.querySelectorAll(".ad-card").forEach(wireCard);
  }

  var api = {
    shouldAutoplay: shouldAutoplay,
    videoSources: videoSources,
    injectSources: injectSources,
    unloadVideo: unloadVideo,
    enabledNiches: enabledNiches,
    renderCard: renderCard,
    mountTabs: mountTabs,
    wireCard: wireCard,
    init: init
  };
  root.VELOX_ADS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root.document && root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", init);
  } else if (root.document) {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
