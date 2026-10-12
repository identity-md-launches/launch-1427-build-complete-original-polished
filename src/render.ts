import {
  Game,
  W,
  H,
  CELL,
  COLS,
  ROWS,
  SPECS,
  COLORS,
  clamp,
  randomSeed,
  dist,
} from "./game.ts";
import type { Entity, Kind, Point, BuildingKind } from "./game.ts";
type C = CanvasRenderingContext2D;
const poly = (c: C, pts: number[], fill: string, stroke?: string) => {
  c.beginPath();
  for (let i = 0; i < pts.length; i += 2)
    i ? c.lineTo(pts[i], pts[i + 1]) : c.moveTo(pts[i], pts[i + 1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.stroke();
  }
};
const line = (
  c: C,
  x: number,
  y: number,
  tx: number,
  ty: number,
  color: string,
  w = 1,
) => {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(tx, ty);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.stroke();
};
const ellipse = (
  c: C,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
};
function glow(
  c: C,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 0.15,
) {
  c.save();
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}
function box(
  c: C,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  color = "#47544b",
  light = "#56675a",
) {
  c.lineWidth = 1;
  poly(c, [x, y, x + w, y, x + w, y - h, x, y - h], color, "#101b18");
  poly(
    c,
    [
      x + w,
      y,
      x + w + d * 0.42,
      y - d * 0.55,
      x + w + d * 0.42,
      y - d * 0.55 - h,
      x + w,
      y - h,
    ],
    "#263b36",
    "#101b18",
  );
  poly(
    c,
    [
      x,
      y - h,
      x + d * 0.42,
      y - d * 0.55 - h,
      x + w + d * 0.42,
      y - d * 0.55 - h,
      x + w,
      y - h,
    ],
    light,
    "#78877650",
  );
}
export function drawPepe(
  c: C,
  x: number,
  y: number,
  size: number,
  color: string,
  job: Kind = "recruit",
  angle = 0,
  time = 0,
  moving = false,
) {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  const step = moving ? Math.sin(time * 15) * 2 : 0;
  ellipse(c, 2, 6, 13, 6, "#020b0990");
  c.fillStyle = "#1c2d29";
  c.fillRect(-8, 0 + step, 6, 9);
  c.fillRect(3, 0 - step, 6, 9);
  poly(
    c,
    [-11, -7, -7, -18, 8, -18, 12, -7, 8, 3, -8, 3],
    job === "commando" ? "#263b35" : "#435746",
    "#121e1b",
  );
  c.fillStyle = color;
  c.fillRect(-9, -8, 3, 6);
  c.fillRect(8, -8, 3, 6);
  // Broad frog muzzle, protruding eyes, helmet: readable at tactical scale.
  ellipse(c, 0, -19, 11, 8, "#729749");
  ellipse(c, -5, -24, 5, 5, "#9cbc62");
  ellipse(c, 5, -24, 5, 5, "#9cbc62");
  ellipse(c, -5, -24, 3.3, 2.4, "#d4dab7");
  ellipse(c, 5, -24, 3.3, 2.4, "#d4dab7");
  c.fillStyle = "#151c13";
  c.fillRect(-5, -25, 2, 3);
  c.fillRect(4, -25, 2, 3);
  line(c, -8, -24, -2, -23, "#56753b", 2);
  line(c, 2, -23, 9, -24, "#56753b", 2);
  poly(
    c,
    [-11, -27, -7, -32, 6, -33, 11, -28, 12, -25, -12, -25],
    job === "engineer" ? "#b6924b" : "#344638",
    "#16221d",
  );
  c.fillStyle = color;
  c.fillRect(-2, -31, 4, 2);
  ellipse(c, 0, -15, 8.5, 2.8, "#526b35");
  line(c, -7, -15, 7, -15, "#263820", 1.4);
  c.fillStyle = "#26362d";
  c.fillRect(-6, -6, 12, 3);
  c.fillStyle = "#7a8967";
  c.fillRect(-2, -6, 4, 3);
  c.save();
  c.translate(7, -4);
  c.rotate(angle * 0.35);
  if (job === "engineer") {
    line(c, 0, 0, 12, -10, "#adbdb0", 3);
    line(c, 10, -8, 14, -13, color, 3);
  } else {
    poly(c, [0, 0, 4, -3, 17, -3, 17, 1, 6, 1, 4, 4], "#202b2b", "#65746d");
    line(c, 15, -1, 23, -1, "#a1b1a2", 2);
  }
  c.restore();
  c.restore();
}
export function drawUnit(c: C, e: Entity, time: number, selected = false) {
  const color = COLORS[e.owner];
  c.save();
  c.translate(e.x, e.y);
  if (selected) {
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(0, 3, e.radius + 7, (e.radius + 7) * 0.55, 0, 0, Math.PI * 2);
    c.stroke();
  }
  if (e.kind === "tank" || e.kind === "harvester") {
    c.save();
    c.rotate(e.angle * 0.22);
    ellipse(c, 4, 9, 31, 16, "#030c0aa0");
    c.fillStyle = "#111e1b";
    c.fillRect(-25, -17, 12, 40);
    c.fillRect(14, -17, 12, 40);
    for (let y = -15; y < 23; y += 6) {
      line(c, -25, y, -15, y, "#4c5851", 2);
      line(c, 16, y, 26, y, "#4c5851", 2);
    }
    poly(
      c,
      [-18, -18, 15, -18, 23, -6, 20, 20, -17, 20, -23, -6],
      "#3d5647",
      "#78896a",
    );
    poly(c, [-18, -18, 15, -18, 16, 5, -17, 5], "#5e7255");
    line(c, -20, -8, -20, 9, color, 3);
    line(c, 20, -8, 20, 9, color, 3);
    if (e.kind === "tank") {
      ellipse(c, 0, 0, 13, 10, "#1c3027");
      box(c, -12, 3, 20, 13, 8, "#465e45", "#70805c");
      c.save();
      c.translate(0, -10);
      c.rotate(e.angle);
      line(c, 0, 0, 37, 0, "#192e29", 9);
      line(c, 0, -2, 36, -2, "#6e806d", 4);
      line(c, 32, -4, 38, -4, color, 2);
      c.restore();
      drawPepe(c, -2, -12, 0.52, color, "recruit");
    } else {
      box(c, -15, 17, 29, 21, 7, "#506543", "#798455");
      c.strokeStyle = "#96a580";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(8, -5);
      c.lineTo(25, -22);
      c.lineTo(35, -5);
      c.stroke();
      c.fillStyle = "#a8c746";
      c.fillRect(30, -6, 12, 5);
      drawPepe(c, -5, -12, 0.55, color, "engineer");
      if (e.cargo > 10) {
        for (let i = 0; i < Math.ceil(e.cargo / 30); i++)
          crystal(c, -8 + (i % 3) * 8, 11 + Math.floor(i / 3) * 5, 8, 0);
      }
    }
    c.restore();
  } else
    drawPepe(
      c,
      0,
      0,
      0.87,
      color,
      e.kind,
      e.angle,
      time,
      Math.abs(e.vx) + Math.abs(e.vy) > 4,
    );
  if (e.flash > 0) {
    c.globalAlpha = 0.45;
    c.globalCompositeOperation = "screen";
    ellipse(c, 0, -10, e.radius, e.radius, "#fff9c0");
    c.globalCompositeOperation = "source-over";
    c.globalAlpha = 1;
  }
  // Job glyphs and rank pips stay visible, including unselected troops.
  c.fillStyle = "#071310";
  c.fillRect(-11, 13, 22, 10);
  c.fillStyle = color;
  c.font = "bold 8px monospace";
  c.textAlign = "center";
  c.fillText(
    e.kind === "tank"
      ? "T"
      : e.kind === "harvester"
        ? "H"
        : e.kind === "engineer"
          ? "E"
          : e.kind === "commando"
            ? "C"
            : "R",
    -6,
    21,
  );
  const rank = e.kills >= 6 ? 3 : e.kills >= 2 ? 2 : 1;
  for (let i = 0; i < rank; i++) c.fillRect(1 + i * 3, 16, 2, 4);
  if (selected || e.hp < e.maxHp) {
    c.fillStyle = "#06100d";
    c.fillRect(-17, -44, 34, 4);
    c.fillStyle = e.hp / e.maxHp < 0.3 ? "#ffa579" : color;
    c.fillRect(-17, -44, (34 * e.hp) / e.maxHp, 3);
  }
  c.restore();
}
function crystal(c: C, x: number, y: number, h: number, t: number) {
  const bob = Math.sin(t * 2 + x) * 1.2;
  poly(
    c,
    [
      x - 5,
      y,
      x - 6,
      y - h * 0.65 + bob,
      x,
      y - h + bob,
      x + 5,
      y - h * 0.5 + bob,
      x + 3,
      y + 2,
    ],
    "#496a31",
    "#a2d46b",
  );
  poly(
    c,
    [x, y - h + bob, x + 5, y - h * 0.5 + bob, x + 3, y + 2, x, y - 2],
    "#80bc4c",
  );
  line(c, x, y - h + bob, x, y - 2, "#dbfa92", 1);
}
export function drawBuilding(c: C, e: Entity, time: number, selected = false) {
  c.save();
  c.translate(e.x, e.y);
  const color = COLORS[e.owner],
    r = e.radius;
  ellipse(c, 13, 9, r + 15, r * 0.65 + 10, "#040b0990");
  if (selected) {
    c.strokeStyle = color;
    c.lineWidth = 1.5;
    c.strokeRect(-r - 8, -r * 0.55 - 8, r * 2 + 16, r * 1.1 + 16);
  }
  c.globalAlpha = e.ready < 1 ? 0.45 + e.ready * 0.4 : 1;
  // Foundation, concrete edges, hazard stripes and faction neon.
  box(c, -r, r * 0.45, r * 1.6, r * 0.9, 5, "#353e36", "#657062");
  for (let i = -r + 7; i < r * 0.4; i += 14)
    line(c, i, r * 0.45, i + 7, r * 0.45 - 5, "#b8ac65", 3);
  if (e.kind === "hq") {
    box(c, -46, 14, 69, 49, 35, "#3b5149", "#627064");
    box(c, -30, -17, 44, 27, 25, "#3c4841", "#7d8673");
    c.fillStyle = "#182f2b";
    c.fillRect(-36, -18, 50, 13);
    c.fillStyle = color;
    c.fillRect(-33, -17, 44, 3);
    for (let x = -30; x < 14; x += 10) {
      c.fillStyle = "#9ccec580";
      c.fillRect(x, -12, 6, 3);
    }
    c.fillStyle = "#1b2926";
    c.fillRect(-18, 0, 25, 14);
    line(c, -18, 0, 7, 0, color, 2);
    box(c, 18, 13, 15, 25, 21, "#314b43", "#526552");
    line(c, -10, -42, -10, -79, "#829285", 3);
    c.save();
    c.translate(-10, -70);
    c.rotate(Math.sin(time * 0.4) * 0.3);
    poly(c, [-17, -7, 17, -7, 12, 6, -10, 6], "#627b64", "#a8b19b");
    line(c, -14, -4, 14, -4, color);
    line(c, 0, -9, 0, 9, "#1e3830", 2);
    c.restore();
    glow(c, 0, 0, 90, color, 0.1);
  } else if (e.kind === "power") {
    for (const x of [-22, 9]) {
      box(c, x, 4, 20, 23, 35, "#3c5849", "#678068");
      ellipse(c, x + 12, -43, 12, 6, "#658565");
      for (let y = -32; y < 0; y += 9)
        line(c, x + 3, y, x + 19, y, "#263f31", 2);
      line(c, x + 8, -34, x + 8, -3, color, 3);
    }
    line(c, -18, -50, -18, -64, "#9fab83", 2);
    line(c, 15, -50, 15, -66, "#9fab83", 2);
    if (Math.sin(time * 4) > 0.8) line(c, -18, -64, 15, -66, color, 1);
  } else if (e.kind === "barracks") {
    box(c, -33, 15, 52, 40, 27, "#475346", "#78816a");
    poly(c, [-32, -12, -13, -44, 38, -44, 20, -12], "#62705b", "#8c967c");
    for (let i = 0; i < 4; i++)
      line(c, -22 + i * 10, -14, -5 + i * 10, -42, "#313e32", 2);
    c.fillStyle = "#152d25";
    c.fillRect(-23, -9, 14, 24);
    c.fillStyle = color;
    c.fillRect(-23, -9, 14, 3);
    line(c, 34, -4, 34, -49, "#92a48b", 2);
    poly(c, [34, -49, 57, -46, 51, -31, 34, -34], color);
    c.fillStyle = "#1f3c32";
    c.fillRect(39, -43, 6, 5);
  } else if (e.kind === "factory") {
    box(c, -42, 18, 69, 43, 36, "#485249", "#6b756a");
    box(c, -40, -18, 28, 26, 18, "#48584a", "#7e886c");
    c.fillStyle = "#10241d";
    c.fillRect(-18, -13, 38, 31);
    for (let y = -10; y < 15; y += 6) line(c, -16, y, 18, y, "#456757", 2);
    line(c, -19, -14, 20, -14, color, 4);
    line(c, -21, -11, -21, 16, color, 2);
    box(c, 29, 10, 12, 15, 64, "#384a40", "#8d9679");
    c.fillStyle = "#a3a285";
    c.fillRect(28, -58, 15, 5);
    if (time > 0) {
      c.globalAlpha *= 0.13;
      for (let i = 0; i < 4; i++)
        ellipse(
          c,
          36 + Math.sin(i + time) * 6,
          -68 - i * 16 - ((time * 8) % 16),
          12 + i * 4,
          8 + i * 3,
          "#c0caba",
        );
      c.globalAlpha = e.ready < 1 ? 0.5 + e.ready * 0.4 : 1;
    }
  } else if (e.kind === "tech") {
    box(c, -30, 14, 46, 34, 25, "#344e49", "#597971");
    ellipse(c, 1, -29, 26, 17, "#1b3b37");
    ellipse(c, -2, -33, 23, 14, "#7cb3a0");
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(-2, -33, 23, 14, 0, Math.PI, Math.PI * 2);
    c.stroke();
    line(c, -2, -46, -2, -66, "#a4c0ab", 2);
    ellipse(c, -2, -67, 3, 3, color);
    line(c, -27, -6, 13, -6, color, 3);
  } else if (e.kind === "turret") {
    box(c, -19, 10, 28, 26, 13, "#32493b", "#7a866a");
    box(c, -10, -1, 13, 11, 24, "#455e48", "#84966a");
    c.save();
    c.translate(0, -28);
    c.rotate(e.angle);
    line(c, -5, 0, 27, 0, "#172d24", 8);
    line(c, -5, -1, 26, -1, "#8b9e83", 3);
    c.restore();
    drawPepe(c, -1, -23, 0.54, color, "recruit");
  }
  c.globalAlpha = 1;
  if (e.ready < 1) {
    c.setLineDash([5, 4]);
    c.strokeStyle = color;
    c.lineWidth = 1;
    c.strokeRect(-r, -r * 0.7 - 30, r * 2, r * 1.4 + 30);
    c.setLineDash([]);
    c.font = "bold 12px monospace";
    c.fillStyle = color;
    c.textAlign = "center";
    c.fillText(`${Math.floor(e.ready * 100)}%`, 0, -r * 0.7 - 37);
  }
  if (selected || e.hp < e.maxHp || e.ready < 1) {
    c.fillStyle = "#07120e";
    c.fillRect(-r, -r - 42, r * 2, 5);
    c.fillStyle = e.hp / e.maxHp < 0.3 ? "#ffa579" : color;
    c.fillRect(-r, -r - 42, (r * 2 * e.hp) / e.maxHp, 4);
  }
  if (e.flash > 0) {
    c.globalAlpha = 0.3;
    ellipse(c, 0, -15, r, r * 0.8, "#fff2b9");
  }
  c.restore();
}
export function iconFor(kind: Kind): string {
  const c = document.createElement("canvas");
  c.width = 144;
  c.height = 108;
  const ctx = c.getContext("2d")!;
  ctx.translate(72, 76);
  ctx.scale(kind === "hq" ? 0.8 : 1, kind === "hq" ? 0.8 : 1);
  const e = {
    kind,
    x: 0,
    y: 0,
    owner: 0,
    radius: SPECS[kind].radius,
    hp: 100,
    maxHp: 100,
    ready: 1,
    angle: -0.8,
    flash: 0,
    kills: 0,
    vx: 0,
    vy: 0,
    cargo: kind === "harvester" ? 100 : 0,
  } as Entity;
  if (SPECS[kind].speed > 0) {
    ctx.scale(1.6, 1.6);
    drawUnit(ctx, e, 0);
  } else drawBuilding(ctx, e, 0);
  return c.toDataURL();
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: C;
  mini: HTMLCanvasElement;
  mc: C;
  game: Game;
  terrain: HTMLCanvasElement;
  fog: HTMLCanvasElement;
  fc: C;
  camera = { x: 450, y: 430, zoom: 1 };
  width = 0;
  height = 0;
  dpr = 1;
  pointer: Point = { x: -100, y: -100 };
  drag: { from: Point; to: Point } | null = null;
  placement: BuildingKind | null = null;
  marker: { point: Point; at: number; attack: boolean } | null = null;
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  resizeObserver: ResizeObserver;
  fogFrame = 0;
  constructor(canvas: HTMLCanvasElement, mini: HTMLCanvasElement, game: Game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.mini = mini;
    this.mc = mini.getContext("2d")!;
    this.game = game;
    this.terrain = document.createElement("canvas");
    this.terrain.width = W;
    this.terrain.height = H;
    this.makeTerrain();
    this.fog = document.createElement("canvas");
    this.fog.width = COLS;
    this.fog.height = ROWS;
    this.fc = this.fog.getContext("2d")!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    this.camera.zoom = this.width < 600 ? 0.76 : 1;
    this.camera.x = 450;
    this.camera.y = 420;
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.width = r.width;
    this.height = r.height;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.mini.width = 240;
    this.mini.height = 180;
  }
  destroy() {
    this.resizeObserver.disconnect();
  }
  screen(p: Point): Point {
    return {
      x: (p.x - this.camera.x) * this.camera.zoom + this.width / 2,
      y: (p.y - this.camera.y) * this.camera.zoom * 0.83 + this.height / 2,
    };
  }
  world(p: Point): Point {
    return {
      x: (p.x - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (p.y - this.height / 2) / (this.camera.zoom * 0.83) + this.camera.y,
    };
  }
  center(p: Point) {
    this.camera.x = clamp(p.x, 0, W);
    this.camera.y = clamp(p.y, 0, H);
  }
  pan(x: number, y: number, dt: number) {
    this.camera.x = clamp(this.camera.x + (x * dt) / this.camera.zoom, 0, W);
    this.camera.y = clamp(this.camera.y + (y * dt) / this.camera.zoom, 0, H);
  }
  zoom(n: number, at?: Point) {
    const before = at ? this.world(at) : null;
    this.camera.zoom = clamp(n, 0.48, 1.8);
    if (at && before) {
      const after = this.world(at);
      this.camera.x += before.x - after.x;
      this.camera.y += before.y - after.y;
    }
    this.center(this.camera);
  }
  makeTerrain() {
    const c = this.terrain.getContext("2d")!,
      rng = randomSeed(this.game.config.seed + 97);
    c.fillStyle = "#172622";
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 48)
      for (let x = 0; x < W; x += 48) {
        c.fillStyle = `rgba(${rng() > 0.5 ? "60,81,63" : "6,20,17"},${rng() * 0.2})`;
        c.fillRect(x + 1, y + 1, 46, 46);
      }
    for (let i = 0; i < 18000; i++) {
      const x = rng() * W,
        y = rng() * H;
      c.fillStyle = rng() > 0.5 ? "#43504330" : "#07181240";
      c.fillRect(x, y, 1 + rng() * 3, 1 + rng() * 2);
    }
    // Wet, cracked arterial roads connect the four bases and uplinks.
    const road = (points: number[], width: number) => {
      c.lineCap = "square";
      c.lineJoin = "round";
      c.beginPath();
      for (let i = 0; i < points.length; i += 2)
        i
          ? c.lineTo(points[i], points[i + 1])
          : c.moveTo(points[i], points[i + 1]);
      c.strokeStyle = "#0b1916";
      c.lineWidth = width + 8;
      c.stroke();
      c.strokeStyle = "#25302b";
      c.lineWidth = width;
      c.stroke();
      c.strokeStyle = "#4c534134";
      c.lineWidth = width - 15;
      c.stroke();
      c.setLineDash([18, 25]);
      c.lineWidth = 2;
      c.strokeStyle = "#a9aa7040";
      c.stroke();
      c.setLineDash([]);
    };
    road([360, 0, 360, 370, 1050, 370, 1200, 520, 1200, 1800], 104);
    road([2040, 0, 2040, 1430, 1360, 1430, 1200, 1280], 104);
    road([0, 900, 2400, 900], 125);
    road([360, 900, 360, 1800], 85);
    road([1200, 370, 2040, 370], 85);
    for (const p of [
      { x: 360, y: 390 },
      { x: 2040, y: 1410 },
      { x: 2040, y: 390 },
      { x: 360, y: 1410 },
    ]) {
      c.fillStyle = "#35443a";
      c.fillRect(p.x - 88, p.y - 70, 184, 140);
      c.strokeStyle = "#6d7b6240";
      c.lineWidth = 2;
      c.strokeRect(p.x - 92, p.y - 74, 192, 148);
      c.setLineDash([13, 10]);
      c.strokeStyle = "#a5af633d";
      c.strokeRect(p.x - 106, p.y - 88, 220, 176);
      c.setLineDash([]);
      for (let x = p.x - 85; x < p.x + 90; x += 32)
        line(c, x, p.y - 68, x, p.y + 66, "#101c1540");
    }
    // Pools, gravel, and worn concrete fragments are seeded once, not every frame.
    for (let i = 0; i < 100; i++) {
      const x = rng() * W,
        y = rng() * H,
        r = 12 + rng() * 47;
      ellipse(c, x, y, r, r * 0.32, "#071b1a80");
      line(c, x - r * 0.7, y, x + r * 0.6, y, "#46726b28");
    }
    for (let i = 0; i < 420; i++) {
      const x = rng() * W,
        y = rng() * H;
      c.strokeStyle = "#06151050";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 5, y + 8);
      c.lineTo(x + 20, y + 13);
      c.lineTo(x + 25, y + 27);
      c.stroke();
    }
    for (let i = 0; i < 65; i++) {
      const x = rng() * W,
        y = rng() * H;
      if (
        this.game.resources.some((p) => dist(p, { x, y }) < 90) ||
        this.game.entities.some((p) => dist(p, { x, y }) < 180)
      )
        continue;
      const w = 4 + rng() * 10;
      poly(
        c,
        [x, y, x + w, y - 4, x + w + 5, y + 2, x + 2, y + 6],
        "#435346",
        "#172d22",
      );
    }
    c.font = "600 19px monospace";
    c.fillStyle = "#a6b09c28";
    c.fillText("SECTOR 07", 102, 97);
    c.fillText("NIGHTFALL // RESTRICTED", 890, 1760);
    // Perimeter fence with cyan warning beacons.
    c.strokeStyle = "#465b46";
    c.lineWidth = 2;
    c.strokeRect(24, 24, W - 48, H - 48);
    for (let x = 24; x < W; x += 100) {
      line(c, x, 24, x, 9, "#5e745f", 2);
      line(c, x, H - 24, x, H - 40, "#5e745f", 2);
    }
    for (const r of this.game.ruins) {
      box(c, r.x, r.y + r.h, r.w * 0.8, r.h * 0.5, 20, "#293c32", "#52614b");
      box(
        c,
        r.x + 10,
        r.y + r.h - 7,
        r.w * 0.45,
        r.h * 0.45,
        45,
        "#344038",
        "#65705a",
      );
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 4; x++) {
          c.fillStyle = "#122921";
          c.fillRect(r.x + 15 + x * 14, r.y + r.h - 44 + y * 10, 8, 5);
        }
      line(
        c,
        r.x + 5,
        r.y + r.h - 20,
        r.x + r.w * 0.7,
        r.y + r.h - 20,
        r.style === 2 ? "#aa65535c" : "#5fb3a45c",
        2,
      );
      for (let i = 0; i < 10; i++) {
        const x = r.x + rng() * r.w,
          y = r.y + r.h + rng() * 28;
        poly(c, [x, y, x + 8, y - 4, x + 13, y + 2, x + 3, y + 6], "#4c5746");
      }
    }
  }
  render(time: number) {
    const c = this.ctx,
      g = this.game,
      z = this.camera.zoom,
      anim = this.reduced ? 0 : time;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = "#07110f";
    c.fillRect(0, 0, this.width, this.height);
    c.save();
    c.translate(this.width / 2, this.height / 2);
    c.scale(z, z * 0.83);
    c.translate(-this.camera.x, -this.camera.y);
    c.drawImage(this.terrain, 0, 0);
    if (!this.reduced) {
      for (const [x, y, angle] of [
        [130, 110, 0.65],
        [2270, 1680, 3.9],
      ]) {
        c.save();
        c.translate(x, y);
        c.rotate(angle + Math.sin(anim * 0.18 + x) * 0.22);
        const beam = c.createLinearGradient(0, 0, 570, 0);
        beam.addColorStop(0, "#bfe6d520");
        beam.addColorStop(1, "#bfe6d500");
        c.fillStyle = beam;
        c.beginPath();
        c.moveTo(0, -3);
        c.lineTo(570, -125);
        c.lineTo(570, 125);
        c.lineTo(0, 3);
        c.closePath();
        c.fill();
        c.restore();
      }
    }
    const visible = (p: Point, extra = 100) => {
      const s = this.screen(p);
      return (
        s.x > -extra &&
        s.y > -extra &&
        s.x < this.width + extra &&
        s.y < this.height + extra
      );
    };
    for (const node of g.resources)
      if (visible(node) && node.amount > 0) {
        const rng = randomSeed(node.id + 21);
        glow(
          c,
          node.x,
          node.y,
          100,
          "#b8f477",
          0.11 + (this.reduced ? 0 : Math.sin(anim * 1.7) * 0.025),
        );
        for (let i = 0; i < 17; i++) {
          const a = rng() * Math.PI * 2,
            r = rng() * 43;
          crystal(
            c,
            node.x + Math.cos(a) * r,
            node.y + Math.sin(a) * r,
            10 + rng() * 20,
            anim,
          );
        }
        if (g.visibleAt(node)) {
          c.font = "10px monospace";
          c.textAlign = "center";
          c.fillStyle = "#b7d79e";
          c.fillText("CRYSTAL FIELD", node.x, node.y + 48);
        }
      }
    for (const n of g.uplinks)
      if (visible(n)) {
        const color = n.owner >= 0 ? COLORS[n.owner] : "#a7b8a3";
        c.setLineDash([8, 8]);
        c.strokeStyle = color + "55";
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(n.x, n.y, 102, 80, 0, 0, Math.PI * 2);
        c.stroke();
        c.setLineDash([]);
        box(c, n.x - 18, n.y + 8, 28, 22, 10, "#3b5547", "#6f8771");
        line(c, n.x, n.y - 5, n.x, n.y - 67, "#93ac92", 4);
        line(c, n.x - 18, n.y - 47, n.x + 18, n.y - 47, color, 3);
        ellipse(c, n.x, n.y - 68, 5, 5, color);
        glow(c, n.x, n.y - 60, 42, color, 0.17);
        if (n.progress > 0) {
          c.strokeStyle = color;
          c.lineWidth = 4;
          c.beginPath();
          c.arc(
            n.x,
            n.y - 4,
            34,
            -Math.PI / 2,
            -Math.PI / 2 + (n.progress / 12) * Math.PI * 2,
          );
          c.stroke();
        }
      }
    const sorted = g.entities
      .filter(
        (e) =>
          e.hp > 0 &&
          visible(e) &&
          (g.canSee(e) || (e.building && g.exploredAt(e))),
      )
      .sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      if (e.building) drawBuilding(c, e, anim, g.selected.has(e.id));
      else drawUnit(c, e, anim, g.selected.has(e.id));
    }
    if (++this.fogFrame % 4 === 1) {
      const image = this.fc.createImageData(COLS, ROWS);
      for (let i = 0; i < g.visible.length; i++) {
        image.data[i * 4] = 5;
        image.data[i * 4 + 1] = 15;
        image.data[i * 4 + 2] = 13;
        image.data[i * 4 + 3] = g.visible[i] ? 0 : g.explored[i] ? 160 : 240;
      }
      this.fc.putImageData(image, 0, 0);
    }
    c.imageSmoothingEnabled = true;
    c.drawImage(this.fog, -CELL / 2, -CELL / 2, W + CELL, H + CELL);
    // Uplink markers remain on the tactical map; enemy units never render through fog.
    for (const n of g.uplinks)
      if (visible(n)) {
        const color = n.owner >= 0 ? COLORS[n.owner] : "#a7b8a3";
        c.fillStyle = "#07130ee8";
        c.fillRect(n.x - 31, n.y + 28, 62, 20);
        c.strokeStyle = color + "88";
        c.lineWidth = 1;
        c.strokeRect(n.x - 31, n.y + 28, 62, 20);
        c.fillStyle = color;
        c.font = "bold 11px monospace";
        c.textAlign = "center";
        c.fillText(`UPLINK ${String.fromCharCode(65 + n.id)}`, n.x, n.y + 42);
      }
    for (const s of g.shots) {
      c.globalAlpha = clamp(s.life / s.max, 0, 1);
      line(c, s.x, s.y, s.tx, s.ty, s.color, s.heavy ? 3 : 1.4);
      ellipse(c, s.tx, s.ty, s.heavy ? 7 : 3, s.heavy ? 7 : 3, "#ffdf98");
    }
    c.globalAlpha = 1;
    for (const p of g.particles) {
      if (this.reduced) continue;
      c.globalAlpha = p.life / p.max;
      c.fillStyle = p.color;
      c.fillRect(p.x, p.y, p.size, p.size);
    }
    c.globalAlpha = 1;
    for (const e of g.selection)
      if (!e.building && e.orders.length) {
        c.setLineDash([4, 7]);
        let from: Point = e;
        c.strokeStyle = COLORS[0] + "55";
        c.lineWidth = 1;
        for (const order of e.orders) {
          c.beginPath();
          c.moveTo(from.x, from.y);
          c.lineTo(order.x, order.y);
          c.stroke();
          from = order;
        }
        c.setLineDash([]);
      }
    if (this.placement) {
      const p = this.world(this.pointer),
        kind = this.placement,
        ok = !g.placement(kind, p),
        color = ok ? "#bafa47" : "#ff9d80";
      c.globalAlpha = 0.5;
      drawBuilding(
        c,
        {
          kind,
          ...p,
          owner: 0,
          radius: SPECS[kind].radius,
          ready: 1,
          hp: 100,
          maxHp: 100,
          angle: 0,
          flash: 0,
        } as Entity,
        0,
      );
      c.globalAlpha = 1;
      c.strokeStyle = color;
      c.lineWidth = 2;
      c.strokeRect(
        p.x - SPECS[kind].radius,
        p.y - SPECS[kind].radius,
        SPECS[kind].radius * 2,
        SPECS[kind].radius * 2,
      );
      for (const e of g.entities)
        if (e.owner === 0 && e.building && e.ready >= 1) {
          c.strokeStyle = "#bafa4725";
          c.beginPath();
          c.arc(e.x, e.y, 350, 0, Math.PI * 2);
          c.stroke();
        }
    }
    if (this.marker && time - this.marker.at < 1) {
      const m = this.marker,
        age = this.reduced ? 0 : time - m.at,
        r = 15 + age * 17;
      c.strokeStyle = m.attack ? "#ffaf7c" : "#bafa47";
      c.globalAlpha = 1 - age;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(m.point.x, m.point.y, r, 0, Math.PI * 2);
      c.stroke();
      line(
        c,
        m.point.x - 5,
        m.point.y,
        m.point.x + 5,
        m.point.y,
        c.strokeStyle as string,
        2,
      );
      line(
        c,
        m.point.x,
        m.point.y - 5,
        m.point.x,
        m.point.y + 5,
        c.strokeStyle as string,
        2,
      );
      c.globalAlpha = 1;
    }
    c.restore();
    if (!this.reduced) {
      // Fine rain and low rolling haze stay subtle enough to preserve unit contrast.
      c.strokeStyle = "#aecac312";
      c.lineWidth = 1;
      for (let i = 0; i < 32; i++) {
        const x = (i * 133 + anim * 29) % this.width,
          y = (i * 97 + anim * 205) % this.height;
        line(c, x, y, x - 4, y + 15, "#b5d9d013");
      }
      const fog = c.createLinearGradient(0, this.height * 0.6, 0, this.height);
      fog.addColorStop(0, "#abcaba00");
      fog.addColorStop(1, "#7ca9a00b");
      c.fillStyle = fog;
      c.fillRect(0, 0, this.width, this.height);
    }
    if (this.drag) {
      const { from, to } = this.drag;
      c.fillStyle = "#bafa4714";
      c.strokeStyle = "#bafa47";
      c.lineWidth = 1;
      c.fillRect(from.x, from.y, to.x - from.x, to.y - from.y);
      c.strokeRect(from.x, from.y, to.x - from.x, to.y - from.y);
    }
    if (this.fogFrame % 5 === 1) this.drawMini();
  }
  drawMini() {
    const c = this.mc,
      g = this.game,
      s = 240 / W;
    c.clearRect(0, 0, 240, 180);
    c.fillStyle = "#0a1712";
    c.fillRect(0, 0, 240, 180);
    c.globalAlpha = 0.65;
    c.drawImage(this.terrain, 0, 0, 240, 180);
    c.globalAlpha = 1;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const idx = y * COLS + x;
        if (!g.explored[idx]) {
          c.fillStyle = "#06100deb";
          c.fillRect(x * CELL * s, y * CELL * s, CELL * s + 1, CELL * s + 1);
        } else if (!g.visible[idx]) {
          c.fillStyle = "#06100d80";
          c.fillRect(x * CELL * s, y * CELL * s, CELL * s + 1, CELL * s + 1);
        }
      }
    for (const n of g.resources)
      if (n.amount > 0 && g.exploredAt(n)) {
        c.fillStyle = "#bafa47";
        c.fillRect(n.x * s - 2, n.y * s - 2, 4, 4);
      }
    for (const n of g.uplinks) {
      c.strokeStyle = n.owner >= 0 ? COLORS[n.owner] : "#a2ad9d";
      c.lineWidth = 1;
      c.strokeRect(n.x * s - 3, n.y * s - 3, 6, 6);
    }
    for (const e of g.entities)
      if (g.canSee(e)) {
        c.fillStyle = COLORS[e.owner];
        c.fillRect(
          e.x * s - (e.building ? 3 : 1.5),
          e.y * s - (e.building ? 3 : 1.5),
          e.building ? 6 : 3,
          e.building ? 6 : 3,
        );
      }
    const tl = this.world({ x: 0, y: 0 }),
      br = this.world({ x: this.width, y: this.height });
    c.strokeStyle = "#e0e8c8";
    c.lineWidth = 1;
    c.strokeRect(tl.x * s, tl.y * s, (br.x - tl.x) * s, (br.y - tl.y) * s);
  }
}
