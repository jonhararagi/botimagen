# BIMG-ENGINE-006 · Character Base & Anatomy Quality Pass

## Scope and baseline

- Branch: `feature/bimg-engine-001-cyberstreet-visual-renderer`
- PR: [#11](https://github.com/jonhararagi/botimagen/pull/11), remains open and unmerged.
- Baseline HEAD audited: `481952e0023a6ac75b03976d36cf07fa19744715`.
- Baseline exact-head CI: [run 38061803846](https://github.com/jonhararagi/botimagen/actions/runs/38061803846), success. Its existing garment QA artifact is [11673866081](https://github.com/jonhararagi/botimagen/actions/runs/38061803846/artifacts/11673866081). This is baseline evidence, not ENGINE-006 acceptance.

## Defects identified from source and prior real captures

- The face used two small circular eye ellipses, minimal brow strokes, no nose bridge/tip cue, and a nearly flat mouth.
- Arms were long angular polygons with abrupt forearm-to-wrist endings; no explicit hand silhouettes existed.
- The rear view reused a front-like hair cap rather than a differentiated rear hair mass.
- Torso, clothing and limbs rely on one fixed coordinate system, so this pass deliberately avoids changing garment IDs, fit formulas, recipe schema, Chromapatch anchors, or NanoWear composition.

## Changes in this pass

- Reworked the front face into larger anime-style eye shapes with sclera, irises, highlights, more expressive brows, a subtle nose cue, and a shaped expression-dependent mouth.
- Refined arm/forearm contours and added visible hand silhouettes for front and rear views.
- Preserved existing hair/skin/eye customization inputs and all canonical outfit/outer-layer mappings.
- This is a constrained SVG anatomy pass, not rigging, 3D anatomy, or a claim of commercial character-art quality.

## Verification status

- Source changes committed on the existing PR branch; exact-head CI and its fresh screenshot artifact must be checked before acceptance is decided.
- Do not infer a successful build, Chromium run, or visual improvement solely from the source edit.
- `WINDOWS_MANUAL_QA: NOT_RUN`.
- Status remains `PARTIAL` until fresh front/back captures of all three required garments are inspected and residual issues are recorded.

## TIMER

Planning estimate supplied for this task: 8–12 hours. Actual elapsed time was not measured.
