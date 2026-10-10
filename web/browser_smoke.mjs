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

  // Exercise the real UI -> Vite proxy -> Python importer rejection path.
  await page.locator("#asset-png-file").setInputFiles({
    name: "invalid.png",
    mimeType: "image/png",
    buffer: Buffer.from("not a PNG image"),
  });
  await page.getByRole("button", { name: /Importar PNG validado/i }).click();
  await page.getByRole("alert").filter({ hasText: "firma PNG válida" }).waitFor({ state: "visible", timeout: 10000 });
  assert.equal(await page.getByText(/Importación confirmada por el servidor/i).count(), 0,
    "The UI must not claim import success when the API rejects invalid PNG bytes");

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
