# VeloxLab Studio

Static site for VeloxLab Studio. HTML, CSS, and vanilla scripts. No framework and no build step.

## Run locally

From this folder:

```bash
python3 -m http.server 5173
```

Open http://127.0.0.1:5173/ and http://127.0.0.1:5173/es/

## Design

**Direction (Nov 2026): liquid glass over molten gold.** A black stage, one gold particle world behind the whole page, and glass UI floating on top. It is inspired by award-winning immersive sites (Noomo, RabenRifaie, Pulztronic) and an AI-agency reference layout. This supersedes the layout and type rules in `design/style-guide.md` (Molten Ace v2.2). The copy rules there and in `design/copy-v3.md` still apply.

- **Type:** Geist for text and UI, plus Instrument Serif italic for the editorial accent word in each headline (`<em>`). Both are self-hosted in `assets/fonts/` (SIL OFL).
- **Color:** near-black `#060606`, bone text, gold `#FFB547` / `#FF9A2E`.
- **Liquid glass (`.glass`):** a frosted, tinted base, a gradient rim and a specular highlight that follows the pointer. `.glass--liquid` also refracts what is behind it in Chromium, through an SVG displacement map built in `js/main.js` (`#lg-refract`). Other browsers keep the frosted version.
- **Loader:** it counts to 100 as the particle world loads, then reveals the hero. There is no click.
- **Nav:** a floating glass dock at the bottom of the screen with a sliding active pill. On phones it becomes a full-width "Book a call" bar, with a Menu button at the top.

Both pages share one layout. Only the words differ.

**Placeholders.**
- Facts confirmed by Sadiel on Nov 13 are filled in: a 5-day first cut or demo, 14 days of fixes after launch, and no social-cut count.
- Proof, testimonial and work-subline slots stay out of the page until real, as `design/copy-v3.md` says.
- WhatsApp links are replaced by the email link.
- Any `data-config` link whose value in `js/config.js` still contains `PLACEHOLDER` hides itself, which currently covers the social profiles.

## Particle stage

`js/stage.js` draws one fixed WebGL canvas: about 30,000 gold particles (14,000 on phones). Every section names a scene with `data-scene`, and as you scroll the particles flow from shape to shape. Each particle moves on its own slight delay, so shapes pour into each other.

| Scene | Shape | Where |
| --- | --- | --- |
| `brain` | AI brain, sampled from a Higgsfield 3D model (`assets/3d/brain-points.bin`, 263 KB) | Hero |
| `brain-far` | the brain, smaller and dimmer | Reel, process |
| `dust` | loose gold dust, so photos lead | Work, real estate |
| `lens` | a camera aperture | Services heading |
| `lattice` | a built structure | Service tracks |
| `globe` | dotted globe with a Miami beacon | Bilingual |
| `spade` / `spade-end` | the VeloxLab spade | Contact, footer |

The hero brain also carries about 1,800 synapse links between nearby surface points, each with a pulse of light travelling along it. They fade out whenever the particles leave the brain shape.

Poses (screen side, scale, brightness) live in `POSE` in `js/stage.js`. The cursor parts the particles and tilts the cloud. With reduced motion the stage draws still frames; without WebGL2 the page keeps its CSS background.

Three.js r169 is self-hosted as `js/vendor/three.bundle.js`, tree-shaken to what the stage imports, which keeps the `script-src 'self'` policy. To rebuild it, bundle the named exports in its header from `three@0.169.0` with esbuild (`--bundle --format=esm --minify`).

The robot models in `assets/3d/robot*.glb` and the hero video in `assets/hero/` are from the previous direction and are no longer on the page.

## Motion

The experience layer at the end of `js/main.js` adds:
- **Loader:** the counter described above.
- **Lenis smooth scrolling:** with eased anchor jumps.
- **Liquid glass:** the refraction map and the pointer highlight.
- **Dock:** the sliding active pill.
- **Work gallery:** a pinned horizontal gallery on screens 900px and wider; phones get a native swipe row.
- **Headlines:** they sharpen out of blur word by word as you scroll (`.reveal-words`).
- **Work in motion:** each work card plays a short seamless loop of its piece while it is on screen (loaded lazily, paused off screen, skipped with reduced motion or data saver). Clicking a card, "Play the reel" or "See the full project" opens a glass case-study viewer sized to the clip; Esc or clicking outside closes it and returns focus.
- **Cards and panels:** soft entrances.
- **Process:** a line that fills as the steps arrive.

Reduced motion turns all of it off.

## Copy

Homepage wording comes from `design/copy-v3.md` (v3.2). `design/style-guide.md` (v2.2) owns design, layout, tokens, and motion. Where the two disagree on copy, v3.2 wins. The brand name is always **VeloxLab**. Spanish uses usted. Do not add stats, prices, or a made-up WhatsApp number.

Unknowns are written `[PLACEHOLDER: …]`. Every element that holds one has `data-placeholder="P##"`. Prices (P10) are left off the page on purpose. Spec-ad delivery is 5 days and the reply time is 24 hours. Those are real values from v3.2. The first-cut and demo turnaround (P07) stays a placeholder.

Booking links, the contact email, and the form endpoint live only in `js/config.js` as `window.VELOX_CONFIG`. The pages point at those keys with `data-config`. `js/main.js` copies them onto the controls. Intro and audit buttons open the Calendly pages. Leads POST JSON (`Accept` and `Content-Type` `application/json`) to the FormSubmit ajax URL. WhatsApp and the social profile URLs are still placeholders.

A form shows its thank-you text only after that POST returns a 2xx status and, when the body is JSON, `success` is `true` or `"true"`. FormSubmit can return HTTP 200 with `{ "success": "false", "message": "..." }`. That is a failure, and the message is shown in the form error with the WhatsApp and email links. An unset endpoint never sends. `node --test scripts/form-submit.test.mjs` covers that rule. The first real submit makes FormSubmit email an activation link to the address in `formEndpoint`. Leads are delivered only after that link is opened.

Before a production deploy, run:

```bash
npm run check:placeholders
```

That runs `node scripts/check-placeholders.mjs`. It exits with an error if `index.html`, `es/index.html`, `privacy.html`, `styles.css`, or any file in `js/` still contains a `data-placeholder` attribute or the tokens `PLACEHOLDER` or `PROPOSED`. It does not read this README or `docs/`, which name those tokens on purpose. The check is the launch gate. It is not wired to a host.

### Guarantee and limited spots (P16, P17)

Sadiel confirmed the guarantee lines, so they are visible on every host, including production. Those sentences have no placeholder.

The limited-spots lines stay preview-only. The client and build counts inside them are still `[PLACEHOLDER: number]` (P17), so the launch check keeps failing until those numbers are filled in.

`showLimitedSpots` in `js/config.js` is the production switch for those lines only. It is `false`. Set that one line to `true` to show them on veloxlab.studio.

While the switch is off, `js/commitments.js` reveals the limited-spots lines (`data-preview-only`) only when:

- the URL has `?preview=1`, or
- `preview` is not `0` and the hostname is not `veloxlab.studio` or `www.veloxlab.studio`.

`?preview=0` hides the limited-spots lines on every host, including localhost. On `veloxlab.studio` they stay hidden unless the switch is `true` or the URL has `?preview=1`. The guarantee lines are not affected.

## Contact

Both forms check required fields and a honeypot (`company_website`). A filled honeypot is dropped and is not treated as a success. There is no calendar embed. The booking buttons use the Calendly URLs from `js/config.js`. Each payload adds FormSubmit's `_subject`, `_template` (`table`), and `_captcha` (`false`).

## What ships

These files are in git and are what the pages load:

- Hero clip: `assets/hero/hero-1080.mp4`, `hero-1080.webm`, `hero-720.mp4`, `hero-720.webm`
- Poster and reduced-motion still: `assets/hero/poster.webp`, `assets/hero/poster.avif`
- Logos: `assets/logo/veloxlab-primary.svg`, `veloxlab-icon.svg`, `veloxlab-watermark.svg`
- Favicon: `favicon.svg`
- Social image: `assets/og.jpg`
- Fonts: `assets/fonts/`

## Design source

`design/` is source and must not be deployed.

`design/` holds the copy and the style guide. The pages do not link to it.

- `design/style-guide.md` is the v2.2 guide (design, layout, tokens, motion)
- `design/copy-v3.md` is the v3.2 homepage copy. It wins wherever the guide still shows older wording.

There is no separate web root yet, because hosting is not chosen and the local server is the repo folder. `design/` can be fetched during that local preview. It is not part of the site. When a host is chosen, publish the HTML, CSS, `js/`, `favicon.svg`, and `assets/` only. Leave `design/` out of that bundle. Do not add a deploy config for this.

## Hosting

- **Where:** live at **https://veloxlab.studio** on Netlify (project `veloxlab-studio`, team `sadiel0`).
- **Builds:** Netlify builds the `3d-hero-dissolve` branch of `RootViking/veloxlab2.0` and publishes the repository root as-is. There is no build step.
- **Auto Publishing is locked:** every push builds, but nothing goes live until someone opens **Deploys**, picks the build and clicks **Publish deploy**. To publish pushes automatically, use "Unlock to start auto publishing" on the Deploys page.
- **`_redirects`:** forces a 404 for internal paths that would otherwise be public, because the whole repository is deployed (`README.md`, `package.json`, `.claude/`, `design/`, `docs/`, `prompts/`, `scripts/`). Add any new internal folder there.
- **`404.html`:** the branded not-found page, served by Netlify for missing paths and for the blocked ones.
- **Headers and cache:** the recommended headers and cache policy are in `docs/security-headers.md`. They are not applied yet.
