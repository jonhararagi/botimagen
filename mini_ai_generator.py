"""Guarded bridge to an optional local AUTOMATIC1111/Forge Stable Diffusion API.

No model is downloaded, no paid API is called, and requests are restricted to loopback.
The RAM budget is a preflight safety check, not an operating-system hard memory limit:
the external diffusion process must be configured separately by its owner.
"""
from __future__ import annotations

import base64
import json
import os
import socket
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

_DEFAULT_URL = "http://127.0.0.1:7860"
_MAX_SECONDS = 300
_MAX_STEPS = 16
_MAX_SIDE = 768
_GENERATION_LOCK = threading.Lock()


class MiniAIError(ValueError):
    pass


def _engine_url() -> str:
    raw = os.environ.get("BOTIMAGEN_SD_API_URL", _DEFAULT_URL).strip().rstrip("/")
    parsed = urllib.parse.urlsplit(raw)
    if parsed.scheme != "http" or parsed.hostname not in {"127.0.0.1", "localhost", "::1"} or parsed.port is None:
        raise MiniAIError("Por seguridad, la mini IA solo admite un motor HTTP local en 127.0.0.1, localhost o ::1.")
    return raw


def _available_ram_gb() -> float | None:
    try:
        import psutil  # type: ignore
        return psutil.virtual_memory().available / (1024 ** 3)
    except ImportError:
        pass
    if os.name == "nt":
        try:
            import ctypes

            class MEMORYSTATUSEX(ctypes.Structure):
                _fields_ = [
                    ("dwLength", ctypes.c_ulong), ("dwMemoryLoad", ctypes.c_ulong),
                    ("ullTotalPhys", ctypes.c_ulonglong), ("ullAvailPhys", ctypes.c_ulonglong),
                    ("ullTotalPageFile", ctypes.c_ulonglong), ("ullAvailPageFile", ctypes.c_ulonglong),
                    ("ullTotalVirtual", ctypes.c_ulonglong), ("ullAvailVirtual", ctypes.c_ulonglong),
                    ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
                ]
            status = MEMORYSTATUSEX()
            status.dwLength = ctypes.sizeof(status)
            if ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(status)):
                return status.ullAvailPhys / (1024 ** 3)
        except (AttributeError, OSError):
            return None
    try:
        pages = os.sysconf("SC_AVPHYS_PAGES")
        page_size = os.sysconf("SC_PAGE_SIZE")
        return pages * page_size / (1024 ** 3)
    except (ValueError, OSError, AttributeError):
        return None


def _request_json(url: str, payload: dict[str, Any] | None = None, timeout: int = 3) -> dict[str, Any]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"} if data is not None else {},
        method="GET" if data is None else "POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        parsed = json.loads(response.read(32 * 1024 * 1024).decode("utf-8"))
    if not isinstance(parsed, dict):
        raise MiniAIError("El motor local devolvió una respuesta inesperada.")
    return parsed


def mini_ai_status() -> dict[str, Any]:
    available_ram = _available_ram_gb()
    try:
        base = _engine_url()
        request = urllib.request.Request(base + "/sdapi/v1/sd-models")
        with urllib.request.urlopen(request, timeout=2) as response:
            model_list = json.loads(response.read(2 * 1024 * 1024).decode("utf-8"))
        names = [str(item.get("model_name") or item.get("title") or "modelo") for item in model_list if isinstance(item, dict)] if isinstance(model_list, list) else []
        return {
            "available": bool(names), "engine": "AUTOMATIC1111 / Forge API local",
            "models": names[:30], "available_ram_gb": round(available_ram, 1) if available_ram is not None else None,
            "max_seconds": _MAX_SECONDS, "max_steps": _MAX_STEPS, "max_dimension": _MAX_SIDE,
            "message": "Motor local conectado." if names else "El motor responde, pero no informa modelos instalados.",
        }
    except (OSError, ValueError, urllib.error.URLError, MiniAIError, json.JSONDecodeError, socket.timeout) as exc:
        return {
            "available": False, "engine": "AUTOMATIC1111 / Forge API local", "models": [],
            "available_ram_gb": round(available_ram, 1) if available_ram is not None else None,
            "max_seconds": _MAX_SECONDS, "max_steps": _MAX_STEPS, "max_dimension": _MAX_SIDE,
            "message": "No se detectó un motor local compatible. Instalá AUTOMATIC1111 o Forge con --api y cargá un modelo anime local. No se usa nube ni API paga.",
            "detail": str(exc)[:180],
        }


def _bounded_text(value: Any, label: str, maximum: int = 100) -> str:
    if not isinstance(value, str):
        raise MiniAIError(f"El campo {label} debe ser texto.")
    value = " ".join(value.split()).strip()
    if len(value) > maximum:
        raise MiniAIError(f"El campo {label} supera {maximum} caracteres.")
    return value


def _build_prompts(payload: dict[str, Any]) -> tuple[str, str]:
    allowed = {"character_name", "archetype", "hair", "eyes", "outfit", "palette", "pose", "background", "extra", "seed", "steps", "width", "height", "timeout_seconds", "ram_budget_gb"}
    unknown = set(payload) - allowed
    if unknown:
        raise MiniAIError("Campos no permitidos: " + ", ".join(sorted(unknown)))
    fields = [
        ("nombre/diseño", "character_name", 70),
        ("arquetipo", "archetype", 100),
        ("cabello", "hair", 100),
        ("ojos", "eyes", 80),
        ("vestimenta", "outfit", 140),
        ("paleta", "palette", 100),
        ("pose", "pose", 100),
        ("fondo", "background", 80),
        ("detalles adicionales", "extra", 180),
    ]
    pieces = []
    for label, key, limit in fields:
        value = _bounded_text(payload.get(key, ""), label, limit)
        if value:
            pieces.append(f"{label}: {value}")
    if not pieces:
        raise MiniAIError("Definí al menos el arquetipo, vestimenta o un rasgo del personaje.")
    prompt = (
        "masterpiece, best quality, polished Japanese anime character illustration, "
        "professional anime game concept art, clean intentional lineart, coherent anatomy, "
        "consistent character design, full body, single character, centered composition, "
        "clear silhouette, detailed layered clothing, controlled color palette, studio quality. "
        "Follow this fixed design specification exactly; do not redesign, add extra characters, "
        "change specified colors, clothing, hairstyle, or accessories. Design sheet consistency. "
        + "; ".join(pieces)
    )
    negative = (
        "low quality, worst quality, lowres, blurry, unfinished sketch, childish doodle, "
        "crayon, stick figure, malformed anatomy, extra arms, extra legs, extra fingers, "
        "missing fingers, fused fingers, duplicate character, multiple people, inconsistent outfit, "
        "random accessories, text, watermark, logo, cropped feet, cropped head, jpeg artifacts, "
        "photorealistic, 3d render"
    )
    return prompt, negative


def generate_mini_ai(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise MiniAIError("El cuerpo debe ser un objeto JSON.")
    prompt, negative = _build_prompts(payload)
    try:
        steps = int(payload.get("steps", 12))
        width = int(payload.get("width", 512))
        height = int(payload.get("height", 768))
        timeout_seconds = int(payload.get("timeout_seconds", 300))
        ram_budget_gb = float(payload.get("ram_budget_gb", 6))
        seed = int(payload.get("seed", 314159))
    except (TypeError, ValueError, OverflowError) as exc:
        raise MiniAIError("Los límites de generación deben ser valores numéricos válidos.") from exc
    if not 4 <= steps <= _MAX_STEPS:
        raise MiniAIError(f"Los pasos deben estar entre 4 y {_MAX_STEPS}.")
    if width not in {512, 640} or height not in {512, 640, 768} or width > _MAX_SIDE or height > _MAX_SIDE:
        raise MiniAIError("Resolución permitida: 512×512, 512×640, 512×768 o 640×640.")
    if not 30 <= timeout_seconds <= _MAX_SECONDS:
        raise MiniAIError(f"El límite de tiempo debe estar entre 30 y {_MAX_SECONDS} segundos.")
    if not 4 <= ram_budget_gb <= 12:
        raise MiniAIError("El presupuesto preventivo de RAM debe estar entre 4 y 12 GB.")
    if not 0 <= seed <= 4294967295:
        raise MiniAIError("La semilla debe estar entre 0 y 4294967295.")
    available_ram = _available_ram_gb()
    if available_ram is not None and available_ram < ram_budget_gb:
        raise MiniAIError(f"Generación cancelada antes de empezar: quedan {available_ram:.1f} GB de RAM libre y el presupuesto preventivo configurado es {ram_budget_gb:.1f} GB. Cerrá programas o bajá el presupuesto.")
    if not _GENERATION_LOCK.acquire(blocking=False):
        raise MiniAIError("Ya hay una generación activa. Esperá a que termine para no acumular consumo de RAM.")
    started = time.monotonic()
    try:
        base = _engine_url()
        body = {
            "prompt": prompt, "negative_prompt": negative, "steps": steps, "width": width, "height": height,
            "cfg_scale": 6.5, "sampler_name": "Euler a", "batch_size": 1, "n_iter": 1,
            "seed": seed, "subseed": -1, "restore_faces": False, "tiling": False,
            "send_images": True, "save_images": False,
        }
        try:
            result = _request_json(base + "/sdapi/v1/txt2img", body, timeout=timeout_seconds)
        except (TimeoutError, socket.timeout, urllib.error.URLError) as exc:
            try:
                _request_json(base + "/sdapi/v1/interrupt", {}, timeout=2)
            except Exception:
                pass
            raise MiniAIError(f"Se agotó el tiempo de generación ({timeout_seconds} s). Se envió una orden de interrupción al motor local. Revisá su consola por si necesita detenerse manualmente.") from exc
        images = result.get("images")
        if not isinstance(images, list) or not images or not isinstance(images[0], str):
            raise MiniAIError("El motor terminó, pero no devolvió una imagen. Revisá que haya un modelo cargado.")
        image = images[0].split(",", 1)[-1]
        try:
            decoded = base64.b64decode(image, validate=True)
        except (ValueError, base64.binascii.Error) as exc:
            raise MiniAIError("El motor devolvió una imagen codificada incorrectamente.") from exc
        if len(decoded) > 20 * 1024 * 1024 or not decoded.startswith(b"\x89PNG\r\n\x1a\n"):
            raise MiniAIError("La imagen devuelta no es un PNG válido o supera 20 MB.")
        return {
            "mime_type": "image/png", "png_base64": base64.b64encode(decoded).decode("ascii"),
            "seed": seed, "steps": steps, "width": width, "height": height,
            "elapsed_seconds": round(time.monotonic() - started, 1),
            "prompt": prompt, "negative_prompt": negative,
            "notice": "La semilla y la receta ayudan a repetir el diseño, pero la IA puede variar detalles. El presupuesto RAM es una barrera preventiva, no un límite duro del sistema operativo.",
        }
    finally:
        _GENERATION_LOCK.release()
