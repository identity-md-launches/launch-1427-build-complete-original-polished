export type Faction = "initiative" | "cult";
export type Mode = "duel" | "teams" | "ffa";
export type Difficulty = "recruit" | "veteran" | "brutal";
export type UnitKind =
  | "recruit"
  | "engineer"
  | "tank"
  | "commando"
  | "harvester";
export type BuildingKind =
  | "hq"
  | "power"
  | "barracks"
  | "factory"
  | "tech"
  | "turret";
export type Kind = UnitKind | BuildingKind;
export type Point = { x: number; y: number };
export type Order = Point & {
  type: "move" | "attack" | "harvest";
  target?: number;
};
export type Spec = {
  name: string;
  cost: number;
  hp: number;
  radius: number;
  time: number;
  speed: number;
  range: number;
  damage: number;
  rate: number;
  power: number;
  requires?: BuildingKind;
  blurb: string;
  key: string;
};
export const W = 2400,
  H = 1800,
  CELL = 48,
  COLS = 50,
  ROWS = 38,
  LIMIT = 720,
  CAPTURE_GOAL = 540;
export const SPECS: Record<Kind, Spec> = {
  hq: {
    name: "Command HQ",
    cost: 0,
    hp: 2600,
    radius: 58,
    time: 0,
    speed: 0,
    range: 230,
    damage: 15,
    rate: 1.3,
    power: 12,
    blurb: "Your command center and crystal drop-off. Keep it standing.",
    key: "",
  },
  power: {
    name: "Power plant",
    cost: 150,
    hp: 650,
    radius: 34,
    time: 7,
    speed: 0,
    range: 0,
    damage: 0,
    rate: 0,
    power: 28,
    blurb: "+28 power. Keeps production and defenses running.",
    key: "Q",
  },
  barracks: {
    name: "Barracks",
    cost: 220,
    hp: 850,
    radius: 42,
    time: 10,
    speed: 0,
    range: 0,
    damage: 0,
    rate: 0,
    power: -6,
    requires: "power",
    blurb: "Trains Recruit and Engineer Pepes.",
    key: "E",
  },
  factory: {
    name: "War factory",
    cost: 400,
    hp: 1150,
    radius: 48,
    time: 16,
    speed: 0,
    range: 0,
    damage: 0,
    rate: 0,
    power: -12,
    requires: "barracks",
    blurb: "Deploys Tank and Harvester Pepes.",
    key: "R",
  },
  tech: {
    name: "Signal lab",
    cost: 420,
    hp: 800,
    radius: 35,
    time: 18,
    speed: 0,
    range: 0,
    damage: 0,
    rate: 0,
    power: -10,
    requires: "factory",
    blurb: "Unlocks Commandos. All troops gain +20% damage.",
    key: "T",
  },
  turret: {
    name: "Sentry post",
    cost: 190,
    hp: 950,
    radius: 25,
    time: 10,
    speed: 0,
    range: 240,
    damage: 24,
    rate: 0.95,
    power: -7,
    requires: "barracks",
    blurb: "A Pepe gunner holds the line. Uses 7 power.",
    key: "G",
  },
  recruit: {
    name: "Recruit Pepe",
    cost: 85,
    hp: 105,
    radius: 12,
    time: 5,
    speed: 77,
    range: 150,
    damage: 9,
    rate: 0.85,
    power: 0,
    requires: "barracks",
    blurb: "Fast rifle squad. Captures uplinks and screens armor.",
    key: "Q",
  },
  engineer: {
    name: "Engineer Pepe",
    cost: 130,
    hp: 110,
    radius: 12,
    time: 7,
    speed: 73,
    range: 0,
    damage: 0,
    rate: 0,
    power: 0,
    requires: "barracks",
    blurb: "Automatically repairs nearby friendly buildings.",
    key: "E",
  },
  tank: {
    name: "Tank Pepe",
    cost: 260,
    hp: 420,
    radius: 22,
    time: 12,
    speed: 59,
    range: 215,
    damage: 36,
    rate: 1.65,
    power: 0,
    requires: "factory",
    blurb: "Heavy armor. Long-range cannon with splash damage.",
    key: "R",
  },
  harvester: {
    name: "Harvester Pepe",
    cost: 210,
    hp: 300,
    radius: 20,
    time: 11,
    speed: 64,
    range: 0,
    damage: 0,
    rate: 0,
    power: 0,
    requires: "factory",
    blurb: "Collects crystals and automatically returns to HQ.",
    key: "G",
  },
  commando: {
    name: "Commando Pepe",
    cost: 190,
    hp: 180,
    radius: 13,
    time: 10,
    speed: 86,
    range: 200,
    damage: 24,
    rate: 1.1,
    power: 0,
    requires: "tech",
    blurb: "Elite rifle Pepe. Cult Commandos cloak at long range.",
    key: "T",
  },
};
export const BUILDINGS: BuildingKind[] = [
  "power",
  "barracks",
  "factory",
  "tech",
  "turret",
];
export const UNITS: UnitKind[] = [
  "recruit",
  "engineer",
  "tank",
  "commando",
  "harvester",
];
export const COLORS = ["#8ce9dd", "#ee77b0", "#e8bc65", "#a1a0fa"];
export const SPAWNS: Point[] = [
  { x: 360, y: 390 },
  { x: 2040, y: 1410 },
  { x: 2040, y: 390 },
  { x: 360, y: 1410 },
];
export interface Config {
  faction: Faction;
  mode: Mode;
  difficulty: Difficulty;
  seed: number;
}
export interface Entity extends Point {
  id: number;
  kind: Kind;
  owner: number;
  hp: number;
  maxHp: number;
  radius: number;
  building: boolean;
  ready: number;
  angle: number;
  orders: Order[];
  path: Point[];
  pathAge: number;
  vx: number;
  vy: number;
  cooldown: number;
  cargo: number;
  harvestNode: number;
  kills: number;
  flash: number;
  lastShot: number;
}
export interface Player {
  id: number;
  name: string;
  faction: Faction;
  team: number;
  color: string;
  credits: number;
  power: number;
  used: number;
  influence: number;
  eliminated: boolean;
  queue: { kind: UnitKind; progress: number; duration: number; cost: number }[];
  aiThink: number;
  aiAttack: number;
  produced: number;
}
export interface Resource extends Point {
  id: number;
  amount: number;
  max: number;
}
export interface Uplink extends Point {
  id: number;
  owner: number;
  progress: number;
  capturing: number;
}
export interface Shot extends Point {
  tx: number;
  ty: number;
  life: number;
  max: number;
  color: string;
  heavy: boolean;
}
export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}
export interface Ruin extends Point {
  w: number;
  h: number;
  style: number;
}
export interface Event {
  text: string;
  kind: "info" | "danger" | "success";
  at: number;
  x?: number;
  y?: number;
}
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (n: number, a: number, b: number) =>
  Math.max(a, Math.min(b, n));
export const isBuilding = (k: Kind): k is BuildingKind =>
  k === "hq" || BUILDINGS.includes(k as BuildingKind);
export function randomSeed(seed: number) {
  let v = seed >>> 0;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) >>> 0;
    return v / 4294967296;
  };
}

export class Game {
  config: Config;
  entities: Entity[] = [];
  players: Player[] = [];
  resources: Resource[] = [];
  uplinks: Uplink[] = [];
  ruins: Ruin[] = [];
  events: Event[] = [];
  shots: Shot[] = [];
  particles: Particle[] = [];
  selected = new Set<number>();
  groups = new Map<number, number[]>();
  explored = new Uint8Array(COLS * ROWS);
  visible = new Uint8Array(COLS * ROWS);
  blocked = new Uint8Array(COLS * ROWS);
  time = 0;
  paused = false;
  result: "victory" | "defeat" | null = null;
  resultReason = "";
  score = 0;
  kills = 0;
  harvested = 0;
  nextId = 1;
  rng: () => number;
  fogTimer = 0;
  lastAlert: Point = SPAWNS[0];
  onSound?: (s: string) => void;
  constructor(config: Config) {
    this.config = config;
    this.rng = randomSeed(config.seed);
    const count = config.mode === "duel" ? 2 : 4;
    for (let id = 0; id < count; id++) {
      const faction =
        id === 0 || (config.mode === "teams" && id === 3)
          ? config.faction
          : config.faction === "initiative"
            ? "cult"
            : "initiative";
      this.players.push({
        id,
        name:
          id === 0
            ? "You"
            : config.mode === "teams" && id === 3
              ? "Echo · allied AI"
              : ["", "Viper · AI", "Wraith · AI", "Mantis · AI"][id],
        faction,
        team: config.mode === "teams" ? (id === 0 || id === 3 ? 0 : 1) : id,
        color: COLORS[id],
        credits: id === 0 ? 1100 : 950,
        power: 0,
        used: 0,
        influence: 0,
        eliminated: false,
        queue: [],
        aiThink: 8 + id,
        aiAttack:
          config.difficulty === "recruit"
            ? 105
            : config.difficulty === "brutal"
              ? 52
              : 76,
        produced: 0,
      });
    }
    // Intentional lanes around industrial ruins. No wall closes off a base or uplink.
    this.ruins = [
      { x: 740, y: 200, w: 120, h: 90, style: 0 },
      { x: 790, y: 620, w: 130, h: 120, style: 1 },
      { x: 1510, y: 1080, w: 130, h: 120, style: 1 },
      { x: 1540, y: 1510, w: 120, h: 90, style: 0 },
      { x: 1480, y: 230, w: 130, h: 80, style: 2 },
      { x: 810, y: 1500, w: 130, h: 80, style: 2 },
      { x: 570, y: 900, w: 140, h: 80, style: 2 },
      { x: 1690, y: 830, w: 140, h: 80, style: 0 },
    ];
    const nodes: Point[] = [
      { x: 210, y: 640 },
      { x: 520, y: 210 },
      { x: 2190, y: 1160 },
      { x: 1880, y: 1590 },
      { x: 2190, y: 640 },
      { x: 1880, y: 210 },
      { x: 210, y: 1160 },
      { x: 520, y: 1590 },
      { x: 1000, y: 900 },
      { x: 1400, y: 900 },
    ];
    this.resources = nodes.map((p, i) => ({
      ...p,
      id: i,
      amount: 8400,
      max: 8400,
    }));
    this.uplinks = [
      { x: 1200, y: 430, id: 0, owner: -1, progress: 0, capturing: -1 },
      { x: 1200, y: 900, id: 1, owner: -1, progress: 0, capturing: -1 },
      { x: 1200, y: 1370, id: 2, owner: -1, progress: 0, capturing: -1 },
    ];
    for (const p of this.players) {
      const s = SPAWNS[p.id];
      this.spawn("hq", p.id, s.x, s.y);
      const node = this.resources[p.id * 2];
      this.spawn("harvester", p.id, s.x - 80, s.y + 90).harvestNode = node.id;
      this.spawn("harvester", p.id, s.x + 85, s.y + 90).harvestNode =
        this.resources[p.id * 2 + 1].id;
      for (let i = 0; i < 5; i++)
        this.spawn(
          "recruit",
          p.id,
          s.x + 120 + (i % 3) * 29,
          s.y - 45 + Math.floor(i / 3) * 32,
        );
      this.spawn("engineer", p.id, s.x - 75, s.y - 65);
    }
    this.rebuildGrid();
    this.refreshFog();
    this.refreshPower();
    this.alert(
      "Operation Nightfall. Build power, train Pepes, take the uplinks.",
      "info",
    );
  }
  get me() {
    return this.players[0];
  }
  get selection() {
    return this.entities.filter((e) => this.selected.has(e.id) && e.hp > 0);
  }
  allied(a: number, b: number) {
    return this.players[a].team === this.players[b].team;
  }
  cost(kind: Kind, owner = 0) {
    return Math.round(
      SPECS[kind].cost * (this.players[owner].faction === "cult" ? 0.8 : 1),
    );
  }
  has(kind: Kind, owner = 0) {
    return this.entities.some(
      (e) => e.owner === owner && e.kind === kind && e.hp > 0 && e.ready >= 1,
    );
  }
  getHQ(owner = 0) {
    return this.entities.find(
      (e) => e.owner === owner && e.kind === "hq" && e.hp > 0,
    );
  }
  speed(e: Entity) {
    return (
      SPECS[e.kind].speed *
      (this.players[e.owner].faction === "cult" ? 1.15 : 0.94)
    );
  }
  rank(e: Entity) {
    return e.kills >= 6 ? 3 : e.kills >= 2 ? 2 : 1;
  }
  supply(owner = 0) {
    return this.entities.filter(
      (e) => e.owner === owner && !e.building && e.hp > 0,
    ).length;
  }
  spawn(
    kind: Kind,
    owner: number,
    x: number,
    y: number,
    construction = false,
  ): Entity {
    const s = SPECS[kind],
      building = isBuilding(kind),
      tough = this.players[owner].faction === "initiative" ? 1.2 : 0.9;
    const maxHp = Math.round(s.hp * tough);
    const e: Entity = {
      id: this.nextId++,
      kind,
      owner,
      x,
      y,
      hp: construction ? maxHp * 0.2 : maxHp,
      maxHp,
      radius: s.radius,
      building,
      ready: construction ? 0 : 1,
      angle: owner === 0 ? -Math.PI / 4 : (Math.PI * 3) / 4,
      orders: [],
      path: [],
      pathAge: 0,
      vx: 0,
      vy: 0,
      cooldown: 0,
      cargo: 0,
      harvestNode: -1,
      kills: 0,
      flash: 0,
      lastShot: -10,
    };
    this.entities.push(e);
    return e;
  }
  alert(text: string, kind: Event["kind"] = "info", p?: Point) {
    this.events.unshift({ text, kind, at: this.time, ...p });
    this.events = this.events.slice(0, 30);
    if (p) this.lastAlert = { x: p.x, y: p.y };
    if (kind === "danger") this.onSound?.("alert");
  }
  refreshPower() {
    for (const p of this.players) {
      p.power = 0;
      p.used = 0;
    }
    for (const e of this.entities)
      if (e.hp > 0 && e.ready >= 1 && e.building) {
        const n = SPECS[e.kind].power;
        if (n > 0) this.players[e.owner].power += n;
        else this.players[e.owner].used -= n;
      }
  }
  available(kind: Kind, owner = 0): string | null {
    if (this.result) return "The match has ended.";
    if (this.players[owner].eliminated) return "Command HQ lost.";
    const s = SPECS[kind];
    if (s.requires && !this.has(s.requires, owner))
      return `Requires ${SPECS[s.requires].name}.`;
    if (this.players[owner].credits < this.cost(kind, owner))
      return `Need ${this.cost(kind, owner)} crystals.`;
    if (
      !isBuilding(kind) &&
      this.supply(owner) + this.players[owner].queue.length >= 50
    )
      return "Pepe limit reached (50).";
    if (!isBuilding(kind) && this.players[owner].queue.length >= 8)
      return "Production queue full (8).";
    return null;
  }
  placement(kind: BuildingKind, p: Point, owner = 0): string | null {
    const r = SPECS[kind].radius;
    if (p.x < r + 20 || p.y < r + 20 || p.x > W - r - 20 || p.y > H - r - 20)
      return "Place inside the map.";
    if (
      !this.entities.some(
        (e) =>
          e.owner === owner &&
          e.building &&
          e.hp > 0 &&
          e.ready >= 1 &&
          dist(e, p) < 350,
      )
    )
      return "Build within 350m of your base.";
    if (
      this.entities.some(
        (e) => e.building && e.hp > 0 && dist(e, p) < e.radius + r + 22,
      )
    )
      return "Leave room between buildings.";
    if (
      this.entities.some(
        (e) => !e.building && e.hp > 0 && dist(e, p) < e.radius + r + 10,
      )
    )
      return "Pepes occupy this site. Move them first.";
    if (
      this.resources.some((n) => dist(n, p) < r + 55) ||
      this.uplinks.some((n) => dist(n, p) < r + 95)
    )
      return "Keep crystal fields and uplinks clear.";
    if (
      this.ruins.some(
        (n) =>
          p.x > n.x - r - 15 &&
          p.x < n.x + n.w + r + 15 &&
          p.y > n.y - r - 15 &&
          p.y < n.y + n.h + r + 15,
      )
    )
      return "Ruins block this location.";
    return null;
  }
  build(kind: BuildingKind, p: Point, owner = 0) {
    const reason =
      this.available(kind, owner) || this.placement(kind, p, owner);
    if (reason) {
      if (owner === 0) this.alert(reason);
      return false;
    }
    this.players[owner].credits -= this.cost(kind, owner);
    this.spawn(kind, owner, p.x, p.y, true);
    this.rebuildGrid();
    if (owner === 0) {
      this.alert(`${SPECS[kind].name} construction started.`, "success", p);
      this.onSound?.("build");
    }
    return true;
  }
  train(kind: UnitKind, owner = 0) {
    const reason = this.available(kind, owner);
    if (reason) {
      if (owner === 0) this.alert(reason);
      return false;
    }
    const cost = this.cost(kind, owner);
    this.players[owner].credits -= cost;
    this.players[owner].queue.push({
      kind,
      progress: 0,
      duration: SPECS[kind].time,
      cost,
    });
    if (owner === 0) this.onSound?.("ui");
    return true;
  }
  cancelQueue(index: number) {
    const q = this.me.queue.splice(index, 1)[0];
    if (q) {
      this.me.credits += q.cost;
      this.alert(`${SPECS[q.kind].name} canceled. Crystals refunded.`);
    }
  }
  issue(ids: number[], order: Order, queue = false) {
    let i = 0;
    const valid = this.entities.filter(
      (e) => ids.includes(e.id) && e.owner === 0 && !e.building && e.hp > 0,
    );
    const cols = Math.ceil(Math.sqrt(valid.length));
    for (const e of valid) {
      const copy = { ...order };
      if (order.type !== "harvest" && !order.target) {
        copy.x = clamp(
          order.x + ((i % cols) - (cols - 1) / 2) * 28,
          20,
          W - 20,
        );
        copy.y = clamp(
          order.y + (Math.floor(i / cols) - (cols - 1) / 2) * 28,
          20,
          H - 20,
        );
      }
      if (queue) e.orders.push(copy);
      else {
        e.orders = [copy];
        e.path = [];
        e.pathAge = 0;
      }
      i++;
    }
    if (valid.length) this.onSound?.("order");
  }
  selectArmy() {
    this.selected = new Set(
      this.entities
        .filter(
          (e) =>
            e.owner === 0 &&
            !e.building &&
            SPECS[e.kind].damage > 0 &&
            e.hp > 0,
        )
        .map((e) => e.id),
    );
  }
  visibleAt(p: Point) {
    return !!this.visible[
      Math.floor(p.y / CELL) * COLS + Math.floor(p.x / CELL)
    ];
  }
  exploredAt(p: Point) {
    return !!this.explored[
      Math.floor(p.y / CELL) * COLS + Math.floor(p.x / CELL)
    ];
  }
  canSee(e: Entity) {
    if (this.allied(0, e.owner)) return true;
    if (!this.visibleAt(e)) return false;
    if (
      e.kind === "commando" &&
      this.players[e.owner].faction === "cult" &&
      this.time - e.lastShot > 2
    )
      return this.entities.some(
        (a) => this.allied(0, a.owner) && a.hp > 0 && dist(a, e) < 135,
      );
    return true;
  }
  refreshFog() {
    this.visible.fill(0);
    for (const e of this.entities)
      if (e.hp > 0 && this.allied(0, e.owner)) {
        const radius =
          e.kind === "hq"
            ? 400
            : e.building
              ? 250
              : e.kind === "commando"
                ? 350
                : 290;
        const minX = clamp(Math.floor((e.x - radius) / CELL), 0, COLS - 1),
          maxX = clamp(Math.ceil((e.x + radius) / CELL), 0, COLS - 1);
        const minY = clamp(Math.floor((e.y - radius) / CELL), 0, ROWS - 1),
          maxY = clamp(Math.ceil((e.y + radius) / CELL), 0, ROWS - 1);
        for (let y = minY; y <= maxY; y++)
          for (let x = minX; x <= maxX; x++)
            if (
              Math.hypot(x * CELL + CELL / 2 - e.x, y * CELL + CELL / 2 - e.y) <
              radius
            ) {
              this.visible[y * COLS + x] = 1;
              this.explored[y * COLS + x] = 1;
            }
      }
    for (const n of this.uplinks)
      if (n.owner >= 0 && this.allied(0, n.owner))
        for (let y = -4; y <= 4; y++)
          for (let x = -4; x <= 4; x++) {
            const cx = Math.floor(n.x / CELL) + x,
              cy = Math.floor(n.y / CELL) + y;
            if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
              this.visible[cy * COLS + cx] = 1;
              this.explored[cy * COLS + cx] = 1;
            }
          }
  }
  rebuildGrid() {
    this.blocked.fill(0);
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const p = { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 };
        if (
          p.y >= H - 20 ||
          p.x >= W - 20 ||
          this.ruins.some(
            (r) =>
              p.x > r.x - 12 &&
              p.x < r.x + r.w + 12 &&
              p.y > r.y - 12 &&
              p.y < r.y + r.h + 12,
          ) ||
          this.entities.some(
            (e) => e.building && e.hp > 0 && dist(e, p) < e.radius + 14,
          )
        )
          this.blocked[y * COLS + x] = 1;
      }
  }
  walkable(p: Point, r = 10) {
    return (
      p.x >= r &&
      p.y >= r &&
      p.x < W - r &&
      p.y < H - r &&
      !this.ruins.some(
        (o) =>
          p.x > o.x - r &&
          p.x < o.x + o.w + r &&
          p.y > o.y - r &&
          p.y < o.y + o.h + r,
      ) &&
      !this.entities.some(
        (e) => e.hp > 0 && e.building && dist(e, p) < e.radius + r,
      )
    );
  }
  route(from: Point, to: Point): Point[] {
    const sx = clamp(Math.floor(from.x / CELL), 0, COLS - 1),
      sy = clamp(Math.floor(from.y / CELL), 0, ROWS - 1);
    let gx = clamp(Math.floor(to.x / CELL), 0, COLS - 1),
      gy = clamp(Math.floor(to.y / CELL), 0, ROWS - 1);
    if (this.blocked[gy * COLS + gx]) {
      let best = Infinity;
      const originalX = gx,
        originalY = gy;
      for (
        let y = Math.max(0, originalY - 4);
        y <= Math.min(ROWS - 1, originalY + 4);
        y++
      )
        for (
          let x = Math.max(0, originalX - 4);
          x <= Math.min(COLS - 1, originalX + 4);
          x++
        )
          if (!this.blocked[y * COLS + x]) {
            const d =
              Math.hypot(x * CELL + 24 - to.x, y * CELL + 24 - to.y) +
              Math.hypot(x - sx, y - sy) * 0.5;
            if (d < best) {
              best = d;
              gx = x;
              gy = y;
            }
          }
    }
    const start = sy * COLS + sx,
      goal = gy * COLS + gx;
    const open = [start],
      g = new Float32Array(COLS * ROWS).fill(Infinity),
      prev = new Int32Array(COLS * ROWS).fill(-1),
      closed = new Uint8Array(COLS * ROWS);
    g[start] = 0;
    let rounds = 0;
    while (open.length && rounds++ < COLS * ROWS) {
      let best = 0,
        bf = Infinity;
      for (let i = 0; i < open.length; i++) {
        const id = open[i],
          f = g[id] + Math.hypot((id % COLS) - gx, Math.floor(id / COLS) - gy);
        if (f < bf) {
          bf = f;
          best = i;
        }
      }
      const cur = open.splice(best, 1)[0];
      if (cur === goal) {
        const path: Point[] = [];
        let at = goal;
        while (at !== start && at >= 0) {
          path.unshift({
            x: (at % COLS) * CELL + 24,
            y: Math.floor(at / COLS) * CELL + 24,
          });
          at = prev[at];
        }
        if (this.walkable(to, 20)) path.push({ ...to });
        return path;
      }
      closed[cur] = 1;
      const cx = cur % COLS,
        cy = Math.floor(cur / COLS);
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const x = cx + dx,
            y = cy + dy;
          if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
          const n = y * COLS + x;
          if (closed[n] || this.blocked[n]) continue;
          if (
            dx &&
            dy &&
            (this.blocked[cy * COLS + x] || this.blocked[y * COLS + cx])
          )
            continue;
          const ng = g[cur] + (dx && dy ? 1.414 : 1);
          if (ng < g[n]) {
            g[n] = ng;
            prev[n] = cur;
            if (!open.includes(n)) open.push(n);
          }
        }
    }
    return [];
  }
  move(e: Entity, to: Point, dt: number) {
    e.pathAge -= dt;
    if ((!e.path.length || e.pathAge <= 0) && dist(e, to) > 15) {
      e.path = this.route(e, to);
      e.pathAge = 2.5 + this.rng();
    }
    while (e.path.length && dist(e, e.path[0]) < 19) e.path.shift();
    const p = e.path[0];
    if (!p) {
      e.vx *= 0.8;
      e.vy *= 0.8;
      return;
    }
    const d = dist(e, p),
      speed = this.speed(e),
      blend = Math.min(1, dt * 10);
    e.vx += (((p.x - e.x) / d) * speed - e.vx) * blend;
    e.vy += (((p.y - e.y) / d) * speed - e.vy) * blend;
    // Local separation keeps squads readable and lets harvesters pass each other.
    let pushX = 0,
      pushY = 0;
    for (const o of this.entities)
      if (o !== e && !o.building && o.hp > 0) {
        const od = dist(e, o),
          min = (e.radius + o.radius) * 0.83;
        if (od < min && od > 0.01) {
          pushX += ((e.x - o.x) / od) * (min - od) * 3;
          pushY += ((e.y - o.y) / od) * (min - od) * 3;
        }
      }
    const nx = clamp(e.x + (e.vx + pushX) * dt, e.radius, W - e.radius),
      ny = clamp(e.y + (e.vy + pushY) * dt, e.radius, H - e.radius);
    if (this.walkable({ x: nx, y: ny }, e.radius * 0.8)) {
      e.x = nx;
      e.y = ny;
    } else if (this.walkable({ x: nx, y: e.y }, e.radius * 0.8)) e.x = nx;
    else if (this.walkable({ x: e.x, y: ny }, e.radius * 0.8)) e.y = ny;
    else e.pathAge = 0;
    e.angle = Math.atan2(e.vy, e.vx);
  }
  damage(target: Entity, amount: number, source: Entity) {
    if (target.hp <= 0) return;
    target.hp -= amount;
    target.flash = 0.12;
    if (
      target.owner === 0 &&
      target.building &&
      (this.events[0]?.at ?? -100) < this.time - 7
    )
      this.alert(`${SPECS[target.kind].name} under attack!`, "danger", target);
    if (target.hp <= 0) {
      source.kills++;
      if (source.owner === 0) {
        this.kills++;
        this.score += target.building ? 200 : 50;
      }
      this.burst(
        target,
        target.building ? 26 : 12,
        target.building ? "#efb370" : COLORS[target.owner],
      );
      if (this.canSee(target))
        this.onSound?.(
          target.building || target.kind === "tank" ? "explosion" : "hit",
        );
      this.selected.delete(target.id);
      if (target.building) {
        this.rebuildGrid();
        this.refreshPower();
      }
      if (target.kind === "hq") {
        this.players[target.owner].eliminated = true;
        this.players[target.owner].queue = [];
        for (const e of this.entities) if (e.owner === target.owner) e.hp = 0;
        for (const n of this.uplinks)
          if (n.owner === target.owner) n.owner = -1;
        this.alert(
          `${this.players[target.owner].name} command destroyed.`,
          target.owner === 0 ? "danger" : "success",
          target,
        );
        this.checkResult();
      }
    }
  }
  burst(p: Point, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2,
        s = 20 + this.rng() * 80,
        life = 0.3 + this.rng() * 0.7;
      this.particles.push({
        ...p,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        max: life,
        size: 2 + this.rng() * 5,
        color,
      });
    }
    if (this.particles.length > 300)
      this.particles.splice(0, this.particles.length - 300);
  }
  attack(e: Entity, target: Entity, dt: number) {
    const s = SPECS[e.kind];
    e.angle = Math.atan2(target.y - e.y, target.x - e.x);
    if (e.cooldown <= 0) {
      const powered =
        !e.building ||
        this.players[e.owner].power >= this.players[e.owner].used;
      e.cooldown = s.rate * (powered ? 1 : 2);
      e.lastShot = this.time;
      const amount =
        s.damage *
        (this.has("tech", e.owner) ? 1.2 : 1) *
        (1 + (this.rank(e) - 1) * 0.12);
      this.damage(target, amount, e);
      if (e.kind === "tank")
        for (const o of this.entities)
          if (
            o !== target &&
            o.hp > 0 &&
            !this.allied(e.owner, o.owner) &&
            dist(o, target) < 55
          )
            this.damage(o, amount * 0.35, e);
      if (this.canSee(e) || this.canSee(target)) {
        this.shots.push({
          x: e.x,
          y: e.y - 8,
          tx: target.x,
          ty: target.y - 8,
          life: e.kind === "tank" ? 0.19 : 0.09,
          max: 0.19,
          color: COLORS[e.owner],
          heavy: e.kind === "tank",
        });
        this.onSound?.(e.kind === "tank" ? "cannon" : "shot");
      }
    }
    e.vx *= Math.max(0, 1 - dt * 10);
    e.vy *= Math.max(0, 1 - dt * 10);
  }
  harvest(e: Entity, dt: number) {
    const hq = this.getHQ(e.owner);
    if (!hq) return;
    const order = e.orders[0];
    if (order?.type === "harvest" && e.harvestNode !== (order.target ?? -1)) {
      e.harvestNode = order.target ?? -1;
      e.path = [];
      e.pathAge = 0;
    }
    let node = this.resources.find(
      (n) => n.id === e.harvestNode && n.amount > 0,
    );
    // An explicit assignment completes after one delivery (including a depleted
    // field's partial load). With no queued order, automatic harvesting repeats.
    if (!node && order?.type === "harvest" && e.cargo === 0) {
      e.orders.shift();
      e.path = [];
      e.pathAge = 0;
      return;
    }
    if (!node && !order) {
      node = this.resources
        .filter((n) => n.amount > 0)
        .sort((a, b) => dist(e, a) - dist(e, b))[0];
      if (node) e.harvestNode = node.id;
    }
    if (e.cargo >= 140 || (!node && e.cargo > 0)) {
      if (dist(e, hq) < hq.radius + e.radius + 36) {
        this.players[e.owner].credits += Math.floor(e.cargo);
        if (e.owner === 0) {
          this.harvested += Math.floor(e.cargo);
          this.onSound?.("collect");
        }
        this.burst(e, 5, "#bafa47");
        e.cargo = 0;
        if (order?.type === "harvest") e.orders.shift();
        e.path = [];
        e.pathAge = 0;
      } else this.move(e, hq, dt);
    } else if (node) {
      if (dist(e, node) < 62) {
        const n = Math.min(32 * dt, node.amount, 140 - e.cargo);
        node.amount -= n;
        e.cargo += n;
        e.angle = Math.atan2(node.y - e.y, node.x - e.x);
        e.vx = 0;
        e.vy = 0;
      } else this.move(e, node, dt);
    }
  }
  tick(dt: number) {
    if (this.paused || this.result || !Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, 0.1);
    this.time += dt;
    this.fogTimer -= dt;
    if (this.fogTimer <= 0) {
      this.refreshFog();
      this.fogTimer = 0.24;
    }
    for (const p of this.players) {
      if (p.eliminated) continue;
      const q = p.queue[0];
      if (q && this.has(SPECS[q.kind].requires!, p.id)) {
        q.progress += dt * (p.power >= p.used ? 1 : 0.4);
        if (q.progress >= q.duration) {
          const b = this.entities.find(
            (e) =>
              e.owner === p.id &&
              e.kind === SPECS[q.kind].requires &&
              e.ready >= 1 &&
              e.hp > 0,
          )!;
          let loc = { x: b.x + 80, y: b.y + 75 };
          for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2,
              test = {
                x: b.x + Math.cos(angle) * 110,
                y: b.y + Math.sin(angle) * 110,
              };
            if (this.walkable(test, 25)) {
              loc = test;
              break;
            }
          }
          const e = this.spawn(q.kind, p.id, loc.x, loc.y);
          p.queue.shift();
          p.produced++;
          if (e.kind !== "harvester") {
            const rally = {
              x: clamp(loc.x + (p.produced % 4) * 29, 28, W - 28),
              y: clamp(
                loc.y + 50 + Math.floor((p.produced % 12) / 4) * 29,
                28,
                H - 28,
              ),
            };
            e.orders = [{ type: "move", ...rally }];
          }
          if (p.id === 0) {
            this.alert(`${SPECS[e.kind].name} ready.`, "success", e);
            this.onSound?.("ready");
          }
        }
      }
      if (p.id !== 0) {
        p.aiThink -= dt;
        p.aiAttack -= dt;
        if (p.aiThink <= 0) {
          this.ai(p);
          p.aiThink = 3 + this.rng() * 2;
        }
      }
    }
    for (const e of [...this.entities]) {
      if (e.hp <= 0) continue;
      e.cooldown -= dt;
      e.flash = Math.max(0, e.flash - dt);
      if (e.ready < 1) {
        const old = e.ready;
        e.ready = Math.min(1, e.ready + dt / SPECS[e.kind].time);
        e.hp = Math.min(e.maxHp, e.hp + (e.ready - old) * e.maxHp * 0.8);
        if (e.ready === 1) {
          this.refreshPower();
          if (e.owner === 0) {
            this.alert(`${SPECS[e.kind].name} online.`, "success", e);
            this.onSound?.("ready");
          }
        }
        continue;
      }
      const spec = SPECS[e.kind];
      let order = e.orders[0];
      if (order?.target && order.type === "attack") {
        const target = this.entities.find(
          (o) => o.id === order.target && o.hp > 0,
        );
        if (!target) {
          e.orders.shift();
          e.path = [];
          order = e.orders[0];
        } else {
          order.x = target.x;
          order.y = target.y;
        }
      }
      let target: Entity | undefined;
      if (spec.damage > 0) {
        if (order?.target && order.type === "attack")
          target = this.entities.find(
            (o) =>
              o.id === order.target &&
              o.hp > 0 &&
              dist(e, o) <= spec.range + o.radius,
          );
        if (!target && (order?.type !== "move" || e.building)) {
          let best = spec.range + 60;
          for (const o of this.entities)
            if (o.hp > 0 && !this.allied(e.owner, o.owner)) {
              if (
                o.kind === "commando" &&
                this.players[o.owner].faction === "cult" &&
                this.time - o.lastShot > 2 &&
                dist(e, o) > 135
              )
                continue;
              const d = dist(e, o) - o.radius;
              if (d <= spec.range && d < best) {
                target = o;
                best = d;
              }
            }
        }
      }
      if (target) {
        this.attack(e, target, dt);
        continue;
      }
      if (e.building) continue;
      if (e.kind === "engineer") {
        const repair = this.entities.find(
          (o) =>
            o.building &&
            this.allied(e.owner, o.owner) &&
            o.hp > 0 &&
            o.hp < o.maxHp &&
            o.ready >= 1 &&
            dist(e, o) < 115,
        );
        if (repair) {
          repair.hp = Math.min(repair.maxHp, repair.hp + 26 * dt);
          if (this.rng() < dt * 3)
            this.shots.push({
              x: e.x,
              y: e.y,
              tx: repair.x,
              ty: repair.y,
              life: 0.12,
              max: 0.12,
              color: "#bafa47",
              heavy: false,
            });
        }
      }
      if (e.kind === "harvester" && (!order || order.type === "harvest")) {
        this.harvest(e, dt);
        continue;
      }
      if (order) {
        const threshold = order.target ? 50 : 28;
        if (dist(e, order) < threshold) {
          e.orders.shift();
          e.path = [];
          e.vx = 0;
          e.vy = 0;
        } else this.move(e, order, dt);
      } else {
        e.vx *= 0.8;
        e.vy *= 0.8;
      }
    }
    for (const n of this.uplinks) {
      const near = this.entities.filter(
        (e) =>
          !e.building && e.hp > 0 && e.kind !== "harvester" && dist(e, n) < 105,
      );
      const teams = [...new Set(near.map((e) => this.players[e.owner].team))];
      if (teams.length === 1 && near.length) {
        const owner = near[0].owner;
        if (n.owner < 0 || !this.allied(owner, n.owner)) {
          if (n.capturing !== owner) {
            n.capturing = owner;
            n.progress = 0;
          }
          n.progress += dt * Math.min(2, near.length * 0.5);
          if (n.progress >= 12) {
            n.owner = owner;
            n.progress = 0;
            n.capturing = -1;
            this.alert(
              `Uplink ${String.fromCharCode(65 + n.id)} captured by ${this.players[owner].name}.`,
              this.allied(0, owner) ? "success" : "danger",
              n,
            );
            if (this.allied(0, owner)) {
              this.score += 100;
              this.onSound?.("capture");
            }
          }
        } else {
          n.progress = 0;
          n.capturing = -1;
        }
      } else if (teams.length === 0) n.progress = Math.max(0, n.progress - dt);
      if (n.owner >= 0) {
        const team = this.players[n.owner].team;
        for (const p of this.players) if (p.team === team) p.influence += dt;
      }
    }
    this.shots = this.shots.filter((s) => (s.life -= dt) > 0);
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 2;
      p.vy *= 1 - dt * 2;
      return p.life > 0;
    });
    this.entities = this.entities.filter((e) => e.hp > 0);
    this.checkResult();
  }
  ai(p: Player) {
    if (p.eliminated) return;
    const hq = this.getHQ(p.id);
    if (!hq) return;
    const diff = this.config.difficulty;
    // AI gets a disclosed escalating supply grant; harvesting remains its main income.
    p.credits +=
      diff === "brutal"
        ? 45 + this.time * 0.04
        : diff === "veteran"
          ? 25 + this.time * 0.02
          : 10;
    const owned = this.entities.filter((e) => e.owner === p.id && e.hp > 0);
    let build: BuildingKind | undefined;
    if (!owned.some((e) => e.kind === "power") || p.power - p.used < 8)
      build = "power";
    else if (!owned.some((e) => e.kind === "barracks")) build = "barracks";
    else if (this.time > 55 && !owned.some((e) => e.kind === "factory"))
      build = "factory";
    else if (this.time > 150 && !owned.some((e) => e.kind === "tech"))
      build = "tech";
    else if (
      this.time > 90 &&
      owned.filter((e) => e.kind === "turret").length <
        (diff === "recruit" ? 1 : 2)
    )
      build = "turret";
    if (build && !this.available(build, p.id)) {
      for (let i = 0; i < 24; i++) {
        const a = this.rng() * Math.PI * 2,
          r = 140 + this.rng() * 170,
          loc = { x: hq.x + Math.cos(a) * r, y: hq.y + Math.sin(a) * r };
        if (!this.placement(build, loc, p.id)) {
          this.build(build, loc, p.id);
          break;
        }
      }
    }
    if (
      p.queue.length < (diff === "brutal" ? 4 : 2) &&
      this.supply(p.id) <
        (diff === "recruit" ? 22 : diff === "veteran" ? 35 : 45)
    ) {
      const harvesters = owned.filter((e) => e.kind === "harvester").length;
      const kind: UnitKind =
        harvesters < 2 && this.has("factory", p.id)
          ? "harvester"
          : this.has("tech", p.id) && this.rng() < 0.3
            ? "commando"
            : this.has("factory", p.id) && this.rng() < 0.48
              ? "tank"
              : "recruit";
      this.train(kind, p.id);
    }
    const fighters = owned.filter(
      (e) => !e.building && SPECS[e.kind].damage > 0,
    );
    const intruder = this.entities.find(
      (e) => e.hp > 0 && !this.allied(e.owner, p.id) && dist(e, hq) < 400,
    );
    if (intruder) {
      for (const e of fighters)
        if (dist(e, hq) < 750) {
          e.orders = [{ type: "attack", x: intruder.x, y: intruder.y }];
          e.pathAge = 0;
        }
      return;
    }
    if (p.aiAttack <= 0 && fighters.length >= 4) {
      const targetNodes = this.uplinks.filter(
        (n) => n.owner < 0 || !this.allied(n.owner, p.id),
      );
      const node = targetNodes.sort((a, b) => dist(hq, a) - dist(hq, b))[0];
      const foes = this.entities
        .filter(
          (e) => e.kind === "hq" && e.hp > 0 && !this.allied(e.owner, p.id),
        )
        .sort((a, b) => dist(hq, a) - dist(hq, b));
      const goal: Point | undefined =
        (this.time > 220 && this.rng() < 0.5) || !node ? foes[0] : node;
      if (goal) {
        for (let i = 0; i < fighters.length; i++) {
          const e = fighters[i];
          e.orders = [
            {
              type: "attack",
              x: goal.x + ((i % 4) - 1.5) * 26,
              y: goal.y + (Math.floor(i / 4) - 1) * 26,
            },
          ];
          e.path = [];
          e.pathAge = 0;
        }
      }
      p.aiAttack =
        (diff === "recruit" ? 48 : diff === "veteran" ? 32 : 24) +
        this.rng() * 12;
    }
  }
  checkResult() {
    if (this.result) return;
    if (this.me.eliminated) {
      this.end(false, "Your Command HQ was destroyed.");
      return;
    }
    const enemies = this.players.filter((p) => !this.allied(0, p.id));
    if (enemies.every((p) => p.eliminated)) {
      this.end(true, "All enemy command centers destroyed.");
      return;
    }
    const winner = this.players.find(
      (p) => !p.eliminated && p.influence >= CAPTURE_GOAL,
    );
    if (winner) {
      this.end(
        this.allied(0, winner.id),
        `${this.allied(0, winner.id) ? "Your alliance" : "The enemy"} secured 540 uplink signal.`,
      );
      return;
    }
    if (this.time >= LIMIT) {
      const points = (p: Player) =>
        p.influence +
        this.entities
          .filter((e) => this.allied(e.owner, p.id) && e.hp > 0)
          .reduce((sum, e) => sum + e.hp * 0.01, 0);
      const win = this.players
        .filter((p) => !p.eliminated)
        .sort((a, b) => points(b) - points(a))[0];
      this.end(
        this.allied(0, win.id),
        "Twelve-minute limit. Signal and surviving strength decide the sector.",
      );
    }
  }
  end(win: boolean, reason: string) {
    if (this.result) return;
    this.result = win ? "victory" : "defeat";
    this.resultReason = reason;
    this.score = Math.max(
      0,
      Math.floor(
        this.score +
          this.harvested * 0.05 +
          this.me.influence * 2 +
          (win ? 1000 : 0),
      ),
    );
    this.onSound?.(win ? "victory" : "defeat");
  }
}
