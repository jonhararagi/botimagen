# BOTIMAGEN · BIMG-PNG-PIPELINE-CIERRE-003 · IMPLEMENTAR Y ENTREGAR

**Modo:** IMPLEMENTACIÓN DIRECTA. No responder con auditoría, diseño futuro, esquema, informe de ideas ni una cadena de nuevos prompts.
**Repositorio:** https://github.com/jonhararagi/botimagen
**Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`
**Continuidad obligatoria:** leer `cerebro/ESTADO_ACTUAL.md`, `cerebro/PROMPT_OBRERO_MODELO_PNG_MULTICAPA_002.md` y `cerebro/PROMPT_OBRERO_PNG_ALPHA_SPLITTER_001.md`.
**Pruebas privadas:** `https://github.com/jonhararagi/botimagen-referencias-privadas/tree/test/reference-import-bimg-001`
**TIMER:** objetivo de 8–16 horas activas para cerrar este tramo; estimación, no tiempo medido. No pausar tras otro análisis.

## Objetivo que se entrega al usuario

Un flujo real y continuo donde el usuario carga varios PNG normales, los organiza como referencias o piezas, recorta regiones manualmente cuando haga falta, separa automáticamente componentes que ya estén separados por transparencia, los clasifica, los guarda en la biblioteca, corrige los anclajes y compone un personaje reutilizable. Después puede cargar más PNG y ampliar la biblioteca sin perder los anteriores.

## Estado conocido, comprobar contra el HEAD actual

La aplicación ya tiene el importador en `web/src/visual/ModularAssetLibrary.tsx`, normalizador `web/src/visual/pngToModularAsset.ts`, separador por alfa `web/src/visual/pngAlphaSplitter.ts`, constructor `web/src/visual/CharacterModelBuilder.tsx`, API Python y compositor modular. No crear una segunda biblioteca, otro endpoint ni otro compositor.

La rama tiene recorte manual, normalización a 512×768, estimación de anclajes, persistencia y separación individual de PNG con islas transparentes. La separación alfa no entiende semánticamente pelo/ropa/piel. Un PNG opaco de una waifu no contiene capas ocultas: se necesita máscara/contorno manual o un segmentador real. No afirmar que una imagen completa se convirtió automáticamente en prendas perfectas.

La prueba privada de las imágenes de referencia y Firefly debe seguir privada. No copiar imágenes de juegos a BotImagen público, ni presentar capturas sintéticas como si fueran Firefly. No afirmar QA visual sin inspeccionar la captura correspondiente.

## Ejecutar en esta misma tarea

1. Verifica HEAD y estado de CI actuales; lee los tres documentos indicados. No uses SHA histórico como si fuera HEAD actual.
2. Recorre el flujo de punta a punta y corrige los defectos reales que encuentres:
   - selector múltiple y drag/drop de PNG/JPEG/WebP;
   - importación por lote sin tener que repetir operaciones innecesarias;
   - separación por alfa de PNG con varias islas, conservando cada pieza en su resolución y transparencia correctas;
   - si un PNG no es separable, mantenerlo visible y permitir recorte manual, sin borrarlo ni reportar falso éxito;
   - permitir clasificar cada pieza (cuerpo, cabeza/cara, cabello, parte superior/inferior, calzado, accesorio, referencia);
   - recorte manual preciso, sin errores de coordenadas por aspect ratio;
   - normalización sin estirar la proporción;
   - fuente original guardada una sola vez y referenciada por todas sus piezas;
   - guardar/reabrir biblioteca, editar y confirmar anclajes y componer las piezas con el compositor existente.
3. Añade a la UI un comando de lote para separar todas las hojas PNG transparentes elegibles. Los archivos que fallen deben quedar en la lista para el recorte manual, indicando cuáles no pudieron separarse. No reemplazar ni eliminar la función de separación individual.
4. Si la segmentación por color/conectividad confunde prendas contiguas, implementa o termina una edición de máscara local real (pincel para sumar/borrar y restaurar/deshacer) reutilizando el constructor actual. No fingir segmentación semántica si no existe un modelo real.
5. Añade pruebas de navegador al camino real: varios archivos, tres islas alfa, archivo opaco que se conserva, clasificación individual, persistencia de una única fuente, coordenadas finales de anclajes, reapertura y composición. No debilitar aserciones ni ocultar fallos.
6. Ejecuta compilación TypeScript/Vite, suites Python/API y Chromium E2E completas. Repara los fallos introducidos por esta tarea. Si CI falla, seguir corrigiendo en vez de entregar un informe de fallo como resultado final.
7. Revisa la captura E2E real del HEAD final. No etiquetar una captura de figura sintética como imagen de un personaje del juego. No afirmar Windows manual si no se ejecutó.
8. Actualiza `cerebro/ESTADO_ACTUAL.md` con el HEAD final, rutas implementadas, comandos y resultados reales de CI, limitaciones restantes y la siguiente acción concreta. No sobrescribas el historial anterior.
9. Deja el cambio en esta rama y prepara/actualiza un único PR de trabajo si corresponde. No modificar `main), no fusionar ni cerrar PR existentes y no duplicar ramas/PR.

## Aceptación obligatoria

- [ ] El usuario puede importar múltiples imágenes desde la UI.
- [ ] El lote de PNG transparentes crea piezas individuales; los archivos no separables siguen disponibles para recorte manual.
- [ ] Cada pieza conserva categoría, pose, procedencia, hash y vínculo a su fuente.
- [ ] La máscara puede corregirse de forma visual antes de guardar.
- [ ] Los materiales guardados persisten tras recargar y pueden seleccionarse para componer.
- [ ] Build, pruebas Python/API y Chromium pasan en el SHA final, con enlaces verificables.
- [ ] El estado del repositorio refleja lo que está probado y lo que no.

**Prohibido cerrar como DONE** si solo compila, si solo se actualizan documentos, si los tests no recorren la UI real o si la composición final no se prueba. Si un requisito queda bloqueado por el entorno, seguir implementando todo lo demás y dejar evidencia exacta del único bloqueo real.

**Informe final breve:** commit/HEAD, PR, CI, funciones entregadas, limitaciones reales, TIMER restante. No repetir el plan ni pedir al usuario que vuelva a explicar el proyecto.
