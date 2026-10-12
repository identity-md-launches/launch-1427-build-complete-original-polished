import { readFile, writeFile } from "node:fs/promises";
// A classic IIFE script avoids CORS-dependent module loading in opaque-origin arcade frames.
// Fonts are embedded in the CSS; gameplay makes no same-origin or storage assumptions.
const path = "dist/index.html";
let html = await readFile(path, "utf8");
if (!html.includes('type="module"'))
  throw new Error("Expected Vite entry script missing");
html = html
  .replace(/type="module"\s*/g, "defer ")
  .replace(/\s+crossorigin(?:="[^"]*")?/g, "");
await writeFile(path, html);
console.log(
  "Static export finalized: classic bundled script, relative assets, embedded fonts.",
);
