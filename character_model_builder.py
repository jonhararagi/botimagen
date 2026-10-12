"""Offline character-model builder for batches of 2D PNG references.

This builder creates an editable raster-layer pack, not a trained AI model.
It normalizes the base image, optionally removes a connected flat background,
splits the visible pixels into connected color regions, writes transparent PNG
layers, and computes a reusable palette/style signature across all references.
"""
from __future__ import annotations

import array
import hashlib
import io
import json
import re
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops

from modular_asset_library import AssetImportError, list_user_assets, read_user_asset

ROOT = Path(__file__).resolve().parent
DEFAULT_MODELS_ROOT = ROOT / "user_data" / "character_models"
CANVAS_SIZE = (512, 768)
MAX_REFERENCES = 32
MIN_REGIONS = 4
MAX_REGIONS = 64
PALETTE_COLORS = 24
MODEL_ID_RE = re.compile(r"^model\.([0-9a-f]{32})$")
LAYER_ID_RE = re.compile(r"^layer-[0-9]{3}$")
LAYER_IMAGE_RE = re.compile(r"^layer-[0-9]{3}(?:-thumb)?$")
ALLOWED_KINDS = {"reference", "full_character", "portrait", "modular_piece"}
ALLOWED_CATEGORIES = {
    "reference", "body", "head", "face", "hair_back", "hair_front", "eyes", "brows",
    "mouth", "clothing_top", "clothing_bottom", "footwear", "accessory_back",
    "accessory_front", "portrait",
}


class CharacterModelError(ValueError):
    """Raised when a source batch cannot become a valid editable model pack."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_model_folder(model_id: str, models_root: Path) -> Path:
    match = MODEL_ID_RE.fullmatch(model_id) if isinstance(model_id, str) else None
    if not match:
        raise CharacterModelError("Identificador de modelo inválido.")
    return models_root / ("model-" + match.group(1))


def _read_image(data: bytes) -> Image.Image:
    try:
        with Image.open(io.BytesIO(data)) as opened:
            opened.load()
            if opened.width < 1 or opened.height < 1 or opened.width > 8192 or opened.height > 8192:
                raise CharacterModelError("La imagen supera el tamaño admitido.")
            if opened.width * opened.height > 20_000_000:
                raise CharacterModelError("La imagen supera 20 megapíxeles.")
            return opened.convert("RGBA")
    except CharacterModelError:
        raise
    except (OSError, ValueError) as exc:
        raise CharacterModelError("Uno de los recursos no contiene una imagen válida.") from exc


def _normalize_stage(image: Image.Image) -> Image.Image:
    source = image.convert("RGBA")
    source.thumbnail(CANVAS_SIZE, Image.Resampling.LANCZOS)
    stage = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    x = (CANVAS_SIZE[0] - source.width) // 2
    y = (CANVAS_SIZE[1] - source.height) // 2
    stage.alpha_composite(source, (x, y))
    return stage


def _remove_connected_flat_background(image: Image.Image, tolerance: int = 34) -> tuple[Image.Image, bool]:
    """Remove only a near-uniform background connected to all image corners."""
    rgba = image.convert("RGBA")
    width, height = rgba.size
    raw = bytearray(rgba.tobytes())
    total = width * height
    corners = (0, width - 1, (height - 1) * width, total - 1)
    if sum(1 for idx in corners if raw[idx * 4 + 3] == 0) >= 3:
        return rgba, False

    corner_rgb = [(raw[idx * 4], raw[idx * 4 + 1], raw[idx * 4 + 2]) for idx in corners]
    # Avoid guessing a background when the corners are visibly different.
    first = corner_rgb[0]
    max_distance = tolerance * tolerance * 3
    if any(sum((a - b) ** 2 for a, b in zip(first, sample)) > max_distance for sample in corner_rgb[1:]):
        return rgba, False

    seed_rgb = first
    visited = bytearray(total)
    stack = [0]
    visited[0] = 1
    removed = False
    while stack:
        idx = stack.pop()
        pixel = idx * 4
        if raw[pixel + 3] == 0:
            continue
        rgb = (raw[pixel], raw[pixel + 1], raw[pixel + 2])
        if sum((a - b) ** 2 for a, b in zip(rgb, seed_rgb)) > max_distance:
            continue
        raw[pixel + 3] = 0
        removed = True
        x = idx % width
        neighbours = []
        if x > 0:
            neighbours.append(idx - 1)
        if x + 1 < width:
            neighbours.append(idx + 1)
        if idx >= width:
            neighbours.append(idx - width)
        if idx + width < total:
            neighbours.append(idx + width)
        for neighbour in neighbours:
            if not visited[neighbour]:
                visited[neighbour] = 1
                pos = neighbour * 4
                if raw[pos + 3] and sum((raw[pos + axis] - seed_rgb[axis // 1]) ** 2 for axis in range(3)) <= max_distance:
                    stack.append(neighbour)
    result = Image.frombytes("RGBA", (width, height), bytes(raw))
    return result, removed


def _alpha_bounds(image: Image.Image) -> dict[str, int] | None:
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        return None
    left, top, right, bottom = bounds
    return {"x": left, "y": top, "width": right - left, "height": bottom - top}


def _quantized_palette(image: Image.Image, limit: int = 12) -> list[dict[str, Any]]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A").tobytes()
    quantized = rgba.convert("RGB").quantize(colors=PALETTE_COLORS, method=Image.Quantize.MEDIANCUT)
    indexes = quantized.tobytes()
    palette = quantized.getpalette() or []
    counts: Counter[int] = Counter(indexes[i] for i, a in enumerate(alpha) if a > 8)
    total = sum(counts.values())
    output: list[dict[str, Any]] = []
    for index, count in counts.most_common(limit):
        base = index * 3
        rgb = palette[base:base + 3]
        if len(rgb) != 3:
            continue
        output.append({
            "hex": "#{:02x}{:02x}{:02x}".format(*rgb),
            "pixels": int(count),
            "share": round(count / total, 5) if total else 0,
        })
    return output


def _analyze_source(asset: dict[str, Any], library_root: Path | None) -> tuple[dict[str, Any], Image.Image]:
    try:
        image_bytes, _mime = read_user_asset(str(asset["id"]), library_root)
    except (FileNotFoundError, AssetImportError) as exc:
        raise CharacterModelError("No se pudo leer la imagen " + str(asset.get("filename", asset["id"])) + ".") from exc
    source_image = _read_image(image_bytes)
    source_image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    source_image, background_removed = _remove_connected_flat_background(source_image)
    image = _normalize_stage(source_image)
    bounds = _alpha_bounds(image)
    if not bounds:
        raise CharacterModelError("La imagen " + str(asset.get("filename", asset["id"])) + " quedó vacía después de analizarla.")
    alpha = image.getchannel("A").tobytes()
    visible = sum(1 for value in alpha if value > 8)
    record = {
        "asset_id": asset["id"],
        "label": str(asset.get("label") or asset.get("filename") or asset["id"]),
        "filename": asset.get("source_filename") or asset.get("filename") or "",
        "category": asset.get("category", "reference"),
        "kind": asset.get("kind", "reference"),
        "view": asset.get("view", "unknown"),
        "sha256": asset.get("sha256", ""),
        "source_url": asset.get("source_url", ""),
        "license": asset.get("license", "UNVERIFIED"),
        "canvas": {"width": CANVAS_SIZE[0], "height": CANVAS_SIZE[1]},
        "content_bounds": bounds,
        "alpha_coverage": round(visible / (CANVAS_SIZE[0] * CANVAS_SIZE[1]), 5),
        "background_removed": background_removed,
        "palette": _quantized_palette(image),
    }
    return record, image


def _suggest_zone(bbox: dict[str, int], content: dict[str, int]) -> str:
    center_y = bbox["y"] + bbox["height"] / 2
    relative = (center_y - content["y"]) / max(1, content["height"])
    if relative < 0.24:
        return "head-hair candidate"
    if relative < 0.58:
        return "upper-body candidate"
    if relative < 0.84:
        return "lower-body candidate"
    return "footwear-or-bottom candidate"


def _split_into_regions(
    image: Image.Image,
    destination: Path,
    max_regions: int = 48,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Split a transparent image into color-connected candidate masks.

    The component masks partition the visible source pixels. The output is a
    palette/color-region decomposition, not semantic AI segmentation.
    """
    width, height = image.size
    total = width * height
    raw = image.convert("RGBA").tobytes()
    alpha = image.getchannel("A").tobytes()
    quantized = image.convert("RGB").quantize(colors=PALETTE_COLORS, method=Image.Quantize.MEDIANCUT)
    color_indexes = quantized.tobytes()
    palette = quantized.getpalette() or []
    foreground = sum(1 for value in alpha if value > 0)
    if foreground < 64:
        raise CharacterModelError("La imagen base tiene muy pocos píxeles visibles para dividirla en regiones.")

    labels = array.array("i", [-1]) * total
    components: list[dict[str, Any]] = []
    for start in range(total):
        if alpha[start * 1] == 0 or labels[start] >= 0:
            continue
        color_index = color_indexes[start]
        component_id = len(components)
        labels[start] = component_id
        stack = [start]
        area = 0
        left = width
        top = height
        right = -1
        bottom = -1
        while stack:
            index = stack.pop()
            area += 1
            x = index % width
            y = index // width
            if x < left: left = x
            if x > right: right = x
            if y < top: top = y
            if y > bottom: bottom = y
            # 4-connected flood fill is deliberate: diagonal antialiasing does not
            # bridge otherwise separated line-art regions.
            if x > 0:
                neighbour = index - 1
                if labels[neighbour] < 0 and alpha[neighbour] > 0 and color_indexes[neighbour] == color_index:
                    labels[neighbour] = component_id
                    stack.append(neighbour)
            if x + 1 < width:
                neighbour = index + 1
                if labels[neighbour] < 0 and alpha[neighbour] > 0 and color_indexes[neighbour] == color_index:
                    labels[neighbour] = component_id
                    stack.append(neighbour)
            if y > 0:
                neighbour = index - width
                if labels[neighbour] < 0 and alpha[neighbour] > 0 and color_indexes[neighbour] == color_index:
                    labels[neighbour] = component_id
                    stack.append(neighbour)
            if y + 1 < height:
                neighbour = index + width
                if labels[neighbour] < 0 and alpha[neighbour] > 0 and color_indexes[neighbour] == color_index:
                    labels[neighbour] = component_id
                    stack.append(neighbour)
        base = color_index * 3
        rgb = palette[base:base + 3]
        components.append({
            "component_id": component_id,
            "color_index": int(color_index),
            "color_hex": "#{:02x}{:02x}{:02x}".format(*rgb) if len(rgb) == 3 else "#808080",
            "pixel_count": area,
            "bbox": {"x": left, "y": top, "width": right - left + 1, "height": bottom - top + 1},
        })

    content_bounds = _alpha_bounds(image) or {"x": 0, "y": 0, "width": width, "height": height}
    minimum_area = max(24, int(foreground * 0.0003))
    eligible = [component for component in components if component["pixel_count"] >= minimum_area]
    eligible.sort(key=lambda item: (-item["pixel_count"], item["bbox"]["y"], item["bbox"]["x"]))
    kept = eligible[: max(1, max_regions - 1)]
    keep_ids = {component["component_id"] for component in kept}
    residual_ids = {
        component["component_id"] for component in components if component["component_id"] not in keep_ids
    }
    layer_defs: list[dict[str, Any]] = []
    component_to_layer = [-1] * len(components)

    for component in kept:
        layer_index = len(layer_defs)
        component_to_layer[component["component_id"]] = layer_index
        box = component["bbox"]
        layer_defs.append({
            "id": "layer-{:03d}".format(layer_index + 1),
            "label": "Región {:03d}".format(layer_index + 1),
            "role": "candidate_region",
            "suggested_zone": _suggest_zone(box, content_bounds),
            "pixel_count": component["pixel_count"],
            "bbox": box,
            "color_hex": component["color_hex"],
            "semantic_category": None,
            "layer_order": layer_index * 10 + 10,
            "filename": "layers/layer-{:03d}.png".format(layer_index + 1),
        })

    residual_layer_index: int | None = None
    if residual_ids:
        residual_layer_index = len(layer_defs)
        for component_id in residual_ids:
            component_to_layer[component_id] = residual_layer_index
        residual_components = [component for component in components if component["component_id"] in residual_ids]
        left = min(component["bbox"]["x"] for component in residual_components)
        top = min(component["bbox"]["y"] for component in residual_components)
        right = max(component["bbox"]["x"] + component["bbox"]["width"] - 1 for component in residual_components)
        bottom = max(component["bbox"]["y"] + component["bbox"]["height"] - 1 for component in residual_components)
        layer_defs.append({
            "id": "layer-{:03d}".format(residual_layer_index + 1),
            "label": "Detalles agrupados",
            "role": "detail_aggregate",
            "suggested_zone": "mixed small regions",
            "pixel_count": sum(component["pixel_count"] for component in residual_components),
            "bbox": {"x": left, "y": top, "width": right-left+1, "height": bottom-top+1},
            "color_hex": None,
            "semantic_category": None,
            "layer_order": residual_layer_index * 10 + 10,
            "filename": "layers/layer-{:03d}.png".format(residual_layer_index + 1),
        })

    destination.mkdir(parents=True, exist_ok=False)
    layer_raw = [bytearray(total * 4) for _ in layer_defs]
    for pixel_index, component_id in enumerate(labels):
        if component_id < 0:
            continue
        layer_index = component_to_layer[component_id]
        if layer_index < 0:
            continue
        source_offset = pixel_index * 4
        layer_raw[layer_index][source_offset:source_offset + 4] = raw[source_offset:source_offset + 4]

    layer_images: list[Image.Image] = []
    for layer, pixels in zip(layer_defs, layer_raw, strict=True):
        layer_image = Image.frombytes("RGBA", CANVAS_SIZE, bytes(pixels))
        buffer = io.BytesIO()
        layer_image.save(buffer, format="PNG", optimize=True)
        (destination / Path(layer["filename"]).name).write_bytes(buffer.getvalue())
        box = layer["bbox"]
        cropped = layer_image.crop((box["x"], box["y"], box["x"] + box["width"], box["y"] + box["height"]))
        thumb_buffer = io.BytesIO()
        cropped.save(thumb_buffer, format="PNG", optimize=True)
        (destination / (layer["id"] + "-thumb.png")).write_bytes(thumb_buffer.getvalue())
        layer["thumbnail_filename"] = "layers/" + layer["id"] + "-thumb.png"
        layer["sha256"] = hashlib.sha256(buffer.getvalue()).hexdigest()
        layer_images.append(layer_image)

    reconstruction = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    for layer_image in layer_images:
        reconstruction = Image.alpha_composite(reconstruction, layer_image)
    source_raw = image.convert("RGBA").tobytes()
    reconstructed_raw = reconstruction.tobytes()
    exact_visible = True
    for offset in range(0, len(source_raw), 4):
        if source_raw[offset + 3] > 0 and source_raw[offset:offset + 4] != reconstructed_raw[offset:offset + 4]:
            exact_visible = False
            break

    reconstruction.save(destination.parent / "preview.png", format="PNG", optimize=True)
    image.save(destination.parent / "source.png", format="PNG", optimize=True)
    decomposition = {
        "method": "quantized-color-connected-components-v1",
        "palette_colors": PALETTE_COLORS,
        "source_visible_pixels": foreground,
        "components_detected": len(components),
        "regions_kept": len(kept),
        "residual_components": len(residual_ids),
        "layers_written": len(layer_defs),
        "minimum_region_pixels": minimum_area,
        "round_trip_exact_visible_pixels": exact_visible,
        "canvas": {"width": width, "height": height},
    }
    return layer_defs, decomposition


def _style_signature(references: list[dict[str, Any]]) -> dict[str, Any]:
    color_counts: Counter[str] = Counter()
    category_counts: Counter[str] = Counter()
    alpha_values: list[float] = []
    backgrounds_removed = 0
    for reference in references:
        category_counts[str(reference.get("category", "reference"))] += 1
        alpha_values.append(float(reference.get("alpha_coverage", 0)))
        backgrounds_removed += int(bool(reference.get("background_removed")))
        for color in reference.get("palette", []):
            if isinstance(color, dict) and isinstance(color.get("hex"), str):
                color_counts[color["hex"]] += int(color.get("pixels", 0))
    palette_total = sum(color_counts.values())
    palette = [
        {"hex": color, "pixels": pixels, "share": round(pixels / palette_total, 5) if palette_total else 0}
        for color, pixels in color_counts.most_common(16)
    ]
    return {
        "source_image_count": len(references),
        "category_counts": dict(category_counts),
        "dominant_palette": palette,
        "mean_alpha_coverage": round(sum(alpha_values) / len(alpha_values), 5) if alpha_values else 0,
        "images_with_flat_background_removed": backgrounds_removed,
        "is_trained_ml_model": False,
        "description": "Perfil de referencia visual: paleta y capas raster editables. No ajusta ni entrena un generador de imágenes.",
    }


def _model_json_path(folder: Path) -> Path:
    return folder / "model.json"


def list_character_models(models_root: Path | None = None) -> dict[str, Any]:
    root = Path(models_root) if models_root else DEFAULT_MODELS_ROOT
    if not root.exists():
        return {"schema_version": 1, "count": 0, "models": []}
    if root.is_symlink():
        raise CharacterModelError("El directorio de modelos no puede ser un enlace simbólico.")
    models: list[dict[str, Any]] = []
    for path in root.glob("model-*/model.json"):
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if isinstance(value, dict) and MODEL_ID_RE.fullmatch(str(value.get("id", ""))):
            models.append({
                "id": value["id"], "name": value.get("name", ""), "style_id": value.get("style_id", ""),
                "revision": value.get("revision", 1), "created_at": value.get("created_at", ""),
                "updated_at": value.get("updated_at", ""), "base_asset_id": value.get("base_asset_id", ""),
                "reference_count": len(value.get("references", [])), "layer_count": len(value.get("layers", [])),
                "palette": value.get("style_signature", {}).get("dominant_palette", [])[:6],
                "round_trip_exact_visible_pixels": value.get("decomposition", {}).get("round_trip_exact_visible_pixels", False),
            })
    models.sort(key=lambda item: item.get("updated_at", ""), reverse=True)
    return {"schema_version": 1, "count": len(models), "models": models[:200]}


def read_character_model(model_id: str, models_root: Path | None = None) -> dict[str, Any]:
    root = Path(models_root) if models_root else DEFAULT_MODELS_ROOT
    folder = _safe_model_folder(model_id, root)
    if folder.is_symlink():
        raise CharacterModelError("El directorio de un modelo no puede ser un enlace simbólico.")
    path = _model_json_path(folder)
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise FileNotFoundError("Modelo no encontrado.") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise CharacterModelError("El modelo guardado está dañado.") from exc
    if not isinstance(value, dict) or value.get("id") != model_id or value.get("schema_version") != 1:
        raise CharacterModelError("El esquema del modelo guardado no es compatible.")
    return value


def read_character_model_image(
    model_id: str,
    image_name: str,
    models_root: Path | None = None,
) -> tuple[bytes, str]:
    root = Path(models_root) if models_root else DEFAULT_MODELS_ROOT
    if root.is_symlink():
        raise CharacterModelError("El directorio de modelos no puede ser un enlace simbólico.")
    folder = _safe_model_folder(model_id, root)
    if folder.is_symlink():
        raise CharacterModelError("El directorio de un modelo no puede ser un enlace simbólico.")
    if image_name not in {"preview.png", "source.png"} and not LAYER_IMAGE_RE.fullmatch(image_name.removesuffix(".png")):
        raise CharacterModelError("Nombre de imagen del modelo inválido.")
    if image_name.endswith(".png"):
        image_name = image_name[:-4]
    if image_name.startswith("layer-"):
        model = read_character_model(model_id, root)
        known = {Path(item.get("filename", "")).stem for item in model.get("layers", []) if isinstance(item, dict)}
        base_name = image_name.removesuffix("-thumb")
        if base_name not in known:
            raise FileNotFoundError("Capa no encontrada.")
        path = folder / "layers" / (image_name + ".png")
    else:
        path = folder / (image_name + ".png")
    if path.is_symlink() or path.parent.resolve() not in {folder.resolve(), (folder / "layers").resolve()}:
        raise CharacterModelError("La imagen del modelo no puede salir de su directorio.")
    try:
        data = path.read_bytes()
    except FileNotFoundError as exc:
        raise FileNotFoundError("Imagen del modelo no encontrada.") from exc
    return data, "image/png"


def create_character_model(
    payload: Any,
    library_root: Path | None = None,
    models_root: Path | None = None,
) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise CharacterModelError("El cuerpo debe ser un objeto JSON.")
    allowed = {"name", "style_id", "base_asset_id", "asset_ids", "max_regions"}
    if set(payload) - allowed:
        raise CharacterModelError("El modelo contiene campos no reconocidos.")
    name = payload.get("name")
    style_id = payload.get("style_id", "user-style")
    base_asset_id = payload.get("base_asset_id")
    asset_ids = payload.get("asset_ids")
    max_regions = payload.get("max_regions", 48)
    if not isinstance(name, str) or not name.strip() or len(name.strip()) > 80:
        raise CharacterModelError("El nombre del modelo debe tener entre 1 y 80 caracteres.")
    if not isinstance(style_id, str) or not style_id.strip() or len(style_id.strip()) > 100:
        raise CharacterModelError("El ID del estilo debe tener entre 1 y 100 caracteres.")
    if not isinstance(base_asset_id, str):
        raise CharacterModelError("Selecciona una imagen base para separar en capas.")
    if not isinstance(asset_ids, list) or not 1 <= len(asset_ids) <= MAX_REFERENCES:
        raise CharacterModelError("Selecciona entre 1 y 32 imágenes de referencia.")
    if any(not isinstance(item, str) or len(item) > 100 for item in asset_ids):
        raise CharacterModelError("Hay un identificador de recurso inválido.")
    if len(set(asset_ids)) != len(asset_ids):
        raise CharacterModelError("No repitas el mismo recurso en el lote.")
    if base_asset_id not in asset_ids:
        raise CharacterModelError("La imagen base también debe estar seleccionada como referencia.")
    if isinstance(max_regions, bool) or not isinstance(max_regions, int) or not MIN_REGIONS <= max_regions <= MAX_REGIONS:
        raise CharacterModelError("El límite de regiones debe estar entre 4 y 64.")

    library = list_user_assets(library_root)["assets"]
    by_id = {item.get("id"): item for item in library}
    if any(asset_id not in by_id for asset_id in asset_ids):
        raise CharacterModelError("Una imagen seleccionada ya no existe en la biblioteca local.")
    if any(by_id[asset_id].get("kind") not in ALLOWED_KINDS for asset_id in asset_ids):
        raise CharacterModelError("El lote contiene recursos que no son imágenes o referencias de personaje.")
    root = Path(models_root) if models_root else DEFAULT_MODELS_ROOT
    root.mkdir(parents=True, exist_ok=True)
    if root.is_symlink():
        raise CharacterModelError("El directorio de modelos no puede ser un enlace simbólico.")
    nonce = uuid.uuid4().hex
    model_id = "model." + nonce
    destination = root / ("model-" + nonce)
    temporary = root / (".tmp-" + nonce)
    try:
        temporary.mkdir(mode=0o700)
        reference_records: list[dict[str, Any]] = []
        normalized_images: dict[str, Image.Image] = {}
        for asset_id in asset_ids:
            record, normalized = _analyze_source(by_id[asset_id], library_root)
            reference_records.append(record)
            normalized_images[asset_id] = normalized
        base_index = asset_ids.index(base_asset_id)
        base_image = normalized_images[base_asset_id]
        layers, decomposition = _split_into_regions(base_image, temporary / "layers", max_regions)
        model = {
            "schema_version": 1, "id": model_id, "name": name.strip(), "style_id": style_id.strip(),
            "revision": 1, "created_at": _now(), "updated_at": _now(),
            "base_asset_id": base_asset_id, "base_filename": reference_records[base_index]["filename"],
            "references": reference_records, "style_signature": _style_signature(reference_records),
            "decomposition": decomposition, "layers": layers,
            "workflow": {
                "kind": "editable-raster-region-pack",
                "split_is_semantic": False,
                "needs_user_role_assignment": True,
                "next_action": "Review region masks, assign semantic roles, then import chosen candidates into the modular asset catalog.",
            },
        }
        (temporary / "model.json").write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if destination.exists():
            raise CharacterModelError("Ya existe un paquete con el mismo identificador.")
        temporary.replace(destination)
    except Exception:
        import shutil
        shutil.rmtree(temporary, ignore_errors=True)
        raise
    return {"model": model, "preview_url": "/api/character-models/" + model_id + "/preview.png"}


def extend_character_model(
    model_id: str,
    payload: Any,
    library_root: Path | None = None,
    models_root: Path | None = None,
) -> dict[str, Any]:
    if not isinstance(payload, dict) or set(payload) != {"asset_ids"}:
        raise CharacterModelError("Se requiere únicamente asset_ids para agregar referencias al estilo.")
    asset_ids = payload["asset_ids"]
    if not isinstance(asset_ids, list) or not 1 <= len(asset_ids) <= MAX_REFERENCES:
        raise CharacterModelError("Agrega entre 1 y 32 imágenes.")
    if any(not isinstance(item, str) or len(item) > 100 for item in asset_ids) or len(set(asset_ids)) != len(asset_ids):
        raise CharacterModelError("La lista de imágenes contiene identificadores inválidos o repetidos.")
    root = Path(models_root) if models_root else DEFAULT_MODELS_ROOT
    model = read_character_model(model_id, root)
    current_ids = {item.get("asset_id") for item in model.get("references", [])}
    new_ids = [asset_id for asset_id in asset_ids if asset_id not in current_ids]
    if not new_ids:
        raise CharacterModelError("Las imágenes seleccionadas ya forman parte de este estilo.")
    if len(current_ids) + len(new_ids) > MAX_REFERENCES:
        raise CharacterModelError("Este perfil admite un máximo de 32 referencias.")
    library = list_user_assets(library_root)["assets"]
    by_id = {item.get("id"): item for item in library}
    if any(asset_id not in by_id for asset_id in new_ids):
        raise CharacterModelError("Una imagen nueva ya no existe en la biblioteca local.")
    if any(by_id[asset_id].get("kind") not in ALLOWED_KINDS for asset_id in new_ids):
        raise CharacterModelError("El lote contiene recursos que no son imágenes o referencias de personaje.")
    folder = _safe_model_folder(model_id, root)
    for asset_id in new_ids:
        record, _normalized = _analyze_source(by_id[asset_id], library_root)
        model["references"].append(record)
    model["style_signature"] = _style_signature(model["references"])
    model["revision"] = int(model.get("revision", 1)) + 1
    model["updated_at"] = _now()
    temp = folder / "model.json.tmp"
    with temp.open("x", encoding="utf-8") as handle:
        json.dump(model, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    temp.replace(folder / "model.json")
    return {"model": model, "added_asset_ids": new_ids}


def publish_model_layer(
    model_id: str,
    payload: Any,
    library_root: Path | None = None,
    models_root: Path | None = None,
) -> dict[str, Any]:
    """Promote one or more selected raster regions to a transparent modular part."""
    allowed_fields = {"layer_id", "layer_ids", "label", "category", "view", "license"}
    if not isinstance(payload, dict) or set(payload) - allowed_fields:
        raise CharacterModelError("La solicitud de importación de región contiene campos inválidos.")
    if ("layer_id" in payload) == ("layer_ids" in payload):
        raise CharacterModelError("Indica layer_id para una región o layer_ids para agrupar varias regiones, no ambos.")
    if "layer_ids" in payload:
        raw_ids = payload.get("layer_ids")
        if not isinstance(raw_ids, list) or not 1 <= len(raw_ids) <= MAX_REGIONS:
            raise CharacterModelError("Selecciona entre 1 y 64 regiones para la pieza.")
        if any(not isinstance(item, str) or not LAYER_ID_RE.fullmatch(item) for item in raw_ids):
            raise CharacterModelError("La selección contiene un identificador de región inválido.")
        if len(set(raw_ids)) != len(raw_ids):
            raise CharacterModelError("No repitas una región en la misma pieza.")
        selected_ids = list(raw_ids)
    else:
        layer_id = payload.get("layer_id")
        if not isinstance(layer_id, str) or not LAYER_ID_RE.fullmatch(layer_id):
            raise CharacterModelError("Selecciona una región válida.")
        selected_ids = [layer_id]

    label = payload.get("label")
    category = payload.get("category")
    view = payload.get("view", "front")
    license_name = payload.get("license", "USER_PROVIDED_REFERENCE")
    if not isinstance(label, str) or not label.strip() or len(label.strip()) > 100:
        raise CharacterModelError("El nombre de la pieza debe tener entre 1 y 100 caracteres.")
    if category not in {"body", "head", "face", "hair_back", "hair_front", "eyes", "brows", "mouth", "clothing_top", "clothing_bottom", "footwear", "accessory_back", "accessory_front"}:
        raise CharacterModelError("Selecciona una categoría modular válida.")
    if view not in {"front", "back", "side", "unknown"}:
        raise CharacterModelError("La vista del recurso no es válida.")

    model = read_character_model(model_id, models_root)
    model_layers = {item.get("id"): item for item in model.get("layers", []) if isinstance(item, dict)}
    selected_layers = [model_layers.get(item) for item in selected_ids]
    if any(layer is None for layer in selected_layers):
        raise CharacterModelError("Una de las regiones seleccionadas no existe en este modelo.")

    from PIL import Image
    combined = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    for layer in selected_layers:
        assert layer is not None
        image_bytes, _mime = read_character_model_image(model_id, layer["id"] + ".png", models_root)
        try:
            with Image.open(io.BytesIO(image_bytes)) as opened:
                opened.load()
                layer_image = opened.convert("RGBA")
        except (OSError, ValueError) as exc:
            raise CharacterModelError("No se pudo leer una de las máscaras PNG seleccionadas.") from exc
        if layer_image.size != CANVAS_SIZE:
            raise CharacterModelError("Las regiones del modelo deben conservar el lienzo 512×768.")
        combined.alpha_composite(layer_image)

    bounds = _alpha_bounds(combined)
    if not bounds:
        raise CharacterModelError("La selección de regiones está vacía y no se puede importar.")
    center_x = (bounds["x"] + bounds["width"] / 2) / CANVAS_SIZE[0]
    center_y = (bounds["y"] + bounds["height"] / 2) / CANVAS_SIZE[1]
    rig_category = {
        "body": "body", "head": "head", "face": "face", "hair_back": "hair_back",
        "hair_front": "hair_front", "eyes": "eyes", "brows": "brows", "mouth": "mouth",
        "clothing_top": "top", "clothing_bottom": "bottom", "footwear": "footwear",
        "accessory_back": "accessory", "accessory_front": "accessory",
    }[category]
    stage_png = io.BytesIO()
    combined.save(stage_png, format="PNG", optimize=True)
    png_data = stage_png.getvalue()
    import base64
    from modular_asset_library import import_user_asset
    # A stable safe source filename ties the saved piece back to the model and selected region set.
    selection_hash = hashlib.sha256(",".join(selected_ids).encode("ascii")).hexdigest()[:12]
    source_filename = model_id.replace(".", "-") + "-group-" + selection_hash + ".png"
    record = import_user_asset({
        "filename": label.strip().replace("/", "_") + ".png",
        "source_filename": source_filename,
        "mime_type": "image/png",
        "data_base64": base64.b64encode(png_data).decode("ascii"),
        "category": category,
        "label": label.strip(),
        "kind": "modular_piece",
        "view": view,
        "license": license_name if isinstance(license_name, str) and license_name.strip() else "USER_PROVIDED_REFERENCE",
        "source_url": next((item.get("source_url", "") for item in model["references"] if item.get("asset_id") == model.get("base_asset_id")), ""),
        "conversion": {
            "schema_version": 1, "algorithm": "botimagen-png-stage-v1", "normalized": True,
            "canvas_width": CANVAS_SIZE[0], "canvas_height": CANVAS_SIZE[1],
            "source_width": CANVAS_SIZE[0], "source_height": CANVAS_SIZE[1],
            "source_format": "image/png", "background_removed": True, "background_tolerance": 0,
            "scale_percent": 100, "offset_x": 0, "offset_y": 0, "pose": view,
            "rig_category": rig_category, "content_bounds": bounds,
            "anchors": {"origin": {"x": round(center_x, 4), "y": round(center_y, 4)}},
            "anchor_status": "estimated_not_validated", "cutout_applied": False,
        },
    }, library_root)
    return {
        "asset": record, "model_id": model_id,
        "layer_id": selected_ids[0] if len(selected_ids) == 1 else None,
        "layer_ids": selected_ids,
        "merged_region_count": len(selected_ids),
    }

def _save_layer_category(
    model_id: str,
    layer_id: str,
    label: str,
    category: str,
    models_root: Path | None = None,
) -> dict[str, Any]:
    """Not used by the public API yet; kept internal for schema stability."""
    model = read_character_model(model_id, models_root)
    if category not in ALLOWED_CATEGORIES or not isinstance(label, str) or not label.strip():
        raise CharacterModelError("La etiqueta o categoría de la región no es válida.")
    layer = next((item for item in model["layers"] if item.get("id") == layer_id), None)
    if layer is None:
        raise CharacterModelError("La región no existe.")
    layer["label"] = label.strip()[:100]
    layer["semantic_category"] = category
    model["revision"] += 1
    model["updated_at"] = _now()
    folder = _safe_model_folder(model_id, Path(models_root) if models_root else DEFAULT_MODELS_ROOT)
    temp = folder / "model.json.tmp"
    temp.write_text(json.dumps(model, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(folder / "model.json")
    return model
