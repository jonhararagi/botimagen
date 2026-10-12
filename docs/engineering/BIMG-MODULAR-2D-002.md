# BIMG-MODULAR-2D-002 · Contrato y ensamblador

## Estado honesto

El módulo `modular_character_compositor.py` define un contrato de pieza v1 y un compositor determinista RGBA basado en Pillow. Es una capa de motor aislada; hasta que el endpoint y la interfaz principal lo invoquen, no constituye una integración de producto completa.

## Contrato

Cada pieza declara `schema_version=1`, ID estable, categoría, referencia del recurso, dimensiones originales, anclajes normalizados (0..1), transformaciones, orden de capa, categorías compatibles y `anchors_validated`. Los puntos anatómicos posibles son cabeza, cuello, hombros, cintura, cadera y origen. El sistema no inventa landmarks ni marca una pieza como validada por defecto.

## Capas y transparencia

Las capas se ordenan por `layer_order` y, en empate, por ID estable. La imagen se convierte a RGBA y se compone en un lienzo transparente. La salida PNG conserva las dimensiones pedidas. Las piezas distintas de cuerpo base requieren anclajes validados por defecto. Las incompatibilidades o referencias inválidas deben producir un error comprensible.

## Perfiles y recetas antiguas

`migrate_profile` añade `modular_composition` v1 sin reescribir campos de recetas existentes. Las referencias almacenadas son IDs, no imágenes incrustadas. Los recursos eliminados deben resolverse como errores de referencia en la integración de persistencia.

## Calibración necesaria

1. Importar una imagen PNG con transparencia.
2. Confirmar que representa una pieza independiente, no una ilustración completa.
3. Medir el origen y los landmarks sobre el lienzo fuente y normalizarlos por ancho/alto.
4. Registrar escala/posición inicial y compatibilidades justificadas.
5. Probar la pieza sobre el cuerpo base en capturas antes/después, incluyendo bordes y oclusión.
6. Solo entonces marcar `anchors_validated=true`.

Los 16 PNG auditados en el dataset son referencias con procedencia/licencia pendiente; no se deben declarar piezas anatómicas de producción sin segmentación y revisión verificables.

## Verificación

Ejecutar `python -m unittest tests.test_modular_character_compositor`. Las pruebas cubren contrato, rechazo de anclajes pendientes, orden reproducible, alpha y tamaño PNG, recursos ausentes y migración conservadora de recetas v1/v2/v3. La integración del endpoint/UI principal, QA artística y pruebas físicas en Windows siguen siendo criterios separados.
