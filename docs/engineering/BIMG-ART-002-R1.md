# BIMG-ART-002-R1 · Salto de calidad del generador anime

**Estado:** PARTIAL; implementación en rama, CI y revisión de capturas pendientes.  
**Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**PR:** https://github.com/jonhararagi/botimagen/pull/11  
**HEAD inicial comprobado:** `5ef17beb774f17d5ae57ada655c949343cee92aa`  
**Último commit de código/pruebas y manifiesto E2E:** `32d2b71b0ce9c77b4825bbb566ec53a20a95d6ab`  
**CI de implementación:** #399 SUCCESS, asociada al HEAD de rama `32d2b71b0ce9c77b4825bbb566ec53a20a95d6ab`: https://github.com/jonhararagi/botimagen/actions/runs/38253325201. La CI del SHA final después de estos cambios documentales queda pendiente.  
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



### Anatomía facial y volumen de prendas
- Se extendió el esqueleto vendorizado con `face_shape` opcional, conservando `equilibrada` como geometría histórica por defecto. La función de contorno ahora transforma pómulos, mandíbula o mentón según el perfil elegido; el control ya no cambia solo metadatos o posición de ojos/boca.
- El motor añade paneles de sombra ajustados a la silueta y costuras específicas para capas largas, bomber y equipamiento táctico. En vista posterior hay sombras laterales dentro del panel de prenda.
- Se añadieron pruebas de regresión para demostrar que el contorno real de la mandíbula cambia y que las prendas producen las capas de volumen/costura esperadas.

## Revisión visual de capturas (artefacto CI #399)

Artefacto: https://github.com/jonhararagi/botimagen/actions/runs/38253325201/artifacts/11748818282

PNG inspeccionados del artefacto real de Chromium:
- `product-studio-front-cyber-grid.png`
- `product-studio-back-dusk-orbit.png`
- `product-studio-neon-archivist-front.png`
- `product-studio-neon-archivist-back.png`
- `art-face-diamond-straight-bridge.png`
- `art-long-straight-pink.png`
- `art-long-straight-extra-long.png`

Comparación visual realizada contra el artefacto anterior de CI #378. Se aprecia una silueta posterior de cabello mucho más larga y ligada al largo configurado, una variación real del contorno mandibular, diferencias de corte/color/largo y un sombreado/costuras de prendas algo más legibles. No obstante, la mejora frontal de volumen es moderada y la figura conserva una pose bastante rígida; las manos siguen pequeñas a escala de interfaz y varios peinados aún reutilizan familias geométricas. Estos defectos impiden dar por aceptado el salto artístico completo: el estado se mantiene **PARTIAL**.

**Nota del manifiesto:** `sourceSha` en Chromium refleja `GITHUB_SHA` del evento de CI (la revisión que ejecutó el workflow); la asociación de GitHub Actions identifica el HEAD de la rama por separado. `WINDOWS_MANUAL_QA: NOT_RUN`.

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
