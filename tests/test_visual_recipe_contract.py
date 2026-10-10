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
        "schema_version": 2, "family": "cyberstreet",
        "anime_influence": 72, "toon_influence": 48, "streetwear_cyberpunk": 35, "detail_level": 62,
        "garment_base_color": "#234567", "garment_panel_color": "#456789", "garment_accent_color": "#55d9cf", "fabric_pattern": "geometric",
        "garment_base_color": "#234567", "garment_panel_color": "#456789", "garment_accent_color": "#55d9cf", "fabric_pattern": "geometric",
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
    clean = validate_generation_payload({"selections": {"species": "humana"}, "seed": 42, "visual_recipe": recipe()}, generator)
    assert clean["visual_recipe"]["view"] == "back"
    assert clean["visual_recipe"]["schema_version"] == 2
    assert clean["visual_recipe"]["garment_base_color"] == "#234567"
    assert clean["visual_recipe"]["schema_version"] == 2
    assert clean["visual_recipe"]["garment_base_color"] == "#234567"
    result = generate_from_payload({"selections": {"species": "humana"}, "seed": 42, "visual_recipe": recipe()}, generator)
    assert result["visual_recipe"]["emblem_shape"] == "fox"
    assert "Visual recipe CyberStreet v2" in result["prompt"]
    assert "NanoWear fabric base #234567" in result["prompt"]
    assert "pattern geometric" in result["prompt"]
    assert "technical programmable nanofabric" in result["prompt"]
    assert "Original personal Chromapatch emblem: fox" in result["prompt"]


def test_visual_recipe_rejects_invalid_ranges_enums_and_colors():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    for invalid in (
        recipe(anime_influence=101),
        recipe(toon_influence=True),
        recipe(nanowear_state="liquid"),
        recipe(emblem_shape="third_party_logo"),
        recipe(emblem_color="url(https://example.invalid/x.svg)"),
        recipe(garment_base_color="#fff"),
        recipe(fabric_pattern="unknown"),
        recipe(garment_base_color="#fff"),
        recipe(fabric_pattern="unknown"),
        recipe(view="side"),
        recipe(extra_field="ignored"),
    ):
        try:
            validate_generation_payload({"visual_recipe": invalid}, generator)
        except ApiInputError:
            continue
        raise AssertionError(f"Invalid visual recipe was accepted: {invalid!r}")

 
def test_visual_recipe_v1_migrates_to_safe_v2_defaults():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    legacy = recipe()
    for key in ("garment_base_color", "garment_panel_color", "garment_accent_color", "fabric_pattern"):
        legacy.pop(key)
    legacy["schema_version"] = 1
    clean = validate_generation_payload({"visual_recipe": legacy}, generator)["visual_recipe"]
    assert clean["schema_version"] == 2
    assert clean["garment_base_color"] == "#343246"
    assert clean["garment_panel_color"] == "#48516a"
    assert clean["garment_accent_color"] == "#5ce4dc"
    assert clean["fabric_pattern"] == "circuit"


def test_visual_recipe_v1_migrates_to_safe_v2_defaults():
    generator = CharacterGenerator(ROOT / "character_rules.json")
    legacy = recipe()
    for key in ("garment_base_color", "garment_panel_color", "garment_accent_color", "fabric_pattern"):
        legacy.pop(key)
    legacy["schema_version"] = 1
    clean = validate_generation_payload({"visual_recipe": legacy}, generator)["visual_recipe"]
    assert clean["schema_version"] == 2
    assert clean["garment_base_color"] == "#343246"
    assert clean["garment_panel_color"] == "#48516a"
    assert clean["garment_accent_color"] == "#5ce4dc"
    assert clean["fabric_pattern"] == "circuit"


if __name__ == "__main__":
    test_legacy_generation_payload_remains_valid_without_visual_recipe()
    test_visual_recipe_is_validated_and_included_in_prompt()
    test_visual_recipe_rejects_invalid_ranges_enums_and_colors()
    test_visual_recipe_v1_migrates_to_safe_v2_defaults()
    test_visual_recipe_v1_migrates_to_safe_v2_defaults()
    print("PASS: CyberStreet visual recipe contract")
