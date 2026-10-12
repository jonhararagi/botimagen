from __future__ import annotations

import base64
import hashlib
import json
import re
import struct
import uuid
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DEFAULT_LIBRARY_ROOT = ROOT / "user_data" / "modular_assets"
MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_DIMENSION = 8192
MAX_PIXELS = 20_000_000
SUPPORTED_MIME = {"image/png", "image/jpeg", "image/webp"}
CATEGORIES = {
    "body", "head", "face", "hair_back", "hair_front", "eyes", "brows", "mouth",
    "clothing_top", "clothing_bottom", "footwear", "accessory_back", "accessory_front",
    "reference", "portrait",
}


class AssetImportError(ValueError):
    pass


def _image_dimensions(data: bytes, mime: str) -> tuple[int, int]:
    """Read dimensions from a recognized image header without trusting the filename."""
    if mime == "image/png":
        if len(data) < 45 or data[:8] != b"\x89PNG\r\n\x1a\n":
            raise AssetImportError("El contenido no es un PNG válido.")
        offset, seen_header, seen_data, seen_end = 8, False, False, False
        width = height = 0
        while offset + 12 <= len(data):
            length = int.from_bytes(data[offset:offset + 4], "big")
            chunk_type = data[offset + 4:offset + 8]
            end = offset + 12 + length
            if end > len(data):
                raise AssetImportError("El PNG está truncado.")
            chunk_data = data[offset + 8:offset + 8 + length]
            expected_crc = int.from_bytes(data[offset + 8 + length:end], "big")
            actual_crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
            if expected_crc != actual_crc:
                raise AssetImportError("El PNG contiene un CRC inválido.")
            if not seen_header:
                if chunk_type != b"IHDR" or length != 13:
                    raise AssetImportError("Cabecera PNG inválida.")
                width, height = struct.unpack(">II", chunk_data[:8])
                seen_header = True
            if chunk_type == b"IDAT":
                seen_data = True
            if chunk_type == b"IEND":
                if length != 0 or end != len(data):
                    raise AssetImportError("Final PNG inválido o datos sobrantes.")
                seen_end = True
                break
            offset = end
        if not (seen_header and seen_data and seen_end):
            raise AssetImportError("El PNG está incompleto.")
        return width, height
    if mime == "image/webp":
        if len(data) < 30 or data[:4] != b"RIFF" or data[8:12] != b"WEBP" or int.from_bytes(data[4:8], "little") + 8 != len(data):
            raise AssetImportError("El contenido WebP es inválido o está truncado.")
        chunk = data[12:16]
        if chunk == b"VP8X":
            width = 1 + int.from_bytes(data[24:27], "little")
            height = 1 + int.from_bytes(data[27:30], "little")
            return width, height
        if chunk == b"VP8 " and len(data) >= 30 and data[23:26] == b"\x9d\x01\x2a":
            return struct.unpack("<HH", data[26:30])[0] & 0x3FFF, struct.unpack("<HH", data[26:30])[1] & 0x3FFF
        if chunk == b"VP8L" and len(data) >= 25 and data[20] == 0x2F:
            b1, b2, b3, b4 = data[21:25]
            return 1 + (((b2 & 0x3F) << 8) | b1), 1 + (((b4 & 0x0F) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6))
        raise AssetImportError("Cabecera WebP no compatible o incompleta.")
    if mime == "image/jpeg":
        if len(data) < 6 or data[:2] != b"\xff\xd8" or not data.endswith(b"\xff\xd9"):
            raise AssetImportError("El contenido JPEG es inválido o está truncado.")
        i = 2
        sof = {0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}
        while i + 4 <= len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            while i < len(data) and data[i] == 0xFF:
                i += 1
            if i >= len(data):
                break
            marker = data[i]
            i += 1
            if marker in {0xD8, 0xD9} or 0xD0 <= marker <= 0xD7:
                continue
            if i + 2 > len(data):
                break
            size = int.from_bytes(data[i:i + 2], "big")
            if size < 2 or i + size > len(data):
                raise AssetImportError("Segmento JPEG incompleto.")
            if marker in sof:
                if size < 7:
                    raise AssetImportError("Cabecera JPEG incompleta.")
                height, width = struct.unpack(">HH", data[i + 3:i + 7])
                return width, height
            i += size
        raise AssetImportError("No se encontraron dimensiones JPEG verificables.")
    raise AssetImportError("Formato no admitido. Usa PNG, JPEG o WebP.")


def _safe_display_name(name: Any) -> str:
    if not isinstance(name, str):
        raise AssetImportError("El nombre de archivo debe ser texto.")
    if "/" in name or chr(92) in name or name in {".", ".."}:
        raise AssetImportError("No se admiten rutas en el nombre del archivo.")
    leaf = name
    leaf = re.sub(r"[^A-Za-z0-9._ -]", "_", leaf).strip(" .")
    if not leaf or leaf in {".", ".."} or len(leaf) > 120:
        raise AssetImportError("Nombre de archivo no válido.")
    return leaf


def _read_catalog(root: Path) -> dict[str, Any]:
    path = root / "catalog.json"
    if not path.exists():
        return {"schema_version": 1, "assets": []}
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise AssetImportError("El catálogo local está dañado y no se modificó.") from exc
    if not isinstance(value, dict) or value.get("schema_version") != 1 or not isinstance(value.get("assets"), list):
        raise AssetImportError("El esquema del catálogo local no es compatible.")
    return value


def list_user_assets(library_root: Path | None = None) -> dict[str, Any]:
    root = Path(library_root) if library_root else DEFAULT_LIBRARY_ROOT
    catalog = _read_catalog(root)
    visible = []
    for item in catalog["assets"]:
        if not isinstance(item, dict):
            continue
        path = root / str(item.get("stored_name", ""))
        if path.is_file() and path.parent.resolve() == root.resolve():
            visible.append({k: v for k, v in item.items() if k != "stored_name"} | {"available": True})
    return {"schema_version": 1, "count": len(visible), "assets": visible}


def confirm_user_asset_anchors(
    asset_id: str,
    library_root: Path | None = None,
    anchors: Any = None,
) -> dict[str, Any]:
    """Promote a normalized candidate only after the user checks its stage preview."""
    if not isinstance(asset_id, str) or not re.fullmatch(r"user\.[0-9a-f]{32}", asset_id):
        raise AssetImportError("Identificador de asset inválido.")
    root = Path(library_root) if library_root else DEFAULT_LIBRARY_ROOT
    if root.is_symlink():
        raise AssetImportError("El directorio de biblioteca no puede ser un enlace simbólico.")
    catalog = _read_catalog(root)
    item = next((entry for entry in catalog["assets"] if isinstance(entry, dict) and entry.get("id") == asset_id), None)
    if item is None:
        raise FileNotFoundError(asset_id)
    if item.get("kind") != "modular_piece":
        raise AssetImportError("Solo se pueden validar piezas declaradas modulares.")
    if (item.get("width"), item.get("height")) != (512, 768) or not isinstance(item.get("conversion"), dict):
        raise AssetImportError("Convierte la imagen al lienzo común 512×768 antes de validar sus anclajes.")
    if not isinstance(item.get("anchor_estimate"), dict) or not item["anchor_estimate"]:
        raise AssetImportError("La pieza no contiene estimaciones de anclaje.")
    conversion = dict(item["conversion"])
    if anchors is not None:
        conversion["anchors"] = anchors
    clean_conversion = _validate_conversion_metadata(conversion, item["width"], item["height"])
    if clean_conversion is None:
        raise AssetImportError("La pieza no contiene metadatos de conversión válidos.")
    item["conversion"] = clean_conversion
    item["anchor_estimate"] = clean_conversion["anchors"]
    item["anchors_validated"] = True
    item["anchor_status"] = "user_confirmed"
    item["note"] = "El usuario ajustó/revisó los puntos del esqueleto en la vista previa y confirmó el encaje."
    temporary = root / ("catalog.json." + uuid.uuid4().hex + ".tmp")
    try:
        with temporary.open("x", encoding="utf-8") as handle:
            json.dump(catalog, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        temporary.replace(root / "catalog.json")
    finally:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass
    return {key: value for key, value in item.items() if key != "stored_name"}


def read_user_asset(asset_id: str, library_root: Path | None = None) -> tuple[bytes, str]:
    if not isinstance(asset_id, str) or not re.fullmatch(r"user\.[0-9a-f]{32}", asset_id):
        raise AssetImportError("Identificador de asset inválido.")
    root = Path(library_root) if library_root else DEFAULT_LIBRARY_ROOT
    catalog = _read_catalog(root)
    item = next((entry for entry in catalog["assets"] if isinstance(entry, dict) and entry.get("id") == asset_id), None)
    if item is None:
        raise FileNotFoundError(asset_id)
    stored_name = item.get("stored_name")
    if not isinstance(stored_name, str) or Path(stored_name).name != stored_name:
        raise AssetImportError("Ruta interna de asset inválida.")
    path = root / stored_name
    if path.is_symlink() or not path.is_file() or path.resolve().parent != root.resolve():
        raise FileNotFoundError(asset_id)
    return path.read_bytes(), str(item.get("mime_type", "application/octet-stream"))


_RIG_ANCHORS = {
    "origin", "head", "neck", "shoulder_l", "shoulder_r", "waist", "hip",
    "elbow_l", "elbow_r", "hand_l", "hand_r", "knee_l", "knee_r", "ankle_l", "ankle_r",
}


def _validate_conversion_metadata(value: Any, image_width: int, image_height: int) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, dict):
        raise AssetImportError("Los metadatos de conversión deben ser un objeto.")
    allowed = {
        "schema_version", "algorithm", "normalized", "canvas_width", "canvas_height",
        "source_width", "source_height", "source_sha256", "source_format",
        "background_removed", "background_tolerance", "scale_percent", "offset_x",
        "offset_y", "pose", "rig_category", "content_bounds", "anchors", "anchor_status",
    }
    if set(value) - allowed:
        raise AssetImportError("Los metadatos de conversión contienen campos no reconocidos.")
    if value.get("schema_version") != 1 or value.get("algorithm") != "botimagen-png-stage-v1":
        raise AssetImportError("Versión o algoritmo de conversión no compatible.")
    if value.get("normalized") is not True:
        raise AssetImportError("El recurso debe estar normalizado antes de registrarlo.")
    canvas_width, canvas_height = value.get("canvas_width"), value.get("canvas_height")
    if (canvas_width, canvas_height) != (image_width, image_height) or (canvas_width, canvas_height) != (512, 768):
        raise AssetImportError("El PNG convertido debe coincidir con el lienzo común 512×768.")
    for field in ("source_width", "source_height"):
        number = value.get(field)
        if isinstance(number, bool) or not isinstance(number, int) or not 1 <= number <= MAX_DIMENSION:
            raise AssetImportError(f"Dimensión fuente inválida: {field}.")
    if value["source_width"] * value["source_height"] > MAX_PIXELS:
        raise AssetImportError("Las dimensiones fuente superan 20 megapíxeles.")
    source_hash = value.get("source_sha256")
    if source_hash is not None and (not isinstance(source_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", source_hash)):
        raise AssetImportError("SHA-256 de origen inválido.")
    source_format = value.get("source_format")
    if not isinstance(source_format, str) or source_format not in SUPPORTED_MIME:
        raise AssetImportError("Formato de imagen fuente inválido.")
    if not isinstance(value.get("background_removed"), bool):
        raise AssetImportError("El estado de eliminación de fondo debe ser booleano.")
    tolerance = value.get("background_tolerance")
    if isinstance(tolerance, bool) or not isinstance(tolerance, int) or not 0 <= tolerance <= 100:
        raise AssetImportError("Tolerancia de fondo fuera del rango 0..100.")
    scale = value.get("scale_percent")
    if isinstance(scale, bool) or not isinstance(scale, int) or not 50 <= scale <= 150:
        raise AssetImportError("Escala de material fuera del rango 50..150.")
    for field, lower, upper in (("offset_x", -200, 200), ("offset_y", -240, 240)):
        number = value.get(field)
        if isinstance(number, bool) or not isinstance(number, int) or not lower <= number <= upper:
            raise AssetImportError(f"Desplazamiento de material inválido: {field}.")
    if value.get("pose") not in {"front", "back", "side", "unknown"}:
        raise AssetImportError("Pose o vista de origen inválida.")
    rig_category = value.get("rig_category")
    if not isinstance(rig_category, str) or rig_category not in {
        "body", "head", "face", "eyes", "brows", "mouth", "hair_back", "hair_front",
        "top", "bottom", "footwear", "accessory", "full_character", "reference",
    }:
        raise AssetImportError("Categoría de esqueleto inválida.")
    if value.get("anchor_status") != "estimated_not_validated":
        raise AssetImportError("Los anclajes importados deben permanecer como estimaciones no validadas.")
    bounds = value.get("content_bounds")
    if not isinstance(bounds, dict) or set(bounds) != {"x", "y", "width", "height"}:
        raise AssetImportError("Límites del contenido convertido inválidos.")
    for field in ("x", "y", "width", "height"):
        number = bounds.get(field)
        if isinstance(number, bool) or not isinstance(number, int):
            raise AssetImportError(f"Límite de contenido inválido: {field}.")
    if (
        bounds["x"] < 0 or bounds["y"] < 0 or bounds["width"] < 1 or bounds["height"] < 1
        or bounds["x"] + bounds["width"] > canvas_width
        or bounds["y"] + bounds["height"] > canvas_height
    ):
        raise AssetImportError("Los límites del contenido salen del lienzo 512×768.")
    anchors = value.get("anchors")
    if not isinstance(anchors, dict) or not anchors or len(anchors) > len(_RIG_ANCHORS):
        raise AssetImportError("Los anclajes estimados deben ser un objeto no vacío.")
    clean_anchors: dict[str, dict[str, float]] = {}
    for name, point in anchors.items():
        if name not in _RIG_ANCHORS or not isinstance(point, dict) or set(point) != {"x", "y"}:
            raise AssetImportError(f"Anclaje desconocido o mal formado: {name}.")
        clean_point: dict[str, float] = {}
        for axis in ("x", "y"):
            coordinate = point[axis]
            if isinstance(coordinate, bool) or not isinstance(coordinate, (int, float)) or not 0 <= coordinate <= 1:
                raise AssetImportError(f"Anclaje {name}.{axis} debe estar normalizado entre 0 y 1.")
            clean_point[axis] = round(float(coordinate), 4)
        clean_anchors[name] = clean_point
    return {
        "schema_version": 1, "algorithm": "botimagen-png-stage-v1", "normalized": True,
        "canvas_width": canvas_width, "canvas_height": canvas_height,
        "source_width": value["source_width"], "source_height": value["source_height"],
        **({"source_sha256": source_hash} if source_hash else {}),
        "source_format": source_format, "background_removed": value["background_removed"],
        "background_tolerance": tolerance, "scale_percent": scale,
        "offset_x": value["offset_x"], "offset_y": value["offset_y"],
        "pose": value["pose"], "rig_category": rig_category,
        "content_bounds": dict(bounds), "anchors": clean_anchors,
        "anchor_status": "estimated_not_validated",
    }


def import_user_asset(payload: Any, library_root: Path | None = None) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise AssetImportError("El cuerpo debe ser un objeto JSON.")
    allowed = {"filename", "mime_type", "data_base64", "category", "label", "view", "license", "source_url", "kind", "conversion", "source_asset_id", "source_filename"}
    if set(payload) - allowed:
        raise AssetImportError("Hay campos de importación no reconocidos.")
    filename = _safe_display_name(payload.get("filename"))
    mime = payload.get("mime_type")
    if not isinstance(mime, str) or mime not in SUPPORTED_MIME:
        raise AssetImportError("Formato MIME no admitido. Usa PNG, JPEG o WebP.")
    category = payload.get("category", "reference")
    if not isinstance(category, str) or category not in CATEGORIES:
        raise AssetImportError("Categoría de asset no admitida.")
    label = payload.get("label", Path(filename).stem)
    if not isinstance(label, str) or not label.strip() or len(label.strip()) > 100:
        raise AssetImportError("La etiqueta debe tener entre 1 y 100 caracteres.")
    view = payload.get("view", "unknown")
    if not isinstance(view, str) or view not in {"front", "back", "side", "unknown"}:
        raise AssetImportError("Vista no admitida.")
    encoded = payload.get("data_base64")
    if not isinstance(encoded, str) or len(encoded) > ((MAX_IMAGE_BYTES + 2) // 3) * 4 + 8:
        raise AssetImportError("La imagen supera el límite de 12 MiB.")
    try:
        data = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error) as exc:
        raise AssetImportError("La imagen codificada no es Base64 válido.") from exc
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise AssetImportError("La imagen está vacía o supera el límite de 12 MiB.")
    width, height = _image_dimensions(data, mime)
    if not (1 <= width <= MAX_DIMENSION and 1 <= height <= MAX_DIMENSION):
        raise AssetImportError("Las dimensiones deben ser de hasta 8192 px por lado.")
    if width * height > MAX_PIXELS:
        raise AssetImportError("La imagen supera el límite de 20 megapíxeles.")
    source_url = payload.get("source_url", "")
    license_name = payload.get("license", "UNVERIFIED")
    for field, value in (("source_url", source_url), ("license", license_name)):
        if not isinstance(value, str) or len(value) > 1000:
            raise AssetImportError(f"Metadato {field} no válido.")
    if source_url and not source_url.startswith(("https://", "http://")):
        raise AssetImportError("source_url debe ser una URL HTTP(S) o estar vacío.")
    kind = payload.get("kind", "reference")
    if not isinstance(kind, str) or kind not in {"modular_piece", "full_character", "reference", "portrait"}:
        raise AssetImportError("Tipo de recurso no válido.")
    source_filename = _safe_display_name(payload.get("source_filename", filename))
    source_asset_id = payload.get("source_asset_id")
    if source_asset_id is not None and (
        not isinstance(source_asset_id, str) or not re.fullmatch(r"user\.[0-9a-f]{32}", source_asset_id)
    ):
        raise AssetImportError("El identificador del PNG fuente no es válido.")
    conversion = _validate_conversion_metadata(payload.get("conversion"), width, height)
    root = Path(library_root) if library_root else DEFAULT_LIBRARY_ROOT
    root.mkdir(parents=True, exist_ok=True)
    if root.is_symlink():
        raise AssetImportError("El directorio de biblioteca no puede ser un enlace simbólico.")
    catalog = _read_catalog(root)
    if source_asset_id is not None:
        source_record = next(
            (entry for entry in catalog["assets"] if isinstance(entry, dict) and entry.get("id") == source_asset_id),
            None,
        )
        if source_record is None:
            raise AssetImportError("No se encuentra el PNG original vinculado; impórtalo primero.")
        if source_record.get("kind") not in {"reference", "full_character", "portrait"}:
            raise AssetImportError("El recurso de origen vinculado no es una fuente de imagen.")
        if conversion is not None:
            if conversion.get("source_sha256") and conversion["source_sha256"] != source_record.get("sha256"):
                raise AssetImportError("El SHA-256 del PNG convertido no coincide con su fuente vinculada.")
            if (conversion["source_width"], conversion["source_height"]) != (source_record.get("width"), source_record.get("height")):
                raise AssetImportError("Las dimensiones guardadas no coinciden con el PNG original vinculado.")
    digest = hashlib.sha256(data).hexdigest()
    for existing in catalog["assets"]:
        if (
            isinstance(existing, dict) and existing.get("sha256") == digest
            and existing.get("category") == category and existing.get("kind") == kind
            and existing.get("license") == license_name and existing.get("source_url") == source_url
            and existing.get("conversion") == conversion
        ):
            return {k: v for k, v in existing.items() if k != "stored_name"} | {"duplicate": True}
    asset_id = "user." + uuid.uuid4().hex
    suffix = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}[mime]
    stored_name = asset_id.replace(".", "-") + suffix
    destination = root / stored_name
    temporary = root / (stored_name + ".tmp")
    metadata = {
        "id": asset_id, "label": label.strip(), "category": category, "kind": kind,
        "filename": filename, "source_filename": source_filename, "source_asset_id": source_asset_id,
        "stored_name": stored_name, "mime_type": mime,
        "width": width, "height": height, "bytes": len(data), "sha256": digest,
        "view": view, "anchor": None,
        "layer_order": {"hair_back": 10, "accessory_back": 15, "body": 20, "head": 48,
                        "face": 50, "eyes": 52, "brows": 54, "mouth": 56,
                        "clothing_bottom": 36, "clothing_top": 40, "footwear": 28,
                        "hair_front": 70, "accessory_front": 60}.get(category) if kind == "modular_piece" else None,
        "anchor_estimate": conversion["anchors"] if conversion else {},
        "anchors_validated": False,
        "anchor_status": "estimated_not_validated" if conversion else "not_applicable",
        "conversion": conversion,
        "source_url": source_url, "license": license_name,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "compatibility": [], "color_options": [],
        "note": (
            "PNG normalizado 512×768; anclajes estimados pendientes de revisión."
            if conversion and kind == "modular_piece"
            else "Personaje completo normalizado 512×768; conserva su pose original."
            if conversion and kind in {"full_character", "portrait"}
            else "Referencia no modular."
            if kind != "modular_piece"
            else "Pieza candidata; anclajes pendientes de validación."
        ),
    }
    try:
        with temporary.open("xb") as handle:
            handle.write(data)
        temporary.replace(destination)
        catalog["assets"].append(metadata)
        catalog_tmp = root / "catalog.json.tmp"
        with catalog_tmp.open("x", encoding="utf-8") as handle:
            json.dump(catalog, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        catalog_tmp.replace(root / "catalog.json")
    except Exception:
        for candidate in (temporary, destination, root / "catalog.json.tmp"):
            try:
                candidate.unlink()
            except OSError:
                pass
        raise
    return {k: v for k, v in metadata.items() if k != "stored_name"} | {"duplicate": False}
