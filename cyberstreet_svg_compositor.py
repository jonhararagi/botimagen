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
    return {
        "schema_version": 1,
        "pack_id": manifest["pack_id"],
        "title": manifest["title"],
        "width": manifest["view"]["width"],
        "height": manifest["view"]["height"],
        "layers": [
            {"id": layer["id"], "label": layer["id"].replace("-", " ").title(),
             "role": layer.get("role", "detail"), "z": layer.get("z", 0),
             "editable": bool(layer.get("editable", False)),
             "enabled_by_default": True}
            for layer in sorted(manifest["layers"], key=lambda item: (item.get("z", 0), item["id"]))
        ],
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
