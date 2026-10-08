from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets_manifest.json"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assets = data.get("assets")
    assert isinstance(assets, list) and assets, "assets_manifest.json must contain assets"

    ids = set()
    destinations = set()
    for asset in assets:
        asset_id = asset.get("id")
        destination = asset.get("destination")
        expected = asset.get("expected", {})
        assert asset_id and asset_id not in ids, f"duplicate asset id: {asset_id}"
        assert destination and destination.endswith(".png"), f"invalid destination: {asset_id}"
        assert destination not in destinations, f"duplicate destination: {destination}"
        assert expected.get("format", "PNG").upper() == "PNG", f"non-PNG contract: {asset_id}"
        assert asset.get("prompt", "").strip(), f"missing prompt: {asset_id}"
        ids.add(asset_id)
        destinations.add(destination)

    print(f"PASS: {len(assets)} asset contracts validated")


if __name__ == "__main__":
    main()
