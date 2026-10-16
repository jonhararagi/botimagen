# BIMG-ENGINE-001 · Continuidad de implementación

## Baseline verificado

- Repositorio: `jonhararagi/botimagen`.
- Base remota usada: `main` en `46bc7e702ae5d608927345991b5c4f0a661318a9`.
- Rama creada desde ese SHA: `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- Los PR #8, #9 y #10 se mantienen separados. No se trabajó en sus ramas.
- No se modificó `main`.

## Trabajo incorporado en esta rama

- Renderizador SVG original y receta visual v2 con migración v1 determinista.
- Style Lab para Anime, Toon, equilibrio Streetwear/Cyberpunk y densidad de detalle.
- NanoWear: `everyday`, `nanoweave`, `transformation`; acabados textil, técnico y sintético, colores base/panel/acento y patrones `plain`, `circuit`, `geometric`, `gradient`.
- Chromapatch con cinco símbolos, color, ubicación, modo de contraste y vista frontal/trasera.
- Integración de la receta con generación Python y contrato API opcional retrocompatible.
- Pruebas Python nuevas y smoke test Chromium ampliado para paleta, patrón, transformación y persistencia v2.
- Mapeos SVG diferenciados para los diez IDs oficiales de `outfit`, `outer_layer` y `footwear`; `none` no añade capa exterior.
- Documentación técnica y README web actualizados.

## Evidencia verificada y pendiente

- GitHub Actions `Validate BotImagen` [run 38051068349](https://github.com/jonhararagi/botimagen/actions/runs/38051068349): **SUCCESS**.
- Pasaron `py_compile`, las pruebas Python existentes, el nuevo contrato `visual_recipe`, `npm ci`, `npm run build` y el smoke test de Chromium headless que cubre Style Lab, NanoWear, Chromapatch, contraste automático, vista trasera y persistencia de receta.
- No se ejecutaron pruebas locales porque el entorno no pudo resolver `github.com` al clonar el repositorio.
- La prueba física de Chrome/Edge en Windows sigue pendiente. El resultado CI permite registrar la validación automatizada, pero no afirma una verificación física ni completa de la calidad artística.

## Preservación

No añadir recursos de terceros ni dependencias npm. No modificar el catálogo de rasgos, reglas de afinidad, semilla ni campos manuales/AUTO salvo que un fallo concreto lo exija. Mantener la API local loopback. No fusionar el PR automáticamente. Los próximos estilos Pixel Art y Anime 3D deben conservar pipelines separados del renderizador CyberStreet.


## BIMG-ENGINE-002 · Estado de la ampliación

- Receta normalizada `schema_version: 2`; API acepta v1 y v2 y migra v1 en memoria con defaults deterministas.
- Chromapatch auto calcula tono complementario desde el color base real de nanotela, busca contraste ≥3:1 y mantiene el color manual cuando corresponde.
- El renderizador usa `useId` para evitar colisiones de IDs SVG entre instancias.
- Pendiente hasta completar CI: validar resultado del smoke Chromium sobre el HEAD final, comprobar la migración/persistencia real y actualizar la descripción del PR #11.
- Windows Chrome/Edge manual: pendiente, no sustituido por CI Linux.


## BIMG-ENGINE-003 · Estado incremental

- Estado de trabajo: controles paramétricos de torso, mangas y cintura añadidos al Style Lab y conectados a geometría SVG real en piezas compatibles.
- Receta actual: v3. Defaults de migración desde v1/v2: `torso_length=80`, `sleeve_length=60`, `waist_fit=50`. El API rechaza valores que no sean enteros de 0 a 100 y rechaza campos desconocidos por versión.
- Mantener independientes los IDs oficiales de catálogo, los parámetros de geometría y la receta NanoWear/Chromapatch. No convertir un largo ajustado en otro ID de prenda ni perder paleta/material.
- Validación automatizada requerida en la CI asociada al HEAD final: Python compile + pruebas del generador/API, migraciones v1/v2, `npm ci`, `npm run build` y Chromium. El smoke test compara los atributos `d` de las rutas SVG y verifica exportación/carga de la receta completa.
- Revisión manual de Chrome/Edge en Windows: PENDIENTE hasta ejecución física. No declarar aceptación completa solo con CI Linux.
- Próxima revisión visual: contrastar bomber corto vs abrigo largo, mangas cortas vs largas y cintura entallada vs holgada; revisar que la ubicación del Chromapatch siga siendo legible tras el ajuste.
- No añadir dependencias, assets externos ni pipelines 3D. Mantener PR #11 abierto y sin fusionar; no tocar `main` ni PR #8/#9/#10.
- TIMER de BIMG-ENGINE-003: 4–7 horas estimadas; tiempo real no medido.

 
## BIMG-ENGINE-004 · Visual garment QA

- Current scope: fix the street bomber hem clamp, make sleeve endpoints visually legible, add piece-aware Chromapatch fallback/anchors, and exercise the real editor in Chromium.
- The renderer exposes semantic markers for the final base torso, sleeve, outer-layer and Chromapatch surfaces. These are QA hooks, not new catalog IDs or product mechanics.
- The browser smoke suite captures 14 reproducible .canvas screenshots into artifacts/visual-qa/ and asserts the bomber shell at torso lengths 0/50/100, short-vs-long outer-layer extents, sleeves at 0/50/100, waist silhouette width, sleeve/hood fallback, front/back placement and everyday/transformation states.
- GitHub Actions uploads the screenshot set as botimagen-visual-garment-qa for 14 days. Generated screenshots are CI evidence only and must not be committed as product artwork.
- Status: PASS_VISUAL_GARMENT_QA for the headless Chromium scope. CI run 38057689613 passed on code HEAD 0148ec8a80b755f7506faf55ea625bc3e25f0fee; all 14 captures were inspected. The review found and corrected an oversized Chromapatch on the minimum-length bomber, with a regression assertion for hem-aware scaling. WINDOWS_MANUAL_QA: NOT_RUN; headless Chromium is not represented as physical Windows validation or an assertion of production illustration polish.
- Preserve PR #11 as open/unmerged, leave main and PR #8/#9/#10 untouched, and do not expand the garment catalog during this task.
- TIMER: 3–5 hours estimated; actual elapsed time not measured.

- The outer-layer composition block now follows the base outfit block; outer jacket sleeves are drawn after base sleeves, while outer_layer=none emits no extra sleeve surface.


## BIMG-ENGINE-005 · Garment capability matrix

- Cross-checked the current canonical capability sets against the actual SVG surfaces used by the Style Lab controls. Kept existing outfit/layer IDs and the v3 recipe contract unchanged.
- Parameterized the previously fixed tactical_baseball, elegant_command, and baseball_tech_suit overlay hems; gave techwear_sport an explicit fitted garment surface; made hooded_jacket render a torso shell as well as its hood; parameterized chaqueta_corta_asimetrica; and tied mangas_desmontables hem endpoints to sleeve_length.
- Reduced the base garment hem mapping to 315 + torso_length * 0.35 so the selected garment stays within the visible character silhouette while retaining monotonic 0/50/100 variation. Long-coat length remains independently driven by coatHem.
- Added Chromium matrix checks for all 11 IDs that declare torso/waist fit and all 11 IDs that declare sleeve length. Each applicable control is checked at 0, 50 and 100 against the selected garment's transformed bounding rectangle. Matrix captures are generated for endpoint values and written to artifacts/visual-qa/ with matrix-manifest.json.
- elegant_command intentionally does not enable sleeve length; the test confirms that the control remains disabled for this sleeveless catalog ID. none retains its existing meaning and no IDs were added.
- The geometry matrix is automated evidence, not a claim of independent art-direction approval. WINDOWS_MANUAL_QA: NOT_RUN unless a physical Windows review is separately performed.
- TIMER: 4–6 hours estimated; actual elapsed time not measured.


### BIMG-ENGINE-005 · Validation result

- Matrix result: PASS_MATRIX for the declared capability contract. Chromium tested all 11 torso/waist-capable IDs and all 11 sleeve-capable IDs at 0, 50 and 100 on selected garment surfaces; the disabled sleeve control for elegant_command is also asserted.
- Successful Chromium run before this documentation-only status entry: https://github.com/jonhararagi/botimagen/actions/runs/38059452763. Its capture artifact contains 58 PNGs plus the base and matrix manifests: https://github.com/jonhararagi/botimagen/actions/runs/38059452763/artifacts/11672242529.
- The 22 endpoint capture pairs (11 torso/waist IDs, 11 sleeve IDs) were compared as rendered PNGs. Every pair differed in 5,040–15,028 pixels, confirming a rendered-output difference in addition to the geometry assertions. Representative captures were visually inspected; no obvious detached sleeves or floating Chromapatch appeared in the reviewed contact sheet and selected full-size captures.
- The matrix confirms parameter response, not full artistic polish for every combination. WINDOWS_MANUAL_QA: NOT_RUN. Re-run CI after this documentation commit to bind final validation to the final PR head.


## BIMG-ENGINE-007-R1A-REMOTE-01 · 2026-10-11

- HEAD BEFORE: `51e6515ec4ce65bbc930f2c1bfbe0b71b9ca03b0`.
- PR #11 confirmado abierto y sin fusionar; `main` permanece en `b508cfe7d3216eda801438d46dff8873842cea86` al preflight remoto.
- Cambio funcional: landmarks tipados compartidos para el `viewBox` 340×490; `VisualCharacterRenderer.tsx` usa el modelo para generar la ruta del torso y el contorno del cuello. Contrato de capas conectado a elementos SVG con `data-layer-order`.
- Prueba nueva: `tests/test_visual_body_landmarks.py`; añadida al workflow `Validate BotImagen`. CI #314 `SUCCESS` sobre `9b8f9a69465c5b21e2a3d43fd29ad94674c42365`: prueba nueva, contratos existentes, `npm ci`, build y smoke Chromium. Artefacto visual generado; inspeccionadas seis capturas comparables a fit 50; los extremos 0/100 están incluidos pero no todos se revisaron individualmente.
- Se preservan receta v3, migraciones v1/v2, controles de ajuste, NanoWear, Chromapatch y los IDs de las prendas; esta entrega no rediseña todavía la silueta completa.
- `WINDOWS_MANUAL_QA: NOT_RUN`. TIMER: 4–6 horas estimadas; tiempo real `NOT_MEASURED`.
- Progreso ponderado conservado en 63%; esta migración parcial no completa por sí sola una fase de beta.


## BIMG-ENGINE-009-R5 · 2026-10-16 · ejecución y límites verificados

- Rama autorizada: `feature/bimg-engine-001-cyberstreet-visual-renderer`. HEAD de código antes de esta nota: `8cd7bf7bef322f2a5ea26a0b0ef412158ba54f2a`. No se modifica `main`, no se crea otra rama y no se fusiona el PR.
- CI #808 (`4de5807511efcc31868fdb93f459e4c11d2d359d`) falló en Chromium: la superficie de `combat_jacket` no crecía de forma monótona con `torso_length`.
- Corrección funcional: commit `6f49ea6def5ea42e28cc046afd1681b85f03cc2b`, detalles y paneles inferiores de `combat_jacket` ligados al dobladillo dinámico en vez de coordenadas Y fijas. CI #809 terminó SUCCESS en ese SHA: https://github.com/jonhararagi/botimagen/actions/runs/38918832400.
- Evidencia visual real de CI #809: artefacto `botimagen-visual-garment-qa`, ID `12052909188`, accesible durante su retención de 14 días: https://github.com/jonhararagi/botimagen/actions/runs/38918832400/artifacts/12052909188. Contiene capturas Chromium de variantes de torso y mangas, perfiles, importación y exportación.
- Inspección de PNG exportado `cyberstreet-export-verified.png`: 512×768, RGBA, alfa mínimo 0/máximo 255, 323507 píxeles totalmente transparentes y contenido no transparente dentro del lienzo. La prueba E2E también confirma perfil guardado, restauración, variante independiente y persistencia tras recarga.
- Inspección visual manual del artefacto frente a `references/dataset-cuerpos/12.png` (referencia frontal principal), con `15.png` y `4.png` documentadas como controles de pose: **la anatomía SVG actual todavía no satisface la aceptación**. La figura renderizada tiene una cabeza relativamente sobredimensionada, torso y extremidades demasiado rígidos y una pose de brazos más vertical que la referencia. Los landmarks actuales son una adaptación aproximada, no una calibración anatómica verificada. No declarar PASS anatómico.
- Regresión añadida en `web/browser_smoke.mjs`, commit `8cd7bf7bef322f2a5ea26a0b0ef412158ba54f2a`: la matriz de prendas comprueba que seleccionar ropa y cambiar longitud/ajuste no muta los paths canónicos del cuerpo. CI #810 se ejecuta sobre este SHA: https://github.com/jonhararagi/botimagen/actions/runs/38919648421.
- Estado honesto de R5: **PARTIAL**. Renderizador, perfiles, exportación alfa y matriz automatizada de prendas verificados; la comparación visual revela que falta una revisión anatómica real del cuerpo completo y sus anclajes. WINDOWS_MANUAL_QA: NOT_RUN. TIMER efectivo: NOT_MEASURED por las herramientas disponibles.
- Siguiente trabajo autorizado: recalibrar conjuntamente cabeza/cuello/hombros/torso/pelvis/miembros con las referencias visualmente inspeccionadas, y después volver a revisar las variantes de prendas, sin deformar el cuerpo para acomodar una prenda. Mantener la separación cuerpo/prendas y exigir CI sobre el SHA final.
