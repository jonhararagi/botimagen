# BIMG-PRODUCT-001-R1 · Estudio visual integrado y biblioteca local

**Estado:** implementación integrada; validación automatizada aprobada en el SHA de código de referencia; aceptación visual humana pendiente.  
**Repositorio:** `jonhararagi/botimagen`  
**Rama:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**PR de trabajo:** https://github.com/jonhararagi/botimagen/pull/11  
**PR independiente preservado:** https://github.com/jonhararagi/botimagen/pull/14  
**SHA de código validado:** `fee1524ae241857d8b51bb319f954a21956c8795`  
**CI exacta:** [run #377 · SUCCESS](https://github.com/jonhararagi/botimagen/actions/runs/38248187422)  
**Artefacto:** [botimagen-visual-garment-qa](https://github.com/jonhararagi/botimagen/actions/runs/38248187422/artifacts/11746755371)

## Implementación entregada

- La vista principal utiliza como única fuente visible el SVG devuelto por `POST /api/render/character`, generado localmente por `character_render_engine.py`. `VisualCharacterRenderer` se conserva como fixture de QA invisible y no como segundo personaje.
- El editor ofrece tres fondos SVG locales: `cyber-grid`, `dusk-orbit` y `aurora-city`. La selección se conserva en localStorage. La capa del fondo se remonta al cambiar el ID del recurso y Chromium comprueba que los tres fondos producen imágenes CSS diferentes.
- Se incluyen dos presets editables (`street-sentinel` y `neon-archivist`), dos emblemas SVG de interfaz y un catálogo estable con siete recursos locales.
- `tools/assets/validate_visual_asset_catalog.py` valida que los recursos existan en el repositorio, que sus rutas no escapen del árbol y que cada entrada declare procedencia, licencia, atribución y finalidad; verifica además IDs, recetas y selecciones de presets.
- Se preserva la licencia MIT de `vendor/anime_character_creator/`. No se copian imágenes de terceros de las fuentes sugeridas porque no se verificó una licencia de asset individual para incorporarlas en esta entrega. La procedencia de `references/dataset-cuerpos/` sigue siendo una revisión separada y pendiente.

## Verificación

CI #377 pasó en el SHA `fee1524ae241857d8b51bb319f954a21956c8795`:
- Sintaxis Python y manifiesto existente.
- Catálogo visual local, rutas, metadatos y procedencia.
- Generador determinista, contrato de estilo, API local y cobertura de campos.
- Contratos de receta CyberStreet, landmarks/capas SVG y motor paramétrico.
- Instalación de dependencias, build React/TypeScript y smoke E2E Chromium.
- Capturas reproducibles de producto frontal, posterior y segundo preset; manifiestos de captura y QA.

El artefacto se publicó en GitHub Actions, pero el ZIP no pudo descargarse en la sesión de inspección porque el endpoint requiere autenticación. Por ello no se presenta una inspección visual manual de los PNG como si se hubiera realizado. La aceptación artística permanece **PARTIAL** hasta revisar esas imágenes de forma accesible.

## Limitaciones explícitas

- El renderer es SVG paramétrico 2D, no simulación de tela, rig 3D ni un rig anatómico trasero independiente.
- No todas las categorías del catálogo tienen aún una geometría especializada individual; las características sin geometría propia no deben declararse como plenamente implementadas.
- La biblioteca inicial no es todavía una biblioteca de referencias indexada con búsqueda/filtros ni completa el intake web de assets.
- `WINDOWS_MANUAL_QA: NOT_RUN`. No se ha ejecutado físicamente Chrome/Edge en Windows.
- El progreso global de la beta permanece en **63%**. No se incrementa por documentación o cantidad de archivos; falta aceptar visualmente el resultado y completar fases mayores de la beta.

## Continuidad

- PR #11 continúa abierto y sin fusionar.
- PR #14 permanece abierto e independiente.
- `main` conserva el SHA base `b508cfe7d3216eda801438d46dff8873842cea86`.
- Timer inicial de la entrega integral: 16–24 horas activas estimadas; tiempo real acumulado no medido con precisión.
