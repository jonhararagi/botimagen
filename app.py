from __future__ import annotations

import json
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from character_generator import CharacterGenerator, TRAIT_KEYS

APP_TITLE = "BaseWarriors · Asset Intake"
MANIFEST_NAME = "assets_manifest.json"
CONFIG_NAME = "botimagen_config.json"
HISTORY_NAME = "botimagen_history.json"
CHARACTER_RULES_NAME = "character_rules.json"
MAX_HISTORY_ITEMS = 100
CHARACTER_FAVORITES_NAME = "character_favorites.json"


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
        self.geometry("1080x760")
        self.minsize(920, 660)

        self.manifest = load_json(app_dir() / MANIFEST_NAME, {"assets": []})
        self.config_data = load_json(app_dir() / CONFIG_NAME, {"repo_path": ""})
        self.history = load_json(app_dir() / HISTORY_NAME, [])
        if not isinstance(self.history, list):
            self.history = []
        self.character_favorites = load_json(
            app_dir() / CHARACTER_FAVORITES_NAME, []
        )
        if not isinstance(self.character_favorites, list):
            self.character_favorites = []

        self.assets = self.manifest.get("assets", [])
        self.character_generator = CharacterGenerator(app_dir() / CHARACTER_RULES_NAME)
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
        self.bind("<Control-o>", lambda _event: self.choose_image())
        self.bind("<Escape>", lambda _event: self.clear_selection())
        self._populate_assets()

    def _build_ui(self):
        self.columnconfigure(1, weight=1)
        self.rowconfigure(1, weight=1)

        header = ttk.Frame(self, padding=14)
        header.grid(row=0, column=0, columnspan=2, sticky="ew")
        ttk.Label(header, text="BASEWARRIORS ASSET INTAKE",
                  font=("Segoe UI", 18, "bold")).pack(anchor="w")
        ttk.Label(header, text="Genera → selecciona → valida → coloca → registra → sincroniza.",
                  font=("Segoe UI", 10)).pack(anchor="w", pady=(3, 0))

        left = ttk.Frame(self, padding=(14, 0, 8, 14))
        left.grid(row=1, column=0, sticky="nsw")
        ttk.Label(left, text="ASSETS", font=("Segoe UI", 10, "bold")).pack(anchor="w")
        filter_row = ttk.Frame(left)
        filter_row.pack(fill="x", pady=(4, 4))
        filter_entry = ttk.Entry(filter_row, textvariable=self.asset_filter_var)
        filter_entry.pack(side="left", fill="x", expand=True)
        filter_entry.focus_set()
        ttk.Label(left, textvariable=self.catalog_status_var).pack(anchor="w")

        self.asset_list = tk.Listbox(left, width=34, height=28, exportselection=False)
        self.asset_list.pack(fill="y", expand=True, pady=(8, 0))
        self.asset_list.bind("<<ListboxSelect>>", self._on_asset_selected)
        self.asset_filter_var.trace_add("write", lambda *_: self._refresh_asset_list())

        right = ttk.Frame(self, padding=(8, 0, 14, 14))
        right.grid(row=1, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)

        ttk.Label(right, textvariable=self.asset_title_var,
                  font=("Segoe UI", 16, "bold")).grid(row=0, column=0, sticky="w")

        self.info = tk.Text(right, height=6, wrap="word", state="disabled")
        self.info.grid(row=1, column=0, sticky="ew", pady=(8, 8))

        prompt_frame = ttk.LabelFrame(right, text="PROMPT DE PRODUCCIÓN", padding=8)
        prompt_frame.grid(row=2, column=0, sticky="ew", pady=(0, 8))
        prompt_frame.columnconfigure(0, weight=1)
        self.prompt_text = tk.Text(prompt_frame, height=6, wrap="word")
        self.prompt_text.grid(row=0, column=0, sticky="ew")
        self.prompt_text.configure(state="disabled")
        ttk.Button(prompt_frame, text="COPIAR PROMPT",
                   command=self.copy_prompt).grid(row=0, column=1, sticky="ns", padx=(8, 0))

        negative_frame = ttk.LabelFrame(right, text="NEGATIVE PROMPT", padding=8)
        negative_frame.grid(row=3, column=0, sticky="ew", pady=(0, 10))
        negative_frame.columnconfigure(0, weight=1)
        self.negative_text = tk.Text(negative_frame, height=3, wrap="word")
        self.negative_text.grid(row=0, column=0, sticky="ew")
        self.negative_text.configure(state="disabled")
        ttk.Button(negative_frame, text="COPIAR NEGATIVE",
                   command=self.copy_negative_prompt).grid(row=0, column=1, sticky="ns", padx=(8, 0))
        ttk.Button(negative_frame, text="COPIAR TODO",
                   command=self.copy_full_prompt).grid(row=0, column=2, sticky="ns", padx=(8, 0))

        upload_row = ttk.Frame(right)
        upload_row.grid(row=4, column=0, sticky="ew")
        ttk.Button(upload_row, text="+ SUBIR IMAGEN",
                   command=self.choose_image).pack(side="left")
        ttk.Label(upload_row, textvariable=self.file_var).pack(side="left", padx=12)

        self.preview = ttk.Label(right, text="Vista previa\n\nSin imagen",
                                 anchor="center", relief="solid")
        self.preview.grid(row=5, column=0, sticky="nsew", pady=12)
        right.rowconfigure(5, weight=1)

        ttk.Label(right, textvariable=self.validation_var).grid(
            row=6, column=0, sticky="w", pady=(0, 10))

        actions_primary = ttk.Frame(right)
        actions_primary.grid(row=7, column=0, sticky="ew")
        ttk.Button(actions_primary, text="PREPARAR ASSET",
                   command=self.prepare_asset).pack(side="left")
        ttk.Button(actions_primary, text="PREPARAR + SIGUIENTE",
                   command=self.prepare_and_next).pack(side="left", padx=8)
        ttk.Button(actions_primary, text="LIMPIAR",
                   command=self.clear_selection).pack(side="left")

        actions_tools = ttk.Frame(right)
        actions_tools.grid(row=8, column=0, sticky="ew", pady=(8, 0))
        ttk.Button(actions_tools, text="COPIAR DESTINO",
                   command=self.copy_destination).pack(side="left")
        ttk.Button(actions_tools, text="ABRIR CARPETA",
                   command=self.open_destination).pack(side="left", padx=8)
        ttk.Button(actions_tools, text="ABRIR REPOSITORIO",
                   command=self.open_repo).pack(side="left")
        ttk.Button(actions_tools, text="HISTORIAL",
                   command=self.show_history).pack(side="left", padx=8)
        ttk.Button(actions_tools, text="DIAGNÓSTICO PC",
                   command=self.run_diagnostics).pack(side="left", padx=8)
        ttk.Button(actions_tools, text="GENERADOR PERSONAJE",
                   command=self.open_character_generator).pack(side="left", padx=8)
        ttk.Button(actions_tools, text="GIT STATUS",
                   command=self.git_status).pack(side="left")
        ttk.Button(actions_tools, text="GIT PUSH",
                   command=self.git_push).pack(side="left", padx=(8, 0))

        bottom = ttk.Frame(self, padding=(14, 0, 14, 12))
        bottom.grid(row=2, column=0, columnspan=2, sticky="ew")
        bottom.columnconfigure(1, weight=1)
        ttk.Label(bottom, text="Repositorio local:").grid(row=0, column=0, sticky="w")
        ttk.Entry(bottom, textvariable=self.path_var).grid(row=0, column=1, sticky="ew", padx=8)
        ttk.Button(bottom, text="Elegir...", command=self.choose_repo).grid(row=0, column=2)
        ttk.Label(bottom, textvariable=self.status_var).grid(
            row=1, column=0, columnspan=3, sticky="w", pady=(8, 0))

    def _visible_assets(self):
        query = self.asset_filter_var.get().strip().lower()
        return [
            asset for asset in self.assets
            if not query
            or query in f"{asset.get('id', '?')} · {asset.get('title', '')}".lower()
        ]

    def _destination_exists(self, asset):
        repo = Path(self.path_var.get()).expanduser()
        if not repo.is_dir():
            return False
        return (repo / asset.get("destination", "")).is_file()

    def _refresh_asset_list(self):
        if not hasattr(self, "asset_list"):
            return

        current_id = self.selected_asset.get("id", "") if self.selected_asset else ""
        visible = self._visible_assets()
        self.asset_list.delete(0, tk.END)

        for asset in visible:
            asset_id = asset.get("id", "")
            done = asset_id in self.prepared_ids or self._destination_exists(asset)
            marker = "✓ " if done else ""
            label = f"{marker}{asset_id} · {asset.get('title', '')}"
            self.asset_list.insert(tk.END, label)

        self.catalog_status_var.set(f"{len(visible)}/{len(self.assets)} assets")

        if visible:
            index = next((i for i, asset in enumerate(visible)
                          if asset.get("id") == current_id), 0)
            self.asset_list.selection_clear(0, tk.END)
            self.asset_list.selection_set(index)
            self.asset_list.see(index)
            self._on_asset_selected()
        else:
            self.selected_asset = None
            self.selected_file = None
            self.asset_title_var.set("Sin resultados")
            self.file_var.set("Ninguna imagen seleccionada")
            self.validation_var.set("Esperando imagen...")
            self.preview_image = None
            self.preview.configure(text="Vista previa\n\nSin imagen", image="")
            self.status_var.set("El filtro no encontró assets.")

    def _populate_assets(self):
        self._refresh_asset_list()

    def _on_asset_selected(self, _event=None):
        selection = self.asset_list.curselection()
        if not selection:
            return

        visible = self._visible_assets()
        index = selection[0]
        if index >= len(visible):
            return

        self.selected_asset = visible[index]
        self.asset_title_var.set(self.selected_asset.get("title", "Asset"))

        expected = self.selected_asset.get("expected", {})
        text = (
            f"ID: {self.selected_asset.get('id', '')}\n"
            f"Destino: {self.selected_asset.get('destination', '')}\n"
            f"Formato: {expected.get('format', 'PNG')}\n"
            f"Dimensiones: {expected.get('width', 'cualquiera')} × "
            f"{expected.get('height', 'cualquiera')}\n"
            f"Máximo: {self._format_bytes(expected.get('max_bytes'))}\n\n"
            f"DESCRIPCIÓN:\n{self.selected_asset.get('description', '')}"
        )
        self.info.configure(state="normal")
        self.info.delete("1.0", tk.END)
        self.info.insert("1.0", text)
        self.info.configure(state="disabled")

        prompt = self.selected_asset.get("prompt", "").strip()
        self.prompt_text.configure(state="normal")
        self.prompt_text.delete("1.0", tk.END)
        self.prompt_text.insert("1.0", prompt)
        self.prompt_text.configure(state="disabled")

        negative = self.selected_asset.get("negative_prompt", "").strip()
        self.negative_text.configure(state="normal")
        self.negative_text.delete("1.0", tk.END)
        self.negative_text.insert("1.0", negative)
        self.negative_text.configure(state="disabled")

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

    def open_character_generator(self):
        try:
            generator = CharacterGenerator(app_dir() / CHARACTER_RULES_NAME)
        except (OSError, ValueError, json.JSONDecodeError) as exc:
            messagebox.showerror("Generador", f"No se pudo cargar el generador:\n{exc}")
            return

        window = tk.Toplevel(self)
        window.title("BotImagen · Generador de personajes")
        window.geometry("1260x820")
        window.minsize(1040, 700)
        window.columnconfigure(0, weight=0)
        window.columnconfigure(1, weight=1)
        window.rowconfigure(1, weight=1)

        ttk.Label(
            window,
            text="GENERADOR DE PERSONAJE",
            font=("Segoe UI", 17, "bold"),
        ).grid(row=0, column=0, columnspan=2, sticky="w", padx=14, pady=(14, 2))
        ttk.Label(
            window,
            text="Estilo fijo: Anime moderno de gacha · Beta universal. AUTO completa rasgos compatibles.",
        ).grid(row=0, column=1, sticky="e", padx=14, pady=(14, 2))

        left = ttk.Frame(window, padding=(14, 8, 8, 10))
        left.grid(row=1, column=0, sticky="nsw")
        left.rowconfigure(0, weight=1)

        notebook = ttk.Notebook(left)
        notebook.grid(row=0, column=0, sticky="nsw")

        variables = {}
        lookups = {}
        category_groups = {
            "IDENTIDAD": (
                "personality", "expression", "pose",
            ),
            "CUERPO": (
                "stature", "height_cm", "body_build",
                "body_proportions", "silhouette", "skin_tone",
            ),
            "ANATOMÍA": (
                "species", "ear_style", "tail_style", "horn_style",
            ),
            "CARA": (
                "face_shape", "eye_shape", "eyes", "pupil_shape",
                "eyebrow_style", "nose_style", "mouth_style", "facial_detail",
            ),
            "CABELLO": (
                "hair_length", "hair_bangs", "hairstyle",
                "hair_arrangement", "hair_texture", "side_hair", "back_hair",
                "hair", "hair_color_pattern", "hair_secondary_color",
            ),
            "VESTUARIO": (
                "outfit", "outer_layer", "footwear", "accessory", "palette_accent",
            ),
            "COMBATE": (
                "voice", "combat_role", "baseball_prop",
            ),
            "DETALLE": (
                "quirk",
            ),
        }

        for group_name, categories in category_groups.items():
            tab = ttk.Frame(notebook, padding=10)
            tab.columnconfigure(1, weight=1)
            notebook.add(tab, text=group_name)
            for row, category in enumerate(categories):
                ttk.Label(
                    tab,
                    text=TRAIT_KEYS.get(category, category.title()),
                    font=("Segoe UI", 9, "bold"),
                ).grid(row=row, column=0, sticky="w", pady=(0, 5))
                options = generator.options(category)
                labels = [option["label"] for option in options]
                lookups[category] = {option["label"]: option["id"] for option in options}
                var = tk.StringVar(value=labels[0])
                variables[category] = var
                ttk.Combobox(
                    tab,
                    textvariable=var,
                    values=labels,
                    state="readonly",
                    width=31,
                ).grid(row=row, column=1, sticky="ew", padx=(10, 0), pady=(0, 7))

        settings = ttk.LabelFrame(left, text="CONTROL DE GENERACIÓN", padding=10)
        settings.grid(row=1, column=0, sticky="ew", pady=(10, 0))
        settings.columnconfigure(0, weight=1)

        ttk.Label(settings, text="Coherencia / variedad").grid(row=0, column=0, sticky="w")
        coherence_var = tk.DoubleVar(value=82.0)
        ttk.Scale(
            settings,
            from_=25,
            to=100,
            variable=coherence_var,
            orient="horizontal",
        ).grid(row=1, column=0, sticky="ew", pady=(3, 5))
        coherence_value = ttk.Label(settings, text="82%")
        coherence_value.grid(row=2, column=0, sticky="w")
        coherence_var.trace_add(
            "write",
            lambda *_: coherence_value.configure(text=f"{coherence_var.get():.0f}%"),
        )

        ttk.Label(
            settings,
            text="100% = muy coherente con tus elecciones.\nMás bajo = más experimentación compatible.",
            justify="left",
        ).grid(row=3, column=0, sticky="w", pady=(6, 0))

        reference = ttk.LabelFrame(left, text="REFERENCIA VISUAL", padding=10)
        reference.grid(row=2, column=0, sticky="ew", pady=(10, 0))
        reference.columnconfigure(0, weight=1)

        reference_options = {
            "Personaje completo": "full_character",
            "Cabello completo": "hair",
            "Corte / peinado": "hairstyle",
            "Coletas / recogidos": "hair_arrangement",
            "Colores y puntas del cabello": "hair_color_pattern",
            "Ojos y pupilas": "pupil_shape",
            "Forma del rostro": "face_shape",
            "Especie / anatomía": "species",
            "Cuerpo / altura": "body_build",
            "Ropa / vestimenta": "outfit",
            "Paleta de color": "palette_accent",
            "Expresión": "expression",
            "Pose": "pose",
            "Rol / equipamiento": "combat_role",
        }
        ref_labels = list(reference_options)
        ref_var = tk.StringVar(value=ref_labels[0])
        ref_combo = ttk.Combobox(
            reference,
            textvariable=ref_var,
            values=ref_labels,
            state="readonly",
        )
        ref_combo.grid(row=0, column=0, sticky="ew")

        actions_ref = ttk.Frame(reference)
        actions_ref.grid(row=1, column=0, sticky="ew", pady=(8, 0))
        ttk.Button(
            actions_ref,
            text="🔎 VER IMÁGENES WEB",
            command=lambda: open_reference(),
        ).pack(side="left")
        ttk.Button(
            actions_ref,
            text="📁 CARPETA",
            command=lambda: open_reference_folder(),
        ).pack(side="left", padx=8)

        right = ttk.Frame(window, padding=(8, 8, 14, 10))
        right.grid(row=1, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)
        right.rowconfigure(1, weight=1)
        right.rowconfigure(3, weight=1)

        profile_box = ttk.LabelFrame(right, text="PERFIL GENERADO", padding=8)
        profile_box.grid(row=0, column=0, sticky="ew")
        profile_box.columnconfigure(0, weight=1)
        profile_text = tk.Text(profile_box, height=9, wrap="word")
        profile_text.grid(row=0, column=0, sticky="ew")
        profile_text.configure(state="disabled")

        prompt_box = ttk.LabelFrame(right, text="PROMPT DE PRODUCCIÓN", padding=8)
        prompt_box.grid(row=1, column=0, sticky="nsew", pady=(10, 0))
        prompt_box.columnconfigure(0, weight=1)
        prompt_box.rowconfigure(0, weight=1)
        prompt_text = tk.Text(prompt_box, wrap="word")
        prompt_text.grid(row=0, column=0, sticky="nsew")
        prompt_text.configure(state="disabled")

        negative_box = ttk.LabelFrame(right, text="NEGATIVE PROMPT", padding=8)
        negative_box.grid(row=2, column=0, sticky="nsew", pady=(10, 0))
        negative_box.columnconfigure(0, weight=1)
        negative_box.rowconfigure(0, weight=1)
        negative_text = tk.Text(negative_box, height=6, wrap="word")
        negative_text.grid(row=0, column=0, sticky="nsew")
        negative_text.configure(state="disabled")

        rationale_box = ttk.LabelFrame(right, text="POR QUÉ EL SISTEMA ELIGIÓ ESTO", padding=8)
        rationale_box.grid(row=3, column=0, sticky="nsew", pady=(10, 0))
        rationale_box.columnconfigure(0, weight=1)
        rationale_box.rowconfigure(0, weight=1)
        rationale_text = tk.Text(rationale_box, wrap="word")
        rationale_text.grid(row=0, column=0, sticky="nsew")
        rationale_text.configure(state="disabled")

        actions = ttk.Frame(window, padding=(14, 0, 14, 14))
        actions.grid(row=2, column=0, columnspan=2, sticky="ew")

        result_holder = {"value": None}

        def write_box(widget, value):
            widget.configure(state="normal")
            widget.delete("1.0", tk.END)
            widget.insert("1.0", value)
            widget.configure(state="disabled")

        def build_selections():
            return {
                category: lookups[category].get(variables[category].get(), "auto")
                for category in variables
            }

        def generate_variant(surprise=False):
            selections = build_selections()
            seed = datetime.now().microsecond
            coherence = coherence_var.get() / 100.0
            effective_coherence = min(coherence, 0.45) if surprise else coherence
            try:
                result = generator.generate(
                    selections,
                    seed=seed,
                    coherence=effective_coherence,
                    surprise=surprise,
                )
            except (ValueError, KeyError, IndexError) as exc:
                messagebox.showerror("Generador", str(exc), parent=window)
                return

            result_holder["value"] = result
            profile = result["profile"]
            labels = result["labels"]

            profile_lines = [
                f"{TRAIT_KEYS.get(category, category.title())}: {labels[category]}"
                for category in variables
            ]
            profile_lines.extend([
                f"Dirección visual: {result['style_direction']}",
                f"Coherencia: {result['coherence'] * 100:.0f}%",
                f"Modo: {'SORPRESA' if result.get('surprise') else 'NORMAL'}",
                f"Seed: {result['seed']}",
                f"⭐ Favoritos guardados: {len(self.character_favorites)}",
            ])
            write_box(profile_text, "\n".join(profile_lines))
            write_box(prompt_text, result["prompt"])
            write_box(negative_text, result["negative_prompt"])
            write_box(
                rationale_text,
                "\n".join(f"• {line}" for line in result["rationale"]),
            )

        def copy_box(widget, empty_message, status):
            value = widget.get("1.0", tk.END).strip()
            if not value:
                messagebox.showinfo("Generador", empty_message, parent=window)
                return
            window.clipboard_clear()
            window.clipboard_append(value)
            window.update()
            self.status_var.set(status)

        def copy_all():
            positive = prompt_text.get("1.0", tk.END).strip()
            negative = negative_text.get("1.0", tk.END).strip()
            if not positive:
                messagebox.showinfo("Generador", "Genera un personaje primero.", parent=window)
                return
            combined = positive
            if negative:
                combined += "\n\nNEGATIVE PROMPT:\n" + negative
            window.clipboard_clear()
            window.clipboard_append(combined)
            window.update()
            self.status_var.set("Prompt + negative prompt del personaje copiados.")

        def open_reference():
            import webbrowser
            from urllib.parse import quote_plus

            result = result_holder["value"]
            selected_key = reference_options.get(ref_var.get(), "full_character")
            if result:
                labels = result["labels"]
                if selected_key == "full_character":
                    query_parts = [
                        "original adult anime game character design",
                        labels["personality"],
                        labels["stature"],
                        labels["hairstyle"],
                        labels["hair"],
                        labels["outfit"],
                        labels["palette_accent"],
                        "clean game character reference",
                    ]
                else:
                    query_parts = [
                        "anime character design reference",
                        labels.get(selected_key, selected_key),
                    ]
                query = " ".join(query_parts)
            else:
                selections = build_selections()
                readable = []
                for category, value in selections.items():
                    if value != "auto":
                        option = next(
                            (item for item in generator.options(category)
                             if item["id"] == value),
                            None,
                        )
                        if option:
                            readable.append(option["label"])
                if not readable:
                    readable = ["anime character hair clothing pose reference"]
                query = " ".join(readable + ["character design reference"])

            url = "https://www.google.com/search?tbm=isch&q=" + quote_plus(query)
            webbrowser.open(url)
            self.status_var.set("Referencia visual abierta en el navegador.")

        def open_reference_folder():
            folder = app_dir() / "references"
            try:
                folder.mkdir(parents=True, exist_ok=True)
                try:
                    os.startfile(folder)
                except AttributeError:
                    subprocess.Popen(["xdg-open", str(folder)])
            except OSError as exc:
                messagebox.showerror("Referencias", str(exc), parent=window)

        def save_favorite():
            result = result_holder["value"]
            if not result:
                messagebox.showwarning(
                    "Favorito",
                    "Genera un personaje primero.",
                    parent=window,
                )
                return

            favorite = {
                "saved_at": datetime.now().astimezone().isoformat(timespec="seconds"),
                "profile": result["profile"],
                "labels": result["labels"],
                "style_direction": result["style_direction"],
                "prompt": result["prompt"],
                "negative_prompt": result["negative_prompt"],
                "seed": result["seed"],
                "coherence": result["coherence"],
                "surprise": result.get("surprise", False),
            }

            key = json.dumps(favorite["profile"], sort_keys=True, ensure_ascii=False)
            existing = {
                json.dumps(item.get("profile", {}), sort_keys=True, ensure_ascii=False)
                for item in self.character_favorites
            }
            if key in existing:
                self.status_var.set("⭐ Ese diseño ya está en favoritos.")
                return

            self.character_favorites.insert(0, favorite)
            self.character_favorites = self.character_favorites[:100]
            try:
                save_json(
                    app_dir() / CHARACTER_FAVORITES_NAME,
                    self.character_favorites,
                )
            except OSError as exc:
                self.character_favorites.pop(0)
                messagebox.showerror("Favorito", str(exc), parent=window)
                return

            self.status_var.set(
                f"⭐ Favorito guardado · {len(self.character_favorites)} diseños"
            )
            write_box(
                profile_text,
                profile_text.get("1.0", tk.END).strip() + "\n⭐ MARCADO COMO FAVORITO",
            )

        def show_favorites():
            fav_window = tk.Toplevel(window)
            fav_window.title("BotImagen · Personajes favoritos")
            fav_window.geometry("980x560")
            fav_window.minsize(760, 420)
            fav_window.columnconfigure(0, weight=1)
            fav_window.rowconfigure(1, weight=1)

            ttk.Label(
                fav_window,
                text=f"⭐ PERSONAJES FAVORITOS · {len(self.character_favorites)}",
                font=("Segoe UI", 12, "bold"),
            ).grid(row=0, column=0, sticky="w", padx=12, pady=(12, 8))

            fav_list = tk.Listbox(fav_window, font=("Consolas", 9))
            fav_list.grid(row=1, column=0, sticky="nsew", padx=12, pady=(0, 8))

            for item in self.character_favorites:
                labels = item.get("labels", {})
                fav_list.insert(
                    tk.END,
                    f"{item.get('saved_at', '')} | "
                    f"{labels.get('personality', '?')} | "
                    f"{labels.get('stature', '?')} | "
                    f"{labels.get('hair', '?')} | "
                    f"{labels.get('outfit', '?')} | "
                    f"{labels.get('quirk', '?')}",
                )

            def inspect(_event=None):
                selection = fav_list.curselection()
                if not selection:
                    return
                item = self.character_favorites[selection[0]]
                inspect_window = tk.Toplevel(fav_window)
                inspect_window.title("BotImagen · Favorito")
                inspect_window.geometry("900x620")
                inspect_window.columnconfigure(0, weight=1)
                inspect_window.rowconfigure(1, weight=1)

                labels = item.get("labels", {})
                profile_lines = [
                    f"{TRAIT_KEYS.get(category, category.title())}: {labels.get(category, '?')}"
                    for category in variables
                    if category in labels
                ]
                profile_lines += [
                    f"Dirección visual: {item.get('style_direction', '')}",
                    f"Seed: {item.get('seed', '')}",
                    f"Coherencia: {float(item.get('coherence', 0)) * 100:.0f}%",
                ]

                frame = ttk.Frame(inspect_window, padding=12)
                frame.grid(row=0, column=0, sticky="ew")
                ttk.Label(frame, text="PERFIL", font=("Segoe UI", 11, "bold")).pack(anchor="w")
                box = tk.Text(frame, height=12, wrap="word")
                box.pack(fill="x", pady=(6, 0))
                box.insert("1.0", "\n".join(profile_lines))
                box.configure(state="disabled")

                prompt_frame = ttk.LabelFrame(
                    inspect_window,
                    text="PROMPT DE PRODUCCIÓN",
                    padding=8,
                )
                prompt_frame.grid(row=1, column=0, sticky="nsew", padx=12, pady=(8, 12))
                prompt_frame.columnconfigure(0, weight=1)
                prompt_frame.rowconfigure(0, weight=1)
                prompt_box = tk.Text(prompt_frame, wrap="word")
                prompt_box.grid(row=0, column=0, sticky="nsew")
                prompt_box.insert("1.0", item.get("prompt", ""))
                prompt_box.configure(state="disabled")

            fav_list.bind("<Double-Button-1>", inspect)
            ttk.Button(
                fav_window,
                text="CERRAR",
                command=fav_window.destroy,
            ).grid(row=2, column=0, sticky="e", padx=12, pady=(0, 12))

        def surprise_variant():
            generate_variant(surprise=True)

        def save_profile():
            result = result_holder["value"]
            if not result:
                messagebox.showwarning("Generador", "Genera un personaje primero.", parent=window)
                return
            folder = app_dir() / "generated_characters"
            try:
                folder.mkdir(parents=True, exist_ok=True)
                filename = folder / f"character_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                save_json(filename, result)
            except OSError as exc:
                messagebox.showerror("Generador", str(exc), parent=window)
                return
            self.status_var.set(f"Perfil guardado: {filename.name}")
            messagebox.showinfo("Generador", f"Perfil guardado en:\n{filename}", parent=window)

        ttk.Button(
            actions,
            text="✨ GENERAR / VARIAR",
            command=generate_variant,
        ).pack(side="left")
        ttk.Button(
            actions,
            text="🎲 SORPRÉNDEME",
            command=surprise_variant,
        ).pack(side="left", padx=8)
        ttk.Button(
            actions,
            text="COPIAR PROMPT",
            command=lambda: copy_box(
                prompt_text,
                "Genera un personaje primero.",
                "Prompt de personaje copiado.",
            ),
        ).pack(side="left", padx=8)
        ttk.Button(
            actions,
            text="COPIAR NEGATIVE",
            command=lambda: copy_box(
                negative_text,
                "Genera un personaje primero.",
                "Negative prompt copiado.",
            ),
        ).pack(side="left")
        ttk.Button(actions, text="COPIAR TODO", command=copy_all).pack(side="left", padx=8)
        ttk.Button(actions, text="⭐ FAVORITO", command=save_favorite).pack(side="left")
        ttk.Button(actions, text="⭐ VER FAVORITOS", command=show_favorites).pack(side="left", padx=8)
        ttk.Button(actions, text="GUARDAR PERFIL", command=save_profile).pack(side="left")
        ttk.Button(actions, text="CERRAR", command=window.destroy).pack(side="right")

        generate_variant()

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
        self.status_var.set("Prompt de producción copiado.")

    def copy_negative_prompt(self):
        if not self.selected_asset:
            return
        negative = self.selected_asset.get("negative_prompt", "").strip()
        if not negative:
            messagebox.showinfo("Negative Prompt", "Este asset no tiene negative prompt.")
            return
        self.clipboard_clear()
        self.clipboard_append(negative)
        self.update()
        self.status_var.set("Negative prompt copiado.")

    def copy_full_prompt(self):
        if not self.selected_asset:
            return
        positive = self.selected_asset.get("prompt", "").strip()
        negative = self.selected_asset.get("negative_prompt", "").strip()
        if not positive:
            messagebox.showinfo("Prompt", "Este asset no tiene prompt.")
            return
        combined = positive
        if negative:
            combined += "\n\nNEGATIVE PROMPT:\n" + negative
        self.clipboard_clear()
        self.clipboard_append(combined)
        self.update()
        self.status_var.set("Prompt + negative prompt copiados.")

    def copy_destination(self):
        if not self.selected_asset:
            return
        repo = Path(self.path_var.get()).expanduser()
        destination = repo / self.selected_asset.get("destination", "")
        self.clipboard_clear()
        self.clipboard_append(str(destination))
        self.update()
        self.status_var.set("Ruta de destino copiada.")

    def clear_selection(self):
        self.selected_file = None
        self.file_var.set("Ninguna imagen seleccionada")
        self.validation_var.set("Esperando imagen...")
        self.preview_image = None
        self.preview.configure(text="Vista previa\n\nSin imagen", image="")
        self.status_var.set("Selección de imagen limpiada.")

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
            scale = max(
                1,
                (width + max_w - 1) // max_w,
                (height + max_h - 1) // max_h,
            )
            if scale > 1:
                image = image.subsample(scale, scale)
            self.preview_image = image
            self.preview.configure(text="", image=self.preview_image)
        except (tk.TclError, OSError) as exc:
            self.preview_image = None
            self.preview.configure(
                text=f"No se puede previsualizar esta imagen.\n{exc}",
                image="",
            )

    def validate_image(self):
        if not self.selected_file or not self.selected_asset:
            return False

        errors = []
        expected = self.selected_asset.get("expected", {})
        suffix = self.selected_file.suffix.lower()

        if expected.get("format", "PNG").upper() == "PNG" and suffix != ".png":
            errors.append("Se requiere PNG.")

        width = height = None
        size = None
        try:
            probe = tk.PhotoImage(file=str(self.selected_file))
            width, height = probe.width(), probe.height()
        except (tk.TclError, OSError) as exc:
            errors.append(f"No se pudo leer la imagen: {exc}")

        if width and expected.get("width") and width != expected["width"]:
            errors.append(
                f"Ancho incorrecto: {width}px; esperado {expected['width']}px."
            )
        if height and expected.get("height") and height != expected["height"]:
            errors.append(
                f"Alto incorrecto: {height}px; esperado {expected['height']}px."
            )

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
        self.validation_var.set(
            f"✅ PASS · {dimensions} · {self._format_bytes(size)}"
        )
        return True

    def prepare_asset(self):
        if not self.selected_asset or not self.selected_file:
            messagebox.showwarning(
                "Falta imagen",
                "Selecciona primero un asset y una imagen.",
            )
            return False

        if not self.validate_image():
            messagebox.showerror(
                "Validación fallida",
                "Corrige la imagen antes de prepararla.",
            )
            return False

        repo = Path(self.path_var.get()).expanduser()
        if not repo.is_dir():
            messagebox.showerror(
                "Repositorio",
                "Selecciona una carpeta de repositorio válida.",
            )
            return False

        destination = repo / self.selected_asset["destination"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        replacing = destination.exists()

        if replacing:
            replace = messagebox.askyesno(
                "Reemplazar asset",
                f"Ya existe:\n{destination}\n\n¿Quieres reemplazarlo?",
            )
            if not replace:
                return False

        try:
            shutil.copy2(self.selected_file, destination)
        except shutil.SameFileError:
            messagebox.showwarning(
                "Sin cambios",
                "La imagen seleccionada ya es el mismo archivo de destino.",
            )
            return False
        except OSError as exc:
            messagebox.showerror("Error al copiar", str(exc))
            return False

        self.prepared_ids.add(self.selected_asset.get("id", ""))
        self._record_history(
            self.selected_asset,
            self.selected_file,
            destination,
            "replace" if replacing else "copy",
        )
        self._refresh_asset_labels()
        self.validation_var.set(
            f"✅ PREPARADO · {destination.name} · {self._format_bytes(destination.stat().st_size)}"
        )
        self.status_var.set(f"✅ Asset preparado: {destination}")
        return True

    def prepare_and_next(self):
        if not self.prepare_asset():
            return

        visible = self._visible_assets()
        current_id = self.selected_asset.get("id", "") if self.selected_asset else ""
        current_index = next(
            (index for index, asset in enumerate(visible)
             if asset.get("id", "") == current_id),
            -1,
        )
        if current_index < 0 or current_index + 1 >= len(visible):
            self.status_var.set("✅ Asset preparado. No quedan más assets en el filtro.")
            return

        next_asset = visible[current_index + 1]
        self._select_asset_by_id(next_asset.get("id", ""))
        self.status_var.set(
            f"➡ Siguiente asset: {next_asset.get('id', '')} · "
            f"{next_asset.get('title', '')}"
        )

    def run_diagnostics(self):
        doctor = app_dir() / "doctor.py"
        if not doctor.exists():
            messagebox.showwarning(
                "Diagnóstico",
                "No se encontró doctor.py en la carpeta de BotImagen.",
            )
            return

        try:
            result = subprocess.run(
                [self._python_executable(), str(doctor)],
                cwd=app_dir(),
                text=True,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
            )
        except OSError as exc:
            messagebox.showerror("Diagnóstico", str(exc))
            return

        output = (result.stdout + "\n" + result.stderr).strip()
        window = tk.Toplevel(self)
        window.title("BotImagen · Diagnóstico PC")
        window.geometry("760x520")
        window.minsize(620, 420)

        ttk.Label(
            window,
            text="DIAGNÓSTICO DEL PC",
            font=("Segoe UI", 12, "bold"),
        ).pack(anchor="w", padx=12, pady=(12, 6))

        box = tk.Text(window, wrap="word")
        box.pack(fill="both", expand=True, padx=12, pady=(0, 10))
        box.insert("1.0", output or "Sin salida.")
        box.configure(state="disabled")

        status = "PASS" if result.returncode == 0 else "REVISAR"
        ttk.Label(window, text=f"Resultado: {status}").pack(
            anchor="w", padx=12, pady=(0, 10)
        )
        ttk.Button(window, text="CERRAR", command=window.destroy).pack(
            side="right", padx=12, pady=(0, 12)
        )

    @staticmethod
    def _python_executable():
        return os.environ.get("PYTHON_EXECUTABLE") or shutil.which("python") or "python"

    def _refresh_asset_labels(self):
        current_file = self.selected_file
        current_id = self.selected_asset.get("id", "") if self.selected_asset else ""
        self._refresh_asset_list()
        if current_id:
            self._select_asset_by_id(current_id)
            self.selected_file = current_file
            if current_file:
                self.file_var.set(current_file.name)
                self.show_preview()
                self.validate_image()

    def _select_asset_by_id(self, asset_id):
        visible = self._visible_assets()
        for index, asset in enumerate(visible):
            if asset.get("id", "") == asset_id:
                self.asset_list.selection_clear(0, tk.END)
                self.asset_list.selection_set(index)
                self.asset_list.see(index)
                self._on_asset_selected()
                return True
        return False

    def _record_history(self, asset, source, destination, action):
        record = {
            "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
            "asset_id": asset.get("id", ""),
            "title": asset.get("title", ""),
            "source": str(source),
            "destination": str(destination),
            "bytes": destination.stat().st_size if destination.exists() else 0,
            "action": action,
        }
        self.history.insert(0, record)
        self.history = self.history[:MAX_HISTORY_ITEMS]
        try:
            save_json(app_dir() / HISTORY_NAME, self.history)
        except OSError:
            self.status_var.set("⚠ Asset preparado, pero no se pudo guardar el historial.")

    def show_history(self):
        window = tk.Toplevel(self)
        window.title("BotImagen · Historial")
        window.geometry("900x460")
        window.minsize(720, 360)

        ttk.Label(
            window,
            text=f"ÚLTIMOS {min(len(self.history), MAX_HISTORY_ITEMS)} IMPORTS",
            font=("Segoe UI", 11, "bold"),
        ).pack(anchor="w", padx=12, pady=(12, 6))

        listbox = tk.Listbox(window, font=("Consolas", 9))
        listbox.pack(fill="both", expand=True, padx=12, pady=(0, 8))

        for record in self.history:
            timestamp = record.get("timestamp", "").replace("T", " ", 1)
            action = "REPLACE" if record.get("action") == "replace" else "COPY"
            listbox.insert(
                tk.END,
                f"{timestamp} | {action:7} | {record.get('asset_id', '')} | {record.get('destination', '')}",
            )

        ttk.Label(
            window,
            text="Doble clic sobre una entrada para abrir su carpeta de destino.",
        ).pack(anchor="w", padx=12, pady=(0, 10))

        def open_selected(_event=None):
            selection = listbox.curselection()
            if not selection:
                return
            record = self.history[selection[0]]
            destination = Path(record.get("destination", ""))
            folder = destination.parent
            if not folder.exists():
                messagebox.showwarning(
                    "Historial",
                    f"La carpeta ya no existe:\n{folder}",
                    parent=window,
                )
                return
            try:
                os.startfile(folder)
            except AttributeError:
                subprocess.Popen(["xdg-open", str(folder)])

        listbox.bind("<Double-Button-1>", open_selected)
        ttk.Button(window, text="CERRAR", command=window.destroy).pack(
            side="right", padx=12, pady=(0, 12)
        )

    def choose_repo(self):
        path = filedialog.askdirectory(title="Seleccionar repositorio local")
        if not path:
            return
        self.path_var.set(path)
        self.config_data["repo_path"] = path
        try:
            save_json(app_dir() / CONFIG_NAME, self.config_data)
        except OSError as exc:
            messagebox.showerror("Configuración", str(exc))
            return
        self._refresh_asset_list()
        self.status_var.set(f"Repositorio configurado: {path}")

    def open_repo(self):
        repo = Path(self.path_var.get()).expanduser()
        if not repo.is_dir():
            messagebox.showerror("Repositorio", "Selecciona una carpeta de repositorio válida.")
            return
        try:
            os.startfile(repo)
        except AttributeError:
            subprocess.Popen(["xdg-open", str(repo)])

    def open_destination(self):
        if not self.selected_asset:
            messagebox.showwarning("Destino", "Selecciona un asset primero.")
            return

        repo = Path(self.path_var.get()).expanduser()
        destination = repo / self.selected_asset["destination"]
        folder = destination.parent
        try:
            folder.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            messagebox.showerror("Destino", str(exc))
            return

        try:
            if destination.exists():
                os.startfile(destination)
            else:
                os.startfile(folder)
        except AttributeError:
            subprocess.Popen(["xdg-open", str(destination if destination.exists() else folder)])

    def run_git(self, args):
        repo = Path(self.path_var.get()).expanduser()
        if not (repo / ".git").exists():
            messagebox.showerror(
                "Git",
                "La carpeta seleccionada no parece ser un repositorio Git.",
            )
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
                messagebox.showerror(
                    "Git",
                    result.stderr.strip() or "Git devolvió un error.",
                )
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
            messagebox.showerror(
                "Git",
                "La carpeta seleccionada no parece ser un repositorio Git.",
            )
            return

        if not self.selected_asset:
            messagebox.showwarning("Git", "Selecciona un asset primero.")
            return

        destination = repo / self.selected_asset["destination"]
        relative = destination.relative_to(repo).as_posix()
        status = self.run_git(["status", "--short", "--", relative])
        if status is None:
            return
        if not status:
            messagebox.showinfo("Git", "No hay cambios pendientes para este asset.")
            return

        if not messagebox.askyesno(
            "Sincronizar asset",
            f"Se hará git add del asset, commit y push:\n\n{relative}\n\n¿Continuar?",
        ):
            return

        if self.run_git(["add", "--", relative]) is None:
            return

        staged = self.run_git(["diff", "--cached", "--name-only"])
        if staged is None:
            return

        staged_files = [line.strip() for line in staged.splitlines() if line.strip()]
        if staged_files != [relative]:
            messagebox.showerror(
                "Git",
                "La operación se detuvo porque el índice contiene archivos distintos al asset seleccionado.",
            )
            self.run_git(["reset", "--", relative])
            return

        if self.run_git([
            "commit",
            "-m",
            f"asset: intake {self.selected_asset.get('id', 'update')}",
        ]) is None:
            return

        if self.run_git(["push"]) is None:
            return

        self.status_var.set("✅ Asset enviado a GitHub.")
        messagebox.showinfo("Git", "Asset enviado correctamente a GitHub.")


if __name__ == "__main__":
    app = AssetIntake()
    app.mainloop()
