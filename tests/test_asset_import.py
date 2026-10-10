from __future__ import annotations

import json
import struct
import tempfile
import threading
import sys
import unittest
import zlib
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import binascii

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import botimagen_server as api
from character_generator import CharacterGenerator


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    body = kind + payload
    return struct.pack(">I", len(payload)) + body + struct.pack(">I", binascii.crc32(body) & 0xFFFFFFFF)


def make_png(width: int = 2, height: int = 1) -> bytes:
    # RGBA, filter type 0, deterministic transparent pixels.
    row = b"\x00" + (b"\x20\x40\x60\xff" * width)
    return (b"\x89PNG\r\n\x1a\n"
            + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + png_chunk(b"IDAT", zlib.compress(row * height))
            + png_chunk(b"IEND", b""))


class AssetImportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.manifest = self.root / "manifest.json"
        self.destination = "assets/test.png"
        self.manifest.write_text(json.dumps({
            "version": 1,
            "assets": [{
                "id": "test.asset", "title": "Test asset", "description": "Fixture",
                "prompt": "Fixture prompt", "negative_prompt": "none", "prompt_version": "test",
                "destination": self.destination,
                "expected": {"format": "PNG", "width": 2, "height": 1, "max_bytes": 1024}
            }]
        }), encoding="utf-8")
        generator = CharacterGenerator(api.ROOT / "character_rules.json")
        handler = api.make_handler(generator, self.root / "profiles", self.root / "output", self.manifest)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = "http://127.0.0.1:" + str(self.server.server_port)

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temp.cleanup()

    def post(self, body: bytes, asset_id="test.asset", content_type="image/png", method="POST"):
        request = Request(self.url + "/api/assets/import?asset_id=" + asset_id, data=body,
                          headers={"Content-Type": content_type}, method=method)
        try:
            with urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read())
        except HTTPError as exc:
            return exc.code, json.loads(exc.read())

    def test_valid_png_is_published_to_manifest_destination(self):
        body = make_png()
        status, response = self.post(body)
        target = self.root / "output" / self.destination
        self.assertEqual(status, 201)
        self.assertEqual(response["status"], "imported")
        self.assertEqual(response["destination"], self.destination)
        self.assertEqual(target.read_bytes(), body)
        self.assertEqual(response["width"], 2)
        self.assertFalse(list(target.parent.glob(".botimagen-import-*.tmp")))

    def test_unknown_asset_id_is_rejected(self):
        status, _ = self.post(make_png(), "unknown")
        self.assertEqual(status, 404)

    def test_non_png_bytes_are_rejected_even_with_png_mime(self):
        status, _ = self.post(b"this is not a png")
        self.assertEqual(status, 422)
        self.assertFalse((self.root / "output" / self.destination).exists())

    def test_truncated_and_crc_corrupt_png_are_rejected(self):
        for body in (make_png()[:-8], make_png()[:-5] + b"xxxxx"):
            with self.subTest(body=body[-8:]):
                status, _ = self.post(body)
                self.assertEqual(status, 422)
                self.assertFalse((self.root / "output" / self.destination).exists())

    def test_over_limit_body_is_rejected_before_reading_file(self):
        status, _ = self.post(b"x" * 1025)
        self.assertEqual(status, 413)

    def test_wrong_dimensions_are_rejected(self):
        status, _ = self.post(make_png(1, 1))
        self.assertEqual(status, 422)

    def test_arbitrary_route_and_traversal_manifest_are_rejected(self):
        status, _ = self.post(make_png(), "../outside")
        self.assertEqual(status, 404)
        self.manifest.write_text(json.dumps({
            "version": 1, "assets": [{
                "id": "bad", "title": "Bad", "description": "Bad", "prompt": "p",
                "negative_prompt": "n", "prompt_version": "v", "destination": "../outside.png",
                "expected": {"format": "PNG", "width": 2, "height": 1}
            }]
        }), encoding="utf-8")
        with self.assertRaises(ValueError):
            api.make_handler(CharacterGenerator(api.ROOT / "character_rules.json"),
                             self.root / "profiles", self.root / "output", self.manifest)

    def test_existing_destination_is_never_overwritten(self):
        target = self.root / "output" / self.destination
        target.parent.mkdir(parents=True)
        target.write_bytes(b"official existing asset")
        status, _ = self.post(make_png())
        self.assertEqual(status, 409)
        self.assertEqual(target.read_bytes(), b"official existing asset")

    def test_failed_validation_cleans_temporary_files_and_preserves_target(self):
        target = self.root / "output" / self.destination
        target.parent.mkdir(parents=True)
        status, _ = self.post(b"invalid")
        self.assertEqual(status, 422)
        self.assertFalse(target.exists())
        self.assertEqual(list(target.parent.glob(".botimagen-import-*.tmp")), [])

    def test_wrong_mime_and_get_method_are_rejected(self):
        status, _ = self.post(make_png(), content_type="text/plain")
        self.assertEqual(status, 415)
        request = Request(self.url + "/api/assets/import?asset_id=test.asset", method="GET")
        with self.assertRaises(HTTPError) as context:
            urlopen(request, timeout=5)
        self.assertEqual(context.exception.code, 405)

    def test_contract_endpoint_and_existing_generation_api_remain_available(self):
        with urlopen(self.url + "/api/assets/contracts", timeout=5) as response:
            body = json.loads(response.read())
        self.assertEqual(body["count"], 1)
        request = Request(self.url + "/api/generate", data=b'{"selections":{},"seed":7,"coherence":0.8}',
                          headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(request, timeout=5) as response:
            self.assertEqual(response.status, 200)


if __name__ == "__main__":
    unittest.main()
