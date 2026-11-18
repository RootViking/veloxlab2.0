import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { pickUtm, capture, offerFromPath, withParams } = createRequire(import.meta.url)("../js/attribution.js");

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    data
  };
}

test("pickUtm reads only the five utm keys", () => {
  const utm = pickUtm("?utm_source=instagram&utm_medium=dm&utm_campaign=de-reel-a-cita&utm_content=paz&foo=1");
  assert.deepEqual(utm, {
    utm_source: "instagram",
    utm_medium: "dm",
    utm_campaign: "de-reel-a-cita",
    utm_content: "paz"
  });
});

test("capture keeps the first non-empty UTM touch in the session", () => {
  const storage = memoryStorage();
  const first = capture("?utm_source=instagram&utm_medium=dm", storage);
  const second = capture("?utm_source=later&utm_medium=email", storage);
  assert.deepEqual(first, { utm_source: "instagram", utm_medium: "dm" });
  assert.deepEqual(second, { utm_source: "instagram", utm_medium: "dm" });
});

test("a later URL can still supply the first touch if the first page had no UTMs", () => {
  const storage = memoryStorage();
  assert.deepEqual(capture("", storage), {});
  assert.deepEqual(capture("?utm_source=instagram", storage), { utm_source: "instagram" });
});

test("offerFromPath is de-reel-a-cita on /cita and home otherwise", () => {
  assert.equal(offerFromPath("/cita/"), "de-reel-a-cita");
  assert.equal(offerFromPath("/es/cita/"), "de-reel-a-cita");
  assert.equal(offerFromPath("/cita"), "de-reel-a-cita");
  assert.equal(offerFromPath("/"), "home");
  assert.equal(offerFromPath("/es/"), "home");
});

test("withParams appends utm, offer and lang without overwriting existing params", () => {
  const url = withParams("https://calendly.com/sadielalmanza/15min", {
    utm: { utm_source: "instagram", utm_medium: "dm" },
    offer: "de-reel-a-cita",
    lang: "es"
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("utm_source"), "instagram");
  assert.equal(parsed.searchParams.get("utm_medium"), "dm");
  assert.equal(parsed.searchParams.get("offer"), "de-reel-a-cita");
  assert.equal(parsed.searchParams.get("lang"), "es");

  const kept = withParams("https://calendly.com/sadielalmanza/15min?utm_source=already", {
    utm: { utm_source: "instagram" },
    offer: "home",
    lang: "en"
  });
  assert.equal(new URL(kept).searchParams.get("utm_source"), "already");
  assert.equal(new URL(kept).searchParams.get("offer"), "home");
});
