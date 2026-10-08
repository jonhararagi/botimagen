from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tkinter as tk
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent


def check_python():
    ok = sys.version_info >= (3, 10)
    version = ".".join(map(str, sys.version_info[:3]))
    return ok, f"Python {version} {'OK' if ok else 'FAIL (requires 3.10+)'}"


def check_tkinter():
    try:
        root = tk.Tk()
        root.withdraw()
        patch = str(root.tk.call("info", "patchlevel"))
        root.destroy()
        return True, f"Tkinter/Tk {patch} OK"
    except Exception as exc:
        return False, f"Tkinter FAIL: {exc}"


def check_git():
    git = shutil.which("git")
    if not git:
        return False, "Git FAIL: no está en PATH"
    try:
        result = subprocess.run(
            [git, "--version"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=5,
        )
        if result.returncode == 0:
            return True, result.stdout.strip()
        return False, "Git FAIL: no pudo ejecutar --version"
    except Exception as exc:
        return False, f"Git FAIL: {exc}"


def check_repo():
    manifest = APP_DIR / "assets_manifest.json"
    app = APP_DIR / "app.py"
    ok = manifest.is_file() and app.is_file()
    return ok, f"BotImagen files {'OK' if ok else 'FAIL'}"


def check_config():
    config = APP_DIR / "botimagen_config.json"
    if not config.exists():
        return True, "Configuración local: todavía no creada (normal)"
    return os.access(config, os.R_OK), "Configuración local: OK" if os.access(config, os.R_OK) else "Configuración local: FAIL"


def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnóstico local de BotImagen")
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    checks = [
        check_python(),
        check_tkinter(),
        check_git(),
        check_repo(),
        check_config(),
    ]

    for ok, message in checks:
        print(("PASS" if ok else "FAIL") + " | " + message)

    failed = sum(not ok for ok, _ in checks)
    print()
    print(
        f"RESULTADO: {'PASS' if failed == 0 else 'REVISAR'} | "
        f"{len(checks) - failed}/{len(checks)} checks correctos"
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
