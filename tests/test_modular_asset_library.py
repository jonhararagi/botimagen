import base64
import unittest
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from modular_asset_library import (
    AssetImportError, confirm_user_asset_anchors, confirm_user_asset_rights,
    import_user_asset, list_user_assets,
)

import struct
import zlib

def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

PNG_1X1 = (
    b"\x89PNG\r\n\x1a\n"
    + png_chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
    + png_chunk(b"IDAT", zlib.compress(b"\x00\x00\x00\x00\x00"))
    + png_chunk(b"IEND", b"")
)

def png_rgba(width, height):
    raw = b"".join(b"\x00" + bytes(width * 4) for _ in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(raw))
        + png_chunk(b"IEND", b"")
    )


PNG_STAGE = png_rgba(512, 768)


def conversion_metadata(source_record):
    return {
        "schema_version": 1, "algorithm": "botimagen-png-stage-v1", "normalized": True,
        "canvas_width": 512, "canvas_height": 768, "source_width": source_record["width"],
        "source_height": source_record["height"], "source_sha256": source_record["sha256"],
        "source_format": source_record["mime_type"], "background_removed": True,
        "background_tolerance": 36, "scale_percent": 100, "offset_x": 0, "offset_y": 0,
        "pose": "front", "rig_category": "body",
        "content_bounds": {"x": 100, "y": 30, "width": 312, "height": 708},
        "anchors": {
            "origin": {"x": 0.5, "y": 0.5}, "head": {"x": 0.5, "y": 0.12},
            "neck": {"x": 0.5, "y": 0.2}, "shoulder_l": {"x": 0.35, "y": 0.22},
            "shoulder_r": {"x": 0.65, "y": 0.22}, "waist": {"x": 0.5, "y": 0.48},
            "hip": {"x": 0.5, "y": 0.58}, "ankle_l": {"x": 0.42, "y": 0.95},
            "ankle_r": {"x": 0.58, "y": 0.95},
        },
        "anchor_status": "estimated_not_validated",
    }


def payload(data=PNG_1X1, **overrides):
    result = {
        "filename": "reference.png", "mime_type": "image/png",
        "data_base64": base64.b64encode(data).decode("ascii"), "category": "reference",
        "label": "Reference", "kind": "reference", "view": "front",
        "license": "UNVERIFIED", "source_url": "",
    }
    result.update(overrides)
    return result

class ModularAssetLibraryTests(unittest.TestCase):
    def test_import_persists_image_and_metadata(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            record = import_user_asset(payload(), root)
            self.assertEqual((record["width"], record["height"]), (1, 1))
            self.assertTrue(record["sha256"])
            self.assertEqual(list_user_assets(root)["count"], 1)
            self.assertTrue((root / "catalog.json").is_file())

    def test_cc0_archive_member_provenance_preserves_relative_path(self):
        with TemporaryDirectory() as directory:
            source_member = "cha 1/image/pl1 angry.png"
            record = import_user_asset(payload(
                source_filename=source_member,
                source_url="https://opengameart.org/content/visual-novel-character-sprite",
                license="CC0 1.0",
            ), Path(directory))
            self.assertEqual(record["source_filename"], source_member)
            self.assertEqual(list_user_assets(Path(directory))["assets"][0]["source_filename"], source_member)

    def test_duplicate_content_does_not_duplicate_catalog(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            first = import_user_asset(payload(), root)
            second = import_user_asset(payload(), root)
            self.assertTrue(second["duplicate"])
            self.assertEqual(second["id"], first["id"])
            self.assertEqual(list_user_assets(root)["count"], 1)

    def test_rejects_invalid_or_unsafe_inputs(self):
        cases = [
            payload(mime_type="image/svg+xml"),
            payload(data_base64="not base64"),
            payload(category="../../outside"),
            payload(filename="../../outside.png"),
            payload(source_filename="../outside.png"),
            payload(source_filename="C:/Users/private/source.png"),
            payload(kind="modular_piece", source_url="javascript:alert(1)"),
        ]
        for case in cases:
            with self.subTest(case=case):
                with TemporaryDirectory() as directory:
                    with self.assertRaises(AssetImportError):
                        import_user_asset(case, Path(directory))
                    self.assertEqual(list_user_assets(Path(directory))["count"], 0)

    def test_normalized_conversion_preserves_source_and_can_confirm_anchors(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = import_user_asset(payload(filename="source.png", label="Source image"), root)
            converted = import_user_asset(
                payload(
                    data=PNG_STAGE, filename="source-botimagen-512x768.png",
                    source_filename="source.png", category="body", kind="modular_piece",
                    label="Body stage", source_asset_id=source["id"],
                    conversion=conversion_metadata(source),
                ),
                root,
            )
            self.assertEqual((converted["width"], converted["height"]), (512, 768))
            self.assertEqual(converted["source_asset_id"], source["id"])
            self.assertEqual(converted["conversion"]["rig_category"], "body")
            self.assertFalse(converted["anchors_validated"])
            self.assertEqual(list_user_assets(root)["count"], 2)
            confirmed = confirm_user_asset_anchors(converted["id"], root)
            self.assertTrue(confirmed["anchors_validated"])
            self.assertEqual(confirmed["anchor_status"], "user_confirmed")
            self.assertEqual(list_user_assets(root)["count"], 2)

    def test_user_adjusted_anchor_coordinates_are_persisted_on_confirmation(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = import_user_asset(payload(filename="source.png", label="Source image"), root)
            conversion = conversion_metadata(source)
            candidate = import_user_asset(payload(
                data=PNG_STAGE, filename="body-stage.png", source_filename="source.png",
                category="body", kind="modular_piece", label="Body stage",
                source_asset_id=source["id"], conversion=conversion,
            ), root)
            adjusted = dict(conversion["anchors"])
            adjusted["head"] = {"x": 0.54, "y": 0.11}
            confirmed = confirm_user_asset_anchors(candidate["id"], root, anchors=adjusted)
            self.assertTrue(confirmed["anchors_validated"])
            self.assertEqual(confirmed["anchor_estimate"]["head"], {"x": 0.54, "y": 0.11})
            self.assertEqual(confirmed["conversion"]["anchors"]["head"], {"x": 0.54, "y": 0.11})
            reloaded = list_user_assets(root)["assets"][1]
            self.assertEqual(reloaded["anchor_estimate"]["head"], {"x": 0.54, "y": 0.11})
    def test_conversion_rejects_untrusted_anchor_coordinates(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = import_user_asset(payload(), root)
            conversion = conversion_metadata(source)
            conversion["anchors"]["head"]["x"] = 1.5
            with self.assertRaisesRegex(AssetImportError, "normalizado"):
                import_user_asset(
                    payload(data=PNG_STAGE, kind="modular_piece", category="body", conversion=conversion),
                    root,
                )
            self.assertEqual(list_user_assets(root)["count"], 1)

    def test_manual_cutout_metadata_is_preserved_and_validated(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = import_user_asset(payload(), root)
            conversion = conversion_metadata(source)
            conversion["cutout_applied"] = True
            conversion["cutout_polygon"] = [
                {"x": 0.2, "y": 0.2}, {"x": 0.8, "y": 0.2},
                {"x": 0.8, "y": 0.7}, {"x": 0.2, "y": 0.7},
            ]
            converted = import_user_asset(
                payload(
                    data=PNG_STAGE, filename="piece.png", kind="modular_piece",
                    category="clothing_top", conversion=conversion, source_asset_id=source["id"],
                ), root,
            )
            self.assertTrue(converted["conversion"]["cutout_applied"])
            self.assertEqual(len(converted["conversion"]["cutout_polygon"]), 4)
            bad = dict(conversion)
            bad["cutout_polygon"] = [{"x": 1.2, "y": 0.5}, {"x": 0.8, "y": 0.2}, {"x": 0.2, "y": 0.7}]
            with self.assertRaisesRegex(AssetImportError, "normalizado"):
                import_user_asset(
                    payload(data=PNG_STAGE, filename="bad-piece.png", kind="modular_piece",
                        category="clothing_top", conversion=bad, source_asset_id=source["id"]),
                    root,
                )

    def test_cannot_confirm_reference_or_unconverted_candidate(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            reference = import_user_asset(payload(), root)
            with self.assertRaisesRegex(AssetImportError, "Solo se pueden validar"):
                confirm_user_asset_anchors(reference["id"], root)
            candidate = import_user_asset(payload(kind="modular_piece", category="body"), root)
            with self.assertRaisesRegex(AssetImportError, "Convierte la imagen"):
                confirm_user_asset_anchors(candidate["id"], root)
            self.assertEqual(list_user_assets(root)["count"], 2)

    def test_provenance_is_unverified_by_default_and_can_be_declared_as_original(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            pending = import_user_asset(payload(), root)
            self.assertFalse(pending["rights_confirmed"])
            self.assertEqual(pending["provenance_status"], "unverified")
            self.assertIsNone(pending["provenance_reviewed_at"])
            confirmed = confirm_user_asset_rights(pending["id"], "Original propio", "", root)
            self.assertTrue(confirmed["rights_confirmed"])
            self.assertEqual(confirmed["provenance_status"], "user_declared_original")
            self.assertIn("no verifica de forma independiente", confirmed["provenance_note"].lower())
            stored = list_user_assets(root)["assets"][0]
            self.assertTrue(stored["rights_confirmed"])
            self.assertEqual(stored["provenance_status"], "user_declared_original")

    def test_open_license_requires_known_license_and_https_source(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            asset = import_user_asset(payload(data=PNG_STAGE, filename="licensed.png"), root)
            with self.assertRaisesRegex(AssetImportError, "HTTPS"):
                confirm_user_asset_rights(asset["id"], "CC0 1.0", "", root)
            with self.assertRaisesRegex(AssetImportError, "HTTPS"):
                confirm_user_asset_rights(asset["id"], "CC0 1.0", "http://example.org/art.png", root)
            with self.assertRaisesRegex(AssetImportError, "licencia no habilitada"):
                confirm_user_asset_rights(asset["id"], "licencia inventada", "https://example.org/art.png", root)
            confirmed = confirm_user_asset_rights(asset["id"], "CC0 1.0", "https://example.org/art.png", root)
            self.assertTrue(confirmed["rights_confirmed"])
            self.assertEqual(confirmed["provenance_status"], "user_attested_open_license")
            self.assertEqual(confirmed["source_url"], "https://example.org/art.png")

    def test_corrupt_catalog_is_not_overwritten(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "catalog.json").write_text("{broken", encoding="utf-8")
            with self.assertRaises(AssetImportError):
                import_user_asset(payload(), root)
            self.assertEqual((root / "catalog.json").read_text(encoding="utf-8"), "{broken")

if __name__ == "__main__":
    unittest.main()
