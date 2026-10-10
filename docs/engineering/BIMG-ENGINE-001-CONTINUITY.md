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
