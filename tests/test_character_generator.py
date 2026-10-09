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
        "hair_tip_color",
        "scale_pattern",
        "scale_color",
    }
    assert expected.issubset(data.get("categories", {}))
    assert data["version"] == 7
    expected_scale_patterns = {
        "dorsal_hand_scales",
        "outer_thigh_scales",
        "nape_spine_scales",
        "jawline_scales",
    }
    actual_scale_patterns = {item["id"] for item in data["categories"]["scale_pattern"]}
    assert expected_scale_patterns.issubset(actual_scale_patterns)


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
        "hair_color_pattern": "puntas_doradas",
        "hair_secondary_color": "plata_perla",
        "hair_tip_color": "turquoise",
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
    assert "turquoise color confined to the hair tips with a clean transition" in prompt
    assert "pearl silver as the secondary/accent color" in prompt
    assert "metallic gold tips" not in prompt
    assert "small scale patches limited to forearms and shins" in prompt
    assert "obsidian black scales with subtle cool reflections" in prompt




def test_hair_tip_color_is_independent_from_pattern_and_other_zones():
    generator = CharacterGenerator(RULES)
    selections = {
        "hair": "rojo_coral",
        "hair_color_pattern": "puntas_doradas",
        "hair_secondary_color": "plata_perla",
        "hair_tip_color": "turquoise",
        "hair_root_color": "metallic_gold",
        "hair_crown_color": "pearl_silver",
        "hair_inner_color": "bubblegum_pink",
    }
    result = generator.generate(selections, seed=7707, coherence=0.95)

    for category, value in selections.items():
        assert result["profile"][category] == value
    prompt = result["prompt"]
    assert "turquoise color confined to the hair tips with a clean transition" in prompt
    assert "pearl silver as the secondary/accent color" in prompt
    assert "metallic gold roots with a short clean transition into the base hair color" in prompt
    assert "pearl silver color concentrated only across the crown of the head" in prompt
    assert "bubblegum pink color visible only on the inner hair layers" in prompt
    assert "gradient ending in metallic gold tips" not in prompt
    assert "silver-tipped hair gradient" not in prompt

def test_scale_color_is_omitted_when_pattern_has_no_visible_scales():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {
            "species": "humana",
            "scale_pattern": "no_visible_scales",
            "scale_color": "obsidian_black",
        },
        seed=2048,
    )

    assert result["profile"]["scale_pattern"] == "no_visible_scales"
    assert result["profile"]["scale_color"] == "obsidian_black"
    assert "no visible scales on the character" in result["prompt"]
    assert "obsidian black scales with subtle cool reflections" not in result["prompt"]

def test_auto_scale_pattern_respects_species_compatibility():
    generator = CharacterGenerator(RULES)
    species_ids = [item["id"] for item in generator.categories["species"]]

    for species in species_ids:
        for seed in range(12):
            result = generator.generate(
                {"species": species, "scale_pattern": "auto"},
                seed=seed,
                coherence=0.4,
            )
            selected = result["profile"]["scale_pattern"]
            if species == "draconica":
                assert selected != "no_visible_scales", (species, seed, selected)
            else:
                assert selected == "no_visible_scales", (species, seed, selected)


def test_new_scale_regions_are_manual_and_prompted_independently():
    generator = CharacterGenerator(RULES)
    expected_prompts = {
        "dorsal_hand_scales": "small smooth overlapping scales limited to the backs of the hands and knuckles",
        "outer_thigh_scales": "fine scale accents limited to the outer hips and upper thighs",
        "nape_spine_scales": "a narrow orderly ridge of overlapping scales from the nape along the upper spine",
        "jawline_scales": "tiny refined scales tracing the jawline below the ears",
    }

    for pattern_id, prompt_fragment in expected_prompts.items():
        result = generator.generate(
            {
                "species": "draconica",
                "scale_pattern": pattern_id,
                "scale_color": "metallic_gold",
            },
            seed=8701,
            coherence=0.95,
        )
        assert result["profile"]["scale_pattern"] == pattern_id
        assert prompt_fragment in result["prompt"]
        assert "metallic gold scale color with controlled highlights" in result["prompt"]



def test_auto_hair_pattern_responds_to_explicit_zone_contrast():
    generator = CharacterGenerator(RULES)
    scenarios = (
        ({"hair_root_color": "metallic_gold"}, "raices_contraste"),
        ({"hair_inner_color": "turquoise"}, "capa_interior"),
    )
    for extra, expected_pattern in scenarios:
        for seed in range(8):
            result = generator.generate(
                {"hair": "rojo_coral", **extra},
                seed=seed,
                coherence=0.9,
            )
            assert result["profile"]["hair_color_pattern"] == expected_pattern, (
                extra, seed, result["profile"]["hair_color_pattern"]
            )

    tip_result = generator.generate(
        {"hair": "rojo_coral", "hair_tip_color": "turquoise"},
        seed=7707,
        coherence=0.9,
    )
    assert tip_result["profile"]["hair_color_pattern"] in {
        "puntas_doradas", "puntas_plateadas", "degradado_suave", "ombre_oscuro_claro"
    }


def test_auto_hair_zone_colors_follow_distribution_without_breaking_manual_locks():
    generator = CharacterGenerator(RULES)
    scenarios = (
        ("raices_contraste", "hair_root_color"),
        ("capa_interior", "hair_inner_color"),
        ("puntas_doradas", "hair_tip_color"),
    )
    for pattern_value, zone in scenarios:
        for seed in range(16):
            result = generator.generate(
                {"hair": "rojo_coral", "hair_color_pattern": pattern_value},
                seed=seed,
                coherence=0.55,
            )
            assert result["profile"][zone] != "matching_base", (
                pattern_value, zone, seed, result["profile"][zone]
            )

    solid = generator.generate(
        {"hair": "rojo_coral", "hair_color_pattern": "color_solido"},
        seed=913,
        coherence=0.9,
    )
    assert solid["profile"]["hair_tip_color"] == "matching_base"

    locked = generator.generate(
        {
            "hair": "rojo_coral",
            "hair_color_pattern": "puntas_doradas",
            "hair_tip_color": "turquoise",
        },
        seed=914,
    )
    assert locked["profile"]["hair_tip_color"] == "turquoise"
    assert "turquoise color confined to the hair tips with a clean transition" in locked["prompt"]
    assert "golden tips" not in locked["prompt"]
    assert "metallic gold color confined to the hair tips" not in locked["prompt"]


def test_auto_secondary_color_contrasts_with_base_for_accent_patterns():
    generator = CharacterGenerator(RULES)
    base_family = next(
        item["color_family"] for item in generator.categories["hair"]
        if item["id"] == "rojo_coral"
    )
    for seed in range(16):
        result = generator.generate(
            {
                "hair": "rojo_coral",
                "hair_color_pattern": "mechones_color",
                "hair_secondary_color": "auto",
            },
            seed=seed,
            coherence=0.55,
        )
        selected = result["profile"]["hair_secondary_color"]
        selected_family = next(
            item["color_family"] for item in generator.categories["hair_secondary_color"]
            if item["id"] == selected
        )
        assert selected_family != base_family, (seed, selected)
        assert result["profile"]["hair_color_pattern"] == "mechones_color"


if __name__ == "__main__":
    test_rules_have_expected_categories()
    test_generator_locks_user_choices_and_fills_auto()
    test_joyful_short_character_prefers_warm_hair()
    test_serious_angry_character_prefers_dark_voice_palette()
    test_height_selections_are_locked_and_drive_stature()
    test_modular_bust_scales_and_hair_zones_are_independent()
    test_hair_tip_color_is_independent_from_pattern_and_other_zones()
    test_auto_hair_pattern_responds_to_explicit_zone_contrast()
    test_auto_hair_zone_colors_follow_distribution_without_breaking_manual_locks()
    test_auto_secondary_color_contrasts_with_base_for_accent_patterns()
    test_auto_scale_pattern_respects_species_compatibility()
    test_new_scale_regions_are_manual_and_prompted_independently()
    test_scale_color_is_omitted_when_pattern_has_no_visible_scales()
    print("PASS: character generator tests")