from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

APP_TITLE = "BaseWarriors · Asset Intake"
MANIFEST_NAME = "assets_manifest.json"
CONFIG_NAME = "botimagen_config.json"


def app_dir() -> Path:
    return Path(__file__).resolve().parent


def load_json(path: Path, fallback):
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return fallback


def save_json(path: Path, data) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


class AssetIntake(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1080x720")
        self.minsize(900, 620)

        self.manifest = load_json(app_dir() / MANIFEST_NAME, {"assets": []})
        self.config_data = load_json(app_dir() / CONFIG_NAME, {"repo_path": ""})
        self.assets = self.manifest.get("assets", [])
        self.selected_asset = None
        self.selected_file = None
        self.preview_image = None
        self.prepared_ids = set()

        self.status_var = tk.StringVar(value="Selecciona un asset.")
        self.path_var = tk.StringVar(value=self.config_data.get("repo_path", ""))
        self.file_var = tk.StringVar(value="Ninguna imagen seleccionada")
        self.validation_var = tk.StringVar(value="Esperando imagen...")
        self.asset_title_var = tk.StringVar(value="Selecciona un asset")
        self.asset_filter_var = tk.StringVar()
        self.catalog_status_var = tk.StringVar(value="")

        self._build_ui()
        self._populate_assets()

    def _build_ui(self):
        self.columnconfigure(1, weight=1)
        self.rowconfigure(1, weight=1)

        header = ttk.Frame(self, padding=14)
        header.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(header, text="BASEWARRIORS ASSET INTAKE",
                  font=("Segoe UI", 18, "bold")).pack(anchor="w")
        ttk.Label(header, text="Genera → selecciona → valida → coloca en el destino correcto.",
                  font=("Segoe UI", 10)).pack(anchor="w", pady=(3, 0))

        left = ttk.Frame(self, padding=(14, 0, 8, 14))
        left.grid(row=1, column=0, sticky="nsw")
        ttk.Label(left, text="ASSETS", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        filter_row = ttk.Frame(left)
        filter_row.pack(fill="x", pady=(4, 4))
        ttk.Entry(filter_row, textvariable=self.asset_filter_var).pack(side="left", fill="x", expand=True)
        self.asset_filter_var.trace_add("write", lambda *_: self._refresh_asset_list())
        ttk.Label(left, textvariable=self.catalog_status_var).pack(anchor="w")

        self.asset_list = tk.Listbox(left, width=34, height=25, exportselection=False)
        self.asset_list.pack(fill="y", expand=True, pady=(8, 0))
        self.asset_list.bind("<<ListboxSelect>>", self._on_asset_selected)

        right = ttk.Frame(self, padding=(8, 0, 14, 14))
        right.grid(row=1, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)

        ttk.Label(right, textvariable=self.asset_title_var,
                  font=("Segoe UI", 16, "bold")).grid(row=0, column=0, sticky="w")

        self.info = tk.Text(right, height=8, wrap="word", state="disabled")
        self.info.grid(row=1, column=0, sticky="ew", pady=(8, 12))

        upload_row = ttk.Frame(right)
        upload_row.grid(row=2, column=0, sticky="ew")
        ttk.Button(upload_row, text="+ SUBIR IMAGEN",
                   command=self.choose_image).pack(side="left")
        ttk.Button(upload_row, text="COPIAR PROMPT",
                   command=self.copy_prompt).pack(side="left", padx=8)
        ttk.Label(upload_row, textvariable=self.file_var).pack(side="left", padx=12)

        self.preview = ttk.Label(right, text="Vista previa\n\nSin imagen",
                                 anchor="center", relief="solid")
        self.preview.grid(row=3, column=0, sticky="nsew", pady=12)
        right.rowconfigure(3, weight=1)

        ttk.Label(right, textvariable=self.validation_var).grid(
            row=4, column=0, sticky="w", pady=(0, 10))

        actions = ttk.Frame(right)
        actions.grid(row=5, column=0, sticky="ew")
        ttk.Button(actions, text="PREPARAR ASSET",
                   command=self.prepare_asset).pack(side="left")
        ttk.Button(actions, text="PREPARAR + SIGUIENTE",
                   command=self.prepare_and_next).pack(side="left", padx=8)
        ttk.Button(actions, text="LIMPIAR",
                   command=self.clear_selection).pack(side="left")
        ttk.Button(actions, text="ABRIR CARPETA",
                   command=self.open_destination).pack(side="left", padx=8)
        ttk.Button(actions, text="ABRIR REPOSITORIO",
                   command=self.choose_repo).pack(side="left")
        ttk.Button(actions, text="GIT STATUS",
                   command=self.git_status).pack(side="left", padx=(8, 0))
        ttk.Button(actions, text="GIT PUSH",
                   command=self.git_push).pack(side="left", padx=(8, 0))

        bottom = ttk.Frame(self, padding=(14, 0, 14, 12))
        bottom.grid(row=2, column=0, columnspan=2, sticky="ew")
        bottom.columnconfigure(1, weight=1)
        ttk.Label(bottom, text="Repositorio local:").grid(row=0, column=0, sticky="w")
        ttk.Entry(bottom, textvariable=self.path_var).grid(row=0, column=1, sticky="ew", padx=8)
        ttk.Button(bottom, text="Elegir...", command=self.choose_repo).grid(row=0, column=2)
        ttk.Label(bottom, textvariable=self.status_var).grid(
            row=1, column=0, columnspan=3, sticky="w", pady=(8, 0))

    def _refresh_asset_list(self):
        if not hasattr(self, "asset_list"):
            return
        query = self.asset_filter_var.get().strip().lower()
        current_id = self.selected_asset.get("id", "") if self.selected_asset else ""
        self.asset_list.delete(0, tk.END)
        visible = []
        for asset in self.assets:
            label = f"{asset.get('id', '?')} · {asset.get('title', '')}"
            if query and query not in label.lower():
                continue
            marker = "✓ " if asset.get("id", "") in self.prepared_ids else ""
            visible.append(asset)
            self.asset_list.insert(tk.END, marker + label)
        self.catalog_status_var.set(f"{len(visible)}/{len(self.assets)} assets")
        if visible:
            index = next((i for i, a in enumerate(visible) if a.get("id") == current_id), 0)
            self.asset_list.selection_set(index)
            self._on_asset_selected()
        else:
            self.selected_asset = None
            self.selected_file = None
            self.asset_title_var.set("Sin resultados")
            self.status_var.set("El filtro no encontró assets.")

    def _populate_assets(self):
        self._refresh_asset_list()

    def _on_asset_selected(self, _event=None):
        selection = self.asset_list.curselection()
        if not selection:
            return
        self.selected_asset = self.assets[selection[0]]
        self.asset_title_var.set(self.selected_asset.get("title", "Asset"))

        expected = self.selected_asset.get("expected", {})
        text = (
            f"ID: {self.selected_asset.get('id', '')}\n"
            f"Destino: {self.selected_asset.get('destination', '')}\n"
            f"Formato: {expected.get('format', 'PNG')}\n"
            f"Dimensiones: {expected.get('width', 'cualquiera')} × "
            f"{expected.get('height', 'cualquiera')}\n"
            f"Máximo: {self._format_bytes(expected.get('max_bytes'))}\n\n"
            f"PROMPT / DESCRIPCIÓN:\n{self.selected_asset.get('prompt', '')}"
        )
        self.info.configure(state="normal")
        self.info.delete("1.0", tk.END)
        self.info.insert("1.0", text)
        self.info.configure(state="disabled")

        self.selected_file = None
        self.file_var.set("Ninguna imagen seleccionada")
        self.validation_var.set("Esperando imagen...")
        self.preview_image = None
        self.preview.configure(text="Vista previa\n\nSin imagen", image="")
        repo = Path(self.path_var.get()).expanduser()
        destination = repo / self.selected_asset.get("destination", "")
        if destination.is_file():
            self.status_var.set(f"✓ Ya existe en destino: {destination}")
        else:
            self.status_var.set("Asset seleccionado. Listo para recibir imagen.")

    @staticmethod
    def _format_bytes(value):
        if not value:
            return "sin límite"
        if value >= 1024 * 1024:
            return f"{value / (1024 * 1024):.1f} MB"
        return f"{value / 1024:.0f} KB"

    def copy_prompt(self):
        if not self.selected_asset:
            return
        prompt = self.selected_asset.get("prompt", "").strip()
        if not prompt:
            messagebox.showinfo("Prompt", "Este asset no tiene prompt.")
            return
        self.clipboard_clear()
        self.clipboard_append(prompt)
        self.update()
        self.status_var.set("Prompt copiado al portapapeles.")

    def clear_selection(self):
        self.selected_file = None
        self.file_var.set("Ninguna imagen seleccionada")
        self.validation_var.set("Esperando imagen...")
        self.preview_image = None
        self.preview.configure(text="Vista previa\n\nSin imagen", image="")
        self.status_var.set("Selección limpiada.")

    def choose_image(self):
        path = filedialog.askopenfilename(
            title="Seleccionar imagen",
            filetypes=[
                ("PNG", "*.png"),
                ("Todos los archivos", "*.*"),
            ],
        )
        if not path:
            return

        self.selected_file = Path(path)
        self.file_var.set(self.selected_file.name)
        self.show_preview()
        self.validate_image()

    def show_preview(self):
        if not self.selected_file:
            return
        try:
            image = tk.PhotoImage(file=str(self.selected_file))
            width, height = image.width(), image.height()
            max_w, max_h = 620, 300
            scale = max(1, (width + max_w - 1) // max_w, (height + max_h - 1) // max_h)
            if scale > 1:
                image = image.subsample(scale, scale)
            self.preview_image = image
            self.preview.configure(text="", image=self.preview_image)
        except (tk.TclError, OSError) as exc:
            self.preview_image = None
            self.preview.configure(text=f"No se puede previsualizar esta imagen.\\n{exc}", image="")

    def validate_image(self):
        if not self.selected_file or not self.selected_asset:
            return False

        errors = []
        expected = self.selected_asset.get("expected", {})
        suffix = self.selected_file.suffix.lower()

        if expected.get("format", "PNG").upper() == "PNG" and suffix != ".png":
            errors.append("Se requiere PNG.")

        width = height = None
        try:
            probe = tk.PhotoImage(file=str(self.selected_file))
            width, height = probe.width(), probe.height()
        except tk.TclError as exc:
            errors.append(f"No se pudo leer la imagen: {exc}")

        if width and expected.get("width") and width != expected["width"]:
            errors.append(f"Ancho incorrecto: {width}px; esperado {expected['width']}px.")
        if height and expected.get("height") and height != expected["height"]:
            errors.append(f"Alto incorrecto: {height}px; esperado {expected['height']}px.")

        max_bytes = expected.get("max_bytes")
        try:
            size = self.selected_file.stat().st_size
            if max_bytes and size > max_bytes:
                errors.append("El archivo supera el peso máximo permitido.")
        except OSError as exc:
            errors.append(f"No se pudo leer el archivo: {exc}")

        if errors:
            self.validation_var.set("❌ " + " ".join(errors))
            return False
        dimensions = f"{width}×{height}" if width and height else "dimensiones no verificadas"
        self.validation_var.set(f"✅ PASS · {dimensions} · {self._format_bytes(size)}")
        return True

    def prepare_asset(self):
        if not self.selected_asset or not self.selected_file:
            messagebox.showwarning("Falta imagen", "Selecciona primero un asset y una imagen.")
            return False

        if not self.validate_image():
            messagebox.showerror("Validación fallida", "Corrige la imagen antes de prepararla.")
            return False

        repo = Path(self.path_var.get()).expanduser()
        if not repo.is_dir():
            messagebox.showerror("Repositorio", "Selecciona una carpeta de repositorio válida.")
            return False

        destination = repo / self.selected_asset["destination"]
        destination.parent.mkdir(parents=True, exist_ok=True)

        if destination.exists():
            replace = messagebox.askyesno(
                "Reemplazar asset",
                f"Ya existe:\n{destination}\n\n¿Quieres reemplazarlo?"
            )
            if not replace:
                return False

        try:
            shutil.copy2(self.selected_file, destination)
            self.prepared_ids.add(self.selected_asset.get("id", ""))
            self._refresh_asset_labels()
            self.status_var.set(f"✅ Asset preparado: {destination}")
            messagebox.showinfo("Listo", f"Asset colocado en:\n{destination}")
            return True
        except OSError as exc:
            messagebox.showerror("Error", str(exc))
            return False


    def _refresh_asset_labels(self):
        self._refresh_asset_list()

    def prepare_and_next(self):
        before = self.selected_asset.get("id", "") if self.selected_asset else ""
        if not self.prepare_asset():
            return

        for index, asset in enumerate(self.assets):
            if asset.get("id", "") == before:
                continue
            if asset.get("id", "") not in self.prepared_ids:
                self.asset_list.selection_clear(0, tk.END)
                self.asset_list.selection_set(index)
                self.asset_list.see(index)
                self._on_asset_selected()
                self.status_var.set(f"✅ Listo. Siguiente asset: {asset.get('id', '')}")
                return

        self.status_var.set("🎉 Todos los assets del catálogo fueron preparados en esta sesión.")
        messagebox.showinfo("Cola terminada", "No quedan assets sin preparar en esta sesión.")

    def choose_repo(self):
        path = filedialog.askdirectory(title="Seleccionar repositorio local")
        if not path:
            return
        self.path_var.set(path)
        self.config_data["repo_path"] = path
        save_json(app_dir() / CONFIG_NAME, self.config_data)
        self.status_var.set(f"Repositorio configurado: {path}")

    def open_destination(self):
        if not self.selected_asset:
            return
        repo = Path(self.path_var.get()).expanduser()
        destination = repo / self.selected_asset["destination"]
        folder = destination.parent
        if not folder.exists():
            folder.mkdir(parents=True, exist_ok=True)
        try:
            os.startfile(folder)
        except AttributeError:
            subprocess.Popen(["xdg-open", str(folder)])

    def run_git(self, args):
        repo = Path(self.path_var.get()).expanduser()
        if not (repo / ".git").exists():
            messagebox.showerror("Git", "La carpeta seleccionada no parece ser un repositorio Git.")
            return None
        try:
            result = subprocess.run(
                ["git", *args],
                cwd=repo,
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
            )
            if result.returncode != 0:
                messagebox.showerror("Git", result.stderr.strip() or "Git devolvió un error.")
                return None
            return result.stdout.strip()
        except FileNotFoundError:
            messagebox.showerror("Git", "No se encontró Git en PATH.")
            return None

    def git_status(self):
        output = self.run_git(["status", "--short"])
        if output is not None:
            messagebox.showinfo("Git status", output or "Working tree limpio.")

    def git_push(self):
        repo = Path(self.path_var.get()).expanduser()
        if not (repo / ".git").exists():
            messagebox.showerror("Git", "La carpeta seleccionada no parece ser un repositorio Git.")
            return

        destination = repo / self.selected_asset["destination"] if self.selected_asset else None
        if not destination:
            messagebox.showwarning("Git", "Selecciona un asset primero.")
            return

        relative = destination.relative_to(repo).as_posix()
        status = self.run_git(["status", "--short", "--", relative])
        if status is None:
            return
        if not status:
            messagebox.showinfo("Git", "No hay cambios pendientes para este asset.")
            return

        if not messagebox.askyesno(
            "Sincronizar asset",
            f"Se hará git add del asset, commit y push:\n\n{relative}\n\n¿Continuar?"
        ):
            return

        if self.run_git(["add", "--", relative]) is None:
            return
        if self.run_git(["commit", "-m", f"asset: intake {self.selected_asset.get('id', 'update')}"]) is None:
            return
        if self.run_git(["push"]) is None:
            return

        self.status_var.set("✅ Asset enviado a GitHub.")
        messagebox.showinfo("Git", "Asset enviado correctamente a GitHub.")


if __name__ == "__main__":
    app = AssetIntake()
    app.mainloop()
