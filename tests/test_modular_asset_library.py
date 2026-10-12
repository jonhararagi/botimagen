import base64
import json

import pytest

from modular_asset_library import AssetImportError, import_user_asset, list_user_assets


# A minimal valid 1x1 transparent PNG.
PNG_1X1 = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000b49444154789c636000020000050001a5f645400000000049454e44ae426082"
)


def payload(data=PNG_1X1, **overrides):
    result = {
        "filename": "reference.png",
        "mime_type": "image/png",
        "data_base64": base64.b64encode(data).decode("ascii"),
        "category": "reference",
        "label": "Reference",
        "kind": "reference",
        "view": "front",
        "license": "UNVERIFIED",
        "source_url": "",
    }
    result.update(overrides)
    return result


def test_import_persists_image_and_metadata(tmp_path):
    record = import_user_asset(payload(), tmp_path)
    assert record["width"] == 1 and record["height"] == 1
    assert record["kind"] == "reference"
    assert record["sha256"]
    listed = list_user_assets(tmp_path)
    assert listed["count"] == 1
    assert listed["assets"][0]["id"] == record["id"]
    assert (tmp_path / "catalog.json").is_file()


def test_duplicate_content_does_not_duplicate_catalog(tmp_path):
    first = import_user_asset(payload(), tmp_path)
    second = import_user_asset(payload(filename="../reference.png"), tmp_path)
    assert second["duplicate"] is True
    assert second["id"] == first["id"]
    assert list_user_assets(tmp_path)["count"] == 1


@pytest.mark.parametrize("bad", [
    payload(mime_type="image/svg+xml"),
    payload(data_base64="not base64"),
    payload(category="../../outside"),
    payload(filename="../../outside.png"),
    payload(kind="modular_piece", source_url="javascript:alert(1)"),
])
def test_rejects_invalid_or_unsafe_inputs(tmp_path, bad):
    with pytest.raises(AssetImportError):
        import_user_asset(bad, tmp_path)
    assert list_user_assets(tmp_path)["count"] == 0


def test_corrupt_catalog_is_not_overwritten(tmp_path):
    (tmp_path / "catalog.json").write_text("{broken", encoding="utf-8")
    with pytest.raises(AssetImportError):
        import_user_asset(payload(), tmp_path)
    assert (tmp_path / "catalog.json").read_text(encoding="utf-8") == "{broken"
