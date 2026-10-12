from __future__ import annotations

import base64
import io
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_model_builder import (
    CharacterModelError,
    create_character_model,
    edit_character_model_layer,
    extend_character_model,
    list_character_models,
    publish_model_layer,
    read_character_model,
    read_character_model_image,
    reset_character_model_layer,
)
from modular_asset_library import import_user_asset, list_user_assets


def png_bytes(opaque_background: bool = False, shift: int = 0) -> bytes:
    image = Image.new("RGBA", (96, 144), (248, 248, 248, 255) if opaque_background else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((35 + shift, 8, 60 + shift, 35), fill=(210, 65, 105, 255))
    draw.rectangle((25 + shift, 36, 70 + shift, 88), fill=(45, 115, 220, 255))
    draw.rectangle((29 + shift, 89, 43 + shift, 135), fill=(35, 35, 48, 255))
    draw.rectangle((52 + shift, 89, 66 + shift, 135), fill=(35, 35, 48, 255))
    draw.rectangle((22 + shift, 40, 73 + shift, 43), fill=(18, 18, 22, 255))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def add_asset(data: bytes, root: Path, filename: str, kind: str = "full_character") -> dict:
    return import_user_asset({
        "filename": filename,
        "mime_type": "image/png",
        "data_base64": base64.b64encode(data).decode("ascii"),
        "category": "portrait" if kind in {"full_character", "portrait"} else "reference",
        "label": filename,
        "kind": kind,
        "view": "front",
        "license": "USER_PROVIDED_REFERENCE",
        "source_url": "https://example.invalid/user-reference",
    }, root)


class CharacterModelBuilderTests(unittest.TestCase):
    def test_creates_pixel_reconstructable_layer_pack_and_palette(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library = root / "library"
            models = root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            reference = add_asset(png_bytes(shift=2), library, "style-reference.png", "reference")

            result = create_character_model({
                "name": "Cyber test model",
                "style_id": "user-cyber-v1",
                "base_asset_id": base["id"],
                "asset_ids": [base["id"], reference["id"]],
                "max_regions": 16,
            }, library, models)
            model = result["model"]

            self.assertTrue(model["id"].startswith("model."))
            self.assertEqual(model["workflow"]["kind"], "editable-raster-region-pack")
            self.assertFalse(model["workflow"]["split_is_semantic"])
            self.assertEqual(len(model["references"]), 2)
            self.assertGreater(len(model["style_signature"]["dominant_palette"]), 0)
            self.assertGreaterEqual(len(model["layers"]), 2)
            self.assertLessEqual(len(model["layers"]), 16)
            self.assertTrue(model["decomposition"]["round_trip_exact_visible_pixels"])

            source_bytes, _ = read_character_model_image(model["id"], "source.png", models)
            preview_bytes, _ = read_character_model_image(model["id"], "preview.png", models)
            with Image.open(io.BytesIO(source_bytes)) as source, Image.open(io.BytesIO(preview_bytes)) as preview:
                self.assertEqual(source.size, (512, 768))
                self.assertEqual(preview.size, (512, 768))
                source_rgba, preview_rgba = source.convert("RGBA"), preview.convert("RGBA")
                source_raw, preview_raw = source_rgba.tobytes(), preview_rgba.tobytes()
                for offset in range(0, len(source_raw), 4):
                    if source_raw[offset + 3] > 0:
                        self.assertEqual(source_raw[offset:offset + 4], preview_raw[offset:offset + 4])

            for layer in model["layers"]:
                layer_bytes, mime = read_character_model_image(model["id"], layer["id"] + ".png", models)
                self.assertEqual(mime, "image/png")
                with Image.open(io.BytesIO(layer_bytes)) as layer_image:
                    self.assertEqual(layer_image.size, (512, 768))
                    self.assertIsNotNone(layer_image.getchannel("A").getbbox())
            self.assertEqual(list_character_models(models)["count"], 1)

    def test_flat_background_is_removed_before_stage_normalization(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library = root / "library"
            models = root / "models"
            base = add_asset(png_bytes(opaque_background=True), library, "flat-white-background.png")
            result = create_character_model({
                "name": "Background cleanup",
                "base_asset_id": base["id"],
                "asset_ids": [base["id"]],
            }, library, models)
            source_ref = result["model"]["references"][0]
            self.assertTrue(source_ref["background_removed"])
            self.assertLess(source_ref["alpha_coverage"], 0.8)
            preview, _ = read_character_model_image(result["model"]["id"], "preview.png", models)
            with Image.open(io.BytesIO(preview)) as image:
                self.assertEqual(image.getpixel((4, 4))[3], 0)

    def test_extending_model_adds_style_references_without_rebuilding_layers(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library = root / "library"
            models = root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            ref_a = add_asset(png_bytes(shift=1), library, "reference-a.png", "reference")
            ref_b = add_asset(png_bytes(shift=3), library, "reference-b.png", "reference")
            created = create_character_model({
                "name": "Expandable style",
                "base_asset_id": base["id"],
                "asset_ids": [base["id"], ref_a["id"]],
            }, library, models)["model"]
            original_layers = [(item["id"], item["sha256"]) for item in created["layers"]]

            updated = extend_character_model(created["id"], {"asset_ids": [ref_b["id"]]}, library, models)["model"]
            self.assertEqual(updated["revision"], 2)
            self.assertEqual(len(updated["references"]), 3)
            self.assertEqual(updated["style_signature"]["source_image_count"], 3)
            self.assertEqual([(item["id"], item["sha256"]) for item in updated["layers"]], original_layers)

            with self.assertRaisesRegex(CharacterModelError, "ya forman parte"):
                extend_character_model(created["id"], {"asset_ids": [base["id"]]}, library, models)

    def test_region_can_be_promoted_to_modular_asset(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library = root / "library"
            models = root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            result = create_character_model({
                "name": "Publish layer",
                "base_asset_id": base["id"],
                "asset_ids": [base["id"]],
            }, library, models)["model"]
            initial_count = list_user_assets(library)["count"]
            layer = result["layers"][0]
            published = publish_model_layer(result["id"], {
                "layer_id": layer["id"],
                "label": "Candidate coat panel",
                "category": "clothing_top",
                "view": "front",
                "license": "USER_PROVIDED_REFERENCE",
            }, library, models)
            self.assertEqual(published["asset"]["kind"], "modular_piece")
            self.assertEqual(published["asset"]["category"], "clothing_top")
            self.assertFalse(published["asset"]["anchors_validated"])
            self.assertEqual(list_user_assets(library)["count"], initial_count + 1)

    def test_edit_mask_preserves_source_rgb_and_reset_restores_original_layer(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library, models = root / "library", root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            model = create_character_model({
                "name": "Mask edit", "base_asset_id": base["id"], "asset_ids": [base["id"]],
            }, library, models)["model"]
            layer = model["layers"][0]
            source_bytes, _ = read_character_model_image(model["id"], "source.png", models)
            original_bytes, _ = read_character_model_image(model["id"], layer["id"] + ".png", models)
            with Image.open(io.BytesIO(source_bytes)) as opened:
                source = opened.convert("RGBA")
            with Image.open(io.BytesIO(original_bytes)) as opened:
                original = opened.convert("RGBA")
            original_alpha = original.getchannel("A")
            mask = Image.new("L", (512, 768), 0)
            mask.paste(original_alpha)
            source_alpha = source.getchannel("A")
            source_values, mask_values = source_alpha.tobytes(), bytearray(mask.tobytes())
            added_index = next(i for i, alpha in enumerate(source_values) if alpha > 0 and mask_values[i] == 0)
            mask_values[added_index] = 255
            mask = Image.frombytes("L", (512, 768), bytes(mask_values))
            encoded = io.BytesIO()
            mask.save(encoded, format="PNG")
            result = edit_character_model_layer(
                model["id"], layer["id"], base64.b64encode(encoded.getvalue()).decode("ascii"), models
            )
            self.assertEqual(result["model"]["revision"], 2)
            self.assertTrue(result["model"]["layers"][0]["edited_by_user"])
            edited_bytes, _ = read_character_model_image(model["id"], layer["id"] + ".png", models)
            with Image.open(io.BytesIO(edited_bytes)) as opened:
                edited = opened.convert("RGBA")
            self.assertEqual(edited.getpixel((added_index % 512, added_index // 512))[:3],
                             source.getpixel((added_index % 512, added_index // 512))[:3])
            self.assertGreater(edited.getchannel("A").getbbox()[2], 0)
            reset = reset_character_model_layer(model["id"], layer["id"], models)
            self.assertEqual(reset["model"]["revision"], 3)
            self.assertFalse(reset["model"]["layers"][0].get("edited_by_user", False))
            restored, _ = read_character_model_image(model["id"], layer["id"] + ".png", models)
            self.assertEqual(restored, original_bytes)

    def test_mask_edit_rejects_wrong_canvas_and_invalid_layer_ids(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library, models = root / "library", root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            model = create_character_model({
                "name": "Mask validation", "base_asset_id": base["id"], "asset_ids": [base["id"]],
            }, library, models)["model"]
            wrong = io.BytesIO()
            Image.new("L", (16, 16), 255).save(wrong, format="PNG")
            with self.assertRaisesRegex(CharacterModelError, "512×768"):
                edit_character_model_layer(model["id"], model["layers"][0]["id"],
                                           base64.b64encode(wrong.getvalue()).decode("ascii"), models)
            with self.assertRaisesRegex(CharacterModelError, "región"):
                edit_character_model_layer(model["id"], "../outside",
                                           base64.b64encode(wrong.getvalue()).decode("ascii"), models)

    def test_rejects_bad_ids_and_invalid_model_requests(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            library = root / "library"
            models = root / "models"
            base = add_asset(png_bytes(), library, "base.png")
            with self.assertRaises(CharacterModelError):
                create_character_model({
                    "name": "Unsafe", "base_asset_id": base["id"], "asset_ids": [base["id"]],
                    "max_regions": 1000,
                }, library, models)
            with self.assertRaisesRegex(CharacterModelError, "Identificador de modelo"):
                read_character_model("../../outside", models)
            valid = create_character_model({
                "name": "Safe", "base_asset_id": base["id"], "asset_ids": [base["id"]],
            }, library, models)["model"]
            with self.assertRaisesRegex(CharacterModelError, "Nombre de imagen"):
                read_character_model_image(valid["id"], "../outside.png", models)


if __name__ == "__main__":
    unittest.main(verbosity=2)
