import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error("Usage: node scripts/smoke-capynite-webgl.mjs http://127.0.0.1:8081/");
  process.exit(2);
}
const evidencePath = resolve(process.env.CAPYNITE_EVIDENCE_DIR || "unity-browser-evidence");
mkdirSync(evidencePath, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let failure = null;
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", error => errors.push("JS: " + error.message));
  page.on("response", response => {
    if (response.status() >= 400) errors.push("HTTP " + response.status() + " " + response.url());
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    return Boolean(canvas && canvas.width > 0 && canvas.height > 0 && canvas.getBoundingClientRect().width > 100);
  }, { timeout: 120000 });
  // Unity's index exposes #unity-loading-bar while engine initialization runs.
  const loadingBar = page.locator("#unity-loading-bar");
  if (await loadingBar.count()) {
    await page.waitForFunction(() => {
      const node = document.querySelector("#unity-loading-bar");
      return !node || getComputedStyle(node).display === "none";
    }, { timeout: 120000 });
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(evidencePath, "webgl-1366x768.png"), fullPage: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(evidencePath, "webgl-1920x1080.png"), fullPage: true });
  const canvasState = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return null;
    const box = c.getBoundingClientRect();
    return { width: c.width, height: c.height, visible: box.width > 100 && box.height > 100 };
  });
  if (!canvasState?.visible) errors.push("Canvas not visible");
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ result: "BROWSER_SMOKE_PASS", url, canvasState, screenshots: 2 }, null, 2));
} catch (error) {
  failure = error;
  console.error("WebGL browser smoke FAILED:", error);
}
finally {
  await browser.close();
}
if (failure) process.exitCode = 1;
