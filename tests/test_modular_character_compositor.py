import io
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from PIL import Image

from modular_character_compositor import (
    CompositionError, compose_png, fit_transform_to_body, make_modular_profile,
    migrate_profile, validate_piece,
)


def png(color, size=(16, 16)):
    image = Image.new("RGBA", size, color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def piece(pid, category, color, order, validated=True):
    return {
        "schema_version": 1, "id": pid, "category": category, "resource": pid,
        "dimensions": {"width": 16, "height": 16},
        "anchors": {"origin": {"x": 0.5, "y": 0.5}},
        "transform": {"x": 0.25, "y": 0.25},
        "layer_order": order, "anchors_validated": validated,
        "compatible_with": [],
    }


class ModularCompositorTests(unittest.TestCase):
    def test_contract_rejects_bad_normalized_anchor(self):
        item = piece("base", "body", "red", 20)
        item["anchors"]["origin"]["x"] = 1.5
        with self.assertRaises(CompositionError):
            validate_piece(item)

    def test_composition_is_deterministic_and_transparent(self):
        body = piece("base", "body", "base", 20)
        hair = piece("hair-front", "hair_front", "hair", 70)
        assets = {"base": png((255, 0, 0, 255)), "hair-front": png((0, 0, 255, 128))}
        render = lambda: compose_png([hair, body], assets.__getitem__, (64, 64))
        first, second = render(), render()
        self.assertEqual(first, second)
        result = Image.open(io.BytesIO(first)).convert("RGBA")
        self.assertEqual(result.size, (64, 64))
        self.assertEqual(result.getpixel((0, 0))[3], 0)
        self.assertGreater(result.getpixel((20, 20))[3], 0)

    def test_piece_transform_changes_real_rendered_pixels(self):
        body = piece("base", "body", "base", 20)
        assets = {"base": png((255, 0, 0, 255), (8, 8))}
        baseline = Image.open(io.BytesIO(compose_png([body], assets.__getitem__, (64, 64)))).convert("RGBA")
        moved = {**body, "transform": {"x": 0.75, "y": 0.25, "scale_x": 1.5, "scale_y": 1.5, "rotation": 0}}
        adjusted = Image.open(io.BytesIO(compose_png([moved], assets.__getitem__, (64, 64)))).convert("RGBA")
        self.assertNotEqual(list(baseline.getdata()), list(adjusted.getdata()))
        self.assertEqual(baseline.getpixel((16, 16)), (255, 0, 0, 255))
        self.assertEqual(adjusted.getpixel((48, 16)), (255, 0, 0, 255))

    def test_layer_order_changes_the_topmost_rendered_pixels(self):
        body = {**piece("base", "body", "base", 20), "transform": {"x": 0.25, "y": 0.25}}
        top = {**piece("shirt", "top", "shirt", 40), "transform": {"x": 0.25, "y": 0.25}}
        assets = {"base": png((255, 0, 0, 255), (8, 8)), "shirt": png((0, 255, 0, 255), (8, 8))}
        front = Image.open(io.BytesIO(compose_png([body, top], assets.__getitem__, (64, 64)))).convert("RGBA")
        reordered = [{**body, "layer_order": 60}, {**top, "layer_order": 10}]
        back = Image.open(io.BytesIO(compose_png(reordered, assets.__getitem__, (64, 64)))).convert("RGBA")
        self.assertNotEqual(front.getpixel((20, 20)), back.getpixel((20, 20)))
        self.assertEqual(front.getpixel((20, 20)), (0, 255, 0, 255))
        self.assertEqual(back.getpixel((20, 20)), (255, 0, 0, 255))

    def test_unvalidated_non_body_anchor_is_rejected(self):
        body = piece("base", "body", "base", 20)
        top = piece("shirt", "top", "shirt", 40, validated=False)
        assets = {"base": png((255, 0, 0, 255)), "shirt": png((0, 255, 0, 128))}
        with self.assertRaisesRegex(CompositionError, "pendientes de validación"):
            compose_png([body, top], assets.__getitem__, (64, 64))

    def test_missing_resource_is_clear_error(self):
        body = piece("base", "body", "missing", 20)
        with self.assertRaises(FileNotFoundError):
            compose_png([body], lambda _: (_ for _ in ()).throw(FileNotFoundError()), (64, 64))

    def test_profile_migration_preserves_legacy_recipe(self):
        legacy = {"recipe_version": 1, "recipe": {"outfit_id": "legacy-001"}}
        migrated = migrate_profile(legacy)
        self.assertEqual(migrated["recipe"], legacy["recipe"])
        self.assertEqual(migrated["modular_composition"], make_modular_profile({}))
        for version in (1, 2, 3):
            profile = {"recipe_version": version, "recipe": {"marker": version}}
            self.assertEqual(migrate_profile(profile)["recipe"], profile["recipe"])

    def test_new_face_components_are_distinct_ordered_layers(self):
        from modular_character_compositor import validate_selection
        selected = validate_selection([
            piece("base", "body", "base", 20),
            piece("head", "head", "head", 48),
            piece("face", "face", "face", 50),
            piece("eyes", "eyes", "eyes", 52),
            piece("brows", "brows", "brows", 54),
            piece("mouth", "mouth", "mouth", 56),
        ])
        self.assertEqual([item["category"] for item in selected], ["body", "head", "face", "eyes", "brows", "mouth"])

    def test_invalid_category_and_duplicate_piece_ids_rejected(self):
        item = piece("base", "unicorn", "base", 20)
        with self.assertRaises(CompositionError):
            validate_piece(item)
        from modular_character_compositor import validate_selection
        with self.assertRaises(CompositionError):
            validate_selection([piece("base", "body", "a", 20), piece("base", "body", "b", 20)])


    def test_compose_png_aligns_a_piece_to_confirmed_body_landmarks(self):
        body_png = png((20, 60, 220, 255), size=(16, 16))
        top_png = png((240, 30, 150, 255), size=(16, 16))
        body = {
            "schema_version": 1, "id": "body-main", "category": "body", "resource": "body",
            "dimensions": {"width": 16, "height": 16},
            "anchors": {"waist": {"x": 0.75, "y": 0.5}}, "anchors_validated": True,
        }
        top = {
            "schema_version": 1, "id": "top-main", "category": "top", "resource": "top",
            "dimensions": {"width": 16, "height": 16},
            "anchors": {"waist": {"x": 0.25, "y": 0.5}},
            "anchors_validated": True, "align_to_body": True,
        }
        result = compose_png([body, top], lambda key: {"body": body_png, "top": top_png}[key], (32, 16))
        with Image.open(io.BytesIO(result)) as image:
            self.assertEqual(image.convert("RGBA").getpixel((1, 1)), (20, 60, 220, 255))
            self.assertEqual(image.convert("RGBA").getpixel((16, 1)), (240, 30, 150, 255))
            self.assertEqual(image.convert("RGBA").getpixel((31, 1)), (240, 30, 150, 255))
    def test_anchor_fit_maps_piece_landmarks_to_body(self):
        body = {"id": "body", "category": "body", "anchors": {
            "shoulder_l": {"x": 0.25, "y": 0.20},
            "shoulder_r": {"x": 0.75, "y": 0.20},
            "waist": {"x": 0.50, "y": 0.50},
        }}
        top = {"id": "top", "category": "top", "anchors": {
            "shoulder_l": {"x": 0.30, "y": 0.20},
            "shoulder_r": {"x": 0.70, "y": 0.20},
            "waist": {"x": 0.50, "y": 0.60},
        }}
        fitted = fit_transform_to_body(top, body)
        self.assertAlmostEqual(fitted["scale_x"], 1.25, places=5)
        self.assertAlmostEqual(fitted["scale_y"], 0.75, places=5)
        self.assertAlmostEqual(fitted["x"], -0.125, places=5)
        self.assertAlmostEqual(fitted["y"], 0.05, places=5)

    def test_anchor_fit_rejects_unmatched_landmarks(self):
        with self.assertRaisesRegex(CompositionError, "no comparte anclajes"):
            fit_transform_to_body(
                {"id": "coat", "anchors": {"hand_l": {"x": 0.2, "y": 0.5}}},
                {"id": "body", "anchors": {"head": {"x": 0.5, "y": 0.1}}},
            )

    def test_anchor_fit_requires_confirmed_body_anchors(self):
        with self.assertRaisesRegex(CompositionError, "confirma los anclajes del cuerpo base"):
            compose_png([
                {"schema_version": 1, "id": "body", "category": "body", "resource": "body",
                 "dimensions": {"width": 2, "height": 2}, "anchors": {"waist": {"x": 0.5, "y": 0.5}},
                 "anchors_validated": False},
                {"schema_version": 1, "id": "top", "category": "top", "resource": "top",
                 "dimensions": {"width": 2, "height": 2}, "anchors": {"waist": {"x": 0.5, "y": 0.5}},
                 "anchors_validated": True, "align_to_body": True},
            ], lambda _: b"", (2, 2))
if __name__ == "__main__":
    unittest.main()
