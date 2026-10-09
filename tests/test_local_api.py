from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from character_generator import CharacterGenerator
from botimagen_server import ApiInputError, generate_from_payload, make_catalog, make_handler


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
        self.assertEqual(catalog["catalog_version"], 13)
        expected_hair = []
        for item in self.generator.categories["hair"]:
            public_item = {
                "id": item["id"],
                "label": item["label"],
                "tags": item.get("tags", []),
            }
            if "color_family" in item:
                public_item["color_family"] = item["color_family"]
            if "compatible_with" in item:
                public_item["compatible_with"] = item["compatible_with"]
            expected_hair.append(public_item)
        self.assertEqual(catalog["categories"]["hair"], expected_hair)

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
                    self.assertEqual(
                        public.get("compatible_with"),
                        compatible,
                        (category, source["id"], "compatible_with"),
                    )
                else:
                    self.assertNotIn("compatible_with", public, (category, source["id"]))

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


if __name__ == "__main__":
    unittest.main(verbosity=2)
