# BOTIMAGEN · BIMG-MODEL-PIPELINE-002 · PNGs → modelo reutilizable → piezas por capas

**ORDEN ÚNICA AL BOT OBRERO. No dividir este encargo en una cadena de prompts. Implementa lo máximo funcional en esta misma ejecución, prueba y deja el estado listo para continuar sin volver a preguntarle al usuario.**

**Rol:** Senior Software Architect, Python Imaging Engineer, Character-Rig Engineer, Raster Segmentation Engineer, React/TypeScript Engineer, Browser QA Engineer y GitHub Maintainer.

**Repositorios**
- Aplicación: `https://github.com/jonhararagi/botimagen`
- Rama de trabajo obligatoria: `feature/bimg-engine-001-cyberstreet-visual-renderer`
- Referencias privadas y fixtures reales de prueba: `https://github.com/jonhararagi/botimagen-referencias-privadas`
- Rama privada de pruebas: `test/reference-import-bimg-001`

**Timer estimado:** 8–16 horas activas para esta fase. Es una estimación del tramo, no tiempo medido ni fecha garantizada de finalización de todo BotImagen.

## Misión

Termina de convertir el constructor actual en un flujo práctico y continuo para que el usuario pueda importar varios PNG/JPEG/WebP, crear un perfil visual reutilizable, separar partes del personaje, corregir las máscaras y publicar piezas en la biblioteca modular/esqueleto existentes. La aplicación ya tiene un constructor funcional por regiones: **no lo rehagas desde cero, no crees otro editor ni otro compositor**.

El usuario quiere el programa funcionando, no otra auditoría. No pidas permiso para tareas reversibles, no entregues un plan como resultado y no dejes una lista de otros prompts.

## Estado técnico que debes respetar

- El constructor real está en `character_model_builder.py` y `web/src/visual/CharacterModelBuilder.tsx`; está integrado en `web/src/App.tsx`.
- Las API del modelo están en `botimagen_server.py`: `/api/character-models`, lectura de fuente/preview/máscaras, `/extend` y `/publish-layer`.
- Hoy se normalizan imágenes a 512×768, se extraen componentes conectados por color, se guardan máscaras PNG con alfa, se reconstruyen los píxeles visibles y se calcula una firma de estilo/paleta. Se pueden agrupar regiones y asignarles roles.
- La separación actual por color y conectividad **no es segmentación semántica**: no deduce de forma fiable qué región es cabello, chaqueta o piel. La firma de estilo actual **no es un modelo de IA entrenado**.
- Los PNG privados `referencias/16.png` a `referencias/29.png` ya pasaron por el importador a 512×768 en la prueba privada #10. Son poses/encuadres de referencia, no 14 prendas limpias.
- La imagen real de Firefly está como fixture SOLO en el repositorio privado: `referencias/honkai-star-rail-firefly-character-preview.png`. Se probó la importación y una máscara manual. El artefacto privado anterior contenía un informe, no una captura visual de Firefly. Las capturas públicas del constructor muestran una figura sintética; nunca las presentes como imágenes de Firefly.
- La referencia privada nunca debe copiarse a la rama pública de BotImagen. Los informes/capturas que muestren material del juego deben quedarse en el repositorio privado y sus artefactos privados.
- La corrección del recortador SVG ya usa `getScreenCTM().inverse()`. Conserva esa corrección.

## Trabajo obligatorio en esta única ejecución

### 1. Completar el flujo de importación por lote y estilo reutilizable

Reutiliza el importador y la API de la biblioteca actual. Cuando sea razonable dentro de la UI existente, permite añadir varios archivos desde el selector del constructor y regístralos en la biblioteca existente, sin obligar al usuario a repetir una operación por imagen. Mantén procedencia, SHA, categoría, vista/pose y estado de fondo. El usuario debe poder seleccionar una imagen base y varias referencias, dar nombre/ID al estilo, guardar el modelo y volver a ampliarlo con nuevas imágenes sin destruir las capas anteriores.

Trata imágenes de poses diferentes como referencias de estilo/pose, no como piezas de vestuario por defecto. Mantén fuente, reconstrucción, máscaras, paleta y metadatos del modelo bajo `user_data/character_models`. Conserva compatibilidad con datos antiguos.

### 2. Hacer útil la separación y corrección de partes

Conserva la descomposición automática por color como sugerencia inicial y añade una herramienta real para corregirla en el propio constructor:
- mostrar la máscara/overlay de una región sobre la imagen fuente;
- permitir sumar y borrar áreas de máscara con pincel o selección poligonal;
- permitir unir varias regiones seleccionadas y conservar los límites/hashes;
- asignar/cambiar un rol de la lista existente (cuerpo, cabeza, rostro, cabello, prenda superior/inferior, calzado, accesorio);
- deshacer al menos la última edición de máscara o restaurar la máscara original;
- recalcular el PNG transparente y sus límites después de editar;
- publicar la región/grupo como pieza modular reutilizando `/publish-layer`, el catálogo y el sistema de anclajes existente.

No etiquetes automáticamente una región como prenda con certeza si solo conoces su color/posición. Muestra “región sugerida” hasta que el usuario confirme el rol. La superposición de las máscaras debe seguir reconstruyendo exactamente todos los píxeles visibles no editados de la fuente. No inventes píxeles ocultos detrás de otras prendas.

### 3. Usar los PNG reales, no falsificar evidencia

En el repositorio privado, actualiza el harness de `test/reference-import-bimg-001` para:
- ejecutar las 14 referencias `16.png`–`29.png` a través del importador real;
- guardar al menos 4 referencias distintas de ese conjunto y usarlas juntas para crear un perfil de modelo; añade una quinta referencia con `/extend` y verifica que el perfil aumenta su revisión sin destruir las capas base;
- importar el fixture real `honkai-star-rail-firefly-character-preview.png` y abrirlo de verdad en el constructor; usarlo para crear/inspeccionar un modelo y publicar al menos una máscara o grupo candidato;
- guardar capturas Playwright **en el repositorio/artefacto privado**, al menos `firefly-model-builder-source.png` (Firefly real claramente visible en el editor) y `firefly-model-builder-regions.png` (la misma fuente, panel de regiones/máscaras reales y controles de roles). La captura debe provenir de la UI que cargó el fixture real, no de una figura sintética ni de una composición dibujada para la prueba;
- comprobar las capturas antes de publicar el resultado: confirmar que el elemento de imagen visible corresponde al fixture Firefly, no solo que la página tiene un canvas;
- incluir en el artefacto privado un informe con la lista de archivos probados, dimensiones, resultado de separación/corrección, capas guardadas, errores y rutas de las capturas. No incluir los PNG fuente ni sus derivados en el repositorio público ni en artefactos públicos.

Mantén la procedencia de la imagen real en los metadatos. No añadas enlaces promocionales externos a la interfaz. El test es para probar el programa con el material, no para enseñarle al usuario una página web.

### 4. Cerrar la integración con pruebas proporcionales

Añade o ajusta pruebas que cubran las ediciones de máscara, la unión de regiones, la persistencia del modelo y la reconstrucción de píxeles. Ejecuta las pruebas Python/API relevantes, `npm ci` y `npm run build`, y el smoke test Chromium actualizado. Ejecuta el flujo privado real por separado. No multipliques pruebas redundantes: un test unitario por contrato y un E2E que complete el flujo de importación, edición, guardado y publicación bastan si verifican de verdad el comportamiento.

Si falla un test, corrige el código y vuelve a ejecutarlo. No declare PASS basándote en un run de un commit anterior.

## Aceptación para marcar DONE

1. El usuario puede importar varias imágenes, guardar un perfil de estilo/modelo y añadir referencias en una segunda sesión.
2. Puede ver y modificar una máscara, agrupar componentes, asignar un rol y guardar/publicar una pieza PNG transparente en la biblioteca actual.
3. El modelo conserva la fuente y permite reconstruir exactamente sus píxeles visibles no editados.
4. El flujo real de Firefly está ejecutado con el fixture privado y las capturas privadas muestran realmente ese material en el editor. Si la captura no lo muestra, no afirmar que está hecha.
5. Las pruebas relevantes, el build y el E2E pasan en los HEAD exactos que se informen.
6. El catálogo, el compositor, perfiles antiguos, recetas v1/v2/v3, Style Lab, NanoWear y Chromapatch siguen funcionando.
7. Se actualiza `cerebro/ESTADO_ACTUAL.md` con archivos tocados, SHA exactos, CI, resultados, capturas, limitaciones reales y siguiente acción concreta.

## Prohibiciones

- No modificar `main` directamente.
- No fusionar/cerrar PR #11 ni PR #14; mantener su independencia.
- No copiar fixtures privados, capturas Firefly ni derivados a la rama pública.
- No afirmar que se entrenó una IA o que hay segmentación semántica automática si lo implementado son máscaras/regiones asistidas.
- No mostrar una captura sintética como si fuera Firefly.
- No mostrar enlaces web en vez de usar la imagen.
- No dar la tarea por terminada solo por un build verde o por crear documentos.
- No dividir la entrega en una cadena de prompts ni pedir al usuario que repita esta instrucción.

**Empieza ahora por inspeccionar el código relevante y después implementa directamente. Al terminar, responde con cambios de código, commits exactos, tests ejecutados, enlace a CI, y las capturas privadas reales. Si algo no se completó, dilo claramente y deja el estado en progreso, nunca DONE ficticio.**
