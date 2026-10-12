from __future__ import annotations
from io import BytesIO
from typing import Any
import warnings
from PIL import Image, UnidentifiedImageError

ANALYZER_VERSION = "bimg-pixel-metrics/1.0.0"
MAX_INPUT_BYTES = 12 * 1024 * 1024
MAX_WIDTH = 8192
MAX_HEIGHT = 8192
MAX_PIXELS = 20_000_000
SUPPORTED_FORMATS = {"PNG", "JPEG", "WEBP"}
MIME_FORMATS = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}

class ImageAnalysisError(ValueError):
    def __init__(self, code: str, message: str, status: int = 422):
        super().__init__(message)
        self.code, self.status = code, status

def _unsupported(reason: str = "La métrica requiere un canal alfa medible.") -> dict[str, Any]:
    return {"status": "NOT_SUPPORTED", "reason": reason}

def analyze_image(data: bytes, declared_mime: str | None = None) -> dict[str, Any]:
    """Measure file metadata and alpha geometry only; never infer image semantics."""
    if not isinstance(data, bytes) or not data:
        raise ImageAnalysisError("EMPTY_BODY", "El archivo de imagen está vacío.", 400)
    if len(data) > MAX_INPUT_BYTES:
        raise ImageAnalysisError("FILE_TOO_LARGE", "La imagen supera el límite de 12 MiB.", 413)
    mime = (declared_mime or "").split(";", 1)[0].strip().lower()
    if declared_mime is not None and mime not in MIME_FORMATS:
        raise ImageAnalysisError("UNSUPPORTED_MEDIA_TYPE", "Usa Content-Type image/png, image/jpeg o image/webp.", 415)
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(data)) as probe:
                actual_format = (probe.format or "").upper()
                width, height = probe.size
                if actual_format not in SUPPORTED_FORMATS:
                    raise ImageAnalysisError("UNSUPPORTED_FORMAT", "Formato real no admitido; se aceptan PNG, JPEG y WebP.", 415)
                if mime and MIME_FORMATS[mime] != actual_format:
                    raise ImageAnalysisError("MIME_MISMATCH", "El Content-Type declarado no coincide con el formato real.", 415)
                if width < 1 or height < 1:
                    raise ImageAnalysisError("INVALID_DIMENSIONS", "Dimensiones inválidas.")
                if width > MAX_WIDTH or height > MAX_HEIGHT or width * height > MAX_PIXELS:
                    raise ImageAnalysisError("DIMENSIONS_TOO_LARGE", f"Dimensiones fuera de límites: máximo {MAX_WIDTH}x{MAX_HEIGHT} y {MAX_PIXELS} píxeles.", 413)
                probe.verify()
            with Image.open(BytesIO(data)) as image:
                image.load()
                width, height = image.size
                has_alpha = "A" in image.getbands() or "transparency" in image.info
                total = width * height
                result: dict[str, Any] = {
                    "schema_version": 1, "status": "COMPLETE",
                    "analyzer": {"id": ANALYZER_VERSION, "method": "pillow-pixel-inspection"},
                    "input": {"format": actual_format, "mime_type": mime or None, "byte_size": len(data),
                              "width": width, "height": height, "aspect_ratio": round(width / height, 8)},
                    "measurements": {"transparency": _unsupported(), "visible_bbox": _unsupported(),
                                     "canvas_occupancy": _unsupported(), "touches_canvas_edges": _unsupported()},
                    "warnings": [],
                    "limitations": [
                        "No detecta personas, anatomía, articulaciones, prendas ni semántica.",
                        "No evalúa calidad artística ni infiere una pose.",
                        "Las mediciones de ocupación solo describen píxeles con alfa mayor que cero."
                    ]
                }
                if not has_alpha:
                    result["warnings"].append("NO_ALPHA_CHANNEL: la imagen no contiene transparencia medible.")
                    return result
                alpha = image.convert("RGBA").getchannel("A")
                histogram = alpha.histogram()
                transparent, translucent, opaque = histogram[0], sum(histogram[1:255]), histogram[255]
                bbox = alpha.point(lambda value: 255 if value > 0 else 0).getbbox()
                result["measurements"]["transparency"] = {
                    "status": "MEASURED", "method": "alpha-channel histogram",
                    "transparent_pixels": transparent, "translucent_pixels": translucent, "opaque_pixels": opaque,
                    "transparent_percent": round(transparent * 100 / total, 4),
                    "translucent_percent": round(translucent * 100 / total, 4),
                    "opaque_percent": round(opaque * 100 / total, 4)}
                if bbox is None:
                    result["status"] = "EMPTY_CONTENT"
                    result["measurements"]["visible_bbox"] = {"status": "MEASURED", "method": "bounding box of alpha > 0", "value": None}
                    result["measurements"]["canvas_occupancy"] = {"status": "MEASURED", "method": "visible bounding-box area / canvas area", "value_percent": 0.0}
                    result["measurements"]["touches_canvas_edges"] = {"status": "MEASURED", "method": "visible bounding box compared with canvas edges", "left": False, "top": False, "right": False, "bottom": False}
                    result["warnings"].append("NO_VISIBLE_PIXELS: el canal alfa es cero en todo el lienzo.")
                    return result
                left, top, right, bottom = bbox
                box_width, box_height = right - left, bottom - top
                result["measurements"]["visible_bbox"] = {
                    "status": "MEASURED", "method": "bounding box of alpha > 0; right and bottom are exclusive",
                    "value": {"left": left, "top": top, "right": right, "bottom": bottom,
                              "width": box_width, "height": box_height}}
                result["measurements"]["canvas_occupancy"] = {
                    "status": "MEASURED", "method": "visible bounding-box area / canvas area; not a semantic subject mask",
                    "value_percent": round(box_width * box_height * 100 / total, 4)}
                result["measurements"]["touches_canvas_edges"] = {
                    "status": "MEASURED", "method": "visible bounding box compared with canvas edges",
                    "left": left == 0, "top": top == 0, "right": right == width, "bottom": bottom == height}
                return result
    except ImageAnalysisError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise ImageAnalysisError("INVALID_IMAGE", "El archivo está corrupto o no es una imagen compatible.") from exc
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise ImageAnalysisError("IMAGE_RESOURCE_LIMIT", "La imagen excede los límites seguros de decodificación.", 413) from exc
