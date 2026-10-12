import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const webRoot = resolve(root, "web");
const apiUrl = "http://127.0.0.1:8765";
const appUrl = "http://127.0.0.1:5173";
const playwrightModule = process.env.BOTIMAGEN_PLAYWRIGHT_MODULE
  ?? resolve(webRoot, "node_modules", "playwright", "index.mjs");

const { chromium } = await import(pathToFileURL(playwrightModule).href);

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}
function makeQaPng() {
  const width = 320, height = 480;
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // PNG filter: None
    for (let x = 0; x < width; x++) {
      let r = 247, g = 247, b = 247, a = 255;
      if (x >= 118 && x < 202 && y >= 75 && y < 147) { r = 230; g = 164; b = 206; }
      if (x >= 105 && x < 215 && y >= 155 && y < 315) { r = 71; g = 123; b = 224; }
      if (((x >= 115 && x < 150) || (x >= 170 && x < 205)) && y >= 310 && y < 435) { r = 48; g = 54; b = 75; }
      if (((x >= 102 && x < 154) || (x >= 164 && x < 216)) && y >= 435 && y < 451) { r = 34; g = 40; b = 58; }
      const pixel = rowStart + 1 + x * 4;
      raw[pixel] = r; raw[pixel + 1] = g; raw[pixel + 2] = b; raw[pixel + 3] = a;
    }
  }
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    signature, pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(raw)), pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

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
  await page.waitForFunction(
    () => {
      const image = document.querySelector("img.server-character-art");
      return image instanceof HTMLImageElement
        && image.src.startsWith("data:image/svg+xml;charset=utf-8,")
        && image.dataset.renderer === "parametric-anime-svg-v1";
    },
    undefined,
    { timeout: 20000 },
  );
  const initialEnginePreview = await page.locator("img.server-character-art").getAttribute("src");
  assert.ok(initialEnginePreview?.startsWith("data:image/svg+xml;charset=utf-8,"),
    "The user-facing preview must load the SVG returned by the local parametric anime engine");
  const readRenderedSvgView = async () => {
    const src = await page.locator("img.server-character-art").getAttribute("src");
    assert.ok(src?.startsWith("data:image/svg+xml;charset=utf-8,"), "The product preview must remain a local engine SVG");
    const svg = decodeURIComponent(src.slice(src.indexOf(",") + 1));
    return svg.match(/\bdata-view="(front|back)"/)?.[1] ?? null;
  };
  assert.equal(await page.locator("img.server-character-art").getAttribute("data-rendered-view"), "front",
    "The product preview metadata must identify the actual initial front view");
  assert.equal(await readRenderedSvgView(), "front",
    "The SVG generated by Python must declare the same initial front view");

  // Exercise the integrated image converter and persistent image library with a real, valid PNG.
  const modularInput = page.locator('.modular-dropzone input[type="file"]');
  await modularInput.setInputFiles({ name: "qa-reference.png", mimeType: "image/png", buffer: makeQaPng() });
  await page.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
  await page.getByRole("img", { name: "PNG normalizado de qa-reference.png 512 por 768" }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Guardar material convertido" }).click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false,
    null,
    { timeout: 15000 },
  );
  const savedAsset = page.locator(".modular-asset-list article").filter({ hasText: "qa-reference" }).first();
  await savedAsset.waitFor({ state: "visible", timeout: 10000 });
  const savedImage = savedAsset.locator("img.modular-saved-preview");
  await page.waitForFunction(
    image => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 320,
    await savedImage.elementHandle(),
    { timeout: 10000 },
  );
  const persistedAssetId = await savedAsset.getAttribute("data-asset-id");
  assert.ok(persistedAssetId, "The library item should expose a stable persisted ID");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('.modular-asset-list article[data-asset-kind="reference"]')
    .filter({ hasText: "Fuente original · qa-reference" }).first()
    .waitFor({ state: "visible", timeout: 15000 });


  // Full PNG-to-rig flow: edit body joints, persist them, fit a garment, and compose.
  await page.getByLabel("Tipo de recurso").selectOption("modular_piece");
  await page.getByLabel("Clasificación de la imagen").selectOption("body");
  await page.locator('.modular-dropzone input[type="file"]').setInputFiles({ name: "qa-body-anchor.png", mimeType: "image/png", buffer: makeQaPng() });
  await page.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
  const bodyStage = page.locator(".modular-preview-card .modular-anchor-stage").first();
  await bodyStage.waitFor({ timeout: 10000 });
  const headPoint = bodyStage.locator('.modular-anchor-point[aria-label="Cabeza"]');
  const originalHeadTransform = await headPoint.getAttribute("transform");
  const stageBox = await bodyStage.boundingBox();
  const headBox = await headPoint.locator("circle").first().boundingBox();
  assert.ok(stageBox && headBox, "The normalized PNG should show draggable skeleton landmarks");
  await page.mouse.move(headBox.x + headBox.width / 2, headBox.y + headBox.height / 2);
  await page.mouse.down();
  const transformAfterPress = await headPoint.getAttribute("transform");
  await page.mouse.move(stageBox.x + stageBox.width * 0.54, stageBox.y + stageBox.height * 0.12, { steps: 6 });
  await page.mouse.up();
  await page.waitForFunction(previous => {
    const point = document.querySelector('.modular-preview-card .modular-anchor-point[aria-label="Cabeza"]');
    return point instanceof SVGGElement && point.getAttribute("transform") !== previous;
  }, transformAfterPress ?? originalHeadTransform, { timeout: 5000 });
  const movedTransform = await bodyStage.locator('.modular-anchor-point[aria-label="Cabeza"]').getAttribute("transform");
  const movedHead = movedTransform?.match(/translate\(([\d.]+) ([\d.]+)\)/);
  assert.ok(movedHead, "The edited landmark should keep its normalized stage coordinates");
  await page.getByRole("button", { name: "Guardar material convertido" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false, null, { timeout: 15000 });
  const bodyAsset = page.locator('.modular-asset-list article[data-asset-kind="modular_piece"]').filter({ hasText: "qa-body-anchor" }).first();
  await bodyAsset.waitFor({ state: "visible", timeout: 10000 });
  await bodyAsset.getByRole("button", { name: "Confirmar puntos del esqueleto" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("Anclajes confirmados") ?? false, null, { timeout: 10000 });
  const persistedRig = await page.evaluate(async () => { const r = await fetch("/api/modular-assets"); if (!r.ok) throw new Error("Could not read imported rig asset"); const d = await r.json(); return d.assets.find(asset => asset.label === "qa-body-anchor"); });
  assert.ok(persistedRig?.anchors_validated, "The body landmarks should be confirmed and persisted");
  assert.ok(Math.abs(persistedRig.anchor_estimate.head.x - Number(movedHead[1]) / 512) < 0.01, "The dragged head landmark should persist in the local asset catalog");
  await page.getByRole("checkbox", { name: "Seleccionar pieza qa-body-anchor" }).check();

  await page.getByLabel("Clasificación de la imagen").selectOption("clothing_top");
  await page.locator('.modular-dropzone input[type="file"]').setInputFiles({ name: "qa-top-anchor.png", mimeType: "image/png", buffer: makeQaPng() });
  await page.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
  await page.locator(".modular-preview-card .modular-anchor-stage").last().waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Guardar material convertido" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false, null, { timeout: 15000 });
  const topAsset = page.locator('.modular-asset-list article[data-asset-kind="modular_piece"]').filter({ hasText: "qa-top-anchor" }).first();
  await topAsset.waitFor({ state: "visible", timeout: 10000 });
  await topAsset.getByRole("button", { name: "Confirmar puntos del esqueleto" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("Anclajes confirmados") ?? false, null, { timeout: 10000 });
  await page.getByRole("checkbox", { name: "Seleccionar pieza qa-top-anchor" }).check();
  await page.getByRole("button", { name: "Componer selección (2)" }).click();
  await page.waitForFunction(() => { const image = document.querySelector("img.modular-composition-preview"); return image instanceof HTMLImageElement && image.complete && image.naturalWidth === 512 && image.naturalHeight === 768; }, null, { timeout: 15000 });
  // Import a second, back-view body/garment pair and switch the live compositor to the reverse side.
  await page.getByLabel("Vista para componer").selectOption("back");
  await page.getByLabel("Vista de la imagen").selectOption("back");
  await page.getByLabel("Clasificación de la imagen").selectOption("body");
  await page.locator('.modular-dropzone input[type="file"]').setInputFiles({ name: "qa-body-back.png", mimeType: "image/png", buffer: makeQaPng() });
  await page.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
  await page.locator(".modular-preview-card .modular-anchor-stage").first().waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Guardar material convertido" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false, null, { timeout: 15000 });
  const backBody = page.locator('.modular-asset-list article[data-asset-kind="modular_piece"]').filter({ hasText: "qa-body-back" }).first();
  await backBody.waitFor({ state: "visible", timeout: 10000 });
  await backBody.getByRole("button", { name: "Confirmar puntos del esqueleto" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("Anclajes confirmados") ?? false, null, { timeout: 10000 });
  await backBody.getByRole("checkbox", { name: "Seleccionar pieza qa-body-back" }).check();

  await page.getByLabel("Clasificación de la imagen").selectOption("clothing_top");
  await page.locator('.modular-dropzone input[type="file"]').setInputFiles({ name: "qa-top-back.png", mimeType: "image/png", buffer: makeQaPng() });
  await page.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
  await page.locator(".modular-preview-card .modular-anchor-stage").last().waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "Guardar material convertido" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false, null, { timeout: 15000 });
  const backTop = page.locator('.modular-asset-list article[data-asset-kind="modular_piece"]').filter({ hasText: "qa-top-back" }).first();
  await backTop.waitFor({ state: "visible", timeout: 10000 });
  await backTop.getByRole("button", { name: "Confirmar puntos del esqueleto" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("Anclajes confirmados") ?? false, null, { timeout: 10000 });
  await backTop.getByRole("checkbox", { name: "Seleccionar pieza qa-top-back" }).check();
  await page.getByRole("button", { name: "Componer selección (2)" }).click();
  await page.waitForFunction(() => {
    const image = document.querySelector("img.modular-composition-preview");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth === 512 && image.naturalHeight === 768;
  }, null, { timeout: 15000 });

  const assetContracts = await page.evaluate(async () => {
    const response = await fetch("/api/assets/contracts");
    if (!response.ok) throw new Error("The asset contract catalog endpoint is unavailable through the web proxy");
    return response.json();
  });
  assert.equal(assetContracts.count, 10, "The web app should receive all canonical asset contracts");
  assert.equal(assetContracts.contracts.length, assetContracts.count);
  assert.ok(
    assetContracts.contracts.every(contract =>
      typeof contract.id === "string"
      && contract.destination.endsWith(".png")
      && !contract.destination.startsWith("/")
      && !contract.destination.split("/").includes("..")
      && contract.expected.format === "PNG"
    ),
    "The public asset contract catalog must expose safe relative PNG destinations",
  );

  await page.getByRole("tab", { name: /Cabello/i }).click();
  const tipLabel = page.locator('label[for="trait-hair_tip_color"]');
  const tipField = tipLabel.locator("xpath=../..");
  const tipLock = tipField.locator("button.lock");
  const tipSelect = tipField.locator("select");
  await tipLabel.waitFor({ state: "visible" });

  if ((await tipLock.innerText()).includes("AUTO")) await tipLock.click();
  await tipSelect.selectOption("turquoise");
  await page.waitForFunction(
    previous => document.querySelector("img.server-character-art")?.getAttribute("src") !== previous,
    initialEnginePreview,
    { timeout: 15000 },
  );
  // Simulate a transient API failure, verify the message reaches the user, then recover.
  const footer = page.locator(".main-footer");
  await page.route("**/api/generate", async route => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Error de prueba del navegador." }),
    });
  });
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("Error de prueba del navegador.", { exact: false }).waitFor({
    state: "visible",
    timeout: 10000,
  });
  await page.unroute("**/api/generate");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil generado por Python"),
    undefined,
    { timeout: 15000 },
  );
  assert.equal(
    await page.getByText("Error de prueba del navegador.", { exact: false }).count(),
    0,
    "A successful retry must replace the transient error message with the success status",
  );

  let prompt = await page.locator(".prompt-panel pre").innerText();
  assert.ok(prompt.includes("turquoise color confined to the hair tips with a clean transition"),
    "Generated prompt should honor the independently selected turquoise tip color");

  const seedInput = page.locator('input[aria-label="Semilla del generador"]');
  await seedInput.fill("12-3");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("La semilla debe ser un número entero válido.", { exact: true }).waitFor();
  assert.equal(await page.locator(".heading-buttons .btn.primary").isDisabled(), true,
    "Invalid seed syntax must leave saving disabled until regeneration succeeds");

  await seedInput.fill("9007199254740991");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("semilla 9007199254740991"),
    undefined,
    { timeout: 15000 },
  );
  assert.equal(await page.locator(".heading-buttons .btn.primary").isDisabled(), false,
    "The largest safe JavaScript integer must be accepted as a reproducible seed");

  await seedInput.fill("9007199254740992");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("La semilla debe ser un número entero válido.", { exact: true }).waitFor();
  assert.equal(await page.locator(".heading-buttons .btn.primary").isDisabled(), true,
    "Out-of-range seed integers must be rejected instead of rounded");
  await seedInput.fill("314159");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil generado por Python"),
    undefined,
    { timeout: 15000 },
  );

  await tipSelect.selectOption("metallic_gold");
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  const saveButton = page.locator(".heading-buttons .btn.primary");
  assert.equal(await saveButton.isDisabled(), true, "Saving must be blocked while the generated snapshot is stale");
  assert.equal(await page.locator(".prompt-panel .prompt-actions button").nth(2).isDisabled(), true,
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

  // A locked combat role constrains AUTO outfit selection across editor tabs.
  await page.getByRole("tab", { name: /Combate/i }).click();
  const roleLabel = page.locator('label[for="trait-combat_role"]');
  const roleField = roleLabel.locator("xpath=../..");
  const roleLock = roleField.locator("button.lock");
  const roleSelect = roleField.locator("select");
  const propLabel = page.locator('label[for="trait-baseball_prop"]');
  const propField = propLabel.locator("xpath=../..");
  const propLock = propField.locator("button.lock");
  const propSelect = propField.locator("select");
  if ((await roleLock.innerText()).includes("AUTO")) await roleLock.click();
  await roleSelect.selectOption("tank");
  if (!(await propLock.innerText()).includes("AUTO")) await propLock.click();

  await page.getByRole("tab", { name: /Vestuario/i }).click();
  const outfitLabel = page.locator('label[for="trait-outfit"]');
  const outfitSelect = outfitLabel.locator("xpath=../..").locator("select");
  const outerLayerSelect = page.locator('label[for="trait-outer_layer"]').locator("xpath=../..").locator("select");
  const footwearSelect = page.locator('label[for="trait-footwear"]').locator("xpath=../..").locator("select");
  const accessorySelect = page.locator('label[for="trait-accessory"]').locator("xpath=../..").locator("select");
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });

  await page.getByRole("tab", { name: /Combate/i }).click();
  assert.equal(await roleSelect.inputValue(), "tank",
    "A manually locked combat role must survive regeneration");
  const allowedOutfits = catalog.categories.outfit
    .filter(option => option.compatible_with?.combat_role?.includes("tank"))
    .map(option => option.id);
  const allowedOuterLayers = catalog.categories.outer_layer
    .filter(option => option.compatible_with?.combat_role?.includes("tank"))
    .map(option => option.id);
  const allowedFootwear = catalog.categories.footwear
    .filter(option => option.compatible_with?.combat_role?.includes("tank"))
    .map(option => option.id);
  const allowedAccessories = catalog.categories.accessory
    .filter(option => option.compatible_with?.combat_role?.includes("tank"))
    .map(option => option.id);
  const allowedProps = catalog.categories.baseball_prop
    .filter(option => option.compatible_with?.combat_role?.includes("tank"))
    .map(option => option.id);
  await page.getByRole("tab", { name: /Combate/i }).click();
  assert.ok(allowedProps.includes(await propSelect.inputValue()),
    `AUTO baseball prop must match the manually locked tank role; got ${await propSelect.inputValue()}`);
  await page.getByRole("tab", { name: /Vestuario/i }).click();
  assert.ok(allowedOutfits.includes(await outfitSelect.inputValue()),
    `AUTO outfit must match the manually locked tank role; got ${await outfitSelect.inputValue()}`);
  assert.ok(allowedOuterLayers.includes(await outerLayerSelect.inputValue()),
    `AUTO outer layer must match the manually locked tank role; got ${await outerLayerSelect.inputValue()}`);
  assert.ok(allowedFootwear.includes(await footwearSelect.inputValue()),
    `AUTO footwear must match the manually locked tank role; got ${await footwearSelect.inputValue()}`);
  assert.ok(allowedAccessories.includes(await accessorySelect.inputValue()),
    `AUTO accessory must match the manually locked tank role; got ${await accessorySelect.inputValue()}`);

  // Explicit "none" is a real design choice, not a missing value or blank prompt.
  const outerLayerLabel = page.locator('label[for="trait-outer_layer"]');
  const outerLayerField = outerLayerLabel.locator("xpath=../..");
  const outerLayerLock = outerLayerField.locator("button.lock");
  if ((await outerLayerLock.innerText()).includes("AUTO")) await outerLayerLock.click();
  await outerLayerSelect.selectOption("none");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });
  prompt = await page.locator(".prompt-panel pre").innerText();
  assert.ok(prompt.includes("no outer layer"),
    "Explicit no-outer-layer selection must have clear prompt semantics");
  assert.ok(prompt.includes("Clothing:"),
    "Selecting no outer layer must not remove unrelated clothing prompt sections");
  assert.equal(await outerLayerSelect.inputValue(), "none",
    "The explicit none selection must survive regeneration");
  assert.equal(await saveButton.isDisabled(), false,
    "A valid none selection must remain saveable");



  // Species-specific anatomy follows catalog constraints; manual locks remain possible.
  await page.getByRole("tab", { name: /Identidad/i }).click();
  const speciesLabel = page.locator('label[for="trait-species"]');
  const speciesField = speciesLabel.locator("xpath=../..");
  const speciesLock = speciesField.locator("button.lock");
  const speciesSelect = speciesField.locator("select");
  if ((await speciesLock.innerText()).includes("AUTO")) await speciesLock.click();
  await speciesSelect.selectOption("draconica");
  await page.getByRole("tab", { name: /Anatomía/i }).click();
  const earSelect = page.locator('label[for="trait-ear_style"]').locator("xpath=../..").locator("select");
  const tailSelect = page.locator('label[for="trait-tail_style"]').locator("xpath=../..").locator("select");
  const hornSelect = page.locator('label[for="trait-horn_style"]').locator("xpath=../..").locator("select");
  const scalesSelect = page.locator('label[for="trait-scale_pattern"]').locator("xpath=../..").locator("select");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });
  for (const [category, selected] of [
    ["ear_style", await earSelect.inputValue()],
    ["tail_style", await tailSelect.inputValue()],
    ["horn_style", await hornSelect.inputValue()],
    ["scale_pattern", await scalesSelect.inputValue()],
  ]) {
    const option = catalog.categories[category].find(item => item.id === selected);
    assert.ok(option?.compatible_with?.species?.includes("draconica"),
      `AUTO ${category} must respect draconica compatibility; got ${selected}`);
  }
  await page.getByRole("tab", { name: /Identidad/i }).click();
  assert.equal(await speciesSelect.inputValue(), "draconica",
    "The selected species lock must survive anatomy regeneration");

  // Manual anatomy is an intentional override, even when species metadata disagrees.
  await speciesSelect.selectOption("humana");
  await page.getByRole("tab", { name: /Anatomía/i }).click();
  const scaleLabel = page.locator('label[for="trait-scale_pattern"]');
  const scaleField = scaleLabel.locator("xpath=../..");
  const scaleLock = scaleField.locator("button.lock");
  if ((await scaleLock.innerText()).includes("AUTO")) await scaleLock.click();
  await scalesSelect.selectOption("cheek_temple_scales");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: /Identidad/i }).click();
  assert.equal(await speciesSelect.inputValue(), "humana",
    "A manually selected species must survive a deliberate anatomy override");
  await page.getByRole("tab", { name: /Anatomía/i }).click();
  assert.equal(await scalesSelect.inputValue(), "cheek_temple_scales",
    "A manually locked anatomy option must not be silently normalized to the species");

  // Exercise the real CyberStreet controls and verify their generated prompt contract.
  const initialHairColor = await page.locator(".visual-character-svg").getAttribute("data-hair-color");
  const initialSkinColor = await page.locator(".visual-character-svg").getAttribute("data-skin-color");
  const fabricInputs = page.locator(".style-fields input[type=color]");
  const setColor = async (input, color) => input.evaluate((el, value) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, color);
  await setColor(fabricInputs.nth(0), "#234567");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-base"), "#234567", "Changing base nanotela color must immediately update the SVG clothing recipe");
  await setColor(fabricInputs.nth(1), "#456789");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-panel"), "#456789", "Changing secondary fabric color must update SVG panels");
  await setColor(fabricInputs.nth(2), "#55d9cf");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-accent"), "#55d9cf", "Changing technology accent must update the SVG recipe");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-hair-color"), initialHairColor, "Changing garment colors must not recolor hair");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-skin-color"), initialSkinColor, "Changing garment colors must not recolor skin");
  await page.locator(".style-fields select").nth(0).selectOption("geometric");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-pattern"), "geometric", "The geometric pattern must be connected to the live SVG");
  assert.ok(await page.locator(".visual-character-svg defs pattern path").count() > 0, "The selected geometric pattern must render actual SVG geometry");
  // Exercise actual SVG geometry, not only recipe attributes.
  await page.getByRole("tab", { name: /Vestuario/i }).click();
  const originalOutfit = await page.locator("#trait-outfit").inputValue();
  const outfitField = page.locator(".field").filter({ has: page.locator("#trait-outfit") });
  if (await page.locator("#trait-outfit").isDisabled()) await outfitField.locator("button.lock").click();
  await page.locator("#trait-outfit").selectOption("combat_jacket");
  const torsoSlider = page.getByRole("slider", { name: "Largo del torso" });
  const sleeveSlider = page.getByRole("slider", { name: "Largo de mangas" });
  const waistSlider = page.getByRole("slider", { name: "Ajuste de cintura" });
  assert.equal(await torsoSlider.isDisabled(), false, "Combat jacket should expose torso length");
  assert.equal(await sleeveSlider.isDisabled(), false, "Combat jacket should expose sleeve length");
  assert.equal(await waistSlider.isDisabled(), false, "Combat jacket should expose waist fit");
  const torsoPath = page.locator(".garment-torso-main");
  await torsoSlider.focus(); await torsoSlider.press("Home");
  const shortTorsoD = await torsoPath.getAttribute("d");
  await torsoSlider.press("End");
  const longTorsoD = await torsoPath.getAttribute("d");
  assert.notEqual(shortTorsoD, longTorsoD, "Torso slider endpoints must change actual SVG path geometry");
  const sleevePath = page.locator(".garment-sleeves path").first();
  await sleeveSlider.focus(); await sleeveSlider.press("Home");
  const shortSleeveD = await sleevePath.getAttribute("d");
  await sleeveSlider.press("End");
  const longSleeveD = await sleevePath.getAttribute("d");
  assert.notEqual(shortSleeveD, longSleeveD, "Sleeve slider endpoints must change actual sleeve geometry");
  await waistSlider.focus(); await waistSlider.press("Home");
  const fittedTorsoTransform = await torsoPath.getAttribute("transform");
  const fittedTorsoD = await torsoPath.getAttribute("d");
  await waistSlider.press("End");
  assert.notEqual(await torsoPath.getAttribute("d"), fittedTorsoD, "Waist fit must change actual torso path geometry");
  assert.notEqual(await torsoPath.getAttribute("transform"), fittedTorsoTransform, "Waist fit must alter the garment-only transform");
  const setRangeValue = async (locator, value) => locator.evaluate((el, next) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, String(next));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await setRangeValue(torsoSlider, 24);
  await setRangeValue(sleeveSlider, 92);
  await setRangeValue(waistSlider, 76);
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-torso-length"), "24");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-sleeve-length"), "92");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-waist-fit"), "76");
  await page.locator("#trait-outfit").selectOption(originalOutfit);
  await page.locator(".style-fields select").nth(1).selectOption("transformation");
  await page.locator(".view-toggle button").nth(1).click();
  await waitFor("the Python product SVG to switch to rear view", async () =>
    await page.locator("img.server-character-art").getAttribute("data-rendered-view") === "back"
    && await readRenderedSvgView() === "back");
  assert.equal(await readRenderedSvgView(), "back",
    "Selecting the rear view must update the actual product SVG, not only the QA fixture");
  await page.locator(".style-fields select").nth(3).selectOption("fox");
  await page.locator(".style-fields select").nth(5).selectOption("auto");
  await page.locator(".style-fields input[type=color]").nth(3).evaluate(el => {
    const input = el;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "#111111");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const animeSlider = page.locator(".style-range input").nth(0);
  await animeSlider.focus();
  await animeSlider.press("End");
  assert.equal(await animeSlider.inputValue(), "100", "The Anime influence slider should be interactive");
  assert.equal(await saveButton.isDisabled(), true, "Changing the visual recipe must invalidate the generated snapshot");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "hidden" });
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-nanowear"), "transformation");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-base"), "#234567", "Transformation must preserve the selected fabric base color");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-pattern"), "geometric", "Transformation must preserve the selected fabric pattern");
  const autoPatchColor = await page.locator('.visual-character-svg g[aria-label="Chromapatch"] > g').getAttribute("fill");
  assert.notEqual(autoPatchColor, "#111111", "Auto contrast must derive the emblem color from fabric rather than retain the manual color");
  assert.notEqual(autoPatchColor, "#234567", "The automatic emblem must remain distinguishable from the fabric base");
  const patchContrast = await page.locator(".visual-character-svg").evaluate((svg, patch) => {
    const lum = (hex) => { const rgb = [1,3,5].map(i => parseInt(hex.slice(i, i+2),16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4); return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]; };
    const a = lum(svg.getAttribute("data-fabric-base")), b = lum(patch);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  }, autoPatchColor);
  assert.ok(patchContrast >= 3, `Automatic Chromapatch contrast should be at least 3:1, got ${patchContrast}`);
  assert.match(await page.locator(".visual-character-svg").getAttribute("aria-label"), /trasera/i);
  prompt = await page.locator(".prompt-panel pre").innerText();
  assert.ok(prompt.includes("Visual recipe CyberStreet v3"), "The official prompt should include the visual recipe v3");
  assert.ok(prompt.includes("torso length 24/100"), "The official prompt should include parametric torso length");
  assert.ok(prompt.includes("sleeve length 92/100"), "The official prompt should include parametric sleeve length");
  assert.ok(prompt.includes("waist fit 76/100"), "The official prompt should include parametric waist fit");
  assert.ok(prompt.includes("transformed synthetic textile sheen"), "The selected NanoWear state should reach the prompt");
  const [profileDownload] = await Promise.all([page.waitForEvent("download"), page.locator(".prompt-panel .prompt-actions button").nth(2).click()]);
  const exportedProfile = JSON.parse(await readFile(await profileDownload.path(), "utf8"));
  assert.equal(exportedProfile.visual_recipe.garment_base_color, "#234567", "Export must preserve the NanoWear base color");
  assert.equal(exportedProfile.visual_recipe.garment_panel_color, "#456789", "Export must preserve the NanoWear panel color");
  assert.equal(exportedProfile.visual_recipe.garment_accent_color, "#55d9cf", "Export must preserve the technology accent");
  assert.equal(exportedProfile.visual_recipe.fabric_pattern, "geometric", "Export must preserve the fabric pattern");
  assert.equal(exportedProfile.visual_recipe.torso_length, 24, "Export must preserve torso length");
  assert.equal(exportedProfile.visual_recipe.sleeve_length, 92, "Export must preserve sleeve length");
  assert.equal(exportedProfile.visual_recipe.waist_fit, 76, "Export must preserve waist fit");
  assert.equal(await saveButton.isDisabled(), false, "A synchronized visual recipe should be saveable");

  await page.getByRole("tab", { name: /Cabello/i }).click();
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
  assert.equal(await page.locator(".style-fields select").nth(1).inputValue(), "transformation",
    "Loading a saved profile should restore its NanoWear state");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-base"), "#234567", "Loading a saved profile must restore the NanoWear base color");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-panel"), "#456789", "Loading a saved profile must restore the NanoWear panel color");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-accent"), "#55d9cf", "Loading a saved profile must restore the technology accent");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-fabric-pattern"), "geometric", "Loading a saved profile must restore the fabric pattern");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-torso-length"), "24", "Loading a saved profile must restore torso length");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-sleeve-length"), "92", "Loading a saved profile must restore sleeve length");
  assert.equal(await page.locator(".visual-character-svg").getAttribute("data-waist-fit"), "76", "Loading a saved profile must restore waist fit");
  assert.match(await page.locator(".visual-character-svg").getAttribute("aria-label"), /trasera/i,
    "Loading a saved profile should restore the selected presentation view");
  assert.equal(await page.locator(".style-fields select").nth(3).inputValue(), "fox", "Loading a saved profile should restore its Chromapatch shape");
  assert.equal(await page.locator(".style-fields input[type=color]").nth(3).inputValue(), "#111111", "Loading a saved profile should restore the selected emblem color");
  assert.equal(await page.locator(".style-range input").nth(0).inputValue(), "100",
    "Loading a saved profile should restore the saved Style Lab recipe");
  assert.equal(await arrangementSelect.inputValue(), "coleta_trenzada",
    "Loading a saved profile should restore the manually locked braided ponytail");
  assert.equal(await lengthSelect.inputValue(), selectedLengthForArrangement,
    "Loading a saved profile should restore the AUTO-selected compatible hair length");
  assert.ok(allowedLengthsForArrangement.includes(await lengthSelect.inputValue()),
    "Loaded profile should keep the hair length compatible with its locked arrangement");
  const allowedStylesForLoadedLength = catalog.categories.hairstyle
    .filter(option => option.compatible_with?.hair_length?.includes(selectedLengthForArrangement))
    .map(option => option.id);
  assert.ok(allowedStylesForLoadedLength.includes(await styleSelect.inputValue()),
    "Loaded profile should keep the hairstyle compatible with its restored hair length");

  await page.getByRole("tab", { name: /Combate/i }).click();
  assert.equal(await roleSelect.inputValue(), "tank",
    "Loading a profile should restore the manually locked combat role");
  assert.ok(allowedProps.includes(await propSelect.inputValue()),
    "Loading a profile should restore a baseball prop compatible with its combat role");
  await page.getByRole("tab", { name: /Vestuario/i }).click();
  assert.ok(allowedOutfits.includes(await outfitSelect.inputValue()),
    "Loaded profile should retain an outfit compatible with its restored combat role");
  assert.ok(allowedOuterLayers.includes(await outerLayerSelect.inputValue()),
    "Loaded profile should retain an outer layer compatible with its restored combat role");
  assert.ok(allowedFootwear.includes(await footwearSelect.inputValue()),
    "Loaded profile should retain footwear compatible with its restored combat role");
  assert.ok(allowedAccessories.includes(await accessorySelect.inputValue()),
    "Loaded profile should retain an accessory compatible with its restored combat role");

  await page.getByRole("tab", { name: /Identidad/i }).click();
  assert.equal(await speciesSelect.inputValue(), "humana",
    "Loading a saved profile must restore the manually selected species");
  await page.getByRole("tab", { name: /Anatomía/i }).click();
  assert.equal(await scalesSelect.inputValue(), "cheek_temple_scales",
    "Loading a saved profile must retain deliberately incompatible manual anatomy");

  // Restoring the example must reset selections/locks and require a fresh generation.
  await page.getByRole("button", { name: "Restaurar ejemplo", exact: true }).click();
  await page.getByText("CAMBIOS PENDIENTES", { exact: true }).waitFor({ state: "visible" });
  assert.equal(await saveButton.isDisabled(), true,
    "Saving must stay blocked after restoring an example with no matching generated snapshot");
  await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil generado por Python"),
    undefined,
    { timeout: 15000 },
  );
  await page.getByRole("tab", { name: /Identidad/i }).click();
  assert.equal(await speciesSelect.inputValue(), "draconica",
    "Restoring the example must return to the catalog-defined starting species");
  assert.ok((await speciesLock.innerText()).includes("FIJO"),
    "Restoring the example must also restore the initial lock state");
  await page.getByRole("tab", { name: /Anatomía/i }).click();
  assert.ok((await scaleLock.innerText()).includes("AUTO"),
    "Restoring the example must release the deliberately locked custom anatomy choice");
  assert.equal(await seedInput.inputValue(), "314159",
    "Restoring the example must reset the generator seed");

  // Every editor group must render correctly labelled native controls.
  for (const tabName of [
    /Identidad/i, /Cuerpo/i, /Anatomía/i, /Cara/i,
    /Cabello/i, /Vestuario/i, /Combate/i, /Detalle/i,
  ]) {
    await page.getByRole("tab", { name: tabName }).click();
    const audit = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll(".fields .field"));
      const invalid = fields.filter(field => {
        const label = field.querySelector("label[for^='trait-']");
        const control = label ? document.getElementById(label.htmlFor) : null;
        return !label?.textContent?.trim()
          || !(control instanceof HTMLSelectElement)
          || control.id !== label.htmlFor;
      }).map(field => field.querySelector("label")?.textContent?.trim() ?? "(unlabelled field)");
      return { fieldCount: fields.length, invalid };
    });
    assert.ok(audit.fieldCount > 0, `Tab ${tabName} should render its trait fields`);
    assert.deepEqual(audit.invalid, [], `Every visible field must have a connected label in tab ${tabName}`);
  }

  // Legacy profiles without a visual recipe must still load with safe defaults.
  const legacyProfile = await page.evaluate(async () => {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Legacy profile without visual recipe",
        profile: { schema_version: 1, mode: "local-engine", style_id: "bw-modern-gacha-v1", seed: 11, selections: { species: "humana" } },
      }),
    });
    if (!response.ok) throw new Error("Unable to create a legacy profile fixture");
    return response.json();
  });
  assert.ok(legacyProfile.id, "The API should save the legacy fixture independently");
  const profileDetails = page.locator(".saved-profile-panel");
  if (!(await profileDetails.evaluate(element => element.open))) await profileDetails.locator("summary").click();
  await page.locator(".refresh-profiles").click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Lista de perfiles locales actualizada"),
    undefined,
    { timeout: 10000 },
  );
  await page.locator(".saved-profile-item").filter({ hasText: "Legacy profile without visual recipe" }).click();
  await page.waitForFunction(
    () => document.querySelector(".main-footer")?.textContent?.includes("Perfil cargado con cambios no sincronizados"),
    undefined,
    { timeout: 10000 },
  );
  assert.equal(await page.locator(".style-fields select").nth(1).inputValue(), "everyday",
    "A legacy profile without visual_recipe should receive the safe NanoWear default");
  assert.equal(await page.locator(".style-fields select").nth(3).inputValue(), "bunny",
    "A legacy profile without visual_recipe should receive the safe Chromapatch default");
  assert.match(await page.locator(".visual-character-svg").getAttribute("aria-label"), /frontal/i,
    "A legacy profile without visual_recipe should default to the front presentation");

  // BIMG-ENGINE-004: capture reproducible visual QA from the real application.
  // Captures are CI artifacts, never committed as product assets.
  const visualQaDir = resolve(root, "artifacts", "visual-qa");
  await mkdir(visualQaDir, { recursive: true });
  const visualSvg = page.locator(".visual-character-svg");
  const captureVisual = async name => page.locator(".canvas").screenshot({
    path: resolve(visualQaDir, name + ".png"),
  });

  // BIMG-ENGINE-009: inspect independent body geometry with clothing and cosmetics hidden.
  const neutralStyleId = "bimg-neutral-body-qa-only";
  await page.getByRole("button", { name: "Frontal", exact: true }).click();
  await page.evaluate(styleId => {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `.visual-character-svg [data-layer-id="ground-shadow"], .visual-character-svg [data-layer-id="hair-back"], .visual-character-svg .garment-sleeves, .visual-character-svg [data-layer-id="base-sleeves"], .visual-character-svg .garment-torso-main, .visual-character-svg .garment-torso-panels, .visual-character-svg [data-layer-id="lower-body"], .visual-character-svg [data-layer-id="footwear"], .visual-character-svg [data-layer-id="outfit"], .visual-character-svg [data-layer-id="outer-layer"], .visual-character-svg [data-layer-id="surface-details"], .visual-character-svg [data-layer-id="chromapatch"], .visual-character-svg > path:not([data-layer-id]), .visual-character-svg > ellipse:not([data-layer-id]):not([fill^="url(#cw-skin-"]) { display:none !important; }`;
    document.head.appendChild(style);
    const svg = document.querySelector(".visual-character-svg");
    if (!svg) throw new Error("Neutral QA fixture could not find the rendered SVG");
    // CSS is scoped to this QA fixture; avoid inline DOM mutations that could leak into later smoke checks.
  }, neutralStyleId);
  const neutralBounds = async () => page.locator(".visual-character-svg").evaluate(svg => {
    const box = selector => {
      const element = svg.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBBox();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    };
    return {
      head: box('ellipse[fill^="url(#cw-skin-"]'),
      neck: box('[data-layer-id="neck"]'),
      arms: box(".character-arm-skin"),
      torso: box('[data-layer-id="body-base"] [data-body-region="torso"]'),
      pelvis: box('[data-layer-id="body-base"] [data-body-region="pelvis"]'),
      legs: box('[data-layer-id="body-base"] [data-body-region="legs"]'),
      feet: box('[data-layer-id="body-base"] [data-body-region="feet"]'),
    };
  });
  const neutralManifest = {
    schemaVersion: 3,
    status: "BODY_BASE_GEOMETRY_PRESENT_ART_REVIEW_REQUIRED",
    source: "VisualCharacterRenderer component rendered by Chromium against the live Vite app; QA-only CSS applied to the actual SVG DOM",
    viewBox: "0 0 340 490",
    viewport: { width: 340, height: 490, units: "SVG user units; screenshot raster is generated by Playwright" },
    captures: [],
    measurements: {},
    regionAvailability: {
      head: { status: "proxy", source: "existing head ellipse", units: "SVG user units; normalized by union height" },
      neck: { status: "proxy", source: "existing neck path", units: "SVG user units; normalized by union height" },
      shouldersAndThorax: { status: "partial_proxy", source: "body-base torso path bounding box; shoulders and thorax are not separately segmented" },
      waist: { status: "not_available_as_independent_region", reason: "No dedicated waist contour is defined independently from torso/garment seams" },
      pelvis: { status: "independent_body_base_path_bbox", source: "body-base pelvis path; bounding box is not a clinical anatomical measurement" },
      torso: { status: "independent_body_base_path_bbox", source: "body-base torso path; art review required" },
      legsAndKnees: { status: "partial_proxy", source: "body-base leg paths; knees are not isolated anatomical regions" },
      anklesAndFeet: { status: "partial_proxy", source: "feet path is independent; ankle points are landmarks rather than separately segmented contours" }
    },
    measurementMethod: "SVGGeometryElement.getBBox() on explicitly tagged body-base and skin paths; raw SVG bounds retained and normalized to union height. Boxes describe path extents, not clinical anatomical measurements.",
    limitations: [
      "The fixture hides hair, face details, garment details, outer layers, accessories, footwear and ground shadow only during capture.",
      "Torso, pelvis, legs and feet use getBodyBaseGeometry(view), independent of garment selection and fit sliders.",
      "Therefore torso, chest, waist, pelvis, leg length, knee, ankle, foot and joint-continuity values are proxies or unavailable, not observed neutral anatomy.",
      "The independent body base is a geometric foundation but requires human art review before proportion calibration.",
      "No production renderer geometry, public API, catalog, recipe or bodyLandmarks.ts values are changed by the fixture."
    ]
  };
  const applyNeutralVisibility = async () => page.locator(".visual-character-svg").evaluate(svg => {
    const marker = "data-bimg-neutral-original-style";
    const hide = element => {
      if (element.hasAttribute(marker)) return;
      const original = element.getAttribute("style");
      element.setAttribute(marker, original === null ? "__NO_STYLE__" : original);
      element.style.setProperty("display", "none", "important");
    };
    for (const selector of [
      '[data-layer-id="ground-shadow"]','[data-layer-id="hair-back"]',
      '[data-layer-id="base-sleeves"]','[data-layer-id="base-torso"]',
      '[data-layer-id="lower-body"]','[data-layer-id="footwear"]',
      '[data-layer-id="outfit"]','[data-layer-id="outer-layer"]',
      '[data-layer-id="surface-details"]','[data-layer-id="chromapatch"]',
      '.garment-sleeves','.garment-torso-main','.garment-torso-panels',
      '.character-lower-body','.character-leg-silhouette','.character-footwear-base',
    ]) for (const element of svg.querySelectorAll(selector)) hide(element);
    for (const element of Array.from(svg.children)) {
      if (element.tagName.toLowerCase() === "defs" || element.hasAttribute("data-layer-id")) continue;
      if (element.tagName.toLowerCase() === "ellipse" && (element.getAttribute("fill") ?? "").startsWith("url(#cw-skin-")) continue;
      hide(element);
    }
  });
  const restoreNeutralVisibility = async () => page.locator(".visual-character-svg").evaluate(svg => {
    const marker = "data-bimg-neutral-original-style";
    for (const element of svg.querySelectorAll("[" + marker + "]")) {
      const original = element.getAttribute(marker);
      if (original === "__NO_STYLE__") element.removeAttribute("style");
      else if (original !== null) element.setAttribute("style", original);
      element.removeAttribute(marker);
    }
  });
  for (const view of ["front", "back"]) {
    await page.getByRole("button", { name: view === "front" ? "Frontal" : "Trasera", exact: true }).click();
    const svg = page.locator(".visual-character-svg");
    await applyNeutralVisibility();
    const bounds = await neutralBounds();
    for (const part of ["head", "neck", "arms", "torso", "pelvis", "legs", "feet"]) {
      assert.ok(bounds[part] && bounds[part].width > 0 && bounds[part].height > 0,
        "Reference fixture must expose a source-rendered " + part + " path in " + view + " view");
    }
    assert.equal(await svg.getAttribute("viewBox"), "0 0 340 490",
      "Front and back captures must use the same source SVG viewBox");
    const hiddenLayerAudit = await svg.evaluate(node => {
      const hidden = selector => Array.from(node.querySelectorAll(selector)).every(el =>
        getComputedStyle(el).display === "none"
      );
      return {
        hair: hidden('[data-layer-id="hair-back"]'),
        outfit: hidden('[data-layer-id="outfit"]') && hidden(".garment-torso-main") && hidden('[data-layer-id="lower-body"]'),
        outerLayer: hidden('[data-layer-id="outer-layer"]'),
        footwear: hidden('[data-layer-id="footwear"]'),
        chromapatch: hidden('[data-layer-id="chromapatch"]'),
        bodyBaseVisible: Array.from(node.querySelectorAll('[data-layer-id="body-base"] [data-body-region]')).length === 4 && Array.from(node.querySelectorAll('[data-layer-id="body-base"] [data-body-region]')).every(el => getComputedStyle(el).display !== "none")
      };
    });
    assert.deepEqual(hiddenLayerAudit, { hair: true, outfit: true, outerLayer: true, footwear: true, chromapatch: true, bodyBaseVisible: true },
      "Cosmetic SVG layers must be explicitly hidden in the reference capture");
    const allBoxes = Object.values(bounds).filter(Boolean);
    const top = Math.min(...allBoxes.map(box => box.y));
    const bottom = Math.max(...allBoxes.map(box => box.y + box.height));
    const totalHeight = bottom - top;
    assert.ok(totalHeight > 0, "The source path union must have a positive measurable height");
    const normalized = Object.fromEntries(Object.entries(bounds).map(([part, box]) => [
      part,
      box ? {
        x_svg: box.x, y_svg: box.y, width_svg: box.width, height_svg: box.height,
        width_over_union_height: Number((box.width / totalHeight).toFixed(5)),
        y_from_union_top_over_height: Number(((box.y - top) / totalHeight).toFixed(5)),
        height_over_union_height: Number((box.height / totalHeight).toFixed(5)),
        semanticStatus: ["torso", "pelvis", "legs", "feet"].includes(part) ? "independent_body_base_path_bbox" : "source_path_bbox_proxy",
        confidence: ["torso", "pelvis", "legs", "feet"].includes(part) ? "geometry_extent_only_requires_art_review" : "low_to_medium_for_path_extent_only"
      } : null
    ]));
    const name = "neutral-body-" + view;
    await svg.evaluate(el => { const fixture = el.closest(".legacy-renderer-fixture"); if (!fixture) throw new Error("Missing isolated legacy renderer QA fixture"); fixture.style.opacity = "1"; });
    await svg.screenshot({ path: resolve(visualQaDir, name + ".png") });
    await svg.evaluate(el => { const fixture = el.closest(".legacy-renderer-fixture"); if (fixture) fixture.style.opacity = "0"; });
    await restoreNeutralVisibility();
    neutralManifest.captures.push(name + ".png");
    neutralManifest.measurements[view] = {
      sourceBoundsSvgUnits: bounds,
      normalization: { top_svg: top, bottom_svg: bottom, height_svg: totalHeight, formula: "(value in SVG user units) / union of measured path-bounds height" },
      normalizedPathBounds: normalized,
      layerAudit: hiddenLayerAudit
    };
  }
  await writeFile(resolve(visualQaDir, "neutral-body-manifest.json"), JSON.stringify(neutralManifest, null, 2));
  await page.evaluate(styleId => document.getElementById(styleId)?.remove(), neutralStyleId);
  await page.getByRole("button", { name: "Frontal", exact: true }).click();
  const setVisualRange = async (label, value) => {
    const slider = page.locator('input[type="range"][aria-label="' + label + '"]');
    await slider.evaluate((element, nextValue) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(element, String(nextValue));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await page.waitForFunction(({ label, value }) => {
      const input = document.querySelector('input[type="range"][aria-label="' + label + '"]');
      return input && Number(input.value) === value;
    }, { label, value });
  };

  await page.getByRole("tab", { name: /Vestuario/i }).click();
  const qaOutfitLock = page.locator('label[for="trait-outfit"]').locator("xpath=../..").locator("button.lock");
  const qaOuterLayerLock = page.locator('label[for="trait-outer_layer"]').locator("xpath=../..").locator("button.lock");
  if (await outfitSelect.isDisabled()) await qaOutfitLock.click();
  if (await outerLayerSelect.isDisabled()) await qaOuterLayerLock.click();
  await outfitSelect.selectOption("street_bomber");
  await outerLayerSelect.selectOption("none");
  await page.getByRole("button", { name: "Frontal", exact: true }).click();
  await page.locator(".style-fields select").nth(1).selectOption("everyday");
  await page.locator(".style-fields select").nth(4).selectOption("chest");

  await setVisualRange("Largo del torso", 0);
  const bomberShortD = await page.locator(".street-bomber-shell").getAttribute("d");
  const bomberShortBox = await page.locator(".street-bomber-shell").evaluate(node => node.getBBox().height);
  const bomberPatchYShort = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-y"));
  const bomberPatchScaleShort = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-scale"));
  assert.ok(bomberPatchScaleShort <= .65, "Chromapatch must shrink deterministically when the bomber hem is very short");
  const lowerBodyPaintOrder = await page.locator(".character-lower-body").evaluate((lowerBody) => {
    const shell = document.querySelector(".street-bomber-shell");
    return !!shell && !!(lowerBody.compareDocumentPosition(shell) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(lowerBodyPaintOrder, true, "The final bomber shell must paint above the lower-body surface it overlaps");
  await captureVisual("01-street-bomber-torso-short");
  await setVisualRange("Largo del torso", 50);
  const bomberMidD = await page.locator(".street-bomber-shell").getAttribute("d");
  assert.notEqual(bomberMidD, bomberShortD, "The visible bomber hem must change at torso_length=50");
  await setVisualRange("Largo del torso", 100);
  const bomberLongD = await page.locator(".street-bomber-shell").getAttribute("d");
  const bomberLongBox = await page.locator(".street-bomber-shell").evaluate(node => node.getBBox().height);
  const bomberPatchYLong = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-y"));
  const bomberPatchScaleLong = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-scale"));
  assert.notEqual(bomberLongD, bomberShortD, "The visible bomber shell must change at torso_length=100");
  assert.ok(bomberLongBox > bomberShortBox, "The long bomber shell must have a greater visible hem extent");
  assert.ok(bomberPatchYLong > bomberPatchYShort, "The chest Chromapatch must follow the bomber hem as its length changes");
  assert.ok(bomberPatchScaleLong > bomberPatchScaleShort, "Chromapatch size must recover as the garment gains enough chest area");
  await captureVisual("02-street-bomber-torso-long");

  await outerLayerSelect.selectOption("short_bomber");
  await captureVisual("03-outer-short-bomber");
  const shortLayerBox = await page.locator(".garment-layer.short-bomber").evaluate(node => node.getBBox().height);
  const outerPaintOrder = await page.locator(".street-bomber-shell").evaluate(baseOutfit => {
    const outerLayer = document.querySelector(".garment-layer.short-bomber");
    return !!outerLayer && !!(baseOutfit.compareDocumentPosition(outerLayer) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(outerPaintOrder, true, "The outer bomber must paint above the selected base street_bomber outfit");
  const shortOuterSleeveCount = await page.locator(".garment-layer.outer-layer-sleeves").count();
  assert.equal(shortOuterSleeveCount, 1, "A short bomber outer layer must render its own sleeves above the base sleeves");
  const shortSleevePaintOrder = await page.locator(".garment-sleeves").evaluate(baseSleeves => {
    const outerSleeves = document.querySelector(".garment-layer.outer-layer-sleeves");
    return !!outerSleeves && !!(baseSleeves.compareDocumentPosition(outerSleeves) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(shortSleevePaintOrder, true, "Outer-layer sleeves must paint after base sleeves");
  await outerLayerSelect.selectOption("long_coat");
  await captureVisual("04-outer-long-coat");
  const longLayerBox = await page.locator(".garment-layer.long-coat path").first().evaluate(node => node.getBBox().height);
  assert.ok(longLayerBox > shortLayerBox, "The long coat must extend farther than the short bomber outer layer");
  assert.equal(await page.locator(".garment-layer.outer-layer-sleeves").count(), 1,
    "A long coat must retain its own visible outer sleeves");
  await outerLayerSelect.selectOption("none");
  assert.equal(await page.locator(".garment-layer.outer-layer-sleeves").count(), 0,
    "The none outer-layer ID must not draw an extra sleeve layer");

  await outerLayerSelect.selectOption("none");
  await setVisualRange("Largo de mangas", 0);
  const sleeveShortD = await page.locator(".garment-sleeves path").first().getAttribute("d");
  const sleeveShortBox = await page.locator(".garment-sleeves path").first().evaluate(node => node.getBBox().height);
  await captureVisual("05-sleeves-short");
  await setVisualRange("Largo de mangas", 50);
  const sleeveMidD = await page.locator(".garment-sleeves path").first().getAttribute("d");
  assert.notEqual(sleeveMidD, sleeveShortD, "Sleeve geometry must change at sleeve_length=50");
  await setVisualRange("Largo de mangas", 100);
  const sleeveLongD = await page.locator(".garment-sleeves path").first().getAttribute("d");
  const sleeveLongBox = await page.locator(".garment-sleeves path").first().evaluate(node => node.getBBox().height);
  assert.notEqual(sleeveLongD, sleeveShortD, "Sleeve endpoints must change the final sleeve geometry");
  assert.ok(sleeveLongBox > sleeveShortBox, "Long sleeves must visibly extend farther down the arms");
  await captureVisual("06-sleeves-long");

  await setVisualRange("Ajuste de cintura", 0);
  const waistFittedWidth = await page.locator(".garment-torso-main").evaluate(node => node.getBoundingClientRect().width);
  await captureVisual("07-waist-fitted");
  await setVisualRange("Ajuste de cintura", 100);
  const waistLooseWidth = await page.locator(".garment-torso-main").evaluate(node => node.getBoundingClientRect().width);
  assert.ok(waistLooseWidth > waistFittedWidth, "Loose waist fit must widen the final torso surface without replacing the garment");
  await captureVisual("08-waist-loose");

  await setVisualRange("Largo del torso", 50);
  await setVisualRange("Ajuste de cintura", 50);
  await page.locator(".style-fields select").nth(4).selectOption("chest");
  await captureVisual("09-chromapatch-chest-front");
  await page.getByRole("button", { name: "Trasera", exact: true }).click();
  await captureVisual("10-chromapatch-chest-back");
  await page.getByRole("button", { name: "Frontal", exact: true }).click();
  await page.locator(".style-fields select").nth(4).selectOption("sleeve");
  assert.equal(await page.locator(".chromapatch-anchor").getAttribute("data-effective-position"), "sleeve",
    "Sleeve Chromapatch must anchor to an available sleeve");
  const sleeveAnchorY = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-y"));
  assert.ok(sleeveAnchorY >= 285 && sleeveAnchorY <= 335,
    "Sleeve Chromapatch anchor must track the current sleeve length");
  await captureVisual("11-chromapatch-sleeve");

  await outerLayerSelect.selectOption("none");
  await page.locator(".style-fields select").nth(4).selectOption("hood");
  assert.equal(await page.locator(".chromapatch-anchor").getAttribute("data-effective-position"), "chest",
    "A hood emblem must fall back to chest when no hood exists");
  await page.getByText(/no tiene capucha/i).waitFor({ state: "visible" });
  await outerLayerSelect.selectOption("hooded_jacket");
  assert.equal(await page.locator(".chromapatch-anchor").getAttribute("data-effective-position"), "hood",
    "A hood emblem must anchor to the actual hood when present");
  await captureVisual("12-chromapatch-hood");

  await outerLayerSelect.selectOption("none");
  await page.locator(".style-fields select").nth(4).selectOption("chest");
  await page.locator(".style-fields select").nth(1).selectOption("everyday");
  await captureVisual("13-nanowear-everyday");
  await page.locator(".style-fields select").nth(1).selectOption("transformation");
  await captureVisual("14-nanowear-transformation");
  const qaManifest = {
    source: "real BotImagen web app; .canvas captured by Chromium",
    seed: "314159",
    outfit: "street_bomber",
    captures: [
      "01-street-bomber-torso-short.png", "02-street-bomber-torso-long.png",
      "03-outer-short-bomber.png", "04-outer-long-coat.png",
      "05-sleeves-short.png", "06-sleeves-long.png",
      "07-waist-fitted.png", "08-waist-loose.png",
      "09-chromapatch-chest-front.png", "10-chromapatch-chest-back.png",
      "11-chromapatch-sleeve.png", "12-chromapatch-hood.png",
      "13-nanowear-everyday.png", "14-nanowear-transformation.png",
    ],
    note: "CI artifact only, not product artwork. Capture generation does not constitute independent artistic sign-off.",
  };
  await writeFile(resolve(visualQaDir, "manifest.json"), JSON.stringify(qaManifest, null, 2));
  assert.equal(await visualSvg.getAttribute("data-nanowear"), "transformation",
    "The final QA capture should preserve the selected transformation NanoWear state");


  // BIMG-ENGINE-005: cross-validate every currently declared garment capability.
  // Each value is checked on the selected garment surface, not only on the generic torso.
  const matrixCaptureNames = [];
  const torsoMatrix = [
    ["outfit", "tactical_baseball", ".tactical-baseball"],
    ["outfit", "combat_jacket", ".combat-jacket"],
    ["outfit", "techwear_sport", ".techwear-sport"],
    ["outfit", "street_bomber", ".street-bomber-shell"],
    ["outfit", "support_coat", ".support-coat"],
    ["outfit", "baseball_tech_suit", ".baseball-tech-suit"],
    ["outfit", "elegant_command", ".elegant-command"],
    ["outer", "short_bomber", ".short-bomber"],
    ["outer", "hooded_jacket", ".hooded-jacket"],
    ["outer", "long_coat", ".long-coat"],
    ["outer", "chaqueta_corta_asimetrica", ".asymmetric-short-jacket"],
  ];
  const sleeveMatrix = [
    ["outfit", "tactical_baseball", ".garment-sleeves path"],
    ["outfit", "combat_jacket", ".garment-sleeves path"],
    ["outfit", "techwear_sport", ".garment-sleeves path"],
    ["outfit", "street_bomber", ".garment-sleeves path"],
    ["outfit", "support_coat", ".garment-sleeves path"],
    ["outfit", "baseball_tech_suit", ".garment-sleeves path"],
    ["outer", "short_bomber", ".garment-layer.outer-layer-sleeves path"],
    ["outer", "hooded_jacket", ".garment-layer.outer-layer-sleeves path"],
    ["outer", "long_coat", ".garment-layer.outer-layer-sleeves path"],
    ["outer", "chaqueta_corta_asimetrica", ".garment-layer.outer-layer-sleeves path"],
    ["outer", "mangas_desmontables", ".detachable-sleeves"],
  ];
  const selectMatrixGarment = async (kind, id) => {
    if (kind === "outfit") {
      await outerLayerSelect.selectOption("none");
      await outfitSelect.selectOption(id);
    } else {
      await outfitSelect.selectOption("street_bomber");
      await outerLayerSelect.selectOption(id);
    }
  };
  const boxMetrics = async selector => page.locator(selector).first().evaluate(node => {
    const b = node.getBoundingClientRect();
    return { x: b.x, y: b.y, width: b.width, height: b.height, area: b.width * b.height };
  });
  const sliderEnabled = async label => page.locator('input[type="range"][aria-label="' + label + '"]').isEnabled();

  for (const [kind, id, selector] of torsoMatrix) {
    await selectMatrixGarment(kind, id);
    assert.equal(await sliderEnabled("Largo del torso"), true, id + " must enable torso length");
    assert.equal(await sliderEnabled("Ajuste de cintura"), true, id + " must enable waist fit");
    const torsoBoxes = [];
    for (const value of [0, 50, 100]) {
      await setVisualRange("Largo del torso", value);
      torsoBoxes.push(await boxMetrics(selector));
      if (value === 0 || value === 100) {
        const name = "matrix-torso-" + id.replace(/[^a-z0-9]+/gi, "-") + "-" + value;
        await captureVisual(name);
        matrixCaptureNames.push(name + ".png");
      }
    }
    assert.ok(torsoBoxes[0].height < torsoBoxes[1].height && torsoBoxes[1].height < torsoBoxes[2].height,
      id + " selected garment surface must grow monotonically at torso_length 0/50/100");
    const waistBoxes = [];
    for (const value of [0, 50, 100]) {
      await setVisualRange("Ajuste de cintura", value);
      waistBoxes.push(await boxMetrics(selector));
    }
    assert.ok(waistBoxes[0].width < waistBoxes[1].width && waistBoxes[1].width < waistBoxes[2].width,
      id + " selected garment surface must widen monotonically at waist_fit 0/50/100");
  }

  for (const [kind, id, selector] of sleeveMatrix) {
    await selectMatrixGarment(kind, id);
    assert.equal(await sliderEnabled("Largo de mangas"), true, id + " must enable sleeve length");
    const sleeveBoxes = [];
    for (const value of [0, 50, 100]) {
      await setVisualRange("Largo de mangas", value);
      sleeveBoxes.push(await boxMetrics(selector));
      if (value === 0 || value === 100) {
        const name = "matrix-sleeves-" + id.replace(/[^a-z0-9]+/gi, "-") + "-" + value;
        await captureVisual(name);
        matrixCaptureNames.push(name + ".png");
      }
    }
    assert.ok(sleeveBoxes[0].height < sleeveBoxes[1].height && sleeveBoxes[1].height < sleeveBoxes[2].height,
      id + " selected sleeve surface must grow monotonically at sleeve_length 0/50/100");
  }
  await selectMatrixGarment("outfit", "elegant_command");
  assert.equal(await sliderEnabled("Largo de mangas"), false,
    "elegant_command must not promise sleeve length because it is not in the canonical sleeve capability set");
  const matrixManifest = {
    source: "real BotImagen web app rendered in Chromium",
    seed: "314159",
    checks: "All declared torso, waist and sleeve capabilities at 0/50/100 on selected garment surfaces",
    captures: matrixCaptureNames,
    note: "CI QA artifact only. Bounding-box checks are geometry evidence, not independent artistic sign-off.",
  };
  await writeFile(resolve(visualQaDir, "matrix-manifest.json"), JSON.stringify(matrixManifest, null, 2));

  // BIMG-ENGINE-005 visual slice: same character/camera, distinct garment structures.
  const sliceCaptures = [];
  const layerOrderChecks = [];
  const captureSliceGarment = async (kind, id, view, fit, state = "everyday") => {
    if (kind === "outfit") {
      await outerLayerSelect.selectOption("none");
      await outfitSelect.selectOption(id);
    } else {
      await outfitSelect.selectOption("street_bomber");
      await outerLayerSelect.selectOption(id);
    }
    await page.getByRole("button", { name: view === "front" ? "Frontal" : "Trasera" }).click();
    await setVisualRange("Largo del torso", fit);
    await page.getByLabel("Estado NanoWear").selectOption(state);
    const domLayers = await page.locator("svg.visual-character-svg").evaluate(svg =>
      Array.from(svg.querySelectorAll("[data-layer-id][data-layer-order]"), element => ({
        id: element.getAttribute("data-layer-id"),
        order: Number(element.getAttribute("data-layer-order")),
      }))
    );
    assert.ok(domLayers.length >= 12, "The real SVG DOM should expose the expected anatomy/garment paint layers");
    assert.ok(domLayers.every(entry => entry.id && Number.isInteger(entry.order)),
      "Every painted layer marker must expose a semantic ID and numeric order");
    assert.ok(domLayers.every((entry, index) => index === 0 || entry.order >= domLayers[index - 1].order),
      "Real SVG child paint order must be non-decreasing according to the declared layer contract: " + domLayers.map(entry => entry.id + ":" + entry.order).join(" -> "));
    const requiredPaintLayers = ["ground-shadow", "hair-back", "neck", "arm-skin", "hands", "base-sleeves", "base-torso", "lower-body", "footwear", "outfit", "chromapatch"];
    assert.ok(requiredPaintLayers.every(layer => domLayers.some(entry => entry.id === layer)),
      "The SVG DOM must expose all required layers: " + requiredPaintLayers.filter(layer => !domLayers.some(entry => entry.id === layer)).join(", "));
    if (kind === "outer") {
      assert.ok(domLayers.some(entry => entry.id === "outer-layer"),
        "A selected outer garment must appear after the base outfit in the actual SVG DOM");
    }
    layerOrderChecks.push({ kind, id, view, fit, state, paintOrder: domLayers.map(entry => entry.id) });
    const name = "visual-slice-" + id.replace(/[^a-z0-9]+/gi, "-") + "-" + view + "-fit-" + fit + "-" + state;
    await captureVisual(name);
    sliceCaptures.push(name + ".png");
  };
  for (const [kind, id] of [["outfit", "street_bomber"], ["outfit", "tactical_baseball"], ["outer", "long_coat"]]) {
    for (const view of ["front", "back"]) {
      for (const fit of [0, 50, 100]) await captureSliceGarment(kind, id, view, fit);
    }
  }
  await captureSliceGarment("outfit", "street_bomber", "front", 50, "transformation");
  await captureSliceGarment("outfit", "tactical_baseball", "front", 50, "nanoweave");
  const sliceManifest = {
    source: "unmodified BotImagen app rendered in Chromium",
    sameCharacterAndViewport: true,
    garments: ["street_bomber", "tactical_baseball", "long_coat"],
    views: ["front", "back"],
    torsoFitValues: [0, 50, 100],
    nanowearStates: ["everyday", "nanoweave", "transformation"],
    captures: sliceCaptures,
    layerOrderChecks,
    domLayerOrderValidated: true,
    layerOrderNote: "For each captured garment/view/fit, the actual SVG DOM paint sequence is checked against non-decreasing semantic layer order.",
    note: "Real application screenshots; capture and geometry assertions do not constitute independent aesthetic approval.",
  };
  await writeFile(resolve(visualQaDir, "visual-slice-manifest.json"), JSON.stringify(sliceManifest, null, 2));

  // Product-facing screenshots use only the Python SVG rendered in the main canvas.
  const productImage = page.locator("img.server-character-art");
  const selectProductView = async (view, label) => {
    if ((await productImage.getAttribute("data-rendered-view")) === view) return;
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForFunction(expected => document.querySelector("img.server-character-art")?.getAttribute("data-rendered-view") === expected, view);
  };
  await page.getByLabel("Preset de personaje").selectOption("street-sentinel");
  await page.getByRole("button", { name: "Aplicar preset", exact: true }).click();
  await page.waitForFunction(() => {
    const image = document.querySelector("img.server-character-art");
    return image?.dataset.renderedHair === "violeta_profundo"
      && image.dataset.renderedOutfit === "street_bomber"
      && image.dataset.renderedView === "front";
  });
  await page.getByLabel("Fondo del estudio").selectOption("cyber-grid");
  await page.waitForFunction(() => document.querySelector(".canvas")?.getAttribute("data-studio-background") === "cyber-grid");
  const cyberGridBackgroundStyle = await page.locator(".studio-background").evaluate(el => getComputedStyle(el).backgroundImage);
  await selectProductView("front", "Frontal");
  await page.screenshot({ path: resolve(visualQaDir, "product-studio-front-cyber-grid.png"), fullPage: true });
  await selectProductView("back", "Trasera");
  await page.getByLabel("Fondo del estudio").selectOption("dusk-orbit");
  await page.waitForFunction(() => document.querySelector(".canvas")?.getAttribute("data-studio-background") === "dusk-orbit");
  const duskOrbitBackgroundStyle = await page.locator(".studio-background").evaluate(el => getComputedStyle(el).backgroundImage);
  await page.screenshot({ path: resolve(visualQaDir, "product-studio-back-dusk-orbit.png"), fullPage: true });
  await page.getByLabel("Preset de personaje").selectOption("neon-archivist");
  await page.getByRole("button", { name: "Aplicar preset", exact: true }).click();
  await page.waitForFunction(() => {
    const image = document.querySelector("img.server-character-art");
    return image?.dataset.renderedHair === "turquesa"
      && image.dataset.renderedOutfit === "elegant_command"
      && image.dataset.renderedView === "front";
  });
  await page.getByLabel("Fondo del estudio").selectOption("aurora-city");
  await page.waitForFunction(() => document.querySelector(".canvas")?.getAttribute("data-studio-background") === "aurora-city");
  const auroraCityBackgroundStyle = await page.locator(".studio-background").evaluate(el => getComputedStyle(el).backgroundImage);
  await selectProductView("front", "Frontal");
  await page.screenshot({ path: resolve(visualQaDir, "product-studio-neon-archivist-front.png"), fullPage: true });
  await selectProductView("back", "Trasera");
  await page.screenshot({ path: resolve(visualQaDir, "product-studio-neon-archivist-back.png"), fullPage: true });

  // Exercise actual face/hair controls on the visible Python-rendered character.
  // Each capture is made only after the returned SVG data URI changes.
  const selectVisualTrait = async (id, value) => {
    const field = page.locator('label[for="trait-' + id + '"]').locator("xpath=../..");
    const lock = field.locator("button.lock");
    if ((await lock.innerText()).includes("AUTO")) await lock.click();
    const select = field.locator("select");
    const before = await productImage.getAttribute("src");
    await select.selectOption(value);
    assert.equal(await select.inputValue(), value, "The requested art control value must be selected: " + id + "=" + value);
    try {
      await page.waitForFunction(
        previous => document.querySelector("img.server-character-art")?.getAttribute("src") !== previous,
        before,
        { timeout: 2500 },
      );
    } catch {
      // Some locked controls only mark the draft as pending. Explicitly request a
      // render so this visual capture proves the selected state reached Python.
      await page.getByRole("button", { name: /Generar perfil con motor local/i }).click();
      await page.waitForFunction(
        previous => document.querySelector("img.server-character-art")?.getAttribute("src") !== previous,
        before,
        { timeout: 15000 },
      );
    }
  };
  await selectProductView("front", "Frontal");
  await page.getByRole("tab", { name: /Cara/i }).click();
  await selectVisualTrait("face_shape", "diamante");
  await selectVisualTrait("nose_style", "puente_recto");
  await page.screenshot({ path: resolve(visualQaDir, "art-face-diamond-straight-bridge.png"), fullPage: true });
  await page.getByRole("tab", { name: /Cabello/i }).click();
  await selectVisualTrait("hairstyle", "long_straight");
  await selectVisualTrait("hair", "rosa_chicle");
  await page.screenshot({ path: resolve(visualQaDir, "art-long-straight-pink.png"), fullPage: true });
  await selectVisualTrait("hair_length", "extra_largo");
  await page.screenshot({ path: resolve(visualQaDir, "art-long-straight-extra-long.png"), fullPage: true });

  const productStudioManifest = {
    source: "Live BotImagen React app with POST /api/render/character SVG as the only visible character renderer",
    sourceSha: process.env.GITHUB_SHA ?? "UNAVAILABLE",
    renderer: "parametric-anime-svg-v1",
    baselineReference: {
      sha: "5ef17beb774f17d5ae57ada655c949343cee92aa",
      workflowRun: "https://github.com/jonhararagi/botimagen/actions/runs/38248523028",
      note: "Prior product capture artifact is the before-reference; current artifact contains the after-captures.",
    },
    presets: ["street-sentinel", "neon-archivist"],
    backgrounds: ["cyber-grid", "dusk-orbit", "aurora-city"],
    captures: [
      "product-studio-front-cyber-grid.png",
      "product-studio-back-dusk-orbit.png",
      "product-studio-neon-archivist-front.png",
      "product-studio-neon-archivist-back.png",
      "art-face-diamond-straight-bridge.png",
      "art-long-straight-pink.png",
      "art-long-straight-extra-long.png",
    ],
    exercisedControls: ["face_shape=diamante", "nose_style=puente_recto", "hairstyle=long_straight", "hair=rosa_chicle", "hair_length=extra_largo"],
    legacyRenderer: "Hidden QA fixture only; not part of the visible product preview",
    physicalWindowsQA: "NOT_RUN",
  };
  await writeFile(resolve(visualQaDir, "product-studio-manifest.json"), JSON.stringify(productStudioManifest, null, 2));
  assert.equal(await page.locator(".canvas").getAttribute("data-studio-background"), "aurora-city", "The local background picker must update the actual studio canvas");
  assert.notEqual(cyberGridBackgroundStyle, duskOrbitBackgroundStyle, "Selecting a different bundled background must change the actual canvas image");
  assert.notEqual(duskOrbitBackgroundStyle, auroraCityBackgroundStyle, "The third bundled background must render a distinct canvas image");
  assert.ok(
    auroraCityBackgroundStyle.includes("data:image/svg+xml")
      || auroraCityBackgroundStyle.includes("127.0.0.1:5173/assets/"),
    "The selected background must resolve to a bundled local SVG (inlined data URI or local Vite asset), not a remote image",
  );
  assert.equal(await page.locator(".legacy-renderer-fixture").evaluate(el => getComputedStyle(el).opacity), "0", "The legacy React renderer must be visually transparent outside explicit QA capture, not a second visible character");
  assert.equal(await page.locator("img.server-character-art").getAttribute("data-renderer"), "parametric-anime-svg-v1", "The visible product character must come from the local Python renderer");

  // Exercise the packaged CyberStreet SVG layers through the real editor and local API.
  const cyberstreet = page.locator(".modular-composer");
  await cyberstreet.scrollIntoViewIfNeeded();
  await cyberstreet.waitFor({ state: "visible", timeout: 15000 });
  const cyberstreetPreview = cyberstreet.locator('img[alt="Personaje CyberStreet compuesto con capas SVG reales"]');
  await cyberstreetPreview.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(() => {
    const image = document.querySelector('.modular-composer img[alt="Personaje CyberStreet compuesto con capas SVG reales"]');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth === 512 && image.naturalHeight === 768;
  }, null, { timeout: 15000 });
  await cyberstreet.screenshot({ path: resolve(visualQaDir, "cyberstreet-modular-full.png") });
  const hairToggle = cyberstreet.locator(".modular-layer-toggle").filter({ hasText: "Cabello cyan" }).locator('input[type="checkbox"]');
  assert.equal(await hairToggle.isChecked(), true, "CyberStreet hair should be enabled initially");
  const fullLayerImage = await cyberstreetPreview.getAttribute("src");
  await hairToggle.uncheck();
  await page.waitForFunction(previous => {
    const image = document.querySelector('.modular-composer img[alt="Personaje CyberStreet compuesto con capas SVG reales"]');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth === 512 && image.src !== previous;
  }, fullLayerImage, { timeout: 15000 });
  assert.equal(await hairToggle.isChecked(), false, "Disabling hair must update the real composition");
  await cyberstreet.screenshot({ path: resolve(visualQaDir, "cyberstreet-modular-no-hair.png") });
  await cyberstreet.getByRole("button", { name: "Guardar perfil" }).click();
  await page.getByRole("status").filter({ hasText: "Perfil guardado en el almacenamiento local del motor" }).waitFor({ timeout: 15000 });
  const profileSelect = cyberstreet.locator("select").first();
  await profileSelect.waitFor({ state: "visible" });
  const savedProfileOption = await profileSelect.locator("option").evaluateAll(options => options.find(option => option.value && option.textContent?.includes("Mi personaje CyberStreet"))?.value || "");
  assert.ok(savedProfileOption, "The modular profile should be persisted through the existing profile API");
  await hairToggle.check();
  await profileSelect.selectOption(savedProfileOption);
  const imageBeforeRestore = await cyberstreetPreview.getAttribute("src");
  await cyberstreet.getByRole("button", { name: "Restaurar perfil" }).click();
  await page.waitForFunction(previous => {
    const image = document.querySelector('.modular-composer img[alt="Personaje CyberStreet compuesto con capas SVG reales"]');
    const hair = [...document.querySelectorAll(".modular-layer-toggle")].find(el => el.textContent?.includes("Cabello cyan"))?.querySelector('input[type="checkbox"]');
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth === 512 && image.src !== previous && hair instanceof HTMLInputElement && !hair.checked;
  }, imageBeforeRestore, { timeout: 15000 });
  assert.equal(await hairToggle.isChecked(), false, "Restoring the saved profile must restore the saved hair selection");
  await cyberstreet.getByRole("button", { name: "Exportar PNG" }).click();
  await page.waitForFunction(() => {
    const status = document.querySelector('.modular-composer [role="status"]');
    return status?.textContent?.includes("PNG exportado con fondo transparente") ?? false;
  }, null, { timeout: 15000 });

  // Exercise PNG-to-stage conversion, linked source metadata, and the real modular compositor.
  const assetLibrary = page.locator(".modular-library");
  await assetLibrary.scrollIntoViewIfNeeded();
  const syntheticDataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 480;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas fixture is unavailable");
    context.fillStyle = "#f7f7f7"; context.fillRect(0, 0, 320, 480);
    context.fillStyle = "#e6a4ce"; context.fillRect(118, 75, 84, 72);
    context.fillStyle = "#477be0"; context.fillRect(105, 155, 110, 160);
    context.fillStyle = "#30364b"; context.fillRect(115, 310, 35, 125); context.fillRect(170, 310, 35, 125);
    context.fillStyle = "#22283a"; context.fillRect(102, 435, 52, 15); context.fillRect(164, 435, 52, 15);
    return canvas.toDataURL("image/png");
  });
  const syntheticBuffer = Buffer.from(syntheticDataUrl.split(",")[1], "base64");
  const uploadSynthetic = async () => {
    await assetLibrary.locator('input[type="file"]').setInputFiles({
      name: "qa-synthetic-character.png", mimeType: "image/png", buffer: syntheticBuffer,
    });
  };
  const prepareAndSaveMaterial = async () => {
    await uploadSynthetic();
    await assetLibrary.getByRole("button", { name: "Preparar PNG 512 × 768" }).click();
    const convertedPreview = assetLibrary.getByRole("img", { name: "PNG normalizado de qa-synthetic-character.png 512 por 768" });
    await convertedPreview.waitFor({ timeout: 15000 });
    const alphaCheck = await convertedPreview.evaluate(async image => {
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 768;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("Canvas alpha check unavailable");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, 512, 768).data;
      return { width: image.naturalWidth, height: image.naturalHeight, cornerAlpha: pixels[3], centerAlpha: pixels[(384 * 512 + 256) * 4 + 3] };
    });
    assert.deepEqual([alphaCheck.width, alphaCheck.height], [512, 768], "Converted images must use the shared transparent stage");
    assert.equal(alphaCheck.cornerAlpha, 0, "Connected flat background should be transparent after conversion");
    assert.ok(alphaCheck.centerAlpha > 0, "The character silhouette must remain visible after conversion");
    await assetLibrary.getByRole("button", { name: "Guardar material convertido" }).click();
    await page.waitForFunction(() =>
      document.querySelector('[data-testid="modular-library-status"]')?.textContent?.includes("material(es) convertido(s)") ?? false,
      null, { timeout: 15000 },
    );
  };

  await prepareAndSaveMaterial();
  const completeCharacter = assetLibrary.locator('.modular-asset-list article[data-asset-kind="full_character"]')
    .filter({ hasText: "qa-synthetic-character" });
  await completeCharacter.waitFor({ timeout: 15000 });
  await assetLibrary.getByLabel("Tipo de recurso").selectOption("modular_piece");
  await assetLibrary.getByLabel("Clasificación de la imagen").selectOption("body");
  await prepareAndSaveMaterial();
  const modularBody = assetLibrary.locator('.modular-asset-list article[data-asset-kind="modular_piece"]')
    .filter({ hasText: "qa-synthetic-character" }).filter({ hasText: "body" });
  await modularBody.waitFor({ timeout: 15000 });
  await modularBody.locator('input[type="checkbox"]').check();
  await assetLibrary.getByRole("button", { name: /Componer selección \(1\)/ }).click();
  await page.waitForFunction(() =>
    Boolean(document.querySelector('[data-testid="modular-compose-status"]')?.textContent?.trim()),
    null, { timeout: 15000 },
  );
  const actualComposeStatus = (await assetLibrary.locator('[data-testid="modular-compose-status"]').textContent())?.trim() ?? "";
  assert.ok(
    actualComposeStatus.includes("Composición real lista"),
    `Imported composition failed: ${actualComposeStatus || "(empty status)"}`,
  );
  const importedComposition = assetLibrary.getByRole("img", { name: "Composición PNG de piezas modulares importadas" });
  await importedComposition.waitFor({ timeout: 15000 });
  const composedDimensions = await importedComposition.evaluate(async image => { await image.decode(); return [image.naturalWidth, image.naturalHeight]; });
  assert.deepEqual(composedDimensions, [512, 768], "The imported modular pieces must compose through the existing Python engine");
  console.log("PASS_REAL: PNG converter normalized source art to 512×768, removed the connected flat background, preserved the original source, registered estimated rig anchors, and composed a body piece through the real local API.");

  // Smoke the responsive breakpoints used by the local browser UI.
  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      mainWidth: document.querySelector(".main")?.getBoundingClientRect().width ?? 0,
    }));
    assert.ok(
      layout.documentWidth <= layout.viewportWidth,
      `Horizontal overflow at viewport ${width}px: document=${layout.documentWidth}, main=${layout.mainWidth}`,
    );
    assert.ok(
      await page.getByRole("button", { name: /Generar perfil con motor local/i }).isVisible(),
      `The generate action should remain visible at viewport ${width}px`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  assert.deepEqual(pageErrors, [], "The page should not raise uncaught JavaScript errors");

  console.log("PASS_REAL: Chromium verified the manifest-backed asset contract endpoint, recoverable API errors, strict seeds, catalog compatibility, manual overrides and persistence, restore-example recovery, labelled controls across all eight tabs, 320-1024px responsive layouts, and no page errors.");
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
