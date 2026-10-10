from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
from typing import Any
from urllib.parse import urlsplit

from character_generator import CharacterGenerator, TRAIT_KEYS

ROOT = Path(__file__).resolve().parent
ASSET_MANIFEST_PATH = ROOT / "assets_manifest.json"
MAX_BODY_BYTES = 64 * 1024
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8765


class ApiInputError(ValueError):
    def __init__(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status = status


def _public_catalog_option(entry: dict[str, Any]) -> dict[str, Any]:
    option: dict[str, Any] = {
        "id": entry["id"],
        "label": entry["label"],
        "tags": list(entry.get("tags", [])),
    }
    color_family = entry.get("color_family")
    if isinstance(color_family, str):
        option["color_family"] = color_family

    compatible_with = entry.get("compatible_with")
    if isinstance(compatible_with, dict):
        constraints = {
            category: list(values)
            for category, values in compatible_with.items()
            if isinstance(category, str)
            and isinstance(values, list)
            and all(isinstance(value, str) for value in values)
        }
        if constraints:
            option["compatible_with"] = constraints
    return option


def make_catalog(generator: CharacterGenerator) -> dict[str, Any]:
    categories = {
        key: [_public_catalog_option(entry) for entry in entries]
        for key, entries in generator.categories.items()
    }
    return {
        "schema_version": 1,
        "catalog_version": generator.rules.get("version", 1),
        "style": {
            "id": generator.visual_standard["id"],
            "name": generator.visual_standard["name"],
            "version": generator.visual_standard.get("version", 1),
        },
        "categories": categories,
        "trait_labels": TRAIT_KEYS,
        "auto_value": "auto",
    }


def validate_generation_payload(payload: Any, generator: CharacterGenerator) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ApiInputError("El cuerpo JSON debe ser un objeto.")
    allowed = {"selections", "seed", "coherence", "surprise"}
    extra = set(payload) - allowed
    if extra:
        raise ApiInputError("Campos no reconocidos: " + ", ".join(sorted(map(str, extra))) + ".")

    selections = payload.get("selections", {})
    if not isinstance(selections, dict):
        raise ApiInputError("'selections' debe ser un objeto.")
    if len(selections) > len(generator.categories):
        raise ApiInputError("Demasiados rasgos en una sola solicitud.")

    clean: dict[str, str] = {}
    for category, value in selections.items():
        if not isinstance(category, str) or category not in generator.categories:
            raise ApiInputError(f"Categoría no disponible: {category!r}.")
        if not isinstance(value, str):
            raise ApiInputError(f"El valor de {category} debe ser un identificador del catálogo.")
        if value == "auto":
            clean[category] = value
            continue
        ids = {
            str(item.get("id"))
            for item in generator.categories.get(category, [])
            if isinstance(item, dict) and item.get("id") is not None
        }
        if value not in ids:
            raise ApiInputError(f"Opción no disponible para {category}: {value!r}.")
        clean[category] = value

    seed = payload.get("seed")
    if seed is not None:
        if isinstance(seed, bool) or not isinstance(seed, int) or not -(2**53 - 1) <= seed <= (2**53 - 1):
            raise ApiInputError("'seed' debe ser un entero seguro o null.")

    coherence = payload.get("coherence", 0.82)
    if isinstance(coherence, bool) or not isinstance(coherence, (float, int)) or not 0 <= float(coherence) <= 1:
        raise ApiInputError("'coherence' debe ser un número entre 0 y 1.")

    surprise = payload.get("surprise", False)
    if not isinstance(surprise, bool):
        raise ApiInputError("'surprise' debe ser booleano.")

    return {"selections": clean, "seed": seed, "coherence": float(coherence), "surprise": surprise}


def generate_from_payload(payload: Any, generator: CharacterGenerator) -> dict[str, Any]:
    args = validate_generation_payload(payload, generator)
    try:
        return generator.generate(
            selections=args["selections"],
            seed=args["seed"],
            coherence=args["coherence"],
            surprise=args["surprise"],
        )
    except ValueError as exc:
        raise ApiInputError(str(exc)) from exc


def _profile_summary(record: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": record["id"],
        "name": record["name"],
        "saved_at": record["saved_at"],
        "style_id": record.get("style_id", ""),
        "seed": record.get("seed"),
    }


def make_asset_contract_catalog(manifest_path: Path | None = None) -> dict[str, Any]:
    """Expose stable public fields from the canonical asset manifest."""
    path = Path(manifest_path) if manifest_path else ASSET_MANIFEST_PATH
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError("No se pudo leer el manifiesto local de assets.") from exc

    if not isinstance(manifest, dict) or manifest.get("version") != 1:
        raise ValueError("La versión del manifiesto de assets no es compatible.")
    assets = manifest.get("assets")
    if not isinstance(assets, list):
        raise ValueError("El manifiesto de assets debe contener una lista.")

    contracts: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_destinations: set[str] = set()
    text_fields = ("id", "title", "description", "prompt", "negative_prompt", "prompt_version")

    for asset in assets:
        if not isinstance(asset, dict):
            raise ValueError("Cada contrato de asset debe ser un objeto.")
        contract: dict[str, Any] = {}
        for key in text_fields:
            value = asset.get(key)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Campo '{key}' inválido en contrato de asset.")
            contract[key] = value

        asset_id = contract["id"]
        destination = asset.get("destination")
        expected = asset.get("expected")
        if asset_id in seen_ids:
            raise ValueError(f"ID de asset duplicado: {asset_id}.")
        if not isinstance(destination, str) or not destination or "\\" in destination:
            raise ValueError(f"Destino de asset inválido: {asset_id}.")

        relative_destination = PurePosixPath(destination)
        normalized_destination = relative_destination.as_posix()
        if relative_destination.is_absolute() or ".." in relative_destination.parts:
            raise ValueError(f"Destino de asset fuera de la raíz permitida: {asset_id}.")
        if relative_destination.suffix.lower() != ".png" or not relative_destination.parts:
            raise ValueError(f"El destino debe ser un PNG relativo: {asset_id}.")
        if normalized_destination in seen_destinations:
            raise ValueError(f"Destino de asset duplicado: {normalized_destination}.")
        if not isinstance(expected, dict) or str(expected.get("format", "PNG")).upper() != "PNG":
            raise ValueError(f"Contrato PNG esperado inválido: {asset_id}.")

        safe_expected: dict[str, Any] = {"format": "PNG"}
        for key in ("width", "height", "max_bytes"):
            value = expected.get(key)
            if value is not None:
                if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
                    raise ValueError(f"Campo '{key}' inválido: {asset_id}.")
                safe_expected[key] = value
        if ("width" in safe_expected) != ("height" in safe_expected):
            raise ValueError(f"Ancho y alto deben declararse juntos: {asset_id}.")

        contract["destination"] = normalized_destination
        contract["expected"] = safe_expected
        seen_ids.add(asset_id)
        seen_destinations.add(normalized_destination)
        contracts.append(contract)

    return {"manifest_version": manifest["version"], "count": len(contracts), "contracts": contracts}



PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MAX_PNG_PIXELS = 16_000_000
MAX_PNG_DECODED_BYTES = 128 * 1024 * 1024


def validate_png_bytes(data: bytes, expected: dict[str, Any]) -> tuple[int, int]:
    """Validate PNG chunk structure and bounded non-interlaced scanline stream.

    This is not a full pixel decoder: it checks container rules, CRCs, zlib output
    length and row filter bytes. Interlaced PNGs are deliberately unsupported.
    """
    import binascii
    import struct
    import zlib

    if not isinstance(data, bytes) or len(data) < 33 or not data.startswith(PNG_SIGNATURE):
        raise ApiInputError("El archivo no contiene una firma PNG válida.", HTTPStatus.UNPROCESSABLE_ENTITY)

    offset = len(PNG_SIGNATURE)
    width = height = bit_depth = color_type = interlace = None
    seen_ihdr = seen_plte = seen_iend = seen_idat = idat_closed = False
    compressed_parts: list[bytes] = []
    valid_depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
    known_critical = {b"IHDR", b"PLTE", b"IDAT", b"IEND"}

    while offset + 12 <= len(data):
        length = struct.unpack(">I", data[offset:offset + 4])[0]
        chunk_type = data[offset + 4:offset + 8]
        end = offset + 12 + length
        if length > len(data) or end > len(data):
            raise ApiInputError("El PNG está truncado o contiene un bloque inválido.", HTTPStatus.UNPROCESSABLE_ENTITY)
        if any(not (65 <= byte <= 90 or 97 <= byte <= 122) for byte in chunk_type) or not (65 <= chunk_type[2] <= 90):
            raise ApiInputError("El PNG contiene un tipo de bloque inválido.", HTTPStatus.UNPROCESSABLE_ENTITY)

        chunk_data = data[offset + 8:offset + 8 + length]
        supplied_crc = struct.unpack(">I", data[offset + 8 + length:end])[0]
        if (binascii.crc32(chunk_type + chunk_data) & 0xFFFFFFFF) != supplied_crc:
            raise ApiInputError("El PNG contiene un bloque dañado (CRC incorrecto).", HTTPStatus.UNPROCESSABLE_ENTITY)

        if not seen_ihdr:
            if chunk_type != b"IHDR" or length != 13:
                raise ApiInputError("El PNG no comienza con un encabezado IHDR válido.", HTTPStatus.UNPROCESSABLE_ENTITY)
            width, height, bit_depth, color_type, compression, filtering, interlace = struct.unpack(">IIBBBBB", chunk_data)
            if not width or not height or width * height > MAX_PNG_PIXELS:
                raise ApiInputError("Las dimensiones PNG son inválidas o exceden el límite de píxeles.", HTTPStatus.UNPROCESSABLE_ENTITY)
            if color_type not in valid_depths or bit_depth not in valid_depths[color_type] or compression != 0 or filtering != 0:
                raise ApiInputError("El PNG usa parámetros de codificación no válidos.", HTTPStatus.UNPROCESSABLE_ENTITY)
            if interlace != 0:
                raise ApiInputError("Los PNG entrelazados no son compatibles; exporta como PNG no entrelazado.", HTTPStatus.UNPROCESSABLE_ENTITY)
            if expected.get("width") is not None and (width != expected["width"] or height != expected["height"]):
                raise ApiInputError(f"Dimensiones incompatibles: el contrato requiere {expected['width']}×{expected['height']} píxeles.", HTTPStatus.UNPROCESSABLE_ENTITY)
            seen_ihdr = True
        elif chunk_type == b"IHDR":
            raise ApiInputError("El PNG contiene un IHDR duplicado.", HTTPStatus.UNPROCESSABLE_ENTITY)

        if chunk_type not in known_critical and 65 <= chunk_type[0] <= 90:
            raise ApiInputError("El PNG contiene un bloque crítico desconocido.", HTTPStatus.UNPROCESSABLE_ENTITY)

        if chunk_type == b"PLTE":
            if seen_plte or seen_idat or length == 0 or length > 768 or length % 3 != 0:
                raise ApiInputError("La paleta PLTE del PNG está duplicada, mal formada o fuera de posición.", HTTPStatus.UNPROCESSABLE_ENTITY)
            if color_type in (0, 4):
                raise ApiInputError("PLTE no está permitido para este tipo de color PNG.", HTTPStatus.UNPROCESSABLE_ENTITY)
            entries = length // 3
            if color_type == 3 and entries > (1 << bit_depth):
                raise ApiInputError("La paleta PLTE excede los colores permitidos por la profundidad de bits.", HTTPStatus.UNPROCESSABLE_ENTITY)
            seen_plte = True

        if chunk_type == b"IDAT":
            if idat_closed or seen_iend:
                raise ApiInputError("La secuencia IDAT del PNG no es válida.", HTTPStatus.UNPROCESSABLE_ENTITY)
            if color_type == 3 and not seen_plte:
                raise ApiInputError("El PNG indexado requiere PLTE antes de IDAT.", HTTPStatus.UNPROCESSABLE_ENTITY)
            seen_idat = True
            compressed_parts.append(chunk_data)
        elif seen_idat and chunk_type != b"IEND":
            idat_closed = True

        if chunk_type == b"IEND":
            if length != 0 or seen_iend or not seen_idat:
                raise ApiInputError("El PNG no contiene un IEND válido.", HTTPStatus.UNPROCESSABLE_ENTITY)
            seen_iend = True
            offset = end
            break
        offset = end

    if not seen_ihdr or not seen_idat or not seen_iend or offset != len(data):
        raise ApiInputError("El PNG está incompleto o contiene datos sobrantes.", HTTPStatus.UNPROCESSABLE_ENTITY)
    if color_type == 3 and not seen_plte:
        raise ApiInputError("El PNG indexado requiere una paleta PLTE.", HTTPStatus.UNPROCESSABLE_ENTITY)

    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color_type]
    row_bytes = (width * channels * bit_depth + 7) // 8
    decoded_size = (row_bytes + 1) * height
    if decoded_size > MAX_PNG_DECODED_BYTES:
        raise ApiInputError("La imagen excede el límite de decodificación.", HTTPStatus.UNPROCESSABLE_ENTITY)
    decoder = zlib.decompressobj()
    try:
        decoded = decoder.decompress(b"".join(compressed_parts), decoded_size + 1)
        if len(decoded) != decoded_size or not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
            raise ApiInputError("Los píxeles del PNG están truncados o corruptos.", HTTPStatus.UNPROCESSABLE_ENTITY)
    except zlib.error as exc:
        raise ApiInputError("No se pudo decodificar el contenido PNG.", HTTPStatus.UNPROCESSABLE_ENTITY) from exc
    stride = row_bytes + 1
    if any(decoded[row * stride] > 4 for row in range(height)):
        raise ApiInputError("El PNG contiene un filtro de fila inválido.", HTTPStatus.UNPROCESSABLE_ENTITY)
    return width, height

def _safe_asset_destination(root: Path, relative_destination: str) -> Path:
    """Resolve only a manifest-relative path and refuse symlink components."""
    parts = PurePosixPath(relative_destination).parts
    if not parts or PurePosixPath(relative_destination).is_absolute() or any(part in {"", ".", ".."} for part in parts):
        raise ApiInputError("El destino del contrato no es seguro.", HTTPStatus.INTERNAL_SERVER_ERROR)
    root.mkdir(parents=True, exist_ok=True)
    root = root.resolve()
    current = root
    for part in parts[:-1]:
        current = current / part
        if current.exists() and current.is_symlink():
            raise ApiInputError("El directorio de destino contiene un enlace no permitido.", HTTPStatus.CONFLICT)
        current.mkdir(exist_ok=True)
        if current.is_symlink() or not current.resolve().is_relative_to(root):
            raise ApiInputError("El destino del contrato sale del directorio autorizado.", HTTPStatus.CONFLICT)
    destination = current / parts[-1]
    if destination.is_symlink():
        raise ApiInputError("El destino ya existe como enlace; no se modificó.", HTTPStatus.CONFLICT)
    if not destination.resolve(strict=False).is_relative_to(root):
        raise ApiInputError("El destino del contrato sale del directorio autorizado.", HTTPStatus.CONFLICT)
    return destination


def make_handler(generator: CharacterGenerator, profiles_path: Path | None = None, assets_root: Path | None = None, asset_manifest_path: Path | None = None):
    catalog = make_catalog(generator)
    asset_contract_catalog = make_asset_contract_catalog(asset_manifest_path)
    asset_root = Path(assets_root) if assets_root else ROOT
    profile_root = Path(profiles_path) if profiles_path else ROOT / "generated_characters" / "web_profiles"

    class BotImagenHandler(BaseHTTPRequestHandler):
        server_version = "BotImagenLocal/0.2"
        sys_version = ""

        def _send_json(
            self,
            status: HTTPStatus,
            payload: dict[str, Any],
            extra_headers: dict[str, str] | None = None,
        ) -> None:
            raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
            self.send_response(status.value)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            for name, value in (extra_headers or {}).items():
                self.send_header(name, value)
            self.end_headers()
            self.wfile.write(raw)

        def _read_json(self) -> Any:
            header = self.headers.get("Content-Length")
            try:
                length = int(header or "")
            except ValueError as exc:
                raise ApiInputError("Se requiere Content-Length válido.", HTTPStatus.LENGTH_REQUIRED) from exc
            if length < 0:
                raise ApiInputError("Longitud de solicitud inválida.")
            if length > MAX_BODY_BYTES:
                raise ApiInputError("El JSON supera el límite de 64 KiB.", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            if "application/json" not in self.headers.get("Content-Type", "").lower():
                raise ApiInputError("Usa Content-Type: application/json.", HTTPStatus.UNSUPPORTED_MEDIA_TYPE)
            try:
                raw = self.rfile.read(length).decode("utf-8")
                return json.loads(raw)
            except UnicodeDecodeError as exc:
                raise ApiInputError("El cuerpo debe estar codificado en UTF-8.") from exc
            except json.JSONDecodeError as exc:
                raise ApiInputError("JSON inválido.") from exc

        def _method_not_allowed(self) -> None:
            path = urlsplit(self.path).path
            allowed_by_path = {
                "/api/health": ("GET",),
                "/api/catalog": ("GET",),
                "/api/assets/contracts": ("GET",),
                "/api/assets/import": ("POST",),
                "/api/profiles": ("GET", "POST"),
                "/api/generate": ("POST",),
            }
            allowed = allowed_by_path.get(path)
            if allowed is None:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint no encontrado."})
                return
            self._send_json(
                HTTPStatus.METHOD_NOT_ALLOWED,
                {"error": "Método HTTP no permitido para este endpoint."},
                {"Allow": ", ".join(allowed)},
            )

        def do_PUT(self) -> None:
            self._method_not_allowed()

        def do_PATCH(self) -> None:
            self._method_not_allowed()

        def do_DELETE(self) -> None:
            self._method_not_allowed()

        def do_OPTIONS(self) -> None:
            self._method_not_allowed()

        def do_GET(self) -> None:
            path = urlsplit(self.path).path
            if path == "/api/health":
                self._send_json(HTTPStatus.OK, {"status": "ok", "service": "botimagen-local", "schema_version": 1})
                return
            if path == "/api/catalog":
                self._send_json(HTTPStatus.OK, catalog)
                return
            if path == "/api/assets/contracts":
                self._send_json(HTTPStatus.OK, asset_contract_catalog)
                return
            if path == "/api/assets/import":
                self._method_not_allowed()
                return
            if path == "/api/profiles":
                self._list_profiles()
                return
            if path.startswith("/api/profiles/"):
                self._get_profile(path.removeprefix("/api/profiles/"))
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint no encontrado."})

        def _list_profiles(self) -> None:
            if not profile_root.exists():
                self._send_json(HTTPStatus.OK, {"profiles": []})
                return
            profiles = []
            for path in profile_root.glob("profile-*.json"):
                try:
                    record = json.loads(path.read_text(encoding="utf-8"))
                    if isinstance(record, dict) and isinstance(record.get("id"), str) and isinstance(record.get("profile"), dict):
                        profiles.append(_profile_summary(record))
                except (OSError, json.JSONDecodeError, KeyError):
                    continue
            profiles.sort(key=lambda item: item["saved_at"], reverse=True)
            self._send_json(HTTPStatus.OK, {"profiles": profiles[:500]})

        def _get_profile(self, profile_id: str) -> None:
            try:
                parsed = uuid.UUID(profile_id)
            except (ValueError, AttributeError):
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Identificador de perfil inválido."})
                return
            if str(parsed) != profile_id.lower():
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Identificador de perfil inválido."})
                return
            path = profile_root / ("profile-" + str(parsed) + ".json")
            try:
                record = json.loads(path.read_text(encoding="utf-8"))
            except FileNotFoundError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Perfil no encontrado."})
                return
            except (OSError, json.JSONDecodeError):
                self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "No se pudo leer el perfil local."})
                return
            self._send_json(HTTPStatus.OK, record)

        def do_POST(self) -> None:
            path = urlsplit(self.path).path
            if path == "/api/assets/contracts":
                self._method_not_allowed()
                return
            if path == "/api/assets/import":
                self._import_asset()
                return
            if path not in {"/api/generate", "/api/profiles"}:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint no encontrado."})
                return
            try:
                payload = self._read_json()
                if path == "/api/generate":
                    result = generate_from_payload(payload, generator)
                    self._send_json(HTTPStatus.OK, result)
                    return
                record = self._save_profile(payload)
                self._send_json(HTTPStatus.CREATED, _profile_summary(record))
            except ApiInputError as exc:
                self._send_json(exc.status, {"error": str(exc)})
            except OSError:
                self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "No se pudo guardar el perfil en el disco local."})
            except Exception:
                self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "El motor local no pudo completar la solicitud."})


        def _import_asset(self) -> None:
            import tempfile
            from urllib.parse import parse_qs
            parsed = urlsplit(self.path)
            try:
                query = parse_qs(parsed.query, keep_blank_values=True, strict_parsing=True)
            except ValueError:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Parámetros de importación inválidos."})
                return
            if set(query) != {"asset_id"} or len(query["asset_id"]) != 1 or not query["asset_id"][0]:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Se requiere un único asset_id de contrato."})
                return
            asset_id = query["asset_id"][0]
            contract = next((item for item in asset_contract_catalog["contracts"] if item["id"] == asset_id), None)
            if contract is None:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "El asset_id no existe en el manifiesto."})
                return
            expected = contract["expected"]
            limit = expected.get("max_bytes", 12 * 1024 * 1024)
            content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if content_type != "image/png":
                self._send_json(HTTPStatus.UNSUPPORTED_MEDIA_TYPE, {"error": "Selecciona un archivo PNG real."})
                return
            try:
                length = int(self.headers.get("Content-Length", ""))
            except ValueError:
                self._send_json(HTTPStatus.LENGTH_REQUIRED, {"error": "Se requiere Content-Length válido."})
                return
            if length <= 0:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "El archivo está vacío."})
                return
            if length > limit:
                self._send_json(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"error": f"El PNG supera el límite del contrato ({limit} bytes)."})
                return
            temporary = None
            try:
                destination = _safe_asset_destination(asset_root, contract["destination"])
                if destination.exists():
                    self._send_json(HTTPStatus.CONFLICT, {"error": "El asset ya existe. No se sobrescribió ningún archivo."})
                    return
                fd, temporary_name = tempfile.mkstemp(prefix=".botimagen-import-", suffix=".tmp", dir=destination.parent)
                temporary = Path(temporary_name)
                count = 0
                with os.fdopen(fd, "wb") as handle:
                    while count < length:
                        chunk = self.rfile.read(min(64 * 1024, length - count))
                        if not chunk:
                            raise ApiInputError("La petición se interrumpió antes de completar el archivo.", HTTPStatus.BAD_REQUEST)
                        count += len(chunk)
                        if count > limit:
                            raise ApiInputError("El PNG supera el límite del contrato.", HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
                        handle.write(chunk)
                    handle.flush()
                    os.fsync(handle.fileno())
                data = temporary.read_bytes()
                width, height = validate_png_bytes(data, expected)
                try:
                    os.link(temporary, destination)
                except FileExistsError as exc:
                    raise ApiInputError("El asset ya existe. No se sobrescribió ningún archivo.", HTTPStatus.CONFLICT) from exc
                self._send_json(HTTPStatus.CREATED, {
                    "status": "imported", "asset_id": asset_id,
                    "destination": contract["destination"], "bytes": len(data),
                    "width": width, "height": height,
                })
            except ApiInputError as exc:
                self._send_json(exc.status, {"error": str(exc)})
            except OSError:
                self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "No se pudo preparar el PNG en el destino local."})
            finally:
                if temporary is not None:
                    try:
                        temporary.unlink(missing_ok=True)
                    except OSError:
                        pass

        def _save_profile(self, payload: Any) -> dict[str, Any]:
            if not isinstance(payload, dict):
                raise ApiInputError("El cuerpo JSON debe ser un objeto.")
            if set(payload) != {"name", "profile"}:
                raise ApiInputError("Se requieren únicamente los campos 'name' y 'profile'.")
            name = payload.get("name")
            profile = payload.get("profile")
            if not isinstance(name, str) or not name.strip() or len(name.strip()) > 80:
                raise ApiInputError("El nombre del perfil debe contener entre 1 y 80 caracteres.")
            if not isinstance(profile, dict):
                raise ApiInputError("'profile' debe ser un objeto JSON.")
            # IDs are generated by the server; user input never becomes a path.
            profile_id = str(uuid.uuid4())
            record = {
                "schema_version": 1,
                "id": profile_id,
                "name": name.strip(),
                "saved_at": datetime.now(timezone.utc).isoformat(),
                "style_id": str(profile.get("style_id", ""))[:100],
                "seed": profile.get("seed"),
                "profile": profile,
            }
            profile_root.mkdir(parents=True, exist_ok=True)
            destination = profile_root / ("profile-" + profile_id + ".json")
            temporary = profile_root / ("profile-" + profile_id + ".tmp")
            try:
                with temporary.open("x", encoding="utf-8") as handle:
                    json.dump(record, handle, ensure_ascii=False, indent=2)
                    handle.write("\n")
                temporary.replace(destination)
            finally:
                if temporary.exists():
                    temporary.unlink()
            return record

        def log_message(self, format_string: str, *args: Any) -> None:
            print("[BotImagen API] " + (format_string % args))

    return BotImagenHandler


def main() -> None:
    host = os.environ.get("BOTIMAGEN_HOST", DEFAULT_HOST).strip()
    if host != "127.0.0.1":
        raise SystemExit("Por seguridad, BotImagen solo puede escuchar en 127.0.0.1.")
    try:
        port = int(os.environ.get("BOTIMAGEN_PORT", str(DEFAULT_PORT)))
    except ValueError as exc:
        raise SystemExit("BOTIMAGEN_PORT debe ser un entero entre 1 y 65535.") from exc
    if not 1 <= port <= 65535:
        raise SystemExit("BOTIMAGEN_PORT debe estar entre 1 y 65535.")
    generator = CharacterGenerator(ROOT / "character_rules.json")
    server = ThreadingHTTPServer((host, port), make_handler(generator))
    server.daemon_threads = True
    print(f"BotImagen local API: http://{host}:{port}")
    print("Servicio exclusivo de loopback; Ctrl+C para detener.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo BotImagen API...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
