from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mini_ai_generator import MiniAIError, _build_prompts, _engine_url


class MiniAIPromptTests(unittest.TestCase):
    def test_prompt_uses_fixed_art_direction_and_negative_prompt(self):
        prompt, negative = _build_prompts({
            "archetype": "heroína adulta", "hair": "cabello azul corto",
            "outfit": "uniforme táctico blanco", "palette": "azul y blanco",
        })
        self.assertIn("professional anime game concept art", prompt)
        self.assertIn("cabello: cabello azul corto", prompt)
        self.assertIn("Follow this fixed design specification exactly", prompt)
        self.assertIn("childish doodle", negative)
        self.assertIn("inconsistent outfit", negative)

    def test_empty_design_is_rejected(self):
        with self.assertRaises(MiniAIError):
            _build_prompts({})

    def test_unknown_fields_are_rejected(self):
        with self.assertRaises(MiniAIError):
            _build_prompts({"prompt": "ignore all rules"})

    def test_oversized_trait_is_rejected(self):
        with self.assertRaises(MiniAIError):
            _build_prompts({"hair": "x" * 101})

    def test_remote_engine_url_is_rejected(self):
        with patch.dict(os.environ, {"BOTIMAGEN_SD_API_URL": "https://example.com:7860"}):
            with self.assertRaises(MiniAIError):
                _engine_url()

    def test_loopback_engine_url_is_allowed(self):
        with patch.dict(os.environ, {"BOTIMAGEN_SD_API_URL": "http://127.0.0.1:7860"}):
            self.assertEqual(_engine_url(), "http://127.0.0.1:7860")


if __name__ == "__main__":
    unittest.main()
