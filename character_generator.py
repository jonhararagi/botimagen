from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any


DEFAULT_NEGATIVE = (
    "photorealistic, live-action, 3d CGI render, low-poly, chibi proportions, generic stock anime, "
    "copied franchise character, recognizable existing character outfit, school-uniform clone, "
    "sexualized presentation, childlike body proportions, gore, blood, text, subtitles, watermark, "
    "signature, logo, brand markings, extra characters, duplicate limbs, malformed hands, "
    "cropped head, cropped feet, unreadable silhouette, excessive bloom, heavy film grain, "
    "muddy details, over-rendered microtexture, mixed art styles, inconsistent line weight, "
    "inconsistent shading, painterly brushwork mixed with cel shading, conflicting bangs, "
    "duplicate pupils, random facial markings, cluttered accessories"
)

TRAIT_KEYS = {
    "personality": "Personalidad",
    "stature": "Estatura",
    "body_build": "Constitución",
    "silhouette": "Silueta",
    "expression": "Expresión",
    "face_shape": "Forma del rostro",
    "nose_style": "Nariz",
    "eye_shape": "Forma de ojos",
    "eyes": "Color de ojos",
    "pupil_shape": "Forma de pupila",
    "eyebrow_style": "Cejas",
    "mouth_style": "Boca",
    "facial_detail": "Detalle facial",
    "hair_length": "Largo del cabello",
    "hair_bangs": "Flequillo",
    "hairstyle": "Peinado principal",
    "side_hair": "Cabello lateral",
    "back_hair": "Cabello trasero / recogido",
    "hair": "Color de cabello",
    "outfit": "Vestimenta",
    "outer_layer": "Capa exterior",
    "footwear": "Calzado",
    "accessory": "Accesorio",
    "palette_accent": "Acento de paleta",
    "voice": "Voz / timbre",
    "combat_role": "Rol de combate",
    "baseball_prop": "Prop característico",
    "pose": "Pose",
    "quirk": "Detalle / quirk",
}

CATEGORY_ORDER = tuple(TRAIT_KEYS)


class CharacterGenerator:
    def __init__(self, rules_path: Path):
        self.rules_path = Path(rules_path)
        self.rules = self._load()
        self.categories = self.rules.get("categories", {})
        self.style_catalog, self.visual_standard = self._load_visual_standard()

    def _load(self) -> dict[str, Any]:
        with self.rules_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict) or not isinstance(data.get("categories"), dict):
            raise ValueError("Invalid character generator rules")
        return data

    def _load_visual_standard(self) -> tuple[dict[str, Any], dict[str, Any]]:
        catalog_path = self.rules_path.with_name("visual_style_catalog.json")
        with catalog_path.open("r", encoding="utf-8") as handle:
            catalog = json.load(handle)
        active_id = catalog.get("active_style_id")
        style = next(
            (item for item in catalog.get("styles", []) if item.get("id") == active_id),
            None,
        )
        if not isinstance(style, dict):
            raise ValueError("Visual style catalog has no valid active style")
        if not style.get("prompt_core") or not style.get("prompt_suffix"):
            raise ValueError("Active visual style is missing prompt instructions")
        return catalog, style

    def options(self, category: str) -> list[dict[str, Any]]:
        return [{"id": "auto", "label": "AUTO · el sistema decide"}] + self.categories.get(category, [])

    def _score(self, category: str, candidate: dict[str, Any], chosen: dict[str, str]) -> float:
        score = float(candidate.get("base", 1))
        candidate_tags = set(candidate.get("tags", []))

        for source_key, source_value in chosen.items():
            if source_value == "auto" or source_key == category:
                continue

            score += float(candidate.get("bias", {}).get(f"{source_key}:{source_value}", 0))

            source_item = next(
                (
                    item
                    for item in self.categories.get(source_key, [])
                    if item.get("id") == source_value
                ),
                None,
            )
            if source_item:
                source_tags = set(source_item.get("tags", []))
                score += 0.40 * len(candidate_tags.intersection(source_tags))

        return score

    def _choose_category(
        self,
        category: str,
        chosen: dict[str, str],
        rng: random.Random,
        coherence: float,
        surprise: bool = False,
    ) -> tuple[str, str]:
        requested = chosen.get(category, "auto")
        values = self.categories.get(category, [])
        by_id = {item["id"]: item for item in values}

        if requested != "auto":
            if requested not in by_id:
                raise ValueError(f"Unknown {category} value: {requested}")
            return requested, by_id[requested]["label"]

        if not values:
            raise ValueError(f"No candidates available for {category}")

        ranked = sorted(
            ((self._score(category, item, chosen), item) for item in values),
            key=lambda entry: entry[0],
            reverse=True,
        )
        top_score = ranked[0][0]

        if surprise and category == "quirk":
            preferred = [
                (
                    item,
                    3.0 if item.get("rarity") == "rare"
                    else 2.0 if item.get("rarity") == "uncommon"
                    else 0.8,
                )
                for _, item in ranked
            ]
            pool = [item for item, _ in preferred]
            weights = [
                max(0.2, self._score(category, item, chosen)) * rarity_weight
                for (item, rarity_weight) in preferred
            ]
        else:
            # High coherence narrows the candidate pool. Lower coherence keeps
            # the best candidates but permits more visual experimentation.
            spread = 0.35 + (1.0 - coherence) * 2.4
            threshold = top_score - spread
            pool = [item for score, item in ranked if score >= threshold]
            weights = [
                max(0.1, self._score(category, item, chosen) - threshold + 0.5)
                for item in pool
            ]

        selected = rng.choices(pool, weights=weights, k=1)[0]
        return selected["id"], selected["label"]

    def generate(
        self,
        selections: dict[str, str] | None = None,
        seed: int | None = None,
        coherence: float = 0.82,
        surprise: bool = False,
    ) -> dict[str, Any]:
        chosen = dict(selections or {})
        rng = random.Random(seed)
        coherence = max(0.0, min(1.0, float(coherence)))

        profile: dict[str, str] = {}
        labels: dict[str, str] = {}

        for category in CATEGORY_ORDER:
            context = {**chosen, **profile}
            value, label = self._choose_category(category, context, rng, coherence, surprise)
            profile[category] = value
            labels[category] = label

        # Final coherence pass over visual/combat traits. Explicit choices
        # remain hard-locked, AUTO traits are refined with the whole profile.
        refine = (
            "body_build", "silhouette", "face_shape", "nose_style",
            "eye_shape", "eyes", "pupil_shape", "eyebrow_style", "mouth_style",
            "facial_detail", "hair_length", "hair_bangs", "hairstyle",
            "side_hair", "back_hair", "hair", "outfit", "outer_layer",
            "footwear", "accessory", "palette_accent", "voice",
            "combat_role", "baseball_prop", "pose", "quirk",
        )
        for category in refine:
            if chosen.get(category, "auto") != "auto":
                continue
            value, label = self._choose_category(
                category, {**chosen, **profile}, rng, coherence, surprise
            )
            profile[category] = value
            labels[category] = label

        style_direction = self._style_direction(profile)
        rationale = self._rationale(chosen, profile, labels)

        return {
            "version": self.rules.get("version", 1),
            "style_id": self.visual_standard["id"],
            "style_name": self.visual_standard["name"],
            "style_version": self.visual_standard.get("version", 1),
            "profile": profile,
            "labels": labels,
            "rationale": rationale,
            "style_direction": style_direction,
            "prompt": self._build_prompt(profile, labels, style_direction),
            "negative_prompt": DEFAULT_NEGATIVE,
            "seed": seed,
            "coherence": coherence,
            "surprise": surprise,
        }

    @staticmethod
    def _style_direction(profile: dict[str, str]) -> str:
        personality = profile.get("personality")
        expression = profile.get("expression")

        if personality in {"seria", "kuudere"} or expression in {
            "mirada_fria", "mirada_enfocada", "mirada_enojada"
        }:
            return "cool, controlled, elegant, sharp visual identity with restrained energy"

        if personality in {"alegre", "hiperactiva", "traviesa"}:
            return "bright, energetic, playful visual identity with warm color accents"

        if personality == "rebelde":
            return "bold, defiant, high-contrast visual identity with striking accent colors"

        if personality == "protectora":
            return "warm, strong, reassuring visual identity with durable heroic accents"

        return "balanced, expressive, polished visual identity with coherent color contrast"

    def _build_prompt(
        self,
        profile: dict[str, str],
        labels: dict[str, str],
        style_direction: str,
    ) -> str:
        return (
            f"{self.visual_standard['prompt_core']} "
            f"Character identity: {labels['personality']} personality. "
            f"Physical direction: {labels['stature']}, {labels['body_build']}, {labels['silhouette']}. "
            f"Face construction: {labels['face_shape']}, {labels['nose_style']} nose, "
            f"{labels['expression']} expression. "
            f"Eyes: {labels['eye_shape']} shape, {labels['eyes']} iris color, "
            f"{labels['pupil_shape']} pupils, {labels['eyebrow_style']} eyebrows, "
            f"{labels['mouth_style']} mouth, {labels['facial_detail']} facial detail. "
            f"Hair construction: {labels['hair_length']}, {labels['hair_bangs']} bangs, "
            f"{labels['hairstyle']} main style, {labels['side_hair']} side hair, "
            f"{labels['back_hair']} back hair, {labels['hair']} hair color. "
            f"Clothing: {labels['outfit']}, {labels['outer_layer']}, {labels['footwear']}, "
            f"accessory {labels['accessory']}. "
            f"Color direction: {labels['palette_accent']}. "
            f"Voice identity: {labels['voice']}. "
            f"Combat role: {labels['combat_role']}. "
            f"Signature baseball prop: {labels['baseball_prop']}. "
            f"Pose: {labels['pose']}. "
            f"Signature character quirk: {labels['quirk']}. "
            f"Character-specific mood direction: {style_direction}. "
            "Use selected traits as one coherent design system, not disconnected keywords. "
            "Personality should read through posture, eye tension, hair motion, costume geometry "
            "and one controlled accent palette. The main hairstyle, bangs, side hair and back hair "
            "must form one plausible hairstyle rather than several competing styles. Keep iris and "
            "pupil design intentional and readable at thumbnail size; treat facial markings as optional "
            "single accents, not random decoration. Clothing must communicate the baseball-combat role "
            "while remaining original, functional and non-sexualized. Baseball is the language of combat, "
            "not a school-sports uniform. "
            f"{self.visual_standard['prompt_suffix']}"
        )

    @staticmethod
    def _rationale(
        chosen: dict[str, str],
        profile: dict[str, str],
        labels: dict[str, str],
    ) -> list[str]:
        reasons = []
        locked = [
            TRAIT_KEYS[key]
            for key, value in chosen.items()
            if key in TRAIT_KEYS and value != "auto"
        ]

        if locked:
            reasons.append("Bloqueado por ti: " + ", ".join(locked) + ".")

        if profile.get("personality") == "alegre" and profile.get("stature") == "bajita":
            reasons.append(
                "Alegre + bajita aumenta la afinidad por una lectura compacta, "
                "cálida y energética; se priorizan tonos cálidos y peinados ágiles."
            )

        if profile.get("personality") in {"seria", "kuudere"} and profile.get("expression") in {
            "mirada_fria", "mirada_desafiante", "mirada_enojada"
        }:
            reasons.append(
                "Seria/kuudere + mirada intensa aumenta la afinidad por cabello "
                "violeta, obsidiana o azul nocturno y timbres vocales más profundos."
            )

        if profile.get("personality") == "rebelde":
            reasons.append(
                "Rebelde aumenta la afinidad por alto contraste, cortes dinámicos "
                "y detalles street-tech/combat."
            )

        if profile.get("personality") == "protectora":
            reasons.append(
                "Protectora aumenta la afinidad por siluetas fuertes, equipamiento "
                "defensivo y roles de soporte/tanque."
            )
        if profile.get("quirk"):
            reasons.append(
                f"Detalle sorpresa: {labels.get('quirk', profile['quirk'])}. Los quirks se mantienen pequeños "
                "y funcionales para que sumen personalidad sin dominar el concepto."
            )

        reasons.append(
            "AUTO usa etiquetas compartidas, pesos de compatibilidad y semilla; "
            "la coherencia se controla con un nivel ajustable para evitar clones."
        )
        if profile.get("quirk"):
            reasons.append(
                "El quirk añade una pequeña contradicción, hábito o detalle memorable "
                "para dar personalidad sin convertir el diseño en un solo chiste."
            )
        if profile.get("quirk") and chosen.get("quirk", "auto") == "auto":
            reasons.append(
                "El detalle sorpresa fue elegido por compatibilidad y rareza; los resultados "
                "raros siguen siendo posibles, pero no se fuerzan."
            )
        return reasons


def generate_character(
    rules_path: Path,
    selections: dict[str, str] | None = None,
    seed: int | None = None,
    coherence: float = 0.82,
    surprise: bool = False,
) -> dict[str, Any]:
    return CharacterGenerator(rules_path).generate(
        selections,
        seed,
        coherence,
        surprise,
    )
