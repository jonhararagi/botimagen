import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cyberstreet_svg_compositor import CyberStreetError, compose_cyberstreet_svg, get_cyberstreet_manifest, get_cyberstreet_layer_png_source
import xml.etree.ElementTree as ET

class CyberStreetSvgTests(unittest.TestCase):
    def test_manifest_lists_real_existing_layers(self):
        manifest=get_cyberstreet_manifest()
        self.assertEqual((manifest["width"],manifest["height"]),(512,768))
        self.assertEqual(
            {x["id"] for x in manifest["layers"]},
            {"base-body","base-body-athletic","face-anime-cyan","face-amber-eyes","face-wink-rose",
             "hair-midnight-cyan","hair-rose-twin","hair-silver-bob","sneakers-neon",
             "top-neon-jacket","top-sport-varsity","top-goth-blouse","skirt-tech-pleated",
             "bottom-cargo-pants","bottom-short-skirt"},
        )
        self.assertEqual(sum(1 for layer in manifest["layers"] if layer["enabled_by_default"]), 6)
        self.assertTrue(all(layer["slot"] for layer in manifest["layers"]))

    def test_composes_all_real_svg_layers_in_manifest_order(self):
        root=ET.fromstring(compose_cyberstreet_svg())
        layers=[node.attrib["data-layer-id"] for node in root if "data-layer-id" in node.attrib]
        self.assertEqual(layers,["base-body","face-anime-cyan","skirt-tech-pleated","sneakers-neon","top-neon-jacket","hair-midnight-cyan"])
        self.assertEqual((root.attrib["width"],root.attrib["height"]),("512","768"))

    def test_disabling_clothing_and_hair_changes_composition(self):
        full=compose_cyberstreet_svg()
        no_hair=compose_cyberstreet_svg({"hair-midnight-cyan":False})
        no_clothes=compose_cyberstreet_svg({"top-neon-jacket":False,"skirt-tech-pleated":False})
        self.assertNotEqual(full,no_hair)
        self.assertNotEqual(full,no_clothes)
        self.assertNotIn("layer-hair-midnight-cyan",no_hair)
        self.assertNotIn("layer-top-neon-jacket",no_clothes)

    def test_face_features_survive_hair_toggle(self):
        no_hair = compose_cyberstreet_svg({"hair-midnight-cyan": False})
        self.assertIn("layer-face-anime-cyan", no_hair)
        self.assertIn('id="face-features"', no_hair)
        self.assertNotIn("layer-hair-midnight-cyan", no_hair)

    def test_png_source_endpoint_contract_has_six_safe_original_independent_layers(self):
        manifest = get_cyberstreet_manifest()
        expected = {
            "base-body": ("body", "body", 20), "base-body-athletic": ("body", "body", 20),
            "face-anime-cyan": ("face", "face", 50), "face-amber-eyes": ("face", "face", 50),
            "face-wink-rose": ("face", "face", 50),
            "skirt-tech-pleated": ("clothing_bottom", "bottom", 36), "bottom-cargo-pants": ("clothing_bottom", "bottom", 36),
            "bottom-short-skirt": ("clothing_bottom", "bottom", 36),
            "sneakers-neon": ("footwear", "footwear", 28),
            "top-neon-jacket": ("clothing_top", "top", 40), "top-sport-varsity": ("clothing_top", "top", 40),
            "top-goth-blouse": ("clothing_top", "top", 40),
            "hair-midnight-cyan": ("hair_front", "hair_front", 70), "hair-rose-twin": ("hair_front", "hair_front", 70),
            "hair-silver-bob": ("hair_front", "hair_front", 70),
        }
        self.assertEqual({item["id"] for item in manifest["layers"]}, set(expected))
        for layer_id, (category, rig_category, layer_order) in expected.items():
            with self.subTest(layer_id=layer_id):
                source = get_cyberstreet_layer_png_source(layer_id)
                self.assertEqual((source["width"], source["height"]), (512, 768))
                self.assertEqual((source["category"], source["rig_category"], source["layer_order"]),
                                 (category, rig_category, layer_order))
                self.assertIn('viewBox="0 0 512 768"', source["svg"])
                self.assertTrue(source["source_filename"].startswith("assets/modular/oc-cyberstreet/"))
                self.assertEqual(source["license"], "LicenseRef-BotImagen-Original-Assets")
                self.assertTrue(source["source_url"].startswith("https://"))
                self.assertIn("shoulder_l", source["anchors"])
                self.assertIn("ankle_r", source["anchors"])
        with self.assertRaises(CyberStreetError):
            get_cyberstreet_layer_png_source("../../outside")

    def test_selecting_a_variant_disables_default_variant_and_rejects_conflicts(self):
        svg = compose_cyberstreet_svg({
            "base-body": False, "base-body-athletic": True,
            "face-anime-cyan": False, "face-amber-eyes": True,
            "skirt-tech-pleated": False, "bottom-cargo-pants": True,
            "top-neon-jacket": False, "top-sport-varsity": True,
            "hair-midnight-cyan": False, "hair-silver-bob": True,
        })
        self.assertIn('data-layer-id="base-body-athletic"', svg)
        self.assertIn('data-layer-id="face-amber-eyes"', svg)
        self.assertIn('data-layer-id="bottom-cargo-pants"', svg)
        self.assertIn('data-layer-id="top-sport-varsity"', svg)
        self.assertIn('data-layer-id="hair-silver-bob"', svg)
        self.assertNotIn('data-layer-id="face-anime-cyan"', svg)
        self.assertNotIn('data-layer-id="top-neon-jacket"', svg)
        with self.assertRaises(CyberStreetError):
            compose_cyberstreet_svg({"hair-midnight-cyan": True, "hair-silver-bob": True})

    def test_rejects_unknown_layer_and_missing_base(self):
        with self.assertRaises(CyberStreetError): compose_cyberstreet_svg({"../../oops":True})
        with self.assertRaises(CyberStreetError): compose_cyberstreet_svg({"base-body":False})

if __name__=="__main__": unittest.main()
