# OpenGameArt CC0 source assets

Source pages display CC0 1.0:

- Hordana, **Anime Girl / Michona the creepy and cute warrior**: https://opengameart.org/content/anime-girl
- FALLiNG_AiR, **Visual novel Character Sprite**: https://opengameart.org/content/visual-novel-character-sprite

These are preserved source downloads. The three Hordana PNGs are animation sprite strips, not semantically separated clothing/body layers. FALLiNG_AiR's original ZIP is preserved intact; its contents were inspected and selected files are organized under `prepared/fallingair/`.

The import workflow pins expected source hashes, validates PNG signatures/dimensions and ZIP CRC/path safety, records SHA-256 and file sizes, inventories the PSD layer trees, and exports 43 visible non-empty PSD layers as transparent PNG references. The app exposes 65 character/base/expression PNGs and a separate catalog for the 43 extracted PSD layers. See `archive-inventory.json`, `download-inventory.json`, and `prepared/fallingair/psd-layer-inventory.json`.

| File | SHA-256 |
|---|---|
| 13jump_1.png | f8597238ebe3b9d761fe40e6169042fa9247f771d44328345f8dc4514634f259 |
| 11walk_4.png | 1b6537b1bea0c93da1f1b27f52786a9c3e0de2b5b2f89dca045af7631e942337 |
| blink strip 5.png | 4a42ed4aaeca1f034a1fa3429e8db59bfc6d7501b92680feaf8292160bd67212 |
| character.zip | df847f16d5ac45905023bfad0a12dccc71d614423d1505fde0d4d9e756dbfb11 |

Attribution retained for provenance even though the source pages declare CC0:
- Hordana's source page includes the notice “By the name of Hordana I command this to be free forever and ever!”
- FALLiNG_AiR's source page states “It's free”.
