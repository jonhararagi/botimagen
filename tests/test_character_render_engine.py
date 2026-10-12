from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from botimagen_server import ApiInputError, render_character_from_payload
from character_generator import CharacterGenerator
from character_render_engine import DEFAULT_RENDER_RECIPE, RENDERER_ID, render_profile_svg

GENERATOR = CharacterGenerator(ROOT / "character_rules.json")


def test_engine_renders_full_transparent_svg_with_layered_anime_geometry():
    svg = render_profile_svg({
        "species": "draconica", "height_cm": "h170", "body_build": "fuerte_guardiana",
        "body_proportions": "piernas_largas", "skin_tone": "porcelana_neutra",
        "hair": "rojo_coral", "hair_tip_color": "metallic_gold", "hairstyle": "long_flowing",
        "hair_length": "largo", "eyes": "ambar", "eye_shape": "grande_expresiva",
        "expression": "sonrisa_abierta", "outfit": "street_bomber", "outer_layer": "long_coat",
        "ear_style": "orejas_gato", "tail_style": "cola_draconica", "horn_style": "cuernos_curvos",
    }, DEFAULT_RENDER_RECIPE)
    assert svg.startswith('<svg class="parametric-anime-svg"')
    assert 'viewBox="0 0 400 640"' in svg
    assert f'data-renderer="{RENDERER_ID}"' in svg
    assert 'class="extra-ear"' in svg
    assert 'class="extra-tail"' in svg
    assert 'class="extra-horn"' in svg
    assert len(svg) > 12000
    assert svg.count("<path") > 30
    assert "</svg>" in svg


def test_catalogue_colors_change_the_actual_rendered_output():
    common = {
        "skin_tone": "marfil_calido", "hair_length": "largo",
        "hairstyle": "long_flowing", "eyes": "azul_hielo", "outfit": "idol_combat",
    }
    red = render_profile_svg({**common, "hair": "rojo_coral"}, DEFAULT_RENDER_RECIPE)
    blue = render_profile_svg({**common, "hair": "azul_nocturno"}, DEFAULT_RENDER_RECIPE)
    assert red != blue
    assert 'data-hair-color="#e65369"' in red
    assert 'data-hair-color="#354e9a"' in blue
    assert 'data-eye-color="#80c5ed"' in red


def test_visual_recipe_drives_fabric_geometry_emblem_and_back_view():
    recipe = {
        **DEFAULT_RENDER_RECIPE, "fabric_pattern": "geometric",
        "nanowear_state": "transformation", "garment_accent_color": "#ff55cc",
        "emblem_shape": "star", "view": "front",
    }
    front = render_profile_svg({"hair": "turquesa", "outfit": "combat_jacket"}, recipe)
    assert 'class="cyberpunk-fabric-details"' in front
    assert 'class="chromapatch"' in front
    assert "#ff55cc" in front
    back = render_profile_svg({"hair": "turquesa", "outfit": "combat_jacket"}, {**recipe, "view": "back"})
    assert 'data-view="back"' in back
    assert 'class="back-head-cover"' in back
    assert 'class="back-clothing-panel"' in back
    assert front != back


def test_render_endpoint_uses_canonical_catalogue_validation():
    payload = {
        "selections": {
            "skin_tone": "porcelana_neutra", "hair": "violeta_profundo",
            "eyes": "verde_esmeralda", "hairstyle": "long_flowing", "outfit": "elegant_command",
        },
        "visual_recipe": DEFAULT_RENDER_RECIPE,
    }
    result = render_character_from_payload(payload, GENERATOR)
    assert result["renderer"] == RENDERER_ID
    assert result["view"] == "front"
    assert result["svg"].startswith('<svg class="parametric-anime-svg"')
    try:
        render_character_from_payload({"selections": {"outfit": "not-a-real-outfit"}}, GENERATOR)
    except ApiInputError as error:
        assert "Opción no disponible" in str(error)
    else:
        raise AssertionError("Unknown catalogue values must not be rendered")
