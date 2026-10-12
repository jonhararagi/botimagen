"""Versioned modular character contract and deterministic PNG compositor.

Anatomical anchors are normalized canvas coordinates (0..1), not inferred
landmarks. Assets without reviewed anchors remain unvalidated and are rejected
for production composition unless explicitly allowed for calibration previews.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

SCHEMA_VERSION = 1
PROFILE_SCHEMA_VERSION = 1
CATEGORIES = {
    "body", "face", "hair_back", "hair_front", "torso", "arm", "hand",
    "leg", "footwear", "top", "bottom", "coat", "accessory",
}
ANCHORS = {
    "head", "neck", "shoulder_l", "shoulder_r", "waist", "hip", "origin",
    "elbow_l", "elbow_r", "hand_l", "hand_r", "knee_l", "knee_r", "ankle_l", "ankle_r",
}
ID_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$")
DEFAULT_LAYER_ORDER = {
    "hair_back": 10, "body": 20, "leg": 25, "footwear": 28, "torso": 30,
    "arm": 32, "hand": 34, "bottom": 36, "top": 40, "coat": 45,
    "head": 48, "neck": 49, "face": 50, "eyes": 52, "brows": 54, "mouth": 56,
    "accessory": 60, "hair_front": 70,
}


class CompositionError(ValueError):
    """Invalid, missing, incompatible, or unvalidated composition input."""


def validate_piece(piece: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(piece, dict) or piece.get("schema_version") != SCHEMA_VERSION:
        raise CompositionError("La pieza debe declarar schema_version=1.")
    piece_id = piece.get("id")
    if not isinstance(piece_id, str) or not ID_RE.fullmatch(piece_id):
        raise CompositionError("Identificador de pieza inválido.")
    category = piece.get("category")
    if category not in CATEGORIES:
        raise CompositionError(f"Categoría de pieza desconocida: {category!r}.")
    resource = piece.get("resource")
    if not isinstance(resource, str) or not resource.strip():
        raise CompositionError("La pieza necesita una referencia de recurso.")
    dimensions = piece.get("dimensions")
    if not isinstance(dimensions, dict) or any(
        isinstance(dimensions.get(k), bool) or not isinstance(dimensions.get(k), int)
        or dimensions[k] <= 0 for k in ("width", "height")
    ):
        raise CompositionError("Las dimensiones originales deben ser enteros positivos.")
    transform = piece.get("transform", {})
    if not isinstance(transform, dict):
        raise CompositionError("transform debe ser un objeto.")
    for key, default in (("x", 0.0), ("y", 0.0), ("scale_x", 1.0), ("scale_y", 1.0), ("rotation", 0.0)):
        value = transform.get(key, default)
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise CompositionError(f"Transformación {key} inválida.")
        if key.startswith("scale") and not 0.01 <= value <= 20:
            raise CompositionError(f"Escala {key} fuera del rango 0.01..20.")
    anchors = piece.get("anchors", {})
    if not isinstance(anchors, dict):
        raise CompositionError("anchors debe ser un objeto.")
    for name, point in anchors.items():
        if name not in ANCHORS or not isinstance(point, dict):
            raise CompositionError(f"Anclaje desconocido o inválido: {name}.")
        for axis in ("x", "y"):
            value = point.get(axis)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not 0 <= value <= 1:
                raise CompositionError(f"El anclaje {name}.{axis} debe estar normalizado entre 0 y 1.")
    compatible = piece.get("compatible_with", [])
    if not isinstance(compatible, list) or any(not isinstance(x, str) for x in compatible):
        raise CompositionError("compatible_with debe ser una lista de categorías.")
    if any(x not in CATEGORIES for x in compatible):
        raise CompositionError("compatible_with contiene categorías desconocidas.")
    order = piece.get("layer_order", DEFAULT_LAYER_ORDER.get(category, 50))
    if isinstance(order, bool) or not isinstance(order, int):
        raise CompositionError("layer_order debe ser un entero.")
    if not isinstance(piece.get("anchors_validated", False), bool):
        raise CompositionError("anchors_validated debe ser booleano.")
    return {**piece, "layer_order": order}


def validate_selection(pieces: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    clean = [validate_piece(p) for p in pieces]
    ids = [p["id"] for p in clean]
    if len(ids) != len(set(ids)):
        raise CompositionError("La composición contiene IDs de pieza duplicados.")
    categories: dict[str, dict[str, Any]] = {}
    for piece in clean:
        cat = piece["category"]
        if cat in categories and cat not in {"accessory", "arm", "hand", "leg", "footwear"}:
            raise CompositionError(f"Solo puede seleccionarse una pieza de categoría {cat}.")
        categories[cat] = piece
    for piece in clean:
        if piece["category"] in {
            "head", "eyes", "brows", "mouth", "top", "bottom", "coat", "hair_back",
            "hair_front", "face", "arm", "hand", "leg", "footwear",
        }:
            body = categories.get("body")
            if body is None:
                raise CompositionError(f"La pieza {piece['id']} requiere un cuerpo base.")
            allowed = piece.get("compatible_with", [])
            if allowed and body["id"] not in allowed and body["category"] not in allowed:
                raise CompositionError(f"La pieza {piece['id']} no es compatible con el cuerpo seleccionado.")
    return sorted(clean, key=lambda p: (p["layer_order"], p["id"]))


def compose_png(
    pieces: Iterable[dict[str, Any]],
    resource_loader,
    canvas_size: tuple[int, int] = (1024, 1024),
    *,
    require_validated_anchors: bool = True,
) -> bytes:
    """Alpha-composite selected images on a transparent canvas in stable order.

    x/y are normalized top-left offsets. Anchors are metadata for calibrated
    alignment; they are never silently guessed or treated as verified.
    """
    try:
        from PIL import Image
    except ImportError as exc:
        raise CompositionError("La composición PNG requiere Pillow.") from exc
    width, height = canvas_size
    if any(isinstance(v, bool) or not isinstance(v, int) or v < 1 or v > 8192 for v in canvas_size):
        raise CompositionError("Tamaño de lienzo inválido (1..8192 px).")
    selected = validate_selection(pieces)
    if not selected:
        raise CompositionError("Selecciona al menos una pieza.")
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    for piece in selected:
        if require_validated_anchors and piece["category"] != "body" and not piece.get("anchors_validated", False):
            raise CompositionError(f"La pieza {piece['id']} tiene anclajes pendientes de validación visual.")
        raw = resource_loader(piece["resource"])
        if not isinstance(raw, (bytes, bytearray)):
            raise CompositionError(f"El recurso de {piece['id']} no devolvió bytes.")
        try:
            with Image.open(io.BytesIO(raw)) as opened:
                image = opened.convert("RGBA")
                image.load()
        except Exception as exc:
            raise CompositionError(f"El recurso de {piece['id']} no es una imagen válida.") from exc
        if image.size != (piece["dimensions"]["width"], piece["dimensions"]["height"]):
            raise CompositionError(f"Las dimensiones del recurso {piece['id']} no coinciden con su contrato.")
        transform = piece.get("transform", {})
        sw = max(1, round(image.width * transform.get("scale_x", 1)))
        sh = max(1, round(image.height * transform.get("scale_y", 1)))
        if (sw, sh) != image.size:
            image = image.resize((sw, sh), Image.Resampling.LANCZOS)
        rotation = transform.get("rotation", 0)
        if rotation:
            image = image.rotate(-rotation, resample=Image.Resampling.BICUBIC, expand=True)
        x = round(transform.get("x", 0) * width)
        y = round(transform.get("y", 0) * height)
        layer = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        layer.alpha_composite(image, (x, y))
        canvas.alpha_composite(layer)
    output = io.BytesIO()
    canvas.save(output, format="PNG", optimize=False)
    return output.getvalue()


def make_modular_profile(selections: dict[str, str | None], transforms: dict[str, dict[str, float]] | None = None) -> dict[str, Any]:
    if not isinstance(selections, dict) or any(not isinstance(k, str) or (v is not None and not isinstance(v, str)) for k, v in selections.items()):
        raise CompositionError("Selecciones modulares inválidas.")
    clean_transforms = transforms or {}
    if not isinstance(clean_transforms, dict):
        raise CompositionError("Las transformaciones del perfil deben ser un objeto.")
    return {
        "schema_version": PROFILE_SCHEMA_VERSION,
        "pieces": dict(sorted(selections.items())),
        "transforms": {k: dict(sorted(v.items())) for k, v in sorted(clean_transforms.items())},
    }


def migrate_profile(profile: dict[str, Any]) -> dict[str, Any]:
    """Add modular data without rewriting existing recipe v1/v2/v3 values."""
    if not isinstance(profile, dict):
        raise CompositionError("Perfil inválido.")
    result = dict(profile)
    modular = result.get("modular_composition")
    if modular is None:
        result["modular_composition"] = make_modular_profile({})
    elif not isinstance(modular, dict) or modular.get("schema_version") != PROFILE_SCHEMA_VERSION:
        raise CompositionError("Versión de composición modular no compatible.")
    return result


def composition_digest(png: bytes) -> str:
    return hashlib.sha256(png).hexdigest()
