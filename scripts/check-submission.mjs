import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";

const budget = 8388608;
const output = "evidence/submission-budget.json";
const rootInputs = new Set([".git", ".imd", ".agents", ".aws", ".codex"]);
const generated = new Set(["node_modules", ".npm", ".vite", ".cache", "coverage", "playwright-report", "test-results"]);
const files = [];
async function walk(dir = "") {
  for (const entry of await readdir(dir || ".", { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if ((!dir && rootInputs.has(entry.name)) || generated.has(entry.name) || path === "test/scratch") continue;
    assert.notEqual(entry.name, ".gitmodules", "No submodules allowed");
    assert.notEqual(entry.name, ".playwright-mcp", "Remove temporary browser-tool output before submission");
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${path}`);
    assert.ok(!/\.(tgz|tar|zip|gz)$/.test(path), `Unnecessary archive: ${path}`);
    if (entry.isDirectory()) await walk(path);
    else if (path !== output) files.push({ path, bytes: (await stat(path)).size });
  }
}
await walk();
assert.ok((await stat(".gitignore")).size <= 512, ".gitignore explicit path budget: 512 bytes");
assert.ok(!(await readFile(".gitignore", "utf8")).split("\n").some(line => /^\/?(?:dist|evidence)\/?$/.test(line)), "Required export and evidence must be included");
for (const required of ["dist/index.html", "dist/pepe-game.json", "dist/cover.jpg", "package-lock.json", "README.md", "DESIGN.md", "VALIDATION.md", "evidence/browser-results.json"]) {
  assert.ok(files.some(f => f.path === required), `Missing required deliverable: ${required}`);
}
files.push({ path: output, bytes: 0 });
files.sort((a, b) => a.path.localeCompare(b.path));
const self = files.find(f => f.path === output);
const report = {
  status: "pass",
  budgetBytes: budget,
  totalBytes: 0,
  fileCount: files.length,
  method: "Uncompressed intended submission files including this report; conservative payload estimate, not a generated Git pack. Git internals are not read or modified.",
  excluded: ["Provided environment inputs: .git/, .imd/, .agents/, .aws/, .codex/", "All nested generated dependency/cache/report directories listed in .gitignore", "Disposable test/scratch/"],
  ignoreFileBudgetBytes: 512,
  files,
};
let json;
for (let i = 0; i < 10; i++) {
  report.totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  json = JSON.stringify(report, null, 2) + "\n";
  if (Buffer.byteLength(json) === self.bytes) break;
  self.bytes = Buffer.byteLength(json);
}
assert.equal(Buffer.byteLength(json), self.bytes, "Inventory size converges");
assert.ok(report.totalBytes < budget, "Complete submission exceeds 8 MiB");
await writeFile(output, json);
console.log(`Submission inventory passed: ${files.length} files, ${report.totalBytes} / ${budget} bytes.`);
