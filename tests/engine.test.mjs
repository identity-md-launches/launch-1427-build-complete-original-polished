import test from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  SPECS,
  CAPTURE_GOAL,
  LIMIT,
  dist,
  randomSeed,
} from "../src/game.ts";
const fresh = (extra = {}) =>
  new Game({
    faction: "initiative",
    mode: "duel",
    difficulty: "recruit",
    seed: 8127,
    ...extra,
  });
const advance = (g, seconds) => {
  for (let i = 0; i < Math.round(seconds * 20); i++) g.tick(0.05);
};
const isolate = (g) => {
  g.entities = g.entities.filter((e) => e.building || e.owner !== 0);
  g.players[1].aiThink = 1e6;
  g.players[1].aiAttack = 1e6;
  g.rebuildGrid();
};
const complete = (g, kind, x, y) => {
  const e = g.spawn(kind, 0, x, y);
  g.rebuildGrid();
  g.refreshPower();
  return e;
};

test("seeded terrain randomness is reproducible", () => {
  const a = randomSeed(9),
    b = randomSeed(9);
  for (let i = 0; i < 40; i++) assert.equal(a(), b());
});
test("duel, allied front and FFA have the correct teams", () => {
  assert.equal(fresh().players.length, 2);
  const t = fresh({ mode: "teams" });
  assert.equal(t.players.length, 4);
  assert.ok(t.allied(0, 3));
  assert.ok(!t.allied(0, 1));
  const f = fresh({ mode: "ffa" });
  assert.ok(!f.allied(0, 3));
});
test("factions have distinct health, cost, speed and opening armies", () => {
  const a = fresh(),
    b = fresh({ faction: "cult" });
  assert.equal(a.getHQ().maxHp, 3120);
  assert.equal(b.cost("tank"), 208);
  assert.equal(a.cost("tank"), 260);
  assert.ok(
    b.speed(b.entities.find((e) => e.kind === "recruit")) >
      a.speed(a.entities.find((e) => e.kind === "recruit")),
  );
  assert.equal(a.supply(), 8);
});
test("prerequisites and invalid placement do not charge crystals", () => {
  const g = fresh(),
    before = g.me.credits;
  assert.equal(g.build("factory", { x: 580, y: 500 }), false);
  assert.equal(g.build("power", { x: 360, y: 390 }), false);
  assert.equal(g.me.credits, before);
  assert.match(g.placement("power", { x: 1200, y: 430 }), /350/);
});
test("construction charges once, takes time and unlocks the next tier", () => {
  const g = fresh();
  isolate(g);
  assert.ok(g.build("power", { x: 360, y: 570 }));
  assert.equal(g.me.credits, 950);
  assert.ok(!g.has("power"));
  advance(g, 7.1);
  assert.ok(g.has("power"));
  assert.equal(g.me.power, 40);
  assert.ok(g.build("barracks", { x: 560, y: 500 }));
  advance(g, 10.1);
  assert.ok(g.has("barracks"));
  assert.equal(g.available("factory"), null);
});
test("harvesters make repeated real crystal deposits without orders", () => {
  const g = fresh();
  advance(g, 60);
  assert.ok(g.harvested >= 700, `Harvested ${g.harvested}`);
  assert.equal(g.me.credits, 1100 + g.harvested);
  const first = g.harvested;
  advance(g, 30);
  assert.ok(g.harvested > first);
  assert.ok(g.resources.some((n) => n.amount < n.max));
});
test("production uses resources and spawns a real unit after its duration", () => {
  const g = fresh();
  isolate(g);
  complete(g, "power", 360, 570);
  complete(g, "barracks", 570, 500);
  const before = g.supply();
  assert.ok(g.train("recruit"));
  assert.equal(g.me.credits, 1015);
  advance(g, 5.1);
  assert.equal(g.supply(), before + 1);
  assert.equal(g.me.queue.length, 0);
  assert.equal(g.me.produced, 1);
});
test("canceling production refunds the exact faction-adjusted cost", () => {
  const g = fresh({ faction: "cult" });
  isolate(g);
  complete(g, "barracks", 560, 500);
  const before = g.me.credits;
  assert.ok(g.train("recruit"));
  advance(g, 1);
  g.cancelQueue(0);
  assert.equal(g.me.credits, before);
  assert.equal(g.me.queue.length, 0);
});
test("low power slows production to 40 percent", () => {
  const g = fresh();
  isolate(g);
  complete(g, "barracks", 560, 500);
  complete(g, "factory", 560, 650);
  assert.ok(g.me.used > g.me.power);
  g.train("recruit");
  advance(g, 4);
  assert.ok(Math.abs(g.me.queue[0].progress - 1.6) < 0.02);
  assert.equal(g.me.produced, 0);
});
test("pathfinding routes around ruins and occupied building cells", () => {
  const g = fresh(),
    path = g.route({ x: 700, y: 690 }, { x: 1010, y: 690 });
  assert.ok(path.length > 0);
  assert.ok(
    path.every(
      (p) => !g.blocked[Math.floor(p.y / 48) * 50 + Math.floor(p.x / 48)],
    ),
  );
  assert.ok(path.some((p) => p.y < 620 || p.y > 740));
});
test("movement is stable across different timestep sizes", () => {
  const a = fresh(),
    b = fresh();
  for (const g of [a, b]) {
    g.entities = g.entities.filter((e) => e.kind === "hq");
    const u = g.spawn("recruit", 0, 500, 500);
    g.issue([u.id], { type: "move", x: 650, y: 530 });
  }
  for (let i = 0; i < 120; i++) a.tick(1 / 60);
  for (let i = 0; i < 60; i++) b.tick(1 / 30);
  assert.ok(dist(a.entities.at(-1), b.entities.at(-1)) < 5);
});
test("queued orders are kept and are completed in sequence", () => {
  const g = fresh();
  isolate(g);
  const u = g.spawn("recruit", 0, 530, 400);
  g.issue([u.id], { type: "move", x: 640, y: 430 });
  g.issue([u.id], { type: "move", x: 680, y: 500 }, true);
  assert.equal(u.orders.length, 2);
  advance(g, 12);
  assert.equal(u.orders.length, 0);
  assert.ok(dist(u, { x: 680, y: 500 }) < 40);
});
test("orders cannot seize control of enemy units", () => {
  const g = fresh(),
    enemy = g.entities.find((e) => e.owner === 1 && !e.building);
  g.issue([enemy.id], { type: "move", x: 20, y: 20 });
  assert.equal(enemy.orders.length, 0);
});
test("fog reveals friendly surroundings, hides enemies and remembers exploration", () => {
  const g = fresh();
  assert.ok(g.visibleAt(g.getHQ()));
  assert.ok(!g.canSee(g.getHQ(1)));
  const u = g.spawn("recruit", 0, 1500, 900);
  g.refreshFog();
  assert.ok(g.visibleAt(u));
  u.x = 500;
  g.refreshFog();
  assert.ok(!g.visibleAt({ x: 1500, y: 900 }));
  assert.ok(g.exploredAt({ x: 1500, y: 900 }));
});
test("Cult commandos cloak outside detection range until they fire", () => {
  const g = fresh();
  g.spawn("recruit", 0, 1000, 900);
  const c = g.spawn("commando", 1, 1220, 900);
  g.refreshFog();
  assert.ok(!g.canSee(c));
  c.lastShot = g.time;
  assert.ok(g.canSee(c));
});
test("engineers repair friendly completed structures", () => {
  const g = fresh();
  isolate(g);
  const hq = g.getHQ();
  hq.hp -= 100;
  g.spawn("engineer", 0, hq.x + 90, hq.y);
  advance(g, 2);
  assert.ok(hq.hp > hq.maxHp - 60);
});
test("uncontested uplinks capture, contested uplinks stop capture", () => {
  const g = fresh();
  isolate(g);
  g.spawn("recruit", 0, 1200, 420);
  g.spawn("recruit", 0, 1210, 435);
  advance(g, 13);
  assert.equal(g.uplinks[0].owner, 0);
  assert.ok(g.me.influence > 0);
  const p = g.uplinks[1];
  g.spawn("engineer", 0, p.x - 15, p.y);
  g.spawn("engineer", 1, p.x + 15, p.y);
  advance(g, 20);
  assert.equal(p.owner, -1);
});
test("rank and signal lab bonuses increase actual damage", () => {
  const g = fresh();
  isolate(g);
  const a = g.spawn("recruit", 0, 1000, 900),
    b = g.spawn("tank", 1, 1100, 900);
  a.kills = 6;
  complete(g, "tech", 450, 570);
  const before = b.hp;
  g.attack(a, b, 0.05);
  assert.ok(Math.abs(before - b.hp - SPECS.recruit.damage * 1.24 * 1.2) < 0.01);
});
test("HQ destruction produces victory, finite score and stops simulation", () => {
  const g = fresh();
  const src = g.entities.find((e) => e.owner === 0 && !e.building),
    hq = g.getHQ(1);
  g.damage(hq, hq.hp + 1, src);
  assert.equal(g.result, "victory");
  assert.ok(Number.isSafeInteger(g.score) && g.score >= 1000);
  const time = g.time;
  g.tick(0.1);
  assert.equal(g.time, time);
});
test("HQ loss produces defeat and no negative score", () => {
  const g = fresh();
  g.damage(
    g.getHQ(),
    10000,
    g.entities.find((e) => e.owner === 1 && !e.building),
  );
  assert.equal(g.result, "defeat");
  assert.ok(g.score >= 0);
});
test("holding uplinks can win without base destruction", () => {
  const g = fresh();
  g.me.influence = CAPTURE_GOAL;
  g.checkResult();
  assert.equal(g.result, "victory");
  assert.match(g.resultReason, /signal/);
});
test("team signal is shared and an allied signal victory counts", () => {
  const g = fresh({ mode: "teams" });
  g.uplinks[2].owner = 3;
  g.tick(0.1);
  assert.equal(g.players[0].influence, g.players[3].influence);
  g.players[3].influence = CAPTURE_GOAL;
  g.checkResult();
  assert.equal(g.result, "victory");
});
test("twelve minute match limit resolves a match", () => {
  const g = fresh();
  g.time = LIMIT;
  g.me.influence = 100;
  g.checkResult();
  assert.equal(g.result, "victory");
  assert.match(g.resultReason, /Twelve-minute/);
});
test("pause freezes resource, production, movement and match clocks", () => {
  const g = fresh();
  g.paused = true;
  const before = JSON.stringify({
    units: g.entities,
    time: g.time,
    credits: g.me.credits,
  });
  advance(g, 20);
  assert.equal(
    JSON.stringify({ units: g.entities, time: g.time, credits: g.me.credits }),
    before,
  );
});
test("AI builds tech, trains an army and makes offensive orders", () => {
  const g = fresh({ difficulty: "veteran" });
  advance(g, 170);
  assert.ok(g.players[1].produced > 10);
  assert.ok(g.entities.some((e) => e.owner === 1 && e.kind === "factory"));
  assert.ok(g.entities.some((e) => e.owner === 1 && e.orders.length > 0));
});

test("construction cannot trap a Pepe inside a new foundation", () => {
  const g = fresh();
  const recruit = g.entities.find((e) => e.owner === 0 && e.kind === "recruit");
  const credits = g.me.credits;
  assert.match(g.placement("power", recruit), /Pepes occupy/);
  assert.equal(g.build("power", recruit), false);
  assert.equal(g.me.credits, credits);
});

test("invalid or backward clock deltas never rewind or poison the simulation", () => {
  const g = fresh();
  advance(g, 1);
  const before = JSON.stringify({
    time: g.time,
    units: g.entities,
    credits: g.me.credits,
  });
  for (const dt of [-1, -1000, NaN, Infinity, 0]) g.tick(dt);
  assert.equal(
    JSON.stringify({ time: g.time, units: g.entities, credits: g.me.credits }),
    before,
  );
});

test("Shift-queued harvesting delivers the active field before switching fields", () => {
  const g = fresh();
  isolate(g);
  const h = g.spawn("harvester", 0, 280, 480);
  const first = g.resources[0], second = g.resources[1];
  g.issue([h.id], { type: "harvest", target: first.id, ...first });
  advance(g, 1);
  const before = { node: h.harvestNode, path: structuredClone(h.path) };
  g.issue([h.id], { type: "harvest", target: second.id, ...second }, true);
  assert.equal(h.harvestNode, before.node);
  assert.deepEqual(h.path, before.path);
  advance(g, 5);
  assert.equal(h.harvestNode, first.id);
  assert.equal(second.amount, second.max);
  assert.ok(h.cargo > 0);
  assert.equal(h.orders.length, 2);
  for (let i = 0; i < 800 && g.harvested === 0; i++) g.tick(0.05);
  assert.equal(g.harvested, 140);
  assert.equal(h.cargo, 0);
  assert.deepEqual(h.orders.map(o => o.target), [second.id]);
  g.tick(0.05);
  assert.equal(h.harvestNode, second.id);
  advance(g, 30);
  assert.ok(second.amount < second.max);
  assert.ok(g.harvested >= 280);
  assert.equal(h.orders.length, 0);
  const previous = g.harvested;
  advance(g, 30);
  assert.ok(g.harvested > previous, "Last field continues harvesting automatically");
});

test("a queued harvest only activates after an earlier movement order", () => {
  const g = fresh();
  isolate(g);
  const h = g.spawn("harvester", 0, 530, 450);
  h.harvestNode = 0;
  g.issue([h.id], { type: "move", x: 680, y: 500 });
  g.issue([h.id], { type: "harvest", target: 1, x: 520, y: 210 }, true);
  advance(g, 1);
  assert.equal(h.orders[0].type, "move");
  assert.equal(h.harvestNode, 0);
  advance(g, 6);
  assert.equal(h.orders[0].type, "harvest");
  assert.equal(h.harvestNode, 1);
});

test("a depleted field delivers its partial load before advancing queued orders", () => {
  const g = fresh();
  isolate(g);
  const h = g.spawn("harvester", 0, 250, 600);
  g.resources[0].amount = 24;
  g.issue([h.id], { type: "harvest", target: 0, x: 210, y: 640 });
  g.issue([h.id], { type: "move", x: 680, y: 500 }, true);
  advance(g, 1);
  assert.equal(h.cargo, 24);
  assert.equal(h.orders[0].type, "harvest");
  for (let i = 0; i < 800 && g.harvested === 0; i++) g.tick(0.05);
  assert.equal(g.harvested, 24);
  assert.equal(h.orders[0].type, "move");
  assert.equal(h.cargo, 0);
  for (let i = 0; i < 800 && h.orders.length; i++) g.tick(0.05);
  assert.equal(h.orders.length, 0);
  assert.ok(dist(h, { x: 680, y: 500 }) < 28);
});

test("an empty harvest field cannot trap a queued assignment", () => {
  const g = fresh();
  isolate(g);
  const h = g.spawn("harvester", 0, 280, 480);
  g.resources[0].amount = 0;
  g.issue([h.id], { type: "harvest", target: 0, x: 210, y: 640 });
  g.issue([h.id], { type: "harvest", target: 1, x: 520, y: 210 }, true);
  advance(g, 0.1);
  assert.equal(h.harvestNode, 1);
  assert.deepEqual(h.orders.map(o => o.target), [1]);
  advance(g, 30);
  assert.ok(g.harvested > 0);
});
