# PEPEFRONT validation record

Worker validation on 12 October 2026. These are actual local checks, not independent certification. The submitted production export is the tested application. Hosting and arcade registration have not happened; the required continuation is in [README.md](README.md#publish-and-register--handoff-to-the-post-publication-agent).

## Reproducible checks

| Command | Result and evidence |
| --- | --- |
| `npm run build` | Passed. Vite 7.3.7 production build, followed by the opaque-origin export finalizer. [Build output](evidence/build.txt). |
| `npm run typecheck` | Passed with no TypeScript errors. [Typecheck output](evidence/typecheck.txt). |
| `npm test` | **31 passed, 0 failed.** [Engine test output](evidence/engine-tests.txt); [test source](tests/engine.test.mjs). |
| `npm run check:export` | Passed manifest, metadata, relative asset, complete asset, classic-script, remote-dependency and export-size checks. **597,331 bytes** of runtime files. [Export report](evidence/export-check.txt). |
| `npm run test:browser` | **40 passed**, 0 uncaught JavaScript errors, 0 failed resources. Chromium **141.0.7390.37**, 16:38–16:43 UTC. [Browser results](evidence/browser-results.json); [console transcript](evidence/browser-output.txt); [test source](tests/browser.mjs). |
| `npm run test:revision` | **35 passed, 0 failed.** Chromium **141.0.7390.37** and WebKit **26.0 (build 2215)**. [Final results](evidence/revision-after.json), [output](evidence/revision-after.txt), [test source](tests/revision.mjs). |
| `npm audit --package-lock-only` | Original-round evidence: reported 0 vulnerabilities at that time; not rerun for this revision because dependencies did not change. This is not a guarantee about future advisories. [Audit output](evidence/dependency-audit.txt). |
| `npm run check:submission` | Conservative uncompressed file total, per-file bytes, excluded generated directories and the 8 MiB limit are recorded in [submission-budget.json](evidence/submission-budget.json). |

The revision environment used Node **24.9.0** and npm **11.6.0**. `npm ci --prefix /tmp/pepefront-revision-tools --cache /tmp/pepefront-npm-cache --no-audit --no-fund` installed the repository's exact package/lockfile copies outside the repository. Build/typecheck used `PATH=/tmp/pepefront-revision-tools/node_modules/.bin:$PATH`; browser tests used `PEPE_TOOL_ROOT=/tmp/pepefront-revision-tools` and `PLAYWRIGHT_BROWSERS_PATH=/tmp/pepefront-browsers`. Playwright **1.56.1** installed Chromium 141 and WebKit 26.0/build 2215.

WebKit's system libraries were supplied from disposable `/tmp` extractions, with `PEPE_WEBKIT=/tmp/pepefront-webkit` pointing to a launcher that sets its bundled library paths. Headless rendering used `LIBGL_ALWAYS_SOFTWARE=1`, `__EGL_VENDOR_LIBRARY_FILENAMES=/tmp/imd-review-deps/usr/share/glvnd/egl_vendor.d/50_mesa.json`, `LIBGL_DRIVERS_PATH=/tmp/imd-review-deps/usr/lib/x86_64-linux-gnu/dri` and `XDG_CACHE_HOME=/tmp/pepefront-browser-cache`. These are machine-specific test settings, not game dependencies. Normal installs can use `npx playwright install --with-deps chromium webkit`, followed by the README commands. No dependencies, downloaded browsers, extracted libraries or caches are included in the submission. The configured browser MCP launcher lacked its expected Chrome executable; the real-browser checks and screenshots therefore used the locally installed Playwright engines described above.

## Revision findings and reproduction

All five reports reproduced before runtime edits. [Original-export observations](evidence/revision-before.json) and [console output](evidence/revision-before.txt) retain the raw measurements and click events; [`.imd-responses.json`](.imd-responses.json) answers each full finding ID. Repeated symptoms are grouped by cause below. The final report includes export hashes so its observations can be matched to the delivered bundle.

| Finding (ID prefix) | Original observation | Final repair and recheck |
| --- | --- | --- |
| High: `42efb71f` touch activation | On WebKit 26.0, each tap produced an untrusted synthetic click followed by a trusted `pointerType="mouse"` click. Base/Army/Minimap closed; Order and Mute toggled off again. | `src/main.ts:717`: retain the necessary post-drag workaround, deduplicate its handled target/gesture instead of pointer type, clear pending deduplication on a new pointerdown, and preserve keyboard activation. All five toggles, repeated taps, touch-to-mouse/keyboard activation and Chromium's native post-drag tap pass. |
| Medium: `5496e1fd` minimap | HQ (360,390) taps centered (490.23,394.64) at 390px and (826.67,394.64) at 700px. | `src/main.ts:664`: subtract borders and centered contain gutters when mapping pointer coordinates. HQ and distant destination tests pass at 320/390/700px in both engines, with less than 10 world units of touch-event rounding error. |
| Medium: `89314ee2` harvest queue | Seed 8127 reproduced the reported t=30 position (463.94498,235.12881), cargo 118.4, `harvestNode=1` while order 0 still headed the queue. | `src/game.ts:1022`: activate the head harvest order only, finish it on HQ delivery, advance queued work, then continue automatic harvesting. Engine tests cover sequential fields, movement before/after harvesting, partial deposits and empty fields. Native Shift-right-click browser tests observe the first field at 8 seconds and the second assignment afterward. |
| Medium: `d31f7591` host pause | Restart, fresh deployment after leaving, and pause received in the lobby all allowed unpaused simulation without parent resume. | `src/main.ts:78`, `:157`, `:400`, `:414`: persist arcade pause independently of the match. Both engines keep restarted games at **time=0, paused=true after 2.2 real seconds**, disable local Resume, reject wrong-channel resume, and honor valid pause/resume in the lobby. |
| Medium: `83814666` Order state | At 320/390px after construction cancellation, mode was `select` but `aria-pressed` was `true`. | `src/main.ts:458`: one setter updates mode, pressed state and the status message. Both widths and engines pass cancellation followed by re-enabling Order and issuing movement to the still-selected five Pepes. |

Removing the touch workaround was tried locally. It fixed WebKit toggles but reproduced Chromium's lost first button tap after a native canvas drag; the final implementation therefore keeps the workaround and fixes its deduplication. During visual review the old Order-mode status sentence was also visible after cancellation; the shared setter now updates that sentence, and the regression asserts it. No art, layout, balance or faction redesign was made.

Test-harness corrections: the initial new harvesting assertion sampled so late that the second load had already completed, so it now observes the second assignment at 18 seconds. WebKit's virtual clock is installed before navigation so `performance.now()` and animation callbacks share one clock from startup. Neither adjustment mutates game state. The final 35-check run passed; before/after reports do not imply every intermediate test attempt passed.

## Gameplay and integration coverage

The engine suite exercises seeded map creation, faction modifiers, team alliances, prerequisites and costs, valid/invalid placement, occupied-site rejection, construction completion, power shortage, training, exact refunds, automatic harvesting and resource consumption, pathfinding around obstacles, queued movement and harvesting cycles, partial/empty field handling, repair, combat, ranks, stealth visibility, fog, uplink capture/contestation, victory/defeat/time-limit rules, score, pause, AI construction/training/offensive orders, and invalid clock deltas. It tests state transitions and outcomes rather than canvas implementation details.

The browser suite drives the built export using real Chromium pointer, keyboard and emulated touch events. It serves the game under `/preview/` with **no CORS headers**. Native controls and canvas input construct the full tech chain, train and cancel units, select squads, assign/recall control groups, queue movement, explore fog, and fight over uplinks. A complete UI-driven skirmish reaches its natural end and replays. A separate undefended Brutal match exercises defeat and the terminal arcade score message.

Long matches run through Playwright virtual time; simulation ticks, AI, harvesting, combat and victory rules remain unchanged. The test does not inject credits, damage, units or terminal results. `window.__PEPEFRONT__` exposes copied diagnostic snapshots for assertions. It has no game-state mutators. Virtual time is not a real-device frame-rate benchmark.

Observed terminal results: **uplink victory at 338.77 simulated seconds (displayed 5:38), score 4,650**; **undefended Brutal defeat at 174.05 seconds (displayed 2:54), score 267**. Both replay paths passed. A defenseless opening can lose sooner than the normal 5–12 minute match target.

The final runtime edit synchronized the selection/order status message with the shared command-mode setter. The production build and typecheck ran afterward. The final revision and full-game browser suites load that rebuilt export. No runtime changes were made after those checks began.

The iframe harness uses exactly `sandbox="allow-scripts allow-pointer-lock"`. It explicitly verifies that localStorage throws, bundled fonts load, `pepe-game/1` init produces ready with the same channel, wrong-channel and non-parent messages are ignored, parent pause/resume works, visibility pause can be resumed locally, and a natural terminal result emits one finite integer score. The loaded standalone game is also exercised with the browser context offline. This establishes no required runtime service dependency after loading; it does not add a service worker or promise first-load offline installation.

Audio validation checks gesture-gated AudioContext startup, mute/unmute and exposed state. Audible quality was not measured through physical speakers. Pause/replay is tested on desktop, emulated touch and in the opaque iframe. Browser results record uncaught JavaScript errors and failed resource requests rather than silently ignoring them.

The refreshed local documentation-link check, package/lockfile dependency comparison and SHA-256 inventory of all seven runtime assets are in [runtime-integrity.json](evidence/runtime-integrity.json). The unchanged source/export cover and commander still were measured with Pillow in the original round (1200×630 JPEG and 1672×941 WebP respectively); their asset hashes are preserved.

## Rendered evidence

Screenshots were captured from the actual production export and inspected. Revision screenshots include [WebKit Order off after cancellation at 320px](evidence/revision-webkit-order-320.jpg), [WebKit minimap at 700px](evidence/revision-webkit-minimap-700.jpg), [Chromium minimap at 390px](evidence/revision-chromium-minimap-390.jpg), and [WebKit restarted under host pause](evidence/revision-webkit-host-paused.jpg). Automated revision image paths are listed in its JSON report. A final [Chromium touch HQ view](evidence/revision-touch-hq.jpg) was captured after opening the minimap, jumping away, closing it and tapping HQ: camera changed from (1484.04,809.17) to (360,390). Advancing the browser clock one frame before that capture confirmed the canvas repainted; no game-state mutation was used.

The existing full-game suite refreshes these views:

- [Desktop lobby](evidence/desktop-lobby.jpg): original commander composition, concise product description, primary action, faction and local AI setup.
- [390px lobby](evidence/mobile-lobby.jpg): product and Deploy are visible in the initial viewport. The suite also checks 320px and 768px reflow and horizontal overflow.
- [Briefing](evidence/briefing.jpg): original commander still, mission steps and Take command action.
- [Desktop battle](evidence/desktop-battle.jpg): live combat, command cards, queue, fog, selection and minimap.
- [Touch battle](evidence/mobile-battle.jpg): resource row, mute/pause, selection/orders and three bottom panel controls.
- [Victory report](evidence/victory.jpg): natural uplink victory, score, elapsed time and replay action.
- [Sandbox defeat](evidence/sandbox-defeat.jpg): natural defeat within the storage-denied iframe, with its terminal score independently captured by the parent harness.
- [Short landscape battle](evidence/landscape-battle.jpg): retained original-round screenshot at 844×390; CSS was unchanged in the revision. [Measured layout](evidence/landscape-layout.json) confirms document dimensions match the viewport, command bar ends at y=390, and the three camera buttons do not intersect the three uplink buttons.

The final browser report lists the terminal screenshot filenames and actual match outcomes. All evidence is local and bundled; links do not depend on an external screenshot service.

## Better Interface review

Applied the pinned Better Interface guide while designing and reviewing, including core principles from all six domains and its `document-web-design` workflow. The supplied input files are removed by the submission system; their attribution/license is retained in [licenses/NOTICE.md](licenses/NOTICE.md). [DESIGN.md](DESIGN.md) documents the final implemented tokens and components.

| Domain | Revision coverage, findings and limits |
| --- | --- |
| Accessibility — Checked | Native mouse, touch, Enter and Space activation; Order `aria-pressed` matches actual mode; parent-paused Resume is disabled; visible modal focus inspected in the WebKit screenshot. Regression fixes at `src/main.ts:458` and `:717`. Existing keyboard, modal and reduced-motion checks remain in the full-game suite. No screen-reader session or physical-device test. |
| Layout — Checked | Existing composition and CSS preserved. Production screenshots inspected at desktop and 320/390/700px touch widths. Minimap image-to-input correspondence was incorrect and is fixed at `src/main.ts:664`. Lobby reflow/first-screen Deploy checks remain at 320/390/768px. Native 200% zoom and RTL mirroring were not tested; the game is English-only. |
| Writing — Checked | Shared setter now announces Selection mode when construction turns Order off, preventing the old contradictory Order sentence. Pause copy accurately states that the arcade must resume. README documents one-load harvesting completion. Existing command vocabulary, briefing and destructive confirmations retained. |
| Typography — Checked | Source tokens and local fonts unchanged; desktop/mobile screenshots inspected for wrapping and reachable labels, including two-line status copy at 320px. Six existing HTML size roles and tabular counters preserved. Canvas tactical labels remain visual and zoom-dependent. |
| Colors — Checked within scope | Existing tokens are unchanged. Inspected the Order pressed/unpressed state and visible keyboard focus against the existing surfaces. The original round's five measured solid text/background pairs remain in [contrast-measurements.json](evidence/contrast-measurements.json), **5.89:1–14.74:1**; these measurements were not rerun and do not establish all photographic/translucent contrast pairs. |
| UI — Checked | All five touch toggles now act once; native post-drag tap works; minimap jumps match the image; construction cancellation, host-paused restart and lobby transitions keep truthful states. No unrelated component or animation redesign. Motion guards remain unchanged; animations were not inspected at 10% speed. |

The final [DESIGN.md](DESIGN.md) updates the implemented touch activation, minimap projection, command-mode setter and host-pause behavior while preserving the existing tokens and components.

Original-round gameplay/integration repairs retained (historical source references):

- `src/game.ts:798`: blocked-goal search uses fixed original grid coordinates, preventing its loop bounds from moving during nearest-cell search.
- `src/game.ts:584`: placement rejects mobile Pepes occupying a proposed foundation, preventing accidental trapping.
- `src/game.ts:1059`: invalid, negative or zero deltas cannot rewind or poison simulation state; a regression test covers this. Virtual-clock installation exposed this boundary condition.
- `src/main.ts:1003`: visibility pause is separate from the arcade's host-owned pause, allowing local resume after returning to the tab.
- `src/bridge.ts:7`: parent source, protocol and channel are validated. `scripts/finalize-export.mjs` emits a classic bundled script and embedded fonts, eliminating module/font CORS dependencies inside an opaque iframe.

## Remaining limits

- Chromium 141 desktop and emulated touch plus WebKit 26.0 desktop/emulated mobile regressions were tested. Linux Playwright WebKit is not a physical iPhone or Safari session. No physical phone, Safari application, Firefox, screen reader, native browser 200% zoom, gamepad, or low-end hardware performance certification was performed. Narrow-viewport reflow is not a substitute for native zoom testing.
- Complete browser matches use 1v1. Lobby selection/slots and engine team initialization cover 2v2 and four-way FFA; separate full-length browser matches for those two formats were not run.
- The battlefield is visual Canvas 2D, not a fully nonvisual playable RTS. Semantic menus and keyboard alternatives improve access but do not make spatial combat accessible to every user. Dense tactical annotations and photographic/translucent contrast need broader assistive-technology testing.
- This focused release has one map, one human commander, local AI in three match formats, no saved campaign, and no remote swarm or network multiplayer. AI receives disclosed escalating supply grants. Unit cap is 50 per side.
- FMV-style briefings use an original generated still and text rather than video. Fog/searchlights/reflections are stylized 2D effects. Combat uses simplified projectiles and line-of-sight rules. Touch uses explicit orders and camera buttons; group assignment/Shift queues require a keyboard, and pinch zoom is not implemented.
- The classic export, frame-rate-independent simulation and reduced minimap cadence reduce overhead, but no universal 60fps promise is made. Neither a public gateway nor the real arcade host was available to this build worker; the local harness verifies the published contract, not a future deployment.
- **Registration pending: post-publication agent required.** No release helper, registration callback, secret capability or payment workflow is included in the browser bundle.

## Completion

Complete for the stated revision scope: all five findings reproduced and fixed, required build/typecheck/engine/browser checks passed, final static export included, six-domain review recorded. This is local worker evidence, not independent certification or completed publication. Registration still requires the post-publication continuation described in README.
