import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cyberstreet_svg_compositor import CyberStreetError, compose_cyberstreet_svg, get_cyberstreet_manifest
import xml.etree.ElementTree as ET

class CyberStreetSvgTests(unittest.TestCase):
    def test_manifest_lists_real_existing_layers(self):
        manifest=get_cyberstreet_manifest()
        self.assertEqual((manifest["width"],manifest["height"]),(512,768))
        self.assertEqual({x["id"] for x in manifest["layers"]},{"base-body","face-anime-cyan","hair-midnight-cyan","sneakers-neon","top-neon-jacket","skirt-tech-pleated"})

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

    def test_rejects_unknown_layer_and_missing_base(self):
        with self.assertRaises(CyberStreetError): compose_cyberstreet_svg({"../../oops":True})
        with self.assertRaises(CyberStreetError): compose_cyberstreet_svg({"base-body":False})

if __name__=="__main__": unittest.main()
