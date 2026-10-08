from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any


DEFAULT_NEGATIVE = (
    "photorealistic, live-action, 3d CGI render, low-poly, generic stock anime, "
    "copied franchise character, recognizable existing character outfit, school-uniform clone, "
    "sexualized minor, childlike body proportions, gore, blood, text, subtitles, watermark, "
    "signature, logo, brand markings, extra characters, duplicate limbs, malformed hands, "
    "cropped head, cropped feet, unreadable silhouette, excessive bloom, heavy film grain, "
    "muddy details, over-rendered microtexture"
)

TRAIT_KEYS = {
    "personality": "Personalidad",
    "stature": "Estatura",
    "silhouette": "Silueta",
    "expression": "Expresión",
    "hair": "Cabello",
    "eyes": "Ojos",
    "voice": "Voz",
    "combat_role": "Rol de combate",
}


class CharacterGenerator:
    def __init__(self, rules_path: Path):
        self.rules_path = Path(rules_path)
        self.rules = self._load()
        self.categories = self.rules.get("categories", {})

    def _load(self) -> dict[str, Any]:
        with self.rules_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict) or not isinstance(data.get("categories"), dict):
            raise ValueError("Invalid character generator rules")
        return data

    def options(self, category: str) -> list[dict[str, Any]]:
        return [{"id": "auto", "label": "AUTO · que el sistema decida"}] + self.categories.get(category, [])

    def _score(self, category: str, candidate: dict[str, Any], chosen: dict[str, str]) -> float:
        score = float(candidate.get("base", 1))
        for source_key, source_value in chosen.items():
            if source_value == "auto":
                continue
            score += float(candidate.get("bias", {}).get(f"{source_key}:{source_value}", 0))
        return score

    def _choose_category(self, category: str, chosen: dict[str, str], rng: random.Random) -> tuple[str, str]:
        requested = chosen.get(category, "auto")
        values = self.categories.get(category, [])
        by_id = {item["id"]: item for item in values}
        if requested != "auto":
            if requested not in by_id:
                raise ValueError(f"Unknown {category} value: {requested}")
            return requested, by_id[requested]["label"]

        ranked = [(self._score(category, item, chosen), item) for item in values]
        ranked.sort(key=lambda item: item[0], reverse=True)
        top_score = ranked[0][0]
        pool = [item for score, item in ranked if score >= max(top_score - 1.75, top_score * 0.72)]
        selected = rng.choice(pool)
        return selected["id"], selected["label"]

    def generate(self, selections: dict[str, str] | None = None, seed: int | None = None) -> dict[str, Any]:
        chosen = dict(selections or {})
        rng = random.Random(seed)
        profile: dict[str, str] = {}
        labels: dict[str, str] = {}

        for category in ("personality", "stature", "silhouette", "expression", "hair", "eyes", "voice", "combat_role"):
            value, label = self._choose_category(category, {**chosen, **profile}, rng)
            profile[category] = value
            labels[category] = label

        for category in ("hair", "eyes", "voice", "combat_role", "silhouette"):
            if chosen.get(category, "auto") != "auto":
                continue
            value, label = self._choose_category(category, {**chosen, **profile}, rng)
            profile[category] = value
            labels[category] = label

        tags: set[str] = set()
        for category, value in profile.items():
            for item in self.categories.get(category, []):
                if item.get("id") == value:
                    tags.update(item.get("tags", []))
                    break

        style_direction = self._style_direction(profile)
        prompt = self._build_prompt(profile, labels, style_direction)
        return {
            "version": self.rules.get("version", 1),
            "profile": profile,
            "labels": labels,
            "rationale": self._rationale(chosen, profile),
            "prompt": prompt,
            "negative_prompt": DEFAULT_NEGATIVE,
            "seed": seed,
        }

    @staticmethod
    def _style_direction(profile: dict[str, str]) -> str:
        if profile.get("personality") in {"seria", "kuudere"} or profile.get("expression") in {"mirada_fria", "mirada_enfocada"}:
            return "cool, controlled, elegant, sharp visual identity with restrained energy"
        if profile.get("personality") in {"alegre", "hiperactiva", "traviesa"}:
            return "bright, energetic, playful visual identity with warm color accents"
        if profile.get("personality") == "rebelde":
            return "bold, defiant, high-contrast visual identity with striking accent colors"
        return "balanced, expressive, polished visual identity with coherent color contrast"

    def _build_prompt(self, profile: dict[str, str], labels: dict[str, str], style_direction: str) -> str:
        return (
            f"{self.rules.get('style_core', '')}. "
            f"Character concept: {labels['personality']} personality, {labels['stature']} stature, "
            f"{labels['silhouette']} silhouette, {labels['expression']} facial expression. "
            f"Hair: {labels['hair']}. Eyes: {labels['eyes']}. "
            f"Voice identity: {labels['voice']}. Combat role: {labels['combat_role']}. "
            f"Overall visual direction: {style_direction}. "
            "Build an original heroine with internal visual logic: personality must be readable "
            "from posture, face, hair movement and costume shapes; stature must influence the "
            "silhouette; expression must be consistent with personality; hair, eye and accent colors "
            "must form a deliberate palette. Design a functional baseball-combat outfit, not a school "
            "sports uniform: layered fabric, practical movement, restrained hard-surface details, "
            "tasteful baseball cues, clear role readability. Full body, head to shoes, three-quarter "
            "dynamic idle stance, balanced hands and feet, transparent background, generous padding, "
            "no crop, production-ready PNG cutout, subtle rim light, controlled highlights, clean "
            "shadow grouping, polished mobile-game key art."
        )

    @staticmethod
    def _rationale(chosen: dict[str, str], profile: dict[str, str]) -> list[str]:
        reasons = []
        locked = [TRAIT_KEYS[key] for key, value in chosen.items() if key in TRAIT_KEYS and value != "auto"]
        if locked:
            reasons.append("Bloqueado por ti: " + ", ".join(locked) + ".")
        if profile.get("personality") == "alegre" and profile.get("stature") == "bajita":
            reasons.append("Alegre + bajita aumenta la afinidad por tonos cálidos y una lectura compacta/ágil; por eso se priorizan rojos, naranjas y acentos luminosos.")
        if profile.get("personality") in {"seria", "kuudere"} and profile.get("expression") in {"mirada_fria", "mirada_desafiante"}:
            reasons.append("Seria/kuudere + mirada intensa aumenta la afinidad por violetas, azul nocturno u obsidiana y un timbre de voz más profundo.")
        reasons.append("Los rasgos AUTO se eligen por pesos de compatibilidad, con variación aleatoria controlada para evitar personajes idénticos.")
        return reasons


def generate_character(rules_path: Path, selections: dict[str, str] | None = None, seed: int | None = None) -> dict[str, Any]:
    return CharacterGenerator(rules_path).generate(selections, seed)
