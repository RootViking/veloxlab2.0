/* UTM pass-through and the primary CTA event.
   First-touch UTM values in the session are stored and appended to every
   [data-cta="primary"] booking link, along with offer and lang. The same
   values are added as hidden inputs on lead forms. */
(function (root) {
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var STORAGE_KEY = "vl-attribution";

  function pickUtm(search) {
    var params = search instanceof URLSearchParams ? search : new URLSearchParams(search || "");
    var out = {};
    UTM_KEYS.forEach(function (key) {
      var value = params.get(key);
      if (value) out[key] = value;
    });
    return out;
  }

  function readStored(storage) {
    if (!storage) return {};
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function capture(search, storage) {
    var existing = readStored(storage);
    if (existing && Object.keys(existing).length) return existing;
    var incoming = pickUtm(search);
    if (storage && Object.keys(incoming).length) {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(incoming)); } catch (err) { /* private mode */ }
    }
    return incoming;
  }

  function offerFromPath(pathname) {
    var path = pathname || "/";
    if (/(?:^|\/)cita\/?(?:index\.html)?$/.test(path)) return "de-reel-a-cita";
    return "home";
  }

  function withParams(url, attrs) {
    if (!url) return url;
    var next;
    try { next = new URL(url, (root.location && root.location.origin) || "https://veloxlab.studio"); }
    catch (err) { return url; }
    var attrsSafe = attrs || {};
    var utm = attrsSafe.utm || {};
    UTM_KEYS.forEach(function (key) {
      if (utm[key] && !next.searchParams.has(key)) next.searchParams.set(key, utm[key]);
    });
    if (attrsSafe.offer && !next.searchParams.has("offer")) next.searchParams.set("offer", attrsSafe.offer);
    if (attrsSafe.lang && !next.searchParams.has("lang")) next.searchParams.set("lang", attrsSafe.lang);
    return next.toString();
  }

  function currentContext() {
    var loc = root.location || { search: "", pathname: "/", origin: "" };
    var storage = null;
    try { storage = root.sessionStorage; } catch (err) { storage = null; }
    var utm = capture(loc.search, storage);
    var offer = offerFromPath(loc.pathname);
    var lang = (root.document && document.documentElement.lang) || "en";
    return { utm: utm, offer: offer, lang: lang, page: loc.pathname || "/" };
  }

  function detail(cta, ctx) {
    var context = ctx || currentContext();
    return {
      cta: cta,
      offer: context.offer,
      page: context.page,
      lang: context.lang,
      utm: context.utm
    };
  }

  function emit(cta, ctx) {
    var payload = detail(cta, ctx);
    if (root.dispatchEvent) root.dispatchEvent(new CustomEvent("velox:cta", { detail: payload }));
    return payload;
  }

  function ensureHidden(form, name, value) {
    var field = form.querySelector('input[type="hidden"][name="' + name + '"]');
    if (!field) {
      field = form.ownerDocument.createElement("input");
      field.type = "hidden";
      field.name = name;
      form.appendChild(field);
    }
    field.value = value;
  }

  function apply(ctx, doc) {
    var context = ctx || currentContext();
    var rootDoc = doc || root.document;
    if (!rootDoc) return context;
    rootDoc.querySelectorAll('[data-cta="primary"]').forEach(function (el) {
      if (el.tagName !== "A" || !el.getAttribute("href")) return;
      el.href = withParams(el.href, context);
    });
    rootDoc.querySelectorAll("form[data-form]").forEach(function (form) {
      Object.keys(context.utm).forEach(function (key) { ensureHidden(form, key, context.utm[key]); });
      ensureHidden(form, "offer", form.getAttribute("data-offer") || context.offer);
      ensureHidden(form, "page", context.page);
    });
    return context;
  }

  function bind(ctx) {
    var context = apply(ctx);
    if (!root.document) return context;
    root.document.addEventListener("click", function (event) {
      var link = event.target && event.target.closest && event.target.closest('[data-cta="primary"]');
      if (link) emit("primary", context);
    });
    return context;
  }

  var api = {
    UTM_KEYS: UTM_KEYS,
    pickUtm: pickUtm,
    capture: capture,
    offerFromPath: offerFromPath,
    withParams: withParams,
    currentContext: currentContext,
    apply: apply,
    emit: emit,
    bind: bind
  };
  root.VELOX_ATTRIBUTION = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root.document && root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", function () { bind(); });
  } else if (root.document) {
    bind();
  }
})(typeof window !== "undefined" ? window : globalThis);
