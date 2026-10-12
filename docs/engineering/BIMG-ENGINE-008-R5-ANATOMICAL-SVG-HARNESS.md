# BIMG-ENGINE-008-R5 · Arnés de referencia anatómica y verificación SVG

**Veredicto:** PARTIAL  
**Rama:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**PR:** [#11](https://github.com/jonhararagi/botimagen/pull/11)  
**HEAD de partida revisado:** `5ef465bf0179636b98b78c5effaafc55b74c0055`  
**SHA comunicado por la tarea:** `a74ae4055d432d169554cba3f0dfef65a75eee73` (ya no era HEAD al iniciar; se revisó y continuó desde el HEAD real).  
**TIMER:** 2–4 horas estimadas. Tiempo real: no medido de forma fiable.

## Resumen ejecutivo

El procedimiento de captura del SVG real se ha instrumentado y las mediciones de cajas de ruta se normalizan de manera reproducible. Sin embargo, el resultado **no cumple la aceptación de una referencia anatómica neutra**: el renderer reutiliza rutas de vestuario como superficies del torso, pelvis y piernas. Aplicarles color de piel no elimina su geometría de ropa ni las convierte en anatomía. Por eso no se autoriza ninguna modificación de proporciones en R5.

## Estrategias

### A. Renderer existente en Chromium

**Resultado: PASS para inspeccionar la composición real; PARTIAL para referencia anatómica.** El smoke test inicia API y Vite, abre la aplicación real y utiliza el SVG renderizado por `VisualCharacterRenderer`. La vista frontal/trasera usa el `viewBox="0 0 340 490"` existente. No se altera la API pública ni se añaden controles de depuración de producto.

### B. Arnés aislado de QA

**Resultado: PARTIAL.** Se reforzó el fixture temporal de `web/browser_smoke.mjs`. Durante la captura, aplica CSS de QA al DOM SVG real, oculta capas cosméticas y verifica el estado computado de cabello, prendas, capas exteriores, calzado y Chromapatch. Registra cajas de rutas en unidades SVG y proporciones normalizadas respecto de la unión vertical de las cajas. La hoja de estilos temporal se retira al terminar el fixture.

El manifiesto de salida etiqueta el resultado como `PARTIAL_NOT_A_NEUTRAL_ANATOMY_REFERENCE`; no presenta las capturas como assets de producción ni como validación artística.

### C. Bloqueo verificable

La limitación no es la captura: es la ausencia de una superficie corporal neutra e independiente de las prendas. Las rutas `.garment-torso-main`, `.character-lower-body` y `.character-leg-silhouette` son geometría reutilizada de construcción/vestuario. Recolorear esas rutas cambia la pintura, no la forma ni su semántica. La anatomía completa no se puede medir de forma inequívoca con la estructura actual.

## Evidencia visual

Las capturas y el manifiesto se generan en CI dentro de `artifacts/visual-qa/`:

- `neutral-body-front.png`
- `neutral-body-back.png`
- `neutral-body-manifest.json`

Se publicarán como artefacto del run de validación asociado al HEAD final. Hasta verificar ese run, los enlaces al artefacto y el resultado de CI permanecen pendientes.

## Medición y confianza

Todas las coordenadas se expresan en unidades de usuario SVG, con origen en la esquina superior izquierda del `viewBox` de 340 × 490. Las cajas proceden de `SVGGeometryElement.getBBox()`, no de los landmarks ni de una estimación a ojo. El manifiesto calcula la altura de la unión vertical de las cajas y normaliza anchura, posición vertical y altura de cada caja con esa referencia. Las capturas se toman del mismo componente y mantienen el mismo `viewBox`.

| Región | Estado | Método | Confianza |
|---|---|---|---|
| Cabeza | Proxy observable | Caja de la elipse de cabeza del renderer | Baja a media para extensión de ruta; no equivale a contorno craneal neutro |
| Cuello | Proxy observable | Caja de la ruta de cuello existente | Baja a media para extensión de ruta |
| Brazos | Proxy observable | Caja de la ruta de piel de brazos | Baja a media para extensión de ruta |
| Hombros y tórax | No disponible como anatomía neutra | La silueta visible está solapada/acoplada a rutas de torso y mangas | Insuficiente |
| Cintura y pelvis | No disponible | El torso/pelvis visible utiliza rutas de vestuario | Insuficiente |
| Longitud de piernas, rodillas y tobillos | No disponible como anatomía observada | Las rutas de piernas se reutilizan como geometría de ropa | Insuficiente |
| Pies y continuidad de uniones | No disponible | El calzado se oculta y la ruta de pierna no define una unión anatómica independiente | Insuficiente |

No se publican valores normalizados de proxy como si fueran medidas anatómicas. El manifiesto sí conserva los límites geométricos y sus cocientes para depurar la construcción del renderer, claramente etiquetados como proxies.

## Propuesta de ajustes anatómicos

**Ningún ajuste propuesto.** La evidencia disponible no permite cuantificar un cambio anatómico responsable. No se aplican ni se sugieren cambios de proporciones en R5.

## Archivos cambiados

- `web/browser_smoke.mjs`: manifiesto explícito de limitaciones, normalización de cajas de rutas y aserciones de vista/capas cosméticas.
- `tests/test_visual_body_landmarks.py`: contrato estático para comprobar que el manifiesto identifica el estado parcial, normalización y auditoría de capas.
- `cerebro/ESTADO_ACTUAL.md`: registro de continuidad R5.
- `docs/engineering/BIMG-ENGINE-008-R5-ANATOMICAL-SVG-HARNESS.md`: este informe.

## Integridad de producción

- `web/src/visual/bodyLandmarks.ts`: sin cambios en R5.
- `web/src/visual/VisualCharacterRenderer.tsx`: sin cambios en R5.
- Geometría/proporciones de producción: **sin cambios**.
- API pública, catálogo, recetas y datos de personajes: **sin cambios**.
- `main`: **sin cambios**; PR #11 no se fusionó.
- Validación física en Windows: **WINDOWS_MANUAL_QA: NOT_RUN**.

## Pruebas

La prueba estática del contrato y el smoke de Chromium deben verificarse en CI sobre el HEAD final. No se afirma PASS de CI hasta que el run asociado al commit final termine correctamente. La captura headless tampoco sustituye la inspección manual en Windows.

## Siguiente paso recomendado

Autorizar una tarea de arquitectura separada para construir una superficie base de cuerpo explícita, independiente de prendas, que ambas vistas puedan compartir. Esa tarea deberá preservar el API del renderer y después generar nuevas referencias. Solo entonces corresponde medir hombros, tórax, cintura, pelvis, piernas, rodillas, tobillos y pies para decidir si se justifica alguna corrección.

**Cierre R5:** el arnés es reproducible como herramienta de diagnóstico SVG, pero la referencia anatómica solicitada queda **PARTIAL** hasta separar la geometría corporal de la geometría de ropa.
