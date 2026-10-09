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
        "bust_size",
        "hair_root_color",
        "hair_crown_color",
        "hair_inner_color",
        "scale_pattern",
        "scale_color",
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
    assert "modern Japanese anime gacha-game character illustration" in result["prompt"]
    assert result["style_id"] == "bw-modern-gacha-v1"
    assert result["style_name"] == "Anime moderno de gacha"
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


def test_height_selections_are_locked_and_drive_stature():
    generator = CharacterGenerator(RULES)
    short = generator.generate({"height_cm": "h145"}, seed=345)
    tall = generator.generate({"height_cm": "h190"}, seed=345)
    assert short["profile"]["height_cm"] == "h145"
    assert short["profile"]["stature"] == "bajita"
    assert tall["profile"]["height_cm"] == "h190"
    assert tall["profile"]["stature"] == "alta"


def test_modular_bust_scales_and_hair_zones_are_independent():
    generator = CharacterGenerator(RULES)
    selections = {
        "species": "draconica",
        "bust_size": "voluminous",
        "hair": "rojo_coral",
        "hair_root_color": "metallic_gold",
        "hair_crown_color": "pearl_silver",
        "hair_inner_color": "turquoise",
        "scale_pattern": "forearm_shin_scales",
        "scale_color": "obsidian_black",
    }
    result = generator.generate(selections, seed=2026, coherence=0.95)

    for category, value in selections.items():
        assert result["profile"][category] == value

    prompt = result["prompt"]
    assert "very full bust proportion integrated into adult anatomy and functional combat clothing" in prompt
    assert "metallic gold roots with a short clean transition into the base hair color" in prompt
    assert "pearl silver color concentrated only across the crown of the head" in prompt
    assert "turquoise color visible only on the inner hair layers" in prompt
    assert "small scale patches limited to forearms and shins" in prompt
    assert "obsidian black scales with subtle cool reflections" in prompt


if __name__ == "__main__":
    test_rules_have_expected_categories()
    test_generator_locks_user_choices_and_fills_auto()
    test_joyful_short_character_prefers_warm_hair()
    test_serious_angry_character_prefers_dark_voice_palette()
    test_height_selections_are_locked_and_drive_stature()
    test_modular_bust_scales_and_hair_zones_are_independent()
    print("PASS: character generator tests")