import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
const dist = resolve("dist");
const manifest = JSON.parse(
  await readFile(join(dist, "pepe-game.json"), "utf8"),
);
assert.equal(manifest.schemaVersion, "pepe-browser-game/1");
for (const [key, min, max] of [
  ["title", 2, 60],
  ["summary", 10, 160],
  ["description", 10, 2000],
  ["controls", 5, 500],
])
  assert.ok(
    typeof manifest[key] === "string" &&
      manifest[key].length >= min &&
      manifest[key].length <= max,
    key,
  );
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.genre, "strategy");
assert.equal(manifest.players, 1);
assert.equal(manifest.mobile, true);
for (const key of ["entry", "cover"]) {
  assert.match(manifest[key], /^[A-Za-z0-9._/-]+$/);
  assert.ok(!manifest[key].startsWith("/") && !manifest[key].includes(".."));
  await stat(join(dist, manifest[key]));
}
const html = await readFile(join(dist, "index.html"), "utf8");
for (const marker of [
  "<title>",
  'name="description"',
  'property="og:title"',
  'property="og:image"',
  'rel="icon"',
])
  assert.ok(html.includes(marker), marker);
assert.ok(
  !html.includes('type="module"'),
  "opaque-origin export uses classic script",
);
for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  assert.ok(ref.startsWith("./"), ref);
  await stat(join(dist, ref));
}
let total = 0;
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    assert.notEqual(entry.name, "node_modules");
    assert.notEqual(entry.name, ".git");
    if (entry.isDirectory()) await walk(file);
    else {
      const s = await stat(file);
      total += s.size;
      files.push({ path: file.slice(dist.length + 1), bytes: s.size });
    }
  }
}
await walk(dist);
assert.ok(total < 2 * 1024 * 1024, "export budget: 2 MiB");
const code = await Promise.all(
  files
    .filter((f) => /\.(js|html)$/.test(f.path))
    .map((f) => readFile(join(dist, f.path), "utf8")),
);
assert.ok(
  !code.some((s) =>
    /https?:\/\/(?:fonts\.googleapis|cdn\.|unpkg|cdnjs|game-api)/.test(s),
  ),
  "no remote runtime dependencies or publishing callback",
);
console.log(
  JSON.stringify(
    {
      status: "pass",
      manifest: "pepe-browser-game/1",
      iframe: "classic script + embedded local fonts",
      exportBytes: total,
      exportBudget: 2097152,
      files,
    },
    null,
    2,
  ),
);
