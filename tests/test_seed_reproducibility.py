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
