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
    match = re.search(r"\d{3}", values.get("height_cm","h170"))
    cm = int(match.group()) if match else 170
    heads = 5.5 + (cm-170)*.015
    stature = values.get("stature","")
    if stature in {"bajita","muy_bajita","petite"}: heads -= .18
    if stature in {"alta","muy_alta","alta_imponente"}: heads += .18
    proportions = values.get("body_proportions","")
    if proportions in {"piernas_largas","extremidades_largas","esbelta_elegante"}: heads += .14
    if proportions in {"torso_corto_deportivo","compactas_agiles","potencia_compacta"}: heads -= .12
    return max(4.75,min(6.0,heads))


def _face_style(values: dict[str,str]) -> FaceStyle:
    eye_shape = values.get("eye_shape","grande_expresiva")
    expression = values.get("expression","mirada_enfocada")
    size,width,corner,openness,tilt = 1.02,1.03,.38,.94,.08
    if eye_shape in {"grande_expresiva","abiertos","redondos","caidos","suave"}:
        size,width,corner = 1.12,1.04,.16
    elif eye_shape in {"afilada","felinos","angulares","asimétricos"}:
        size,width,corner = .94,1.12,.78
    elif eye_shape == "entornada":
        openness = .68
    if expression in {"sonrisa_abierta","confiada"}: openness,tilt = 1.0,-.04
    elif expression in {"sonrisa_picara","mirada_desafiante"}: openness,tilt = .84,.2
    elif expression in {"mirada_enojada","mirada_fria"}: openness,tilt = .68,.28
    elif expression == "somnolienta": openness,tilt = .52,-.05
    elif expression == "curiosa": openness,tilt = 1.0,-.14
    elif expression == "serena": openness,tilt = .88,0.0
    curve = {
        "sonrisa_abierta":1.0, "sonrisa_picara":.68, "serena":.22,
        "mirada_enfocada":.05, "mirada_desafiante":.18, "mirada_enojada":-.32,
        "mirada_fria":-.12, "somnolienta":.05, "curiosa":.35, "confiada":.6,
    }.get(expression,.1)
    accessory = values.get("accessory","").lower()
    glasses = any(word in accessory for word in ("glasses","gafas","lentes"))
    return FaceStyle(
        eye_size=size, eye_width=width, eye_openness=openness, eye_lower_lid=.94,
        eye_tilt=tilt, eye_corner=corner, iris_size={"corazon":.78,"estrella":.84,"vertical_fina":.64}.get(values.get("pupil_shape",""),.72),
        iris_aspect=1.18 if values.get("pupil_shape")=="vertical_fina" else 1.0,
        lash=1.0, brow_tilt=tilt, brow_weight=1.0, mouth_curve=curve, mouth_width=.94,
        mouth_open=.58 if expression=="sonrisa_abierta" else .08, nose_dot=True,
        blush=.55 if expression in {"sonrisa_abierta","sonrisa_picara","confiada"} else .15,
        glasses=glasses,
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
        ribbon_color=accent if style=="idol_combat" else None,
        robe_color=robe_color, coat_color=coat_color, coat_sleeves=coat_sleeves, coat_length=coat_length,
        coat_button_color=accent if coat_color else None,
        hip_pocket_color=accent if style in {"techwear_sport","street_bomber"} else None,
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
        parts.append(f'<path class="back-head-cover" d="M{cx-r*.96:.1f} {cy-r*.12:.1f} C{cx-r*1.07:.1f} {cy-r*.75:.1f} {cx-r*.48:.1f} {cy-r*1.06:.1f} {cx:.1f} {cy-r*1.04:.1f} C{cx+r*.58:.1f} {cy-r*1.05:.1f} {cx+r*1.06:.1f} {cy-r*.67:.1f} {cx+r*.96:.1f} {cy-r*.12:.1f} L{cx+r*.90:.1f} {cy+r*.55:.1f} Q{cx:.1f} {cy+r*1.25:.1f} {cx-r*.90:.1f} {cy+r*.55:.1f} Z" fill="{hair}" stroke="#0d0d0d" stroke-width="{max(1.4,r*.035):.1f}"/>')
        strands=3 if detail<45 else 5
        for i in range(strands):
            offset=(i-(strands-1)/2)*r*.22
            parts.append(f'<path d="M{cx+offset-r*.04:.1f} {cy-r*.66:.1f} Q{cx+offset+r*.12:.1f} {cy+r*.12:.1f} {cx+offset+r*.06:.1f} {cy+r*.55:.1f}" fill="none" stroke="{_shade(hair,.72)}" stroke-width="{max(1.0,r*.018):.1f}" stroke-linecap="round"/>')
    else:
        pattern=recipe["fabric_pattern"]
        if pattern in {"circuit","geometric","gradient"}:
            top=sk.shoulder_y+r*.18
            bottom=min(sk.waist_y+r*.18,sk.hip_y)
            clip="bw-cyber-torso-pattern"
            torso=f"M{cx-sk.shoulder_half_w*.58:.1f} {top:.1f} Q{cx:.1f} {top-r*.16:.1f} {cx+sk.shoulder_half_w*.58:.1f} {top:.1f} L{cx+sk.waist_half_w*.92:.1f} {bottom:.1f} L{cx-sk.waist_half_w*.92:.1f} {bottom:.1f} Z"
            parts.append(f'<defs><clipPath id="{clip}"><path d="{torso}"/></clipPath></defs>')
            strokes=1 if detail<24 else 3 if detail<70 else 5
            lines=[]
            for i in range(strokes):
                y=top+(bottom-top)*(i+1)/(strokes+1)
                direction=-1 if i%2 else 1
                x0=cx-sk.waist_half_w*.8; x1=cx+sk.waist_half_w*.8
                bend=cx+direction*sk.waist_half_w*.22
                lines.append(f'<path d="M{x0:.1f} {y:.1f} L{bend:.1f} {y:.1f} L{bend+direction*r*.12:.1f} {y+r*.10:.1f} L{x1:.1f} {y+r*.10:.1f}" fill="none" stroke="{accent}" stroke-width="{max(1.1,r*.022):.1f}" opacity=".72"/>')
            if pattern=="geometric":
                for side in (-1,1):
                    x=cx+side*sk.waist_half_w*.52; y=top+(bottom-top)*.52
                    lines.append(f'<path d="M{x:.1f} {y-r*.13:.1f} l{r*.10:.1f} {r*.13:.1f} l{-r*.10:.1f} {r*.13:.1f} l{-r*.10:.1f} {-r*.13:.1f} Z" fill="none" stroke="{accent}" stroke-width="{max(1,r*.018):.1f}"/>')
            if pattern=="gradient":
                lines.append(f'<path d="M{cx-sk.waist_half_w*.38:.1f} {top+r*.08:.1f} L{cx+sk.waist_half_w*.38:.1f} {bottom-r*.08:.1f}" stroke="{panel}" stroke-width="{max(2,r*.05):.1f}" opacity=".78"/>')
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
    tail=values.get("tail_style","sin_cola")
    if tail not in {"sin_cola","none","auto",""}:
        color=accent if any(t in tail for t in ("dracon","mecan","energ")) else p.skin_tone if "conejo" in tail or "pluma" in tail else hair
        sx,sy=cx+sk.hip_half_w*.74,sk.hip_y+r*.08
        sway=r*(.35 if "corta" in tail else .72); endy=sy+r*(.85 if "corta" in tail else 1.1)
        d=f"M{sx:.1f} {sy:.1f} C{sx+sway:.1f} {sy+r*.35:.1f} {sx+sway*1.1:.1f} {endy-r*.2:.1f} {sx+sway*.65:.1f} {endy:.1f}"
        parts.append(f'<path class="extra-tail" d="{d}" fill="none" stroke="#0d0d0d" stroke-width="{r*.21:.1f}" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{color}" stroke-width="{r*.15:.1f}" stroke-linecap="round"/>')
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
    hairstyle=HAIRSTYLE_MAP.get(values.get("hairstyle",""),"long_traced")
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
    params=CharacterParams(
        skin_tone=skin,hair_color=hair,hair_tip_color=tip,hair_length=hair_length,
        hairstyle=hairstyle,eye_color=eye,
        hair_tail=.62 if any(word in hair_arrangement for word in ("coleta","ponytail","recogido")) else 0.0,
        hair_knot=any(word in hair_arrangement for word in ("moño","bun")),
        outfit=coat,face=_face_style(values),body="tall_chibi_long_torso",height=1.0,
        hand_style="traced",grip_style="mitten",face_age=.3,frame=frame,bust=bust,
        right_arm_out=arm_out,left_arm_out=arm_out*.45,
        shaded=recipe["toon_influence"]<78,
    )
    skeleton=build_skeleton(canvas_w=400,canvas_h=640,heads=_head_count(values),frame=frame,bust=bust)
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
        face_maturity=.3,limb_taper=.55,
    )
    svg=render_character(params,skeleton)
    svg=svg.replace("</svg>",_overlays(values,recipe,params,skeleton)+"</svg>")
    attrs=(f'class="parametric-anime-svg" data-renderer="{RENDERER_ID}" data-view="{recipe["view"]}" '
           f'data-hair-color="{hair}" data-skin-color="{skin}" data-eye-color="{eye}" '
           f'data-fabric-base="{recipe["garment_base_color"]}" data-fabric-panel="{recipe["garment_panel_color"]}" '
           f'data-fabric-accent="{recipe["garment_accent_color"]}"')
    svg=svg.replace('<svg xmlns="http://www.w3.org/2000/svg"',f'<svg {attrs} xmlns="http://www.w3.org/2000/svg"',1)
    if len(svg.encode("utf-8"))>SVG_MAX_BYTES:
        raise ValueError("El SVG generado supera el límite de salida permitido.")
    return svg
