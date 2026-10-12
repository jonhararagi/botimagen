# BIMG-ANALYSIS-001 · Contrato y prueba de concepto del análisis visual

**Versión:** 1.0 · **Estado:** prueba de concepto local, no análisis semántico  
**TIMER inicial:** 4–6 horas · **Módulo:** \`image_analysis.py\` · **Ruta:** \`POST /api/analyze\`

## Propósito y límites

Mide metadatos y, si hay canal alfa, distribución de transparencia y geometría de píxeles visibles. No interpreta contenido: no reconoce personajes, anatomía, articulaciones, pose, prendas, accesorios ni calidad artística. No es IA.

## Entrada

- El usuario proporciona explícitamente bytes de un archivo. No se acepta ruta de disco ni búsqueda por nombre.
- \`POST\` con cuerpo binario, no JSON ni base64.
- MIME admitido: \`image/png\`, \`image/jpeg\`, \`image/webp\`, contrastado con el formato real.
- Máximo 12 MiB; dimensiones máximas 8192 px por lado y 20.000.000 píxeles totales.
- Se exige decodificación completa. Archivos corruptos/truncados, formatos no admitidos y MIME contradictorio se rechazan.
- El límite JSON global de 64 KiB no cambia. El endpoint binario tiene su propio límite.
- El backend escucha solo en \`127.0.0.1:8765\`. Si existe \`Origin\`, se admiten únicamente localhost/127.0.0.1 en puertos 8765, 5173 y 4173. Sin \`Origin\` se permite uso local por herramientas HTTP. No se habilita CORS genérico.

## Salida y semántica

Respuesta JSON con \`schema_version: 1\`, estado, versión del analizador, metadatos, mediciones, advertencias y limitaciones. Cada medición declara estado:

- \`MEASURED\`: cálculo directo sobre bytes/píxeles.
- \`NOT_SUPPORTED\`: faltan datos para esa métrica, sin conjeturas.
- \`EMPTY_CONTENT\`: todos los valores alfa son cero.

Relación de aspecto = ancho / alto. Con alfa: transparente = 0; translúcido = 1–254; opaco = 255. Caja visible = bounding box de alfa mayor que cero, con borde derecho/inferior exclusivo. Ocupación = área rectangular de la caja / lienzo. No es una máscara semántica ni porcentaje del personaje. Contacto con bordes compara esa caja con cada borde.

Sin alfa, las cuatro métricas de transparencia/geometría devuelven \`NOT_SUPPORTED\`; no se asume que el fondo sea transparente. Un lienzo con alfa completamente cero produce \`EMPTY_CONTENT\`, caja null y ocupación 0%.

## Errores HTTP

| HTTP | Código | Significado |
|---:|---|---|
| 400 | \`EMPTY_BODY\` / \`INVALID_CONTENT_LENGTH\` | Cuerpo vacío o longitud inválida |
| 403 | \`ORIGIN_NOT_ALLOWED\` | Origen de navegador no permitido |
| 405 | \`METHOD_NOT_ALLOWED\` | Método no permitido |
| 413 | \`FILE_TOO_LARGE\` | Más de 12 MiB |
| 413 | \`DIMENSIONS_TOO_LARGE\` | Supera ancho, alto o píxeles máximos |
| 413 | \`IMAGE_RESOURCE_LIMIT\` | Rechazo del decodificador por seguridad |
| 415 | \`UNSUPPORTED_MEDIA_TYPE\` | MIME no admitido |
| 415 | \`UNSUPPORTED_FORMAT\` | Formato real no admitido |
| 415 | \`MIME_MISMATCH\` | MIME declarado y contenido no coinciden |
| 422 | \`INVALID_IMAGE\` | Bytes corruptos o imagen no decodificable |

Forma de error: \`{"error":{"code":"...","message":"..."}}\`. No se revelan rutas locales ni trazas.

## Ejemplo de salida válida

Ejemplo esquemático de imagen RGBA 4×4 con cuatro píxeles opacos en x=1..2, y=1..2:

\`\`\`json
{
  "schema_version": 1,
  "status": "COMPLETE",
  "analyzer": {"id": "bimg-pixel-metrics/1.0.0", "method": "pillow-pixel-inspection"},
  "input": {"format": "PNG", "mime_type": "image/png", "byte_size": 91, "width": 4, "height": 4, "aspect_ratio": 1.0},
  "measurements": {
    "transparency": {"status": "MEASURED", "transparent_pixels": 12, "translucent_pixels": 0, "opaque_pixels": 4, "transparent_percent": 75.0, "translucent_percent": 0.0, "opaque_percent": 25.0},
    "visible_bbox": {"status": "MEASURED", "value": {"left": 1, "top": 1, "right": 3, "bottom": 3, "width": 2, "height": 2}},
    "canvas_occupancy": {"status": "MEASURED", "value_percent": 25.0},
    "touches_canvas_edges": {"status": "MEASURED", "left": false, "top": false, "right": false, "bottom": false}
  },
  "warnings": [],
  "limitations": ["No detecta anatomía ni semántica.", "No evalúa calidad artística.", "La ocupación describe la caja de píxeles con alfa > 0."]
}
\`\`\`

El \`byte_size\` es ilustrativo; en cada respuesta real equivale a la longitud real. El método y las limitaciones completas aparecen en la salida del módulo.

## Ejemplos inválidos

- \`text/plain\` → 415 \`UNSUPPORTED_MEDIA_TYPE\`.
- PNG declarado como JPEG → 415 \`MIME_MISMATCH\`.
- Cuerpo vacío → 400 \`EMPTY_BODY\`.
- Bytes aleatorios como PNG → 422 \`INVALID_IMAGE\`.
- Más de 12 MiB → 413 \`FILE_TOO_LARGE\`.
- Imagen 9000×100 → 413 \`DIMENSIONS_TOO_LARGE\`.
- \`PUT /api/analyze\` → 405 \`METHOD_NOT_ALLOWED\`.
- Origin externo → 403 \`ORIGIN_NOT_ALLOWED\`.

## Trazabilidad, dependencia y decisión

La salida incluye versión del analizador, formato real, MIME declarado, bytes, dimensiones, relación de aspecto y método por métrica. La misma imagen y versión deben dar el mismo resultado. Se fija Pillow en \`requirements-analysis.txt\`, sin red ni modelo remoto.

Se eligió Pillow para decodificar píxeles PNG/JPEG/WebP reales, inspeccionar alfa y rechazar imágenes corruptas o bombas de descompresión. La biblioteca estándar no ofrece decodificación general de imágenes; implementar PNG manualmente elevaría el riesgo y el mantenimiento. Coste: instalar una dependencia Python adicional compatible con el entorno local. No cambia las dependencias web ni requiere servicio de pago.

## Ejecución local

1. \`python -m pip install -r requirements-analysis.txt\`
2. \`python botimagen_server.py\`
3. \`curl -i -X POST http://127.0.0.1:8765/api/analyze -H "Content-Type: image/png" --data-binary "@imagen.png"\`
4. \`python tests/test_image_analysis.py\` y \`python tests/test_local_api.py\`

No hay pantalla React integrada y la UI no debe anunciar esta capacidad como disponible.

## Evidencia visual y licencias

El test HTTP usa el archivo ya existente \`references/dataset-cuerpos/0.png\` sin duplicarlo ni publicarlo. Su procedencia/licencia no queda verificada aquí; no redistribuir ni entrenar con ese dataset hasta validarla. Fixtures RGBA pequeños se generan dentro de los tests y son sintéticos.
