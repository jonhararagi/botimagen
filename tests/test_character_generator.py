from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_generator import CharacterGenerator


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
    assert result["coherence"] == 0.82
    assert "outfit" in result["profile"]
    assert "hairstyle" in result["profile"]
    assert "quirk" in result["profile"]
    assert result["surprise"] is False


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


def test_coherence_changes_variation_pool_but_keeps_locks():
    generator = CharacterGenerator(RULES)
    locked = {"personality": "rebelde", "stature": "bajita", "hair": "auto"}
    strict = generator.generate(locked, seed=99, coherence=1.0)
    varied = generator.generate(locked, seed=99, coherence=0.25)
    assert strict["profile"]["personality"] == "rebelde"
    assert varied["profile"]["personality"] == "rebelde"
    assert strict["profile"]["stature"] == "bajita"
    assert varied["profile"]["stature"] == "bajita"
    assert strict["coherence"] == 1.0
    assert varied["coherence"] == 0.25


def test_surprise_mode_prefers_character_quirks():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "personality": "seria",
            "stature": "bajita",
            "quirk": "auto",
        },
        seed=7,
        surprise=True,
    )
    assert result["surprise"] is True
    assert result["profile"]["quirk"]
    assert result["coherence"] == 0.82


def test_serious_angry_character_prefers_dark_voice_palette():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "personality": "seria",
            "expression": "mirada_enojada",
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
    test_serious_angry_character_prefers_dark_voice_palette()
    print("PASS: character generator tests")
