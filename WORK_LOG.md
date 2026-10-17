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


## 2026-10-15 · BIMG-REFERENCE-BASE-003

- Scope: extend the existing reference research on the same PR branch; record specific CC0 source pages and provide standalone editable original SVG parts for quick iteration.
- Branch: `feature/bimg-anime-png-universal-library`; existing PR #15 remains open. No new branch, no merge, no `main` edits.
- Research verified from source pages:
  - Hordana, “Anime Girl / Michona”: OpenGameArt marks the page CC0 and lists three PNG sprite strips: https://opengameart.org/content/anime-girl
  - FALLiNG_AiR, “Visual novel Character Sprite”: OpenGameArt marks the page CC0 and lists a 26.2 MB ZIP described as including PSD, Clip Studio and PNG files: https://opengameart.org/content/visual-novel-character-sprite
  - PixAI licensing guide: check image references, model and LoRA terms separately: https://blog.pixai.art/en/pixai-commercial-use-licensing-guide/
- Repository files added: `assets/reference-research/manifest.json` now records author, license label, direct file URLs and import status. Added original SVG base and six aligned standalone SVG parts under `assets/reference-research/prepared/`: body, clothing, head, eyes, hair and watermark. These SVGs are project-authored originals, not downloaded PixAI art.
- External binary ingestion status: **PARTIAL**. Source license pages were checked and links recorded, but source ZIP/PNG bytes have not yet been mirrored into the repo. The ZIP must be inspected before any files inside are accepted as separate reusable layers. Do not state external assets are already downloaded.
- PixAI generation: no image generation submitted and no credits spent.
- Validation: latest known completed CI #686 passed at commit `37197d6e5bbcef25b760b0b5e6eb1d4a4eb2a4b8`: https://github.com/jonhararagi/botimagen/actions/runs/38691071772. CI #689 for the current head is still running: https://github.com/jonhararagi/botimagen/actions/runs/38692199311. Await final status before claiming the newest changes pass.
- TIMER: 30–60 minutes of additional active work for external file ingestion, checking the ZIP's real layer structure, and testing imports. Manual visual review remains required.


## 2026-10-15 · BIMG-REFERENCE-BASE-004

- Estado: **PASS** para descarga, hashes, integridad del ZIP y preparación de recursos; **PARTIAL** para el mapeo semántico interno de capas PSD.
- Rama autorizada: `feature/bimg-anime-png-universal-library`; PR #15 sigue abierto y sin integrar. No se creó otra rama ni se modificó `main`.
- Recursos CC0 incorporados desde OpenGameArt: tres PNG de sprites/animación de Hordana y el ZIP original de FALLiNG_AiR. Las fichas de origen muestran CC0 1.0; URLs, autoría, tamaños y SHA-256 están en `assets/reference-research/manifest.json` y los inventarios.
- Validación de descarga: PNG signatures/dimensiones y hashes exactos PASS; ZIP CRC PASS; rutas internas inseguras rechazadas; 96 miembros inspeccionados: 66 PNG, 10 PSD, 10 archivos Clip Studio y 10 directorios.
- Preparación: `assets/reference-research/prepared/fallingair/` contiene 76 recursos listos/editales (66 PNG + 10 PSD), organizados por personaje, expresiones, masters y una ilustración. Inventario por archivo con miembro original del ZIP, tamaño y SHA-256.
- Workflow de importación y preparación: [run #5 PASS](https://github.com/jonhararagi/botimagen/actions/runs/38693611480). El workflow se limita a la rama existente y hace push sin force; no se alteró `main`.
- Límite conocido: todavía no se han inspeccionado los nombres/funciones de cada capa dentro de los PSD. No presentar los PSD como capas semánticas listas hasta revisar su estructura. Próximo paso: integrar las PNG en la biblioteca del generador y probar apertura/edición de los PSD maestros.



## 2026-10-15 · BIMG-REFERENCE-BASE-005

- Estado: **PASS** para inspección de PSD, catálogo web CC0, integración en el constructor y CI completo.
- Rama única: `feature/bimg-anime-png-universal-library`; PR #15 abierta. No se creó rama nueva, no se integró la PR y `main` permanece intacta.
- Catálogo fuente: 66 PNG publicados en `web/public/cc0-character-library/` con manifiesto JSON válido, URL de origen, creador, licencia CC0 declarada y SHA-256 por archivo. El botón de la biblioteca universal permite añadir la colección al almacenamiento IndexedDB.
- Constructor de modelos: añadido el control **Importar colección CC0 al constructor**. Descarga 65 PNG (bases de personajes y expresiones; excluye la ilustración editorial), verifica la firma PNG y SHA-256 y los registra en `/api/modular-assets` como referencias CC0, con procedencia original y sin asignarles falsamente roles de ropa/cabello.
- PSD: inspección con `psd-tools` de 10 maestros, 82 capas totales, canvas 2000×3000. Las capas faciales de personajes 2–5 incluyen nombres de expresiones reconocibles (varios en coreano); la mayoría de las capas de cuerpo siguen con nombres genéricos como `레이어 1`. Se conserva inventario completo en `assets/reference-research/prepared/fallingair/psd-layer-inventory.json`. Esto permite inspección manual, pero **no** demuestra separación semántica automática de cabello, cuerpo y prendas.
- Integridad: inventario preparado 76 archivos (66 PNG + 10 PSD), hashes SHA-256 y CRC ZIP validados.
- CI final para HEAD `efbf9a1b1738f5c1503569fe010dd7a49c74a91b`: [run #734 PASS](https://github.com/jonhararagi/botimagen/actions/runs/38695428134). Incluye contratos, generador, build TypeScript/Vite y smoke test de Chromium.
- Límite de verificación: el smoke test general de Chromium pasó, pero el clic real que importa las 65 imágenes al backend no se ejercitó como flujo E2E independiente. Debe comprobarse con la app y el API local activos antes de declarar esa operación verificada de punta a punta.


## 2026-10-15 · BIMG-REFERENCE-BASE-005 · PSD layers wired into generator

- Rama autorizada: `feature/bimg-anime-png-universal-library`; PR #15 sigue abierta. Sin ramas nuevas, sin cambios en `main`, sin merge.
- Inspección PSD: 10 maestros (canvas 2000×3000), 82 registros de capa, 43 capas visibles/no vacías exportadas como PNG transparentes con SHA-256 y caja de origen.
- Nombres reconocibles de expresiones faciales se conservan; capas genéricas como `레이어 1` no se clasifican automáticamente como ropa/cabello/cuerpo. Se mantienen como referencias raster pendientes de revisión humana.
- Constructor: el botón existente importa 65 PNG de personaje/expresión con hashes y procedencia CC0; nuevo botón **Importar capas PSD CC0** importa por separado los 43 PNG extraídos, conserva URL/licencia/miembro de archivo y ruta de capa y no asigna roles semánticos automáticamente.
- Causa raíz del E2E fallido: `source_filename` rechazaba rutas relativas de procedencia del ZIP aunque se usan solo como metadatos. `_safe_source_reference` ahora permite referencias relativas seguras con `/`, y rechaza rutas absolutas, drive Windows, `..`, segmentos vacíos, controles y barras invertidas. Añadida prueba unitaria para la procedencia CC0 y casos de traversal.
- Smoke test Chromium: ahora cierra el editor de máscaras antes de importar, muestra el error real si falla la importación y valida tanto los 65 PNG base como las 43 capas PSD y su procedencia.
- Evidencia de preparación PSD y publicación de catálogo: [workflow de importación #10 PASS](https://github.com/jonhararagi/botimagen/actions/runs/38698873530). Inventarios: `assets/reference-research/prepared/fallingair/psd-layer-inventory.json` y `web/public/cc0-character-library/psd-layers-manifest.json`.
- CI de la revisión de código más reciente aún en curso al escribir esta entrada; no declarar PASS hasta confirmar la ejecución del HEAD final.


## 2026-10-15 · BIMG-REFERENCE-BASE-006 · Asignación visual por lote para capas PSD

- Rama única: `feature/bimg-anime-png-universal-library`; PR #15 sigue siendo el destino del trabajo. No se creó rama nueva ni se modificó `main`.
- Evidencia de inspección PSD: 10 archivos maestros, 82 entradas de capa registradas y 43 capas transparentes exportadas con nombre/ruta original, caja, dimensiones, hash SHA-256 y procedencia CC0.
- Mejora de UI: selección manual por tarjeta, estado visual de selección, selección de todas las capas visibles según filtros, selector de rol semántico y acción para aplicar un rol a múltiples capas. La selección se limpia después de aplicar; notas por capa y exportación JSON existente se conservan.
- Prueba automatizada ampliada en `web/browser_smoke.mjs`: Chromium verifica 43 tarjetas, asignación individual persistida, filtro de pendientes, selección de dos capas, aplicación masiva del rol `accessory`, persistencia de ambas asignaciones y limpieza de selección.
- Commit inicial de implementación: `d45dd700f0e3852ba8e465d7cd4ba918940a2107`. El primer intento falló por una coma ausente en el array CSS; corregido en `ce0d4fdc5d539130b8f8ea104620453308605e0e`. CI final de ese HEAD: [run #749 PASS](https://github.com/jonhararagi/botimagen/actions/runs/38731691270), incluidos build TypeScript/Vite y smoke test Chromium real.
- Límite: la asignación es manual y local al navegador. No se infieren roles por nombre ni se convierten automáticamente referencias PSD en prendas/cabello semánticamente confirmados.
