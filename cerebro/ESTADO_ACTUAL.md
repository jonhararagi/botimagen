# Estado de continuidad · BotImagen

Última actualización de esta ficha: importador PNG por contrato, suite Python/build validados y E2E de importación completa en curso, 2026-10-10.

## Repositorio

- HEAD BEFORE de la tarea de perfiles locales: `1a66b8eda4d6d43046973750418b4a3719f6fc09`.
- Último commit funcional de interfaz anterior: `509eb98e2c3fb13134aa23573749f18a1c7d8270`.
- HEAD del código probado inmediatamente antes de esta actualización: `e86d2ab98cbb5572886578212219db1a259d053b` (catálogo v7, smoke test Chromium E2E y cierre de procesos controlado). Esta actualización documental generará un HEAD nuevo; consultar `main` antes de retomar.
- Para continuar, verifica siempre el HEAD real de `main`, ya que el commit documental posterior puede avanzar la referencia.

- Repositorio: jonhararagi/botimagen
- Rama principal: main
- HEAD BEFORE de esta entrega: 0a23a7136632d4e66ecee5f871ea40a47ea324e4
- Commit base: test: fix visual catalog test execution order
- Árbol del commit base: a9a2f79ca0da4af637bf6e21519d3ccf76fc720a

Entrega BIMG-001 persistida en main: HEAD AFTER 33de0c8fd08448e2767a6fa9fb0efe52895a7d6e. Commit: https://github.com/jonhararagi/botimagen/commit/33de0c8fd08448e2767a6fa9fb0efe52895a7d6e. El HEAD debe volver a consultarse en GitHub antes de iniciar la próxima tarea.

## Qué existe antes de la migración

- Aplicación local para Windows con Python y Tkinter en app.py.
- Intake de assets gobernado por assets_manifest.json: filtro y selección de asset, prompts de producción y negative prompt, importación de imagen, validación, preparación del destino, historial local y operaciones Git explícitas.
- Generador de personajes en character_generator.py alimentado por character_rules.json.
- Generación mediante reglas y afinidades, atributos fijados frente a AUTO, control de coherencia/variedad, semilla, prompt positivo/negative prompt, perfiles JSON y favoritos.
- Contrato de estilo bw-modern-gacha-v1 documentado en visual_style_catalog.json.
- Tests Python en tests/ para manifiesto, motor de personajes y contrato de estilo.
- CI en .github/workflows/validate.yml valida sintaxis Python, manifiesto, generador y contrato de estilo.
- Referencia histórica de la migración inicial: catálogo v7, 47 categorías y 11 opciones de patrón/región de escamas. El catálogo vigente es v16. El color de puntas de cabello es independiente del patrón de distribución, del color secundario y de las zonas de raíces/coronilla/interior.

## Evidencia previa disponible

- La búsqueda de commits de GitHub devolvió HEAD 0a23a7136632d4e66ecee5f871ea40a47ea324e4 como el commit más reciente visible al comenzar este trabajo.
- La ejecución de GitHub Actions 37880305833 (run #54), asociada al commit 33de0c8fd08448e2767a6fa9fb0efe52895a7d6e, finalizó SUCCESS. Pasaron validación de sintaxis Python, manifiesto de assets, tests del generador y contrato de estilo: https://github.com/jonhararagi/botimagen/actions/runs/37880305833.
- La CI cubre las validaciones automatizadas configuradas; no ejecuta una prueba real de interfaz en Windows.
- La interfaz Tkinter no se consideraba probada físicamente en Windows. La migración no debe convertir esa ausencia de evidencia en una afirmación de funcionamiento web o Windows.
- Auditoría BIMG-002 (histórica, anterior al puente BIMG-004): `CharacterGenerator.generate()` acepta elecciones, `seed` y `coherence`; devuelve `profile`, `prompt`, `negative_prompt`, `seed`, `coherence`, estilo y justificación. La UI web actual sí usa el puente HTTP local descrito en la siguiente sección.
- GitHub Actions run #55 del HEAD anterior terminó SUCCESS: https://github.com/jonhararagi/botimagen/actions/runs/37880345143. Pasaron sintaxis Python, manifiesto, tests del generador y contrato de estilo. No es una prueba de Windows.

## Implementación web y API local

- `web/` contiene React + TypeScript + Vite con editor adaptable de 8 pestañas: identidad, cuerpo, anatomía, cara, cabello, vestuario, combate y detalle. Las 47 categorías actuales del catálogo tienen un control individual.
- Los selectores cargan opciones mediante `GET /api/catalog`; las listas provienen de `character_rules.json`, no de una copia de opciones en TypeScript.
- El botón de generar llama a `POST /api/generate` y reutiliza `CharacterGenerator`; respeta IDs manuales, AUTO, semilla y coherencia, y devuelve prompt/negative prompt oficiales.
- `botimagen_server.py` utiliza `http.server` de la biblioteca estándar, escucha solo en `127.0.0.1:8765`, limita el cuerpo JSON, valida campos contra el catálogo y no expone rutas de archivos arbitrarias.
- Endpoints de perfiles: `POST /api/profiles` guarda atómicamente bajo `generated_characters/web_profiles/`; `GET /api/profiles` lista; `GET /api/profiles/{uuid}` recupera. La UI permite guardar, listar, cargar y duplicar perfiles. La duplicación recupera el perfil completo y crea un nuevo registro por `POST /api/profiles`, con UUID nuevo y sin mutar el original. **CI #112 PASS_REAL** añade un smoke test E2E headless Chromium en Linux: https://github.com/jonhararagi/botimagen/actions/runs/37927181644. La prueba física en Windows continúa `NOT_RUN`.
- La silueta SVG central es un marcador temporal de interfaz, no una ilustración generada.
- Vite redirige `/api` al motor local en desarrollo. La interfaz de producción servida desde un único launcher aún está pendiente.

## Todavía NO implementado

- Prueba manual en Chrome/Edge sobre Windows y prueba física en el PC. El smoke test headless Chromium en Linux ya pasa en CI.
- Biblioteca de referencias avanzada con SQLite, miniaturas, filtros y metadatos.
- Comparación lado a lado de variantes.
- Intake de assets migrado a la web.
- Integración de generación de imágenes local.
- Interfaz remota con acceso desde otras máquinas.
- Empaquetado de escritorio con Tauri/Electron.

## Estado de la entrega actual

- BIMG-001: DONE. Dirección inicial persistida en GitHub.
- BIMG-002: DONE. Auditoría de la base y CI completadas; prueba física Windows NOT_RUN.
- BIMG-003: PARTIAL (~95%). UI React/TypeScript, proxy local y `web/package-lock.json` versionado. CI #112 prueba el flujo E2E headless Chromium además de `npm ci` y build; falta la ejecución manual en Chrome/Edge sobre Windows.
- BIMG-005: PARTIAL (~87%). Editor con 47 categorías en 8 pestañas; guarda, lista, carga y duplica perfiles. CI #144 valida rol tank y prendas/prop; CI #152 PASS_REAL comprueba que una anatomía fijada manualmente se conserva aunque contradiga especie; CI #190 PASS_REAL añade restauración de ejemplo, estado de guardado pendiente, etiquetas conectadas de las ocho pestañas y responsive sin overflow en 320/390/768/1024 px. Faltan otros flujos de error, revisión visual amplia y QA física en Windows.
- BIMG-006: PARTIAL (~70%). Catálogo v16 mantiene 47 categorías; `compatible_with` contiene 111 opciones y 303 valores permitidos en 11 relaciones. Incluye largo/corte/arreglo, outfit/rol, prop/rol, capa/calzado/accesorio por rol y anatomía por especie. v16 añade semántica explícita para `outer_layer=none`. CI #167/#168 PASS_REAL cubre prompt y flujo UI; CI #153 recorre todas las opciones declaradas con AUTO, #151 valida paridad del catálogo público y #152 prueba persistencia del override anatómico manual. QA física en Windows sigue pendiente.
- BIMG-008: PARTIAL (~10%). `GET /api/assets/contracts` expone los 10 contratos PNG oficiales y valida las rutas relativas. **CI #194 PASS_REAL** verifica contrato, método `Allow: GET`, respuesta por proxy desde Chromium, pruebas de API, build y E2E existente: https://github.com/jonhararagi/botimagen/actions/runs/38024212437. La carga/validación/copia real de imágenes y su historial web aún no están implementados.
- BIMG-004: PARTIAL (~95%). API de catálogo/generación/perfiles y UI están conectadas. CI #112 ejecuta un recorrido real desde Chromium headless hasta el motor local para generar, guardar, duplicar y cargar; falta QA física en Windows.
- Evidencia CI #65: PASS_REAL en commit `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; `npm ci` y `npm run build` pasan: https://github.com/jonhararagi/botimagen/actions/runs/37920504103.
- Evidencia CI #75: PASS_REAL para la UI previa de 40 campos y cobertura de categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921018803.
- Evidencia CI #82: PASS_REAL para la primera integración de rasgos y cobertura de 46 categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921734995.
- Evidencia CI #86: PASS_REAL en commit `6e2a0c64b239cb12ba07a0a42b534d898afeb327`; se prueban 12 semillas con AUTO para especie humana y dracónica: https://github.com/jonhararagi/botimagen/actions/runs/37921964365.
- Evidencia CI #93: PASS_REAL en commit `f8f214cab17a1b3dbca1cfd67434b5e033a12b5d`; duplicación API con UUID independiente, original intacto, cobertura del editor, pruebas del motor, `npm ci` y compilación: https://github.com/jonhararagi/botimagen/actions/runs/37922321639.
- Runtime E2E en Chromium headless de GitHub Actions: **PASS_REAL**, CI #112. Navegador físico en Windows: **NOT_RUN**.
- Progreso total ponderado hacia la beta local: **63%**, calculado en `cerebro/PROGRESO.md` (**62,96/100** sin redondear). HEAD funcional con el endpoint probado: `e08d3de4a40e0003893447a3011199b32fa8e7b3`; CI #194 PASS_REAL. El navegador físico Windows continúa `NOT_RUN`.

## BIMG-008 · Catálogo de contratos de assets en la API local

- La ruta `GET /api/assets/contracts` publica la lista del `assets_manifest.json` oficial sin permitir lectura/escritura arbitraria de rutas.
- Cada entrada expone únicamente ID, título, descripción, prompt positivo/negative prompt, versión de prompt, destino relativo y contrato esperado (PNG, dimensiones cuando aplican y bytes máximos). Los campos privados/de generación no se copian desde otros catálogos.
- Validación de servidor: manifiesto versión 1, campos requeridos, IDs/destinos únicos, destino PNG relativo, rechazo de separadores de Windows y `..`, dimensiones en pareja y límites positivos.
- `GET` es el único método permitido; `PUT` recibe 405 con `Allow: GET`. No existe todavía endpoint de escritura o importación.
- CI #193 detectó un NameError en una prueba por usar un helper de rutas sin importarlo. Se corrigió en CI #194: **PASS_REAL**, test HTTP, build y Chromium E2E pasan. https://github.com/jonhararagi/botimagen/actions/runs/38024212437.
- TIMER de esta tanda: 5–10 minutos. BIMG-008 pasa de 0% a 10%; total ponderado de **62,16 / 100 → 62,96 / 100 → 63%**.
- Siguiente paso: seleccionar archivo PNG desde la web y validarlo contra el contrato antes de implementar la copia atómica.

## Catálogo v15 · matriz de compatibilidad y persistencia de locks · 2026-10-09

- El catálogo oficial está en versión 15, mantiene 47 categorías y declara compatible_with en 111 opciones con 303 valores permitidos, repartidos en 11 relaciones: corte/arreglo de cabello y largo; outfit, prop, capa exterior, calzado y accesorio con rol de combate; orejas, cola, cuernos y patrón de escamas con especie.
- La API pública conserva IDs, orden, etiquetas, tags, color_family y compatible_with para cada opción. El contrato no expone bias ni prompt_en internos.
- CI #149 PASS_REAL: Chromium valida que AUTO adapte la anatomía a la especie seleccionada, sin alterar la especie fijada.
- CI #151 PASS_REAL: una única prueba de paridad recorre todas las categorías/opciones y detecta pérdida de metadatos o filtración accidental de datos internos: https://github.com/jonhararagi/botimagen/actions/runs/37995430125.
- CI #152 PASS_REAL: Chromium fija especie humana y una opción de escamas deliberadamente asociada a otra especie; ambos valores sobreviven generación, guardado, duplicado y carga: https://github.com/jonhararagi/botimagen/actions/runs/37995518309.
- CI #153 PASS_REAL: el generador recorre cada una de las 111 opciones que declara reglas de compatibilidad y comprueba el valor resuelto por AUTO. También pasan API, contrato visual, cobertura UI, npm ci, build y smoke E2E Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37995616096.
- TIMER de esta tanda: 5–10 minutos de trabajo incremental. BIMG-006 pasa de 65% a 70%. El progreso ponderado se recalcula a **61,8 / 100 → 62%**. Chrome/Edge físico, Windows y mediciones de rendimiento siguen NOT_RUN.

## Validación estricta del campo de semilla · CI #136/#137

- Se detectó que `Number.parseInt("12-3", 10)` devuelve `12` y aceptaba la entrada sin avisar. La UI ahora valida la cadena con un patrón de entero estricto y después verifica `Number.isSafeInteger` antes de enviar la semilla.
- El campo amplió su límite de edición a 17 caracteres para incluir el signo negativo y el rango completo de enteros seguros de JavaScript, en lugar de limitar arbitrariamente a 15.
- **CI #136 PASS_REAL** probó el rechazo del formato malformado `12-3` y recuperación mediante una semilla válida: https://github.com/jonhararagi/botimagen/actions/runs/37950027112.
- **CI #137 PASS_REAL** añade pruebas de navegador para el máximo seguro `9007199254740991` (aceptado) y el entero siguiente `9007199254740992` (rechazado sin redondear), además del caso malformado. Toda la batería Python/API, cobertura UI, `npm ci`, build y Chromium E2E pasa: https://github.com/jonhararagi/botimagen/actions/runs/37950307373.
- La corrección es de calidad de entrada y reproducibilidad. No altera la estimación de fases ni el total: **58,65 / 100 → 59%**.
- **TIMER:** 30–60 minutos estimados de trabajo de implementación y pruebas. El smoke test físico en Windows sigue `NOT_RUN`.

## Capas exteriores y calzado por rol · catálogo v13

- Se actualizó `character_rules.json` de v12 a v13 sin añadir ni quitar categorías: siguen siendo 47, con IDs de rasgos estables.
- Los diez valores de `outer_layer` y diez valores de `footwear` declaran `compatible_with.combat_role`. Todas las opciones ofrecen una lista no vacía, los cinco roles quedan cubiertos y el validador genérico comprueba referencias de categoría e ID.
- El generador aplica el contrato por ambas direcciones: rol manual → capa/calzado AUTO y capa/calzado manual → rol AUTO. La pasada final contra las elecciones originales preserva expresamente combinaciones manuales incompatibles.
- Se añadieron pruebas con semilla: 60 escenarios para rol→capa, 72 para capa→rol, 60 para rol→calzado y 72 para calzado→rol, más validación de cobertura y locks manuales.
- El API expone las reglas y la prueba `tests/test_local_api.py` verifica dos opciones representativas. El smoke E2E Chromium comprueba el rol tank a través de vestuario, capa, calzado y prop, y restaura esas selecciones tras guardar/duplicar/cargar.
- CI #143 descubrió una aserción de versión obsoleta en el test del catálogo; se alineó con v13. **CI #144 PASS_REAL**: generador, API local, build web y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/37962093038.
- TIMER estimado de este bloque: 1–2 horas de trabajo técnico. BIMG-006 avanza de 60% a 65%; BIMG-005 de 80% a 85% por la cobertura E2E ampliada. Total ponderado actualizado a **61,05 / 100 → 61%**. QA física de Windows y rendimiento continúan `NOT_RUN`.

## Compatibilidad de props de baseball y rol de combate · catálogo v12

- Se actualizó `character_rules.json` de v11 a v12. Continúa con 47 categorías; se añadieron reglas `compatible_with.combat_role` a los diez props, cubriendo los cinco roles.
- Se detectó una regresión real en la primera CI de este bloque: con el prop `bat` fijado, AUTO podía mantener `control` por mezclar la selección original con el perfil ya resuelto durante la fase de refinamiento.
- Se corrigió con una pasada final de compatibilidad basada exclusivamente en las selecciones manuales originales. Se reelige solo un campo que continúa en AUTO; ningún campo fijado manualmente se modifica. Si una combinación manual es contradictoria, permanece intacta.
- Se añadieron 60 escenarios con semilla para rol manual→prop AUTO y 80 para prop manual→rol AUTO, más prueba de combinación manual incompatible. También se agregó un validador genérico para que todas las restricciones del catálogo apunten a categorías/IDs existentes, con listas no vacías y sin duplicados.
- **CI #139** descubrió el fallo: https://github.com/jonhararagi/botimagen/actions/runs/37960498403. **CI #140 PASS_REAL** verifica la corrección de motor, API, build y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/37960828210. **CI #141 PASS_REAL** verifica además la integridad de metadatos del catálogo: https://github.com/jonhararagi/botimagen/actions/runs/37961039389.
- TIMER estimado de trabajo acumulado: 1–2 horas. BIMG-006 sube de 55% a 60%; cálculo ponderado actualizado a **59,4 / 100 → 59%**. Prueba física en Windows y métricas de rendimiento: `NOT_RUN`.

## Compatibilidad de vestuario y rol de combate · catálogo v11

- Se actualizó `character_rules.json` de v10 a v11, conservando 47 categorías e IDs existentes. Diez opciones de `outfit` declaran `compatible_with.combat_role`.
- La misma lógica genérica de compatibilidad filtra vestuario AUTO cuando el rol está fijado y filtra rol AUTO cuando el vestuario está fijado. No aplica correcciones forzadas cuando ambos campos son manuales.
- Se añadieron pruebas con 60 escenarios de rol fijado → outfit AUTO (cinco roles × doce semillas), 84 escenarios de outfit fijado → rol AUTO (siete opciones × doce semillas), validación de referencias y una combinación manual no convencional preservada.
- `tests/test_local_api.py` recorre todas las categorías/opciones y verifica la conservación exacta de IDs, etiquetas, tags, `color_family` y `compatible_with`. **CI #131 y CI #132 PASS_REAL** para ese contrato y motor/API.
- CI #133 detectó que el test consultaba el selector de rol mientras la pestaña Combate no estaba montada. Se corrigió el orden de navegación. **CI #134 PASS_REAL** confirma la ida y vuelta por pestañas, compatibilidad rol/vestuario, guardar/duplicar/cargar perfil y ausencia de errores JavaScript: https://github.com/jonhararagi/botimagen/actions/runs/37936099162.
- TIMER estimado: 1–2 horas para diseño, implementación y correcciones de pruebas. BIMG-006 sube de 50% a 55%; BIMG-005 de 75% a 80%. Total ponderado **58,65 / 100 → 59%**. QA físico en Windows y mediciones de rendimiento continúan `NOT_RUN`.

## E2E ampliado: compatibilidad capilar a través de UI/API · CI #127

- Se detectó en CI #126 que `GET /api/catalog` exponía ID/etiqueta/tags pero descartaba `color_family` y `compatible_with` de las reglas fuente. Se corrigió `make_catalog()` para conservar esos metadatos opcionales y se extendió el tipo `CatalogOption` de TypeScript.
- La prueba de paridad del API comprueba que los metadatos de color/compatibilidad llegan al catálogo servido.
- `web/browser_smoke.mjs` ahora cambia el largo manual a `pixie`, genera el personaje, comprueba que el corte y el arreglo AUTO admiten ese largo según los metadatos entregados por `/api/catalog`, y después guarda, duplica y vuelve a cargar el perfil para verificar que se conserva el lock.
- **CI #127 PASS_REAL**: batería de generador/API, validación de manifiesto y contrato visual, cobertura del editor, `npm ci`, build y smoke E2E Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37929857432.
- TIMER estimado: 45–75 minutos incluyendo diagnóstico del contrato API y ajuste del E2E. BIMG-005 sube de 70% a 75%; total ponderado **57,0 / 100 → 57%**. La prueba física Windows y las mediciones de rendimiento siguen `NOT_RUN`.

## Compatibilidad de peinado extendida · catálogo v10

- Se actualizó `character_rules.json` de v9 a v10; mantiene 47 categorías e IDs estables.
- Los diez arreglos capilares declaran `compatible_with.hair_length`. La misma función genérica del motor procesa los metadatos, tanto cuando el arreglo es AUTO como cuando lo es el largo.
- Cobertura añadida: seis largos × doce semillas para arreglos AUTO (72 casos), seis arreglos × doce semillas para largo AUTO (72 casos), validación de todas las referencias del catálogo y conservación de locks manuales deliberadamente incompatibles. Sumados a los escenarios v9, las nuevas pruebas cubren 264 combinaciones con semilla entre largo, corte y arreglo, además de los locks manuales.
- Se limpió una duplicación accidental de definiciones de prueba que había quedado tras reordenar el runner en la entrega v9.
- **CI #124 PASS_REAL**: generador, manifiesto, contrato visual, API v10, cobertura UI, `npm ci`, build y smoke E2E Chromium headless. https://github.com/jonhararagi/botimagen/actions/runs/37929316506.
- TIMER estimado: 1–2 horas. BIMG-006 sube de 45% a 50%; avance ponderado actualizado a **56,1 / 100 → 56%**. QA física de Windows sigue `NOT_RUN`.

## Última mejora de compatibilidad de peinado · catálogo v9

- Se actualizó `character_rules.json` de v8 a v9, sin modificar IDs de rasgos ni el número de categorías (47).
- Los diez cortes/estilos declaran en el catálogo los largos compatibles mediante `compatible_with.hair_length`. El generador interpreta esas reglas de forma bidireccional: un largo manual acota el AUTO de corte, y un corte manual acota el AUTO de largo.
- La compatibilidad se evalúa con metadatos del catálogo, no con una lista rígida de IDs escrita dentro de la UI. Si ambos valores se fijan manualmente, se preservan incluso si forman una mezcla deliberada.
- Tests: validez de todas las referencias de largo, cinco largos × doce semillas para AUTO de corte, cinco cortes × doce semillas para AUTO de largo, y respeto de dos locks manuales incompatibles.
- CI #121 detectó que tres nuevas funciones de prueba estaban definidas después de su invocación en `__main__`; se movieron las definiciones antes del runner. **CI #122 PASS_REAL** confirma generador, API, contrato visual, cobertura del editor, `npm ci`, build y smoke E2E Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37928912408.
- TIMER estimado: 1–2 horas incluyendo corrección de la organización del test. BIMG-006 sube de 40% a 45%; total ponderado **55,35 / 100 → 55%**. QA física de Windows sigue `NOT_RUN`.

## Ajuste de contrato API tras catálogo v8

- Al elevar `character_rules.json` de v7 a v8, la prueba de contrato `tests/test_local_api.py` todavía exigía `catalog_version == 7`. La CI #118 detectó la expectativa obsoleta; no era un fallo de generación de perfiles.
- Se sincronizó la aserción con la versión real v8. **CI #119 PASS_REAL**: pruebas del generador, contrato visual, API, cobertura del editor, `npm ci`, compilación y smoke E2E Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37928453343.
- HEAD de esa verificación: `64b11b11cd5bea5dddc486abac08e82ac1953c2e`. El porcentaje global no cambia por esta corrección de test: 54,6/100 → 55%.
- Navegador manual y rendimiento en Windows: `NOT_RUN`.

## Última ampliación capilar · catálogo v7

- El catálogo subió de v6 a v7 y de 46 a 47 categorías al añadir `hair_tip_color` con 12 opciones.
- `hair_color_pattern` ahora define distribución/transición, no una tonalidad fija para las puntas. El ID `puntas_doradas` permanece estable por compatibilidad, pero su etiqueta pasó a «Degradado localizado en puntas» y el prompt consume el color de puntas independiente.
- El prompt controla raíces, coronilla, interior y puntas por separado. Se añadió una instrucción para no imponer oro o plata salvo elección explícita.
- El test de composición combina pelo base esmeralda, patrón de puntas, acento dorado y color de puntas controlado explícitamente, validando el nuevo contrato.
- **CI #107: PASS_REAL** para generador, contrato visual, API, cobertura del editor, `npm ci` y build: https://github.com/jonhararagi/botimagen/actions/runs/37926064467.
- TIMER: 1–2 horas estimadas incluyendo ajuste de la prueba anterior. BIMG-006 subió de 24% a 30%; luego CI #112 verificó el recorrido E2E en Chromium Linux. El smoke test headless pasa; la prueba física de navegador/Windows continúa `NOT_RUN`.

## Última ampliación del catálogo

- `character_rules.json` pasó de versión 5 a 6, manteniendo 46 categorías para no romper el contrato UI.
- `scale_pattern` ahora tiene 11 opciones totales, incluido `no_visible_scales`, con cuatro regiones nuevas: `dorsal_hand_scales`, `outer_thigh_scales`, `nape_spine_scales` y `jawline_scales`.
- La compatibilidad AUTO se comprobó para las 10 especies con 12 semillas por especie: dracónica recibe regiones visibles y las demás conservan el patrón sin escamas visibles bajo la política actual.
- Pruebas manuales fijan cada una de las cuatro nuevas regiones y verifican su fragmento de prompt junto al color elegido.
- **CI #102: PASS_REAL**: https://github.com/jonhararagi/botimagen/actions/runs/37925309773.
- TIMER de trabajo estimado: 45–75 minutos. BIMG-006 sube de 20% a 24%; progreso recalculado a **49,8 / 100 → 50%**. QA física de navegador/Windows sigue `NOT_RUN`.
## Última mejora de calidad del motor

- Se detectó que el prompt incluía siempre el color de escamas aunque `scale_pattern=no_visible_scales`. La instrucción general de no dibujarlas entraba en conflicto con ese token de color.
- Corrección aplicada en `character_generator.py`: el prompt solo añade el color cuando el patrón permite escamas visibles. El perfil conserva el color seleccionado, así que el usuario no pierde su preferencia si luego cambia el patrón.
- Prueba de regresión añadida a `tests/test_character_generator.py` para garantizar que el perfil conserva el color pero el prompt no pide escamas coloreadas con el patrón invisible.
- **CI #99: PASS_REAL**, incluyendo pruebas de generador/API y compilación web: https://github.com/jonhararagi/botimagen/actions/runs/37924780083.
- TIMER de la corrección: 30–60 minutos estimados. No cambia el porcentaje global por sí sola.

## Última mejora de calidad de interfaz

- Se detectó que la UI podía guardar/exportar una combinación editada junto a un `generated` antiguo, haciendo que los rasgos elegidos y el prompt se contradijeran.
- `web/src/App.tsx` mantiene ahora un estado explícito de cambios pendientes. Editar rasgos, cambiar FIJO/AUTO, semilla o coherencia invalida el snapshot previo; guardar, copiar prompt y exportar quedan bloqueados hasta regenerar.
- Los controles de edición/carga/restauración también se bloquean mientras el generador está trabajando para evitar carreras con la respuesta asíncrona.
- Al cargar perfiles antiguos, la UI compara selecciones fijadas con el perfil generado y exige regeneración si detecta inconsistencia.
- `tests/test_web_field_coverage.py` valida estáticamente estos guardarraíles y conserva la comprobación de las 47 categorías/8 pestañas. Es cobertura de contrato fuente, no sustituye el test de navegador.
- **CI #100: PASS_REAL**, con pruebas Python, contrato de editor, `npm ci` y build React/TypeScript: https://github.com/jonhararagi/botimagen/actions/runs/37925030261.
- TIMER de la mejora: 30–60 minutos estimados. El total ponderado sigue siendo **49,2 / 100 → 49%** porque la QA real en navegador/Windows sigue pendiente.

## Última mejora semántica AUTO capilar · catálogo v8

- Se actualizó `character_rules.json` de v7 a v8. Continúa con 47 categorías; no se cambiaron IDs ni se añadieron categorías de interfaz.
- Se añadió `color_family` a 53 opciones entre color base, acento, puntas, raíces, coronilla e interior para inferir parentesco cromático mediante datos, no una tabla de IDs dentro del motor.
- `hair_color_pattern` mantiene los IDs históricos `puntas_doradas` y `puntas_plateadas`, pero sus etiquetas, tags y prompt ya describen ubicación/transición, no un tono obligatorio.
- AUTO ahora considera los patrones de raíces contrastantes, capa interior, puntas y acentos. En patrones donde el significado exige contraste, AUTO no puede seleccionar `matching_base`; una elección manual sigue respetándose aunque el usuario diseñe una combinación no convencional.
- Se añadieron tres pruebas para adaptación de patrón a zonas elegidas, selección de contraste en AUTO y sincronía perfil/prompt. **CI #117 PASS_REAL** con batería Python, `npm ci`, build web y smoke test Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/37927965567.
- TIMER estimado: 1–2 horas para implementación y ajuste de las regresiones. BIMG-006 sube de 30% a 40%; avance ponderado recalculado en **54,6 / 100 → 55%**. Navegador físico/Windows y pruebas de rendimiento permanecen `NOT_RUN`.

## Investigación comparativa: regla permanente

La investigación de aplicaciones y proyectos similares queda integrada al protocolo de Cerebro. Objetivo: aprender arquitectura, patrones de UX, rendimiento, errores habituales, causas raíz, soluciones y lecciones de mantenimiento, y convertirlas en decisiones verificables para BotImagen, sin copiar identidad, código o activos ajenos.

- Método, límites de uso, registro de fuentes y plantilla: [`cerebro/INVESTIGACION_COMPARATIVA.md`](INVESTIGACION_COMPARATIVA.md).
- BIMG-RESEARCH-001 se completó en la sesión del 2026-10-09: comparación inicial de Avataaars Generator (React web, exportación, componente reutilizable y licencia MIT del código) y Photoshot (stack de IA remota con PostgreSQL/S3/Replicate/Stripe; licencia del repo no verificada). Conclusión: conservar la beta local-first, mantener el intake desacoplado y la generación neuronal opcional. Se registraron fuentes, límites y cuestiones NOT_RUN en `cerebro/INVESTIGACION_COMPARATIVA.md`. No se cambió código de producto ni se aumenta el porcentaje por investigación sola.

## Próxima acción exacta

1. **BIMG-006 · Compatibilidad restante:** revisar rostro/cuerpo y ampliar las matrices de semillas para las relaciones existentes, manteniendo cada campo modular.
2. **BIMG-005 · Interacciones:** ampliar los recorridos E2E a errores API, perfil heredado inconsistente, restaurar ejemplo y estados de error recuperables.
3. **BIMG-009 · QA física:** ejecutar prueba manual en Chrome/Edge y en Windows, revisar rutas con acentos/espacios y medir memoria/tiempos. Mantener el estado físico `NOT_RUN` hasta realizarla; CI Linux no equivale al PC del usuario.
4. Cerrar BIMG-003/BIMG-004 solo después de completar los criterios funcionales y el QA que les corresponda.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.


## Checkpoint de trabajo continuo · 2026-10-09 · E2E de recuperación API

- **HEAD BEFORE:** `1224e366acd8baa3204fd4e28f596176e1b79649` (documentación de investigación comparativa).
- **Cambio de código:** commit `c48acb0a1dc7e6a6029411e830d89be14886362e`, archivo `web/browser_smoke.mjs`.
- **Cambio:** el smoke test intercepta una petición a `/api/generate` y devuelve un 500 de prueba; comprueba que la UI muestra el mensaje recibido, retira la interceptación y verifica una generación posterior exitosa. Esto prueba recuperación de interfaz ante un fallo transitorio, no un fallo real de disco ni una caída del servidor.
- **CI #156 PASS_REAL:** validación Python, manifiesto, generador, contrato visual, API local, cobertura del editor, `npm ci`, build web y smoke test E2E Chromium. https://github.com/jonhararagi/botimagen/actions/runs/38000016639.
- **Investigación comparativa:** BIMG-RESEARCH-001 y revisión de issues públicos quedan registradas en `cerebro/INVESTIGACION_COMPARATIVA.md`. Las incidencias externas fueron leídas, no reproducidas; no se afirman causas raíz que los reportes no demuestran.
- **HEAD AFTER del código probado:** `c48acb0a1dc7e6a6029411e830d89be14886362e`; después se añadió documentación de investigación. Consultar el HEAD actual de `main` antes de otra escritura.
- **Estado:** E2E de recuperación de error PASS_REAL. Chrome/Edge físico, Windows y métricas de rendimiento siguen NOT_RUN.


## Checkpoint de trabajo continuo · 2026-10-09 · validación HTTP y recuperación de UI

- **HEAD BEFORE:** `0b0d3fb7b5ae381c3aad7db739781a309010aee1`.
- **HEAD AFTER de código:** `dde43254aac817c8d08d85e139a74b173a2c6c54`.
- **Archivos:** `tests/test_local_api.py`, `web/browser_smoke.mjs`.
- **Cambios:** pruebas HTTP reales contra el servidor local para `415 Unsupported Media Type`, `413 Content Too Large` sin enviar el cuerpo sobredimensionado y `411 Length Required` cuando falta `Content-Length`. E2E Chromium ahora verifica que el mensaje del error transitorio desaparezca después de reintentar con éxito.
- **CI #159 PASS_REAL:** cobertura de tipo de contenido y tamaño máximo de cuerpo; generador, API, build y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/38001028451.
- **CI #160 PASS_REAL:** pruebas de longitud obligatoria y recuperación del mensaje UI, además de la suite completa Python, `npm ci`, build y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/38001184083.
- **Estado:** PASS_REAL en CI Linux. No equivale a QA física en Windows; esta y las mediciones de rendimiento siguen NOT_RUN. El porcentaje beta se mantiene en 62%, porque la mejora refuerza las guardas y la recuperación sin cerrar una fase completa.


## Checkpoint de trabajo continuo · 2026-10-09 · semántica explícita de «ninguno»

- **HEAD BEFORE del bloque de código:** `3d4692d95d101b43dcc044f969d9f89d737c764a`.
- **HEAD AFTER de código probado:** `d892a26521be272c83b4d445a3f9148705440f4b`.
- **Archivos de producto/pruebas:** `character_rules.json`, `tests/test_character_generator.py`, `tests/test_local_api.py`, `web/browser_smoke.mjs`.
- **Cambio:** catálogo v16 declara `prompt_en: "no outer layer"` para la opción explícita `outer_layer=none`. El E2E selecciona esa opción desde la interfaz, regenera, confirma que el prompt expresa la ausencia y conserva la sección de vestuario, y comprueba que guardar siga habilitado.
- **Correcciones descubiertas por CI:** la fixture inicial usaba un ID de vestuario inexistente y una etiqueta de accesorio en inglés que no existe en el catálogo; ambos se corrigieron. Se retiró una expectativa de que el API público expusiera `prompt_en`: ese campo es interno al motor, mientras que el catálogo público publica IDs, etiquetas, tags y metadatos de compatibilidad.
- **CI #167 PASS_REAL:** generador, contrato visual, API local, cobertura del editor, `npm ci`, build React/TypeScript y E2E Chromium headless. https://github.com/jonhararagi/botimagen/actions/runs/38003917950.
- **TIMER:** ~5 minutos de trabajo de implementación y diagnóstico dentro de esta sesión. La mejora no cierra una fase; progreso global se mantiene en **62,16 / 100 → 62%**. QA física Windows y métricas de rendimiento siguen `NOT_RUN`.


## Checkpoint de trabajo continuo · 2026-10-09 · catálogo público, docs y aprendizaje del intake

- **HEAD BEFORE:** `9d742aacec1ee8c2d926e76599adc93f0cc03817`.
- **Estado verificado:** CI #168 **PASS_REAL** en `9d742aacec1ee8c2d926e76599adc93f0cc03817`: https://github.com/jonhararagi/botimagen/actions/runs/38004033939. CI #167 también PASS_REAL después de ajustar el contrato del catálogo público: https://github.com/jonhararagi/botimagen/actions/runs/38003917950.
- **Auditoría documental:** `web/README.md` seguía describiendo el catálogo como v7 y el smoke test como si solo cubriera el flujo inicial. Se actualiza a catálogo v16 y se enumeran los casos que hoy cubre el E2E: fallos recuperables, semántica de «ninguno», compatibilidad, locks manuales y persistencia.
- **Investigación comparativa BIMG-RESEARCH-002:** MDN/W3C sobre validación de archivos y ciclo de vida de blob URLs; issues públicos de Filerobot Image Editor sobre canvas en Firefox y calidad de imagen. Las incidencias se registran como reportes, no como bugs reproducidos. Se definen pruebas para BIMG-008 sin copiar código ni assets.
- **Hallazgo técnico aplicado al plan, no al producto:** `accept` es una ayuda del selector, no validación; las object URLs deben revocarse cuando la preview deja de ser accesible, sin revocarlas antes de tiempo. El original debe conservarse y cualquier exportación debe tener contrato explícito.
- **TIMER:** 5–10 minutos para revisión documental y exploración comparativa. No se implementó el intake ni se ejecutó un benchmark de memoria.
- **HEAD AFTER de esta entrega:** se consultará tras el commit. **Progreso ponderado sin cambio: 62,16 / 100 → 62%**; investigación y limpieza documental no cierran una fase. QA física Windows y métricas de rendimiento siguen `NOT_RUN`.


## Reproducibilidad de semilla · BIMG-006 · 2026-10-10

- PR #2 fusionada: https://github.com/jonhararagi/botimagen/pull/2.
- Merge SHA: `3b360fca4f5ac84120f7a03b39ada8f3ec5950b5`.
- Se añadió `tests/test_seed_reproducibility.py`: compara el payload completo para inputs idénticos, cinco semillas (`0, 1, 42, 2026, 65535`) y ambos modos `surprise`. Se crean instancias nuevas del generador en cada comparación para detectar estado mutable oculto.
- `.github/workflows/validate.yml` compila y ejecuta explícitamente la regresión.
- CI #179 PASS_REAL sobre el head final de la PR: sintaxis Python, manifiesto, batería del generador, nueva prueba de reproducibilidad, contrato visual, API local, cobertura de campos, `npm ci`, build web y smoke test Chromium: https://github.com/jonhararagi/botimagen/actions/runs/38013431814.
- La corrección añade cobertura, no funcionalidad de producto; el progreso ponderado permanece en 62%. La QA física Windows sigue NOT_RUN.


## Checkpoint E2E de restauración, responsividad y accesibilidad básica · 2026-10-10

- **HEAD BEFORE del bloque:** 6dfc88ba80d3616cb5671ffc600e1bfa03024219.
- **HEAD AFTER de código verificado:** 6b6bee298cf6e40cc732aeb34cba8a03cd1b21ab.
- **Archivo de prueba:** web/browser_smoke.mjs.
- El recorrido Chromium verifica que Restaurar ejemplo deje el borrador pendiente, bloquee el guardado hasta regenerar, recupere la especie/locks del ejemplo, suelte el lock anatómico personalizado y restablezca la semilla 314159.
- E2E revisa ausencia de overflow horizontal y visibilidad del botón Generar a 1024, 768, 390 y 320 píxeles, además de comprobar que todos los controles visibles tienen etiquetas conectadas en cada una de las ocho pestañas del editor.
- CI #188 detectó una expectativa de prueba demasiado estricta: se esperaba no_visible_scales después de generar un rasgo AUTO. El motor puede resolverlo válidamente a una región de escamas por especie. La prueba se corrigió para verificar el contrato correcto: vuelve a AUTO, se desbloquea la elección anterior y la semilla se restablece.
- **CI #189 PASS_REAL** valida la corrección de la restauración y las cuatro anchuras: https://github.com/jonhararagi/botimagen/actions/runs/38022092458.
- **CI #190 PASS_REAL** añade la auditoría de etiquetas en ocho pestañas. Generador, API local, cobertura del editor, npm ci, build web y Chromium E2E completados: https://github.com/jonhararagi/botimagen/actions/runs/38022168780.
- **TIMER:** 5–10 minutos de trabajo incremental y verificación. La cobertura E2E se amplió, pero no se cierra una fase de producto por pruebas solas. Progreso ponderado mantenido en **62,16 / 100 → 62%**. QA física en Windows, Chrome/Edge instalado y medidas de rendimiento continúan NOT_RUN.



## BIMG-008 · Importador PNG web (implementación en rama, verificación pendiente)

- Rama de trabajo: `feat/bimg-008-safe-png-import`. HEAD base inspeccionado: `46bc7e702ae5d608927345991b5c4f0a661318a9`.
- Implementación añadida en rama: `POST /api/assets/import?asset_id=...`, con destino derivado únicamente de `assets_manifest.json`; lectura en bloques limitada por `max_bytes`; verificación de firma, estructura de chunks, CRC, dimensiones, zlib, filas/filtros y PNG no entrelazado; temporal dentro del directorio permitido; publicación atómica sin sobrescritura mediante hard link.
- UI React `AssetImporter.tsx`: carga contratos, permite elegir archivo local y presenta estados de selección, error y confirmación solo tras respuesta del servidor.
- Tests añadidos: `tests/test_asset_import.py`; el workflow ejecuta esta batería y el smoke Chromium cubre el rechazo real de un archivo falso a través de la UI y el proxy.
- **Evidencia CI:** run #198 PASS_REAL para sintaxis, manifiesto, suite Python (incluidos tests de importación), `npm ci`, build y Chromium E2E del rechazo de bytes falsos: https://github.com/jonhararagi/botimagen/actions/runs/38025915939. Run #199 valida además el nuevo recorrido E2E de importación válida; al actualizar esta ficha, la suite Python y build están PASS y el paso de instalación Chromium/E2E sigue en curso: https://github.com/jonhararagi/botimagen/actions/runs/38026040558. Una ejecución previa (#197) falló solo por falta de la raíz del repo en `sys.path` de la nueva prueba; corregido en el commit `3d1b7466343d34ddaf90a94b7b59ac5992688f49` y validado por #198. La prueba manual Chrome/Edge físico en Windows sigue NOT_RUN.
- **Limitación deliberada:** la validación usa la biblioteca estándar (zlib + validación estructural PNG) y rechaza PNG entrelazados; no se añade dependencia externa. Revisar compatibilidad con exportadores reales en QA manual.
- Próximo paso dentro de BIMG-008: esperar CI, corregir fallos, comprobar HEAD de rama y abrir PR si la batería está verde.
