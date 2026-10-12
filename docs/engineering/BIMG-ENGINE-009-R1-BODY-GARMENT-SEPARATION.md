# BIMG-ENGINE-009-R1 · Separación de geometría corporal y vestuario

**Veredicto:** PARTIAL  
**Rama:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**PR:** [#11](https://github.com/jonhararagi/botimagen/pull/11)  
**HEAD inicial revisado:** `a7c5aefcff7f1e8fda8b0f50361853f85c29f3bd`  
**HEAD de implementación antes de la documentación:** `727dcc94e4c87c254475f9c074ae425119063e06`  
**HEAD final documental:** se registra en el comentario de PR y se valida con CI antes del cierre.  
**TIMER:** 4–7 horas estimadas. Tiempo real: `NOT_MEASURED`.

## Resumen ejecutivo

Se añadió una fuente geométrica explícita para torso, pelvis, piernas y pies que no depende de IDs de vestuario ni de los controles de largo de torso y ajuste de cintura. El renderer dibuja esa base como una capa semántica `body-base`; la composición de prendas preexistente continúa por encima de la base. Cuello, brazos y manos se calculan con landmarks fijados para la vista corporal, en vez de reutilizar el ajuste variable de la prenda.

El resultado es **PARTIAL**, no PASS: la separación estructural está implementada, pero la geometría base es deliberadamente mínima y requiere inspección de las capturas y revisión artística antes de considerar fiable una referencia anatómica para calibración. No se ajustaron deliberadamente las proporciones de producción ni los valores de `bodyLandmarks.ts`.

## Diseño y procedencia

- **Geometría nueva:** `getBodyBaseGeometry(view)` en `web/src/visual/bodyLandmarks.ts`, con rutas independientes para torso, pelvis, piernas y pies en el marco SVG existente de 340 × 490.
- **Vista frontal/trasera:** ambas utilizan el mismo contrato y encuadre; las rutas de torso, pelvis y piernas tienen variaciones localizadas por vista. La forma de los pies se comparte.
- **Cuerpo visible sin prendas:** el grupo SVG `data-layer-id="body-base"` contiene las cuatro regiones con IDs `data-body-region`. El arnés oculta las capas de ropa y cosméticos, sin recolorear ni reutilizar las rutas de prendas como anatomía.
- **Landmarks de piel:** cuello, brazos y manos usan `getBodyLandmarks(view, 343, 34)`, con valores constantes para que los sliders de ajuste de vestuario no cambien la geometría corporal observada.
- **Rutas reutilizadas:** se conservan el renderer SVG, los landmarks compartidos existentes, los elementos de cabeza, cuello, brazos y manos, y la composición de prendas. Las rutas antiguas de torso y tren inferior siguen siendo superficies de composición/vestuario, no fuente de verdad para la base anatómica.
- **Oclusión:** el grupo de cuerpo base se pinta antes de cuello, brazos y vestuario; las prendas siguen teniendo sus capas y reglas de pintura existentes.

## Archivos cambiados

- `web/src/visual/bodyLandmarks.ts`: agrega el ID semántico `body-base` al contrato de capas y exporta `getBodyBaseGeometry(view)`.
- `web/src/visual/VisualCharacterRenderer.tsx`: renderiza las regiones corporales independientes y desacopla cuello, brazos y manos de los valores variables de ajuste de prenda. La firma pública de `VisualCharacterRenderer({ values, recipe }: RendererProps)` se conserva.
- `web/browser_smoke.mjs`: actualiza el fixture QA para ocultar prendas/cosméticos, comprobar que las cuatro regiones de cuerpo permanecen visibles, medir cajas SVG y escribir `neutral-body-manifest.json`. Las capturas de vestuario continúan dentro del smoke habitual.
- `tests/test_visual_body_landmarks.py`: amplía los contratos estáticos para la geometría base, el orden de capas y las regiones medidas.
- `cerebro/ESTADO_ACTUAL.md`, `cerebro/PROGRESO.md`: continuidad y porcentaje ponderado sin incremento.
- Este informe.

No se modificaron el catálogo de personajes/prendas, recetas, materiales, datos de personajes, API pública ni `main`. No se modificaron intencionadamente las proporciones existentes en `bodyLandmarks.ts`; las rutas nuevas son una base geométrica explícita, no una propuesta de recalibración estética.

## Medición y disponibilidad regional

Las cajas se obtienen con `SVGGeometryElement.getBBox()`, conservando coordenadas SVG y normalizando respecto de la altura de la unión de cajas observadas. Las unidades son unidades de usuario SVG; la captura raster se genera en Chromium. Las cajas son límites de rutas, no medidas anatómicas clínicas.

| Región | Estado | Interpretación |
|---|---|---|
| Cabeza | Proxy | Caja de la elipse de cabeza existente. |
| Cuello | Proxy | Extensión de la ruta de cuello; no define articulación completa. |
| Hombros y tórax | Proxy parcial | Caja de torso base; todavía no hay contornos separados para hombros y tórax. |
| Cintura | No disponible como región independiente | No existe un contorno de cintura independiente de las uniones del torso. |
| Torso | Ruta corporal independiente | Caja de la ruta base, pendiente de revisión artística. |
| Pelvis | Ruta corporal independiente | Caja de la ruta base, no medida anatómica detallada. |
| Piernas y rodillas | Proxy parcial | Las piernas tienen rutas independientes; las rodillas no son regiones aisladas. |
| Tobillos y pies | Proxy parcial | Hay ruta independiente de pies; los tobillos siguen siendo puntos/landmarks, no contornos segmentados. |
| Brazos y manos | Proxy | Se mantienen las rutas de piel existentes con landmarks fijos para el ajuste de vestuario. |

No se proponen cambios de proporciones. La medición todavía no justifica una calibración.

## Validación

- **CI del HEAD inicial R5:** run [#337](https://github.com/jonhararagi/botimagen/actions/runs/38198306943) terminó en fallo en la prueba del contrato del arnés R5; por tanto, no se considera aprobado.
- **CI R6:** la ejecución debe asociarse al HEAD final documental, y solo se informará PASS si todos los pasos, incluido build y smoke de Chromium, terminan correctamente.
- **Capturas esperadas:** `neutral-body-front.png`, `neutral-body-back.png`, `neutral-body-manifest.json`, más las capturas habituales de vestuario del smoke. Los nombres están configurados en el arnés; la disponibilidad e inspección de artefactos se confirma después del run final.
- **API pública:** preservada; no se agregan props ni se cambian contratos de llamada.
- **Catálogo/recetas:** sin cambios intencionados.
- **Proporciones:** no se hizo una recalibración deliberada.
- **WINDOWS_MANUAL_QA:** `NOT_RUN`. Chromium headless no equivale a validación física en Windows/Chrome/Edge.

## Riesgos restantes y siguiente tarea

La geometría base es funcional como separación estructural, pero todavía es esquemática. La vista posterior no tiene una anatomía de espalda detallada, los landmarks de rodillas/tobillos no representan regiones segmentadas y la continuidad visual entre cuello, torso, pelvis y extremidades requiere inspección humana. No debe usarse aún para inferir ajustes de proporciones.

Siguiente paso: inspeccionar el artefacto final de frente, espalda y vestuario. Corregir únicamente defectos de continuidad evidentes, sin calibrar proporciones, o declarar bloqueada la referencia si la silueta base no ofrece una lectura anatómica coherente. Después se podrá autorizar una tarea independiente de calibración visual.

**Tiempo real empleado:** `NOT_MEASURED`.  
**TIMER estimado:** 4–7 horas.
