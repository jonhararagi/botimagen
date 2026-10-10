from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_generator import CharacterGenerator


RULES = ROOT / "character_rules.json"


def test_generation_is_reproducible_for_seed_and_inputs():
    """The same explicit seed and inputs must reproduce the full generation payload."""
    selections = {
        "species": "humana",
        "body_build": "atletica_potente",
        "face_shape": "diamante",
        "eye_shape": "felinos",
        "hair": "auto",
        "hair_color_pattern": "auto",
        "outfit": "auto",
        "combat_role": "auto",
        "quirk": "auto",
    }

    for seed in (0, 1, 42, 2026, 65535):
        for surprise in (False, True):
            first = CharacterGenerator(RULES).generate(
                selections, seed=seed, coherence=0.35, surprise=surprise
            )
            second = CharacterGenerator(RULES).generate(
                selections, seed=seed, coherence=0.35, surprise=surprise
            )
            assert first == second, (
                f"Generation changed for identical inputs: seed={seed}, "
                f"surprise={surprise}"
            )


def test_manual_face_and_body_locks_survive_seed_coherence_and_surprise_matrix():
    """Explicit face/body traits stay locked across RNG and refinement settings."""
    selections = {
        "species": "humana",
        "body_build": "atletica_potente",
        "body_proportions": "piernas_largas",
        "bust_size": "balanced",
        "skin_tone": "oliva_suave",
        "face_shape": "diamante",
        "eye_shape": "felinos",
        "pupil_shape": "anillo_concentrico",
        "eyebrow_style": "anguladas",
        "mouth_style": "sonrisa_ladeada",
        "nose_style": "puente_recto",
        "facial_detail": "pecas_sutiles",
        "height_cm": "h175",
    }

    for seed in (0, 1, 42, 2026, 65535):
        for coherence in (0.0, 0.35, 1.0):
            for surprise in (False, True):
                result = CharacterGenerator(RULES).generate(
                    selections,
                    seed=seed,
                    coherence=coherence,
                    surprise=surprise,
                )
                for category, expected in selections.items():
                    assert result["profile"][category] == expected, (
                        f"{category} manual lock changed: seed={seed}, "
                        f"coherence={coherence}, surprise={surprise}, "
                        f"expected={expected!r}, got={result['profile'][category]!r}"
                    )


if __name__ == "__main__":
    test_generation_is_reproducible_for_seed_and_inputs()
    test_manual_face_and_body_locks_survive_seed_coherence_and_surprise_matrix()
