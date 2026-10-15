from __future__ import annotations

import base64
import io
import json
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_generator import CharacterGenerator
from botimagen_server import ApiInputError, generate_from_payload, make_asset_contract_catalog, make_catalog, make_handler


class LocalApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.generator = CharacterGenerator(ROOT / "character_rules.json")

    def test_catalog_is_loaded_from_real_rules(self):
        catalog = make_catalog(self.generator)
        self.assertEqual(catalog["style"]["id"], "bw-modern-gacha-v1")
        self.assertEqual(catalog["categories"]["species"][0]["id"], "humana")
        self.assertIn("hair_color_pattern", catalog["categories"])
        self.assertIn("hair_tip_color", catalog["categories"])
        self.assertIn("compatible_with", catalog["categories"]["ear_style"][1])
        self.assertIn("species", catalog["categories"]["ear_style"][1]["compatible_with"])
        self.assertEqual(catalog["catalog_version"], 16)
        outer_layer = next(
            option for option in catalog["categories"]["outer_layer"]
            if option["id"] == "long_coat"
        )
        self.assertEqual(
            outer_layer["compatible_with"]["combat_role"],
            ["control", "support", "pitcher"],
        )
        footwear = next(
            option for option in catalog["categories"]["footwear"]
            if option["id"] == "calzado_ligero_pitcher"
        )
        self.assertEqual(footwear["compatible_with"]["combat_role"], ["pitcher"])
        accessory = next(
            option for option in catalog["categories"]["accessory"]
            if option["id"] == "headband"
        )
        self.assertEqual(
            accessory["compatible_with"]["combat_role"],
            ["striker", "support", "pitcher"],
        )

        for prop in catalog["categories"]["baseball_prop"]:
            source = next(
                item for item in self.generator.categories["baseball_prop"]
                if item["id"] == prop["id"]
            )
            self.assertEqual(
                prop.get("compatible_with"),
                source.get("compatible_with"),
                prop["id"],
            )

        long_style = next(
            item for item in catalog["categories"]["hairstyle"]
            if item["id"] == "long_straight"
        )
        self.assertIn("extra_largo", long_style["compatible_with"]["hair_length"])
        self.assertIn(
            "pixie",
            next(
                item for item in catalog["categories"]["hair_arrangement"]
                if item["id"] == "suelto"
            )["compatible_with"]["hair_length"],
        )

    def test_catalog_preserves_declared_metadata_for_every_option(self):
        catalog = make_catalog(self.generator)
        self.assertEqual(set(catalog["categories"]), set(self.generator.categories))

        compatibility_values = 0
        for category, source_options in self.generator.categories.items():
            public_options = catalog["categories"][category]
            self.assertEqual(len(public_options), len(source_options), category)
            for source, public in zip(source_options, public_options, strict=True):
                self.assertEqual(public["id"], source["id"], (category, source["id"]))
                self.assertEqual(public["label"], source["label"], (category, source["id"]))
                self.assertEqual(public["tags"], source.get("tags", []), (category, source["id"]))

                if isinstance(source.get("color_family"), str):
                    self.assertEqual(
                        public.get("color_family"),
                        source["color_family"],
                        (category, source["id"], "color_family"),
                    )
                else:
                    self.assertNotIn("color_family", public, (category, source["id"]))

                compatible = source.get("compatible_with")
                if isinstance(compatible, dict):
                    compatibility_values += sum(len(values) for values in compatible.values())
                    self.assertEqual(
                        public.get("compatible_with"),
                        compatible,
                        (category, source["id"], "compatible_with"),
                    )
                else:
                    self.assertNotIn("compatible_with", public, (category, source["id"]))

                # The public catalog needs editor metadata, not internal generation internals.
                self.assertNotIn("bias", public, (category, source["id"], "bias"))
                self.assertNotIn("prompt_en", public, (category, source["id"], "prompt_en"))

        self.assertGreaterEqual(
            compatibility_values,
            100,
            "The API must preserve the active compatibility graph",
        )

    def test_generate_returns_official_engine_output(self):
        result = generate_from_payload(
            {"selections": {
                "species": "draconica", "hair": "rojo_coral", "eyes": "ambar",
                "body_build": "fuerte_guardiana", "pupil_shape": "estrella",
            }, "seed": 12007, "coherence": 0.9, "surprise": False},
            self.generator,
        )
        self.assertEqual(result["profile"]["species"], "draconica")
        self.assertEqual(result["profile"]["hair"], "rojo_coral")
        self.assertEqual(result["profile"]["eyes"], "ambar")
        self.assertEqual(result["profile"]["body_build"], "fuerte_guardiana")
        self.assertEqual(result["profile"]["pupil_shape"], "estrella")
        self.assertEqual(result["seed"], 12007)
        self.assertEqual(result["style_id"], "bw-modern-gacha-v1")
        self.assertTrue(result["prompt"])
        self.assertTrue(result["negative_prompt"])

    def test_same_seed_reproduces_profile(self):
        payload = {"selections": {"species": "draconica"}, "seed": 2718, "coherence": 0.82}
        first = generate_from_payload(payload, self.generator)
        second = generate_from_payload(payload, self.generator)
        self.assertEqual(first["profile"], second["profile"])
        self.assertEqual(first["prompt"], second["prompt"])

    def test_rejects_unknown_field_and_option(self):
        with self.assertRaises(ApiInputError):
            generate_from_payload({"selections": {"made_up_field": "red"}}, self.generator)
        with self.assertRaises(ApiInputError):
            generate_from_payload({"selections": {"hair": "acuamarina_inventada"}}, self.generator)

    def test_rejects_bad_numeric_and_unknown_top_level_inputs(self):
        with self.assertRaises(ApiInputError):
            generate_from_payload({"seed": True}, self.generator)
        with self.assertRaises(ApiInputError):
            generate_from_payload({"coherence": 1.5}, self.generator)
        with self.assertRaises(ApiInputError):
            generate_from_payload({"exec": "del files"}, self.generator)

    def test_http_health_catalog_generate_and_profile_persistence(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.generator, Path(temp_dir)))
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=3)
            try:
                connection.request("GET", "/api/health")
                response = connection.getresponse()
                health = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(health["status"], "ok")

                connection.request("GET", "/api/catalog")
                response = connection.getresponse()
                catalog = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertIn("draconica", [item["id"] for item in catalog["categories"]["species"]])

                payload = json.dumps({"selections": {"species": "draconica"}, "seed": 12}).encode("utf-8")
                connection.request("POST", "/api/generate", body=payload, headers={"Content-Type": "application/json"})
                response = connection.getresponse()
                result = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(result["profile"]["species"], "draconica")

                invalid = json.dumps({"selections": {"hair": "not-in-catalog"}}).encode("utf-8")
                connection.request("POST", "/api/generate", body=invalid, headers={"Content-Type": "application/json"})
                response = connection.getresponse()
                error = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 400)
                self.assertIn("no disponible", error["error"])

                saved_payload = json.dumps({
                    "name": "Dragonkin rojo",
                    "profile": {"style_id": "bw-modern-gacha-v1", "seed": 12, "values": {"species": "draconica"}}
                }).encode("utf-8")
                connection.request("POST", "/api/profiles", body=saved_payload, headers={"Content-Type": "application/json"})
                response = connection.getresponse()
                saved = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 201)
                self.assertEqual(saved["name"], "Dragonkin rojo")
                self.assertRegex(saved["id"], r"^[0-9a-f-]{36}$")

                connection.request("GET", "/api/profiles")
                response = connection.getresponse()
                listing = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(len(listing["profiles"]), 1)
                self.assertEqual(listing["profiles"][0]["id"], saved["id"])

                connection.request("GET", "/api/profiles/" + saved["id"])
                response = connection.getresponse()
                loaded = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(loaded["profile"]["values"]["species"], "draconica")

                duplicate_payload = json.dumps({
                    "name": "Dragonkin rojo · Copia",
                    "profile": loaded["profile"],
                }).encode("utf-8")
                connection.request("POST", "/api/profiles", body=duplicate_payload, headers={"Content-Type": "application/json"})
                response = connection.getresponse()
                duplicate = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 201)
                self.assertEqual(duplicate["name"], "Dragonkin rojo · Copia")
                self.assertNotEqual(duplicate["id"], saved["id"])

                connection.request("GET", "/api/profiles/" + saved["id"])
                response = connection.getresponse()
                original_after_copy = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(original_after_copy["name"], "Dragonkin rojo")
                self.assertEqual(original_after_copy["profile"], loaded["profile"])

                connection.request("GET", "/api/profiles")
                response = connection.getresponse()
                duplicated_listing = json.loads(response.read().decode("utf-8"))
                self.assertEqual(response.status, 200)
                self.assertEqual(len(duplicated_listing["profiles"]), 2)
                self.assertEqual(
                    {item["id"] for item in duplicated_listing["profiles"]},
                    {saved["id"], duplicate["id"]},
                )

                connection.request("GET", "/api/profiles/../../README.md")
                response = connection.getresponse()
                response.read()
                self.assertIn(response.status, (400, 404))
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


    def test_http_rejects_malformed_json_and_non_utf8_body(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0),
                make_handler(self.generator, Path(temp_dir)),
            )
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                cases = (
                    (b"{", "JSON inválido."),
                    (b"\xff", "UTF-8"),
                )
                for body, expected_error in cases:
                    connection = HTTPConnection(
                        "127.0.0.1", server.server_address[1], timeout=3
                    )
                    try:
                        connection.request(
                            "POST",
                            "/api/generate",
                            body=body,
                            headers={"Content-Type": "application/json"},
                        )
                        response = connection.getresponse()
                        payload = json.loads(response.read().decode("utf-8"))
                        self.assertEqual(response.status, 400)
                        self.assertIn(expected_error, payload["error"])
                    finally:
                        connection.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


    def test_http_rejects_unsupported_content_type_and_oversized_body(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0),
                make_handler(self.generator, Path(temp_dir)),
            )
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                # Use a fresh connection for each rejected request. In the
                # oversized case, the declared body is intentionally not sent:
                # the server must reject by length before reading it.
                connection = HTTPConnection(
                    "127.0.0.1", server.server_address[1], timeout=3
                )
                try:
                    connection.request(
                        "POST",
                        "/api/generate",
                        body=b'{"selections": {}}',
                        headers={"Content-Type": "text/plain"},
                    )
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 415)
                    self.assertIn("Content-Type", payload["error"])
                finally:
                    connection.close()

                connection = HTTPConnection(
                    "127.0.0.1", server.server_address[1], timeout=3
                )
                try:
                    connection.putrequest("POST", "/api/generate")
                    connection.putheader("Content-Type", "application/json")
                    connection.endheaders()
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 411)
                    self.assertIn("Content-Length", payload["error"])
                finally:
                    connection.close()

                connection = HTTPConnection(
                    "127.0.0.1", server.server_address[1], timeout=3
                )
                try:
                    connection.putrequest("POST", "/api/generate")
                    connection.putheader("Content-Type", "application/json")
                    connection.putheader("Content-Length", str(64 * 1024 + 1))
                    connection.endheaders()
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 413)
                    self.assertIn("64 KiB", payload["error"])
                finally:
                    connection.close()

                connection = HTTPConnection(
                    "127.0.0.1", server.server_address[1], timeout=3
                )
                try:
                    connection.request("PUT", "/api/generate")
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 405)
                    self.assertEqual(
                        response.getheader("Content-Type"),
                        "application/json; charset=utf-8",
                    )
                    self.assertEqual(response.getheader("Allow"), "POST")
                    self.assertIn("Método HTTP", payload["error"])
                finally:
                    connection.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


    def test_asset_contract_catalog_is_manifest_backed_and_path_safe(self):
        catalog = make_asset_contract_catalog(ROOT / "assets_manifest.json")
        manifest = json.loads((ROOT / "assets_manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(catalog["manifest_version"], manifest["version"])
        self.assertEqual(catalog["count"], len(manifest["assets"]))
        self.assertEqual(
            [item["id"] for item in catalog["contracts"]],
            [item["id"] for item in manifest["assets"]],
        )
        for contract in catalog["contracts"]:
            self.assertTrue(contract["destination"].endswith(".png"))
            self.assertFalse(contract["destination"].startswith("/"))
            self.assertNotIn("..", Path(contract["destination"]).parts)
            self.assertIn("format", contract["expected"])
            self.assertNotIn("source_url", contract)
            self.assertNotIn("creator", contract)

        with tempfile.TemporaryDirectory() as temp_dir:
            unsafe_manifest = {
                "version": 1,
                "assets": [{
                    "id": "asset.unsafe",
                    "title": "Unsafe destination",
                    "description": "Should fail closed.",
                    "prompt": "test prompt",
                    "negative_prompt": "test negative prompt",
                    "prompt_version": "production-v2",
                    "destination": "../outside.png",
                    "expected": {"format": "PNG"},
                }],
            }
            unsafe_path = Path(temp_dir) / "manifest.json"
            unsafe_path.write_text(json.dumps(unsafe_manifest), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "fuera de la raíz"):
                make_asset_contract_catalog(unsafe_path)

    def test_http_asset_contract_endpoint_and_method_allowlist(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0),
                make_handler(self.generator, Path(temp_dir)),
            )
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=3)
                try:
                    connection.request("GET", "/api/assets/contracts")
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 200)
                    self.assertEqual(payload["count"], 10)
                    self.assertEqual(payload["manifest_version"], 1)
                    self.assertIn("stage.background.far", [item["id"] for item in payload["contracts"]])
                    self.assertTrue(payload["contracts"][0]["prompt"])
                finally:
                    connection.close()

                connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=3)
                try:
                    connection.request("PUT", "/api/assets/contracts")
                    response = connection.getresponse()
                    payload = json.loads(response.read().decode("utf-8"))
                    self.assertEqual(response.status, 405)
                    self.assertEqual(response.getheader("Allow"), "GET")
                    self.assertIn("Método HTTP", payload["error"])
                finally:
                    connection.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


    def test_character_model_builder_http_create_extend_and_publish(self):
        def png_image(shift=0):
            image = Image.new("RGBA", (96, 144), (0, 0, 0, 0))
            draw = ImageDraw.Draw(image)
            draw.rectangle((35 + shift, 8, 60 + shift, 35), fill=(210, 65, 105, 255))
            draw.rectangle((25 + shift, 36, 70 + shift, 88), fill=(45, 115, 220, 255))
            draw.rectangle((29 + shift, 89, 43 + shift, 135), fill=(35, 35, 48, 255))
            draw.rectangle((52 + shift, 89, 66 + shift, 135), fill=(35, 35, 48, 255))
            output = io.BytesIO()
            image.save(output, format="PNG")
            return output.getvalue()

        def image_payload(filename, data, kind):
            return {
                "filename": filename,
                "mime_type": "image/png",
                "data_base64": base64.b64encode(data).decode("ascii"),
                "category": "portrait" if kind == "full_character" else "reference",
                "label": filename,
                "kind": kind,
                "view": "front",
                "license": "USER_PROVIDED_REFERENCE",
                "source_url": "https://example.invalid/reference",
            }

        with tempfile.TemporaryDirectory() as temp_dir:
            temp = Path(temp_dir)
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0),
                make_handler(
                    self.generator,
                    temp / "profiles",
                    temp / "modular-assets",
                    temp / "character-models",
                ),
            )
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            def request(method, path, payload=None):
                connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=10)
                try:
                    headers = {"Content-Type": "application/json"} if payload is not None else {}
                    body = json.dumps(payload).encode("utf-8") if payload is not None else None
                    connection.request(method, path, body=body, headers=headers)
                    response = connection.getresponse()
                    data = response.read()
                    content_type = response.getheader("Content-Type", "")
                    parsed = json.loads(data.decode("utf-8")) if "application/json" in content_type else data
                    return response.status, content_type, parsed
                finally:
                    connection.close()

            try:
                status, _, base = request("POST", "/api/modular-assets", image_payload("base.png", png_image(), "full_character"))
                self.assertEqual(status, 201)
                status, _, reference = request("POST", "/api/modular-assets", image_payload("ref.png", png_image(2), "reference"))
                self.assertEqual(status, 201)

                status, _, created = request("POST", "/api/character-models", {
                    "name": "API-created character model",
                    "style_id": "api-style-v1",
                    "base_asset_id": base["id"],
                    "asset_ids": [base["id"], reference["id"]],
                    "max_regions": 16,
                })
                self.assertEqual(status, 201)
                model = created["model"]
                model_id = model["id"]
                self.assertTrue(model["decomposition"]["round_trip_exact_visible_pixels"])
                self.assertGreaterEqual(len(model["layers"]), 2)

                status, content_type, image = request("GET", f"/api/character-models/{model_id}/preview.png")
                self.assertEqual(status, 200)
                self.assertEqual(content_type, "image/png")
                self.assertTrue(image.startswith(b"\x89PNG\r\n\x1a\n"))

                layer_id = model["layers"][0]["id"]
                status, content_type, image = request(
                    "GET", f"/api/character-models/{model_id}/layers/{layer_id}-thumb.png"
                )
                self.assertEqual(status, 200)
                self.assertEqual(content_type, "image/png")
                self.assertTrue(image.startswith(b"\x89PNG\r\n\x1a\n"))

                status, _, listed = request("GET", "/api/character-models")
                self.assertEqual(status, 200)
                self.assertEqual(listed["count"], 1)
                self.assertEqual(listed["models"][0]["id"], model_id)

                status, _, reference2 = request("POST", "/api/modular-assets", image_payload("ref2.png", png_image(3), "reference"))
                self.assertEqual(status, 201)
                status, _, extended = request(
                    "POST", f"/api/character-models/{model_id}/extend", {"asset_ids": [reference2["id"]]}
                )
                self.assertEqual(status, 200)
                self.assertEqual(extended["model"]["revision"], 2)
                self.assertEqual(len(extended["model"]["references"]), 3)
                self.assertEqual(len(extended["model"]["layers"]), len(model["layers"]))

                status, _, published = request("POST", f"/api/character-models/{model_id}/publish-layer", {
                    "layer_id": layer_id,
                    "label": "Candidate body region",
                    "category": "clothing_top",
                    "view": "front",
                })
                self.assertEqual(status, 201)
                self.assertEqual(published["asset"]["kind"], "modular_piece")
                self.assertEqual(published["asset"]["category"], "clothing_top")
                self.assertFalse(published["asset"]["anchors_validated"])
                status, _, asset_list = request("GET", "/api/modular-assets")
                self.assertEqual(status, 200)
                self.assertEqual(asset_list["count"], 4)

                selected_region_ids = [item["id"] for item in model["layers"][:2]]
                self.assertEqual(len(selected_region_ids), 2)
                status, _, grouped = request("POST", f"/api/character-models/{model_id}/publish-layer", {
                    "layer_ids": selected_region_ids,
                    "label": "Grouped clothing region",
                    "category": "clothing_top",
                    "view": "front",
                })
                self.assertEqual(status, 201)
                self.assertEqual(grouped["layer_ids"], selected_region_ids)
                self.assertEqual(grouped["merged_region_count"], 2)
                self.assertEqual(grouped["asset"]["kind"], "modular_piece")
                self.assertEqual(grouped["asset"]["category"], "clothing_top")
                status, content_type, merged_png = request(
                    "GET", f"/api/modular-assets/{grouped['asset']['id']}/image"
                )
                self.assertEqual(status, 200)
                self.assertEqual(content_type, "image/png")
                with Image.open(io.BytesIO(merged_png)) as merged_image:
                    self.assertEqual(merged_image.size, (512, 768))
                    self.assertIsNotNone(merged_image.getchannel("A").getbbox())
                status, _, final_assets = request("GET", "/api/modular-assets")
                self.assertEqual(status, 200)
                self.assertEqual(final_assets["count"], 5)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


    def test_modular_png_import_anchor_confirmation_compose_and_export_round_trip(self):
        def solid_png(color):
            image = Image.new("RGBA", (32, 32), color)
            output = io.BytesIO()
            image.save(output, format="PNG")
            return output.getvalue()

        def image_payload(filename, data, category):
            return {
                "filename": filename,
                "mime_type": "image/png",
                "data_base64": base64.b64encode(data).decode("ascii"),
                "category": category,
                "label": filename,
                "kind": "modular_piece",
                "view": "front",
                "license": "USER_PROVIDED_REFERENCE",
            }

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            server = ThreadingHTTPServer(
                ("127.0.0.1", 0),
                make_handler(self.generator, root / "profiles", root / "modular-assets"),
            )
            server.daemon_threads = True
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            def request(method, path, payload=None):
                connection = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
                try:
                    body = json.dumps(payload).encode("utf-8") if payload is not None else None
                    headers = {"Content-Type": "application/json"} if payload is not None else {}
                    connection.request(method, path, body=body, headers=headers)
                    response = connection.getresponse()
                    raw = response.read()
                    content_type = response.getheader("Content-Type", "")
                    parsed = json.loads(raw.decode("utf-8")) if "application/json" in content_type else raw
                    return response.status, content_type, parsed
                finally:
                    connection.close()

            try:
                status, _, body = request(
                    "POST", "/api/modular-assets",
                    image_payload("body.png", solid_png((20, 60, 220, 255)), "body"),
                )
                self.assertEqual(status, 201)
                status, _, hair = request(
                    "POST", "/api/modular-assets",
                    image_payload("hair.png", solid_png((240, 30, 150, 255)), "hair_front"),
                )
                self.assertEqual(status, 201)

                for asset in (body, hair):
                    status, _, confirmed = request(
                        "POST", f"/api/modular-assets/{asset['id']}/validate-anchors",
                        {"confirm": True, "anchors": {"waist": {"x": 0.5, "y": 0.5}}},
                    )
                    self.assertEqual(status, 200)
                    self.assertTrue(confirmed["asset"]["anchors_validated"])

                status, _, catalog = request("GET", "/api/modular-assets")
                self.assertEqual(status, 200)
                self.assertEqual(catalog["count"], 2)
                self.assertTrue(all(asset["anchors_validated"] for asset in catalog["assets"]))

                status, content_type, composed = request("POST", "/api/modular-compose", {
                    "pieces": [
                        {"schema_version": 1, "id": body["id"], "category": "body",
                         "resource": body["id"], "dimensions": {"width": 32, "height": 32},
                         "anchors": {"waist": {"x": 0.5, "y": 0.5}}, "anchors_validated": True,
                         "layer_order": 20},
                        {"schema_version": 1, "id": hair["id"], "category": "hair_front",
                         "resource": hair["id"], "dimensions": {"width": 32, "height": 32},
                         "anchors": {"waist": {"x": 0.5, "y": 0.5}}, "anchors_validated": True,
                         "layer_order": 70},
                    ],
                    "canvas_size": [64, 64],
                })
                self.assertEqual(status, 200)
                self.assertEqual(content_type, "application/json; charset=utf-8")
                self.assertEqual(composed["mime_type"], "image/png")
                self.assertEqual((composed["width"], composed["height"]), (64, 64))
                png_bytes = base64.b64decode(composed["png_base64"], validate=True)
                self.assertTrue(png_bytes.startswith(b"\\x89PNG\\r\\n\\x1a\\n"))
                with Image.open(io.BytesIO(png_bytes)) as rendered:
                    rgba = rendered.convert("RGBA")
                    self.assertEqual(rgba.size, (64, 64))
                    self.assertEqual(rgba.getpixel((1, 1)), (20, 60, 220, 255))
                    self.assertEqual(rgba.getpixel((62, 62)), (240, 30, 150, 255))
                    self.assertEqual(rgba.getpixel((0, 63))[3], 0)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
