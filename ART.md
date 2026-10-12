# PEPEFRONT asset record

- `public/assets/commander.webp`: original commander still, generated with the built-in imagegen tool, then encoded as a local WebP for efficient delivery. Used by the lobby and grainy mission briefing. Original dimensions: 1672 × 941.
- `public/cover.jpg`: original 1200 × 630 arcade cover. `scripts/cover.mjs` renders the local still with PEPEFRONT's original typography and layout in Chromium. This generated cover is copied into `dist/cover.jpg` by the normal build.
- `public/favicon.svg`, `src/icons.ts`: original vectors and faction emblems.
- `src/render.ts`: original procedural terrain, ruins, concrete bases, frog miniatures, tracked vehicles with Pepe pilots, crystal clusters, rank pips, job glyphs, muzzle flashes, rain, haze, and minimap.
- `src/audio.ts`: procedural Web Audio effects, unlocked by user interaction. No audio files or external music.
- `src/assets/`: local Barlow/Barlow Condensed WOFF2 fonts; SIL OFL 1.1 in `public/assets/FONT-LICENSE.txt`.

## Commander generation prompt

Built-in tool; no fallback CLI or API keys. Exact prompt:

> Use case: stylized-concept. Asset type: original wide key art and cinematic briefing still for PEPEFRONT, a gritty 1990s real-time strategy game. Create a cinematic 16:9 composition: a classic recognizable green Pepe frog military commander dominates the RIGHT half in three-quarter view, head and chest portrait with heavy eyelids, broad flat frog mouth, naturally green face, battered dark olive tactical helmet and army armor, two small glowing cyan rank pips, serious weary expression. The commander is in a dim concrete military command bunker with flickering CRT monitors and drifting smoke. On the far right behind his shoulder, a thin harsh magenta light. LEFT half is atmospheric dark negative space with faint tactical radar and bunker detail, very dark charcoal, to allow overlaid title. Realistic tactile low-poly/handcrafted military miniature character rendered with rich painterly detail, green skin and worn metal, high contrast cyan side-light, subtle grain and 1995 FMV texture. Sophisticated cinematic art direction, no cute toy proportions. Colors black forest green, luminous acid lime details, cold cyan edge light, tiny magenta accents. Keep eyes clearly Pepe-like, drooping lower lids, no human characters. No text, no logos, no typography, no watermarks, no UI frame. Wide landscape image, beautiful polished game cover art.

## Rebuilding the cover

The final cover is already delivered. With dependencies and Playwright Chromium installed, run `node scripts/cover.mjs`, then `npm run build`. The build itself does not need Chromium or image generation. The source uses no links to the generation tool's temporary output path.
