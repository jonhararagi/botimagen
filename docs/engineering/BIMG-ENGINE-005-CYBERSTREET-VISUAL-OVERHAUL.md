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
