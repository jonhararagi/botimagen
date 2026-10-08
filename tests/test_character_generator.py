from __future__ import annotations

import json
from pathlib import Path

from character_generator import CharacterGenerator


ROOT = Path(__file__).resolve().parents[1]
RULES = ROOT / "character_rules.json"


def test_rules_have_expected_categories():
    data = json.loads(RULES.read_text(encoding="utf-8"))
    expected = {
        "personality",
        "stature",
        "silhouette",
        "expression",
        "hair",
        "eyes",
        "voice",
        "combat_role",
    }
    assert expected.issubset(data.get("categories", {}))


def test_generator_locks_user_choices_and_fills_auto():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "personality": "alegre",
            "stature": "bajita",
            "silhouette": "auto",
            "expression": "auto",
            "hair": "auto",
            "eyes": "auto",
            "voice": "auto",
            "combat_role": "auto",
        },
        seed=1234,
    )
    assert result["profile"]["personality"] == "alegre"
    assert result["profile"]["stature"] == "bajita"
    for category in (
        "silhouette",
        "expression",
        "hair",
        "eyes",
        "voice",
        "combat_role",
    ):
        assert result["profile"][category] != "auto"
    assert result["prompt"]
    assert result["negative_prompt"]


def test_joyful_short_character_prefers_warm_hair():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "personality": "alegre",
            "stature": "bajita",
            "expression": "sonrisa_abierta",
        },
        seed=10,
    )
    assert result["profile"]["hair"] in {"rojo_coral", "naranja_tangerina"}


def test_serious_cold_character_prefers_dark_voice_palette():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "personality": "seria",
            "expression": "mirada_fria",
        },
        seed=20,
    )
    assert result["profile"]["voice"] in {
        "violeta_sereno",
        "obsidiana_profunda",
    }


if __name__ == "__main__":
    test_rules_have_expected_categories()
    test_generator_locks_user_choices_and_fills_auto()
    test_joyful_short_character_prefers_warm_hair()
    test_serious_cold_character_prefers_dark_voice_palette()
    print("PASS: character generator tests")
