# BIMG-ENGINE-005 · CyberStreet visual overhaul

**Status:** implementation in progress; aesthetic acceptance is pending exact-head CI artifact inspection. This task targets the three requested silhouettes without changing catalog IDs, API contracts, recipe schema, or generator compatibility.

## Baseline audit

- PR #11 was open, unmerged, mergeable, based on main; audited head: 0bfc5c2dde3476d78fd556e29c12462cbb989236.
- Existing CI evidence covered geometry capability checks and 58 captures, but did not by itself prove that the three target garments read as distinct designs.
- The renderer used one shared torso and sleeve surface beneath garment variants. street_bomber had limited jacket construction detail; tactical_baseball had a small torso overlay. long_coat primarily drew two side panels. The NanoWear/synthetic fabric gradient could end in pure white, overpowering the original palette in transformation state.
- The previous exact-head artifact remains the baseline; it must not be modified or presented as new output.

## Scope

- Improve the original SVG renderer with garment-specific seams, closures, pockets/panels and rear-view construction for the bomber, tactical baseball jacket and long coat.
- Keep catalog mappings and fallback rendering for other garments.
- Preserve the selected base/panel/accent palette in NanoWear transformation and constrain gloss to highlights.
- Expand real Chromium screenshots for all three garments at front/back and fit endpoints, uploaded through the existing CI artifact workflow.

## Verification and acceptance

- CI keeps existing Python/API/recipe/build/Chromium checks and adds capture coverage for the three requested garments.
- PASS_VISUAL_SLICE is justified only after inspecting the exact-head artifact and confirming distinct silhouettes front and rear. If CI fails, the artifact is incomplete, or inspection is unavailable, report PARTIAL.
- WINDOWS_MANUAL_QA: NOT_RUN unless physical Chrome/Edge validation on Windows is actually performed.

## Limits

This remains an original 2D SVG prototype. It does not simulate cloth, rigging, or 3D depth; automated screenshot differences cannot independently certify commercial-grade art direction.

## TIMER

Planned estimate: 6–10 hours. Actual elapsed time is not measured.

## Captures added

The existing CI artifact now includes visual-slice-manifest.json plus real Chromium screenshots for street_bomber, tactical_baseball, and long_coat, front and rear, torso fit 0/50/100, plus NanoWear nanoweave and transformation examples. Artifact generation is not equivalent to visual acceptance; inspect the exact run artifact.


## First exact-head artifact inspection

CI run 38061347842 succeeded and uploaded 81 files, including the 20 new visual-slice captures. The first inspection found two genuine presentation defects that are being corrected in a follow-up: bomber patch pockets became malformed at torso fit 0 because the crop left no room for them, and the long coat read too much like a mid-length jacket at the default fit. The low-fit bomber now suppresses pockets when there is insufficient garment height, and the coat hem range is extended. Because the initial artifact exposed these issues, the acceptance state remains PARTIAL until the follow-up run is inspected.

- Initial implementation CI: https://github.com/jonhararagi/botimagen/actions/runs/38061347842
- Initial artifact: https://github.com/jonhararagi/botimagen/actions/runs/38061347842/artifacts/11673321986
- WINDOWS_MANUAL_QA: NOT_RUN.


## Follow-up exact-head visual review

- Follow-up code commit: 808ad1f67969d5fbd499d84a7f34874dd0037115.
- Exact-head CI: https://github.com/jonhararagi/botimagen/actions/runs/38061573243 — success. Python syntax, asset manifest, generator/reproducibility/style/API/editor/recipe tests, React+TypeScript build, and Chromium smoke passed. The workflow uploaded artifact https://github.com/jonhararagi/botimagen/actions/runs/38061573243/artifacts/11673715909 (81 files; 20 visual-slice captures plus existing matrix captures/manifests).
- I inspected the final artifact's 20 visual-slice captures as a contact sheet and at full size. The low-fit bomber no longer draws pockets in a space too short for them. The long coat has a visibly longer front and rear silhouette with a center opening and panel seams. No screenshot was edited or composited to fake the result.

### Before/after comparison

- **street_bomber:** baseline capture 01 showed a short torso shell with a broad hem and few construction cues. The new sample has a separate shell, center closure, side pocket panels, ribbed hem and shoulder seams. At fit 0 the pockets are intentionally omitted because the crop cannot fit them; at fit 50/100 they are present.
- **tactical_baseball:** baseline matrix geometry used a simple angular torso panel. The new sample adds shoulder/side color-block panels, a vertical placket, seam lines, pocket panels and rear-view yoke/center seam. It is now structurally distinct from the bomber, although both still share the underlying arm/anatomy model.
- **long_coat:** baseline capture 04 read more like a long jacket ending around the upper thigh. The new sample extends the coat hem further down the legs, with front lapel/opening geometry, vertical seams and a separate rear panel treatment. The length difference is visible at the same character and viewport.

### Acceptance

**Status: PARTIAL.** The targeted garment slice and real screenshot pipeline work, and the three garments now have more distinguishable construction. However, the character anatomy and sleeve base remain generic SVG geometry, the tactical jacket still shares the same basic arm/body rig, folds and fabric physics are absent, and the overall figure is still a stylized prototype rather than a commercial-grade character creator. This is an honest incremental improvement, not a claim that the full visual-quality goal is complete.

**WINDOWS_MANUAL_QA: NOT_RUN.** Headless Linux Chromium is not physical Windows Chrome/Edge validation.

**TIMER:** planned 6–10 hours; actual elapsed time not measured.
