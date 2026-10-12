"""Translate BotImagen catalogue values into deterministic parametric anime SVG.

Only closed catalogue mappings reach the renderer. Raw user-controlled text is never
interpolated into the SVG. The engine runs locally and has no AI/API dependency.
"""
from __future__ import annotations

import math
import re
from dataclasses import replace
from typing import Any

from vendor.anime_character_creator import CharacterParams, FaceStyle, Outfit, build_skeleton, render_character

RENDERER_ID = "parametric-anime-svg-v1"
SVG_MAX_BYTES = 256 * 1024

DEFAULT_RENDER_RECIPE: dict[str, Any] = {
    "schema_version": 3, "family": "cyberstreet",
    "anime_influence": 68, "toon_influence": 56, "streetwear_cyberpunk": 30, "detail_level": 58,
    "garment_base_color": "#343246", "garment_panel_color": "#48516a",
    "garment_accent_color": "#5ce4dc", "fabric_pattern": "circuit",
    "torso_length": 80, "sleeve_length": 60, "waist_fit": 50,
    "nanowear_state": "everyday", "material_finish": "textile",
    "emblem_shape": "bunny", "emblem_color": "#f3c96b",
    "emblem_contrast": "auto", "emblem_position": "chest", "view": "front",
}
HAIR_COLORS = {
    "rojo_coral":"#e65369", "naranja_tangerina":"#f78b43", "rosa_chicle":"#f17db8",
    "violeta_profundo":"#8056c9", "negro_obsidiana":"#252638", "azul_nocturno":"#354e9a",
    "plateado_perla":"#c6c9d8", "castano_miel":"#9c633c", "rubio_platino":"#eee5b6",
    "turquesa":"#35c9ca", "verde_esmeralda":"#269977", "rubio_dorado":"#e6bd55",
}
EYE_COLORS = {
    "ambar":"#d49a38", "rojo_rubi":"#bf344d", "violeta":"#8d62cb", "azul_hielo":"#80c5ed",
    "verde_esmeralda":"#388e70", "gris_grafito":"#717989", "azul_profundo":"#3457a4",
    "celeste":"#63b9e7", "verde_lima":"#8bbf45", "rosa_opalina":"#df83b8",
}
SKIN_COLORS = {
    "porcelana_neutra":"#f2d8cc", "marfil_calido":"#f1d5b4", "beige_claro":"#e8c4a4",
    "durazno":"#efb8a3", "beige_dorado":"#d7a879", "oliva_suave":"#bfaa7f",
    "canela":"#b77b58", "bronce_calido":"#986243", "marron_profundo":"#694635",
    "fantasia_azul_suave":"#9dbbdf",
}
ACCENT_COLORS = {
    "oro_metalico":"#d8b45f", "metallic_gold":"#d8b45f", "pearl_silver":"#d0d4e2",
    "luminous_white":"#f0efff", "ruby_red":"#c83c52", "bubblegum_pink":"#ee8bbd",
    "turquoise":"#3bd5d0", "emerald_green":"#2eac85", "ice_blue":"#84d8f3",
    "deep_violet":"#8e67de", "midnight_blue":"#3a57a2", "coral_red":"#e65369",
    "shadow_obsidian":"#292638",
}
TIP_COLORS = {k:v for k,v in ACCENT_COLORS.items() if k not in {"shadow_obsidian"}}
ROOT_COLORS = {
    "shadow_obsidian":"#292638", "metallic_gold":"#d8b45f", "pearl_silver":"#d0d4e2",
    "coral_red":"#e65369", "midnight_blue":"#3a57a2",
}
HAIRSTYLE_MAP = {
    "bob":"short_layered", "short_wavy":"short_tousled", "long_flowing":"long_traced",
    "hime_cut":"long_fringed", "layered_shag":"long_parted", "asymmetrical":"long_center_part",
    "wolf_cut":"short_tousled", "long_straight":"long_blunt", "curly_lob":"short_tousled",
    "medium_layers":"long_parted",
}
HAIR_LENGTHS = {
    "pixie":0.03, "muy_corto":0.07, "corto":0.12, "a_la_mandibula":0.18,
    "a_los_hombros":0.40, "medio":0.38, "medio_largo":0.58, "largo":0.78,
    "muy_largo":1.00, "extra_largo":1.14,
}
RECIPE_ENUMS = {
    "fabric_pattern":{"plain","circuit","geometric","gradient"},
    "nanowear_state":{"everyday","nanoweave","transformation"},
    "material_finish":{"textile","nanoweave","synthetic"},
    "emblem_shape":{"bunny","star","fox","skull","geo"},
    "emblem_position":{"chest","sleeve","hood"},
    "view":{"front","back"},
}


def normalize_render_recipe(value: Any = None) -> dict[str, Any]:
    source = value if isinstance(value, dict) else {}
    result = dict(DEFAULT_RENDER_RECIPE)
    for key in ("garment_base_color","garment_panel_color","garment_accent_color","emblem_color"):
        candidate = source.get(key)
        if isinstance(candidate, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", candidate):
            result[key] = candidate.lower()
    for key, choices in RECIPE_ENUMS.items():
        candidate = source.get(key)
        if isinstance(candidate, str) and candidate in choices:
            result[key] = candidate
    for key in ("anime_influence","toon_influence","streetwear_cyberpunk","detail_level",
                "torso_length","sleeve_length","waist_fit"):
        candidate = source.get(key)
        if isinstance(candidate, int) and not isinstance(candidate, bool):
            result[key] = max(0, min(100, candidate))
    result["schema_version"] = 3
    result["family"] = "cyberstreet"
    return result


def _shade(color: str, factor: float) -> str:
    rgb = [int(color[i:i+2], 16) for i in (1,3,5)]
    return "#" + "".join(f"{max(0,min(255,round(channel*factor))):02x}" for channel in rgb)


def _frame_multipliers(value: str) -> tuple[float,float,float,float]:
    key = value.lower()
    if any(part in key for part in ("fuerte","potente","robusta","guardiana")):
        return 1.14,1.06,1.08,1.12
    if any(part in key for part in ("delgada","esbelta","ligera","flexible")):
        return .91,.92,.92,.91
    if any(part in key for part in ("atletica","atlética","deportiva")):
        return 1.09,.95,1.02,1.09
    return 1.0,1.0,1.0,1.0


def _head_count(values: dict[str,str]) -> float:
    """Adult-anime head/body ratio, adjusted modestly by stature and silhouette."""
    match = re.search(r"\d{3}", values.get("height_cm","h170"))
    cm = int(match.group()) if match else 170
    heads = 6.68 + (cm-170)*.012
    stature = values.get("stature","")
    if stature in {"bajita","muy_bajita","petite"}: heads -= .16
    if stature in {"alta","muy_alta","alta_imponente"}: heads += .16
    proportions = values.get("body_proportions","")
    if proportions in {"piernas_largas","extremidades_largas","esbelta_elegante"}: heads += .12
    if proportions in {"torso_corto_deportivo","compactas_agiles","potencia_compacta"}: heads -= .12
    silhouette = values.get("silhouette","")
    if silhouette in {"compacta_agil","ligera_compacta","potencia_compacta"}: heads -= .08
    if silhouette in {"elegante_larga","esbelta_elegante"}: heads += .08
    return max(6.0,min(7.15,heads))


def _face_maturity(values: dict[str,str]) -> float:
    """Keep every face adult-coded while giving each catalogued jaw/face shape a distinct profile."""
    shape = values.get("face_shape", "equilibrada")
    return {
        "suave": .94,
        "equilibrada": 1.0,
        "afilada": 1.12,
        "corazon": 1.04,
        "diamante": 1.09,
        "mandibula_suave": .92,
        "menton_corto": .86,
        "menton_fino": 1.10,
        "rostro_alargado": 1.12,
        "pomulos_definidos": 1.08,
    }.get(shape, 1.0)


def _resolve_hairstyle(values: dict[str,str]) -> str:
    """Combine the base cut with selected bangs and texture using available SVG hair designs."""
    original=values.get("hairstyle","long_flowing")
    style=HAIRSTYLE_MAP.get(original,"long_traced")
    bangs=values.get("hair_bangs","recto")
    texture=values.get("hair_texture","liso_sedoso")
    sides=values.get("side_hair","mechones_largos")
    back=values.get("back_hair","recto_liso")
    short_base=original in {"bob","short_wavy","wolf_cut","curly_lob"}
    # Use all of the vendored renderer's distinct silhouettes before layering
    # bangs, side locks and texture. Previously several catalog styles collapsed
    # into the same long/short shape even when their back/side controls differed.
    if original == "hime_cut":
        style = "long_fringed"
    elif original == "long_straight":
        style = "long_blunt"
    elif original == "layered_shag":
        style = "long_parted" if HAIR_LENGTHS.get(values.get("hair_length", "medio"), .38) >= .35 else "short_tousled"
    elif original == "asymmetrical":
        style = "long_parted"
    elif original == "wolf_cut":
        style = "short_tousled"
    elif original == "curly_lob":
        style = "short_tousled"
    if short_base:
        if texture in {"ondas_suaves","rizos_sueltos","rizos_definidos","esponjado_suave","puntas_dinamicas","volumen_grueso"}: style="short_tousled"
        if bangs in {"abierto_centro","sin_flequillo"}: style="short_crop"
        elif bangs in {"cubriendo_un_ojo","asimetrico","lateral"}: style="short_tousled"
    else:
        if bangs in {"cortina","abierto_centro","sin_flequillo"}: style="long_center_part"
        elif bangs in {"lateral","cubriendo_un_ojo","asimetrico"}: style="long_parted"
        elif bangs in {"recto","irregular","mechones_separados","corto"} and original in {"long_flowing","hime_cut","long_straight","medium_layers","layered_shag"}: style="long_fringed"
        if sides in {"patillas_hime","volumen_lateral","laterales_asimetricos"}: style="long_fringed"
        elif sides in {"mechones_cortos","detras_orejas"} and original in {"long_flowing","long_straight","medium_layers"}: style="short_layered"
        elif sides in {"laterales_ondulados","rizos_marco","mechones_finos"}: style="long_parted"
        if back in {"nuca_corta","bob_trasero","nuca_despeinada"}: style="short_tousled" if texture in {"ondas_suaves","rizos_sueltos","rizos_definidos"} else "short_layered"
        elif back in {"capas_largas","puntas_largas","ondas_traseras","panel_trenzado","capas_medias","seccion_asimetrica"} and style.startswith("short"): style="long_traced"
        if texture in {"rizos_sueltos","rizos_definidos","esponjado_suave","volumen_grueso"} and style.startswith("long"): style="long_parted"
    return style


def _face_style(values: dict[str,str]) -> FaceStyle:
    eye_shape=values.get("eye_shape","grande_expresiva")
    expression=values.get("expression","mirada_enfocada")
    size,width,corner,openness,tilt=.88,1.04,.42,.92,.04
    if eye_shape in {"grande_expresiva","abiertos","redondos","caidos","suave"}: size,width,corner=.98,1.02,.28
    elif eye_shape in {"afilada","felinos","angulares","asimétricos"}: size,width,corner=.82,1.15,.74
    elif eye_shape=="entornada": openness=.68
    if expression in {"sonrisa_abierta","confiada"}: openness,tilt=1.0,-.04
    elif expression in {"sonrisa_picara","mirada_desafiante"}: openness,tilt=.84,.20
    elif expression in {"mirada_enojada","mirada_fria"}: openness,tilt=.68,.30
    elif expression=="somnolienta": openness,tilt=.52,-.05
    elif expression=="curiosa": openness,tilt=1.0,-.14
    elif expression=="serena": openness,tilt=.88,0.0
    mouth=values.get("mouth_style","sonrisa_pequena")
    curve={
        "sonrisa_pequena":.25,"sonrisa_amplia":.82,"puchero":-.48,"sonrisa_ladeada":.58,
        "colmillo_visible":.64,"boca_neutra":0.0,"labio_inferior_tenso":-.24,
        "boca_abierta_energia":.50,"mueca_concentrada":-.12,"sonrisa_serena":.35,
    }.get(mouth,{"sonrisa_abierta":.78,"sonrisa_picara":.58,"serena":.25,"mirada_enfocada":.02,
       "mirada_desafiante":.05,"mirada_enojada":-.32,"mirada_fria":-.12,"somnolienta":-.02,
       "curiosa":.24,"confiada":.50}.get(expression,.1))
    brow=values.get("eyebrow_style","rectas")
    brow_tilt={"finas_arqueadas":-.12,"rectas":0.0,"gruesas_deportivas":.08,"anguladas":.24,
       "inclinadas_centro":.28,"elevadas":-.22,"suaves":-.08,"cortas":.02,"largas":.04,
       "asimetrica":.13}.get(brow,tilt)
    accessory=values.get("accessory","").lower()
    facial=values.get("facial_detail","sin_marca")
    return FaceStyle(
        eye_size=size,eye_width=width,eye_openness=openness,eye_lower_lid=.90,
        eye_tilt=tilt,eye_corner=corner,
        iris_size={"corazon":.68,"estrella":.72,"vertical_fina":.56,"diamante":.62,"anillo_concentrico":.70}.get(values.get("pupil_shape",""),.64),
        iris_aspect=1.20 if values.get("pupil_shape")=="vertical_fina" else .98,
        lash=1.0,brow_tilt=brow_tilt,
        brow_weight=1.30 if brow=="gruesas_deportivas" else .78 if brow in {"finas_arqueadas","suaves"} else 1.0,
        brow_length=.78 if brow=="cortas" else 1.12 if brow=="largas" else 1.0,
        mouth_curve=curve,mouth_width=1.04 if mouth in {"sonrisa_amplia","boca_abierta_energia"} else .88,
        mouth_open=.58 if mouth=="boca_abierta_energia" else .42 if expression=="sonrisa_abierta" else .06,
        # The catalog's nose control must reach the actual face renderer. Minimal noses
        # use the dot; bridge/curve/defined-tip choices use the engine's mature linework.
        nose_dot=values.get("nose_style", "minima") in {"minima", "sombra_minima"},
        eye_gap={"corazon": .56, "diamante": .48, "rostro_alargado": .54,
                 "menton_corto": .42, "pomulos_definidos": .47}.get(values.get("face_shape", ""), None),
        mouth_drop={"rostro_alargado": .045, "menton_fino": .025, "menton_corto": -.025}.get(values.get("face_shape", ""), 0.0),
        blush=.42 if expression in {"sonrisa_abierta","sonrisa_picara","confiada"} or facial=="rubor_sutil" else .08,
        glasses=any(word in accessory for word in ("glasses","gafas","lentes","visor")),
        chin_shadow=facial=="sombra_de_ojera_suave",scar_side=1 if facial=="cicatriz_fina" else 0,
    )


def _outfit(values: dict[str,str], recipe: dict[str,Any]) -> Outfit:
    base,panel,accent = recipe["garment_base_color"],recipe["garment_panel_color"],recipe["garment_accent_color"]
    style = values.get("outfit","tactical_baseball")
    outer_choice = values.get("outer_layer","none")
    default_outer = {"combat_jacket":"short_bomber","street_bomber":"short_bomber",
                     "elegant_command":"long_coat","support_coat":"long_coat"}.get(style,"none")
    outer = outer_choice if outer_choice!="none" else default_outer
    trousers = style not in {"idol_combat","elegant_command"}
    coat_color,coat_sleeves,coat_length,robe_color = None,False,.34,None
    shoulder_bars = None
    if outer in {"short_bomber","hooded_jacket","long_coat","chaleco_tactico",
                 "chaqueta_corta_asimetrica","capa_corta_energetica","mangas_desmontables"}:
        coat_color = panel
        coat_sleeves = outer not in {"chaleco_tactico","hombrera_modular"}
        coat_length = {"short_bomber":.30,"hooded_jacket":.40,"long_coat":.76,
                       "chaleco_tactico":.32,"chaqueta_corta_asimetrica":.34,
                       "capa_corta_energetica":.40,"mangas_desmontables":.44}.get(outer,.38)
    if outer in {"utility_cape","capa_corta_energetica"}:
        robe_color = panel if outer=="utility_cape" else accent
        coat_color = None
    if outer=="hombrera_modular" or style in {"light_armor","armadura_asimetrica"}:
        shoulder_bars = accent
    if style in {"light_armor","armadura_asimetrica"} and outer=="none":
        coat_color,coat_sleeves,coat_length = panel,False,.44
    boot_id = values.get("footwear","combat_sneakers")
    boot_shaft = .53 if boot_id in {"armored_boots","sleek_boots","botas_asimetricas","botas_reforzadas"} else .34
    accessory = values.get("accessory","").lower()
    goggles = accent if any(word in accessory for word in ("visor","goggle","headset")) else None
    return Outfit(
        tunic_color=panel if style in {"light_armor","armadura_asimetrica"} else base,
        boot_color=_shade(panel,.48), undersleeve_color=panel, belt_color=accent,
        skirt_color=base if not trousers else None, trouser_color=_shade(panel,.64) if trousers else None,
        skirt_length=.44, sleeve_long=recipe["sleeve_length"]>=72,
        neckline_round=style in {"techwear_sport","baseball_tech_suit"},
        neckline_trim=True, neckline_stand=style in {"elegant_command","support_coat"},
        placket_color=accent, chest_pocket_color=panel if style in {"tactical_baseball","support_coat","street_bomber"} else accent,
        strap_color=accent if style in {"techwear_sport","light_armor","armadura_asimetrica"} else None,
        collar_color=panel if style in {"elegant_command","support_coat"} else None,
        ribbon_color=accent if style=="idol_combat" or accessory=="hair_ribbon" else None,
        robe_color=robe_color, coat_color=coat_color, coat_sleeves=coat_sleeves, coat_length=coat_length,
        coat_button_color=accent if coat_color else None,
        hip_pocket_color=accent if style in {"techwear_sport","street_bomber"} or accessory=="utility_pouch" else None,
        boot_shaft=boot_shaft, shoulder_bars_color=shoulder_bars, shoulder_bars=2, goggle_color=goggles,
    )


def _emblem(shape: str, x: float, y: float, size: float, color: str) -> str:
    if shape=="star":
        points=[]
        for i in range(10):
            angle=-math.pi/2+i*math.pi/5
            radius=size if i%2==0 else size*.45
            points.append(f"{x+math.cos(angle)*radius:.1f},{y+math.sin(angle)*radius:.1f}")
        return f'<polygon points="{" ".join(points)}" fill="{color}"/>'
    if shape=="fox":
        return f'<path d="M{x-size:.1f} {y-size*.65:.1f} L{x-size*.55:.1f} {y+size:.1f} L{x:.1f} {y+size*.48:.1f} L{x+size*.55:.1f} {y+size:.1f} L{x+size:.1f} {y-size*.65:.1f} L{x:.1f} {y-size*.2:.1f} Z" fill="{color}"/>'
    if shape=="skull":
        return f'<path d="M{x-size:.1f} {y:.1f} C{x-size:.1f} {y-size:.1f} {x+size:.1f} {y-size:.1f} {x+size:.1f} {y:.1f} L{x+size*.45:.1f} {y+size*.8:.1f} L{x-size*.45:.1f} {y+size*.8:.1f} Z" fill="{color}"/>'
    if shape=="geo":
        return f'<path d="M{x:.1f} {y-size:.1f} L{x+size:.1f} {y:.1f} L{x:.1f} {y+size:.1f} L{x-size:.1f} {y:.1f} Z" fill="{color}"/>'
    return f'<g fill="{color}"><ellipse cx="{x-size*.42:.1f}" cy="{y-size*.55:.1f}" rx="{size*.22:.1f}" ry="{size*.48:.1f}"/><ellipse cx="{x+size*.42:.1f}" cy="{y-size*.55:.1f}" rx="{size*.22:.1f}" ry="{size*.48:.1f}"/><circle cx="{x:.1f}" cy="{y+size*.15:.1f}" r="{size*.58:.1f}"/></g>'


def _underlays(values: dict[str,str], recipe: dict[str,Any], p: CharacterParams, sk: Any) -> str:
    """Paint tails behind body and garments, not on top of them."""
    cx,cy,r=sk.head_cx,sk.head_cy,sk.head_r
    parts=[]
    tail=values.get("tail_style","sin_cola")
    if tail not in {"sin_cola","none","auto",""}:
        color=recipe["garment_accent_color"] if any(t in tail for t in ("dracon","mecan","energ")) else p.skin_tone if "conejo" in tail or "pluma" in tail else p.hair_color
        sx,sy=cx+sk.hip_half_w*.74,sk.hip_y+r*.08
        sway=r*(.32 if "corta" in tail else .62)
        endy=sy+r*(.82 if "corta" in tail else 1.05)
        d=f"M{sx:.1f} {sy:.1f} C{sx+sway:.1f} {sy+r*.32:.1f} {sx+sway*1.1:.1f} {endy-r*.2:.1f} {sx+sway*.65:.1f} {endy:.1f}"
        parts.append(f'<path class="extra-tail" d="{d}" fill="none" stroke="#0d0d0d" stroke-width="{r*.20:.1f}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{color}" stroke-width="{r*.145:.1f}" stroke-linecap="round"/>')
    if values.get("hair_arrangement")=="coletas_gemelas":
        for side in (-1,1):
            sx=cx+side*r*.58
            sy=cy-r*.35
            ex=cx+side*r*1.02
            ey=cy+r*1.78
            d=f"M{sx:.1f} {sy:.1f} C{sx+side*r*.40:.1f} {sy+r*.55:.1f} {ex+side*r*.22:.1f} {ey-r*.35:.1f} {ex:.1f} {ey:.1f}"
            parts.append(f'<path class="hair-twin-tail" d="{d}" fill="none" stroke="#0d0d0d" stroke-width="{r*.22:.1f}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{p.hair_color}" stroke-width="{r*.17:.1f}" stroke-linecap="round"/>')
    return '<g class="botimagen-engine-underlays">'+"".join(parts)+"</g>" if parts else ""


def _overlays(values: dict[str,str], recipe: dict[str,Any], p: CharacterParams, sk: Any) -> str:
    cx,cy,r = sk.head_cx,sk.head_cy,sk.head_r
    base,panel,accent = recipe["garment_base_color"],recipe["garment_panel_color"],recipe["garment_accent_color"]
    hair,view = p.hair_color,recipe["view"]
    detail = round(recipe["detail_level"]*.7 + recipe["streetwear_cyberpunk"]*.3)
    parts=[]
    if view=="back":
        bottom = sk.waist_y+r*.12
        if p.outfit.coat_color:
            bottom = sk.shoulder_y+(sk.ankle_y-sk.shoulder_y)*p.outfit.coat_length
        sw,ww = sk.shoulder_half_w*.78,sk.waist_half_w*.98
        hemw = max(ww,sk.hip_half_w*.78) if bottom>sk.hip_y else ww
        cloth = p.outfit.coat_color or p.outfit.tunic_color or base
        parts.append(f'<path class="back-clothing-panel" d="M{cx-sw:.1f} {sk.shoulder_y:.1f} Q{cx:.1f} {sk.shoulder_y-r*.24:.1f} {cx+sw:.1f} {sk.shoulder_y:.1f} L{cx+ww:.1f} {sk.waist_y:.1f} L{cx+hemw:.1f} {bottom:.1f} Q{cx:.1f} {bottom+r*.05:.1f} {cx-hemw:.1f} {bottom:.1f} L{cx-ww:.1f} {sk.waist_y:.1f} Z" fill="{cloth}" stroke="#0d0d0d" stroke-width="{max(1.2,r*.026):.1f}"/>')
        parts.append(f'<path d="M{cx:.1f} {sk.shoulder_y+r*.03:.1f} L{cx:.1f} {bottom-r*.04:.1f} M{cx-sw*.66:.1f} {sk.shoulder_y+r*.30:.1f} Q{cx:.1f} {sk.shoulder_y+r*.46:.1f} {cx+sw*.66:.1f} {sk.shoulder_y+r*.30:.1f}" fill="none" stroke="{accent}" stroke-width="{max(1.2,r*.025):.1f}" opacity=".85"/>')
        hair_length=HAIR_LENGTHS.get(values.get("hair_length","medio"),.38)
        hair_style=values.get("hairstyle","long_flowing")
        back_hair=values.get("back_hair","recto_liso")
        back_fall=min(sk.hip_y-r*.10,cy+r*(.52+hair_length*4.10))
        if hair_style in {"bob","curly_lob"} or back_hair in {"bob_trasero","nuca_corta"}:
            back_fall=min(back_fall,cy+r*.72)
        if back_hair in {"capas_largas","puntas_largas","ondas_traseras","panel_trenzado"}:
            back_fall=min(sk.ankle_y-r*.15, max(back_fall,cy+r*(.52+hair_length*4.30)))
        left_fall=back_fall
        right_fall=back_fall
        if hair_style=="asymmetrical" or back_hair=="seccion_asimetrica":
            left_fall=min(sk.hip_y-r*.08,back_fall+r*.22)
            right_fall=max(cy+r*.52,back_fall-r*.16)
        if hair_style in {"layered_shag","wolf_cut","short_wavy"} or back_hair=="nuca_despeinada":
            left_fall=min(left_fall,cy+r*.86)
            right_fall=min(right_fall,cy+r*.78)
        parts.append(f'<path class="back-head-cover" data-hair-style="{HAIRSTYLE_MAP.get(hair_style, "long_traced")}" d="M{cx-r*.96:.1f} {cy-r*.12:.1f} C{cx-r*1.07:.1f} {cy-r*.75:.1f} {cx-r*.48:.1f} {cy-r*1.06:.1f} {cx:.1f} {cy-r*1.04:.1f} C{cx+r*.58:.1f} {cy-r*1.05:.1f} {cx+r*1.06:.1f} {cy-r*.67:.1f} {cx+r*.96:.1f} {cy-r*.12:.1f} L{cx+r*.90:.1f} {right_fall:.1f} Q{cx:.1f} {back_fall+r*.08:.1f} {cx-r*.90:.1f} {left_fall:.1f} Z" fill="{hair}" stroke="#0d0d0d" stroke-width="{max(1.4,r*.035):.1f}"/>')
        strands=3 if detail<45 else 7
        for i in range(strands):
            offset=(i-(strands-1)/2)*r*.20
            strand_end=right_fall if offset>r*.1 else left_fall if offset<-r*.1 else back_fall
            sway=(.04 if i%2 else -.035)*r
            parts.append(f'<path class="back-hair-strand" d="M{cx+offset-r*.04:.1f} {cy-r*.66:.1f} C{cx+offset+sway:.1f} {cy-r*.08:.1f} {cx+offset-sway:.1f} {cy+r*.24:.1f} {cx+offset+r*.03:.1f} {strand_end:.1f}" fill="none" stroke="{_shade(hair,.72)}" stroke-width="{max(1.0,r*.018):.1f}" stroke-linecap="round"/>')
        if back_hair=="panel_trenzado":
            for i in range(4):
                y=cy+r*(.18+i*.18)
                parts.append(f'<path class="back-hair-braid" d="M{cx-r*.13:.1f} {y:.1f} l{r*.12:.1f} {r*.10:.1f} l{-r*.12:.1f} {r*.10:.1f} l{-r*.12:.1f} {-r*.10:.1f} Z" fill="{_shade(hair,.84)}" stroke="{_shade(hair,.62)}" stroke-width="{max(.7,r*.012):.1f}"/>')
    else:
        pattern=recipe["fabric_pattern"]
        if pattern in {"circuit","geometric","gradient"}:
            # The luminous design is kept in a compact chest region instead of a grid over the whole coat.
            top=sk.shoulder_y+r*.28
            bottom=min(sk.shoulder_y+(sk.waist_y-sk.shoulder_y)*.58,sk.waist_y+r*.12)
            clip="bw-cyber-torso-pattern"
            width_top=sk.shoulder_half_w*.29
            width_bottom=sk.waist_half_w*.40
            torso=f"M{cx-width_top:.1f} {top:.1f} Q{cx:.1f} {top-r*.10:.1f} {cx+width_top:.1f} {top:.1f} L{cx+width_bottom:.1f} {bottom:.1f} L{cx-width_bottom:.1f} {bottom:.1f} Z"
            parts.append(f'<defs><clipPath id="{clip}"><path d="{torso}"/></clipPath></defs>')
            strokes=1 if detail<62 else 2
            lines=[]
            for i in range(strokes):
                y=top+(bottom-top)*(i+1)/(strokes+1)
                direction=-1 if i%2 else 1
                x0=cx-width_bottom*.72
                x1=cx+width_bottom*.72
                bend=cx+direction*width_bottom*.22
                lines.append(f'<path d="M{x0:.1f} {y:.1f} L{bend:.1f} {y:.1f} L{bend+direction*r*.07:.1f} {y+r*.06:.1f} L{x1:.1f} {y+r*.06:.1f}" fill="none" stroke="{accent}" stroke-width="{max(.8,r*.012):.1f}" opacity=".34"/>')
            if pattern=="geometric":
                for side in (-1,1):
                    x=cx+side*width_bottom*.52
                    y=top+(bottom-top)*.54
                    lines.append(f'<path d="M{x:.1f} {y-r*.08:.1f} l{r*.07:.1f} {r*.08:.1f} l{-r*.07:.1f} {r*.08:.1f} l{-r*.07:.1f} {-r*.08:.1f} Z" fill="none" stroke="{accent}" stroke-width="{max(.8,r*.012):.1f}" opacity=".42"/>')
            if pattern=="gradient":
                lines.append(f'<path d="M{cx-width_bottom*.28:.1f} {top+r*.06:.1f} L{cx+width_bottom*.28:.1f} {bottom-r*.06:.1f}" stroke="{panel}" stroke-width="{max(1.4,r*.03):.1f}" opacity=".48"/>')
            parts.append(f'<g class="cyberpunk-fabric-details" clip-path="url(#{clip})">{"".join(lines)}</g>')
        if detail>=18 and recipe["nanowear_state"]!="everyday":
            y=sk.shoulder_y+r*.12
            for side in (-1,1):
                x=cx+side*sk.shoulder_half_w*.77
                parts.append(f'<path d="M{x:.1f} {y:.1f} l{side*r*.09:.1f} {r*.12:.1f} l{-side*r*.04:.1f} {r*.14:.1f}" fill="none" stroke="{accent}" stroke-width="{max(1.2,r*.025):.1f}" stroke-linecap="round"/>')
        if recipe["emblem_position"]=="sleeve":
            ex,ey=cx+sk.shoulder_half_w*.76,sk.shoulder_y+r*.39
        elif recipe["emblem_position"]=="hood":
            ex,ey=cx,cy-r*.55
        else:
            ex,ey=cx,sk.shoulder_y+(sk.waist_y-sk.shoulder_y)*.42
        parts.append(f'<g class="chromapatch" aria-label="Emblema de vestuario">{_emblem(recipe["emblem_shape"],ex,ey,max(3.5,r*.095),recipe["emblem_color"])}</g>')
        root=ROOT_COLORS.get(values.get("hair_root_color","matching_base"))
        if root and root!=hair:
            parts.append(f'<path class="hair-root-accent" d="M{cx-r*.62:.1f} {cy-r*.42:.1f} Q{cx:.1f} {cy-r*1.05:.1f} {cx+r*.62:.1f} {cy-r*.42:.1f} L{cx+r*.40:.1f} {cy-r*.19:.1f} Q{cx:.1f} {cy-r*.40:.1f} {cx-r*.40:.1f} {cy-r*.19:.1f} Z" fill="{root}"/>')
        crown=ACCENT_COLORS.get(values.get("hair_crown_color","matching_base"))
        if crown and crown!=hair:
            parts.append(f'<path class="hair-crown-accent" d="M{cx-r*.32:.1f} {cy-r*.82:.1f} Q{cx:.1f} {cy-r*1.12:.1f} {cx+r*.34:.1f} {cy-r*.80:.1f} L{cx+r*.20:.1f} {cy-r*.60:.1f} L{cx-r*.20:.1f} {cy-r*.60:.1f} Z" fill="{crown}"/>')
        texture=values.get("hair_texture","liso_sedoso")
        if texture in {"ondas_suaves","rizos_sueltos","rizos_definidos","esponjado_suave","hebras_finas","capas_texturizadas","puntas_dinamicas","textura_mixta"}:
            count=2 if texture in {"ondas_suaves","hebras_finas"} else 4
            hair_length=HAIR_LENGTHS.get(values.get("hair_length","largo"),.78)
            for side in (-1,1):
                for i in range(count):
                    x=cx+side*r*(.72+i*.045)
                    start=cy+r*(.12+i*.07)
                    end=min(sk.hip_y-r*.20,cy+r*(1.1+hair_length*2.2))
                    sway=side*r*(.05 if i%2 else -.035)
                    parts.append(f'<path class="hair-texture-strand" d="M{x:.1f} {start:.1f} Q{x+sway:.1f} {(start+end)/2:.1f} {x+sway*.4:.1f} {end:.1f}" fill="none" stroke="{_shade(hair,.72)}" stroke-width="{max(.75,r*.012):.1f}" opacity=".70" stroke-linecap="round"/>')
        inner=ACCENT_COLORS.get(values.get("hair_inner_color","matching_base"))
        if inner and inner!=hair:
            for side in (-1,1):
                x=cx+side*r*.79
                start=cy+r*.70
                end=min(sk.hip_y-r*.12,cy+r*(1.4+HAIR_LENGTHS.get(values.get("hair_length","largo"),.78)*2))
                parts.append(f'<path class="hair-inner-streak" d="M{x:.1f} {start:.1f} Q{x+side*r*.10:.1f} {(start+end)/2:.1f} {x-side*r*.02:.1f} {end:.1f}" fill="none" stroke="{inner}" stroke-width="{max(1.2,r*.065):.1f}" opacity=".85" stroke-linecap="round"/>')
    ear=values.get("ear_style","orejas_humanas")
    if ear not in {"orejas_humanas","none","auto",""}:
        ear_color=accent if "luminosas" in ear or "sensor" in ear else hair
        inner=recipe["emblem_color"] if recipe["nanowear_state"]!="everyday" else p.skin_tone
        for side in (-1,1):
            x=cx+side*r*.52
            if "conejo" in ear:
                path=f"M{x-side*r*.10:.1f} {cy-r*.50:.1f} Q{x-side*r*.34:.1f} {cy-r*1.2:.1f} {x-side*r*.02:.1f} {cy-r*1.35:.1f} Q{x+side*r*.15:.1f} {cy-r*1.1:.1f} {x+side*r*.12:.1f} {cy-r*.49:.1f} Z"
            elif "elficas" in ear or "draconicas" in ear:
                path=f"M{x:.1f} {cy-r*.25:.1f} L{x+side*r*.48:.1f} {cy-r*.68:.1f} L{x+side*r*.13:.1f} {cy+r*.08:.1f} Z"
            else:
                path=f"M{x-side*r*.26:.1f} {cy-r*.48:.1f} Q{x-side*r*.20:.1f} {cy-r*1.0:.1f} {x+side*r*.20:.1f} {cy-r*.40:.1f} L{x+side*r*.14:.1f} {cy+r*.02:.1f} Z"
            parts.append(f'<path class="extra-ear" d="{path}" fill="{ear_color}" stroke="#0d0d0d" stroke-width="{max(1.0,r*.035):.1f}"/>')
            parts.append(f'<path d="M{x-side*r*.06:.1f} {cy-r*.43:.1f} l{side*r*.06:.1f} {r*.26:.1f} l{-side*r*.07:.1f} {r*.11:.1f}" fill="none" stroke="{inner}" stroke-width="{max(1.0,r*.022):.1f}" stroke-linecap="round"/>')
    horn=values.get("horn_style","sin_cuernos")
    if horn not in {"sin_cuernos","none","auto",""}:
        color=accent if any(t in horn for t in ("ener","mecan","lum")) else hair
        for side in (-1,1):
            x=cx+side*r*.37
            parts.append(f'<path class="extra-horn" d="M{x-r*.08:.1f} {cy-r*.68:.1f} Q{x+side*r*.06:.1f} {cy-r*1.12:.1f} {x+side*r*.22:.1f} {cy-r*1.18:.1f} Q{x+side*r*.16:.1f} {cy-r*.80:.1f} {x+r*.04:.1f} {cy-r*.66:.1f} Z" fill="{color}" stroke="#0d0d0d" stroke-width="{max(1.0,r*.03):.1f}"/>')
    if values.get("scale_pattern","no_visible_scales") not in {"no_visible_scales","none","auto",""}:
        color=ACCENT_COLORS.get(values.get("scale_color",""),recipe["emblem_color"])
        for side in (-1,1):
            for row in range(3):
                x=cx+side*r*.64+(row%2)*side*r*.06
                y=cy+r*.30+row*r*.14
                size=r*.045
                parts.append(f'<path class="scale-mark" d="M{x:.1f} {y-size:.1f} l{size:.1f} {size:.1f} l{-size:.1f} {size:.1f} l{-size:.1f} {-size:.1f} Z" fill="{color}" stroke="#0d0d0d" stroke-width="{max(.5,r*.008):.1f}"/>')
    return '<g class="botimagen-engine-overlays">'+"".join(parts)+"</g>"


def render_profile_svg(selections: Any, visual_recipe: Any = None) -> str:
    if not isinstance(selections, dict):
        raise ValueError("Las selecciones del personaje deben formar un objeto JSON.")
    values={key:value for key,value in selections.items() if isinstance(key,str) and isinstance(value,str)}
    recipe=normalize_render_recipe(visual_recipe)
    hair=HAIR_COLORS.get(values.get("hair",""),"#e3b448")
    eye=EYE_COLORS.get(values.get("eyes",""),"#4a9c6d")
    skin=SKIN_COLORS.get(values.get("skin_tone",""),"#f2d8cc")
    hairstyle=_resolve_hairstyle(values)
    hair_length=HAIR_LENGTHS.get(values.get("hair_length",""),.46)
    tip_id=values.get("hair_tip_color","matching_base")
    if tip_id=="matching_base":
        tip=ACCENT_COLORS.get(values.get("hair_secondary_color","")) if values.get("hair_color_pattern")=="puntas_doradas" else None
    else:
        tip=TIP_COLORS.get(tip_id,hair)
    shoulder,waist,hips,limbs=_frame_multipliers(values.get("body_build","equilibrada"))
    bust={"small":.12,"balanced":.34,"full":.62,"voluminous":.82}.get(values.get("bust_size","balanced"),.3)
    frame=.35 if shoulder>1.08 else -.18 if shoulder<.95 else 0.0
    coat=_outfit(values,recipe)
    pose=values.get("pose","")
    arm_out=13.0 if any(word in pose for word in ("defiant","dynamic","ready","desafiante")) else 0.0
    hair_arrangement=values.get("hair_arrangement","suelto")
    heads=_head_count(values)
    maturity=_face_maturity(values)
    params=CharacterParams(
        skin_tone=skin,hair_color=hair,hair_tip_color=tip,hair_length=hair_length,
        hairstyle=hairstyle,eye_color=eye,
        hair_tail=.62 if any(word in hair_arrangement for word in ("coleta","ponytail","recogido")) else 0.0,
        hair_knot=any(word in hair_arrangement for word in ("moño","bun")),
        outfit=coat,face=_face_style(values),body="tall_chibi_long_torso",height=1.0,
        hand_style="traced",grip_style="mitten",face_age=maturity,frame=frame,bust=bust,
        right_arm_out=arm_out,left_arm_out=arm_out*.45,
        shaded=recipe["toon_influence"]<78,
    )
    skeleton=build_skeleton(canvas_w=400,canvas_h=640,heads=heads,frame=frame,bust=bust)
    proportions=values.get("body_proportions","")
    waist_delta=(50-recipe["torso_length"])*skeleton.head_r*.003
    if proportions in {"piernas_largas","extremidades_largas"}: waist_delta-=skeleton.head_r*.13
    elif proportions=="torso_corto_deportivo": waist_delta-=skeleton.head_r*.10
    elif proportions in {"centro_bajo","potencia_compacta"}: waist_delta+=skeleton.head_r*.05
    waist_multiplier=1.25-recipe["waist_fit"]*.004
    skeleton=replace(
        skeleton,shoulder_half_w=skeleton.shoulder_half_w*shoulder,
        waist_half_w=skeleton.waist_half_w*waist*waist_multiplier,
        hip_half_w=skeleton.hip_half_w*hips,arm_half_w=skeleton.arm_half_w*limbs,
        leg_half_w=skeleton.leg_half_w*limbs,arm_x=skeleton.arm_x*shoulder,
        waist_y=skeleton.waist_y+waist_delta,hip_y=skeleton.hip_y+waist_delta*.65,
        face_maturity=maturity,limb_taper=.62,
    )
    svg=render_character(params,skeleton)
    underlays=_underlays(values,recipe,params,skeleton)
    svg=svg.replace("</svg>",_overlays(values,recipe,params,skeleton)+"</svg>")
    attrs=(f'class="parametric-anime-svg" data-renderer="{RENDERER_ID}" data-view="{recipe["view"]}" data-head-count="{heads:.2f}" data-face-maturity="{maturity:.2f}" '
           f'data-hair-color="{hair}" data-skin-color="{skin}" data-eye-color="{eye}" '
           f'data-face-shape="{values.get("face_shape") in {"suave","equilibrada","afilada","corazon","diamante","mandibula_suave","menton_corto","menton_fino","rostro_alargado","pomulos_definidos"} and values.get("face_shape") or "equilibrada"}" '
           f'data-nose-style="{values.get("nose_style") in {"minima","pequena_redondeada","puente_sutil","punta_definida","triangular_suave","sombra_minima","linea_corta","puente_recto","nariz_curva_sutil","perfil_anguloso"} and values.get("nose_style") or "minima"}" '
           f'data-fabric-base="{recipe["garment_base_color"]}" data-fabric-panel="{recipe["garment_panel_color"]}" '
           f'data-fabric-accent="{recipe["garment_accent_color"]}"')
    svg=svg.replace('<svg xmlns="http://www.w3.org/2000/svg"',f'<svg {attrs} xmlns="http://www.w3.org/2000/svg"',1)
    svg=re.sub(r"(<svg\b[^>]*>)",lambda match: match.group(1)+underlays,svg,count=1)
    if len(svg.encode("utf-8"))>SVG_MAX_BYTES:
        raise ValueError("El SVG generado supera el límite de salida permitido.")
    return svg
