# BOTIMAGEN · BIMG-PNG-CHARACTER-PIPELINE-CLOSURE-001 · ORDEN DE CIERRE EJECUTABLE

**MODO:** IMPLEMENTAR, CORREGIR Y ENTREGAR. Prohibido responder con otro plan, auditoría, análisis de viabilidad o lista de futuras fases.

**Repositorio:** https://github.com/jonhararagi/botimagen  
**Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**Fuente de continuidad:** `cerebro/ESTADO_ACTUAL.md`  
**HEAD observado al emitir esta orden:** `43d3be41adf2cbe5e6b3dffdd2ef86799b8f784a`  
**TIMER:** 3–6 horas activas estimadas para cerrar esta integración. No afirmar tiempo real si no se midió. Continuar hasta el cierre en esta misma tarea cuando el entorno lo permita.

## MISIÓN

Dejar utilizable dentro de BotImagen el flujo para importar PNG, separar piezas que ya tengan transparencia, asignarles categoría, normalizarlas, ajustar anclajes, guardarlas en la biblioteca modular y reutilizarlas para componer personajes. El usuario debe poder incorporar sus propios PNG sin editar código ni recortar previamente cada pieza en otro programa cuando el archivo ya contiene piezas separadas por alfa.

No exigir ni fingir reconocimiento semántico perfecto. Un PNG opaco con una waifu completa no contiene capas ocultas de pelo/cuerpo/ropa. En ese caso debe funcionar el recorte manual existente, explicar la limitación en la interfaz y permitir guardar la pieza recortada. El objetivo es una herramienta práctica, no prometer magia.

## ESTADO REAL Y FALLO ACTUAL QUE DEBES ARREGLAR

El código de separación por alfa y su UI ya existen:
- `web/src/visual/pngAlphaSplitter.ts`
- `web/src/visual/ModularAssetLibrary.tsx`
- `web/src/visual/pngToModularAsset.ts`
- editor de anclajes y compositor modular existentes.
- API existente de biblioteca y composición. No crear otro catálogo, endpoint paralelo o segundo compositor.

CI más reciente consultada:
- Ejecución #603: https://github.com/jonhararagi/botimagen/actions/runs/38381770670
- SHA probado: `43d3be41adf2cbe5e6b3dffdd2ef86799b8f784a`
- Resultado: **FAIL** en el smoke de Chromium, no marcar PASS.
- Error exacto: `web/browser_smoke.mjs:333`, “The dragged head landmark X should persist near the pointer-up coordinate; expected 0.54, received 0.5”.
- La ejecución no encontró `artifacts/visual-qa/`, así que no afirmar que existe captura de esa ejecución.
- Comprueba y corrige la causa real del flujo de arrastre/persistencia del anclaje. No borres ni relajes la aserción para que CI quede verde.

## ORDEN DE TRABAJO, SIN CICLOS INÚTILES

1. Lee `cerebro/ESTADO_ACTUAL.md`, inspecciona el HEAD real y revisa el diff reciente. No asumas que las SHA antiguas siguen vigentes.
2. Corrige primero el fallo E2E del anclaje. El test debe demostrar que el punto guardado coincide con la coordenada final del puntero, dentro de la tolerancia definida. Mantén la aserción estricta.
3. Recorre el flujo real de importación de extremo a extremo:
   - cargar PNG desde archivo;
   - previsualizar origen;
   - detectar componentes separados por alfa;
   - filtrar motas pequeñas sin perder piezas válidas;
   - generar cada pieza como PNG con transparencia y límites correctos;
   - clasificar cada pieza por separado: cuerpo/base, cabeza/cara, cabello, parte superior, parte inferior, calzado o accesorio;
   - cambiar categoría antes de guardar;
   - normalizar cada pieza al escenario común sin estirar su proporción;
   - mostrar/editar anclajes de cada pieza;
   - guardar piezas y fuente original;
   - reabrir la biblioteca y comprobar persistencia;
   - seleccionar piezas guardadas y componer un personaje en el compositor existente.
4. Si la imagen tiene una sola silueta conectada o fondo opaco, no mostrar un falso éxito de separación. Conservar la fuente y guiar al usuario hacia el recorte manual existente. No afirmar que el sistema reconoce automáticamente qué píxeles son pelo, piel o ropa.
5. Mantén una sola copia del PNG fuente cuando se extraigan varias piezas del mismo archivo. Cada pieza debe referenciar la fuente y mantener procedencia. No cambiar los IDs o contratos del catálogo.
6. Añade o corrige pruebas deterministas donde realmente falten: PNG con tres componentes alfa; una sola silueta; fondo opaco; ruido pequeño; categorías distintas; guardar/reabrir; fuente guardada una sola vez; anclaje final de pointer-up; composición de piezas guardadas. No crear una enorme batería duplicada ni tests que solo verifican nombres de archivos.
7. Ejecuta build web/TypeScript, suites Python/API existentes y smoke E2E Chromium. Corrige todos los fallos de este flujo. No ocultes errores con `|| true`, skips, aserciones debilitadas ni fixtures que eviten el camino real.
8. Inspecciona las capturas del HEAD final si el test las produce. Si no hay artefacto, dilo y corrige el pipeline de captura si forma parte del fallo. No afirmes QA visual manual si no abriste/revisaste la imagen.
9. Actualiza `cerebro/ESTADO_ACTUAL.md` solo con hechos comprobados: SHA final, CI exacta, E2E, funciones listas y limitaciones restantes. No añadas otro documento de planificación.
10. Comprueba el HEAD y CI después del último cambio. Si una ejecución sigue en curso, espera/consulta hasta que termine cuando el entorno lo permita.

## REGLAS DE CAMBIOS

- Trabaja únicamente en `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- No editar `main` directamente, no fusionar ni cerrar PRs, no reescribir historia.
- Preservar perfiles existentes, IDs, API, recetas v1/v2/v3, Style Lab, NanoWear, Chromapatch, catálogo, piezas CyberStreet y compositor actual.
- No introducir imágenes externas de prueba en el catálogo público automáticamente.
- No descargar ni copiar arte externo sin que el usuario lo solicite explícitamente.
- No reemplazar la app por una demo separada.
- No expandir el alcance salvo que otros defectos bloqueen la importación o composición.

## CRITERIO DE CIERRE REAL

Marca esta tarea DONE solo cuando:
- el error actual del anclaje esté corregido y la aserción exacta pase;
- build web y suites relevantes pasen en el SHA final;
- E2E confirme separación, categorías independientes, normalización, persistencia y composición;
- la fuente se guarde una sola vez;
- los fallos de separación conserven el PNG original y se expliquen claramente;
- el informe incluya enlaces reales a CI/artefactos, SHA final y limitaciones verificadas.

No declarar que todo BotImagen está terminado si solo se cierra esta integración. No terminar con “siguiente paso: hacer otro análisis”. Si queda bloqueado por una causa externa real, identificarla y dejar el código hasta donde se pueda probar.

**Informe final breve:** resultado, archivos modificados, SHA final, CI/E2E con enlaces, limitaciones verificadas y tiempo real solo si fue medido.

La última línea del informe debe ser exactamente:
`bot obrero espera siguientes ordenes`
