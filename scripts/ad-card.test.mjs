import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { shouldAutoplay, videoSources, injectSources, unloadVideo } = createRequire(import.meta.url)("../js/ad-card.js");

test("placeholder, reduced motion and Save-Data never autoplay", () => {
  assert.equal(shouldAutoplay({ status: "live" }), true);
  assert.equal(shouldAutoplay({ status: "placeholder" }), false);
  assert.equal(shouldAutoplay({ status: "live", reduce: true }), false);
  assert.equal(shouldAutoplay({ status: "live", saveData: true }), false);
});

test("videoSources lists webm then mp4 from the data-src base", () => {
  assert.deepEqual(videoSources("/assets/ads/beauty-sample"), [
    { type: "video/webm", src: "/assets/ads/beauty-sample.webm" },
    { type: "video/mp4", src: "/assets/ads/beauty-sample.mp4" }
  ]);
  assert.deepEqual(videoSources(""), []);
});

function fakeVideo() {
  const children = [];
  return {
    dataset: {},
    childNodes: children,
    querySelectorAll(sel) {
      if (sel === "source") return children.filter((c) => c.tagName === "SOURCE");
      return [];
    },
    appendChild(node) { children.push(node); return node; },
    removeAttribute() { this.src = undefined; },
    load() { this.loaded = (this.loaded || 0) + 1; },
    pause() { this.paused = true; },
    ownerDocument: {
      createElement(name) {
        const node = { tagName: name.toUpperCase(), type: "", src: "", remove() {
          const i = children.indexOf(node);
          if (i >= 0) children.splice(i, 1);
        } };
        return node;
      }
    }
  };
}

test("injectSources adds webm and mp4 once, and unloadVideo clears them", () => {
  const video = fakeVideo();
  assert.equal(injectSources(video, "/assets/ads/beauty-sample"), true);
  assert.equal(video.dataset.loaded, "1");
  assert.equal(video.querySelectorAll("source").length, 2);
  assert.equal(video.querySelectorAll("source")[0].src, "/assets/ads/beauty-sample.webm");
  assert.equal(injectSources(video, "/assets/ads/beauty-sample"), false);
  unloadVideo(video);
  assert.equal(video.querySelectorAll("source").length, 0);
  assert.equal(video.dataset.loaded, undefined);
  assert.ok(video.loaded >= 2);
});
