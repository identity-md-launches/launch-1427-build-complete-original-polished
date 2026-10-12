import assert from "node:assert/strict";
import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = process.env.PEPE_TOOL_ROOT
  ? await import(
      pathToFileURL(
        resolve(
          process.env.PEPE_TOOL_ROOT,
          "node_modules/playwright/index.mjs",
        ),
      )
    )
  : await import("playwright");
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const root = resolve("dist");
// Intentionally NO Access-Control-Allow-Origin: the opaque-origin iframe must still load.
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/harness") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html><head><title>PEPEFRONT sandbox contract test</title><style>html,body{margin:0;width:100%;height:100%;background:#101510}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe id="game" sandbox="allow-scripts allow-pointer-lock" src="/preview/"></iframe><script>window.messages=[];addEventListener('message',e=>{if(e.source===document.querySelector('iframe').contentWindow)messages.push(e.data)});window.send=(message)=>document.querySelector('iframe').contentWindow.postMessage(message,'*');</script></body></html>`,
      );
      return;
    }
    if (!path.startsWith("/preview/")) throw new Error("outside export");
    const file = resolve(root, path.slice(9) || "index.html");
    if (!file.startsWith(root + "/")) throw new Error("path");
    const data = await readFile(file);
    res.setHeader(
      "Content-Type",
      mime[extname(file)] || "application/octet-stream",
    );
    res.setHeader("Cache-Control", "no-store");
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PEPE_CHROME
    ? { executablePath: process.env.PEPE_CHROME }
    : {}),
  args: ["--no-sandbox"],
});
const report = {
  started: new Date().toISOString(),
  browser: await browser.version(),
  checks: [],
  screenshots: [],
  errors: [],
  networkFailures: [],
  limitations: [
    "Chromium desktop and emulated touch; no physical phone, screen reader, or native browser zoom session.",
    "Long matches use Playwright virtual time. All orders go through actual UI; read-only diagnostics observe the state.",
  ],
};
await mkdir("evidence", { recursive: true });
let page;
const check = (name, detail = {}) => {
  report.checks.push({ name, status: "pass", ...detail });
  console.log(`PASS ${name}`);
};
const monitor = (p) => {
  p.on("pageerror", (e) => report.errors.push(String(e)));
  p.on("requestfailed", (r) =>
    report.networkFailures.push({
      url: r.url(),
      error: r.failure()?.errorText,
    }),
  );
  p.on("response", (r) => {
    if (r.status() >= 400)
      report.networkFailures.push({ url: r.url(), status: r.status() });
  });
};
const shot = async (p, name) => {
  await p.screenshot({
    path: `evidence/${name}.jpg`,
    type: "jpeg",
    quality: 83,
  });
  report.screenshots.push(`${name}.jpg`);
};
const state = async (p = page) =>
  p.evaluate(() => window.__PEPEFRONT__.snapshot());
const world = async (x, y, p = page) =>
  p.evaluate(
    ({ x, y }) => {
      const s = window.__PEPEFRONT__.worldToScreen({ x, y }),
        r = document.querySelector("#battlefield").getBoundingClientRect();
      return { x: s.x + r.x, y: s.y + r.y };
    },
    { x, y },
  );
const advance = async (ms) => {
  await page.clock.runFor(ms);
};
const start = async (p = page) => {
  await p.locator("[data-action=briefing]").click();
  await p.locator("[data-action=start]").click();
};
const build = async (kind, x, y) => {
  await page.locator("[data-action=tab-base]").click();
  await page.locator(`[data-action=build][data-kind=${kind}]`).click();
  const p = await world(x, y);
  await page.mouse.click(p.x, p.y);
  const s = await state();
  assert.ok(
    s.units.some((e) => e.owner === 0 && e.kind === kind),
    `Placed ${kind}`,
  );
};
const train = async (kind, count) => {
  await page.locator("[data-action=tab-army]").click();
  for (let i = 0; i < count; i++) {
    const b = page.locator(`[data-action=train][data-kind=${kind}]`);
    if ((await b.getAttribute("aria-disabled")) === "false") await b.click();
  }
};
const orderArmyTo = async (id) => {
  await page.locator("[data-action=select-army]").click();
  await page.locator(`[data-action=uplink][data-id="${id}"]`).click();
  await page.locator("#battlefield").focus();
  await page.keyboard.press("Enter");
};
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  monitor(page);
  await page.goto(`${url}/preview/`);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.title(), "PEPEFRONT — Command the night.");
  assert.equal(await page.locator("h1").textContent(), "PEPEFRONT");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await shot(page, "desktop-lobby");
  check("Desktop lobby, local fonts, metadata and relative subpath load");
  // Keyboard focus is observed before touching the primary action.
  await page.keyboard.press("Tab");
  assert.ok(
    await page.evaluate(() => document.activeElement.matches(".brand")),
  );
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.activeElement).outlineStyle,
    ),
    "solid",
  );
  check("Visible native keyboard focus");
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    const box = await page.locator("[data-action=briefing]").boundingBox();
    assert.ok(box.y + box.height < 844);
    if (width === 390) await shot(page, "mobile-lobby");
    check(`Lobby reflow and first-screen Deploy at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("[data-action=faction][data-value=cult]").click();
  assert.equal((await state()).config.faction, "cult");
  await page.locator("#match-mode").selectOption("teams");
  assert.equal(await page.locator(".slot").count(), 4);
  await page.locator("[data-action=faction][data-value=initiative]").click();
  await page.locator("#match-mode").selectOption("duel");
  await page.locator("#difficulty").selectOption("recruit");
  check("Faction, difficulty and live local lobby slots");
  await page.locator("[data-action=briefing]").click();
  await shot(page, "briefing");
  assert.equal(await page.locator("#dialog").evaluate((e) => e.open), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#dialog").evaluate((e) => e.open), false);
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.action),
    "briefing",
  );
  check("Briefing modal Escape and focus restoration");
  await start();
  await page.clock.install();
  await advance(1000);
  let s = await state();
  assert.equal(s.screen, "game");
  assert.equal(s.audio.state, "running");
  await page.locator("[data-action=sound]").click();
  assert.equal((await state()).audio.muted, true);
  await page.locator("[data-action=sound]").click();
  assert.equal((await state()).audio.muted, false);
  check("Audio waits for a gesture; mute and unmute work");
  const mini = await page.locator("#minimap").boundingBox();
  assert.ok(mini.y + mini.height < 900);
  check("Minimap remains inside desktop viewport");
  // Build opening chain by real pointer events.
  await build("power", 350, 580);
  await advance(7500);
  await build("barracks", 560, 520);
  await advance(10500);
  s = await state();
  if (s.harvested === 0) {
    await advance(8000);
    s = await state();
  }
  assert.ok(s.harvested > 0);
  check("Power → barracks construction and automatic harvester deposits", {
    harvested: s.harvested,
  });
  await train("recruit", 4);
  let queued = (await state()).players[0].queue.length;
  assert.equal(queued, 4);
  await page.locator(".queue-item").last().click();
  assert.equal((await state()).players[0].queue.length, 3);
  check("Training queue and cancel/refund");
  await advance(16000);
  assert.ok((await state()).players[0].produced >= 3);
  await build("factory", 510, 730);
  await advance(16500);
  await build("tech", 630, 300);
  await advance(18500);
  await build("power", 200, 250);
  await advance(7500);
  check("Complete build progression: power, barracks, factory, signal lab");
  // Direct selection and classic drag selection, group assignment, shifted orders.
  await page.locator("[data-action=home]").first().click();
  s = await state();
  const own = s.units.filter((e) => e.owner === 0 && e.kind === "recruit");
  const a = await world(own[0].x, own[0].y);
  await page.mouse.click(a.x, a.y);
  assert.ok((await state()).selection.length >= 1);
  await page.mouse.dblclick(a.x, a.y);
  assert.ok((await state()).selection.length >= 5);
  check("Pointer select and double-click matching rank/job");
  await page.keyboard.press("Control+1");
  await page.locator("[data-action=select-army]").click();
  await page.keyboard.press("1");
  assert.ok((await state()).selection.length >= 5);
  const dest = await world(680, 430);
  await page.mouse.click(dest.x, dest.y, { button: "right" });
  await page.keyboard.down("Shift");
  const dest2 = await world(700, 510);
  await page.mouse.click(dest2.x, dest2.y, { button: "right" });
  await page.keyboard.up("Shift");
  assert.ok(
    (await state()).units.some((e) => e.owner === 0 && e.orders.length >= 2),
  );
  check("Control groups and Shift-queued right-click orders");
  const stopIds = (await state()).selection;
  await page.keyboard.press("h");
  assert.ok(
    (await state()).units
      .filter((e) => stopIds.includes(e.id))
      .every((e) => e.orders.length === 0),
  );
  check("Stop clears selected unit orders");
  const oldCamera = (await state()).camera;
  await page.keyboard.down("d");
  await advance(500);
  await page.keyboard.up("d");
  assert.ok((await state()).camera.x > oldCamera.x);
  const zoom = (await state()).camera.zoom;
  await page.mouse.move(550, 450);
  await page.mouse.wheel(0, -200);
  await advance(100);
  assert.ok((await state()).camera.zoom > zoom);
  await page.locator("[data-action=home]").first().click();
  check("WASD camera movement and wheel zoom");
  await page.keyboard.press("p");
  s = await state();
  assert.equal(s.paused, true);
  await advance(5000);
  assert.equal((await state()).time, s.time);
  await page.locator("[data-action=resume]").click();
  check("Pause freezes the full simulation; resume works");
  await page.locator("[data-action=manual]").first().click();
  assert.equal((await state()).paused, true);
  await page.keyboard.press("Escape");
  assert.equal((await state()).paused, false);
  check("Field manual pauses and Escape returns to battle");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await advance(200);
  assert.equal((await state()).reducedMotion, true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await advance(100);
  check("Reduced motion updates canvas effects");
  await page.context().setOffline(true);
  const offlineBefore = (await state()).time;
  await advance(1000);
  assert.ok((await state()).time > offlineBefore);
  await page.context().setOffline(false);
  check("Loaded game continues offline without a service dependency");
  // A real skirmish: train armor, contest uplinks, keep reinforcements moving. No state mutation.
  await train("tank", 5);
  await orderArmyTo(0);
  await advance(28000);
  await train("tank", 4);
  await advance(25000);
  s = await state();
  assert.ok(s.uplinks.some((n) => n.owner === 0));
  check("Army pathfinding, fog exploration and real uplink capture");
  await shot(page, "desktop-battle");
  await orderArmyTo(1);
  await advance(36000);
  for (let round = 0; round < 16; round++) {
    s = await state();
    if (s.result) break;
    // Rally reinforcements every 40 seconds. Prioritize hostile-held uplinks.
    await train(round % 3 === 0 ? "commando" : "tank", 3);
    const hostile = s.uplinks.find((n) => n.owner !== 0);
    await orderArmyTo(hostile?.id ?? 1);
    await advance(40000);
    s = await state();
    console.log(
      `MATCH t=${s.time.toFixed(0)} signal=${Math.floor(s.players[0].influence)} units=${s.units.filter((e) => e.owner === 0).length} result=${s.result}`,
    );
  }
  s = await state();
  assert.ok(s.result, "Match reached a natural terminal state");
  assert.ok(s.time > 100 && s.time <= 720.1);
  assert.ok(Number.isSafeInteger(s.score) && s.score >= 0);
  assert.equal(await page.locator("#dialog").evaluate((e) => e.open), true);
  await shot(page, s.result === "victory" ? "victory" : "defeat");
  check("Full UI-driven skirmish reaches natural game-over", {
    result: s.result,
    time: s.time,
    score: s.score,
    reason: s.reason,
  });
  await page.locator("[data-action=replay]").click();
  s = await state();
  assert.equal(s.result, null);
  assert.ok(s.time < 1);
  assert.equal(s.credits, 1100);
  assert.equal(s.config.faction, "initiative");
  check("Instant replay resets battle, resources and result");
  // Real drag-box and middle-mouse camera on the fresh formation.
  await page.mouse.move(580, 365);
  await page.mouse.down();
  await page.mouse.move(700, 438, { steps: 6 });
  await page.mouse.up();
  // Coordinates are camera-dependent; repeat using world bounds if needed.
  const p1 = await world(460, 325),
    p2 = await world(560, 398);
  await page.mouse.move(p1.x, p1.y);
  await page.mouse.down();
  await page.mouse.move(p2.x, p2.y, { steps: 6 });
  await page.mouse.up();
  assert.ok((await state()).selection.length >= 5);
  check("Drag-box multi-selection");
  const c0 = (await state()).camera;
  await page.mouse.move(600, 450);
  await page.mouse.down({ button: "middle" });
  await page.mouse.move(700, 500, { steps: 5 });
  await page.mouse.up({ button: "middle" });
  assert.ok((await state()).camera.x < c0.x);
  check("Middle-mouse drag pans camera");
  await page.close();
  // Touch actions use a browser touch device, not just a narrow viewport.
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  page = await touch.newPage();
  monitor(page);
  await page.goto(`${url}/preview/`);
  await page.locator("[data-action=briefing]").tap();
  await page.locator("[data-action=start]").tap();
  await page.clock.install();
  await advance(200);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.locator("[data-action=mobile-base]").tap();
  await page.locator("[data-action=build][data-kind=power]").tap();
  const tp = await world(350, 570);
  await page.touchscreen.tap(tp.x, tp.y);
  await page.locator("[data-action=confirm-place]").tap();
  assert.ok(
    (await state()).units.some((e) => e.owner === 0 && e.kind === "power"),
  );
  check("Touch building placement and confirmation");
  await page.locator("[data-action=select-army]").tap();
  assert.equal((await state()).selection.length, 5);
  await page.locator("[data-action=order]").tap();
  const td = await world(580, 490);
  await page.touchscreen.tap(td.x, td.y);
  assert.ok(
    (await state()).units.some((e) => e.owner === 0 && e.orders.length),
  );
  check("Touch army selection and orders");
  // Native touch events for drag pan through CDP.
  await page.locator("[data-action=order]").tap();
  const tc = await page.context().newCDPSession(page),
    cam = (await state()).camera;
  await tc.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 160, y: 350 }],
  });
  await tc.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 240, y: 380 }],
  });
  await tc.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.ok((await state()).camera.x < cam.x);
  check("Touch drag pans battlefield");
  await page.locator("[data-action=mobile-radar]").tap();
  const mm = await page.locator("#minimap").boundingBox();
  await page.touchscreen.tap(mm.x + mm.width * 0.6, mm.y + mm.height * 0.45);
  assert.ok((await state()).camera.x > 1000);
  await page.locator("[data-action=mobile-radar]").tap();
  check("Touch minimap jump and panel dismissal");
  await page.locator("[data-action=home]").first().tap();
  await shot(page, "mobile-battle");
  await page.setViewportSize({ width: 844, height: 390 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.equal(
    await page.evaluate(
      () =>
        document.querySelector(".command-bar").getBoundingClientRect().bottom <=
        innerHeight + 1,
    ),
    true,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  check("Landscape/portrait reflow keeps touch commands reachable");
  await page.locator("[data-action=pause]").tap();
  assert.equal((await state()).paused, true);
  await page.locator("[data-action=restart-confirm]").tap();
  await page.locator("[data-action=replay]").tap();
  assert.ok((await state()).time < 1);
  check("Touch pause and confirmed restart");
  await page.locator("[data-action=sound]").tap();
  assert.equal((await state()).audio.muted, true);
  check("In-game mute remains available on touch");
  await touch.close();
  // Full integration in the exact arcade sandbox, with denied storage and no CORS assistance.
  page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  monitor(page);
  await page.goto(`${url}/harness`);
  const frame = page.frames().find((f) => f.url().includes("/preview/"));
  assert.ok(frame);
  await frame.waitForSelector("[data-action=briefing]");
  await frame.evaluate(() => document.fonts.ready);
  const denied = await frame.evaluate(() => {
    try {
      localStorage.setItem("pepe-test", "x");
      return false;
    } catch (e) {
      return e.name === "SecurityError";
    }
  });
  assert.ok(denied);
  assert.equal(
    await frame.evaluate(() =>
      document.fonts.check('800 64px "Barlow Condensed"'),
    ),
    true,
  );
  check(
    "Opaque sandbox loads complete game and fonts with storage denied and no CORS headers",
  );
  const send = (message) => page.evaluate((m) => window.send(m), message);
  await send({
    protocol: "pepe-game/1",
    type: "init",
    channel: "pepefront-test",
  });
  await page.waitForFunction(() =>
    messages.some((m) => m.type === "ready" && m.channel === "pepefront-test"),
  );
  check("Bridge init/ready includes exact protocol and channel");
  await frame.locator("#difficulty").selectOption("brutal");
  await start(frame);
  await page.clock.install();
  await advance(300);
  await send({ protocol: "pepe-game/1", type: "pause", channel: "wrong" });
  assert.equal((await state(frame)).paused, false);
  await frame.evaluate(() =>
    window.postMessage(
      { protocol: "pepe-game/1", type: "pause", channel: "pepefront-test" },
      "*",
    ),
  );
  await advance(100);
  assert.equal((await state(frame)).paused, false);
  check("Bridge rejects wrong channel and non-parent source");
  await send({
    protocol: "pepe-game/1",
    type: "pause",
    channel: "pepefront-test",
  });
  await advance(100);
  assert.equal((await state(frame)).paused, true);
  await send({
    protocol: "pepe-game/1",
    type: "resume",
    channel: "pepefront-test",
  });
  await advance(100);
  assert.equal((await state(frame)).paused, false);
  check("Parent bridge pause/resume controls simulation");
  await frame.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal((await state(frame)).paused, true);
  await frame.evaluate(() => {
    delete document.hidden;
  });
  await frame.locator("[data-action=resume]").click();
  assert.equal((await state(frame)).paused, false);
  check("Visibility loss pauses; local resume works without a host message");
  // Let Brutal AI naturally defeat an undefended player, verifying terminal score messages.
  for (let i = 0; i < 13; i++) {
    if ((await state(frame)).result) break;
    await advance(60000);
    console.log(`SANDBOX t=${(await state(frame)).time.toFixed(0)}`);
  }
  const final = await state(frame);
  assert.equal(final.result, "defeat");
  const messages = await page.evaluate(() => window.messages);
  const score = messages.find((m) => m.type === "score");
  assert.ok(score && Number.isSafeInteger(score.score) && score.score >= 0);
  assert.equal(score.protocol, "pepe-game/1");
  assert.equal(score.channel, "pepefront-test");
  assert.equal(messages.filter((m) => m.type === "score").length, 1);
  await shot(page, "sandbox-defeat");
  check("Natural defeat emits one valid integer score to the parent", {
    score: score.score,
    time: final.time,
  });
  await frame.locator("[data-action=replay]").click();
  assert.equal((await state(frame)).result, null);
  check("Replay works inside storage-denied iframe");
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.networkFailures, []);
  check(
    "No uncaught JavaScript errors or failed resources across tested flows",
  );
  report.status = "pass";
} catch (error) {
  report.status = "fail";
  report.failure = String(error.stack || error);
  if (page && !page.isClosed())
    report.failureSnapshot = await state().catch(() => null);
  console.error(error);
  if (page && !page.isClosed())
    await page
      .screenshot({
        path: "test/scratch/browser-failure.jpg",
        type: "jpeg",
        quality: 85,
      })
      .catch(() => {});
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  await writeFile(
    "evidence/browser-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
  await new Promise((r) => server.close(r));
  console.log(
    `Browser evidence saved: ${report.checks.length} checks, status ${report.status}`,
  );
}
