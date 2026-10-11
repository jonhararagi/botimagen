# BIMG-ENGINE-007 · Proportion & Body Construction Gate

## Gate decision

**Status: PARTIAL · STOP LOCAL GEOMETRY PATCHES AND REFACTOR THE VISUAL MODEL BEFORE ANATOMY REWORK.**

This task was deliberately stopped before another isolated SVG anatomy pass. The current renderer's fixed-coordinate construction makes a convincing, taller six-to-seven-head anime silhouette difficult to achieve safely without adding exceptions across shared body, garment, face, and layer paths. A small head-scale adjustment alone would not satisfy the acceptance criteria and could disconnect face/hair features or worsen garment alignment.

## Baseline and branch

- PR: [#11](https://github.com/jonhararagi/botimagen/pull/11), still open and unmerged.
- Branch: `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- Initial HEAD checked remotely: `9ad084ceb8b932471a5b758287d5eac962c7ecb8`.
- The PR base is `main`; this task did not modify `main`, merge, or close the PR.
- Existing independent PRs #8, #9 and #10 were not changed.
- Exact-head validation of the initial HEAD: [CI run #298](https://github.com/jonhararagi/botimagen/actions/runs/38113415194), success. The prior ENGINE-006 source commit also passed [CI run #297](https://github.com/jonhararagi/botimagen/actions/runs/38113409058).

## Real screenshot inspection

Inspected the PNG captures from artifact [botimagen-visual-garment-qa, artifact 11692960040](https://github.com/jonhararagi/botimagen/actions/runs/38113409058/artifacts/11692960040), produced by headless Chromium against the actual application after ENGINE-006.

Observed composition-level defects:

- The head occupies a large fraction of the full figure, while the torso and lower body read as a compact, nearly chibi silhouette rather than a taller anime character.
- The shoulder-to-neck transition is abrupt; the arm contours remain narrow and angular, and hand forms read as mitten-like silhouettes at the delivered screenshot scale.
- The pelvis, legs and shoes are assembled from a few rigid polygons. The shoes do not yet read as a coherent continuation of the ankles and feet.
- The back view is not yet a complete anatomical counterpart. The head/hair mass obscures most of the rear head and the visible body silhouette is still schematic.
- The three garments remain visually distinguishable, but their construction is anchored to the same narrow torso and fixed shoulder/arm coordinates. Changing the body proportions first would risk detached sleeves, inconsistent hems, and incorrect Chromapatch placement.
- ENGINE-006's improved eyes and facial marks remain legible in the front view. That improvement does not compensate for the proportions of the complete figure.

The captures are evidence of the current baseline and defects, not evidence that ENGINE-007 has improved the art. No before/after result is claimed for this task.

## Technical findings

`web/src/visual/VisualCharacterRenderer.tsx` mixes several responsibilities in one large JSX tree:

- anatomy and hair paths use fixed coordinates;
- garment paths independently repeat the same shoulder, sleeve, waist, and hem landmarks;
- the lower body and each footwear ID use hard-coded polygon coordinates;
- layer order is encoded by JSX position rather than a documented anatomy/garment composition contract;
- torso fit, sleeve length, waist transform and Chromapatch anchor formulas are coupled to the existing coordinate system.

This architecture is functional for a parametric SVG MVP, but it does not yet provide a stable proportion model. Scaling only the head, stretching the legs, or moving isolated landmarks would create more special cases and would not establish coherent anatomy.

## Recommended controlled refactor

Before another visual-art implementation pass, split the renderer into small SVG component/functions within the existing renderer module (or adjacent internal modules if that keeps the public API stable):

1. **Canonical body landmarks:** define named coordinates for head bounds, neck base, shoulder joints, chest, waist, pelvis, elbow, wrist, hip, knee, ankle, hand and foot. Use a taller target proportion as the default design constraint; review the full figure rather than enforcing a mechanical head count.
2. **Body silhouette model:** create one front and one back anatomy shape from those landmarks. Keep the rear silhouette anatomically consistent while making back hair, shoulder blades and garment backs distinct.
3. **Layer contract:** render back hair; rear anatomy; torso/limbs; clothing base and inner garment; outer panels and sleeves; hands/feet where they should overlap; emblem/details; then front head/face/hair. Explicitly document which layers cover wrists, hips, and ankles for each garment.
4. **Garment adapters:** retain all canonical IDs and give `street_bomber`, `tactical_baseball`, and `long_coat` distinct shape adapters tied to shared landmarks, not copied fixed coordinates. Keep recipe schema, saved values, NanoWear, material settings, and Chromapatch inputs unchanged.
5. **Footwear profiles:** preserve existing IDs but provide a shared ankle/foot join and per-style toe/sole silhouettes.
6. **Regression fixtures:** capture all three garments front/back using identical selections and colors; exercise torso length 0/50/100 where supported. Add geometry assertions for landmark continuity, layer ordering, non-empty render, hem ranges, sleeve endpoints, and Chromapatch anchoring. Compare real screenshots visually after every meaningful pass.

Do not create a second renderer, replace the editor, introduce external art/dependencies, or claim commercial-grade quality. Keep the public `VisualCharacterRenderer` and `VisualStyleLab` APIs stable.

## Verification

- Python syntax, asset manifest, character generator, seeded reproducibility, visual style contract, local API bridge, editor field coverage, CyberStreet recipe contract, web build, and Chromium smoke all passed in CI run #297 for the ENGINE-006 source head.
- The latest remote PR head at audit time, including the documentation-only ENGINE-006 commit, passed CI run #298.
- Artifact 11692960040 was downloaded and actual PNGs inspected. It includes front/back and fit matrix captures; it does not constitute an ENGINE-007 after-state.
- A new post-refactor screenshot matrix has **not** been generated.
- Local source edits for proportion reconstruction: none in this gate.
- `WINDOWS_MANUAL_QA: NOT_RUN`.

## Residual status

**PARTIAL.** The requested body redesign is not implemented. The current silhouette remains too schematic and proportionally compact for acceptance. The evidence supports refactoring the visual model first rather than spending another round on local SVG path adjustments.

## TIMER

Planning estimate remains **8–12 hours** for the reconstruction, compatibility across three garments, test coverage, screenshot capture and visual review. Actual elapsed time was not measured.


## R1A · Foundation of shared anatomy and layer contract · 2026-10-11

**Status: BLOCKED_BEFORE_CODE_CHANGE.** The requested renderer refactor was not started. The mandatory safe-sync gate could not be completed with the available repository operations, so this record deliberately preserves the current renderer and its history rather than making edits on a stale branch.

### Baseline checked

- `main` HEAD observed: `b508cfe7d3216eda801438d46dff8873842cea86` ([commit](https://github.com/jonhararagi/botimagen/commit/b508cfe7d3216eda801438d46dff8873842cea86)).
- Shared merge base reported by GitHub compare: `46bc7e702ae5d608927345991b5c4f0a661318a9`.
- PR #11 branch: `feature/bimg-engine-001-cyberstreet-visual-renderer`; last evidenced source/documentation commit consulted: `0bfc5c2dde3476d78fd556e29c12462cbb989236` ([commit](https://github.com/jonhararagi/botimagen/commit/0bfc5c2dde3476d78fd556e29c12462cbb989236)).
- GitHub compare reports the feature branch diverged from main with 98 branch-only commits and 2 main-only commits. The two main-side commits since the merge base are `17adad8fc62e5b24f77b05219d25d112b2b57f6c` (dataset README) and `b508cfe7d3216eda801438d46dff8873842cea86` (dataset PNG upload). The renderer branch therefore needs a real non-destructive merge of current main before implementation.
- The PR #11 and PR #12 search results both still identify their existing PRs. PR #12 remains separate and was not changed or merged.

### Why implementation stopped

The available GitHub file operations can create commits that replace individual files, but they do not provide a verified merge operation for bringing main's two commits into this diverged feature branch. A fast-forward ref update is not possible across divergence; force-pushing or manually rebuilding the branch tree would risk losing shared history or dataset assets. In accordance with the task's safety gate, no renderer source, tests, catalog, recipes, or dataset files were edited.

### R1A result

- Canonical landmarks: **NOT_IMPLEMENTED**.
- Effective semantic layer contract: **NOT_IMPLEMENTED**.
- Front/back garment matrix and before/after screenshots: **NOT_RUN**.
- Existing baseline evidence remains the prior ENGINE-005 CI and artifacts; it is not R1A validation.
- `WINDOWS_MANUAL_QA: NOT_RUN`.
- Public renderer API, catalog IDs, recipe schema, profiles, controls, and original PNGs were not changed by this blocked attempt.
- Beta progress remains **63%**; no weighted functional capability was completed.

### Safe resume procedure

1. Use a Git operation that can merge `main` into `feature/bimg-engine-001-cyberstreet-visual-renderer` with a normal merge commit, preserving both parents and all existing commits.
2. Verify the resulting branch contains `b508cfe7d3216eda801438d46dff8873842cea86` in its ancestry and confirm all 16 `references/dataset-cuerpos/*.png` files and their hashes remain unchanged.
3. Re-fetch the branch HEAD, PR #11/#12 status, renderer, smoke tests, and CI status.
4. Only then begin R1A implementation in small tested slices.

### TIMER

- Initial estimate supplied: **4–8 hours**.
- Actual elapsed time: **NOT_MEASURED**.
- R1A implementation time consumed: **0 hours of code implementation**; time spent on remote inspection is not reliably timed.
- Revised estimate after safe synchronization: **4–8 hours** for landmarks, effective layer contract, garment/control regression coverage, comparable screenshots, and exact-head CI. Increase if merge conflicts or visual regressions appear.
- R1B estimate remains **NOT_RELIABLY_ESTIMABLE** until R1A and its screenshots are validated; provisional planning window **1–3 concentrated days**, to be recalculated from the real implementation delta.


## R1A · primera migración estructural (2026-10-11)

- Se introduce `web/src/visual/bodyLandmarks.ts` como modelo tipado compartido en el `viewBox` real de 340×490. Los puntos iniciales corresponden a coordenadas observadas en los paths existentes; torso y cuello ya consumen landmarks, y el largo de torso/ajuste de cintura siguen derivando de `hemY` y `waistHalf` de recipe v3.
- `SVG_LAYER_ORDER` es consumido por elementos SVG mediante `data-layer-order`; la prueba nueva comprueba la secuencia semántica expuesta por el contrato y la presencia de sus consumidores en el renderer.
- La migración es intencionalmente incremental: no sustituye las geometrías de `street_bomber`, `tactical_baseball` ni `long_coat`; conserva sus rutas originales. CI #314 sobre `9b8f9a69465c5b21e2a3d43fd29ad94674c42365`: `SUCCESS`, incluido build TypeScript/Vite y smoke Chromium. Artefacto `botimagen-visual-garment-qa` generado; inspección manual de seis capturas comparables front/back a fit 50 confirmó que se conservan las siluetas diferenciadas y la estructura actual. Las capturas de extremos 0/100 están en el mismo artefacto, pero no todas fueron revisadas una por una.
- `WINDOWS_MANUAL_QA: NOT_RUN`.
- TIMER de esta entrega: 4–6 horas estimadas; tiempo real `NOT_MEASURED`.


## R1A-REMOTE-02 · Migración de extremidades y verificación de pintura DOM (2026-10-11)

**Estado: PARTIAL · cambios funcionales publicados y CI PASS; reconstrucción anatómica completa pendiente.**

### Cambios funcionales

- `web/src/visual/VisualCharacterRenderer.tsx`: el trazado de brazos consume hombros, codos, muñecas, manos y puntos de pecho del modelo compartido. Las manos frontales y posteriores se posicionan mediante anclas de landmarks.
- La silueta de pelvis y piernas consume landmarks de pelvis, rodillas y tobillos; los puntos de rodilla se interpolan sobre las aristas existentes para conservar la geometría visual previa mientras la fuente de coordenadas queda centralizada.
- La forma base del calzado consume landmarks de tobillos y pies. Los perfiles específicos de cada calzado siguen conservando sus propios detalles y varias rutas de estilo continúan siendo coordenadas dedicadas.
- Se añadió `data-layer-id` a las raíces de las prendas principales y capas exteriores para que el contrato semántico de capas pueda verificarse en el SVG renderizado.
- `web/browser_smoke.mjs` ahora lee en Chromium la secuencia real de `[data-layer-id][data-layer-order]` para cada captura de la matriz frontal/posterior y comprueba que los índices de pintura no retrocedan. También verifica las capas obligatorias y la presencia de `outer-layer` en la captura con `long_coat`.
- `tests/test_visual_body_landmarks.py` valida el consumo de landmarks en extremidades, pelvis, piernas y calzado, así como la comprobación E2E del orden de pintura del DOM.

### Persistencia y validación

- HEAD BEFORE: `ba07e789f1d2491f0f4a024e87b2b6f460ccf8f1`.
- Primer commit funcional: [`66b3470`](https://github.com/jonhararagi/botimagen/commit/66b3470cc38696f73412144fe27532628d769925). Su CI #381518 detectó correctamente que la raíz de `street_bomber` no exponía una capa `outfit`; por tanto, el smoke test falló y no se presentó como PASS.
- Corrección: [`9613bca`](https://github.com/jonhararagi/botimagen/commit/9613bca14f730c8357aaf9054c2a374615f079e9) etiqueta las raíces de todas las prendas y capas exteriores principales.
- HEAD funcional validado: [`9613bca14f730c8357aaf9054c2a374615f079e9`](https://github.com/jonhararagi/botimagen/commit/9613bca14f730c8357aaf9054c2a374615f079e9).
- CI exacta: [run #38152019549](https://github.com/jonhararagi/botimagen/actions/runs/38152019549), `SUCCESS`, incluido test Python, build Vite/TypeScript, smoke Chromium y generación del artefacto visual.
- Artefacto generado: [botimagen-visual-garment-qa · 81 archivos](https://github.com/jonhararagi/botimagen/actions/runs/38152019549/artifacts/11706434232). El artefacto está disponible para revisión; no se declara aquí una inspección artística individual de todos sus PNG.

### Lo que permanece pendiente

- Las rutas de brazo y pierna conservan una silueta cercana a la base previa; aún no se afirma una mejora artística completa de la anatomía.
- La vista posterior sigue siendo esquemática y los calzados individuales todavía tienen rutas específicas fuera de la parametrización común.
- El smoke E2E verifica el orden de los elementos etiquetados del DOM para los escenarios capturados; no sustituye una revisión artística ni la validación física en Windows.
- `WINDOWS_MANUAL_QA: NOT_RUN`.
- Progreso global ponderado: **63%**, sin incremento porque la beta local no ha cerrado una nueva fase ponderada.
- TIMER de la entrega: 4–6 horas estimadas; tiempo real `NOT_MEASURED`.


## Revisión visual acotada del artefacto R1A-REMOTE-02 (2026-10-11)

Se descargó el artefacto real `botimagen-visual-garment-qa` del run #38152019549 y se inspeccionó una matriz de contacto de seis capturas generadas por Chromium: vista frontal y posterior de `street_bomber`, `tactical_baseball` y `long_coat`, todas con torso fit 50 y estado everyday.

Observaciones limitadas a esas seis capturas:

- Las tres construcciones de prenda siguen siendo distinguibles en vista frontal y posterior.
- La figura completa conserva una proporción compacta/chibi; la cabeza ocupa una fracción grande respecto del torso y las piernas.
- La vista posterior continúa esquemática, con la masa de cabello cubriendo casi toda la cabeza posterior y poca lectura anatómica de la espalda.
- La forma de brazos y manos es legible en silueta general, pero sigue siendo simple; la unión pierna-tobillo-calzado aún necesita más continuidad visual.

Esta revisión confirma que el refactor estructural y el smoke E2E no equivalen a una aprobación artística ni demuestran por sí solos una mejora significativa de proporciones. Solo se inspeccionó una matriz de seis imágenes; no se declara que se hayan revisado individualmente los 81 archivos del artefacto.

Evidencia: [CI #38152019549](https://github.com/jonhararagi/botimagen/actions/runs/38152019549) · [artefacto QA](https://github.com/jonhararagi/botimagen/actions/runs/38152019549/artifacts/11706434232). Siguiente prioridad: un pase de re-proporción de silueta compartida, después de decidir un objetivo de proporciones con referencias visuales adecuadas.
