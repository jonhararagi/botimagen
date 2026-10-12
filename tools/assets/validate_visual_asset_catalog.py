from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "assets" / "visual_asset_catalog.json"
REQUIRED = ("id", "path", "kind", "author", "source_url", "license", "attribution_required", "attribution", "purpose")


def validate_catalog() -> dict[str, int]:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    assert data.get("schema_version") == 1, "unsupported visual asset catalog schema"
    assets = data.get("assets")
    assert isinstance(assets, list) and assets, "visual asset catalog must contain assets"
    seen_ids: set[str] = set()
    seen_paths: set[str] = set()
    kinds: dict[str, int] = {}
    for item in assets:
        assert isinstance(item, dict), "asset entry must be an object"
        for field in REQUIRED:
            assert field in item and item[field] not in (None, ""), f"missing {field} for {item.get('id', '<unknown>')}"
        asset_id = item["id"]
        assert asset_id not in seen_ids, f"duplicate asset id: {asset_id}"
        seen_ids.add(asset_id)
        relative = Path(item["path"])
        assert not relative.is_absolute() and ".." not in relative.parts, f"asset path must remain repository-relative: {item['path']}"
        resolved = (ROOT / relative).resolve()
        assert resolved.is_relative_to(ROOT.resolve()), f"asset path escapes repository: {item['path']}"
        assert resolved.is_file(), f"catalogued local asset is missing: {item['path']}"
        assert item["path"] not in seen_paths, f"duplicate asset path: {item['path']}"
        seen_paths.add(item["path"])
        parsed = urlparse(item["source_url"])
        assert parsed.scheme == "https" and parsed.netloc, f"source_url must be a provenance URL: {asset_id}"
        assert isinstance(item["attribution_required"], bool), f"attribution_required must be boolean: {asset_id}"
        if item["attribution_required"]:
            assert item["attribution"].strip(), f"required attribution is missing: {asset_id}"
        if "sha256" in item:
            actual = hashlib.sha256(resolved.read_bytes()).hexdigest()
            assert actual == item["sha256"], f"SHA-256 mismatch for {asset_id}: expected {item['sha256']}, got {actual}"
        if item["kind"] == "character-preset":
            preset = json.loads(resolved.read_text(encoding="utf-8"))
            assert preset.get("id") == asset_id.removeprefix("character."), f"preset ID mismatch: {asset_id}"
            assert isinstance(preset.get("selections"), dict) and preset["selections"], f"preset selections missing: {asset_id}"
            assert isinstance(preset.get("visual_recipe"), dict), f"preset visual_recipe missing: {asset_id}"
            assert preset.get("license") == item["license"], f"preset license must match catalog: {asset_id}"
            assert preset.get("source_url") == item["source_url"], f"preset provenance must match catalog: {asset_id}"
            rules = json.loads((ROOT / "character_rules.json").read_text(encoding="utf-8"))
            for category, value in preset["selections"].items():
                options = rules.get("categories", {}).get(category)
                assert isinstance(options, list), f"preset uses unknown catalog category {category}: {asset_id}"
                assert any(option.get("id") == value for option in options), f"preset uses unknown value {category}={value}: {asset_id}"
            recipe = preset["visual_recipe"]
            assert recipe.get("schema_version") == 3 and recipe.get("family") == "cyberstreet", f"unsupported visual recipe in preset: {asset_id}"
            for key in ("anime_influence", "toon_influence", "streetwear_cyberpunk", "detail_level", "torso_length", "sleeve_length", "waist_fit"):
                assert isinstance(recipe.get(key), int) and 0 <= recipe[key] <= 100, f"invalid {key} in preset: {asset_id}"
        kinds[item["kind"]] = kinds.get(item["kind"], 0) + 1
    license_notice = ROOT / "assets" / "licenses" / "README.md"
    assert license_notice.is_file() and "LicenseRef-BotImagen-Original-Assets" in license_notice.read_text(encoding="utf-8"), "original asset license notice missing"
    return {"assets": len(assets), "kinds": kinds}


def main() -> None:
    result = validate_catalog()
    kind_summary = ", ".join(f"{kind}={count}" for kind, count in sorted(result["kinds"].items()))
    print(f"PASS: {result['assets']} local visual assets validated ({kind_summary}); all files exist and provenance/license fields are complete")


if __name__ == "__main__":
    main()
