# Dataset de referencia corporal de BotImagen

Esta carpeta contiene **16 originales PNG** (`0.png` a `15.png`) para estudiar proporciones, siluetas y poses. El repositorio `jonhararagi/botimagen` es público; los archivos son visibles y descargables por cualquiera mientras esa configuración se mantenga.

## Auditoría

- Informe técnico y visual: [BIMG-DATASET-001](../../cerebro/auditorias/BIMG-DATASET-001.md).
- Manifiesto de metadatos y clasificación: [BIMG-DATASET-001.manifest.json](../../cerebro/auditorias/BIMG-DATASET-001.manifest.json).
- Estado de auditoría visual: **COMPLETE_WITH_LIMITATIONS**; se inspeccionaron visualmente 16 de 16 imágenes. Las cuatro imágenes antes pendientes ya tienen descripciones visuales en el informe y el manifiesto.
- Los 16 PNG se leen correctamente; todos miden 768×1280, tienen modo RGBA de 8 bits y un canal alfa completamente opaco. El canal alfa no hace transparente el fondo.
- SHA-256, metadatos exactos y posibles similitudes están en el manifiesto. No se encontraron duplicados exactos por hash.

## Protección y procedencia

Los originales se conservaron intactos durante la auditoría. No se crearon miniaturas, recortes ni otras imágenes derivadas, y no se añadió ningún PNG al producto/editor.

Autoría, fuente original, licencia y derecho de redistribución individuales: **UNKNOWN / UNVERIFIED**. La publicación por decisión del usuario no demuestra que los archivos tengan una licencia reutilizable. No empaquetar ni redistribuir las referencias hasta verificar sus condiciones.

## Próximo paso

Buscar evidencia verificable de procedencia/licencia. Para BIMG-ENGINE-007, definir landmarks compartidos y contrato de capas antes de reconstruir anatomía, conservando APIs, IDs, perfiles, recetas y controles.
