/* VeloxLab stage: one fixed cloud of gold particles behind the whole page.

   Every section names a scene with data-scene. As you scroll, the particles
   flow from one shape to the next (each particle on its own slight delay, so
   shapes pour into each other instead of snapping):

     brain   hero: the AI brain, sampled from a Higgsfield model
     dust    work and real estate: loose gold dust so the images lead
     lens    creative: a camera aperture
     lattice development and process: a built structure
     globe   bilingual: a dotted globe with Miami lit
     spade   contact and footer: the VeloxLab spade

   The cursor parts the particles. Reduced motion draws one still frame.
   Without WebGL2 the page keeps its CSS background. */

import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, Float32BufferAttribute, Points,
  ShaderMaterial, AdditiveBlending, Vector2, MathUtils
} from "./vendor/three.bundle.js";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const progress = (p) => dispatchEvent(new CustomEvent("stage:progress", { detail: p }));
const ready = () => dispatchEvent(new Event("stage:ready"));

const canvas = document.createElement("canvas");
canvas.className = "stage";
canvas.setAttribute("aria-hidden", "true");
const gl2 = (() => { try { return !!canvas.getContext("webgl2"); } catch (e) { return false; } })();

/* ---------- shapes (all roughly within a unit sphere) ---------- */

const SHAPES = ["brain", "dust", "lens", "lattice", "globe", "spade"];

function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

async function brainPoints(N) {
  const res = await fetch("/assets/3d/brain-points.bin");
  const buf = await res.arrayBuffer();
  const n = new DataView(buf).getUint32(0, true);
  const q = new Int16Array(buf, 4, n * 3);
  const qn = new Int8Array(buf, 4 + n * 6, n * 3);
  const out = new Float32Array(N * 3), nrm = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const k = Math.floor((i / N) * n);
    // the model is long along z; turn it so the brain faces left in profile
    const x = q[k * 3] / 32767, y = q[k * 3 + 1] / 32767, z = q[k * 3 + 2] / 32767;
    out[i * 3] = z; out[i * 3 + 1] = y; out[i * 3 + 2] = -x;
    nrm[i * 3] = qn[k * 3 + 2] / 127; nrm[i * 3 + 1] = qn[k * 3 + 1] / 127; nrm[i * 3 + 2] = -qn[k * 3] / 127;
  }
  return { pos: out, nrm };
}

function dustPoints(N, r) {
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    out[i * 3] = (r() - 0.5) * 7.5;
    out[i * 3 + 1] = (r() - 0.5) * 4.6;
    out[i * 3 + 2] = (r() - 0.5) * 3.0 - 0.6;
  }
  return out;
}

function lensPoints(N, r) {
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = r();
    let x, y, z;
    if (t < 0.5) {
      // concentric glass elements
      const ring = Math.floor(r() * 7);
      const rad = 0.28 + ring * 0.12 + (r() - 0.5) * 0.012;
      const a = r() * Math.PI * 2;
      x = Math.cos(a) * rad; y = Math.sin(a) * rad; z = -ring * 0.05;
    } else if (t < 0.72) {
      // aperture blades: a spiral hexagon
      const blade = Math.floor(r() * 6);
      const s = r();
      const a0 = (blade / 6) * Math.PI * 2;
      const a = a0 + s * 1.05;
      const rad = 0.18 + s * 0.12;
      x = Math.cos(a) * rad; y = Math.sin(a) * rad; z = 0.02;
    } else {
      // the barrel
      const a = r() * Math.PI * 2;
      const rad = 1.02 + (r() - 0.5) * 0.02;
      x = Math.cos(a) * rad; y = Math.sin(a) * rad; z = -r() * 1.1;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

function latticePoints(N, r) {
  const out = new Float32Array(N * 3);
  const edges = [];
  const cube = (s, rot) => {
    const c = Math.cos(rot), sn = Math.sin(rot);
    const v = [];
    for (let i = 0; i < 8; i++) {
      const x = (i & 1 ? 1 : -1) * s, y = (i & 2 ? 1 : -1) * s, z = (i & 4 ? 1 : -1) * s;
      v.push([x * c - z * sn, y, x * sn + z * c]);
    }
    [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(([a, b]) => edges.push([v[a], v[b]]));
  };
  cube(0.82, 0.6); cube(0.46, -0.2);
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (r() < 0.7) {
      const [a, b] = edges[Math.floor(r() * edges.length)];
      const t = r();
      const j = 0.01;
      x = a[0] + (b[0] - a[0]) * t + (r() - 0.5) * j;
      y = a[1] + (b[1] - a[1]) * t + (r() - 0.5) * j;
      z = a[2] + (b[2] - a[2]) * t + (r() - 0.5) * j;
    } else {
      // nodes on a grid inside the structure
      const g = () => (Math.floor(r() * 5) - 2) * 0.32;
      x = g() + (r() - 0.5) * 0.03; y = g() + (r() - 0.5) * 0.03; z = g() + (r() - 0.5) * 0.03;
    }
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
  }
  return out;
}

function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), sx), L(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), sx), sy),
           L(L(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), sx), L(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), sx), sy), sz);
}

function globePoints(N, r) {
  const out = new Float32Array(N * 3);
  const lat = (25.76 * Math.PI) / 180, lon = (-80.19 * Math.PI) / 180;
  const miami = [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  let i = 0, tries = 0;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const M = N * 3;
  while (i < N && tries < M * 2) {
    const k = tries++ % M;
    const y = 1 - (k / (M - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * k + Math.floor(tries / M) * 0.37;
    const x = Math.cos(th) * rad, z = Math.sin(th) * rad;
    const land = vnoise(x * 2.2 + 3, y * 2.2, z * 2.2) * 0.65 + vnoise(x * 5 + 9, y * 5, z * 5) * 0.35;
    const dm = Math.hypot(x - miami[0], y - miami[1], z - miami[2]);
    const keep = dm < 0.09 || land > 0.52 || r() < 0.06;
    if (!keep) continue;
    out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    i++;
  }
  // Miami beacon: a tight cluster lifted off the surface
  for (let b = 0; b < Math.min(900, N - 1); b++) {
    const j = N - 1 - b;
    const lift = 1 + r() * 0.35;
    const jit = 0.025;
    out[j * 3] = miami[0] * lift + (r() - 0.5) * jit;
    out[j * 3 + 1] = miami[1] * lift + (r() - 0.5) * jit;
    out[j * 3 + 2] = miami[2] * lift + (r() - 0.5) * jit;
  }
  for (; i < N - 900; i++) { const k = Math.floor(r() * i); out[i * 3] = out[k * 3]; out[i * 3 + 1] = out[k * 3 + 1]; out[i * 3 + 2] = out[k * 3 + 2]; }
  return out;
}

async function spadePoints(N, r) {
  const out = new Float32Array(N * 3);
  const svg = await (await fetch("/assets/logo/veloxlab-icon.svg")).text();
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
  const S = 256;
  const c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0, S, S);
  URL.revokeObjectURL(url);
  const data = g.getImageData(0, 0, S, S).data;
  const inside = (x, y) => x >= 0 && y >= 0 && x < S && y < S && data[(y * S + x) * 4 + 3] > 128;
  const pts = [], edge = [];
  for (let y = 0; y < S; y += 1) for (let x = 0; x < S; x += 1) {
    if (!inside(x, y)) continue;
    pts.push([x, y]);
    if (!inside(x + 2, y) || !inside(x - 2, y) || !inside(x, y + 2) || !inside(x, y - 2)) edge.push([x, y]);
  }
  for (let i = 0; i < N; i++) {
    const onEdge = r() < 0.45 && edge.length;
    const [px, py] = onEdge ? edge[Math.floor(r() * edge.length)] : pts[Math.floor(r() * pts.length)];
    const depth = onEdge ? (r() - 0.5) * 0.24 : (r() < 0.5 ? -0.12 : 0.12);
    out[i * 3] = (px / S - 0.5) * 2.0 + (r() - 0.5) * 0.008;
    out[i * 3 + 1] = -(py / S - 0.5) * 2.0 + (r() - 0.5) * 0.008;
    out[i * 3 + 2] = depth;
  }
  return out;
}

/* ---------- stage ---------- */

async function start() {
  document.body.prepend(canvas);
  progress(0.15);
  const small = () => innerWidth < 768;
  let mobile = small();
  const W = () => Math.max(1, innerWidth), H = () => Math.max(1, innerHeight);

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(W(), H(), false);
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, W() / H(), 0.1, 50);
  camera.position.set(0, 0, 4.4);

  const N = mobile ? 14000 : 30000;
  const r = rand(20261107);

  const brain = await brainPoints(N).catch(() => null);
  progress(0.55);
  const spade = await spadePoints(N, r).catch(() => dustPoints(N, r));
  progress(0.75);
  const shapes = {
    brain: brain ? brain.pos : globePoints(N, r),
    dust: dustPoints(N, r),
    lens: lensPoints(N, r),
    lattice: latticePoints(N, r),
    globe: globePoints(N, r),
    spade
  };

  const geo = new BufferGeometry();
  SHAPES.forEach((name, i) => geo.setAttribute("aP" + i, new Float32BufferAttribute(shapes[name], 3)));
  geo.setAttribute("position", new Float32BufferAttribute(shapes.brain, 3));
  const seed = new Float32Array(N), shade = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    seed[i] = r();
    // brain gets light from its surface normals: rim and upper-left brighter
    if (brain) {
      const nx = brain.nrm[i * 3], ny = brain.nrm[i * 3 + 1], nz = brain.nrm[i * 3 + 2];
      shade[i] = MathUtils.clamp(0.35 + 0.65 * Math.max(0, nx * -0.4 + ny * 0.55 + nz * 0.75) + (1 - Math.abs(nz)) * 0.35, 0.2, 1.3);
    } else shade[i] = 0.8;
  }
  geo.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
  geo.setAttribute("aShade", new Float32BufferAttribute(shade, 1));

  const U = {
    uFrom: { value: 0 }, uTo: { value: 0 }, uMix: { value: 0 },
    uTime: { value: 0 }, uChaos: { value: 0 }, uAlpha: { value: 1 },
    uMouse: { value: new Vector2(9, 9) }, uAspect: { value: W() / H() },
    uPx: { value: renderer.getPixelRatio() }, uSize: { value: mobile ? 1.35 : 1.0 }
  };

  const mat = new ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, uniforms: U,
    vertexShader: `
      attribute vec3 aP0, aP1, aP2, aP3, aP4, aP5;
      attribute float aSeed, aShade;
      uniform float uFrom, uTo, uMix, uTime, uChaos, uPx, uSize, uAspect;
      uniform vec2 uMouse;
      varying float vA; varying float vHot;
      vec3 shapeAt(float i){
        if (i < 0.5) return aP0; if (i < 1.5) return aP1; if (i < 2.5) return aP2;
        if (i < 3.5) return aP3; if (i < 4.5) return aP4; return aP5;
      }
      vec3 flow(vec3 p, float t){
        return vec3(sin(p.y * 3.1 + t + aSeed * 6.0), sin(p.z * 2.7 + t * 1.3 + aSeed * 4.0), sin(p.x * 2.9 + t * 0.8 + aSeed * 5.0));
      }
      void main(){
        // each particle starts its move at its own moment, so shapes pour
        float m = clamp((uMix - aSeed * 0.45) / 0.55, 0.0, 1.0);
        m = m * m * (3.0 - 2.0 * m);
        vec3 a = shapeAt(uFrom), b = shapeAt(uTo);
        vec3 p = mix(a, b, m);
        float mid = sin(m * 3.14159);
        p += flow(p, uTime * 0.6) * (mid * 0.35 + uChaos * 0.06 + 0.006);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        // part around the cursor (in screen space)
        vec2 ndc = clip.xy / clip.w;
        vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
        float dist = length(d);
        float push = smoothstep(0.32, 0.0, dist) * 0.16;
        ndc += normalize(d + 1e-5) / vec2(uAspect, 1.0) * push;
        clip.xy = ndc * clip.w;
        gl_Position = clip;
        float tw = 0.65 + 0.35 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 50.0);
        float shadeOn = (uFrom < 0.5 ? 1.0 - m : 0.0) + (uTo < 0.5 ? m : 0.0);
        vA = mix(0.85, aShade, shadeOn) * tw;
        vHot = step(0.93, aSeed);
        gl_PointSize = uSize * uPx * (2.1 + aSeed * 2.2 + vHot * 2.6) * (4.4 / -mv.z);
      }`,
    fragmentShader: `
      uniform float uAlpha;
      varying float vA; varying float vHot;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        vec3 gold = mix(vec3(1.0, 0.56, 0.16), vec3(1.0, 0.86, 0.6), vHot * 0.8 + core * 0.25);
        float a = core * core * vA * uAlpha * 1.7;
        gl_FragColor = vec4(gold * a, a);
      }`
  });
  const cloud = new Points(geo, mat);
  cloud.frustumCulled = false;
  scene.add(cloud);
  progress(0.9);

  /* ---------- scroll stations from data-scene ---------- */

  // x: screen side (-1 left .. 1 right), s: scale, a: brightness, ry: base turn
  const POSE = {
    "brain":     { shape: "brain", x: 0.46, y: 0.04, s: 1.22, a: 1.0, ry: 0.0 },
    "brain-far": { shape: "brain", x: 0.0, y: 0.05, s: 0.8, a: 0.55, ry: 0.9 },
    "dust":      { shape: "dust", x: 0.0, y: 0.0, s: 1.0, a: 0.4, ry: 0.0 },
    "lens":      { shape: "lens", x: 0.0, y: 0.0, s: 1.1, a: 0.6, ry: -0.35 },
    "lattice":   { shape: "lattice", x: 0.0, y: 0.0, s: 1.05, a: 0.55, ry: 0.5 },
    "globe":     { shape: "globe", x: 0.42, y: 0.0, s: 1.05, a: 0.95, ry: 0.0 },
    "spade":     { shape: "spade", x: 0.0, y: 0.0, s: 0.95, a: 0.8, ry: 0.0 },
    "spade-end": { shape: "spade", x: 0.62, y: -0.05, s: 0.7, a: 0.45, ry: -0.3 }
  };
  let stations = [];
  function measure() {
    const sy = scrollY;
    stations = Array.from(document.querySelectorAll("[data-scene]")).map((el) => {
      const rect = el.getBoundingClientRect();
      return { pose: POSE[el.dataset.scene] || POSE.dust, at: Math.max(0, rect.top + sy - innerHeight * 0.45) };
    }).sort((a, b) => a.at - b.at);
    if (stations.length) stations[0].at = 0;
  }
  measure();
  addEventListener("load", measure);
  addEventListener("resize", () => {
    mobile = small();
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(W(), H(), false);
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    U.uAspect.value = camera.aspect;
    U.uPx.value = renderer.getPixelRatio();
    measure();
  }, { passive: true });

  function sample(y) {
    let i = 0;
    while (i < stations.length - 1 && y >= stations[i + 1].at) i++;
    const a = stations[i], b = stations[Math.min(i + 1, stations.length - 1)];
    const span = Math.max(1, b.at - a.at);
    const t = a === b ? 0 : MathUtils.clamp((y - a.at) / span, 0, 1);
    return { a: a.pose, b: b.pose, t };
  }

  /* ---------- input ---------- */

  const mouse = new Vector2(9, 9), mouseS = new Vector2(9, 9), tilt = new Vector2(0, 0);
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    mouse.set((e.clientX / W()) * 2 - 1, -((e.clientY / H()) * 2 - 1));
  }, { passive: true });
  document.addEventListener("pointerleave", () => mouse.set(9, 9));

  /* ---------- loop ---------- */

  const cur = { x: 0.42, y: 0, s: 1.25, a: 0, ry: 0 };
  let lastY = scrollY, vel = 0, spin = 0, t0 = performance.now(), running = true, first = true;
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !reduce) { t0 = performance.now(); requestAnimationFrame(loop); }
  });

  function frame(now) {
    const dt = Math.min(Math.max((now - t0) / 1000, 0), 0.05);
    t0 = now;
    const y = scrollY;
    vel = MathUtils.lerp(vel, y - lastY, 0.1);
    lastY = y;

    const { a, b, t } = sample(y);
    // shape morph follows scroll directly; pose eases
    U.uFrom.value = SHAPES.indexOf(a.shape);
    U.uTo.value = SHAPES.indexOf(b.shape);
    U.uMix.value = a.shape === b.shape ? 0 : t;
    if (a.shape === b.shape) U.uTo.value = U.uFrom.value;
    const e = t * t * (3 - 2 * t);
    const k = reduce ? 1 : 1 - Math.pow(0.004, dt);
    ["x", "y", "s", "a", "ry"].forEach((key) => {
      const target = a[key] + (b[key] - a[key]) * e;
      cur[key] += (target - cur[key]) * (first ? 1 : k);
    });
    first = false;

    const halfW = Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    const x = (mobile ? 0 : cur.x) * halfW;
    cloud.position.set(x, cur.y + (mobile ? 0.35 : 0), 0);
    cloud.scale.setScalar(cur.s * (mobile ? 0.78 : 1));
    spin += dt * 0.08;
    mouseS.lerp(mouse, 1 - Math.pow(0.02, dt));
    const mx = Math.abs(mouseS.x) > 2 ? 0 : mouseS.x, my = Math.abs(mouseS.y) > 2 ? 0 : mouseS.y;
    tilt.lerp(new Vector2(mx, my), 1 - Math.pow(0.05, dt));
    cloud.rotation.set(-tilt.y * 0.25, cur.ry + spin * (reduce ? 0 : 1) + tilt.x * 0.4, 0);

    U.uTime.value = reduce ? 0 : now / 1000;
    U.uChaos.value = Math.min(Math.abs(vel) * 0.08, 1.5);
    // phones stack text over the centred shape: dim it once past the hero so words stay legible
    U.uAlpha.value = cur.a * (mobile && y > innerHeight * 0.6 ? 0.42 : 1);
    U.uMouse.value.copy(mouseS);
    renderer.render(scene, camera);
  }

  function loop(now) {
    if (!running) return;
    frame(now);
    requestAnimationFrame(loop);
  }

  root.classList.add("has-3d");
  progress(1);
  if (reduce) {
    frame(performance.now());
    addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
  } else {
    requestAnimationFrame(loop);
  }
  ready();
  window.__stage = { U, cur, stations, renderer, camera, cloud };
}

if (gl2) start().catch(() => { canvas.remove(); ready(); });
else ready();
