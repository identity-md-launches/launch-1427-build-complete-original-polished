import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PEPE_CHROME
    ? { executablePath: process.env.PEPE_CHROME }
    : {}),
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const asset = await readFile("public/assets/commander.webp"),
    font = await readFile("src/assets/barlow-condensed-800.woff2");
  await page.setContent(
    `<html><head><style>@font-face{font-family:Title;src:url(data:font/woff2;base64,${font.toString("base64")})}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#0b100f;color:#e8eddf;overflow:hidden}.art{position:absolute;inset:0;background:linear-gradient(90deg,#0b100ff0 2%,#0b100f55 50%,transparent 80%),url(data:image/webp;base64,${asset.toString("base64")}) center/cover}.frame{position:absolute;inset:28px;border:1px solid #95ac5c44}.content{position:absolute;left:60px;top:130px}h1{font:800 126px/.95 Title,sans-serif;letter-spacing:-3px;margin:0 0 20px}h2{font:800 48px/1.1 Title,sans-serif;letter-spacing:-.5px;margin:0}p{font:18px/1.6 monospace;color:#b4c4aa;margin:24px 0}b{display:inline-block;padding:12px 17px;background:#bafa47;color:#152309;font:800 24px/1 Title,sans-serif;margin-top:24px}.meta{position:absolute;left:60px;bottom:54px;font:12px monospace;color:#b4c4aa}.scan{position:absolute;inset:0;background:repeating-linear-gradient(transparent 0,transparent 3px,#0002 3px,#0002 4px);pointer-events:none}</style></head><body><div class="art"></div><div class="frame"></div><div class="content"><h1>PEPEFRONT</h1><h2>COMMAND THE NIGHT.</h2><p>Build. Command. Conquer.</p><b>REAL-TIME STRATEGY</b></div><div class="meta">PEPE2PEPE ARCADE &nbsp; / &nbsp; OPERATION NIGHTFALL</div><div class="scan"></div></body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "public/cover.jpg",
    type: "jpeg",
    quality: 90,
  });
  console.log("Original cover composed at 1200×630: public/cover.jpg");
} finally {
  await browser.close();
}
