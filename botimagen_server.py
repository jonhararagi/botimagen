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


def _validate_visual_recipe(value: Any) -> dict[str, Any]:
    defaults: dict[str, Any] = {
        "schema_version": 3, "family": "cyberstreet",
        "anime_influence": 68, "toon_influence": 56, "streetwear_cyberpunk": 30, "detail_level": 58,
        "garment_base_color": "#343246", "garment_panel_color": "#48516a",
        "garment_accent_color": "#5ce4dc", "fabric_pattern": "circuit",
        "torso_length": 80, "sleeve_length": 60, "waist_fit": 50,
        "nanowear_state": "everyday", "material_finish": "textile", "emblem_shape": "bunny",
        "emblem_color": "#f3c96b", "emblem_contrast": "auto", "emblem_position": "chest", "view": "front",
    }
    if not isinstance(value, dict):
        raise ApiInputError("'visual_recipe' debe ser un objeto JSON.")
    version = value.get("schema_version", 1)
    if isinstance(version, bool) or not isinstance(version, int) or version not in {1, 2, 3}:
        raise ApiInputError("La receta visual debe usar schema_version 1, 2 o 3.")
    v1_only_missing = {"garment_base_color", "garment_panel_color", "garment_accent_color", "fabric_pattern", "torso_length", "sleeve_length", "waist_fit"}
    v2_only_missing = {"torso_length", "sleeve_length", "waist_fit"}
    allowed_v1 = set(defaults) - v1_only_missing
    allowed_v2 = set(defaults) - v2_only_missing
    allowed = allowed_v1 if version == 1 else allowed_v2 if version == 2 else set(defaults)
    extra = set(value) - allowed
    if extra:
        raise ApiInputError("Campos no reconocidos en visual_recipe: " + ", ".join(sorted(map(str, extra))) + ".")
    result = {**defaults, **value, "schema_version": 3}
    if result["family"] != "cyberstreet":
        raise ApiInputError("La receta visual no tiene una familia compatible.")
    for key in ("anime_influence", "toon_influence", "streetwear_cyberpunk", "detail_level", "torso_length", "sleeve_length", "waist_fit"):
        number = result[key]
        if isinstance(number, bool) or not isinstance(number, int) or not 0 <= number <= 100:
            raise ApiInputError(f"'{key}' debe ser un entero entre 0 y 100.")
    enums = {
        "nanowear_state": {"everyday", "nanoweave", "transformation"},
        "material_finish": {"textile", "nanoweave", "synthetic"},
        "emblem_shape": {"bunny", "star", "fox", "skull", "geo"},
        "emblem_contrast": {"auto", "manual"},
        "emblem_position": {"chest", "sleeve", "hood"},
        "view": {"front", "back"},
        "fabric_pattern": {"plain", "circuit", "geometric", "gradient"},
    }
    for key, allowed_values in enums.items():
        if not isinstance(result[key], str) or result[key] not in allowed_values:
            raise ApiInputError(f"'{key}' no es una opción válida de visual_recipe.")
    for key in ("emblem_color", "garment_base_color", "garment_panel_color", "garment_accent_color"):
        color = result[key]
        if not isinstance(color, str) or len(color) != 7 or not color.startswith("#") or any(ch not in "0123456789abcdefABCDEF" for ch in color[1:]):
            raise ApiInputError(f"'{key}' debe ser un color hexadecimal #RRGGBB.")
    return result

def validate_generation_payload(payload: Any, generator: CharacterGenerator) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ApiInputError("El cuerpo JSON debe ser un objeto.")
    allowed = {"selections", "seed", "coherence", "surprise", "visual_recipe"}
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

    visual_recipe = _validate_visual_recipe(payload["visual_recipe"]) if "visual_recipe" in payload else None
    return {"selections": clean, "seed": seed, "coherence": float(coherence), "surprise": surprise, "visual_recipe": visual_recipe}


def generate_from_payload(payload: Any, generator: CharacterGenerator) -> dict[str, Any]:
    args = validate_generation_payload(payload, generator)
    try:
        return generator.generate(
            selections=args["selections"],
            seed=args["seed"],
            coherence=args["coherence"],
            surprise=args["surprise"],
            visual_recipe=args["visual_recipe"],
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


def make_handler(generator: CharacterGenerator, profiles_path: Path | None = None):
    catalog = make_catalog(generator)
    asset_contract_catalog = make_asset_contract_catalog()
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
