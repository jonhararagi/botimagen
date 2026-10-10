import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
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
  const [profileDownload] = await Promise.all([page.waitForEvent("download"), page.locator(".prompt-actions button").nth(2).click()]);
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
  await captureVisual("01-street-bomber-torso-short");
  await setVisualRange("Largo del torso", 50);
  const bomberMidD = await page.locator(".street-bomber-shell").getAttribute("d");
  assert.notEqual(bomberMidD, bomberShortD, "The visible bomber hem must change at torso_length=50");
  await setVisualRange("Largo del torso", 100);
  const bomberLongD = await page.locator(".street-bomber-shell").getAttribute("d");
  const bomberLongBox = await page.locator(".street-bomber-shell").evaluate(node => node.getBBox().height);
  assert.notEqual(bomberLongD, bomberShortD, "The visible bomber shell must change at torso_length=100");
  assert.ok(bomberLongBox > bomberShortBox, "The long bomber shell must have a greater visible hem extent");
  await captureVisual("02-street-bomber-torso-long");

  await outerLayerSelect.selectOption("short_bomber");
  await captureVisual("03-outer-short-bomber");
  const shortLayerBox = await page.locator(".garment-layer.short-bomber").evaluate(node => node.getBBox().height);
  await outerLayerSelect.selectOption("long_coat");
  await captureVisual("04-outer-long-coat");
  const longLayerBox = await page.locator(".garment-layer.long-coat path").first().evaluate(node => node.getBBox().height);
  assert.ok(longLayerBox > shortLayerBox, "The long coat must extend farther than the short bomber outer layer");

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
  await page.locator(".style-fields select").nth(4).selectOption("sleeve");
  assert.equal(await page.locator(".chromapatch-anchor").getAttribute("data-effective-position"), "sleeve",
    "Sleeve Chromapatch must anchor to an available sleeve");
  const sleeveAnchorY = Number(await page.locator(".chromapatch-anchor").getAttribute("data-anchor-y"));
  assert.ok(sleeveAnchorY >= 285 && sleeveAnchorY <= 335,
    "Sleeve Chromapatch anchor must track the current sleeve length");
  await captureVisual("10-chromapatch-sleeve");
  await page.getByRole("button", { name: "Trasera", exact: true }).click();
  await captureVisual("11-chromapatch-back");
  await page.getByRole("button", { name: "Frontal", exact: true }).click();

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
      "09-chromapatch-chest-front.png", "10-chromapatch-sleeve.png",
      "11-chromapatch-back.png", "12-chromapatch-hood.png",
      "13-nanowear-everyday.png", "14-nanowear-transformation.png",
    ],
    note: "CI artifact only, not product artwork. Capture generation does not constitute independent artistic sign-off.",
  };
  await writeFile(resolve(visualQaDir, "manifest.json"), JSON.stringify(qaManifest, null, 2));
  assert.equal(await visualSvg.getAttribute("data-nanowear"), "transformation",
    "The final QA capture should preserve the selected transformation NanoWear state");

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
