# PEPEFRONT design system

## Overview

PEPEFRONT is a compact, single-player real-time strategy game for commanders on desktop and touch devices. Its identity combines a neon-noir command bunker, acid-green military graphics, a weary Pepe commander, and readable miniature battlefields. A large condensed wordmark and one bright Deploy action establish the product; restrained rules and warm green-black surfaces organize the supporting controls.

The lobby uses cinematic composition. The battlefield uses dense, purposeful command chrome around a Canvas 2D map. These are distinct layouts sharing typography, colors, icon strokes, and action states. The art is original; the generated commander still is documented in [ART.md](ART.md).

Touch controls activate stationary pointer releases once and discard duplicate compatibility clicks after a drag. This preserves native keyboard activation while making the post-drag tap reliable.

Source of truth: [`src/style.css`](src/style.css), [`src/main.ts`](src/main.ts), [`src/render.ts`](src/render.ts), and [`src/icons.ts`](src/icons.ts). This document describes the implemented system, not proposed future variants.

## Colors

The canonical palette is hex, defined in `:root` in `src/style.css`.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0b100f` | Page and modal background |
| `--surface` | `#121b17` | Controls and secondary surfaces |
| `--raised` | `#1c2820` | Raised/hover surfaces and production jobs |
| `--hover` | `#25352a` | Pressed/interactive feedback |
| `--border` | `#354538` | Structural boundaries and control edges |
| `--text` | `#e8eddf` | Main labels and headings |
| `--muted` | `#acb9a5` | Secondary descriptions and labels |
| `--faint` | `#84937e` | Footer and low-emphasis metadata |
| `--accent` | `#bafa47` | Primary action, selected state, crystal resource |
| `--accent-ink` | `#12200b` | Text on the primary action |
| `--ally` | `#8ce9dd` | Friendly owner markers and Initiative emblem |
| `--enemy` | `#ee77b0` | Opponent markers and Cult emblem |
| `--warning` | `#ffc18b` | Low power and incoming attacks |
| `--focus` | `#d9ff91` | Keyboard focus perimeter |

There is one intentionally dark theme. No unused light theme or additional color ramp is shipped. In the four-player simulation, owner colors add ochre `#e8bc65` and lavender `#a1a0fa` (`COLORS` in `src/game.ts`). Ownership is also labeled by name, Allied/Enemy/Neutral text, and job glyphs. Faction cards combine color, emblem, check mark, and `aria-pressed`.

Measured browser-computed solid pairs: Deploy **13.62:1**, selected faction primary text **13.47:1**, its secondary text **7.83:1**, native select text **14.74:1**, footer metadata **5.89:1**. Raw data: [contrast measurements](evidence/contrast-measurements.json). These measurements do not certify every pixel over the photographic background or translucent battlefield overlays.

## Typography

- `--font`: **Barlow**, `Arial`, `sans-serif`. Local regular 400 and semibold 600 WOFF2 files live in `src/assets/`.
- `--display`: **Barlow Condensed**, `Arial Narrow`, `Impact`, `sans-serif`. Local 700 and 800 weights supply the military wordmark and short headings.
- `--mono`: `Courier New`, `monospace` for time, coordinates, hotkeys, and machine labels. No remote font request is made.

Six semantic size roles: `--xs: .75rem` (12px), `--sm: .875rem` (14px), `--body: 1rem` (16px), `--md: 1.375rem` (22px), `--lg: 2.5rem` (40px), and `--hero: clamp(4rem, 9.5vw, 9rem)`. The hero role receives narrower clamps at responsive breakpoints; these are adjustments to the display role, not a second scale. Canvas text is a separate tactical annotation system at 8–12 world pixels and zooms with the battlefield.

Body line height is 1.5; long manual copy uses 1.6. Display headings use 0.92–1.15 with small negative tracking. Headings balance, prose uses `text-wrap: pretty`, and the hero description caps at 34ch. Changing counters use tabular numerals. Native mobile selects use 16px text. `font-synthesis: none` is intentional: every required web-font weight is bundled. The build embeds the fonts to support opaque-origin iframes without CORS-dependent font fetching.

## Layout

Lobby: maximum width 1600px, shared 4% horizontal gutters, 78px header, cinematic hero, then a three-column mission setup (faction / engagement / map) with 36px gaps. The source uses 6/8/10/12/16px internal gaps and 20/24/28/32/36px section separation, with deliberate denser exceptions in the tactical HUD.

- Above 1500px: more hero space and a 310px command panel.
- At 1200px: setup becomes two columns; the map gets a full-width row. Tactical sidebar narrows to 260px.
- At 950px: desktop command branding compresses and the sidebar becomes 238px.
- At 720px: lobby setup stacks, faction choices form two compact columns, header chrome simplifies, and typography wraps within 20–24px gutters. The main Deploy action remains in the first viewport.
- At 390px: gutters and resource spacing tighten. The responsive title keeps PEPEFRONT on one line down to 320px.

Game: `100dvh` shell with a 320px minimum height, 70px header, flexible battlefield plus a 278px command panel, and a 104px bottom command bar. At 720px and below, the game uses a 61px header, 105px selection/order bar, and a 52px bottom panel selector. Production/minimap panels open above these stable controls and scroll internally at a maximum 68dvh. Safe-area bottom padding is included.

The desktop minimap stays on the lower-left battlefield, independent of sidebar height. `relocateRadar()` in `src/main.ts` moves the same accessible canvas into the touch panel when the breakpoint changes. At heights of 600px or less and widths above 720px, camera buttons form a horizontal row left of the uplinks, the minimap shrinks to 150px, and secondary details hide while primary commands remain usable. The map camera uses a slight vertical compression for miniature depth; pointer projection uses the matching inverse transform.

Observed review widths and exact checks are listed in [VALIDATION.md](VALIDATION.md). Narrow-viewport reflow is not represented as native browser 200% zoom.

## Elevation & Depth

Surfaces are mostly flat with one-pixel structural borders. The selected faction adds a three-pixel inset stripe. The primary Deploy action has a faint green glow, while modals use a dark 24px/100px shadow and a blurred, darkened backdrop. Battlefield overlays use near-opaque dark panels to protect text contrast.

The Canvas layer draws seeded concrete slabs, arterial roads, cracks, puddles, rubble, extruded building faces, vehicle tracks, and Pepe faces. Ground shadows, cyan/magenta equipment strips, glowing crystals, searchlight cones, rain, haze and combat particles add atmosphere. Fog of war masks unexplored terrain; the minimap reflects current vision. The scenery is simulated in 2D, not a WebGL volumetric renderer.

HUD layers sit above the canvas. The command bar and touch panel selector have stable stacking, while native dialogs use the browser top layer. Decorative SVG, scanlines and hero graphics never capture pointer input.

## Shapes

The repeated shape language is clipped military insignia, angular roofs, sharp rectangles and thin tactical rings. Controls use a restrained 2px radius. Faction emblems are a shield and triangular cult mark; jobs use silhouettes plus `R/E/T/C/H` glyphs. Rank pips remain attached to each Pepe. No emoji art or external icon pack is used.

Original icons in `src/icons.ts` share a 24px viewBox, a 1.7px stroke and `currentColor`. Icons generally render at 20px, with deliberately smaller copies in dense resource labels and touch rows. Selection rings and capture progress are thin; they do not replace health/status text.

## Components

| Pattern / source | Use and states |
| --- | --- |
| `.primary-button` / `src/style.css` | One main filled action per modal or lobby view. 56px minimum height, hover/pressed feedback, visible focus, native disabled state when the parent arcade owns pause. |
| `.icon-button`, `.quiet-button`, `.secondary-button` | Secondary commands with accessible names. Default 44px targets; compact tactical exceptions remain at least 24px. |
| `header()` / `src/main.ts` | Original insignia, product name, field manual and sound control. Local-command wording does not imply network multiplayer. |
| `.faction-option` / `lobby()` | Check mark, emblem, border and `aria-pressed` convey selection. No color-only choice state. |
| `.select-wrap` | Native labeled selects. Decorative chevron cannot intercept events. |
| `.build-card` / `renderCards()` | Canvas-generated local miniature preview, job/structure name, cost, build time, hotkey and prerequisite. `aria-disabled` retains discoverability; attempting a locked action reports how to unlock it. Costs and time appear in the accessible name; requirement text is referenced with `aria-describedby`. |
| `.queue-item` / `updateHUD()` | Cancel/refund action, visible remaining time and progress. Progress updates retain the button node instead of replacing focus every frame. |
| `.radar` / `Renderer.drawMini()` | Fog-aware tactical map. Pointer/touch jumps, arrow-key panning, camera rectangle, ownership markers and descriptive name. Updated at a lower cadence than the battlefield. |
| `.command-bar` | Current selection, job/health/rank detail, Select army, Order, Stop, last-alert jump and sector signal (a compact map-footer counter on smaller screens). |
| `.lesson`, `.battle-log` | Contextual opening steps and a stable polite status region. Events remain visible until replaced; hiding onboarding is a separate labeled action. |
| Native `dialog` / `showDialog()` | Briefing, manual, pause, leave/restart confirmation and final results. Browser focus containment; explicit focus return; Escape closes/returns according to the active state. |

High-frequency UI transitions are 100–150ms. The primary/faction press scale is 0.96 only when reduced motion is not requested. Reduced motion disables the recording indicator animation, moving searchlights, rain/haze motion, crystal motion and particles; essential unit movement, shots and static selection feedback remain. Pause stops the simulation and its decorative game clock. Mute remains reachable in desktop and touch HUDs; sound starts only after a user gesture.

The application deliberately does not claim full nonvisual gameplay accessibility. The manual, menus and action controls are semantic HTML with keyboard alternatives; spatial battlefield interpretation still depends on the canvas.

## Do's and Don'ts

- Reuse semantic tokens and the six type roles. Keep neutral surfaces warm green-black; preserve acid green for command emphasis and resources.
- Extend the existing native controls and dialog pattern. Keep the primary action visible before long setup content, especially at 390px.
- Place explanatory text next to controls. Distinguish local AI from any future real network functionality.
- Pair status colors with text, glyphs, pips, or shape. Keep selection, prerequisite, paused, queue-empty and game-over states explicit.
- Add new miniature jobs in `SPECS` and the renderer, then expose them through the existing command card pattern. Include a readable silhouette and job glyph.
- Do not add remote fonts, a backend dependency, wallet UI, fake online-player counts, unrelated gradients, oversized dashboard cards or modal permission gates.
- Keep future pages within the existing header/gutter system, choose one filled action, and verify the production export at desktop, 390px and 320px before updating this document.
