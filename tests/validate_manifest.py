from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets_manifest.json"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert data.get("version") == 1, "manifest version must be 1"

    assets = data.get("assets")
    assert isinstance(assets, list) and assets, "assets_manifest.json must contain assets"

    ids = set()
    destinations = set()
    for asset in assets:
        asset_id = asset.get("id")
        title = asset.get("title")
        description = asset.get("description")
        prompt = asset.get("prompt", "").strip()
        destination = asset.get("destination")
        expected = asset.get("expected", {})

        assert asset_id and asset_id not in ids, f"duplicate asset id: {asset_id}"
        assert title, f"missing title: {asset_id}"
        assert description, f"missing description: {asset_id}"
        assert prompt, f"missing prompt: {asset_id}"
        assert destination and destination.endswith(".png"), f"invalid destination: {asset_id}"
        assert destination not in destinations, f"duplicate destination: {destination}"
        assert expected.get("format", "PNG").upper() == "PNG", f"non-PNG contract: {asset_id}"

        for key in ("width", "height"):
            value = expected.get(key)
            if value is not None:
                assert isinstance(value, int) and value > 0, (
                    f"{key} must be a positive integer: {asset_id}"
                )

        max_bytes = expected.get("max_bytes")
        if max_bytes is not None:
            assert isinstance(max_bytes, int) and max_bytes > 0, (
                f"max_bytes must be a positive integer: {asset_id}"
            )

        if "width" in expected or "height" in expected:
            assert "width" in expected and "height" in expected, (
                f"width and height must be declared together: {asset_id}"
            )

        ids.add(asset_id)
        destinations.add(destination)

    print(f"PASS: {len(assets)} asset contracts validated")


if __name__ == "__main__":
    main()
