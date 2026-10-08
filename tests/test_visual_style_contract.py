from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_generator import CharacterGenerator

RULES_PATH = ROOT / "character_rules.json"
STYLE_PATH = ROOT / "visual_style_catalog.json"
TEN_OPTION_CATEGORIES = (
    "face_shape", "hair_length", "hairstyle", "hair", "eyes", "eye_shape",
    "outfit", "accessory", "expression", "hair_bangs", "side_hair",
    "back_hair", "pupil_shape", "eyebrow_style", "mouth_style", "nose_style",
    "facial_detail", "outer_layer", "footwear", "palette_accent", "pose",
    "silhouette", "body_build", "baseball_prop",
)


def test_visual_categories_have_ten_unique_options():
    rules = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    categories = rules["categories"]
    for category in TEN_OPTION_CATEGORIES:
        items = categories[category]
        assert len(items) == 10, f"{category} has {len(items)} options, expected 10"
        ids = [item["id"] for item in items]
        assert len(ids) == len(set(ids)), f"{category} contains duplicate IDs"
        assert all(item.get("label") and item.get("tags") for item in items)


def test_one_universal_style_contract_and_reference_schema():
    data = json.loads(STYLE_PATH.read_text(encoding="utf-8"))
    assert data["style_mode"] == "BETA_UNIVERSAL"
    active_id = data["active_style_id"]
    active = [style for style in data["styles"] if style["id"] == active_id]
    assert len(active) == 1
    assert active[0]["name"] == "Anime moderno de gacha"
    assert "consistent 2D anime" in active[0]["prompt_core"]
    fields = {item["name"] for item in data["reference_metadata_schema"]["fields"]}
    assert {"source_url", "creator", "license_status", "category", "trait_id",
            "tags_original", "tags_detected", "prompt", "model", "seed",
            "metadata_confidence"}.issubset(fields)


def test_prompt_uses_separated_face_and_hair_parts_and_preserves_locks():
    generator = CharacterGenerator(RULES_PATH)
    result = generator.generate(
        {
            "personality": "alegre",
            "hair_bangs": "lateral",
            "pupil_shape": "estrella",
            "eyebrow_style": "gruesas_deportivas",
            "mouth_style": "sonrisa_amplia",
        },
        seed=13579,
    )
    profile = result["profile"]
    prompt = result["prompt"]
    assert profile["hair_bangs"] == "lateral"
    assert profile["pupil_shape"] == "estrella"
    assert profile["eyebrow_style"] == "gruesas_deportivas"
    assert profile["mouth_style"] == "sonrisa_amplia"
    assert "pupils" in prompt
    assert "eyebrows" in prompt
    assert "nose" in prompt
    assert "side hair" in prompt
    assert "back hair" in prompt
    assert result["style_id"] == "bw-modern-gacha-v1"
    assert "one unified rendering language" in prompt


def test_seed_reproduces_profile_and_prompt():
    generator = CharacterGenerator(RULES_PATH)
    first = generator.generate({"personality": "seria"}, seed=2408, coherence=0.9)
    second = generator.generate({"personality": "seria"}, seed=2408, coherence=0.9)
    assert first["profile"] == second["profile"]
    assert first["prompt"] == second["prompt"]
    assert first["style_id"] == second["style_id"]


if __name__ == "__main__":
    test_visual_categories_have_ten_unique_options()
    test_one_universal_style_contract_and_reference_schema()
    test_prompt_uses_separated_face_and_hair_parts_and_preserves_locks()
    test_seed_reproduces_profile_and_prompt()
    print("PASS: visual style contract and catalog tests")
