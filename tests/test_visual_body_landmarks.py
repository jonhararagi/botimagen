from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RENDERER = (ROOT / "web/src/visual/VisualCharacterRenderer.tsx").read_text(encoding="utf-8")
LANDMARKS = (ROOT / "web/src/visual/bodyLandmarks.ts").read_text(encoding="utf-8")
RECIPE_TESTS = (ROOT / "tests/test_visual_recipe_contract.py").read_text(encoding="utf-8")
SMOKE = (ROOT / "web/browser_smoke.mjs").read_text(encoding="utf-8")


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
        self.assertIn("shoulderLeft: { x: 120, y: 251 }", LANDMARKS)
        self.assertIn("torsoShoulderLeft: { x: 128, y: 254 }", LANDMARKS)
        self.assertIn("kneeLeft: { x: 150, y: 442 }", LANDMARKS)
        self.assertIn("chestCenter: { x: 170, y: rear ? 242 : 241 }", LANDMARKS)
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

    def test_shared_landmarks_drive_extremities_pelvis_legs_and_footwear(self):
        for declaration in ("const armSkinPath =", "const lowerBodyPath =", "const legSilhouettePath =", "const baseFootwearPath ="):
            self.assertIn(declaration, RENDERER)
        for landmark in ("elbowLeft", "elbowRight", "wristLeft", "wristRight",
                         "handLeft", "handRight", "pelvisLeft", "pelvisCenter",
                         "pelvisRight", "kneeLeft", "kneeRight", "ankleLeft",
                         "ankleRight", "footLeft", "footRight"):
            self.assertIn(f"landmarks.{landmark}.", RENDERER)
        self.assertIn("d={armSkinPath}", RENDERER)
        self.assertIn("d={lowerBodyPath}", RENDERER)
        self.assertIn("d={legSilhouettePath}", RENDERER)
        self.assertIn("d={baseFootwearPath}", RENDERER)
        self.assertIn("bodyLandmarks.handLeft.x - 108", RENDERER)
        self.assertIn("bodyLandmarks.handRight.x - 232", RENDERER)
        self.assertIn('data-qa-surface="legs"', RENDERER)
        self.assertIn('data-qa-surface="footwear-base"', RENDERER)

    def test_neutral_body_fixture_is_temporary_and_records_front_back_bounds(self):
        self.assertIn('bimg-neutral-body-qa-only', SMOKE)
        self.assertIn('"neutral-body-" + view', SMOKE)
        self.assertIn('neutral-body-manifest.json', SMOKE)
        self.assertIn("box('[data-layer-id=\"neck\"]')", SMOKE)
        self.assertIn('document.getElementById(styleId)?.remove()', SMOKE)
        self.assertIn('BODY_BASE_GEOMETRY_PRESENT_ART_REVIEW_REQUIRED', SMOKE)
        self.assertIn('normalizedPathBounds', SMOKE)
        self.assertIn('independent_body_base_path_bbox', SMOKE)
        self.assertIn('Cosmetic SVG layers must be explicitly hidden', SMOKE)

    def test_browser_smoke_checks_actual_svg_dom_paint_order(self):
        self.assertIn('querySelectorAll("[data-layer-id][data-layer-order]")', SMOKE)
        self.assertIn("domLayers.every((entry, index) => index === 0 || entry.order >= domLayers[index - 1].order)", SMOKE)
        self.assertIn("layerOrderChecks.push", SMOKE)
        self.assertIn("domLayerOrderValidated: true", SMOKE)


if __name__ == "__main__":
    unittest.main()
