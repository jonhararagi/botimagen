from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RENDERER = (ROOT / "web/src/visual/VisualCharacterRenderer.tsx").read_text(encoding="utf-8")
LANDMARKS = (ROOT / "web/src/visual/bodyLandmarks.ts").read_text(encoding="utf-8")
RECIPE_TESTS = (ROOT / "tests/test_visual_recipe_contract.py").read_text(encoding="utf-8")


class VisualBodyLandmarkContractTests(unittest.TestCase):
    def test_landmarks_cover_both_views_and_existing_svg_coordinate_space(self):
        self.assertIn('export type BodyView = "front" | "back"', LANDMARKS)
        self.assertIn('getBodyLandmarks(view: BodyView, hemY: number, waistHalf: number)', LANDMARKS)
        self.assertIn("headTop:", LANDMARKS)
        for name in ("neckLeft", "shoulderLeft", "shoulderRight", "chestCenter",
                     "waistLeft", "waistRight", "elbowLeft", "wristLeft",
                     "handLeft", "pelvisCenter", "kneeLeft", "ankleLeft", "footLeft"):
            self.assertRegex(LANDMARKS, rf"\b{name}: \{{ x:")
        self.assertIn("headTop: { x: 170, y: 80 }", LANDMARKS)
        self.assertIn("chestCenter: { x: 170, y: rear ? 249 : 248 }", LANDMARKS)
        self.assertIn("hemY - 57", LANDMARKS)
        self.assertIn("waistHalf * 0.72", LANDMARKS)

    def test_renderer_consumes_shared_landmarks_for_svg_geometry(self):
        self.assertIn('import { getBodyLandmarks, svgLayerIndex } from "./bodyLandmarks"', RENDERER)
        self.assertIn("getBodyLandmarks(r.view, hemY, waistHalf)", RENDERER)
        self.assertIn("landmarks.torsoShoulderLeft.x", RENDERER)
        self.assertIn("landmarks.hemRight.y", RENDERER)
        self.assertIn("landmarks.neckLeft.x", RENDERER)

    def test_layer_contract_is_consumed_by_rendered_svg_elements(self):
        order = re.search(r"const SVG_LAYER_ORDER = \[(.*?)\] as const", LANDMARKS, re.S)
        self.assertIsNotNone(order)
        layers = re.findall(r'"([a-z-]+)"', order.group(1))
        self.assertEqual(len(layers), len(set(layers)))
        self.assertLess(layers.index("hair-back"), layers.index("neck"))
        self.assertLess(layers.index("arm-skin"), layers.index("hands"))
        self.assertLess(layers.index("base-sleeves"), layers.index("base-torso"))
        self.assertLess(layers.index("base-torso"), layers.index("lower-body"))
        self.assertLess(layers.index("lower-body"), layers.index("footwear"))
        self.assertLess(layers.index("footwear"), layers.index("outfit"))
        self.assertLess(layers.index("outer-layer"), layers.index("chromapatch"))
        for layer in ("ground-shadow", "hair-back", "neck", "arm-skin", "hands",
                      "base-sleeves", "base-torso", "lower-body", "footwear",
                      "outfit", "outer-layer", "chromapatch"):
            self.assertIn(f'svgLayerIndex("{layer}")', RENDERER)

    def test_existing_garment_ids_fit_controls_and_recipe_migrations_remain(self):
        for garment in ("street_bomber", "tactical_baseball", "long_coat"):
            self.assertIn(garment, RENDERER)
        for control in ("torso_length", "sleeve_length", "waist_fit"):
            self.assertIn(control, RENDERER)
            self.assertIn(control, RECIPE_TESTS)
        self.assertIn("test_visual_recipe_v1_and_v2_migrate_to_safe_v3_defaults", RECIPE_TESTS)
        self.assertIn("schema_version: 3", RENDERER)
        self.assertIn("nanowear_state", RENDERER)
        self.assertIn("chromapatch", RENDERER.lower())


if __name__ == "__main__":
    unittest.main()
