# Vendored upstream renderer

Source: https://github.com/rhedak/anime-character-creator

Pinned upstream commit: 1bcb2f875050fbab16968318112fea1615968a3e

License: MIT, preserved in [LICENSE](LICENSE).

Only reusable parametric SVG drawing code is vendored: `character.py`, `skeleton.py`, and `colorutil.py`. Upstream presets, named characters, reference art, and rendered PNG/SVG character examples are not imported. BotImagen supplies its own catalog IDs, body settings, clothing combinations and CyberStreet recipe through `character_render_engine.py`.

The three upstream Python modules are vendored unmodified. This directory's `__init__.py` exposes only the subset BotImagen needs.
