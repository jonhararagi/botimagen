# Estado de continuidad · BotImagen

Última actualización de esta ficha: endpoint del manifiesto de assets y cobertura Chromium, 2026-10-10.

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



## BIMG-ENGINE-007-R1A · checkpoint de seguridad · 2026-10-11

- **Estado:** BLOCKED_BEFORE_CODE_CHANGE. No se modificó el renderizador porque la rama del PR #11 requiere sincronización no destructiva con `main` antes de continuar.
- **main HEAD observado:** `b508cfe7d3216eda801438d46dff8873842cea86`.
- **Rama:** `feature/bimg-engine-001-cyberstreet-visual-renderer`; último commit de referencia consultado: `0bfc5c2dde3476d78fd556e29c12462cbb989236`; merge-base reportado: `46bc7e702ae5d608927345991b5c4f0a661318a9`.
- **Divergencia:** GitHub compare reportó 98 commits propios de la rama y 2 commits de main no incorporados. El intento no tenía una operación de merge verificada disponible; no se hizo force-push, reset ni edición de código.
- **Documentación de bloqueo:** `docs/engineering/BIMG-ENGINE-007-PROPORTION-BODY-CONSTRUCTION-GATE.md`, sección R1A.
- **Landmarks/capas/capturas R1A:** NOT_IMPLEMENTED / NOT_RUN. PR #12 sigue independiente; dataset y contratos públicos no se tocaron en esta tarea.
- **Siguiente acción:** realizar un merge commit normal de main a la rama, verificar la presencia de los 16 PNG y sus hashes, volver a inspeccionar el HEAD y recién entonces empezar el refactor.
- **TIMER:** estimación inicial 4–8 h; tiempo real medido NOT_MEASURED; implementación consumida 0 h de código. Estimación revisada tras sincronizar: 4–8 h, sujeta a conflictos/regresiones.


## BIMG-ENGINE-007-R1A-REMOTE-01 · estado de implementación

- HEAD BEFORE: `51e6515ec4ce65bbc930f2c1bfbe0b71b9ca03b0`.
- Implementación remota preparada en la rama del PR #11: módulo `bodyLandmarks.ts`, consumo real en cuello/torso, contrato semántico de capas, prueba estática nueva y workflow ampliado.
- Verificación local: `NOT_RUN` (sin checkout local en esta ejecución). CI #314 `SUCCESS` sobre `9b8f9a69465c5b21e2a3d43fd29ad94674c42365`: build, prueba de landmarks/capas y smoke Chromium pasan. Artefacto visual generado; seis capturas front/back a fit 50 inspeccionadas; los extremos están presentes pero no todos se revisaron individualmente.
- No se modifica `main` ni el PR #12. Progreso global de referencia: 63%. `WINDOWS_MANUAL_QA: NOT_RUN`.


## Continuidad actual · BIMG-ENGINE-007-R1A-REMOTE-02 (2026-10-11)

La sincronización previa sigue válida. La rama del PR #11 avanzó a `9613bca14f730c8357aaf9054c2a374615f079e9`; `main` permanece en `b508cfe7d3216eda801438d46dff8873842cea86`; el PR #11 sigue abierto y sin fusionar.

Se migraron las rutas de brazos, manos, pelvis, piernas y la forma base de calzado para consumir landmarks compartidos. Se añadieron IDs semánticos a las raíces de prendas y capas exteriores y un chequeo Chromium del orden de pintura en el DOM real. La primera ejecución detectó el marcador `outfit` faltante en la raíz `street_bomber`; la corrección se publicó en `9613bca` y CI #38152019549 pasó sobre ese HEAD exacto.

- CI: https://github.com/jonhararagi/botimagen/actions/runs/38152019549
- Artefacto: https://github.com/jonhararagi/botimagen/actions/runs/38152019549/artifacts/11706434232
- Renderer y smoke test: cambios funcionales publicados y CI validada.
- Reconstrucción visual completa del cuerpo: sigue PARTIAL.
- Inspección artística individual de todas las capturas: pendiente.
- `WINDOWS_MANUAL_QA: NOT_RUN`.
- Progreso global ponderado: **63%**.
- TIMER: 4–6 horas estimadas; tiempo real `NOT_MEASURED`.

Siguiente paso: inspeccionar la matriz visual del artefacto, corregir defectos visibles encontrados y migrar el siguiente conjunto de landmarks con tests que comprueben continuidad geométrica y no solo presencia de atributos.


### Inspección visual posterior a R1A-REMOTE-02 (2026-10-11)

Descargué y revisé una matriz de contacto con seis capturas front/back a fit 50 para los tres atuendos prioritarios, desde el artefacto de CI #38152019549. Las prendas continúan diferenciadas, pero el cuerpo sigue compacto/chibi, la vista posterior sigue esquemática y brazos/manos/calzado requieren un pase visual adicional. La inspección fue de seis capturas, no de los 81 archivos individualmente. Esto guía la próxima tarea hacia proporciones de silueta compartida y continuidad de piernas/calzado. Progreso global sin cambio: **63%**; `WINDOWS_MANUAL_QA: NOT_RUN`.

## BIMG-ENGINE-008-R5 · arnés anatómico y verificación SVG · 2026-10-12

- **Veredicto provisional:** PARTIAL. El arnés de Chromium produce capturas repetibles de las rutas reales del renderer, pero la composición existente no contiene una superficie corporal neutra continua e independiente de la ropa. Las capturas son diagnóstico de geometría de rutas, no referencias anatómicas válidas para autorizar cambios.
- **HEAD antes de R5:** `5ef465bf0179636b98b78c5effaafc55b74c0055` (el SHA comunicado `a74ae4055d432d169554cba3f0dfef65a75eee73` ya no era el HEAD; se continuó desde la rama vigente).
- **HEAD después de los cambios R5:** `68ab624ad24cd853124098e36a35250510f92bf9` al actualizar las aserciones; el commit final se verificará tras la documentación y CI.
- **Rama/PR:** `feature/bimg-engine-001-cyberstreet-visual-renderer`, [PR #11](https://github.com/jonhararagi/botimagen/pull/11). `main` no modificado, PR no fusionado.
- **Estrategia A:** el smoke test ya levanta la API, Vite y Chromium contra la aplicación real. El renderer permite cambiar front/back con la receta actual; se aplican estilos de prueba temporales sobre el SVG DOM real y se retiran antes de continuar el smoke test.
- **Estrategia B:** reforzado el fixture temporal dentro de `web/browser_smoke.mjs`. Registra `viewBox`, unidades SVG, cajas de rutas por vista, normalización respecto de la unión vertical medida y auditoría de capas cosméticas ocultas. El manifiesto declara explícitamente `PARTIAL_NOT_A_NEUTRAL_ANATOMY_REFERENCE`.
- **Hallazgo decisivo:** `.garment-torso-main`, `.character-lower-body` y `.character-leg-silhouette` son rutas de construcción/vestuario reutilizadas. Recolorearlas como piel cambia solo la pintura; no las convierte en anatomía neutra. No existe un contorno corporal independiente para pecho, cintura, pelvis, rodillas, tobillos y pies que pueda medirse sin ambigüedad en ambas vistas.
- **Medidas:** las cajas SVG de cabeza, cuello y brazos son observables como límites geométricos de rutas, con confianza baja a media solo para esos límites de ruta. Torso, tórax, cintura, pelvis, piernas, rodillas, tobillos, pies y continuidad articular quedan **NO DISPONIBLE como anatomía observada**; cualquier caja de esas regiones es un proxy de la ruta de ropa y no se debe utilizar como medición anatómica. No se proponen ajustes.
- **Producción:** no se modifica `web/src/visual/bodyLandmarks.ts`, las proporciones, el renderer, la API pública, el catálogo ni las recetas. Solo se modifican el arnés de prueba y sus aserciones/documentación.
- **Pruebas/CI:** pendiente ejecutar y asociar el resultado al HEAD final. No declarar CI aprobada antes de verificar la ejecución exacta. `WINDOWS_MANUAL_QA: NOT_RUN`.
- **Tiempo real:** no medido de forma fiable. **TIMER original:** 2–4 horas estimadas; límite de diagnóstico alternativo: 45 minutos.
- **Siguiente paso:** separar explícitamente la geometría de cuerpo base de la geometría de prendas en una tarea autorizada de arquitectura. Después, generar referencias front/back a partir de esa superficie común. R5 no autoriza cambios anatómicos.


## BIMG-ENGINE-009-R1 · separación cuerpo/vestuario · 2026-10-12

- **Veredicto: PARTIAL.** La geometría de torso, pelvis, piernas y pies está separada de la selección de prendas y de los controles `torso_length` / `waist_fit`. El renderer conserva su API pública y mantiene la composición vestida.
- **Rama/PR:** `feature/bimg-engine-001-cyberstreet-visual-renderer`, [PR #11](https://github.com/jonhararagi/botimagen/pull/11), abierto y sin fusionar. Código revisado: `0e86fbd6fe9cfd927387975d3bfac81e9f93af34`.
- **Inspección visual:** revisadas las capturas front/back neutras y una captura vestida del artefacto CI. El cuerpo base sigue visible sin prendas y la composición con ropa continúa funcionando. La figura base aún es esquemática y requiere revisión artística; no se autoriza calibración de proporciones.
- **Informe:** [BIMG-ENGINE-009-R1](../docs/engineering/BIMG-ENGINE-009-R1-BODY-GARMENT-SEPARATION.md).
- **CI de código:** [run #349](https://github.com/jonhararagi/botimagen/actions/runs/38204514831), SHA `0e86fbd6fe9cfd927387975d3bfac81e9f93af34`, `success`. Artefacto inspeccionado: [botimagen-visual-garment-qa](https://github.com/jonhararagi/botimagen/actions/runs/38204514831/artifacts/11726378465). La documentación de cierre genera commits nuevos; verificar la CI del HEAD final antes de cerrar.
- **Limitaciones:** hombros/tórax no segmentados; cintura independiente no disponible; rodillas y tobillos no son regiones geométricas aisladas. No se modificaron intencionadamente proporciones, catálogo, recetas ni datos de personajes. `main` no se modificó.
- `WINDOWS_MANUAL_QA: NOT_RUN`. Tiempo real `NOT_MEASURED`. TIMER estimado: 4–7 h. Progreso global sin incremento, permanece 63%.


## BIMG-ENGINE-010 · integración del motor anime paramétrico · 2026-10-12

- **Estado de esta entrega:** implementación publicada en la rama visual, aceptación pendiente de CI del SHA final y revisión de capturas reales.
- **Motor:** \`rhedak/anime-character-creator\`, upstream SHA \`1bcb2f875050fbab16968318112fea1615968a3e\`, licencia MIT preservada. Solo se importa código de renderizado paramétrico; no sus presets, nombres de personajes ni imágenes de referencia.
- **Integración:** \`character_render_engine.py\` traduce el catálogo actual a cuerpo, cabello, cara, extremidades y prendas SVG por capas. \`POST /api/render/character\` valida las opciones de catálogo y receta antes de dibujar. React utiliza esa salida en la vista previa principal y mantiene un fallback explícito.
- **Criterio de verdad:** pasar CI no demuestra calidad artística. Hay que confirmar que el navegador muestra el SVG del motor integrado, revisar capturas de frente y espalda y verificar que los cambios de rasgos alteran la imagen, no solo las etiquetas.
- **Límites:** algunas opciones del catálogo siguen sin una geometría individual dedicada; el reverso actual es una composición de presentación sobre el mismo esqueleto, no un segundo rig completo.
- **QA Windows / Chrome / Edge:** \`NOT_RUN\` hasta validación física.
- **Progreso global:** permanece en 63% hasta reevaluar con evidencias y pesos reales, sin puntos artificiales por documentación.



## BIMG-ENGINE-010-R1 · ajuste tras revisión de captura · 2026-10-12

- CI del commit de integración c908775039417adaa55f10019afaa05678eefb58: SUCCESS; se inspeccionó el artefacto Chromium.
- Defectos confirmados: proporción chibi, ojos/rostro demasiado infantiles, cola superpuesta sobre el vestuario y patrón brillante como cuadrícula encima del abrigo.
- Corrección publicada en la rama visual: proporciones adultas, madurez facial 1,0, mapeo visual de flequillo/textura/boca/cejas, colas en capa posterior y patrón más pequeño/tenue.
- El criterio artístico sigue PARTIAL hasta revisar nuevas capturas. QA Windows/Chrome/Edge sigue NOT_RUN.


## BIMG-PRODUCT-001-R1 · biblioteca visual local y fuente única (2026-10-12)

- Preflight ejecutado: rama visual en `83afce5d3a7e27aeb9d09808f0c646b5f1a45cfd`; `main` en `b508cfe7d3216eda801438d46dff8873842cea86`; PR #11 y PR #14 abiertos, sin fusionar. Cambios autorizados únicamente sobre la rama visual de PR #11.
- Fuente de verdad visible: `POST /api/render/character` y `character_render_engine.py` generan el SVG presentado por `img.server-character-art`. `VisualCharacterRenderer` se conserva oculto y marcado como fixture de QA, no como segunda ilustración de producto.
- Selector de tres fondos SVG locales originales (Cyber Grid, Dusk Orbit, Aurora City), empaquetados por Vite y persistidos como preferencia de estudio en localStorage. El fondo no modifica IDs de catálogo, receta de personaje ni contrato de perfiles.
- Biblioteca inicial: `assets/backgrounds/`, `assets/characters/`, `assets/ui/`, `assets/licenses/`, `assets/visual_asset_catalog.json` y `tools/assets/validate_visual_asset_catalog.py`. El validador comprueba IDs únicos, metadatos de origen/licencia/atribución, rutas relativas contenidas, archivos presentes y SHA-256 si se declara.
- Los recursos visuales incorporados en esta entrega son originales del proyecto en SVG/JSON. No se copian imágenes de terceros sin licencia individual verificada. La licencia MIT del código en `vendor/anime_character_creator/` sigue separada de cualquier licencia de imagen.
- CI #377: **SUCCESS** en el SHA `fee1524ae241857d8b51bb319f954a21956c8795` (integración de biblioteca, renderizador y smoke Chromium): https://github.com/jonhararagi/botimagen/actions/runs/38248187422.
- Artefacto generado por esa ejecución: [botimagen-visual-garment-qa](https://github.com/jonhararagi/botimagen/actions/runs/38248187422/artifacts/11746755371). Incluye las capturas de producto frontal, posterior y segundo preset, junto con sus manifiestos. El artefacto está publicado, pero la sesión disponible no pudo descargar el ZIP de GitHub Actions por requerir autenticación; por tanto, **no se afirma inspección visual humana de esos PNG**.
- Corrección guiada por QA: el selector de fondo ahora remonta la capa visual con la clave del recurso; Chromium comprueba que los tres fondos locales produzcan imágenes CSS distintas. La vista de producto sigue usando únicamente el SVG del motor Python; el renderer React anterior permanece como fixture invisible.
- `WINDOWS_MANUAL_QA: NOT_RUN`. La aceptación artística final sigue `PARTIAL` hasta inspeccionar las capturas y ejecutar Chrome/Edge físicamente en Windows. No confundir CI Linux con QA física.
- Beta global conservada en **63%**: no se aumenta por documentación o por el mero recuento de recursos. La biblioteca local inicial no sustituye todavía a la biblioteca de referencias indexada ni al intake completo.


## Checkpoint · BIMG-ART-002-R1 · calidad facial y cabello posterior

- **HEAD inicial:** `5ef17beb774f17d5ae57ada655c949343cee92aa`.
- **Último HEAD de implementación/pruebas y manifiesto E2E:** `32d2b71b0ce9c77b4825bbb566ec53a20a95d6ab` (los commits documentales siguientes no deben confundirse con el código validado).
- **Cambios:** `character_render_engine.py` mejora los perfiles de forma facial, conecta `nose_style` con el renderer adulto, amplía la resolución de peinados y calcula la caída del cabello trasero según largo y landmarks; `tests/test_character_render_engine.py` añade regresiones de cara/nariz y silueta posterior; `web/browser_smoke.mjs` prepara capturas Chromium de ambos presets frontal/trasera y variantes de cara, nariz, corte, color y largo.
- **CI exacta:** PENDING al escribir este checkpoint; no afirmar PASS hasta que la ejecución corresponda al HEAD final.
- **Capturas:** la prueba E2E prepara PNG y un manifiesto con `GITHUB_SHA`; artefacto e inspección humana pendientes.
- **Límites:** la vista posterior continúa siendo una aproximación 2D; no todos los IDs de peinado tienen todavía una geometría individual. No se ha inspeccionado manualmente el artefacto nuevo. `WINDOWS_MANUAL_QA: NOT_RUN`.
- **PR #11:** abierto, sin merge. **PR #14:** abierto e independiente, sin cambios. **main:** permanece en `b508cfe7d3216eda801438d46dff8873842cea86`.
- **Estado de tarea:** PARTIAL. Progreso global de beta sin cambios: **63%**.
- **TIMER:** estimación inicial 10–16 horas activas; tiempo real `NOT_MEASURED`.
- Informe: [BIMG-ART-002-R1](../docs/engineering/BIMG-ART-002-R1.md).


### BIMG-ART-002-R1 · revisión visual real y estado actualizado

- El renderer vendorizado ahora recibe `face_shape` y modifica coordenadas reales de pómulos/mandíbula/mentón; el perfil neutral conserva el contorno histórico.
- Añadidos sombreado ajustado a la silueta y costuras específicas para prendas largas, bomber y equipamiento táctico. Vista posterior de cabello depende de largo y landmarks.
- **CI #399 SUCCESS** para el HEAD de implementación `32d2b71b0ce9c77b4825bbb566ec53a20a95d6ab`; artefacto: https://github.com/jonhararagi/botimagen/actions/runs/38253325201/artifacts/11748818282.
- Capturas PNG reales inspeccionadas: dos presets en frontal/trasera, cara/nariz y variaciones de peinado/color/largo. Mejora visible en la longitud del cabello posterior y en el contorno facial; el sombreado frontal sigue siendo moderado. Persisten rigidez de pose/manos pequeñas y familias de peinado compartidas. Por tanto, **PARTIAL**, sin aceptación artística completa.
- CI #401 SUCCESS para el HEAD de integración `ec48ef00754248d5f45582531fecc1fa87a74bf0`; la validación de esta actualización documental queda asociada al run final registrado en el PR. `WINDOWS_MANUAL_QA: NOT_RUN`. Tiempo real: `NOT_MEASURED`. Beta global: **63%**.


## BIMG-MODULAR-2D-002 · estado de integración (2026-10-12)

- Rama de trabajo: `feature/bimg-engine-001-cyberstreet-visual-renderer`; cambios publicados incrementalmente en GitHub.
- Añadidos `modular_character_compositor.py`, contrato de piezas v1, compositor Pillow RGBA, API `POST /api/modular-compose`, panel `ModularCharacterComposer` y pruebas unitarias.
- El perfil modular del panel se guarda/recupera en localStorage del navegador; esto todavía no equivale a persistencia de perfil modular en el backend de perfiles existente.
- Los anclajes se normalizan 0..1 y requieren calibración explícita. El motor rechaza prendas/cabello/accesorios con `anchors_validated=false`.
- **No declarar aceptación integral:** no se han ejecutado en esta sesión pruebas, build ni CI después de estos commits; tampoco se han inspeccionado capturas del ensamblador. El test automatizado añadido aún debe ejecutarse en CI.
- Recursos artísticos: no se afirma que las ilustraciones de referencia sean piezas separadas ni compatibles. La anatomía, los anclajes y el encaje visual requieren recursos PNG segmentados y QA.
- `WINDOWS_MANUAL_QA: NOT_RUN`; tiempo real medido: `NOT_MEASURED`.
- Estimación restante revisada: **8–16 horas activas** para corregir integración/CI, completar persistencia de perfiles y exportación robusta, pruebas E2E y revisión visual; la producción/calibración de piezas artísticas se estima aparte según el número y complejidad de piezas.
