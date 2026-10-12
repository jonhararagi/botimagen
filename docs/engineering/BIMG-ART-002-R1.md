# BIMG-ART-002-R1 · Salto de calidad del generador anime

**Estado:** PARTIAL; implementación en rama, CI y revisión de capturas pendientes.  
**Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**PR:** https://github.com/jonhararagi/botimagen/pull/11  
**HEAD inicial comprobado:** `5ef17beb774f17d5ae57ada655c949343cee92aa`  
**Último commit de código/pruebas y manifiesto E2E:** `e53235616bf0d58ff623dd4f19e74abdc1a15417`  
**CI del SHA final:** PENDING, no declarar aprobado hasta obtener resultado asociado al HEAD exacto. El smoke de este commit captura ambas vistas de los dos presets y variantes faciales/capilares.  
**Tiempo real medido:** NOT_MEASURED  
**WINDOWS_MANUAL_QA:** NOT_RUN

## Cambios implementados

### Cara y controles paramétricos
- `face_shape` ahora tiene diez perfiles de madurez/estructura diferenciados, con valores moderados para conservar la edad visual adulta y sin cambiar IDs del catálogo.
- La forma facial también modifica el espaciado ocular y el desplazamiento de boca en las opciones pertinentes, aprovechando los campos existentes de `FaceStyle`.
- `nose_style` dejó de forzar siempre el mismo punto nasal. Las opciones mínimas usan el punto; las opciones de puente/contorno permiten la línea nasal adulta que ya ofrece el renderer vendorizado.
- El SVG incorpora metadatos `data-face-shape` y `data-nose-style` limitados a IDs conocidos para poder auditar qué configuración produjo la imagen.

### Cabello y vista posterior
- Se ampliaron las reglas de resolución de peinados para utilizar las siluetas diferenciadas disponibles en el renderer MIT vendorizado en más combinaciones de corte, flequillo, textura y mechones laterales.
- La masa de cabello de la vista posterior ya no termina en una longitud fija: su caída sigue `hair_length`, los landmarks corporales y los estilos de nuca/capas/asimetría.
- Se añadieron trazos posteriores y un detalle de trenza para `back_hair=panel_trenzado`; el recorrido de la trenza sigue la caída seleccionada.
- Se conserva un único SVG visible generado por Python a través de `POST /api/render/character`. No se añadió un segundo renderer visible ni dependencias de frontend.

### QA automatizada preparada
- `tests/test_character_render_engine.py` añade regresiones para diferencias reales en SVG entre forma facial/nariz y para la silueta posterior según largo/estilo de cabello.
- `web/browser_smoke.mjs` amplía las capturas Chromium con la vista posterior de Neon Archivist y variantes reales de cara, nariz, corte, color y largo de cabello.
- `product-studio-manifest.json` identifica el SHA de GitHub Actions cuando está disponible, registra las variantes y enlaza la referencia anterior de BIMG-PRODUCT-001-R1.
- El smoke existente mantiene las capturas de Street Sentinel frontal/trasera y la matriz de prendas bomber, equipamiento táctico y abrigo largo, además de los extremos de los controles de ajuste.

## Evidencia y límites

- Referencia anterior de producto: HEAD `5ef17beb774f17d5ae57ada655c949343cee92aa`, CI #378: https://github.com/jonhararagi/botimagen/actions/runs/38248523028.
- El trabajo no se declara artísticamente aceptado hasta que la CI del HEAD final genere el artefacto y las capturas se inspeccionen de forma efectiva. Una suite verde confirma contratos y recorridos, no por sí sola calidad estética.
- La geometría posterior sigue siendo una aproximación paramétrica 2D. Los peinados no tienen aún una silueta artesanal única para cada ID del catálogo y no se ha añadido un rig anatómico nuevo.
- No se cambió el esquema del catálogo, los IDs, las recetas, los perfiles guardados ni el contrato de API.
- No se añadió recurso externo; se conserva la licencia MIT del código vendorizado, separada de la procedencia de imágenes/datasets.
- `WINDOWS_MANUAL_QA: NOT_RUN`; no se afirma validación física de Chrome/Edge en Windows.
- La beta global se mantiene en **63%**. Este trabajo no incrementa el porcentaje por el número de archivos ni por las pruebas añadidas.

## Siguiente paso obligatorio

1. Obtener la CI del SHA final exacto y corregir cualquier fallo.
2. Descargar e inspeccionar las capturas PNG reales de la CI; no inferir su calidad solo por metadatos.
3. Si siguen visibles cortes, rigidez o solapamientos, corregir el motor y repetir capturas antes de reconsiderar el estado.
4. Actualizar este informe y el PR con el SHA y el artefacto definitivos.

## TIMER

Estimación inicial del tramo: **10–16 horas activas** (aproximadamente 1–2 jornadas).  
Tiempo real acumulado: **NOT_MEASURED**.
