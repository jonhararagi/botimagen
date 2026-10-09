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
    assert data["version"] == 12
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
    selected_tip = solid["profile"]["hair_tip_color"]
    tip_prompt = next(
        item["prompt_en"] for item in generator.categories["hair_tip_color"]
        if item["id"] == selected_tip
    )
    assert tip_prompt in solid["prompt"], "The selected tip zone and generated prompt must stay synchronized"

    solid_with_contrast = generator.generate(
        {
            "hair": "rojo_coral",
            "hair_color_pattern": "color_solido",
            "hair_tip_color": "turquoise",
        },
        seed=915,
    )
    assert solid_with_contrast["profile"]["hair_tip_color"] == "turquoise"
    assert "turquoise color confined to the hair tips with a clean transition" in solid_with_contrast["prompt"]

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


def test_catalog_declares_valid_hairstyle_length_compatibility():
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    lengths = {item["id"] for item in rules["categories"]["hair_length"]}
    for style in rules["categories"]["hairstyle"]:
        allowed = style.get("compatible_with", {}).get("hair_length")
        assert allowed, f"{style['id']} must declare compatible hair lengths"
        assert set(allowed).issubset(lengths), (style["id"], allowed)


def test_auto_hairstyle_respects_manually_selected_length():
    generator = CharacterGenerator(RULES)
    rules = generator.rules
    for length in ("pixie", "corto", "a_los_hombros", "largo", "extra_largo"):
        for seed in range(12):
            result = generator.generate(
                {"hair_length": length, "hairstyle": "auto"},
                seed=seed,
                coherence=0.45,
            )
            style = next(
                item for item in rules["categories"]["hairstyle"]
                if item["id"] == result["profile"]["hairstyle"]
            )
            assert length in style["compatible_with"]["hair_length"], (
                length, seed, result["profile"]["hairstyle"]
            )


def test_auto_hair_length_respects_manually_selected_hairstyle():
    generator = CharacterGenerator(RULES)
    for style_id in ("short_wavy", "long_flowing", "hime_cut", "wolf_cut", "long_straight"):
        style = next(
            item for item in generator.categories["hairstyle"]
            if item["id"] == style_id
        )
        allowed = set(style["compatible_with"]["hair_length"])
        for seed in range(12):
            result = generator.generate(
                {"hairstyle": style_id, "hair_length": "auto"},
                seed=seed,
                coherence=0.45,
            )
            assert result["profile"]["hair_length"] in allowed, (
                style_id, seed, result["profile"]["hair_length"]
            )


def test_manual_hairstyle_and_length_locks_are_never_overridden():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {"hairstyle": "long_flowing", "hair_length": "pixie"},
        seed=9917,
    )
    assert result["profile"]["hairstyle"] == "long_flowing"
    assert result["profile"]["hair_length"] == "pixie"


    test_auto_scale_pattern_respects_species_compatibility()
    test_new_scale_regions_are_manual_and_prompted_independently()
    test_scale_color_is_omitted_when_pattern_has_no_visible_scales()
    print("PASS: character generator tests")

def test_catalog_declares_valid_hair_arrangement_length_compatibility():
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    lengths = {item["id"] for item in rules["categories"]["hair_length"]}
    arrangements = rules["categories"]["hair_arrangement"]
    assert len(arrangements) == 10
    for arrangement in arrangements:
        allowed = arrangement.get("compatible_with", {}).get("hair_length")
        assert allowed, f"{arrangement['id']} must declare compatible hair lengths"
        assert set(allowed).issubset(lengths), (arrangement["id"], allowed)


def test_auto_hair_arrangement_respects_manually_selected_length():
    generator = CharacterGenerator(RULES)
    for length in ("pixie", "muy_corto", "corto", "a_los_hombros", "largo", "extra_largo"):
        for seed in range(12):
            result = generator.generate(
                {"hair_length": length, "hair_arrangement": "auto"},
                seed=seed,
                coherence=0.4,
            )
            arrangement = next(
                item for item in generator.categories["hair_arrangement"]
                if item["id"] == result["profile"]["hair_arrangement"]
            )
            assert length in arrangement["compatible_with"]["hair_length"], (
                length, seed, result["profile"]["hair_arrangement"]
            )


def test_auto_hair_length_respects_manually_selected_arrangement():
    generator = CharacterGenerator(RULES)
    for arrangement_id in (
        "coleta_alta", "coletas_gemelas", "media_coleta",
        "coleta_trenzada", "mono_alto", "trenza_lateral_recogida",
    ):
        arrangement = next(
            item for item in generator.categories["hair_arrangement"]
            if item["id"] == arrangement_id
        )
        allowed = set(arrangement["compatible_with"]["hair_length"])
        for seed in range(12):
            result = generator.generate(
                {"hair_arrangement": arrangement_id, "hair_length": "auto"},
                seed=seed,
                coherence=0.4,
            )
            assert result["profile"]["hair_length"] in allowed, (
                arrangement_id, seed, result["profile"]["hair_length"]
            )


def test_manual_hair_arrangement_and_length_locks_are_never_overridden():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {"hair_arrangement": "coleta_alta", "hair_length": "pixie"},
        seed=9918,
    )
    assert result["profile"]["hair_arrangement"] == "coleta_alta"
    assert result["profile"]["hair_length"] == "pixie"





def test_catalog_declares_valid_outfit_role_compatibility():
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    roles = {item["id"] for item in rules["categories"]["combat_role"]}
    outfits = rules["categories"]["outfit"]
    assert len(outfits) == 10
    for outfit in outfits:
        allowed = outfit.get("compatible_with", {}).get("combat_role")
        assert allowed, f"{outfit['id']} must declare compatible combat roles"
        assert set(allowed).issubset(roles), (outfit["id"], allowed)


def test_auto_outfit_respects_manually_selected_combat_role():
    generator = CharacterGenerator(RULES)
    for role in ("striker", "support", "tank", "control", "pitcher"):
        for seed in range(12):
            result = generator.generate(
                {"combat_role": role, "outfit": "auto"},
                seed=seed,
                coherence=0.4,
            )
            outfit = next(
                item for item in generator.categories["outfit"]
                if item["id"] == result["profile"]["outfit"]
            )
            assert role in outfit["compatible_with"]["combat_role"], (
                role, seed, result["profile"]["outfit"]
            )


def test_auto_combat_role_respects_manually_selected_outfit():
    generator = CharacterGenerator(RULES)
    for outfit_id in (
        "combat_jacket", "light_armor", "idol_combat", "elegant_command",
        "support_coat", "baseball_tech_suit", "armadura_asimetrica",
    ):
        outfit = next(
            item for item in generator.categories["outfit"]
            if item["id"] == outfit_id
        )
        allowed = set(outfit["compatible_with"]["combat_role"])
        for seed in range(12):
            result = generator.generate(
                {"outfit": outfit_id, "combat_role": "auto"},
                seed=seed,
                coherence=0.4,
            )
            assert result["profile"]["combat_role"] in allowed, (
                outfit_id, seed, result["profile"]["combat_role"]
            )


def test_manual_outfit_and_combat_role_locks_are_preserved():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {"outfit": "light_armor", "combat_role": "striker"},
        seed=9919,
    )
    assert result["profile"]["outfit"] == "light_armor"
    assert result["profile"]["combat_role"] == "striker"

def test_catalog_declares_valid_baseball_prop_role_compatibility():
    rules = json.loads(RULES.read_text(encoding="utf-8"))
    roles = {item["id"] for item in rules["categories"]["combat_role"]}
    props = rules["categories"]["baseball_prop"]
    assert len(props) == 10
    covered_roles = set()
    for prop in props:
        allowed = prop.get("compatible_with", {}).get("combat_role")
        assert allowed, f"{prop['id']} must declare compatible combat roles"
        assert set(allowed).issubset(roles), (prop["id"], allowed)
        covered_roles.update(allowed)
    assert covered_roles == roles, (covered_roles, roles)


def test_auto_baseball_prop_respects_manually_selected_combat_role():
    generator = CharacterGenerator(RULES)
    for role in ("striker", "support", "tank", "control", "pitcher"):
        for seed in range(12):
            result = generator.generate(
                {"combat_role": role, "baseball_prop": "auto"},
                seed=seed,
                coherence=0.4,
            )
            prop = next(
                item for item in generator.categories["baseball_prop"]
                if item["id"] == result["profile"]["baseball_prop"]
            )
            assert role in prop["compatible_with"]["combat_role"], (
                role, seed, result["profile"]["baseball_prop"]
            )


def test_auto_combat_role_respects_manually_selected_baseball_prop():
    generator = CharacterGenerator(RULES)
    for prop in generator.categories["baseball_prop"]:
        allowed = set(prop["compatible_with"]["combat_role"])
        for seed in range(8):
            result = generator.generate(
                {"baseball_prop": prop["id"], "combat_role": "auto"},
                seed=seed,
                coherence=0.4,
            )
            assert result["profile"]["combat_role"] in allowed, (
                prop["id"], seed, result["profile"]["combat_role"]
            )


def test_manual_baseball_prop_and_combat_role_locks_are_preserved():
    generator = CharacterGenerator(RULES)
    result = generator.generate(
        {"baseball_prop": "tactical_shield", "combat_role": "striker"},
        seed=9920,
    )
    assert result["profile"]["baseball_prop"] == "tactical_shield"
    assert result["profile"]["combat_role"] == "striker"



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
    test_catalog_declares_valid_hairstyle_length_compatibility()
    test_auto_hairstyle_respects_manually_selected_length()
    test_auto_hair_length_respects_manually_selected_hairstyle()
    test_manual_hairstyle_and_length_locks_are_never_overridden()
    test_catalog_declares_valid_hair_arrangement_length_compatibility()
    test_auto_hair_arrangement_respects_manually_selected_length()
    test_auto_hair_length_respects_manually_selected_arrangement()
    test_manual_hair_arrangement_and_length_locks_are_never_overridden()
    test_catalog_declares_valid_outfit_role_compatibility()
    test_auto_outfit_respects_manually_selected_combat_role()
    test_auto_combat_role_respects_manually_selected_outfit()
    test_manual_outfit_and_combat_role_locks_are_preserved()
    test_catalog_declares_valid_baseball_prop_role_compatibility()
    test_auto_baseball_prop_respects_manually_selected_combat_role()
    test_auto_combat_role_respects_manually_selected_baseball_prop()
    test_manual_baseball_prop_and_combat_role_locks_are_preserved()
