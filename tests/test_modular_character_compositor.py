import io
import unittest

from PIL import Image

from modular_character_compositor import (
    CompositionError, compose_png, make_modular_profile, migrate_profile,
    validate_piece,
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


if __name__ == "__main__":
    unittest.main()
