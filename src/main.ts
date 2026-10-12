import "./style.css";
import {
  Game,
  SPECS,
  BUILDINGS,
  UNITS,
  W,
  H,
  LIMIT,
  CAPTURE_GOAL,
  dist,
} from "./game.ts";
import type {
  Config,
  BuildingKind,
  UnitKind,
  Kind,
  Point,
  Faction,
  Mode,
  Difficulty,
} from "./game.ts";
import { Renderer, iconFor } from "./render.ts";
import { AudioEngine } from "./audio.ts";
import { connectBridge } from "./bridge.ts";
import { icon, mark } from "./icons.ts";

const root = document.querySelector<HTMLDivElement>("#app")!;
const audio = new AudioEngine();
let game: Game | null = null,
  renderer: Renderer | null = null,
  screen: "lobby" | "game" = "lobby";
let config: Config = {
  faction: "initiative",
  mode: "duel",
  difficulty: "veteran",
  seed: 7391,
};
let tab: "base" | "army" = "base",
  commandMode: "select" | "order" = "select",
  shownResult = false,
  hostPaused = false;
let lastFrame = 0,
  hudTimer = 0,
  lastEvent = "",
  lastQueue = "",
  lastSelection = "",
  lastCards = "",
  helpResume = false;
let capturePointer: number | null = null,
  down: Point | null = null,
  lastPointer: Point | null = null,
  panPointer = false,
  pointerTouch = false,
  shiftDown = false;
let buildTouch: Point | null = null;
const keys = new Set<string>();
const icons = new Map<Kind, string>();
for (const kind of [...BUILDINGS, ...UNITS, "hq"] as Kind[])
  icons.set(kind, iconFor(kind));
const timeLabel = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;
const cardImg = (kind: Kind) =>
  `<img src="${icons.get(kind)}" alt="" draggable="false" />`;
const soundButton = () =>
  `<button class="icon-button sound-button" data-action="sound" aria-label="${audio.muted ? "Unmute" : "Mute"} audio" title="${audio.muted ? "Unmute" : "Mute"} audio">${icon(audio.muted ? "mute" : "sound")}</button>`;
const status = () => `<span class="connection"><i></i> Local command</span>`;
const header = () =>
  `<header class="site-header"><a class="brand" href="#" data-action="lobby" aria-label="PEPEFRONT home">${mark}<span>PEPEFRONT</span></a><span class="header-context">Pepe2Pepe <span>/</span> Strategy division</span><div class="header-actions">${status()}<button class="quiet-button manual-button" data-action="manual">${icon("book")}<span>Field manual</span></button>${soundButton()}</div></header>`;
const mapSVG = `<svg class="sector-map" viewBox="0 0 330 190" role="img" aria-label="Nightfall map with your base northwest, enemy southeast, and three central uplinks"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" fill="none" stroke="#7ca177" stroke-opacity=".12"/></pattern></defs><rect width="330" height="190" fill="#14201a"/><rect width="330" height="190" fill="url(#grid)"/><path d="m0 58 48-10 35 17 43-7 30-24 50 11 51-13 73 18M0 133l63-16 32 23 52-25 53 3 69 29 61-11M36 0l19 45-8 38 24 57-4 50M275 0l-19 39 12 48-27 65 12 38" stroke="#66875e" stroke-opacity=".2" fill="none" stroke-width="2"/><path d="M42 48h92l31 32v97M290 145h-99l-26-26V13M0 96h330" stroke="#718264" stroke-width="12" stroke-opacity=".18" fill="none"/><path d="M42 48h92l31 32v97M290 145h-99l-26-26V13M0 96h330" stroke="#819874" stroke-opacity=".4" stroke-width="1" stroke-dasharray="3 6" fill="none"/><g fill="#547761" opacity=".7"><path d="M93 19h23v14H93zM86 71h24v13H86zM217 155h25v17h-25zM212 110h24v16h-24z"/></g><g fill="#bafa47"><path d="m31 67 3-5 3 5-3 7Zm37-42 3-5 3 5-3 7Zm230 94 3-5 3 5-3 7Z"/></g><g fill="#a3b694" stroke="#718561"><path d="m165 38 7 7-7 7-7-7Zm0 49 7 7-7 7-7-7Zm0 48 7 7-7 7-7-7Z"/></g><circle cx="49" cy="45" r="19" fill="#8ce9dd" opacity=".08"/><path d="M41 36h17v17H41z" fill="#8ce9dd"/><path d="M272 137h17v17h-17z" fill="#ee77b0"/><g font-family="monospace" font-size="8" fill="#b5c0ad"><text x="15" y="22">INITIATIVE</text><text x="241" y="173">CULT</text><text x="181" y="48">A</text><text x="181" y="97">B</text><text x="181" y="145">C</text></g></svg>`;

function lobby() {
  renderer?.destroy();
  renderer = null;
  game = null;
  screen = "lobby";
  keys.clear();
  audio.setPaused(false);
  hostPaused = false;
  root.innerHTML = `${header()}<main class="lobby" id="main-content"><section class="hero" aria-labelledby="game-title"><div class="hero-art" aria-hidden="true"></div><div class="hero-grid" aria-hidden="true"></div><div class="hero-content"><div class="operation-label"><span class="crosshair">+</span> Operation Nightfall <span class="operation-line"></span> 07</div><h1 id="game-title">PEPEFRONT<span class="title-notch" aria-hidden="true"></span></h1><h2>Command the night.</h2><p class="hero-description">A neon-noir real-time strategy game.<br>Build your base. Lead your Pepes.</p><div class="deploy-block"><button class="primary-button deploy-button" data-action="briefing"><span>Deploy to Nightfall</span>${icon("diagonal")}</button><div class="deploy-note"><span>Solo vs AI</span><span>5–12 min</span><span>Instant play</span></div></div><button class="text-button training-link" data-action="training">${icon("target")} New commander? Start with Recruit AI ${icon("arrow")}</button></div><div class="art-caption"><span class="record-dot"></span><span>COMMAND FEED <b>01</b></span><span>COL. P. FROGMAN</span></div><div class="hero-bottom"><span>37° 14′ N &nbsp; 115° 48′ E</span><span>THE POND IS OURS.</span></div></section><section class="mission-config" aria-label="Skirmish setup"><div class="faction-section"><div class="section-heading"><h2>Choose your allegiance</h2><span>01 / Faction</span></div><div class="faction-options"><button class="faction-option ${config.faction === "initiative" ? "chosen" : ""}" data-action="faction" data-value="initiative" aria-pressed="${config.faction === "initiative"}"><span class="faction-emblem initiative">${icon("shield")}</span><span class="faction-copy"><strong>Initiative Pepes</strong><span>Hold the line. Hit harder.</span><small>+20% health · Advanced defenses</small></span><span class="selection-check">${icon("check")}</span></button><button class="faction-option ${config.faction === "cult" ? "chosen" : ""}" data-action="faction" data-value="cult" aria-pressed="${config.faction === "cult"}"><span class="faction-emblem cult">${icon("cult")}</span><span class="faction-copy"><strong>Cult Pepes</strong><span>Strike fast. Disappear.</span><small>−20% cost · Stealth Commandos</small></span><span class="selection-check">${icon("check")}</span></button></div></div><div class="rules-section"><div class="section-heading"><h2>Set the engagement</h2><span>02 / Rules</span></div><div class="select-row"><label for="match-mode">Match format</label><div class="select-wrap"><select id="match-mode"><option value="duel" ${config.mode === "duel" ? "selected" : ""}>1v1 · Duel</option><option value="teams" ${config.mode === "teams" ? "selected" : ""}>2v2 · Allied front</option><option value="ffa" ${config.mode === "ffa" ? "selected" : ""}>4-way · Free for all</option></select>${icon("chevron")}</div></div><div class="select-row"><label for="difficulty">Enemy command</label><div class="select-wrap"><select id="difficulty"><option value="recruit" ${config.difficulty === "recruit" ? "selected" : ""}>Recruit · Learning the ropes</option><option value="veteran" ${config.difficulty === "veteran" ? "selected" : ""}>Veteran · Fight for every inch</option><option value="brutal" ${config.difficulty === "brutal" ? "selected" : ""}>Brutal · Relentless pressure</option></select>${icon("chevron")}</div></div><div class="lobby-slots" id="lobby-slots"></div><p class="local-note">One human commander. All other slots are local AI.</p></div><div class="map-section"><div class="section-heading"><h2>Nightfall</h2><span>03 / Sector</span></div><div class="map-frame">${mapSVG}<span class="map-weather">Rain / 03:47</span></div><div class="map-description"><span>Industrial wasteland</span><span>3 uplinks ${icon("target")}</span></div></div></section><footer class="lobby-footer"><span>${mark} PEPE2PEPE ARCADE</span><p>No ranks to grind. Just ground to take.</p><span>PEPEFRONT <b>v1.0</b></span></footer></main><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
  $("#match-mode").addEventListener("change", (e) => {
    config.mode = (e.target as HTMLSelectElement).value as Mode;
    updateLobbySlots();
  });
  $("#difficulty").addEventListener("change", (e) => {
    config.difficulty = (e.target as HTMLSelectElement).value as Difficulty;
  });
  updateLobbySlots();
}
function updateLobbySlots() {
  const names =
    config.mode === "duel"
      ? ["You", "Viper AI"]
      : config.mode === "teams"
        ? ["You", "Echo AI · ally", "Viper AI", "Wraith AI"]
        : ["You", "Viper AI", "Wraith AI", "Mantis AI"];
  $("#lobby-slots").innerHTML = names
    .map(
      (n, i) =>
        `<span class="slot ${i === 0 ? "you" : ""}"><i></i>${n}${icon("check")}</span>`,
    )
    .join("");
}
let dialogReturn: HTMLElement | null = null;
function showDialog(content: string, cls = "") {
  const dialog = $<HTMLDialogElement>("#dialog");
  if (!dialog.open) dialogReturn = document.activeElement as HTMLElement;
  dialog.className = cls;
  dialog.innerHTML = content;
  if (!dialog.open) dialog.showModal();
  requestAnimationFrame(() => {
    (
      dialog.querySelector("[autofocus]") ?? dialog.querySelector("button")
    )?.scrollIntoView({ block: "nearest" });
  });
  dialog.oncancel = (e) => {
    e.preventDefault();
    if (game?.result || hostPaused) return;
    if (dialog.classList.contains("manual-dialog")) {
      closeDialog();
      if (game) {
        if (helpResume) resume();
        else pause();
      }
    } else if (game?.paused) resume();
    else closeDialog();
  };
}
function closeDialog() {
  const d = $<HTMLDialogElement>("#dialog");
  if (d?.open) d.close();
  dialogReturn?.focus({ preventScroll: true });
}
function briefing() {
  showDialog(
    `<div class="briefing-image"><img src="./assets/commander.webp" alt="Pepe commander in a dim command bunker"/><span class="feed-stamp"><i></i> Secure transmission / Col. Frogman</span></div><div class="dialog-content"><div class="dialog-top"><span>Mission briefing / Sector 07</span><button class="icon-button" data-action="close-dialog" aria-label="Close briefing">${icon("close")}</button></div><h2 id="dialog-title">The night belongs to us.</h2><p>“They took the sector. They forgot who built it. Get your crews moving, Commander.”</p><ol class="briefing-orders"><li><b>01</b><span><strong>Build your foothold</strong>Harvester Pepes collect crystals automatically. Build a power plant, then a barracks.</span></li><li><b>02</b><span><strong>Make your move</strong>Train an army. Select Pepes, then right-click to advance and attack. On touch, use Order.</span></li><li><b>03</b><span><strong>Take the sector</strong>Destroy enemy HQs or hold uplinks to earn 540 signal. Most signal wins at 12 minutes.</span></li></ol><button class="primary-button" data-action="start" autofocus><span>Take command</span>${icon("arrow")}</button><p class="dialog-footnote">${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)} AI · ${config.mode === "duel" ? "1v1" : config.mode === "teams" ? "2v2" : "Four-way FFA"} · ${config.faction === "initiative" ? "Initiative" : "Cult"} Pepes</p></div>`,
    "briefing-dialog",
  );
}
function manual() {
  helpResume = !!game && !game.paused && !game.result;
  if (game) {
    game.paused = true;
    audio.setPaused(true);
    keys.clear();
  }
  showDialog(
    `<div class="dialog-content manual-content"><div class="dialog-top"><span>PEPEFRONT / Field manual</span><button class="icon-button" data-action="close-manual" aria-label="Close field manual">${icon("close")}</button></div><h2 id="dialog-title">Know your battlefield.</h2><p>Destroy every enemy HQ, or hold uplinks to reach <b>540 signal</b>. Each held uplink adds one signal per second. At 12 minutes, signal plus surviving strength decides the winner.</p><div class="manual-columns"><section><h3>Command</h3><dl><dt>Select / multiple</dt><dd>Click / drag a box</dd><dt>Move & attack</dt><dd>Right-click ground or enemy</dd><dt>Queue orders</dt><dd>Hold Shift + right-click</dd><dt>Select same job & rank</dt><dd>Double-click a Pepe</dd><dt>Control groups</dt><dd>Ctrl + 1–9 saves; 1–9 recalls</dd><dt>All combat Pepes</dt><dd><kbd>X</kbd> or Select army</dd><dt>Move camera</dt><dd>WASD, edges, or middle drag</dd><dt>Zoom</dt><dd>Mouse wheel or + / −</dd><dt>Last alert / HQ</dt><dd>Space / Home</dd><dt>Base / Army menu</dt><dd>B / F; Q E R T G builds</dd><dt>Pause / cancel</dt><dd>P / Escape</dd><dt>Stop selected</dt><dd>H</dd></dl></section><section><h3>Touch & keyboard orders</h3><p><b>Touch:</b> tap to select; drag to pan. Tap Select army, then Order, then a destination. Drag the minimap to jump. After choosing a building, tap a location then Place.</p><p><b>Keyboard:</b> Tab reaches all command buttons. Select army, pan to a destination with WASD, then press Enter to attack-move to the screen center. Z cycles your Pepes. Use the Place at center button for construction.</p><h3>Win the resource war</h3><p>Harvester Pepes fill up and return to HQ. Protect them. Select one and order it onto crystals to change its field.</p><p>Power → Barracks → War factory → Signal lab. Low power slows production by 60%. Engineers repair nearby structures for free.</p><p>Initiative: +20% health, 6% slower. Cult: 20% cheaper, 15% faster, 10% less health. Cult Commandos cloak beyond 135m unless firing.</p></section></div><div class="manual-jobs">${UNITS.map((k) => `<div>${cardImg(k)}<strong>${SPECS[k].name}</strong><span>${SPECS[k].blurb}</span></div>`).join("")}</div><p class="muted">Pepes gain a rank at 2 and 6 eliminations: +12% damage per rank. Signal labs add +20%. Limit: 50 Pepes per side. AI receives small, increasing supply grants; higher difficulties train and attack more often.</p><button class="primary-button" data-action="close-manual" autofocus>Return to ${game ? "command" : "lobby"} ${icon("arrow")}</button></div>`,
    "manual-dialog",
  );
}
function startMatch(replay = false) {
  closeDialog();
  renderer?.destroy();
  keys.clear();
  lastEvent = "";
  lastQueue = "";
  lastSelection = "";
  lastCards = "";
  tab = "base";
  commandMode = "select";
  buildTouch = null;
  shownResult = false;
  hostPaused = false;
  if (!replay) config.seed = Math.floor(Math.random() * 1e8);
  game = new Game({ ...config });
  game.onSound = (name) => audio.play(name);
  screen = "game";
  audio.setPaused(false);
  void audio.unlock();
  root.innerHTML = `<main class="game-shell" id="main-content"><header class="game-header"><div class="game-brand">${mark}<span>PEPEFRONT</span></div><div class="operation-name"><strong>Nightfall</strong><span><i></i> Operation live</span></div><div class="resource-strip"><div class="resource crystals" title="Crystals available">${icon("crystal")}<span id="credits">1,100</span><small>Crystals</small></div><div class="resource" id="power-stat" title="Power used / capacity">${icon("power")}<span id="power">0 / 12</span><small>Power</small></div><div class="resource" title="Active Pepes / limit">${icon("army")}<span id="supply">8 / 50</span><small>Pepes</small></div></div><div class="game-top-actions"><time id="timer">00:00</time>${soundButton()}<button class="icon-button" data-action="pause" aria-label="Pause game" title="Pause (P)">${icon("pause")}</button></div></header><div class="game-body"><section class="battlefield" aria-label="Battlefield"><canvas id="battlefield" tabindex="0" aria-label="Nightfall battlefield. Select army with X, pan with WASD, Enter orders selected units to the screen center. See the Field manual for all controls."></canvas><div class="map-top"><div class="objective-card"><span class="objective-icon">${icon("target")}</span><div><strong>Control the sector</strong><span>Hold uplinks or destroy enemy HQs.</span></div><button class="icon-button" data-action="manual" aria-label="Open field manual">${icon("book")}</button></div><div class="uplink-strip" id="uplink-strip"></div></div><div class="lesson" id="lesson"></div><div class="map-side"><button class="icon-button" data-action="zoom-in" aria-label="Zoom in">${icon("plus")}</button><button class="icon-button" data-action="zoom-out" aria-label="Zoom out">${icon("minus")}</button><button class="icon-button" data-action="home" aria-label="Center on Command HQ" title="Center HQ (Home)">${icon("home")}</button></div><div class="placement-message" id="placement-message" hidden><span id="placement-label"></span><button data-action="confirm-place" class="compact-primary">Place at center</button><button data-action="cancel-place" class="icon-button" aria-label="Cancel placement">${icon("close")}</button></div><div class="battle-log" id="battle-log" role="status" aria-live="polite"></div><div class="map-bottom"><span>SECTOR 07 <b>+</b> <span id="camera-position">0450 / 0420</span></span><span class="desktop-hint">WASD to pan · Scroll to zoom</span><span class="mobile-signal" id="compact-signal">0 / 540 signal</span></div></section><aside class="command-panel" aria-label="Production and tactical map"><div class="panel-heading"><h2>Command</h2><span class="panel-state"><i></i> Online</span></div><div class="command-tabs" role="group" aria-label="Command menu"><button data-action="tab-base" aria-pressed="true">Base <kbd>B</kbd></button><button data-action="tab-army" aria-pressed="false">Army <kbd>F</kbd></button></div><div class="build-grid" id="build-grid"></div><div class="unit-description" id="unit-description">${icon("power")}<p><strong>Establish your foothold</strong><span>Start with power. Build near your Command HQ.</span></p></div><div class="production"><div class="production-heading"><h3>Production queue</h3><span id="queue-count">0 / 8</span></div><div id="queue" class="queue"></div></div><div class="radar"><div class="radar-heading"><span>${icon("signal")} Tactical uplink</span><button class="text-button" data-action="home">HQ ${icon("home")}</button></div><canvas id="minimap" tabindex="0" aria-label="Minimap. Click or tap to move camera; arrow keys pan the camera."></canvas><div class="radar-labels"><span><i class="ally-dot"></i>You / allies</span><span><i class="enemy-dot"></i>Opposition</span></div></div></aside></div><footer class="command-bar"><div class="selection-portrait" id="selection-portrait">${cardImg("hq")}</div><div class="selection-info"><strong id="selection-title">Command ready</strong><span id="selection-detail">Select a Pepe or drag to select a squad.</span><div class="selection-pips" id="selection-pips"></div></div><div class="command-buttons"><button data-action="select-army" title="Select all combat Pepes (X)">${icon("army")}<span>Select army</span><kbd>X</kbd></button><button data-action="order" id="order-button" aria-pressed="false">${icon("target")}<span>Order</span><kbd>↵</kbd></button><button data-action="stop" title="Stop selected units (H)">${icon("stop")}<span>Stop</span><kbd>H</kbd></button><button data-action="alert" title="Center last alert (Space)">${icon("signal")}<span>Last alert</span></button></div><div class="signal-score"><span>Sector signal</span><strong id="signal-score">0 <small>/ 540</small></strong><span id="enemy-signal" class="enemy-signal" title="Highest enemy signal">Enemy 0</span><div class="signal-track"><i id="signal-progress"></i></div></div></footer><div class="mobile-panel-bar"><button data-action="mobile-base" aria-label="Open base construction">${icon("home")}<span>Build base</span></button><button data-action="mobile-army" aria-label="Open army production">${icon("army")}<span>Train army</span></button><button data-action="mobile-radar" aria-label="Open tactical minimap">${icon("signal")}<span>Minimap</span></button></div></main><dialog id="dialog" aria-labelledby="dialog-title"></dialog>`;
  renderer = new Renderer(
    $<HTMLCanvasElement>("#battlefield"),
    $<HTMLCanvasElement>("#minimap"),
    game,
  );
  relocateRadar();
  setupCanvas();
  renderCards();
  updateHUD();
  $("#battlefield").focus({ preventScroll: true });
}
function relocateRadar() {
  if (screen !== "game") return;
  const radar = $(".radar");
  if (!radar) return;
  (innerWidth <= 720 ? $(".command-panel") : $(".battlefield")).append(radar);
}
window.addEventListener("resize", relocateRadar);
function renderCards() {
  if (!game) return;
  const list: Kind[] = tab === "base" ? BUILDINGS : UNITS;
  $("#build-grid").innerHTML = list
    .map(
      (k) =>
        `<button class="build-card" data-action="${tab === "base" ? "build" : "train"}" data-kind="${k}" aria-label="${tab === "base" ? "Build" : "Train"} ${SPECS[k].name}, ${game!.cost(k)} crystals, ${SPECS[k].time} seconds" aria-describedby="requirement-${k}"><span class="card-hotkey">${SPECS[k].key}</span>${cardImg(k)}<span class="card-name">${SPECS[k].name}</span><span class="card-meta"><span>${icon("crystal")} ${game!.cost(k)}</span><span>${SPECS[k].time}s</span></span><span class="card-requirement" id="requirement-${k}"></span></button>`,
    )
    .join("");
  document.querySelectorAll<HTMLButtonElement>(".build-card").forEach((b) => {
    const describe = () => {
      const k = b.dataset.kind as Kind;
      $("#unit-description").innerHTML =
        `${icon(SPECS[k].power > 0 ? "power" : "target")}<p><strong>${SPECS[k].name}</strong><span>${SPECS[k].blurb}</span></p>`;
    };
    b.addEventListener("mouseenter", describe);
    b.addEventListener("focus", describe);
  });
  lastCards = "";
  updateCardState();
}
function setTab(value: "base" | "army") {
  tab = value;
  document
    .querySelectorAll<HTMLButtonElement>(".command-tabs button")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.action === `tab-${value}`),
      ),
    );
  renderCards();
}
function updateCardState() {
  if (!game) return;
  const state = `${Math.floor(game.me.credits)}-${game.me.queue.length}-${game.entities
    .filter((e) => e.owner === 0 && e.ready >= 1)
    .map((e) => e.kind)
    .join(",")}`;
  if (state === lastCards) return;
  lastCards = state;
  document.querySelectorAll<HTMLButtonElement>(".build-card").forEach((b) => {
    const k = b.dataset.kind as Kind,
      reason = game!.available(k);
    b.classList.toggle("locked", !!reason);
    b.setAttribute("aria-disabled", String(!!reason));
    b.title = `${SPECS[k].blurb}${reason ? " " + reason : ""}`;
    b.querySelector(".card-requirement")!.textContent =
      reason ??
      (SPECS[k].power > 0
        ? `+${SPECS[k].power} power`
        : SPECS[k].power < 0
          ? `${-SPECS[k].power} power`
          : "Ready to train");
  });
}
function lessonText() {
  if (!game) return { title: "", desc: "" };
  if (!game.entities.some((e) => e.owner === 0 && e.kind === "power"))
    return {
      title: "01 / Bring the lights online",
      desc: "Choose Power plant in Base, then place it near HQ.",
    };
  if (!game.has("power"))
    return {
      title: "01 / Power plant under construction",
      desc: "Harvesters are already collecting your first crystals.",
    };
  if (!game.has("barracks"))
    return {
      title: "02 / Give your Pepes a home",
      desc: "Build a Barracks. Then open Army to train recruits.",
    };
  if (game.me.produced < 3)
    return {
      title: "03 / Build your fighting force",
      desc: "Open Army and train three Recruit Pepes.",
    };
  if (game.me.influence < 1)
    return {
      title: "04 / Take the airwaves",
      desc: "Select army (X), then order it to uplink A, B, or C.",
    };
  return {
    title: "The sector is in play",
    desc: "Hold uplinks for 540 signal, or destroy enemy HQs.",
  };
}
function updateHUD() {
  if (!game || screen !== "game") return;
  $("#credits").textContent = Math.floor(game.me.credits).toLocaleString();
  $("#power").textContent = `${game.me.used} / ${game.me.power}`;
  $("#power-stat").classList.toggle("low-power", game.me.used > game.me.power);
  $("#supply").textContent = `${game.supply()} / 50`;
  $("#timer").textContent = timeLabel(game.time);
  $("#timer").setAttribute(
    "aria-label",
    `${timeLabel(game.time)} elapsed; twelve-minute limit`,
  );
  $("#signal-score").innerHTML =
    `${Math.floor(game.me.influence)} <small>/ ${CAPTURE_GOAL}</small>`;
  const enemySignal = Math.floor(
    Math.max(
      0,
      ...game.players
        .filter((p) => !game!.allied(0, p.id))
        .map((p) => p.influence),
    ),
  );
  $("#enemy-signal").textContent = `Enemy ${enemySignal}`;
  $("#compact-signal").textContent =
    `${Math.floor(game.me.influence)}/${CAPTURE_GOAL} signal · Enemy ${enemySignal}`;
  $("#signal-progress").style.width =
    `${Math.min(100, (game.me.influence / CAPTURE_GOAL) * 100)}%`;
  if (renderer)
    $("#camera-position").textContent =
      `${Math.floor(renderer.camera.x).toString().padStart(4, "0")} / ${Math.floor(renderer.camera.y).toString().padStart(4, "0")}`;
  const uplinks = game.uplinks
    .map(
      (n) =>
        `<button data-action="uplink" data-id="${n.id}" style="--point-color:${n.owner >= 0 ? game!.players[n.owner].color : "#c6cfbd"}" title="Center on uplink ${String.fromCharCode(65 + n.id)}" aria-label="Center on uplink ${String.fromCharCode(65 + n.id)}, ${n.owner < 0 ? "neutral" : game!.players[n.owner].name}"><b>${String.fromCharCode(65 + n.id)}</b><span>${n.owner < 0 ? "Neutral" : game!.allied(0, n.owner) ? "Allied" : "Enemy"}</span></button>`,
    )
    .join("");
  if ($("#uplink-strip").innerHTML !== uplinks)
    $("#uplink-strip").innerHTML = uplinks;
  const lesson = lessonText(),
    lessonHTML = `<span class="lesson-pin"></span><div><strong>${lesson.title}</strong><span>${lesson.desc}</span></div><button class="icon-button" data-action="hide-lesson" aria-label="Hide onboarding tip">${icon("close")}</button>`;
  if ($("#lesson").innerHTML !== lessonHTML)
    $("#lesson").innerHTML = lessonHTML;
  const event = game.events[0];
  if (event && event.text !== lastEvent) {
    lastEvent = event.text;
    $("#battle-log").innerHTML = game.events
      .slice(0, 2)
      .map(
        (e, i) =>
          `<div class="log-entry ${e.kind} ${i ? "older" : ""}"><time>${timeLabel(e.at)}</time><span>${e.text}</span></div>`,
      )
      .join("");
  }
  const qKey = game.me.queue.map((q) => `${q.kind}-${q.cost}`).join(",");
  if (qKey !== lastQueue || !$("#queue").children.length) {
    lastQueue = qKey;
    $("#queue-count").textContent = `${game.me.queue.length} / 8`;
    $("#queue").innerHTML = game.me.queue.length
      ? game.me.queue
          .map(
            (q, i) =>
              `<button class="queue-item" data-action="cancel-queue" data-index="${i}" aria-label="Cancel ${SPECS[q.kind].name}, refund ${q.cost} crystals" title="Cancel ${SPECS[q.kind].name} and refund crystals">${cardImg(q.kind)}<span>${i === 0 ? `${Math.ceil(q.duration - q.progress)}s` : "Queued"}</span><i style="width:${(q.progress / q.duration) * 100}%"></i><b>×</b></button>`,
          )
          .join("")
      : '<div class="queue-empty">Train a Pepe to begin production.</div>';
  }
  document.querySelectorAll<HTMLElement>(".queue-item").forEach((b, i) => {
    const q = game!.me.queue[i];
    if (!q) return;
    b.querySelector("span")!.textContent =
      i === 0 ? `${Math.ceil(q.duration - q.progress)}s` : "Queued";
    (b.querySelector("i") as HTMLElement).style.width =
      `${(q.progress / q.duration) * 100}%`;
  });
  const powerLow = game.me.used > game.me.power;
  $(".panel-state").innerHTML = `<i></i> ${powerLow ? "Low power" : "Online"}`;
  $(".panel-state").classList.toggle("low-power", powerLow);
  const sel = game.selection,
    selKey = sel.map((e) => `${e.id}-${Math.ceil(e.hp)}-${e.kills}`).join(",");
  if (selKey !== lastSelection) {
    lastSelection = selKey;
    $("#selection-title").textContent =
      sel.length === 0
        ? "Command ready"
        : sel.length === 1
          ? SPECS[sel[0].kind].name
          : `${sel.length} Pepes selected`;
    $("#selection-detail").textContent =
      sel.length === 0
        ? "Select a Pepe or drag to select a squad."
        : sel.length === 1
          ? `${Math.ceil(sel[0].hp)} / ${sel[0].maxHp} HP · ${sel[0].building ? "Structure" : `Rank ${game.rank(sel[0])}`} · ${sel[0].owner === 0 ? "Your command" : game.players[sel[0].owner].name}`
          : "Right-click to advance, or choose Order and a destination.";
    $("#selection-portrait").innerHTML = cardImg(sel[0]?.kind ?? "hq");
    $("#selection-pips").innerHTML = sel
      .slice(0, 18)
      .map(
        (e) =>
          `<i style="background:${game!.players[e.owner].color}" title="${SPECS[e.kind].name}"></i>`,
      )
      .join("");
  }
  updateCardState();
  if (game.result && !shownResult) {
    shownResult = true;
    bridge.score(game.score);
    resultDialog();
  }
}
function resultDialog() {
  if (!game) return;
  const win = game.result === "victory";
  showDialog(
    `<div class="result-banner ${win ? "won" : "lost"}">${mark}<span>Operation Nightfall / After-action report</span></div><div class="dialog-content"><h2 id="dialog-title" class="result-title">${win ? "SECTOR SECURED." : "SIGNAL LOST."}</h2><p>${game.resultReason}</p><div class="result-stats"><div><span>Command score</span><strong>${game.score.toLocaleString()}</strong></div><div><span>Targets neutralized</span><strong>${game.kills}</strong></div><div><span>Crystals harvested</span><strong>${game.harvested.toLocaleString()}</strong></div><div><span>Time in sector</span><strong>${timeLabel(game.time)}</strong></div></div><button class="primary-button" data-action="replay" autofocus>Deploy again ${icon("arrow")}</button><button class="secondary-button full-width" data-action="return-lobby">Return to command lobby</button><p class="dialog-footnote">Same engagement. A fresh chance to take the pond.</p></div>`,
    "result-dialog",
  );
}
function pause(fromHost = false) {
  if (!game || game.result) return;
  if (fromHost) hostPaused = true;
  game.paused = true;
  keys.clear();
  audio.setPaused(true);
  showDialog(
    `<div class="dialog-content"><div class="dialog-top"><span>Operation Nightfall</span><span>${timeLabel(game.time)}</span></div><h2 id="dialog-title">Hold position.</h2><p>${hostPaused ? "The arcade has paused your operation. Waiting for its resume signal." : "The battlefield is paused. Your Pepes are standing by."}</p><button class="primary-button" data-action="resume" ${hostPaused ? "disabled" : ""} autofocus>Resume operation ${icon("play")}</button><button class="secondary-button full-width" data-action="manual">Read field manual ${icon("book")}</button><div class="pause-actions"><button class="quiet-button" data-action="restart-confirm">Restart operation</button><button class="quiet-button" data-action="quit-confirm">Leave operation</button></div></div>`,
    "pause-dialog",
  );
}
function resume(fromHost = false) {
  if (!game || game.result) return;
  if (hostPaused && !fromHost) return;
  hostPaused = false;
  game.paused = false;
  audio.setPaused(false);
  closeDialog();
  keys.clear();
  $("#battlefield").focus({ preventScroll: true });
}
function confirmLeave(restart: boolean) {
  showDialog(
    `<div class="dialog-content"><h2 id="dialog-title">${restart ? "Restart this operation?" : "Leave the battlefield?"}</h2><p>Your current match will be lost. ${restart ? "You will deploy with a fresh base and army." : "You can set up a new skirmish from the lobby."}</p><button class="primary-button" data-action="${restart ? "replay" : "return-lobby"}">${restart ? "Restart operation" : "Leave operation"} ${icon("arrow")}</button><button class="secondary-button full-width" data-action="pause" autofocus>Keep this operation</button></div>`,
    "pause-dialog",
  );
}
function chooseBuild(kind: BuildingKind) {
  if (!game || !renderer || game.paused) return;
  const reason = game.available(kind);
  if (reason) {
    game.alert(reason);
    updateHUD();
    return;
  }
  renderer.placement = kind;
  buildTouch = null;
  commandMode = "select";
  renderer.pointer = { x: renderer.width / 2, y: renderer.height / 2 };
  $("#placement-message").hidden = false;
  $("#placement-label").textContent =
    `Place ${SPECS[kind].name} near your base.`;
  $('#placement-message [data-action="confirm-place"]').textContent =
    "Place at center";
  $(".command-panel").classList.remove("mobile-open");
  $("#battlefield").focus({ preventScroll: true });
}
function cancelPlace() {
  if (renderer) renderer.placement = null;
  buildTouch = null;
  $("#placement-message").hidden = true;
}
function placeAt(p: Point) {
  if (!game || !renderer?.placement) return;
  const kind = renderer.placement;
  if (game.build(kind, p)) cancelPlace();
  else updateHUD();
}
function orderAt(p: Point, queue = false) {
  if (!game || !renderer) return;
  const units = game.selection.filter((e) => e.owner === 0 && !e.building);
  if (!units.length) {
    game.alert("Select your Pepes first. Use Select army (X).");
    return;
  }
  const enemy = game.entities.find(
    (e) =>
      e.owner !== 0 &&
      !game!.allied(0, e.owner) &&
      e.hp > 0 &&
      game!.canSee(e) &&
      dist(e, p) < e.radius + 18,
  );
  const resource = game.resources.find((n) => dist(n, p) < 65 && n.amount > 0);
  const harvesting = units.every((e) => e.kind === "harvester") && resource;
  game.issue(
    units.map((e) => e.id),
    {
      type: harvesting ? "harvest" : "attack",
      x: p.x,
      y: p.y,
      target: harvesting ? resource.id : enemy?.id,
    },
    queue,
  );
  renderer.marker = { point: p, at: game.time, attack: !!enemy };
}
function pickAt(p: Point, multi = false) {
  if (!game) return;
  const e = game.entities
    .filter(
      (e) =>
        e.hp > 0 &&
        game!.canSee(e) &&
        dist(e, p) < e.radius + (pointerTouch ? 23 : 13),
    )
    .sort((a, b) => dist(a, p) - dist(b, p))[0];
  if (!multi) game.selected.clear();
  if (e) {
    if (multi && game.selected.has(e.id)) game.selected.delete(e.id);
    else game.selected.add(e.id);
    audio.play("ui");
  }
}
function setupCanvas() {
  const c = $<HTMLCanvasElement>("#battlefield"),
    mini = $<HTMLCanvasElement>("#minimap");
  const point = (e: PointerEvent | MouseEvent): Point => {
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  c.addEventListener("contextmenu", (e) => e.preventDefault());
  c.addEventListener("pointerdown", (e) => {
    if (!game || !renderer || game.paused || game.result) return;
    void audio.unlock();
    c.focus({ preventScroll: true });
    if (capturePointer !== null) return;
    const p = point(e);
    down = p;
    lastPointer = p;
    capturePointer = e.pointerId;
    pointerTouch = e.pointerType === "touch";
    panPointer =
      e.button === 1 ||
      (pointerTouch && !renderer.placement && commandMode === "select");
    shiftDown = e.shiftKey;
    renderer.pointer = p;
    if (e.isTrusted) c.setPointerCapture(e.pointerId);
    if (e.button === 2) {
      if (renderer.placement) cancelPlace();
      else orderAt(renderer.world(p), e.shiftKey);
      down = null;
    }
    e.preventDefault();
  });
  c.addEventListener("pointermove", (e) => {
    if (!renderer || !game || game.paused) return;
    const p = point(e);
    renderer.pointer = p;
    if (e.pointerId === capturePointer && down && lastPointer) {
      if (panPointer && dist(down, p) > 4) {
        renderer.pan(lastPointer.x - p.x, (lastPointer.y - p.y) / 0.83, 1);
      } else if (!pointerTouch && !renderer.placement && dist(down, p) > 5)
        renderer.drag = { from: down, to: p };
    }
    lastPointer = p;
  });
  const release = (e: PointerEvent) => {
    if (e.pointerId !== capturePointer || !renderer || !game) return;
    const p = point(e);
    if (down && !game.paused && !game.result) {
      if (renderer.placement) {
        if (pointerTouch) {
          buildTouch = renderer.world(p);
          renderer.pointer = p;
          $('#placement-message [data-action="confirm-place"]').textContent =
            "Place here";
        } else if (e.button === 0) placeAt(renderer.world(p));
      } else if (renderer.drag) {
        const a = renderer.world(renderer.drag.from),
          b = renderer.world(renderer.drag.to);
        if (!shiftDown) game.selected.clear();
        for (const unit of game.entities)
          if (
            unit.owner === 0 &&
            !unit.building &&
            unit.hp > 0 &&
            unit.x >= Math.min(a.x, b.x) &&
            unit.x <= Math.max(a.x, b.x) &&
            unit.y >= Math.min(a.y, b.y) &&
            unit.y <= Math.max(a.y, b.y)
          )
            game.selected.add(unit.id);
        audio.play("ui");
      } else if (dist(down, p) < 8 && e.button !== 1) {
        if (commandMode === "order") orderAt(renderer.world(p), e.shiftKey);
        else pickAt(renderer.world(p), e.shiftKey);
      }
    }
    renderer.drag = null;
    down = null;
    lastPointer = null;
    capturePointer = null;
    panPointer = false;
    if (c.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);
    updateHUD();
  };
  c.addEventListener("pointerup", release);
  c.addEventListener("pointercancel", () => {
    if (renderer) renderer.drag = null;
    down = null;
    lastPointer = null;
    capturePointer = null;
    panPointer = false;
  });
  c.addEventListener("lostpointercapture", () => {
    if (renderer) renderer.drag = null;
    down = null;
    lastPointer = null;
    capturePointer = null;
    panPointer = false;
  });
  c.addEventListener("pointerleave", () => {
    if (renderer && capturePointer === null)
      renderer.pointer = { x: -100, y: -100 };
  });
  c.addEventListener("dblclick", (e) => {
    if (!game || !renderer || game.paused) return;
    const p = renderer.world(point(e)),
      unit = game.entities.find(
        (u) => u.owner === 0 && !u.building && dist(u, p) < u.radius + 15,
      );
    if (unit)
      game.selected = new Set(
        game.entities
          .filter(
            (u) =>
              u.owner === 0 &&
              u.kind === unit.kind &&
              game!.rank(u) === game!.rank(unit) &&
              (() => {
                const s = renderer!.screen(u);
                return (
                  s.x >= 0 &&
                  s.x < renderer!.width &&
                  s.y >= 0 &&
                  s.y < renderer!.height
                );
              })(),
          )
          .map((u) => u.id),
      );
    updateHUD();
  });
  c.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (renderer && !game?.paused)
        renderer.zoom(
          renderer.camera.zoom * (e.deltaY > 0 ? 0.91 : 1.1),
          point(e),
        );
    },
    { passive: false },
  );
  let miniDown = false;
  const jump = (e: PointerEvent) => {
    if (!renderer || game?.paused) return;
    const r = mini.getBoundingClientRect();
    renderer.center({
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    });
  };
  mini.addEventListener("pointerdown", (e) => {
    miniDown = true;
    mini.setPointerCapture(e.pointerId);
    jump(e);
  });
  mini.addEventListener("pointermove", (e) => {
    if (miniDown) jump(e);
  });
  mini.addEventListener("pointerup", (e) => {
    miniDown = false;
    if (mini.hasPointerCapture(e.pointerId))
      mini.releasePointerCapture(e.pointerId);
  });
  mini.addEventListener("pointercancel", () => {
    miniDown = false;
  });
  mini.addEventListener("keydown", (e) => {
    if (!renderer || game?.paused) return;
    const moves: Record<string, Point> = {
      ArrowUp: { x: 0, y: -130 },
      ArrowDown: { x: 0, y: 130 },
      ArrowLeft: { x: -130, y: 0 },
      ArrowRight: { x: 130, y: 0 },
    };
    if (moves[e.key]) {
      e.preventDefault();
      renderer.center({
        x: renderer.camera.x + moves[e.key].x,
        y: renderer.camera.y + moves[e.key].y,
      });
    }
  });
}

// Some touch browsers suppress the compatibility click immediately after a canvas drag.
// Activate a stationary touch on native buttons once, then discard its duplicate native click.
let touchButton: {
  element: HTMLButtonElement;
  x: number;
  y: number;
  id: number;
} | null = null;
let handledTouchAt = -Infinity;
root.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "touch") return;
  const element = (event.target as Element).closest<HTMLButtonElement>(
    "button[data-action]",
  );
  touchButton = element
    ? { element, x: event.clientX, y: event.clientY, id: event.pointerId }
    : null;
});
root.addEventListener("pointercancel", () => {
  touchButton = null;
});
root.addEventListener("pointerup", (event) => {
  const touch = touchButton;
  touchButton = null;
  if (
    !touch ||
    event.pointerType !== "touch" ||
    touch.id !== event.pointerId ||
    touch.element.disabled
  )
    return;
  if (Math.hypot(event.clientX - touch.x, event.clientY - touch.y) > 10) return;
  if (!(event.target as Element).closest("button")?.isSameNode(touch.element))
    return;
  handledTouchAt = performance.now();
  touch.element.click();
});
root.addEventListener(
  "click",
  (event) => {
    const pointer = event as PointerEvent;
    if (
      event.isTrusted &&
      event.detail > 0 &&
      (!pointer.pointerType || pointer.pointerType === "touch") &&
      performance.now() - handledTouchAt < 700
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

root.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>(
    "[data-action]",
  );
  if (!button) return;
  const action = button.dataset.action;
  void audio.unlock();
  if (action === "sound") {
    audio.setMuted(!audio.muted);
    document
      .querySelectorAll<HTMLButtonElement>(".sound-button")
      .forEach((b) => {
        b.innerHTML = icon(audio.muted ? "mute" : "sound");
        b.setAttribute(
          "aria-label",
          `${audio.muted ? "Unmute" : "Mute"} audio`,
        );
        b.title = `${audio.muted ? "Unmute" : "Mute"} audio`;
      });
    return;
  }
  if (action === "lobby") {
    event.preventDefault();
    if (screen === "lobby") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    return;
  }
  if (action === "manual") {
    manual();
    return;
  }
  if (action === "close-manual") {
    closeDialog();
    if (game) {
      if (helpResume) resume();
      else pause(hostPaused);
    }
    return;
  }
  if (action === "close-dialog") {
    closeDialog();
    return;
  }
  if (action === "briefing") {
    briefing();
    return;
  }
  if (action === "training") {
    config.difficulty = "recruit";
    $<HTMLSelectElement>("#difficulty").value = "recruit";
    briefing();
    return;
  }
  if (action === "faction") {
    config.faction = button.dataset.value as Faction;
    document
      .querySelectorAll<HTMLButtonElement>(".faction-option")
      .forEach((b) => {
        b.classList.toggle("chosen", b.dataset.value === config.faction);
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.value === config.faction),
        );
      });
    audio.play("ui");
    return;
  }
  if (action === "start") {
    startMatch();
    return;
  }
  if (action === "replay") {
    startMatch(true);
    return;
  }
  if (action === "return-lobby") {
    closeDialog();
    lobby();
    return;
  }
  if (!game || !renderer) return;
  if (action === "pause") {
    pause();
    return;
  }
  if (action === "resume") {
    resume();
    return;
  }
  if (action === "restart-confirm") {
    confirmLeave(true);
    return;
  }
  if (action === "quit-confirm") {
    confirmLeave(false);
    return;
  }
  if (game.paused || game.result) return;
  if (action === "tab-base") setTab("base");
  if (action === "tab-army") setTab("army");
  if (action === "build") chooseBuild(button.dataset.kind as BuildingKind);
  if (action === "train") game.train(button.dataset.kind as UnitKind);
  if (action === "cancel-queue") game.cancelQueue(Number(button.dataset.index));
  if (action === "select-army") {
    game.selectArmy();
    audio.play("order");
  }
  if (action === "stop") {
    for (const e of game.selection)
      if (e.owner === 0) {
        e.orders = [];
        e.path = [];
        e.vx = 0;
        e.vy = 0;
      }
    audio.play("order");
  }
  if (action === "order") {
    commandMode = commandMode === "order" ? "select" : "order";
    $("#order-button").setAttribute(
      "aria-pressed",
      String(commandMode === "order"),
    );
    game.alert(
      commandMode === "order"
        ? "Order mode: select a destination on the battlefield."
        : "Selection mode: choose your Pepes.",
    );
  }
  if (action === "zoom-in") renderer.zoom(renderer.camera.zoom * 1.2);
  if (action === "zoom-out") renderer.zoom(renderer.camera.zoom / 1.2);
  if (action === "home") renderer.center(game.getHQ() ?? { x: 360, y: 390 });
  if (action === "alert") renderer.center(game.lastAlert);
  if (action === "uplink")
    renderer.center(game.uplinks[Number(button.dataset.id)]);
  if (action === "cancel-place") cancelPlace();
  if (action === "confirm-place")
    placeAt(buildTouch ?? { x: renderer.camera.x, y: renderer.camera.y });
  if (action === "hide-lesson") $("#lesson").hidden = true;
  if (action?.startsWith("mobile-")) {
    const panel = $(".command-panel"),
      area = action.slice(7);
    panel.classList.toggle(
      "mobile-open",
      !panel.classList.contains("mobile-open") || panel.dataset.area !== area,
    );
    panel.dataset.area = area;
    if (area === "base") setTab("base");
    if (area === "army") setTab("army");
  }
  updateHUD();
});
window.addEventListener("keydown", (event) => {
  if (screen !== "game" || !game || !renderer) return;
  const target = event.target as HTMLElement;
  if (
    target.tagName === "SELECT" ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA"
  )
    return;
  const key = event.key.toLowerCase();
  if (key === "p" && !event.repeat) {
    event.preventDefault();
    game.paused ? resume() : pause();
    return;
  }
  if (game.paused || game.result) return;
  if (key === "escape") {
    event.preventDefault();
    if (renderer.placement) cancelPlace();
    else if ($(".command-panel").classList.contains("mobile-open"))
      $(".command-panel").classList.remove("mobile-open");
    else pause();
    return;
  }
  if (key === " " && target.tagName !== "BUTTON") {
    event.preventDefault();
    renderer.center(game.lastAlert);
  }
  if (["w", "a", "s", "d"].includes(key)) {
    keys.add(key);
    event.preventDefault();
  }
  if (event.repeat) return;
  if (key === "x") {
    game.selectArmy();
    audio.play("order");
  }
  if (key === "b") setTab("base");
  if (key === "f") setTab("army");
  if (key === "home") {
    event.preventDefault();
    renderer.center(game.getHQ() ?? { x: 360, y: 390 });
  }
  if (key === "z") {
    const own = game.entities.filter((e) => e.owner === 0 && !e.building);
    const index = own.findIndex((e) => game!.selected.has(e.id));
    const next = own[(index + 1) % own.length];
    if (next) {
      game.selected = new Set([next.id]);
      renderer.center(next);
    }
  }
  if (key === "h") {
    for (const e of game.selection)
      if (e.owner === 0) {
        e.orders = [];
        e.path = [];
        e.vx = 0;
        e.vy = 0;
      }
  }
  if (key === "enter" && target.tagName !== "BUTTON") {
    event.preventDefault();
    if (renderer.placement) placeAt(renderer.camera);
    else orderAt(renderer.camera, event.shiftKey);
  }
  if (key === "+" || key === "=") renderer.zoom(renderer.camera.zoom * 1.1);
  if (key === "-") renderer.zoom(renderer.camera.zoom / 1.1);
  if (/^[1-9]$/.test(key)) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      game.groups.set(
        Number(key),
        [...game.selected].filter((id) =>
          game!.entities.some((e) => e.id === id && e.owner === 0),
        ),
      );
      game.alert(`Control group ${key} assigned.`);
    } else {
      const ids = game.groups.get(Number(key));
      if (ids)
        game.selected = new Set(
          ids.filter((id) => game!.entities.some((e) => e.id === id)),
        );
    }
  }
  const buildKey = (tab === "base" ? BUILDINGS : UNITS).find(
    (k) => SPECS[k].key.toLowerCase() === key,
  );
  if (buildKey && !event.ctrlKey && !event.metaKey) {
    if (tab === "base") chooseBuild(buildKey as BuildingKind);
    else game.train(buildKey as UnitKind);
  }
  updateHUD();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => {
  keys.clear();
});
const motion = matchMedia("(prefers-reduced-motion: reduce)");
motion.addEventListener("change", () => {
  if (renderer) renderer.reduced = motion.matches;
});
const bridge = connectBridge({
  pause: () => pause(true),
  resume: () => resume(true),
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && game && !game.paused) pause();
});
function frame(stamp: number) {
  const dt = Math.max(0, Math.min((stamp - lastFrame) / 1000 || 0, 0.05));
  lastFrame = stamp;
  if (game && renderer && screen === "game") {
    if (!game.paused && !game.result) {
      let dx = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0),
        dy = (keys.has("s") ? 1 : 0) - (keys.has("w") ? 1 : 0);
      if (!pointerTouch && capturePointer === null && !renderer.placement) {
        const p = renderer.pointer;
        if (
          p.x >= 0 &&
          p.y >= 0 &&
          p.x < renderer.width &&
          p.y < renderer.height
        ) {
          if (p.x < 12) dx--;
          if (p.x > renderer.width - 12) dx++;
          if (p.y < 12) dy--;
          if (p.y > renderer.height - 12) dy++;
        }
      }
      renderer.pan(dx * 430, dy * 430, dt);
      game.tick(dt);
    }
    if (buildTouch && renderer.placement)
      renderer.pointer = renderer.screen(buildTouch);
    renderer.render(game.time);
    hudTimer -= dt;
    if (hudTimer <= 0) {
      updateHUD();
      hudTimer = 0.15;
    }
  }
  requestAnimationFrame(frame);
}
lobby();
requestAnimationFrame(frame);
// Read-only diagnostics support real-browser evidence without exposing cheat controls.
Object.defineProperty(window, "__PEPEFRONT__", {
  value: {
    snapshot: () => ({
      screen,
      paused: game?.paused ?? false,
      result: game?.result ?? null,
      reason: game?.resultReason ?? "",
      time: game?.time ?? 0,
      score: game?.score ?? 0,
      credits: game?.me.credits ?? 0,
      harvested: game?.harvested ?? 0,
      selection: game?.selection.map((e) => e.id) ?? [],
      units:
        game?.entities.map(
          ({ id, kind, owner, x, y, hp, ready, cargo, orders }) => ({
            id,
            kind,
            owner,
            x,
            y,
            hp,
            ready,
            cargo,
            orders: orders.map((order) => ({ ...order })),
          }),
        ) ?? [],
      camera: renderer ? { ...renderer.camera } : null,
      uplinks: game?.uplinks.map((n) => ({ ...n })) ?? [],
      players:
        game?.players.map(
          ({
            id,
            faction,
            team,
            credits,
            influence,
            eliminated,
            produced,
            queue,
          }) => ({
            id,
            faction,
            team,
            credits,
            influence,
            eliminated,
            produced,
            queue: queue.map((q) => ({ ...q })),
          }),
        ) ?? [],
      config: { ...config },
      audio: {
        muted: audio.muted,
        state: audio.context?.state ?? "uninitialized",
      },
      reducedMotion: renderer?.reduced ?? motion.matches,
      placement: renderer?.placement ?? null,
      commandMode,
      remaining: game ? LIMIT - game.time : LIMIT,
    }),
    worldToScreen: (p: Point) => renderer?.screen(p),
  },
  writable: false,
});
