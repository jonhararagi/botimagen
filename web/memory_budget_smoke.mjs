import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const webRoot = here;
const apiUrl = "http://127.0.0.1:8765";
const appUrl = "http://127.0.0.1:5173";
const playwrightModule = process.env.BOTIMAGEN_PLAYWRIGHT_MODULE
  ?? resolve(webRoot, "node_modules", "playwright", "index.mjs");
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const children = [];
const logs = [];
let browser;

function start(command, args, cwd) {
  const child = spawn(command, args, {
    cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  child.stdout.on("data", chunk => logs.push(chunk.toString()));
  child.stderr.on("data", chunk => logs.push(chunk.toString()));
  children.push(child);
  return child;
}
async function waitFor(description, probe, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await probe()) return;
    await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
  }
  throw new Error("Timed out waiting for " + description + "\n" + logs.join("").slice(-6000));
}
function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32") child.kill();
  else {
    try { process.kill(-child.pid, "SIGTERM"); } catch { child.kill("SIGTERM"); }
  }
}

try {
  const python = start(process.env.PYTHON ?? "python", ["botimagen_server.py"], root);
  const vite = start(process.execPath, [resolve(webRoot, "node_modules", "vite", "bin", "vite.js"), "--host", "127.0.0.1", "--port", "5173", "--strictPort"], webRoot);
  await waitFor("local API", async () => {
    if (python.exitCode !== null) throw new Error("Python API exited");
    const response = await fetch(apiUrl + "/api/health").catch(() => null);
    return !!response?.ok;
  });
  await waitFor("Vite", async () => {
    if (vite.exitCode !== null) throw new Error("Vite exited");
    const response = await fetch(appUrl).catch(() => null);
    return !!response?.ok;
  });

  browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() =>
    document.querySelector(".main-footer")?.textContent?.includes("Motor Python conectado")
    && document.querySelector('img.server-character-art')?.dataset.renderer === "parametric-anime-svg-v1",
    undefined, { timeout: 25000 },
  );
  await page.waitForTimeout(500);
  const sample = await page.evaluate(async () => {
    if (typeof performance.memory?.usedJSHeapSize !== "number") {
      throw new Error("Chromium no expuso performance.memory.usedJSHeapSize");
    }
    if (typeof window.gc === "function") window.gc();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      usedBytes: performance.memory.usedJSHeapSize,
      totalBytes: performance.memory.totalJSHeapSize,
      limitBytes: performance.memory.jsHeapSizeLimit,
      imageCount: document.images.length,
      svgPreviewReady: document.querySelector('img.server-character-art') instanceof HTMLImageElement,
    };
  });
  const usedMiB = sample.usedBytes / (1024 * 1024);
  console.log(`MEMORY_BUDGET browser-js-heap=${usedMiB.toFixed(1)} MiB images=${sample.imageCount} heap-limit=${(sample.limitBytes / (1024 * 1024)).toFixed(0)} MiB`);
  assert.ok(sample.svgPreviewReady, "The local SVG character preview must be ready before measuring");
  assert.ok(usedMiB <= 300, `Browser JavaScript heap exceeds the 300 MiB startup budget: ${usedMiB.toFixed(1)} MiB`);
  console.log("PASS: BotImagen startup JavaScript heap is within the 300 MiB regression budget.");
} finally {
  if (browser) await browser.close();
  for (const child of children.reverse()) stop(child);
}
