# Generated assets

Every AI-generated asset on the site, with the exact prompt, so it can be regenerated in the same style.

## Hero key art (2026-11-05)

- Model: Higgsfield `gpt_image_2_5`, quality high, 2k, 16:9, 2 variants (2.75 credits each)
- Reference image: a frame at 6.5 s of the previous hero video
- Kept: job `2bd8258f-ed6b-432e-9c1c-7d85f5ef5def` (variant A, more headroom). Rejected: `ce57a589-ae07-4caf-a55d-39cc8e52ae75`
- Output: 2688×1520 PNG. Downscaled to `assets/hero/poster.webp` and `poster.avif` (1280×720)

> Cinematic key art, 16:9. The exact same humanoid robot as the reference image: glossy black-chrome armor plates, molten amber light glowing through thin cracks and seams, dark visor face, holding the same professional cinema camera at chest height. Composition: the robot stands in the RIGHT third of the frame, three-quarter view turned slightly toward the left, framed from mid-thigh up, head near the top third. The LEFT 50% of the frame is deep, nearly black obsidian negative space with only faint warm haze, kept clean for large headline typography. Lighting: low-key, single warm amber rim light from behind right, soft cool-grey fill, glossy specular highlights on the chrome. Atmosphere: thin layers of volumetric smoke, a few tiny glowing amber embers floating in the air, subtle film grain, shallow depth of field, anamorphic lens. Palette: obsidian black #0C0B0A, bone white highlights, molten amber #FF9A2E. No text, no logos, no fire explosions, no lens flare streaks.

## Hero loop (2026-11-05)

- Model: Higgsfield `minimax_h3`, 2K, 16:9, 8 s, 2 variants (16 credits each)
- Start image = end image = the kept key art job above
- Kept: job `68e0d9f7-ddf4-4e7c-94af-4753ae7a0dc7`. Rejected (near-identical): `cfc54e49-65c6-4d2c-9c21-27639dd74c2a`
- Post: `motion-assets/scripts/loop_check.py --fix --blend 6` (best cut frame 187 → 0, verdict seamless), then encoded to `assets/hero/hero-{1080,720}.{mp4,webm}` (H.264 CRF 27/26, VP9 CRF 38/40, no audio)

> Seamless looping cinematic shot. Locked-off camera with an extremely slow, barely perceptible drift; no cuts, no zoom jumps. The black-chrome robot stays in place on the right holding the cinema camera; it breathes subtly, slowly turns its head a few degrees toward the viewer, then back to the original pose by the end. The molten amber seams on its armor slowly pulse brighter and dimmer like glowing lava. Tiny amber embers float upward continuously through the frame, warm smoke drifts slowly from right to left. The left half of the frame stays dark and empty. Constant, even motion throughout; no slowing down at the end. The last frame matches the first frame exactly. No text, no explosions, no lens flares, no new objects.

## 3D robot source image (2026-11-05)

- Model: Higgsfield `gpt_image_2_5`, quality high, 2k, 3:4, 1 variant (2.75 credits)
- Reference image: the hero key art job `2bd8258f-ed6b-432e-9c1c-7d85f5ef5def`
- Kept: job `bb302c66-4780-4738-b1c1-9a50fd037888`

> Full-body product turntable reference of the exact same humanoid robot as the reference image: glossy black-chrome armor plates with thin molten-amber glowing seams, dark visor face, holding the same compact professional cinema camera in both hands at chest height. Show the ENTIRE figure from head to feet, centered, standing straight in a relaxed neutral pose, feet slightly apart, front three-quarter view. Plain seamless neutral mid-grey studio background, soft even diffuse lighting from all sides, no harsh shadows, no rim light, no smoke, no embers, no floor reflections. Clean, sharp, high detail, orthographic-like product photo for 3D reconstruction. No text.

## 3D robot model (2026-11-05)

- Model: Higgsfield `tripo_h3_1_image_to_3d`, texture + PBR, texture and geometry quality "detailed", face limit 120,000 (18 credits)
- Input: the source image job above
- Kept: job `8a6528d7-b0e7-4b0b-916a-aad437333cd2` (17.3 MB GLB, 115k triangles, three 4K textures)
- Post: `gltf-transform optimize --compress quantize --texture-compress webp --texture-size 2048 --simplify-ratio 0.6 --simplify-error 0.0005` → `assets/3d/robot.glb` (1.98 MB, 69k triangles)
- Desktop build: `gltf-transform optimize --compress quantize --texture-compress webp --texture-size 4096 --simplify false` → `assets/3d/robot-hd.glb` (3.72 MB, 115k triangles, 4K textures)

Total spent for the robot direction: 58.25 credits.

## Redesign: brain point cloud (2026-11-08)

- Source image: `gpt_image_2_5`, high, 2k, 1:1 (2.75 credits). Job `145b0a4d-2bcd-4d25-af46-a5bd6739ea22`.

> Studio product photo of a single anatomical human brain sculpture, the complete brain including cerebrum, cerebellum and brain stem, seen from a three-quarter side view, smooth matte white clay material with clearly defined gyri and sulci folds, centered and fully in frame with generous margin, isolated on a plain seamless neutral mid-grey background, soft even diffuse lighting, no shadows on the background, no stand, no text, sharp focus, high detail, for 3D reconstruction.

- 3D: `tripo_h3_1_image_to_3d`, geometry only, detailed (12 credits). Job `1227a672-5207-4894-9bc5-dbe9183efd49` (54 MB GLB, 1.9M triangles).
- Post: 30,000 surface points sampled by triangle area, with normals, quantized to int16/int8, then saved as `assets/3d/brain-points.bin` (263 KB). Layout: uint32 count, then int16 xyz × count, then int8 normal xyz × count.

## Redesign: spec portfolio stills (2026-11-08)

`gpt_image_2_5`, high, 2k, 4:5 except the listing (16:9), 2.75 credits each. Every prompt starts with the same style preamble:

> Cinematic editorial photograph, warm molten-amber key light, deep black shadows, lifted blacks, subtle film grain, 35mm lens, shallow depth of field, Miami, premium and restrained, no text, no logos.

| File (`assets/work/`) | Job | Subject |
| --- | --- | --- |
| `cafe-brand-film` | `14b18ffd-5948-4952-ab25-932e5c1f9713` | barista pouring latte art, walnut counter, steam in side light |
| `boutique-landing` | `29646ac0-dd41-44b4-89e2-e66c272c57ca` | laptop on travertine in a dim boutique showing a fashion landing page |
| `clinic-booking` | `4f36f5a7-2577-45e0-b447-f9c772807cf1` | phone with a booking confirmation in an upscale clinic waiting room |
| `listing-film` | `57b6e1ce-824c-4d8f-8502-7c29e3bc37ac` | Brickell penthouse interior at blue hour |
| `food-reel` | `d3cde5fb-1bff-42bb-9b5f-1c28a49f8330` | seared fish, charred citrus, torch flame and sparks |
| `retail-website` | `05d1b8be-2730-4ded-b544-6cf19c856ccb` | phone on folded tees showing a product page |
| `listing-waterfront` | `78703f2d-4cee-4135-9e88-bfe71ae52798` | waterfront residence at dusk, infinity pool, Biscayne Bay skyline |

Encoded to WebP (q78) and AVIF (q55), 1100px wide (listing 1600px).

Redesign spend: 34 credits.
