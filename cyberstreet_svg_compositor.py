"""Secure composition of the repository-owned CyberStreet SVG starter pack."""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
PACK_ROOT = ROOT / "assets" / "modular" / "oc-cyberstreet"
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)


class CyberStreetError(ValueError):
    """Invalid manifest or unavailable packaged SVG resource."""


def _load_manifest() -> dict[str, Any]:
    try:
        value = json.loads((PACK_ROOT / "manifest.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CyberStreetError("No se pudo leer el manifiesto CyberStreet.") from exc
    if not isinstance(value, dict) or value.get("schema_version") != 1:
        raise CyberStreetError("Versión del manifiesto CyberStreet no compatible.")
    view = value.get("view")
    if not isinstance(view, dict) or view.get("width") != 512 or view.get("height") != 768:
        raise CyberStreetError("El manifiesto debe declarar el lienzo 512×768.")
    layers = value.get("layers")
    if not isinstance(layers, list) or not layers:
        raise CyberStreetError("El manifiesto no contiene capas.")
    ids: set[str] = set()
    for layer in layers:
        if not isinstance(layer, dict):
            raise CyberStreetError("Capa del manifiesto inválida.")
        layer_id, rel = layer.get("id"), layer.get("path")
        if not isinstance(layer_id, str) or not re.fullmatch(r"[a-z0-9-]{1,80}", layer_id) or layer_id in ids:
            raise CyberStreetError("ID de capa inválido o duplicado.")
        if not isinstance(rel, str) or not rel or "\\" in rel:
            raise CyberStreetError("Ruta SVG inválida.")
        relative = Path(rel)
        if relative.is_absolute() or ".." in relative.parts or len(relative.parts) != 1 or relative.suffix.lower() != ".svg":
            raise CyberStreetError("La ruta de una capa debe ser un SVG local directo.")
        target = (PACK_ROOT / relative).resolve()
        if target.parent != PACK_ROOT.resolve() or not target.is_file():
            raise CyberStreetError(f"Falta el recurso SVG de la capa {layer_id}.")
        try:
            root = ET.parse(target).getroot()
        except (ET.ParseError, OSError) as exc:
            raise CyberStreetError(f"SVG inválido en la capa {layer_id}.") from exc
        if root.tag not in {f"{{{SVG_NS}}}svg", "svg"}:
            raise CyberStreetError(f"El recurso {layer_id} no tiene raíz SVG.")
        if root.attrib.get("viewBox") not in {"0 0 512 768", "0,0,512,768"}:
            raise CyberStreetError(f"El recurso {layer_id} no comparte el lienzo 512×768.")
        ids.add(layer_id)
    if "base-body" not in ids:
        raise CyberStreetError("El paquete requiere la capa base-body.")
    return value


def get_cyberstreet_manifest() -> dict[str, Any]:
    manifest = _load_manifest()
    labels = {
        "base-body": "Cuerpo base",
        "face-anime-cyan": "Rostro anime",
        "sneakers-neon": "Zapatillas neón",
        "skirt-tech-pleated": "Falda tecnológica",
        "top-neon-jacket": "Chaqueta neón",
        "hair-midnight-cyan": "Cabello cyan",
    }
    return {
        "schema_version": 1,
        "pack_id": manifest["pack_id"],
        "title": manifest["title"],
        "width": manifest["view"]["width"],
        "height": manifest["view"]["height"],
        "layers": [
            {"id": layer["id"], "label": labels.get(layer["id"], layer["id"].replace("-", " ").title()),
             "role": layer.get("role", "detail"), "z": layer.get("z", 0),
             "editable": bool(layer.get("editable", False)),
             "enabled_by_default": True}
            for layer in sorted(manifest["layers"], key=lambda item: (item.get("z", 0), item["id"]))
        ],
    }


def get_cyberstreet_layer_png_source(layer_id: str) -> dict[str, Any]:
    """Return one repository-owned SVG layer for explicit local rasterization into a transparent PNG."""
    manifest = _load_manifest()
    if not isinstance(layer_id, str) or not re.fullmatch(r"[a-z0-9-]{1,80}", layer_id):
        raise CyberStreetError("ID de capa CyberStreet inválido.")
    layer = next((item for item in manifest["layers"] if item["id"] == layer_id), None)
    if layer is None:
        raise CyberStreetError(f"No existe una capa CyberStreet llamada {layer_id!r}.")

    categories = {
        "base-body": ("body", "body", 20),
        "face-anime-cyan": ("face", "face", 50),
        "skirt-tech-pleated": ("clothing_bottom", "bottom", 36),
        "sneakers-neon": ("footwear", "footwear", 28),
        "top-neon-jacket": ("clothing_top", "top", 40),
        "hair-midnight-cyan": ("hair_front", "hair_front", 70),
    }
    if layer_id not in categories:
        raise CyberStreetError(f"La capa {layer_id!r} no tiene categoría modular aprobada para PNG.")
    category, rig_category, layer_order = categories[layer_id]
    target = (PACK_ROOT / layer["path"]).resolve()
    if target.parent != PACK_ROOT.resolve() or not target.is_file():
        raise CyberStreetError(f"No se puede leer la capa CyberStreet {layer_id!r}.")
    try:
        svg_text = target.read_text(encoding="utf-8")
        svg_root = ET.fromstring(svg_text)
    except (OSError, ET.ParseError) as exc:
        raise CyberStreetError(f"SVG inválido en la capa {layer_id!r}.") from exc
    if svg_root.tag not in {f"{{{SVG_NS}}}svg", "svg"}:
        raise CyberStreetError(f"La capa {layer_id!r} no tiene raíz SVG.")
    if svg_root.attrib.get("viewBox") not in {"0 0 512 768", "0,0,512,768"}:
        raise CyberStreetError(f"La capa {layer_id!r} no comparte el lienzo 512×768.")

    # These anchors describe the common authored canvas. They are estimates until the
    # user inspects the PNG stage and explicitly confirms the points in the UI.
    anchors = {
        "origin": {"x": 0.5, "y": 0.5},
        "head": {"x": 0.5, "y": 145 / 768},
        "neck": {"x": 0.5, "y": 184 / 768},
        "shoulder_l": {"x": 184 / 512, "y": 205 / 768},
        "shoulder_r": {"x": 328 / 512, "y": 205 / 768},
        "waist": {"x": 0.5, "y": 347 / 768},
        "hip": {"x": 0.5, "y": 421 / 768},
        "ankle_l": {"x": 208 / 512, "y": 678 / 768},
        "ankle_r": {"x": 312 / 512, "y": 678 / 768},
    }
    labels = {
        "base-body": "Cuerpo base",
        "face-anime-cyan": "Rostro anime",
        "skirt-tech-pleated": "Falda tecnológica",
        "sneakers-neon": "Zapatillas neón",
        "top-neon-jacket": "Chaqueta neón",
        "hair-midnight-cyan": "Cabello cyan",
    }
    relative_path = f"assets/modular/oc-cyberstreet/{layer['path']}"
    return {
        "schema_version": 1,
        "pack_id": manifest["pack_id"],
        "id": layer_id,
        "label": labels[layer_id],
        "category": category,
        "rig_category": rig_category,
        "layer_order": layer_order,
        "width": 512,
        "height": 768,
        "view": "front",
        "license": manifest["license"],
        "source_url": manifest["source_url"],
        "source_filename": relative_path,
        "author": manifest["author"],
        "anchors": anchors,
        "svg": svg_text,
    }


def compose_cyberstreet_svg(enabled: dict[str, bool] | None = None) -> str:
    manifest = _load_manifest()
    requested = enabled or {}
    valid_ids = {layer["id"] for layer in manifest["layers"]}
    unknown = set(requested) - valid_ids
    if unknown:
        raise CyberStreetError("IDs de capa desconocidos: " + ", ".join(sorted(unknown)))
    if requested.get("base-body", True) is not True:
        raise CyberStreetError("La capa de cuerpo base es obligatoria.")
    width, height = manifest["view"]["width"], manifest["view"]["height"]
    canvas = ET.Element(f"{{{SVG_NS}}}svg", {
        "width": str(width), "height": str(height), "viewBox": f"0 0 {width} {height}",
        "role": "img", "aria-label": "Personaje modular CyberStreet",
    })
    for layer in sorted(manifest["layers"], key=lambda item: (item.get("z", 0), item["id"])):
        layer_id = layer["id"]
        if requested.get(layer_id, True) is False:
            continue
        relative = Path(layer["path"])
        target = (PACK_ROOT / relative).resolve()
        if target.parent != PACK_ROOT.resolve():
            raise CyberStreetError("La ruta de capa sale del paquete permitido.")
        try:
            source = ET.parse(target).getroot()
        except (OSError, ET.ParseError) as exc:
            raise CyberStreetError(f"No se pudo cargar la capa {layer_id}.") from exc
        group = ET.SubElement(canvas, f"{{{SVG_NS}}}g", {"id": f"layer-{layer_id}", "data-layer-id": layer_id})
        for child in list(source):
            group.append(child)
    return ET.tostring(canvas, encoding="unicode", xml_declaration=False)
