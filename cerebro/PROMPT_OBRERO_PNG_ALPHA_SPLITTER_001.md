# BOTIMAGEN · BIMG-PNG-ALPHA-SPLITTER-001 · CERRAR LA SEPARACIÓN REAL DE PNG

**ORDEN DE IMPLEMENTACIÓN. NO ENTREGAR OTRO PLAN, AUDITORÍA NI RESUMEN COMO RESULTADO.**

**Rol:** Bot Obrero. Senior TypeScript/React Engineer, Raster Image Processing Engineer, Character Asset Pipeline Engineer, Browser Automation Engineer y QA Engineer.

**Repositorio:** https://github.com/jonhararagi/botimagen  
**Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**Fuente de continuidad:** `cerebro/ESTADO_ACTUAL.md`  
**HEAD registrado al crear esta orden:** `ec46ce6ce42820e80bf8070486813e257e6341e1`  
**TIMER:** 2–4 horas activas estimadas para cerrar y validar esta etapa. Tiempo real solo si fue medido.

## MISIÓN

Completa la función de importar una hoja PNG con varios elementos ya separados por transparencia, dividirla en piezas PNG independientes, clasificarlas como partes de un personaje y guardarlas en la biblioteca modular de BotImagen. La implementación inicial ya existe. **No la vuelvas a diseñar desde cero: comprueba lo que hay, termina la integración, añade pruebas, arregla los fallos y deja una entrega utilizable.**

## CÓDIGO YA PUBLICADO

- `web/src/visual/pngAlphaSplitter.ts`: detecta componentes conectados en el canal alfa y produce PNG separados.
- `web/src/visual/ModularAssetLibrary.tsx`: expone «Separar piezas por transparencia» al importar recursos de tipo `modular_piece`; las salidas deben poder clasificarse individualmente, normalizarse y guardarse.
- `web/src/visual/pngToModularAsset.ts`: normalizador existente a 512×768, retirada opcional de fondo uniforme, recorte manual y estimación de anclajes.
- API existente `/api/modular-assets`, endpoint de composición `/api/modular-compose` y compositor actual: conservarlos como la ruta única.

## TRABAJO QUE DEBES EJECUTAR AHORA

1. Consulta el HEAD real y lee `cerebro/ESTADO_ACTUAL.md`. No sobrescribas trabajo más nuevo. No modifiques `main), no fusiones ni cierres PRs, no elimines contratos existentes.
2. Inspecciona y corrige la implementación actual de `pngAlphaSplitter.ts`. Evita fugas de memoria, máscaras equivocadas, componentes duplicados y recortes vacíos. Los bordes deben conservar alfa y el PNG resultante debe tener solo el componente seleccionado.
3. Comprueba que la UI solo muestra la separación automática en modo `Pieza separada` y PNG. Si no hay al menos dos componentes útiles, mostrar un error claro y conservar la imagen original en la bandeja.
4. Cada pieza extraída debe conservar una referencia a la fuente original. Al guardar varias piezas de una misma imagen, el archivo fuente original se guarda una sola vez, no una vez por pieza. La categoría de cada pieza debe ser independiente y editable antes de guardarla.
5. Añade pruebas automatizadas deterministas. Genera fixtures PNG desde código para evitar depender de archivos externos:
   - PNG transparente con 3 formas separadas: devuelve 3 PNG independientes, dimensiones/cajas correctas y transparencia alrededor.
   - PNG con una sola forma: informa que no hay suficientes piezas y no pierde la fuente.
   - PNG opaco: error comprensible, sin falsa afirmación de segmentación semántica.
   - Motas minúsculas: filtradas sin descartar las piezas principales.
   - Piezas que se tocan en diagonal: documentar y probar el criterio de conectividad adoptado.
   - Importar y guardar piezas con categorías diferentes, reabrir/actualizar biblioteca y verificar persistencia.
   - La fuente se guarda una sola vez al importar varias piezas derivadas.
6. Ejecuta la compilación TypeScript/web, suite Python/API y el smoke/E2E de Chromium existente. Añade un caso E2E que pulse «Separar piezas por transparencia» y verifique resultados, categorías, guardado y vista previa. No inventes pruebas; si una no puede ejecutarse, informa el bloqueo exacto.
7. Comprueba la composición con un cuerpo base y al menos dos piezas guardadas después de confirmar los anclajes. No declares que el encaje automático es perfecto: registra cualquier limitación visible real.
8. Corrige fallos encontrados hasta obtener CI verde en el HEAD final. Inspecciona las capturas E2E si están disponibles; no afirmes revisión visual si no la hiciste.
9. Actualiza `cerebro/ESTADO_ACTUAL.md` con SHA actual, cambios, comandos/resultados de CI, evidencia E2E y limitaciones. Actualiza este prompt solo si se necesita una instrucción operativa adicional, no escribas otra documentación redundante.

## CONTRATO FUNCIONAL

- Entrada principal: PNG transparente con varias piezas visualmente separadas.
- Salida: piezas PNG independientes con alfa, cada una clasificable y normalizable.
- No prometer IA semántica: una imagen opaca o una ilustración completa donde cabello y ropa se solapan no puede separarse de forma fiable solo con conectividad alfa. Para esos casos se conserva el flujo existente de retirada de fondo y recorte manual.
- Mantener la fuente original y su procedencia; no publicar ni copiar automáticamente material externo al catálogo público.
- No romper perfiles, identificadores, recetas v1/v2/v3, Style Lab, NanoWear, Chromapatch, catálogo, APIs, compositor o importaciones antiguas.

## CRITERIO DONE

Marca DONE únicamente si:
- los casos automatizados anteriores pasan;
- build web y suites relevantes están verdes en el HEAD final;
- el E2E muestra separación, clasificación individual, normalización, persistencia y composición;
- la fuente se guarda una sola vez;
- la bandeja conserva la imagen cuando la separación falla;
- el estado del repositorio contiene evidencia real y SHA actual.

Si falla algo, arréglalo dentro de esta tarea en vez de entregar otro plan. Informe final corto: archivos cambiados, SHA final, CI/E2E con enlaces reales, limitaciones concretas y siguiente bloqueo únicamente si de verdad impide cerrar.

**Al terminar, escribe exactamente al final del informe:** `bot obrero espera siguientes ordenes`
