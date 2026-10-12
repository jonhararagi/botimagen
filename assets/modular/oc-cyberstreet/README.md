# CyberStreet OC · original modular starter pack

This is an **editable, repository-owned vector character pack** for BotImagen's live character-assembly pipeline. It remains a stylized starter, not a production-grade final illustration or imported third-party artwork.

## Contents

- `base-body.svg`: neutral front-view body silhouette and separate limbs
- `face-anime-cyan.svg`: independent facial features, visible when hair is disabled
- `hair-midnight-cyan.svg`: detachable midnight/cyan hair with an open eye line and face-framing side locks
- `top-neon-jacket.svg`: detachable cropped technical jacket with zipper, panels, pockets and luminous trim
- `skirt-tech-pleated.svg`: detachable pleated techwear skirt with belt, folds and utility details
- `sneakers-neon.svg`: detachable neon high-top sneakers
- `manifest.json`: canvas, anchors, layer order, roles and attribution metadata

All SVGs share a 512 × 768 transparent canvas. The face, hair, garments and footwear are independent layers. The declared anchors are starting coordinates and remain subject to review in the actual React/Python compositor.

## Provenance

- Creator: BotImagen Studio
- Origin: original vector shapes authored for this repository
- License identifier: `LicenseRef-BotImagen-Original-Assets`
- Third-party images/models: none
- Status: `component_candidate`, pending new CI and visual review

The pack was refined after inspecting Chromium evidence from Validate BotImagen #457. This revision adds an independent face layer, restores a balanced front-facing pose, opens the fringe around the eyes and adds separate footwear and garment detailing. Do not mark it `component_validated` until the updated browser captures are visually reviewed.
