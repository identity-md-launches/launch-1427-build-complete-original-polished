# PEPEFRONT validation record

Worker validation on 12 October 2026. These are actual local checks, not independent certification. The submitted production export is the tested application. Hosting and arcade registration have not happened; the required continuation is in [README.md](README.md#publish-and-register--handoff-to-the-post-publication-agent).

## Reproducible checks

| Command | Result and evidence |
| --- | --- |
| `npm run build` | Passed. Vite 7.3.7 production build, followed by the opaque-origin export finalizer. [Build output](evidence/build.txt). |
| `npm run typecheck` | Passed with no TypeScript errors. [Typecheck output](evidence/typecheck.txt). |
| `npm test` | **27 passed, 0 failed.** [Engine test output](evidence/engine-tests.txt); [test source](tests/engine.test.mjs). |
| `npm run check:export` | Passed manifest, metadata, relative asset, complete asset, classic-script, remote-dependency and export-size checks. **596,480 bytes** of runtime files. [Export report](evidence/export-check.txt). |
| `npm run test:browser` | **40 passed**, 0 uncaught JavaScript errors, 0 failed resources. Chromium **156.0.8078.4**, 15:26–15:40 UTC. [Browser results](evidence/browser-results.json); [console transcript](evidence/browser-output.txt); [test source](tests/browser.mjs). |
| `npm audit --package-lock-only` | Reported 0 vulnerabilities at the time of this run. This is not a guarantee about future advisories. [Audit output](evidence/dependency-audit.txt). |
| `npm run check:submission` | Conservative uncompressed file total, per-file bytes, excluded generated directories and the 8 MiB limit are recorded in [submission-budget.json](evidence/submission-budget.json). |

The environment used Node 24.21.0 and npm, with pinned tool dependencies installed under disposable `test/scratch/tooling/`. Build/typecheck used `PATH="$PWD/test/scratch/tooling/node_modules/.bin:$PATH"`. The browser test used `PEPE_TOOL_ROOT="$PWD/test/scratch/tooling"` and `PEPE_CHROME=/home/levi/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`. Normal installation uses `npm ci`, then the README commands; these environment overrides are unnecessary after installing Playwright Chromium normally.

## Gameplay and integration coverage

The engine suite exercises seeded map creation, faction modifiers, team alliances, prerequisites and costs, valid/invalid placement, occupied-site rejection, construction completion, power shortage, training, exact refunds, automatic harvesting and resource consumption, pathfinding around obstacles, queued orders, repair, combat, ranks, stealth visibility, fog, uplink capture/contestation, victory/defeat/time-limit rules, score, pause, AI construction/training/offensive orders, and invalid clock deltas. It tests state transitions and outcomes rather than canvas implementation details.

The browser suite drives the built export using real Chromium pointer, keyboard and emulated touch events. It serves the game under `/preview/` with **no CORS headers**. Native controls and canvas input construct the full tech chain, train and cancel units, select squads, assign/recall control groups, queue movement, explore fog, and fight over uplinks. A complete UI-driven skirmish reaches its natural end and replays. A separate undefended Brutal match exercises defeat and the terminal arcade score message.

Long matches run through Playwright virtual time; simulation ticks, AI, harvesting, combat and victory rules remain unchanged. The test does not inject credits, damage, units or terminal results. `window.__PEPEFRONT__` exposes copied diagnostic snapshots for assertions. It has no game-state mutators. Virtual time is not a real-device frame-rate benchmark.

Observed terminal results: **uplink victory at 343.03 simulated seconds (5:43), score 4,357**; **undefended Brutal defeat at 177.62 seconds (displayed 2:57), score 267**. Both replay paths passed. A defenseless opening can lose sooner than the normal 5–12 minute match target.

The final runtime edit was a short-landscape CSS correction while the desktop match was running. The simulation and input code were unchanged. The subsequent touch/iframe phases loaded the rebuilt export, and the separate final 844×390 inspection measured that correction directly. No runtime source changes were made after those checks.

The iframe harness uses exactly `sandbox="allow-scripts allow-pointer-lock"`. It explicitly verifies that localStorage throws, bundled fonts load, `pepe-game/1` init produces ready with the same channel, wrong-channel and non-parent messages are ignored, parent pause/resume works, visibility pause can be resumed locally, and a natural terminal result emits one finite integer score. The loaded standalone game is also exercised with the browser context offline. This establishes no required runtime service dependency after loading; it does not add a service worker or promise first-load offline installation.

Audio validation checks gesture-gated AudioContext startup, mute/unmute and exposed state. Audible quality was not measured through physical speakers. Pause/replay is tested on desktop, emulated touch and in the opaque iframe. Browser results record uncaught JavaScript errors and failed resource requests rather than silently ignoring them.

The local documentation-link check, package/lockfile dependency comparison and SHA-256 inventory of all seven runtime assets are in [runtime-integrity.json](evidence/runtime-integrity.json). The source and exported cover were opened with Pillow and both measured exactly 1200×630 JPEG; the commander still measured 1672×941 WebP.

## Rendered evidence

Screenshots were captured from the actual production export and inspected during development:

- [Desktop lobby](evidence/desktop-lobby.jpg): original commander composition, concise product description, primary action, faction and local AI setup.
- [390px lobby](evidence/mobile-lobby.jpg): product and Deploy are visible in the initial viewport. The suite also checks 320px and 768px reflow and horizontal overflow.
- [Briefing](evidence/briefing.jpg): original commander still, mission steps and Take command action.
- [Desktop battle](evidence/desktop-battle.jpg): live combat, command cards, queue, fog, selection and minimap.
- [Touch battle](evidence/mobile-battle.jpg): resource row, mute/pause, selection/orders and three bottom panel controls.
- [Victory report](evidence/victory.jpg): natural uplink victory, score, elapsed time and replay action.
- [Sandbox defeat](evidence/sandbox-defeat.jpg): natural defeat within the storage-denied iframe, with its terminal score independently captured by the parent harness.
- [Short landscape battle](evidence/landscape-battle.jpg): 844×390. [Measured layout](evidence/landscape-layout.json) confirms document dimensions match the viewport, command bar ends at y=390, and the three camera buttons do not intersect the three uplink buttons.

The final browser report lists the terminal screenshot filenames and actual match outcomes. All evidence is local and bundled; links do not depend on an external screenshot service.

## Better Interface review

Applied the pinned Better Interface guide while designing and reviewing, including core principles from all six domains and its `document-web-design` workflow. The supplied input files are removed by the submission system; their attribution/license is retained in [licenses/NOTICE.md](licenses/NOTICE.md). [DESIGN.md](DESIGN.md) documents the final implemented tokens and components.

| Domain | Coverage, observed finding, and repair |
| --- | --- |
| Accessibility | Native labeled selects, buttons, modal focus containment/return, visible keyboard focus, explicit canvas instructions, keyboard selection/orders/building alternatives, semantic status text, mute and reduced motion. `src/main.ts:111` restores dialog focus; `src/style.css:96` defines focus-visible outlines. Build cards now expose cost/time in their accessible names and prerequisite text via `aria-describedby` (`src/main.ts:196`). Production progress originally replaced buttons repeatedly; `src/main.ts:336` now preserves nodes while updating time/progress, avoiding focus loss. |
| Layout | Inspected desktop, 390px touch and 844×390 landscape; the suite checks 320/390/768px lobby reflow. The desktop minimap initially fell below the command panel; `src/main.ts:189` moves it to a stable battlefield position and into the touch drawer at the breakpoint. A 440px minimum game height clipped landscape commands; `src/style.css:919` now uses 320px. Camera controls overlapped uplink C on short screens; `src/style.css:2644` places them in a separate horizontal row. The rendered measurement verifies no overlap. |
| Writing | The first view names a real-time strategy game and presents Deploy immediately. Setup explicitly says one human and local AI. Mission steps explain resource collection, production and the win condition beside the action. Locked construction reports a specific prerequisite; invalid locations explain the obstruction. Restart/leave confirmations name their consequences. No UI promises online matchmaking, rewards, a hosted CID or approved registration. |
| Typography | Two locally bundled font families and a system monospace, six semantic size roles, readable line height, constrained prose measure, tabular resource counters and 16px touch selects. Browser font loading is checked both standalone and in the opaque iframe. The compact canvas labels scale with zoom and are documented separately from the HTML type scale. |
| Colors | A cohesive green-black/acid-lime palette, cyan allies and magenta enemies; names, icons, glyphs, pips and check marks supplement color. Five browser-computed solid text/background pairs were measured at **5.89:1–14.74:1**. [Raw contrast measurements](evidence/contrast-measurements.json). These are measured samples, not a claim of comprehensive WCAG certification or guaranteed contrast over every art pixel. |
| UI | Original commander art, frog miniatures, faction marks and job silhouettes; deliberate empty, selected, prerequisite, queue, low-power, pause and terminal states. Native touch testing found a lost first tap after canvas dragging and a duplicate click during modal replacement. `src/main.ts:697` now activates stationary touch releases once and suppresses their duplicate compatibility clicks. Short transitions respect reduced motion (`src/style.css:1690`, `src/main.ts:995`); moving atmospheric effects are disabled while essential tactical motion remains. |

Additional gameplay/integration repairs found during testing:

- `src/game.ts:798`: blocked-goal search uses fixed original grid coordinates, preventing its loop bounds from moving during nearest-cell search.
- `src/game.ts:584`: placement rejects mobile Pepes occupying a proposed foundation, preventing accidental trapping.
- `src/game.ts:1059`: invalid, negative or zero deltas cannot rewind or poison simulation state; a regression test covers this. Virtual-clock installation exposed this boundary condition.
- `src/main.ts:1003`: visibility pause is separate from the arcade's host-owned pause, allowing local resume after returning to the tab.
- `src/bridge.ts:7`: parent source, protocol and channel are validated. `scripts/finalize-export.mjs` emits a classic bundled script and embedded fonts, eliminating module/font CORS dependencies inside an opaque iframe.

## Remaining limits

- Chromium desktop plus emulated touch were tested. No physical phone, Safari, Firefox, screen reader, native browser 200% zoom, gamepad, or low-end hardware performance certification was performed. Narrow-viewport reflow is not a substitute for native zoom testing.
- Complete browser matches use 1v1. Lobby selection/slots and engine team initialization cover 2v2 and four-way FFA; separate full-length browser matches for those two formats were not run.
- The battlefield is visual Canvas 2D, not a fully nonvisual playable RTS. Semantic menus and keyboard alternatives improve access but do not make spatial combat accessible to every user. Dense tactical annotations and photographic/translucent contrast need broader assistive-technology testing.
- This focused release has one map, one human commander, local AI in three match formats, no saved campaign, and no remote swarm or network multiplayer. AI receives disclosed escalating supply grants. Unit cap is 50 per side.
- FMV-style briefings use an original generated still and text rather than video. Fog/searchlights/reflections are stylized 2D effects. Combat uses simplified projectiles and line-of-sight rules. Touch uses explicit orders and camera buttons; group assignment/Shift queues require a keyboard, and pinch zoom is not implemented.
- The classic export, frame-rate-independent simulation and reduced minimap cadence reduce overhead, but no universal 60fps promise is made. Neither a public gateway nor the real arcade host was available to this build worker; the local harness verifies the published contract, not a future deployment.
- **Registration pending: post-publication agent required.** No release helper, registration callback, secret capability or payment workflow is included in the browser bundle.
