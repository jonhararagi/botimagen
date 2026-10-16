from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RENDERER = (ROOT / "web/src/visual/VisualCharacterRenderer.tsx").read_text(encoding="utf-8")
LANDMARKS = (ROOT / "web/src/visual/bodyLandmarks.ts").read_text(encoding="utf-8")
RECIPE_TESTS = (ROOT / "tests/test_visual_recipe_contract.py").read_text(encoding="utf-8")
SMOKE = (ROOT / "web/browser_smoke.mjs").read_text(encoding="utf-8")


class VisualBodyLandmarkContractTests(unittest.TestCase):
    def test_reference_calibration_is_documented_and_uses_existing_dataset(self):
        self.assertIn('primary: "references/dataset-cuerpos/12.png"', LANDMARKS)
        self.assertIn('secondary: "references/dataset-cuerpos/15.png"', LANDMARKS)
        self.assertIn("viewportRatios", LANDMARKS)
        self.assertIn("Approximate normalized landmark ratios", LANDMARKS)

    def test_body_landmarks_are_independent_from_garment_fit(self):
        self.assertIn("export function getBodyLandmarks(view: BodyView)", LANDMARKS)
        self.assertIn("export function getGarmentFitLandmarks(view: BodyView, hemY: number, waistHalf: number)", LANDMARKS)
        body_function = LANDMARKS.split("export function getBodyLandmarks", 1)[1].split("/**", 1)[0]
        self.assertNotIn("torso_length", body_function)
        self.assertNotIn("waist_fit", body_function)
        self.assertNotIn("hemY", body_function)
        self.assertNotIn("waistHalf", body_function)
        self.assertIn("const garmentLandmarks = getGarmentFitLandmarks(r.view, hemY, waistHalf)", RENDERER)
        self.assertIn("const bodyLandmarks = landmarks", RENDERER)

    def test_body_contours_are_curved_and_share_anatomical_landmarks(self):
        for name in ("neckLeftBase", "neckRightBase", "shoulderLeft", "torsoShoulderLeft",
                     "waistLeft", "elbowLeft", "wristLeft", "handLeft", "pelvisCenter",
                     "kneeLeft", "ankleLeft", "footLeft"):
            self.assertRegex(LANDMARKS, rf"\b{name}: \{{ x:")
        for fragment in ("C 140 120 155 122 170 122", "C 235 272 230 286 215 298",
                         "C 116 300 120 328"):
            self.assertIn(fragment, LANDMARKS)
        self.assertIn('className="anatomical-head-scale"', RENDERER)
        self.assertIn("scale(.72)", RENDERER)
        self.assertIn("translate(0 -113)", RENDERER)
        self.assertNotIn("xAtY(", RENDERER)

    def test_fit_controls_only_change_garment_landmarks_and_not_body_base(self):
        fit_fn = LANDMARKS.split("export function getGarmentFitLandmarks", 1)[1].split("export type BodyBaseGeometry", 1)[0]
        self.assertIn("const waistY = hemY - 25", fit_fn)
        self.assertIn("const hemHalf = waistHalf * 0.78", fit_fn)
        body_fn = LANDMARKS.split("export function getBodyBaseGeometry", 1)[1]
        self.assertNotIn("hemY", body_fn)
        self.assertNotIn("waistHalf", body_fn)
        for control in ("torso_length", "sleeve_length", "waist_fit"):
            self.assertIn(control, RENDERER)
            self.assertIn(control, RECIPE_TESTS)
        self.assertIn("schema_version: 3", RENDERER)

    def test_layer_contract_and_piece_controls_remain(self):
        order = re.search(r"const SVG_LAYER_ORDER = \[(.*?)\] as const", LANDMARKS, re.S)
        self.assertIsNotNone(order)
        layers = re.findall(r'"([a-z-]+)"', order.group(1))
        self.assertEqual(len(layers), len(set(layers)))
        self.assertLess(layers.index("hair-back"), layers.index("body-base"))
        self.assertLess(layers.index("body-base"), layers.index("neck"))
        self.assertLess(layers.index("arm-skin"), layers.index("hands"))
        self.assertLess(layers.index("base-torso"), layers.index("lower-body"))
        self.assertLess(layers.index("footwear"), layers.index("outfit"))
        self.assertLess(layers.index("outer-layer"), layers.index("chromapatch"))
        self.assertIn("getBodyBaseGeometry(r.view, bodyLandmarks)", RENDERER)
        self.assertIn('data-body-source="independent-geometry"', RENDERER)
        for region in ("torso", "pelvis", "legs", "feet"):
            self.assertIn(f'data-body-region="{region}"', RENDERER)
        self.assertIn("getGarmentCapabilities(values)", RENDERER)
        self.assertIn("Perfiles CyberStreet", (ROOT / "web/src/visual/ModularCharacterComposer.tsx").read_text(encoding="utf-8"))

    def test_neutral_body_chromium_capture_is_real_renderer_dom(self):
        self.assertIn('bimg-neutral-body-qa-only', SMOKE)
        self.assertIn('neutral-body-manifest.json', SMOKE)
        self.assertIn('page.locator("#" + bodyCaptureId).screenshot({ path: resolve(visualQaDir, name + ".png") });', SMOKE)
        self.assertIn('BODY_ONLY_CHROMIUM_RENDERED_ART_REVIEW_REQUIRED', SMOKE)
        self.assertIn("normalizedPathBounds", SMOKE)
        self.assertIn("The screenshot is a QA-only DOM clone of the live production SVG", SMOKE)

    def test_browser_smoke_checks_layer_order_and_png_transparency(self):
        self.assertIn('querySelectorAll("[data-layer-id][data-layer-order]")', SMOKE)
        self.assertIn("domLayers.every((entry, index) => index === 0 || entry.order >= domLayers[index - 1].order)", SMOKE)
        self.assertIn("inspectRgbaPng", SMOKE)
        self.assertIn("cornerAlpha", SMOKE)


if __name__ == "__main__":
    unittest.main()
