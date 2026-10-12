from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from botimagen_server import ApiInputError, render_character_from_payload
from character_generator import CharacterGenerator
from character_render_engine import DEFAULT_RENDER_RECIPE, RENDERER_ID, render_profile_svg

GENERATOR = CharacterGenerator(ROOT / "character_rules.json")


def test_engine_renders_adult_proportioned_anime_svg_with_layered_geometry():
    svg = render_profile_svg({
        "species": "draconica", "height_cm": "h170", "body_build": "fuerte_guardiana",
        "body_proportions": "piernas_largas", "silhouette": "elegante_larga", "skin_tone": "porcelana_neutra",
        "hair": "rojo_coral", "hair_tip_color": "metallic_gold", "hairstyle": "long_flowing",
        "hair_length": "largo", "hair_bangs": "cortina", "hair_texture": "ondas_suaves", "eyes": "ambar", "eye_shape": "grande_expresiva",
        "expression": "sonrisa_abierta", "mouth_style": "sonrisa_amplia", "outfit": "street_bomber", "outer_layer": "long_coat",
        "ear_style": "orejas_gato", "tail_style": "cola_draconica", "horn_style": "cuernos_curvos",
    }, DEFAULT_RENDER_RECIPE)
    assert svg.startswith('<svg class="parametric-anime-svg"')
    assert 'viewBox="0 0 400 640"' in svg
    assert f'data-renderer="{RENDERER_ID}"' in svg
    assert 'data-head-count="6.' in svg
    assert 'data-face-maturity="1.' in svg
    assert 'class="extra-ear"' in svg
    assert 'class="extra-tail"' in svg
    assert 'class="extra-horn"' in svg
    assert 'class="hair-texture-strand"' in svg
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



def test_hair_bangs_texture_mouth_and_brows_change_the_rendered_svg():
    common = {
        "skin_tone": "marfil_calido", "hair_length": "largo",
        "hairstyle": "long_flowing", "eyes": "azul_hielo", "outfit": "idol_combat",
        "hair": "rojo_coral", "hair_bangs": "recto", "hair_texture": "liso_sedoso",
    }
    straight = render_profile_svg(common, DEFAULT_RENDER_RECIPE)
    curtain = render_profile_svg({**common, "hair_bangs": "cortina"}, DEFAULT_RENDER_RECIPE)
    wavy = render_profile_svg({**common, "hair_texture": "ondas_suaves"}, DEFAULT_RENDER_RECIPE)
    mouth = render_profile_svg({**common, "mouth_style": "puchero"}, DEFAULT_RENDER_RECIPE)
    brow = render_profile_svg({**common, "eyebrow_style": "anguladas"}, DEFAULT_RENDER_RECIPE)
    assert len({straight,curtain,wavy,mouth,brow}) == 5
    assert 'class="hair-texture-strand"' in wavy


def test_face_shape_and_nose_controls_reach_the_parametric_face():
    common = {
        "skin_tone": "marfil_calido",
        "hair": "azul_nocturno",
        "hairstyle": "long_straight",
        "hair_length": "largo",
        "outfit": "tactical_baseball",
    }
    short_minimal = render_profile_svg({
        **common, "face_shape": "menton_corto", "nose_style": "minima",
    }, DEFAULT_RENDER_RECIPE)
    long_bridge = render_profile_svg({
        **common, "face_shape": "rostro_alargado", "nose_style": "puente_recto",
    }, DEFAULT_RENDER_RECIPE)

    assert 'data-face-shape="menton_corto"' in short_minimal
    assert 'data-face-shape="rostro_alargado"' in long_bridge
    assert 'data-nose-style="minima"' in short_minimal
    assert 'data-nose-style="puente_recto"' in long_bridge
    assert 'data-face-maturity="0.86"' in short_minimal
    assert 'data-face-maturity="1.12"' in long_bridge
    assert short_minimal != long_bridge, "Face shape and nose selections must alter the actual SVG"


def test_rear_hair_length_and_braid_change_the_rendered_silhouette():
    common = {
        "skin_tone": "marfil_calido",
        "hair": "turquesa",
        "hairstyle": "long_flowing",
        "outfit": "street_bomber",
    }
    recipe = {**DEFAULT_RENDER_RECIPE, "view": "back"}
    short = render_profile_svg({**common, "hair_length": "a_la_mandibula"}, recipe)
    long = render_profile_svg({**common, "hair_length": "muy_largo", "back_hair": "puntas_largas"}, recipe)
    braided = render_profile_svg({**common, "hair_length": "largo", "back_hair": "panel_trenzado"}, recipe)

    short_path = re.search(r'class="back-head-cover"[^>]*d="([^"]+)"', short)
    long_path = re.search(r'class="back-head-cover"[^>]*d="([^"]+)"', long)
    assert short_path and long_path
    assert short_path.group(1) != long_path.group(1), "Rear hair silhouette must follow selected hair length"
    assert 'class="back-hair-strand"' in long
    assert 'class="back-hair-braid"' in braided
    assert short != long != braided
