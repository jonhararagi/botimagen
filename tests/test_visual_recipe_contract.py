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
        "schema_version": 1, "family": "cyberstreet",
        "anime_influence": 72, "toon_influence": 48, "streetwear_cyberpunk": 35, "detail_level": 62,
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
    result = generate_from_payload({"selections": {"species": "humana"}, "seed": 42, "visual_recipe": recipe()}, generator)
    assert result["visual_recipe"]["emblem_shape"] == "fox"
    assert "Visual recipe CyberStreet v1" in result["prompt"]
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
        recipe(view="side"),
        recipe(extra_field="ignored"),
    ):
        try:
            validate_generation_payload({"visual_recipe": invalid}, generator)
        except ApiInputError:
            continue
        raise AssertionError(f"Invalid visual recipe was accepted: {invalid!r}")
