# PEPEFRONT

**Command the night.** An original, complete single-player RTS for the Pepe2Pepe arcade. Build a base, protect your Harvester Pepes, train an army, and fight for a rain-soaked industrial sector.

The ready-to-host game is in **[`dist/`](dist/)**. It includes `index.html`, the `pepe-browser-game/1` manifest, an original 1200×630 cover, and every runtime asset. No backend, account, wallet, CDN, token, reward, or persistent storage is required. The game works under a relative gateway subpath and in `sandbox="allow-scripts allow-pointer-lock"`.

## Play

Open the served export, choose Initiative or Cult, select an engagement and difficulty, then **Deploy to Nightfall → Take command**. The briefing and field manual explain the opening. Recruit AI gives new commanders more preparation time.

- **1v1:** you against one AI commander.
- **2v2:** you and Echo AI against two enemy AI commanders. Allies share vision and uplink signal.
- **Four-way FFA:** you against three independent AI commanders.

These are local, single-human skirmishes, consistent with the arcade v1 contract. The lobby updates its slots immediately. There is no network multiplayer or remote swarm connection.

### Win conditions

Destroy every enemy Command HQ, or hold the three uplinks to accumulate **540 signal**. A held uplink provides one signal per second, even when your troops move on. An enemy must capture it to stop your income. Capturing takes 12 seconds with two nearby Pepes and 6 seconds with four or more; opposing teams in the zone halt capture.

Matches target **5–12 minutes**. At 12 minutes, the surviving team with the greatest signal plus 1% of its surviving HP wins. Losing your own HQ ends your match, including in 2v2. No progress persists between runs. The after-action report includes score, eliminations, harvested crystals, elapsed time, and instant replay.

### Opening plan

1. Your two Harvester Pepes already collect crystals and return to HQ. Keep them alive.
2. Build **Power plant → Barracks → War factory → Signal lab**. Buildings must stay within 350m of a completed friendly structure, away from other structures, ruins, crystal fields and uplinks.
3. Train Recruits to take an early uplink. Produce Tanks to hold contested lanes. Engineers automatically repair nearby friendly buildings.
4. Keep power capacity above demand. Low power reduces production speed to 40% and halves defensive firing rate. A Signal lab gives all troops +20% damage.
5. Keep reinforcements moving. Higher AI difficulties build larger armies, attack more often, and receive larger escalating supply grants in addition to their harvested income.

## Pepe jobs and ranks

All combatants and vehicle crews are Pepes. Job glyphs (`R`, `E`, `T`, `C`, `H`) and rank pips remain visible; the selection panel names the selected job and health.

| Job | Initiative cost | Role |
| --- | ---: | --- |
| Recruit Pepe | 85 | Mobile rifle unit, screening and uplink capture |
| Engineer Pepe | 130 | Repairs nearby friendly structures at 26 HP/s; can capture uplinks |
| Tank Pepe | 260 | Pepe-piloted armor, long-range cannon, 35% splash damage within 55m |
| Commando Pepe | 190 | Fast elite infantry; Cult version cloaks at range |
| Harvester Pepe | 210 | Automatically gathers up to 140 crystals and delivers them to HQ |

Rank 1 is the starting rank; **2 eliminations** give rank 2 and **6 eliminations** give rank 3. Each additional rank increases damage by 12%. The unit cap is 50 per side, including Harvesters and Engineers. The production queue holds up to eight jobs. Canceling a queued job refunds its exact paid cost.

### Factions

| Rule | Initiative Pepes | Cult Pepes |
| --- | --- | --- |
| Health, including structures | +20% | −10% |
| Unit speed | −6% | +15% |
| Unit/building cost | Base cost | −20%, rounded |
| Commandos | Visible in enemy vision | Hidden beyond 135m unless firing in the last 2 seconds |
| Style | Tough defenses and armor | Cheap, fast pressure and stealth |

Both factions use the same readable tech chain. Team colors identify owners; unit silhouettes identify jobs. This focused release uses one original map, Nightfall.

## Controls

| Action | Desktop / keyboard |
| --- | --- |
| Select | Left-click a unit/building |
| Select a squad | Drag a box; Shift adds/removes |
| Same job and rank on screen | Double-click a friendly Pepe |
| Advance / attack-move / attack target | Right-click ground or a visible enemy |
| Queue orders | Shift + right-click |
| Save / recall control group | Ctrl or Cmd + 1–9 / 1–9 |
| Select all combat Pepes | X or Select army |
| Cycle individual Pepes | Z |
| Order to camera center | Enter while battlefield/minimap is focused |
| Stop selected units | H or Stop |
| Camera | WASD, edge-pan, or middle-mouse drag |
| Zoom | Mouse wheel, + / −, or zoom buttons |
| Jump camera | Click/drag minimap; minimap arrows work from keyboard |
| Center HQ / last alert | Home / Space |
| Base / Army menu | B / F |
| Build/train displayed items | Q, E, R, T, G |
| Cancel placement / pause | Escape / P |
| Pause, mute, manual | Labeled buttons in the interface |

**Touch:** tap selects; drag pans. Use **Select army → Order → tap destination** to advance. Tap Order again to return to selection mode. **Build base**, **Train army**, and **Minimap** open compact panels; tap the same panel button to dismiss it. Choose a building, tap its location, then **Place here**. The zoom buttons remain available. Control-group assignment and Shift queues require a keyboard; touch does not emulate multi-key shortcuts or pinch zoom.

**Keyboard construction:** choose a structure with a shortcut or Tab, pan with WASD, then use Enter or **Place at center**. Native dialogs contain focus; Escape returns to the previous surface. The visual battlefield is not a fully screen-reader-playable RTS; menus, instructions, and status text are semantic HTML.

## Install, preview, and rebuild

Use Node **22.18+** (Node 24 recommended; engine tests use native TypeScript stripping) and npm.

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run check:export
npm run check:submission
npm run preview
```

For source development: `npm run dev`. For browser validation, install Playwright Chromium once, then run:

```sh
npx playwright install chromium
npm run test:browser
```

The browser test owns its temporary HTTP server and Chromium lifecycle. It serves the production export at `/preview/`, checks actual pointer/keyboard/touch interactions, and tests a storage-denied iframe with **no CORS response headers**. Full matches use Playwright virtual time to exercise the production simulation without changing game state. Results and screenshots are written to `evidence/`.

The delivered export is already built; hosting **does not need to install dependencies or rebuild**. Do not open the source `index.html` directly as a file. Use HTTP preview or static hosting. The classic IIFE export avoids ES-module loading restrictions in opaque iframe origins. Fonts are embedded by the build. All other assets are local and relative.

### Worker environment

This run kept installed dependencies in disposable `test/scratch/tooling/`, never in a submitted `node_modules/`. The same scripts were run with its binaries on `PATH`; browser/cover scripts also accept `PEPE_TOOL_ROOT` and `PEPE_CHROME` to use an already installed test browser. These overrides are for local validation only and are not runtime game settings.

- `.gitignore` has an explicit **512-byte path budget** and excludes dependency/cache directories at every level plus `test/scratch/`. It intentionally does not ignore `dist/` or `evidence/`.
- Export budget: **2 MiB**; complete submission limit: **8 MiB**. Exact final sizes are in [`evidence/export-check.txt`](evidence/export-check.txt) and [`evidence/submission-budget.json`](evidence/submission-budget.json).
- No dependency archives, submodules, registry mirrors, or build caches are part of the deliverable.

## Validation and design

Actual commands, outcomes, fixes, browser evidence, coverage and limitations are recorded in [`VALIDATION.md`](VALIDATION.md). The implemented palette, type system, layout, components and responsive behavior are documented in [`DESIGN.md`](DESIGN.md). Asset provenance and the generation prompt are in [`ART.md`](ART.md); licenses and guidance attribution are in [`licenses/NOTICE.md`](licenses/NOTICE.md).

Worker results: production build and typecheck passed; **27 engine tests and 40 Chromium interaction checks passed**, including natural victory/defeat, touch controls, replay and the opaque iframe bridge. No uncaught JavaScript errors or failed resources were recorded. Physical-device, Safari/Firefox and nonvisual gameplay checks remain limitations, as detailed in the validation record.

Source layout: `src/game.ts` is the simulation; `src/render.ts` draws the battlefield and miniatures; `src/main.ts` owns UI and input; `src/audio.ts` synthesizes effects; `src/bridge.ts` implements the arcade messaging contract. `public/pepe-game.json` is the manifest source. Build scripts copy it and the original cover into `dist/`.

## Publish and register — handoff to the post-publication agent

**Registration pending: post-publication agent required.** This is the assigned build worker. Hosting takes place after this task finishes; no hosting CID, public website, Explorer URL, submission ID, private receipt, or review decision is available here. No release helper or registration callback was run in this workspace.

1. Publish the complete committed `dist/` using the admitted Swarm job's existing hosting flow. Keep source, manifest/lockfile, documentation and evidence alongside it. Do not create another paid job or publish from this disposable worker.
2. Once Swarm hosting is available, the coordinating/publishing agent must use the [Pepe2Pepe template repository](https://github.com/adaki2004/pepe2pepe-game-template) and run:

   ```sh
   npm run release -- --job JOB_UUID
   ```

   Replace `JOB_UUID` with the **actual admitted job ID** from the coordinating agent's saved job receipt. Do not infer it from this workspace path or invent a substitute. Follow the template's [integration contract](https://github.com/adaki2004/pepe2pepe-game-template/blob/main/INTEGRATION.md).
3. The helper validates the hosted immutable export and calls `POST https://game-api-production-2d95.up.railway.app/v1/game-submissions` with `id`, `jobId`, `cid`, `manifest`, `contact`, and a private `X-Game-Submission` capability. If no contact was volunteered, use the job reference according to the template. Keep all credentials and receipts out of game code, source, screenshots, public artifacts and logs.
4. Preserve the private saved receipt. Retry timeouts, HTTP 429, and 5xx with backoff using the **same command, submission ID and capability**. Do not repay, create duplicate submissions, or replace IDs after uncertain outcomes. Inspect a 409 rather than blindly retrying under a new ID.
5. Return the working website, actual Explorer/job link, submission ID, and actual review status. **Pending means awaiting admin review; it does not mean approved. A hosted URL alone is not a submission.** Keep the continuation active until this callback succeeds. The callback never belongs inside the browser game.

The worker cannot honestly report end-to-end publication or registration completion before the future hosting result exists.
