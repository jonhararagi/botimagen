from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from botimagen_server import ApiInputError, generate_from_payload, validate_generation_payload
from character_generator import CharacterGenerator


def recipe(**overrides):
    return {
        "schema_version": 3, "family": "cyberstreet",
        "anime_influence": 72, "toon_influence": 48, "streetwear_cyberpunk": 35, "detail_level": 62,
        "garment_base_color": "#234567", "garment_panel_color": "#456789",
        "garment_accent_color": "#55d9cf", "fabric_pattern": "geometric",
        "torso_length": 24, "sleeve_length": 92, "waist_fit": 76,
        "nanowear_state": "nanoweave", "material_finish": "nanoweave", "emblem_shape": "fox",
        "emblem_color": "#55d9cf", "emblem_contrast": "auto", "emblem_position": "chest", "view": "back",
        **overrides,
    }


def test_legacy_generation_payload_remains_valid_without_visual_recipe():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    legacy = generate_from_payload({"selections": {"species": "humana"}, "seed": 42}, generator)
    assert "visual_recipe" not in legacy
    assert "Visual recipe CyberStreet" not in legacy["prompt"]


def test_visual_recipe_is_validated_and_included_in_prompt():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    payload = {"selections": {"species": "humana"}, "seed": 42, "visual_recipe": recipe()}
    clean = validate_generation_payload(payload, generator)
    assert clean["visual_recipe"]["view"] == "back"
    assert clean["visual_recipe"]["schema_version"] == 3
    assert clean["visual_recipe"]["garment_base_color"] == "#234567"
    result = generate_from_payload(payload, generator)
    assert result["visual_recipe"]["emblem_shape"] == "fox"
    assert "Visual recipe CyberStreet v3" in result["prompt"]
    assert "torso length 24/100" in result["prompt"]
    assert "sleeve length 92/100" in result["prompt"]
    assert "waist fit 76/100" in result["prompt"]
    assert "NanoWear fabric base #234567" in result["prompt"]
    assert "pattern geometric" in result["prompt"]
    assert "technical programmable nanofabric" in result["prompt"]
    assert "Original personal Chromapatch emblem: fox" in result["prompt"]


def test_visual_recipe_rejects_invalid_ranges_enums_and_colors():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    for invalid in (
        recipe(anime_influence=101),
        recipe(torso_length=101),
        recipe(sleeve_length=-1),
        recipe(waist_fit=True),
        recipe(toon_influence=True),
        recipe(nanowear_state="liquid"),
        recipe(emblem_shape="third_party_logo"),
        recipe(emblem_color="url(https://example.invalid/x.svg)"),
        recipe(garment_base_color="#fff"),
        recipe(garment_accent_color="red"),
        recipe(fabric_pattern="unknown"),
        recipe(view="side"),
        recipe(extra_field="ignored"),
    ):
        try:
            validate_generation_payload({"visual_recipe": invalid}, generator)
        except ApiInputError:
            continue
        raise AssertionError(f"Invalid visual recipe was accepted: {invalid!r}")


def test_visual_recipe_v1_and_v2_migrate_to_safe_v3_defaults():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    legacy_v1 = recipe()
    for key in ("garment_base_color", "garment_panel_color", "garment_accent_color", "fabric_pattern", "torso_length", "sleeve_length", "waist_fit"):
        legacy_v1.pop(key)
    legacy_v1["schema_version"] = 1
    clean_v1 = validate_generation_payload({"visual_recipe": legacy_v1}, generator)["visual_recipe"]
    assert clean_v1["schema_version"] == 3
    assert clean_v1["garment_base_color"] == "#343246"
    assert clean_v1["fabric_pattern"] == "circuit"
    assert clean_v1["torso_length"] == 80
    assert clean_v1["sleeve_length"] == 60
    assert clean_v1["waist_fit"] == 50

    legacy_v2 = recipe()
    for key in ("torso_length", "sleeve_length", "waist_fit"):
        legacy_v2.pop(key)
    legacy_v2["schema_version"] = 2
    clean_v2 = validate_generation_payload({"visual_recipe": legacy_v2}, generator)["visual_recipe"]
    assert clean_v2["schema_version"] == 3
    assert clean_v2["garment_base_color"] == "#234567"
    assert clean_v2["fabric_pattern"] == "geometric"
    assert clean_v2["torso_length"] == 80
    assert clean_v2["sleeve_length"] == 60
    assert clean_v2["waist_fit"] == 50


if __name__ == "__main__":
    test_legacy_generation_payload_remains_valid_without_visual_recipe()
    test_visual_recipe_is_validated_and_included_in_prompt()
    test_visual_recipe_rejects_invalid_ranges_enums_and_colors()
    test_visual_recipe_v1_and_v2_migrate_to_safe_v3_defaults()
    print("PASS: CyberStreet visual recipe contract")
