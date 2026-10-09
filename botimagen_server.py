from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from character_generator import CharacterGenerator, TRAIT_KEYS

ROOT = Path(__file__).resolve().parent
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


def make_handler(generator: CharacterGenerator, profiles_path: Path | None = None):
    catalog = make_catalog(generator)
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
