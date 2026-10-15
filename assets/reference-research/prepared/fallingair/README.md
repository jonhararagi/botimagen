# Prepared CC0 character source assets

Source: FALLiNG_AiR, [Visual novel Character Sprite](https://opengameart.org/content/visual-novel-character-sprite).
License displayed on source page: CC0 1.0.

This folder preserves selected PNG exports and the editable PSD master files. The PSDs were inspected with `psd-tools`: 10 source PSDs, 82 layer records and 43 visible, non-empty leaf-layer PNG exports. The extracted layers live under `psd-layers/`; each keeps its source PSD member, original layer path, bounding box, dimensions, byte count and SHA-256 in `psd-layer-inventory.json`.

The layer names are retained as authored. Some facial PSDs have named expressions (including Korean names); many body PSD layers use generic names such as `레이어 1`. They remain **unclassified raster references** in BotImagen until a person confirms whether each one represents hair, face, body, clothing or another role. The generator does not pretend that a pixel layer is automatically a semantic garment.

The original `character.zip` is preserved unchanged under `incoming/opengameart/`. The browser generator imports 65 character/base/expression PNGs with source/license metadata. A separate **Importar capas PSD CC0** action imports the 43 extracted layer PNGs as references, verifies each SHA-256, and preserves provenance.

Every prepared file has a SHA-256 entry in the appropriate inventory JSON, along with its original ZIP member path.
