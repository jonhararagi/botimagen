# Work log · BotImagen

## 2026-10-15 · BIMG-PIXAI-001

- Scope: add a low-credit PixAI recipe for Gen Pibara V1 to the existing simple character creator.
- Branch: `feature/bimg-anime-png-universal-library`; existing PR #15: https://github.com/jonhararagi/botimagen/pull/15.
- UI: `web/src/visual/CharacterCatalogStudio.tsx` now derives a positive prompt from selected character attributes, provides a negative prompt, and links to the official LoRA page. Copy actions do not generate images.
- Documentation: `docs/PIXAI-GEN-PIBARA-V1.md`; continuity updates in `cerebro/ESTADO_ACTUAL.md` and `cerebro/PROGRESO.md`.
- Safety/cost: no PixAI API key or cookies in the repo; no LoRA weights or third-party art downloaded; no generation batch; 0 PixAI generation credits spent.
- Verification: GitHub Actions run #673 / 38682122703 was IN_PROGRESS at the time of this entry: https://github.com/jonhararagi/botimagen/actions/runs/38682122703. PixAI visual generation remains NOT_RUN pending the user saving the TinyFish session.
- Next: inspect CI result, fix any failure, then run one controlled image test only after the user confirms TinyFish setup is saved.
- TIMER: 1–2 active hours remain for CI follow-up and a single visual test; Windows physical QA remains separate.


## 2026-10-15 · BIMG-REFERENCE-BASE-002

- Scope: add a searchable external reference workflow for character/model/LoRA discovery and a watermarked base-image export without modifying the imported original.
- Branch: `feature/bimg-anime-png-universal-library`; existing PR #15: https://github.com/jonhararagi/botimagen/pull/15. No new branch; `main` untouched.
- UI: `web/src/visual/ModelLoraFinder.tsx` links to query-prepared searches on Civitai, PixAI (via site search), and Hugging Face. Search can be narrowed to character, hair, eyes, clothing, pose, or style and model/LoRA/checkpoint.
- Base-image workflow: `AnimePngLibrary.tsx` now exports an additional PNG copy with a small paw + “BotImagen · BASE” label in a new footer below the artwork. Original IndexedDB asset remains unchanged; the marked copy can be imported into the region model builder.
- Important limitation: region decomposition is raster-based, not semantic AI. Head/eyes/clothing layers need visual review and manual labeling; don't treat candidate regions as automatically correct parts. Check each external model's license before reuse.
- Cost/provenance: no PixAI generation submitted and no credits spent; no external model weights or third-party images copied into the repository.
- Verification: previous browser smoke CI #676 passed: https://github.com/jonhararagi/botimagen/actions/runs/38689078630. New CI for this work is running on latest commit `eff68d4fa8917d172da79915ada62386fde417fd`: https://github.com/jonhararagi/botimagen/actions/runs/38689968238. Do not mark this change PASS until that run completes successfully.
- TIMER: 30–60 minutes estimated for CI follow-up and any needed fixes; visual review and Windows physical QA remain separate.
