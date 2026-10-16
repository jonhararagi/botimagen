#!/usr/bin/env python3
"""Read-only pixel inventory for references/dataset-cuerpos/0.png..15.png.

No reference pixels are copied into product assets. The generated JSON is a CI
artifact and records the exact source-byte SHA-256 for later reproducibility.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
DATASET = ROOT / "references" / "dataset-cuerpos"
OUTPUT = ROOT / "artifacts" / "visual-qa" / "body-reference-audit.json"

CLASSIFICATION: dict[int, dict[str, str]] = {
    0: {"role": "pending_visual_classification", "use": "do not calibrate until visually reviewed"},
    1: {"role": "pending_visual_classification", "use": "do not calibrate until visually reviewed"},
    2: {"role": "pending_visual_classification", "use": "do not calibrate until visually reviewed"},
    3: {"role": "pending_visual_classification", "use": "do not calibrate until visually reviewed"},
    4: {"role": "full_body_frontish_with_hip_shift", "use": "secondary proportions; crossed ankles are pose-specific"},
    5: {"role": "full_body_front_three_quarter_hands_on_hips", "use": "limb and silhouette reference, not neutral calibration"},
    6: {"role": "cropped_near_front_pose", "use": "pose only; lower legs cropped"},
    7: {"role": "cropped_three_quarter_overhead_arms", "use": "pose only; limbs and legs cropped"},
    8: {"role": "cropped_raised_arms", "use": "pose only; arms and legs cropped"},
    9: {"role": "cropped_three_quarter_arched_torso", "use": "pose only; legs cropped"},
    10: {"role": "cropped_strong_three_quarter", "use": "pose only; silhouette touches image edges"},
    11: {"role": "cropped_twisted_side_pose", "use": "pose only; legs below knees cropped"},
    12: {"role": "primary_full_body_front_calibration", "use": "primary front-view proportions; arms abducted and ankle partly occluded"},
    13: {"role": "cropped_three_quarter_rear_hip_pose", "use": "pose only; lower body cropped"},
    14: {"role": "cropped_three_quarter_rear_pose", "use": "pose only; limbs overlap and shins cropped"},
    15: {"role": "secondary_full_body_frontish_with_hip_shift", "use": "secondary silhouette check; crossed ankles are pose-specific"},
}


def _bounds_of_non_background(image: Image.Image) -> dict[str, int] | None:
    rgb = image.convert("RGB")
    # Reference sheets use an opaque near-white background. This is only a
    # reproducible pixel-content bbox, not semantic segmentation of skin/ink.
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, (250, 250, 250))).convert("L")
    mask = Image.eval(diff, lambda value: 255 if value > 14 else 0)
    box = mask.getbbox()
    if box is None:
        return None
    left, top, right, bottom = box
    return {
        "left": left, "top": top, "right_exclusive": right, "bottom_exclusive": bottom,
        "left_margin_px": left, "top_margin_px": top,
        "right_margin_px": image.width - right, "bottom_margin_px": image.height - bottom,
    }


def inspect(path: Path, index: int) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(f"Missing body reference: {path}")
    content = path.read_bytes()
    with Image.open(path) as original:
        original.verify()
    with Image.open(path) as source:
        image_format = source.format
        mode = source.mode
        width, height = source.size
        has_alpha = "A" in source.getbands() or "transparency" in source.info
        rgba = source.convert("RGBA")
        alpha = rgba.getchannel("A")
        alpha_min, alpha_max = alpha.getextrema()
        transparent_pixels = sum(1 for value in alpha.getdata() if value == 0)
        partial_alpha_pixels = sum(1 for value in alpha.getdata() if 0 < value < 255)
        corners = [
            rgba.getpixel((0, 0)), rgba.getpixel((width - 1, 0)),
            rgba.getpixel((0, height - 1)), rgba.getpixel((width - 1, height - 1)),
        ]
        opaque_near_white_corners = all(a == 255 and min(r, g, b) >= 235 for r, g, b, a in corners)
        bbox = _bounds_of_non_background(source)
        rgb_stats = ImageStat.Stat(source.convert("RGB"))
    classification = CLASSIFICATION[index]
    return {
        "file": path.relative_to(ROOT).as_posix(),
        "index": index,
        "bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
        "format": image_format,
        "mode": mode,
        "width": width,
        "height": height,
        "aspect_ratio": round(width / height, 6),
        "has_alpha_channel_or_palette_transparency": has_alpha,
        "alpha_range": [alpha_min, alpha_max],
        "transparent_pixel_count": transparent_pixels,
        "partial_alpha_pixel_count": partial_alpha_pixels,
        "opaque_near_white_corners": opaque_near_white_corners,
        "corner_rgba": corners,
        "non_near_white_content_bbox": bbox,
        "rgb_mean": [round(v, 3) for v in rgb_stats.mean],
        "visual_role": classification["role"],
        "recommended_use": classification["use"],
        "product_reuse_status": "reference-only; permission/license not verified",
    }


def main() -> int:
    if not DATASET.is_dir():
        raise FileNotFoundError(f"Dataset directory does not exist: {DATASET}")
    items = [inspect(DATASET / f"{index}.png", index) for index in range(16)]
    output = {
        "schema_version": 1,
        "dataset_directory": DATASET.relative_to(ROOT).as_posix(),
        "method": "SHA-256 over original file bytes; Pillow PNG decode; alpha/corner/bbox pixel inspection",
        "primary_calibration": "12.png",
        "secondary_check": "15.png",
        "unclassified_for_visual_pose": ["0.png", "1.png", "2.png", "3.png"],
        "limitations": [
            "Non-background bbox detects contrast against near-white, not semantic body regions.",
            "Source license and permission for commercial reuse have not been verified.",
            "Unclassified image pose labels are deliberately left pending rather than inferred from filenames.",
        ],
        "references": items,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": OUTPUT.relative_to(ROOT).as_posix(), "references": items}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
