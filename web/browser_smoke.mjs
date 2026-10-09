import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const webRoot = resolve(root, "web");
const apiUrl = "http://127.0.0.1:8765";
const appUrl = "http://127.0.0.1:5173";
const playwrightModule = process.env.BOTIMAGEN_PLAYWRIGHT_MODULE
  ?? resolve(webRoot, "node_modules", "playwright", "index.mjs");

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const children = [];
const logs = { api: "", vite: "" };
let browser;

function appendLog(key, chunk) {
  logs[key] = (logs[key] + chunk.toString()).slice(-10000);
}

function startProcess(key, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  child.stdout.on("data", chunk => appendLog(key, chunk));
  child.stderr.on("data", chunk => appendLog(key, chunk));
  children.push(child);
  return child;
}

async function waitFor(description, probe, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      if (await probe()) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 250));
  }
  throw new Error(
    `Timed out waiting for ${description}${lastError ? `: ${lastError}` : ""}`
  );
}

function assertRunning(child, description) {
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(`${description} exited early (code=${child.exitCode}, signal=${child.signalCode})`);
  }
}

try {
  const api = startProcess("api", process.env.PYTHON ?? "python", ["botimagen_server.py"], root);
  const viteEntry = resolve(webRoot, "node_modules", "vite", "bin", "vite.js");
  const vite = startProcess(
    "vite",
    process.execPath,
    [viteEntry, "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
    webRoot,
  );

  await waitFor("local API health", async () => {
    assertRunning(api, "BotImagen API");
    const response = await fetch(`${apiUrl}/api/health`);
    return response.ok;
  });
  await waitFor("Vite development server", async () => {
    assertRunning(vite, "Vite");
    const response = await fetch(appUrl);
    return response.ok;
  });

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Motor Python conectado"),
    undefined,
    { timeout: 20000 },
  );

  await page.getByRole("tab", { name: /Cabello/i }).click();
  const tipLabel = page.locator('label[for="trait-hair_tip_color"]');
  const tipField = tipLabel.locator("xpath=../..");
  const tipLock = tipField.locator("button.lock");
  const tipSelect = tipField.locator("select");
  await tipLabel.waitFor({ state: "visible" });

  if ((await tipLock.innerText()).includes("AUTO")) await tipLock.click();
  await tipSelect.selectOption("turquoise");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil generado por Python"),
    undefined,
    { timeout: 15000 },
  );

  let prompt = await page.locator(".prompt-panel pre").innerText();
  assert.ok(prompt.includes("turquoise color confined to the hair tips with a clean transition"),
    "Generated prompt should honor the independently selected turquoise tip color");

  await tipSelect.selectOption("metallic_gold");
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  const saveButton = page.locator(".heading-buttons .btn.primary");
  assert.equal(await saveButton.isDisabled(), true, "Saving must be blocked while the generated snapshot is stale");
  assert.equal(await page.locator(".prompt-actions button").nth(2).isDisabled(), true,
    "Exporting must be blocked while a stale prompt is displayed");
  assert.equal(await page.getByRole("button", { name: /Copiar texto/i }).isDisabled(), true,
    "Copying must be blocked while a stale prompt is displayed");

  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil generado por Python"),
    undefined,
    { timeout: 15000 },
  );
  prompt = await page.locator(".prompt-panel pre").innerText();
  assert.ok(prompt.includes("metallic gold color confined to the hair tips with a clean transition"),
    "Regeneration should update the prompt to the new tip color");
  assert.equal(await saveButton.isDisabled(), false, "Saving should unlock after successful regeneration");

  // Exercise catalog-driven compatibility in the real UI, not only unit tests.
  const catalog = await page.evaluate(async () => {
    const response = await fetch("/api/catalog");
    if (!response.ok) throw new Error("Unable to load the character catalog for the E2E check");
    return response.json();
  });
  const lengthLabel = page.locator('label[for="trait-hair_length"]');
  const lengthField = lengthLabel.locator("xpath=../..");
  const lengthLock = lengthField.locator("button.lock");
  const lengthSelect = lengthField.locator("select");
  const styleSelect = page.locator('label[for="trait-hairstyle"]').locator("xpath=../..").locator("select");
  const arrangementSelect = page.locator('label[for="trait-hair_arrangement"]').locator("xpath=../..").locator("select");
  if ((await lengthLock.innerText()).includes("AUTO")) await lengthLock.click();
  await lengthSelect.selectOption("pixie");
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  assert.equal(await saveButton.isDisabled(), true,
    "Changing the hair length must invalidate the old generated snapshot");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });

  assert.equal(await lengthSelect.inputValue(), "pixie",
    "A manually locked hair length must survive regeneration");
  const selectedStyle = await styleSelect.inputValue();
  const allowedStyles = catalog.categories.hairstyle
    .filter(option => option.compatible_with?.hair_length?.includes("pixie"))
    .map(option => option.id);
  assert.ok(allowedStyles.includes(selectedStyle),
    `AUTO hairstyle must match the manually locked pixie length; got ${selectedStyle}`);
  const selectedArrangement = await arrangementSelect.inputValue();
  const allowedArrangements = catalog.categories.hair_arrangement
    .filter(option => option.compatible_with?.hair_length?.includes("pixie"))
    .map(option => option.id);
  assert.ok(allowedArrangements.includes(selectedArrangement),
    `AUTO hair arrangement must match the manually locked pixie length; got ${selectedArrangement}`);
  assert.equal(await saveButton.isDisabled(), false,
    "Saving should unlock after compatible regeneration");

  // Reverse the constraint direction: lock an updo and let AUTO choose its length.
  const arrangementLabel = page.locator('label[for="trait-hair_arrangement"]');
  const arrangementField = arrangementLabel.locator("xpath=../..");
  const arrangementLock = arrangementField.locator("button.lock");
  if ((await arrangementLock.innerText()).includes("AUTO")) await arrangementLock.click();
  await arrangementSelect.selectOption("coleta_trenzada");
  if (!(await lengthLock.innerText()).includes("AUTO")) await lengthLock.click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });

  assert.equal(await arrangementSelect.inputValue(), "coleta_trenzada",
    "A manually locked braided ponytail must survive regeneration");
  const allowedLengthsForArrangement = catalog.categories.hair_arrangement
    .find(option => option.id === "coleta_trenzada")?.compatible_with?.hair_length ?? [];
  const selectedLengthForArrangement = await lengthSelect.inputValue();
  assert.ok(allowedLengthsForArrangement.includes(selectedLengthForArrangement),
    `AUTO hair length must match a manually locked braided ponytail; got ${selectedLengthForArrangement}`);
  assert.equal(await saveButton.isDisabled(), false,
    "Saving should unlock after reverse-direction compatibility succeeds");

  const profileSummary = page.locator(".saved-profile-panel summary");
  await profileSummary.waitFor({ state: "visible" });
  const initialCount = Number((await profileSummary.innerText()).match(/\((\d+)\)/)?.[1] ?? 0);

  await saveButton.click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil guardado en generated_characters/web_profiles"),
    undefined,
    { timeout: 10000 },
  );
  await page.waitForFunction(
    count => Number(document.querySelector(".saved-profile-panel summary")?.textContent?.match(/\((\d+)\)/)?.[1] ?? 0) === count + 1,
    initialCount,
    { timeout: 10000 },
  );

  await profileSummary.click();
  await page.locator(".saved-profile-copy").first().click();
  await page.waitForFunction(
    count => Number(document.querySelector(".saved-profile-panel summary")?.textContent?.match(/\((\d+)\)/)?.[1] ?? 0) === count + 2,
    initialCount,
    { timeout: 10000 },
  );
  await page.locator(".saved-profile-item").first().click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil cargado desde la biblioteca local"),
    undefined,
    { timeout: 10000 },
  );
  assert.equal(await tipSelect.inputValue(), "metallic_gold",
    "Loading a saved profile should restore the tip color selection");
  assert.equal(await arrangementSelect.inputValue(), "coleta_trenzada",
    "Loading a saved profile should restore the manually locked braided ponytail");
  assert.equal(await lengthSelect.inputValue(), selectedLengthForArrangement,
    "Loading a saved profile should restore the AUTO-selected compatible hair length");
  assert.ok(allowedLengthsForArrangement.includes(await lengthSelect.inputValue()),
    "Loaded profile should keep the hair length compatible with its locked arrangement");
  assert.ok(allowedStyles.includes(await styleSelect.inputValue()),
    "The generated hairstyle should remain compatible with the earlier locked pixie length check");
  assert.deepEqual(pageErrors, [], "The page should not raise uncaught JavaScript errors");

  console.log("PASS_REAL: Chromium verified independent hair-tip prompts, stale-snapshot guards, catalog-driven hair length/hairstyle/arrangement compatibility in both directions, profile save/duplicate/load, and no page errors.");
} catch (error) {
  console.error("FAIL_REAL: BotImagen browser smoke test failed.", error);
  console.error("--- API logs ---\n" + logs.api);
  console.error("--- Vite logs ---\n" + logs.vite);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  for (const child of children.reverse()) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    const exited = new Promise(resolveExit => child.once("exit", () => resolveExit(true)));
    try {
      if (process.platform !== "win32") process.kill(-child.pid, "SIGTERM");
      else child.kill("SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
    let timer;
    const stopped = await Promise.race([
      exited,
      new Promise(resolveTimeout => { timer = setTimeout(() => resolveTimeout(false), 2500); }),
    ]);
    clearTimeout(timer);
    if (!stopped) {
      try {
        if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
      await Promise.race([
        exited,
        new Promise(resolveTimeout => setTimeout(resolveTimeout, 1000)),
      ]);
    }
  }
}
