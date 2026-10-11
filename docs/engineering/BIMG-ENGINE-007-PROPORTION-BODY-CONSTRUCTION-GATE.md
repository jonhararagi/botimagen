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
