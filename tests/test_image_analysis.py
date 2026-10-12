from __future__ import annotations
import io, json, sys, threading, unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path: sys.path.insert(0, str(ROOT))
from image_analysis import ANALYZER_VERSION, MAX_INPUT_BYTES, MAX_PIXELS, MAX_WIDTH, ImageAnalysisError, analyze_image
from character_generator import CharacterGenerator
from botimagen_server import make_handler

def png_bytes(image: Image.Image) -> bytes:
    out = io.BytesIO()
    image.save(out, format="PNG")
    return out.getvalue()

class ImageAnalysisTests(unittest.TestCase):
    def test_known_rgba_metrics(self):
        image = Image.new("RGBA", (4, 4), (255, 0, 0, 0))
        for x in (1, 2):
            for y in (1, 2): image.putpixel((x, y), (255, 0, 0, 255))
        result = analyze_image(png_bytes(image), "image/png")
        self.assertEqual((result["input"]["width"], result["input"]["height"]), (4, 4))
        self.assertEqual(result["input"]["aspect_ratio"], round(4/4, 8))
        self.assertEqual(result["measurements"]["transparency"]["transparent_pixels"], 12)
        self.assertEqual(result["measurements"]["transparency"]["opaque_pixels"], 4)
        self.assertEqual(result["measurements"]["visible_bbox"]["value"],
                         {"left":1,"top":1,"right":3,"bottom":3,"width":2,"height":2})
        self.assertEqual(result["measurements"]["canvas_occupancy"]["value_percent"], 25.0)
        self.assertFalse(any(result["measurements"]["touches_canvas_edges"][k] for k in ("left","top","right","bottom")))

    def test_fully_transparent_image(self):
        result = analyze_image(png_bytes(Image.new("RGBA", (3, 2), (0, 0, 0, 0))), "image/png")
        self.assertEqual(result["status"], "EMPTY_CONTENT")
        self.assertIsNone(result["measurements"]["visible_bbox"]["value"])
        self.assertEqual(result["measurements"]["canvas_occupancy"]["value_percent"], 0.0)

    def test_opaque_image_reports_unsupported_alpha_metrics(self):
        result = analyze_image(png_bytes(Image.new("RGB", (2, 2), (20, 40, 60))), "image/png")
        self.assertEqual(result["measurements"]["transparency"]["status"], "NOT_SUPPORTED")
        self.assertEqual(result["measurements"]["visible_bbox"]["status"], "NOT_SUPPORTED")

    def test_corrupt_unsupported_format_and_mime_mismatch(self):
        with self.assertRaises(ImageAnalysisError) as caught: analyze_image(b"not an image", "image/png")
        self.assertEqual(caught.exception.code, "INVALID_IMAGE")
        bmp = io.BytesIO(); Image.new("RGB", (2, 2)).save(bmp, format="BMP")
        with self.assertRaises(ImageAnalysisError) as caught: analyze_image(bmp.getvalue(), "image/png")
        self.assertEqual(caught.exception.code, "UNSUPPORTED_FORMAT")
        with self.assertRaises(ImageAnalysisError) as caught:
            analyze_image(png_bytes(Image.new("RGB", (1, 1))), "image/jpeg")
        self.assertEqual(caught.exception.code, "MIME_MISMATCH")

    def test_empty_oversized_and_dimensions_rejected(self):
        with self.assertRaises(ImageAnalysisError) as caught: analyze_image(b"", "image/png")
        self.assertEqual(caught.exception.code, "EMPTY_BODY")
        with self.assertRaises(ImageAnalysisError) as caught: analyze_image(b"x" * (MAX_INPUT_BYTES + 1), "image/png")
        self.assertEqual(caught.exception.code, "FILE_TOO_LARGE")
        with self.assertRaises(ImageAnalysisError) as caught:
            analyze_image(png_bytes(Image.new("RGBA", (MAX_WIDTH + 1, 1))), "image/png")
        self.assertEqual(caught.exception.code, "DIMENSIONS_TOO_LARGE")
        too_many = png_bytes(Image.new("RGBA", (5000, 4001)))
        self.assertGreater(5000 * 4001, MAX_PIXELS)
        with self.assertRaises(ImageAnalysisError) as caught: analyze_image(too_many, "image/png")
        self.assertEqual(caught.exception.code, "DIMENSIONS_TOO_LARGE")

    def test_deterministic_versioned_result(self):
        raw = png_bytes(Image.new("RGBA", (5, 5), (12, 34, 56, 128)))
        first, second = analyze_image(raw, "image/png"), analyze_image(raw, "image/png")
        self.assertEqual(first, second)
        self.assertEqual(first["analyzer"]["id"], ANALYZER_VERSION)
        self.assertEqual(first["schema_version"], 1)
        self.assertEqual(first["input"]["byte_size"], len(raw))

    def test_existing_repository_image_is_real_input(self):
        path = ROOT / "references" / "dataset-cuerpos" / "0.png"
        self.assertTrue(path.is_file())
        raw = path.read_bytes()
        result = analyze_image(raw, "image/png")
        with Image.open(io.BytesIO(raw)) as original:
            self.assertEqual((result["input"]["width"], result["input"]["height"]), original.size)
            self.assertEqual(result["input"]["format"], "PNG")
        self.assertEqual(result["input"]["byte_size"], len(raw))

    def test_http_route_processes_real_image_and_rejects_bad_requests(self):
        raw = (ROOT / "references" / "dataset-cuerpos" / "0.png").read_bytes()
        server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(CharacterGenerator(ROOT / "character_rules.json")))
        server.daemon_threads = True
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            def request(method, body=b"", content_type="image/png", origin=None):
                conn = HTTPConnection("127.0.0.1", server.server_address[1], timeout=5)
                headers = {"Content-Type": content_type, "Content-Length": str(len(body))}
                if origin: headers["Origin"] = origin
                conn.request(method, "/api/analyze", body=body, headers=headers)
                response = conn.getresponse()
                status, data = response.status, response.read()
                conn.close()
                return status, json.loads(data.decode("utf-8"))
            status, result = request("POST", raw)
            self.assertEqual(status, 200)
            self.assertEqual(result["input"]["byte_size"], len(raw))
            self.assertEqual(result["schema_version"], 1)
            status, error = request("POST", b"abc", "text/plain")
            self.assertEqual(status, 415); self.assertEqual(error["error"]["code"], "UNSUPPORTED_MEDIA_TYPE")
            status, error = request("POST", b"abc", "image/png", "https://untrusted.example")
            self.assertEqual(status, 403); self.assertEqual(error["error"]["code"], "ORIGIN_NOT_ALLOWED")
            status, error = request("POST", b"not image")
            self.assertEqual(status, 422); self.assertEqual(error["error"]["code"], "INVALID_IMAGE")
            status, error = request("PUT", raw)
            self.assertEqual(status, 405); self.assertEqual(error["error"]["code"], "METHOD_NOT_ALLOWED")
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

if __name__ == "__main__": unittest.main(verbosity=2)
