import base64
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from modular_asset_library import AssetImportError, import_user_asset, list_user_assets

PNG_1X1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000b49444154789c636000020000050001a5f645400000000049454e44ae426082"
)

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
            payload(kind="modular_piece", source_url="javascript:alert(1)"),
        ]
        for case in cases:
            with self.subTest(case=case):
                with TemporaryDirectory() as directory:
                    with self.assertRaises(AssetImportError):
                        import_user_asset(case, Path(directory))
                    self.assertEqual(list_user_assets(Path(directory))["count"], 0)

    def test_corrupt_catalog_is_not_overwritten(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "catalog.json").write_text("{broken", encoding="utf-8")
            with self.assertRaises(AssetImportError):
                import_user_asset(payload(), root)
            self.assertEqual((root / "catalog.json").read_text(encoding="utf-8"), "{broken")

if __name__ == "__main__":
    unittest.main()
