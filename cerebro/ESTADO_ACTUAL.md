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


---

# Continuidad activa · 2026-10-12 · NO PERDER ESTE ESTADO

## Objetivo de producto confirmado por el usuario
BotImagen es un editor visual offline-first y un creador modular de personajes originales. No es principalmente un generador libre de imágenes por IA ni una fábrica de prompts. El usuario debe poder construir y editar el personaje elegido dentro del programa: anatomía, rostro, cabello, prendas, accesorios, colores y capas; guardar perfiles OC; importar imágenes; exportar la imagen final y fichas de referencia consistentes.

Dirección artística: anime elaborado de alta calidad, ciencia ficción/cyberpunk y ropa con volumen/detalles. Honkai: Star Rail se prueba como material visual real dentro del importador en una rama privada. Los recursos de juego se separan y mantienen procedencia; una ilustración plana no se convierte automáticamente en prendas completas ni reconstruye lo que está oculto.

## Estado real confirmado en GitHub
- Repositorio: https://github.com/jonhararagi/botimagen
- Rama de trabajo activa: `feature/bimg-engine-001-cyberstreet-visual-renderer`
- `main` no debe modificarse directamente.
- HEAD al escribir esta actualización: `210f9530ba305a034564217d44ab2d241ee1a693`.
- PR #11 sigue abierto/sin fusionar; PR #14 debe conservarse independiente. No fusionar/cerrar PRs sin autorización explícita y revisar el estado real antes de cualquier operación.
- Commit `20dea59b7bfcde70869bd9a2d4229847802d0eac`: añade paquete SVG original CyberStreet.
- Commit `210f9530ba305a034564217d44ab2d241ee1a693`: registra cuatro componentes en el catálogo visual.

## Archivos gráficos que existen ahora
En `assets/modular/oc-cyberstreet/`:
- `base-body.svg`
- `hair-midnight-cyan.svg`
- `top-neon-jacket.svg`
- `skirt-tech-pleated.svg`
- `manifest.json`
- `README.md`

Los cuatro SVG comparten un lienzo transparente de 512×768. El manifiesto declara anclajes y orden de capas preliminares. Las piezas son vectores originales de arranque, no arte final de calidad profesional. Su estado es `component_candidate`; todavía no se ha probado que estén ensambladas por el compositor/renderer real, que encajen anatómicamente, que se puedan cambiar desde controles reales o que exporten correctamente.

El catálogo `assets/visual_asset_catalog.json` contiene las cuatro entradas `character-part.oc-cyberstreet.*`. La prueba posterior importa el PNG vertical de Firefly en el repositorio privado de referencias; el archivo y su recorte no se copian al repositorio público. No afirmar que la rama pública lleva ilustraciones del juego.

## Regla de trabajo obligatoria para todos los bots
El usuario está cansado de recibir únicamente documentos y planes. Cada tarea debe IMPLEMENTAR funcionalidad o arte real en la misma ejecución. No terminar después de una auditoría, un plan, un índice de enlaces o un mockup.

1. Inspeccionar el HEAD real, rama, PR, arquitectura y pruebas antes de modificar.
2. Identificar el renderer/compositor real y conectar allí las piezas. No crear un segundo renderer paralelo ni rehacer todo el proyecto.
3. Modificar archivos de aplicación, motor, recursos, perfiles y pruebas que hagan falta; conservar APIs, IDs, perfiles, recetas v1/v2/v3, Style Lab, NanoWear, Chromapatch y prendas/funciones existentes.
4. Integrar el paquete modular en la interfaz real: activar/desactivar cabello y prendas, componer las capas sobre el mismo cuerpo, mantener transparencia/orden y persistir las elecciones en el perfil OC existente.
5. Probar el render y la exportación PNG reales. Añadir pruebas para manifest/rutas, composición y persistencia. Ejecutar tests y Chromium/browser smoke si el entorno lo permite.
6. Revisar captura visual real; corregir desalineaciones detectadas. No marcar `component_validated` sin evidencia visual.
7. Si existe un bloqueo ambiental, completar y probar el máximo tramo posible y describir el bloqueo concreto, sin fingir que se ejecutó lo que no se ejecutó.
8. Actualizar esta ficha con archivos modificados, commits/HEAD, pruebas y resultados, evidencia visual, limitaciones y siguiente acción. Dejar el siguiente prompt preparado, pero nunca usarlo como sustituto del trabajo actual.
9. No hacer preguntas innecesarias al usuario cuando se pueda tomar una decisión técnica razonable y reversible.
10. El progreso se mide por funcionalidad visible y comprobada, no por longitud de documentación ni por cantidad de archivos vacíos.

## Criterios de aceptación para el próximo tramo
- El personaje compuesto aparece en el editor usando el renderer real.
- Cuerpo, cabello, chaqueta y falda usan las piezas del paquete, con capas y transparencia correctas.
- El usuario puede cambiar/activar/desactivar como mínimo cabello y prendas con controles reales.
- Las selecciones se guardan y recuperan con el sistema de perfiles existente.
- La exportación PNG genera la composición, no un placeholder.
- Tests automatizados y una evidencia de navegador real o bloqueo documentado.
- Corregir los problemas encontrados antes de cerrar la tarea.

## Timer y estado de QA
Cada prompt de BotImagen incluye estimación del tiempo restante en horas/días. Para integrar y validar el paquete actual: estimación provisional de 6–12 horas activas; tiempo medido `NOT_MEASURED`. No presentar esa cifra como tiempo de finalización de todo BotImagen.
Estado actual: `IN_PROGRESS / NOT_VALIDATED_IN_EDITOR`.
CI del HEAD `210f9530ba305a034564217d44ab2d241ee1a693`: no hay checks confirmados en la consulta actual.
QA visual humana del paquete en el compositor real: `NOT_RUN`.
QA Windows: `NOT_RUN`.


## BIMG-MODULAR-INTEGRATION-REAL-003 · CyberStreet conectado al editor

- Se añadió `cyberstreet_svg_compositor.py`: valida el manifiesto del paquete, restringe las rutas a `assets/modular/oc-cyberstreet/`, verifica que existan SVG válidos con lienzo 512×768 y compone las capas reales en el orden z declarado.
- `botimagen_server.py` publica `GET /api/modular-cyberstreet` y `POST /api/modular-cyberstreet/render`; la selección enviada solo puede activar/desactivar IDs presentes en el manifiesto. El cuerpo base no se puede desactivar.
- `web/src/visual/ModularCharacterComposer.tsx` ahora consume ese endpoint, renderiza las cuatro piezas SVG reales, conecta guardar/restaurar con `/api/profiles` y rasteriza la composición actual a PNG transparente 512×768 mediante Canvas del navegador.
- Se añadió `tests/test_cyberstreet_svg_compositor.py` y la validación de sintaxis correspondiente en CI.
- Commits de implementación publicados en la rama de trabajo: `43d85cb5767800d5ddb043347b10717211b8ef4c`, `1590adb4c628bac2ed76cb0a2647fb327e624263`, `7ae0eda3756ba3dce05f2153141e04dc2f84c2fb`, `41fac9c30dd6003810f92673301ec589ebefcf5f`, `cd9084893f2bef0501b1f640f278c72e60b9bb08`.
- Estado de pruebas al registrar esta ficha: CI #442 estaba en ejecución; los fallos detectados y sus correcciones se registran en la verificación final siguiente. No se ha ejecutado QA física de Windows.
- Limitación conocida: los anclajes originales siguen siendo preliminares. La integración compone las piezas en el lienzo compartido y no declara corregida/validada su anatomía artística. La exportación PNG depende del soporte SVG/Canvas del navegador.
- TIMER: estimación provisional de 6–12 horas activas para el tramo; tiempo real medido `NOT_MEASURED`.


### BIMG-MODULAR-INTEGRATION-REAL-003 · verificación final de la integración

- **HEAD de código verificado:** `3bdc96513f52467dd80ba2a8aeee4bc9e01c7781`.
- **CI exacta del HEAD:** [Validate BotImagen #457 · SUCCESS](https://github.com/jonhararagi/botimagen/actions/runs/38279676595). Pasaron sintaxis Python, biblioteca modular, los cuatro tests nuevos del compositor SVG, suite Python/API, `npm ci`, build React/TypeScript y smoke E2E Chromium.
- **Evidencia de navegador:** [artefacto botimagen-visual-garment-qa · run #457](https://github.com/jonhararagi/botimagen/actions/runs/38279676595/artifacts/11760567894). El smoke guarda `cyberstreet-modular-full.png` y `cyberstreet-modular-no-hair.png`, verifica que el preview es una imagen 512×768, que desactivar cabello cambia el SVG renderizado, que el perfil se guarda/restaura mediante la API existente y que se ejecuta la exportación PNG. Las capturas se generaron, pero no se hizo inspección artística humana independiente en esta sesión.
- **Correcciones halladas durante CI:** #442 detectó el import path de la nueva prueba; se corrigió. La primera ampliación de Chromium reveló colisión de selectores globales `.prompt-actions` y una aserción de restauración que no esperaba el render asíncrono; se aislaron los controles del panel de prompts y se hizo esperar la composición restaurada. CI #457 pasa con esas correcciones.
- Se añadieron nombres de capas en español y se habilitó CI por push en esta rama de trabajo.
- **Limitaciones abiertas:** el paquete conserva anclajes preliminares; el compositor no infiere anatomía ni certifica calidad artística. No se declara QA física Windows. La inspección visual humana de las capturas permanece pendiente.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- TIMER estimado para este tramo: 6–12 horas activas. Tiempo real medido: `NOT_MEASURED`.
- Siguiente acción: revisar las dos capturas del artefacto; si la alineación es aceptable, calibrar anclajes y ampliar el E2E para chaqueta/falda y migración de perfiles legacy.



## Revisión visual real y corrección CyberStreet · 2026-10-12

- Se inspeccionaron las capturas de Chromium de la versión anterior [Validate BotImagen #457](https://github.com/jonhararagi/botimagen/actions/runs/38279676595/artifacts/11760567894). Hallazgos: el rostro quedaba tapado por el flequillo; sin cabello, la cabeza no tenía rasgos; la pose de las piernas era asimétrica y el personaje no tenía calzado.
- Corrección implementada en la rama activa: commit [26ddbb7](https://github.com/jonhararagi/botimagen/commit/26ddbb778836978c6d2b1fcc81a10cfda0bf9f0d), más ajuste fino [190d224](https://github.com/jonhararagi/botimagen/commit/190d224b2256dc96ea3bf63f6be521e9564dd7a9). Se añadieron las capas independientes `face-anime-cyan.svg` y `sneakers-neon.svg`; se rehizo la silueta frontal, se abrieron los mechones alrededor de los ojos y se detallaron la chaqueta y la falda. El reflejo de la pierna que sobresalía del contorno también fue corregido.
- **CI del HEAD exacto `190d224b2256dc96ea3bf63f6be521e9564dd7a9`: [Validate BotImagen #462 · SUCCESS](https://github.com/jonhararagi/botimagen/actions/runs/38282000932).** Pasaron sintaxis Python, tests del compositor, validación de manifiesto y catálogo/procedencia, suite Python/API existente, `npm ci`, build React/TypeScript y smoke test E2E de Chromium.
- **Capturas del HEAD actual:** [artefacto de Chromium #462](https://github.com/jonhararagi/botimagen/actions/runs/38282000932/artifacts/11761901916). Se inspeccionaron `cyberstreet-modular-full.png` y `cyberstreet-modular-no-hair.png`: el rostro sigue visible al desactivar cabello, las capas principales quedan alineadas, el personaje está centrado y se distinguen el calzado, la chaqueta y la falda. El E2E también prueba selección de capas, persistencia/restauración del perfil y acción de exportar PNG.
- **No declarar arte final ni proyecto completo:** la integración funcional de estas seis capas está comprobada; la ilustración sigue siendo un paquete SVG estilizado de arranque. Faltan más riqueza anatómica, variedad de expresiones y peinados, variaciones de prendas/materiales y validación de calidad visual contra el objetivo artístico del proyecto. El estado de procedencia permanece `component_candidate`, no `component_validated`.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- TIMER para una próxima pasada de calidad artística modular: estimación provisional de **8–16 horas activas** para desarrollar y conectar más detalle/variantes de rostro, cabello y prendas con pruebas visuales. No es una estimación de finalización de todo BotImagen ni tiempo medido.
- Siguiente trabajo: ampliar la calidad y el rango de piezas utilizables dentro del personalizador real. Implementar código y recursos directamente; no volver a producir otra auditoría o plan como sustituto del trabajo. Mantener la rama de trabajo, no tocar `main` directamente y no fusionar ni cerrar PRs sin autorización explícita.


## BIMG-PNG-TO-MATERIAL-001 · importador de imágenes normales para el esqueleto · 2026-10-12

### Arquitectura práctica acordada
- El motor Python es el esqueleto/árbitro: valida IDs, dimensiones, categorías, orden de capas y anclajes; compone PNG RGBA mediante `/api/modular-compose`.
- La interfaz React es el taller visual para importar, preprocesar, previsualizar, confirmar anclajes y componer.
- `modular_asset_library.py` conserva los bytes originales, SHA-256, procedencia, licencia y metadatos de material. Los originales no se sobrescriben al convertir.
- Un PNG de personaje completo se acepta directamente como `full_character` y se normaliza a 512×768 conservando su pose como una sola imagen plana. El software no finge que esa imagen ya contiene ropa/cabello separables.
- Para ropa/cabello/cara intercambiables, el usuario carga piezas separadas o recortadas y las declara `modular_piece`; la conversión calcula anclajes aproximados. Solo después de revisar la vista previa puede confirmar anclajes y usar la pieza en el compositor.

### Implementación publicada en la rama de trabajo
- Nuevo `web/src/visual/pngToModularAsset.ts`: preprocesador Canvas; PNG/JPEG/WebP hasta 12 MiB/20 MP; escala de análisis limitada; eliminación opcional del fondo plano conectado a las esquinas; recorte por alfa; salida PNG transparente 512×768; controles de escala/desplazamiento; estimaciones de puntos anatómicos normalizados y hash SHA-256 de origen cuando el navegador lo permite.
- `web/src/visual/ModularAssetLibrary.tsx`: flujo real de elegir imagen, elegir tipo/categoría/pose, conservar archivo fuente, preparar PNG, revisar original y convertido, guardar el material, revisar/confirmar anclajes y componer las piezas guardadas.
- `modular_asset_library.py`: valida el contrato de conversión; enlaza el resultado con el registro original; preserva estado de anclajes `estimated_not_validated`; añade confirmación explícita `user_confirmed`; evita declarar automáticamente que una heurística encontró una articulación exacta.
- `botimagen_server.py`: endpoint `POST /api/modular-assets/{id}/validate-anchors` conectado al catálogo persistente. El compositor sigue en el motor existente, sin un segundo motor paralelo.
- `modular_character_compositor.py`: categorías independientes para cabeza, ojos, cejas y boca; orden de capas ampliado y anclajes de codos, manos, rodillas y tobillos.
- Pruebas ampliadas para metadatos/validación y smoke de Chromium que convierte una figura sintética, comprueba transparencia y tamaño de salida, conserva la fuente y usa el compositor Python real.
- CSS de interfaz para controles del importador, vista previa y composición.

### Límites que deben quedar claros en la interfaz
- Quitar fondo plano no es segmentación semántica. Un fondo degradado, sombras contra el fondo o bordes de color parecido pueden requerir ajuste manual.
- Un personaje de una sola capa no se convierte mágicamente en anatomía articulada; las zonas ocultas no existen en el PNG y no se inventan.
- Las posiciones propuestas son **estimaciones**, no detección garantizada de pose. El usuario debe inspeccionarlas visualmente antes de habilitar la pieza como capa.
- La salida de esta etapa usa un lienzo común 512×768; imágenes de otras poses deben marcarse como frontal/trasera/lateral y no intercambiarse sin revisión.

### Flujo de referencias visuales reales
- La interfaz no muestra un panel de enlaces a páginas de juegos. La prueba automatizada importa directamente imágenes desde el repositorio privado de referencias y valida el resultado del convertidor.
- El archivo visual de Firefly se mantiene solo en la rama privada de prueba, con procedencia registrada; no forma parte del catálogo ni de los artefactos públicos de BotImagen.
- La prueba valida la importación normalizada y la máscara manual; no afirma que exista segmentación automática de ropa ni que se reconstruyan partes ocultas.

### Validación y siguiente trabajo
- Estado de esta revisión al registrarla: `IMPLEMENTED_PENDING_CI`; no declarar los cambios verificados hasta observar la CI de este HEAD y las capturas de Chromium.
- El E2E debe cubrir el convertidor, fondo conectado, dimensiones/transparencia, archivo fuente original, conversión como `full_character`, conversión de la misma fuente como pieza de cuerpo y composición real.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- TIMER estimado restante para cerrar y pulir este tramo tras la primera CI: **3–6 horas activas**. Para ampliar a un sistema artístico robusto con segmentación de piezas complejas, más presets y anclajes revisables, estimar por separado; no presentar este timer como la finalización de todo BotImagen.
- Mantener esta rama, no alterar `main`, no fusionar/cerrar PRs sin autorización y producir cambios de programa/recursos antes que nuevos planes.


### BIMG-PNG-TO-MATERIAL-001 · verificación integrada completada · 2026-10-12

- **CI #480 · SUCCESS en HEAD de código 4470c2e11c4bb02e87cf6a07dd386ab54dd77d4f:** https://github.com/jonhararagi/botimagen/actions/runs/38286277714
- Pasaron instalación declarada de Pillow 12.3.0, sintaxis Python, tests del importador modular (7/7), contrato del compositor de personaje, compositor SVG CyberStreet, manifiesto, catálogo/procedencia, suites Python/API existentes, instalación npm ci, compilación React/TypeScript y smoke de Chromium.
- El smoke de Chromium genera una figura sintética visible de 320×480 con fondo plano; confirma salida transparente 512×768, fondo conectado eliminado, contenido conservado y archivo original preservado; guarda una copia como full_character, vuelve a convertir la misma fuente como pieza de cuerpo y comprueba que el motor Python existente compone un PNG 512×768. Resultado PASS.
- Capturas/evidencia del run #480: https://github.com/jonhararagi/botimagen/actions/runs/38286277714/artifacts/11762904000
- La ejecución detectó y corrigió fallos reales: botón antiguo en el smoke, fixture PNG que era completamente transparente, selector ambiguo para el par original/convertido, ausencia de Pillow en instalación limpia y registro de categorías incompleto en el compositor. No se debe volver a tratar la integración como pendiente de construir; usar este CI/HEAD como estado verificado.
- **Uso previsto:** una imagen de personaje completa entra como full_character, conserva la pose y permanece como raster plano. Para modificar cabello/rostro/ropa/calzado por separado, importar cada pieza aislada o recortada como modular_piece, seleccionar categoría/vista, preparar y revisar el PNG 512×768, guardar, revisar los anclajes estimados y confirmarlos antes de componer. No se promete segmentación semántica automática ni recuperación de zonas ocultas.
- La dependencia del compositor PNG quedó declarada en requirements-engine.txt (Pillow>=10.0.0) y se instala desde .github/workflows/validate.yml. En Windows se instala una vez con: py -m pip install -r requirements-engine.txt.
- WINDOWS_MANUAL_QA: NOT_RUN; TIME_MEASURED: NOT_MEASURED.
- main comprobada sin cambios (b508cfe7d3216eda801438d46dff8873842cea86). PR #11 permanece abierta/sin fusionar y PR #14 permanece independiente.
- TIMER para ampliar la siguiente fase artística (mejor segmentación asistida, biblioteca extensa de piezas, mayor riqueza visual y anclajes editables): estimación inicial **8–16 horas activas** según alcance; no es una estimación de finalización de todo BotImagen.
- Se retiraron los enlaces externos de la UI. El flujo de pruebas usa un archivo real de Firefly almacenado solamente en el repositorio privado de referencias; mantener procedencia y no copiar el archivo o el derivado al repo público.


## BIMG-PNG-TO-RIG-001 · importador PNG con esqueleto ajustable y encaje automático · 2026-10-12

- Se amplía el importador existente de `web/src/visual/ModularAssetLibrary.tsx`; no se creó un segundo flujo paralelo.
- El usuario puede arrastrar los puntos normalizados del esqueleto directamente sobre la vista previa PNG 512×768 antes de guardar o sobre una pieza ya guardada. Las coordenadas ajustadas se envían a `POST /api/modular-assets/{id}/validate-anchors` y se guardan en `anchor_estimate` y `conversion.anchors`.
- `modular_character_compositor.py` añade `fit_transform_to_body`: obtiene escala X/Y y traslación a partir de los anclajes compartidos entre cuerpo y pieza. La composición exige confirmar los anclajes del cuerpo base y que cada pieza utilizable tenga sus anclajes confirmados. Se rechaza el encaje si no existen puntos compatibles.
- El flujo frontal/trasero ahora tiene un selector `Frontal / Trasera` en el compositor. Importa y confirma un cuerpo y sus prendas para cada lado. Los PNG de personaje completo siguen guardados como un único sprite/referencia, sin fingir que la segmentación automática separó ropa o pelo oculto.
- Pruebas nuevas añadidas para anclajes editados y persistidos, cálculo de encaje, y composición PNG alineada. Se amplió el smoke de Chromium para cubrir arrastre de puntos, persistencia de anclajes y encaje cuerpo+prenda.
- CI y smoke E2E quedaron verdes para el commit de validación `62c0721490b6c476363bc4d4162652959647f2b8`; ver la sección de verificación final abajo. QA manual en Windows sigue sin ejecutarse.
- TIMER estimado para esta integración del importador/rig: **4–8 horas activas**; tiempo real `NOT_MEASURED`. No es el tiempo restante total de BotImagen.



### BIMG-PNG-TO-RIG-001 · verificación final · 2026-10-12

- **CI #492 SUCCESS** para HEAD exacto `62c0721490b6c476363bc4d4162652959647f2b8`: https://github.com/jonhararagi/botimagen/actions/runs/38289450841.
- **Validación de PR #493 SUCCESS** para el mismo HEAD: https://github.com/jonhararagi/botimagen/actions/runs/38289459247.
- **Artefacto QA generado:** https://github.com/jonhararagi/botimagen/actions/runs/38289450841/artifacts/11763609964.
- CI comprobó sintaxis Python; biblioteca de assets modular y persistencia de anclajes; cálculo de encaje por landmarks; compositor PNG real; catálogos/manifiestos; suites Python y API preexistentes; `npm ci`; build React/TypeScript; y smoke E2E de Chromium.
- El smoke E2E ahora ejecuta el flujo de importar un PNG, arrastrar el punto de cabeza, comprobar que el movimiento cambia su coordenada, guardar el material, confirmar y recuperar los anclajes a través de la API. Luego importa cuerpo y prenda, prueba la composición real de 512×768, cambia a vista trasera e importa/compone el cuerpo y prenda posteriores.
- El smoke mantiene compatibilidad con ambos tipos de preview: imagen PNG para personaje completo y escenario SVG interactivo para una pieza modular. Se aisló el estado entre pruebas para no heredar accidentalmente categoría/pose de un caso anterior.
- **Resultado aceptado funcionalmente:** el usuario puede importar PNG comunes, normalizar el lienzo, corregir manualmente landmarks, guardar el mapa del esqueleto, cambiar entre frontal/trasera y ajustar una pieza sobre el cuerpo por anclajes compartidos.
- **Límites intencionales:** no se ejecuta segmentación semántica automática de pelo/ropa. Para capas intercambiables hay que importar piezas ya recortadas o transparentes. Los píxeles ocultos en una ilustración plana no se reconstruyen. La sustracción actual quita fondo plano conectado a esquinas; no sustituye un sistema completo de recorte/máscara.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- TIMER: esta integración de importador/rig se estima en **4–8 horas activas** de alcance de trabajo; ampliar calidad artística, variedad de piezas y segmentación asistida sigue siendo una fase separada (estimación provisional **8–16 horas activas**). Ninguna cifra es tiempo real medido ni estimación de finalización de todo BotImagen.
- `main` permanece en `b508cfe7d3216eda801438d46dff8873842cea86`; PR #11 está abierta y sin fusionar; PR #14 sigue abierta e independiente.


## BIMG-PNG-LASSO-001 · recorte asistido de PNG para crear piezas modulares · 2026-10-12

- Extensión del importador PNG/biblioteca modular existente, sin crear un motor paralelo.
- En cada vista previa, el usuario puede pulsar **Dibujar contorno de pieza** y marcar con clics el polígono que rodea una parte visible. Al preparar el material, el navegador aplica una máscara alfa real: el exterior del polígono queda transparente. La pieza se normaliza y se registra en el catálogo mediante los mismos endpoints y el mismo compositor.
- `web/src/visual/pngToModularAsset.ts`: recibe puntos normalizados, valida la geometría, recorta el alfa antes de calcular los límites de contenido y registra `cutout_applied` más las coordenadas del contorno junto al hash/dimensiones de la fuente original.
- `web/src/visual/ModularAssetLibrary.tsx`: incorpora el editor de polígono a la tarjeta del recurso, conserva la fuente original, guarda la pieza recortada como material independiente y muestra si se aplicó un recorte. La UI ya no muestra paneles de enlaces externos.
- `modular_asset_library.py`: admite los nuevos metadatos con validación estricta y conserva compatibilidad con conversiones antiguas sin el campo `cutout_applied`.
- `tests/test_modular_asset_library.py`: añade cobertura para persistencia y validación del polígono de recorte.
- `web/browser_smoke.mjs`: añade E2E que sube una imagen de prueba, delimita la zona de ropa, comprueba que cabeza/piernas quedan fuera, verifica alfa transparente, guarda la pieza como `clothing_top`, confirma anclajes y la compone con el cuerpo. El smoke verifica la conversión, la máscara alfa y la composición, sin depender de enlaces externos.
- CSS añadido para trabajar con el contorno en la vista previa grande y visualizar puntos y máscara.
- **Límite funcional explícito:** esto es segmentación asistida manual, no IA de segmentación semántica. Funciona mejor cuando la parte visible tiene un borde identificable. Un PNG plano no contiene los píxeles de prendas o pelo ocultos; para esas piezas hacen falta referencias adicionales, recortes dibujados por separado o recursos independientes.
- Los enlaces de páginas externas se retiraron de la interfaz. Los recursos de prueba se cargan como archivos reales desde una rama privada y sus resultados se verifican con Chromium.
- Estado al publicar la primera implementación: pendiente de CI. **Verificación final registrada abajo tras integrar el editor visual faltante y repetir la ejecución completa.**
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- TIMER estimado para cerrar esta integración y corregir los fallos de CI/E2E que aparezcan: **2–4 horas activas**; no es tiempo medido ni una estimación de finalización de todo BotImagen.

### BIMG-PNG-LASSO-001 · verificación final · 2026-10-12

- **Commit de código validado:** [7a8f6737](https://github.com/jonhararagi/botimagen/commit/7a8f6737f839d0add47e5d51ed53c6658b408243).
- **CI #498 · SUCCESS:** https://github.com/jonhararagi/botimagen/actions/runs/38290777438. La ejecución exacta pasó validación de sintaxis Python, 9 tests de la biblioteca de assets, 11 tests del compositor de personaje, compositor CyberStreet SVG, manifiesto/catálogo, suites Python/API existentes, instalación npm, build TypeScript/React y smoke test E2E de Chromium.
- **El smoke E2E usa el editor visible**: sube una imagen de prueba, dibuja una máscara poligonal alrededor de la prenda, confirma que la salida normalizada es 512×768, que las esquinas/cabeza/piernas quedan transparentes y que la zona de ropa permanece. Después guarda la pieza como `clothing_top`, confirma sus anclajes y la compone con un cuerpo usando el compositor Python real.
- **Artefacto generado:** https://github.com/jonhararagi/botimagen/actions/runs/38290777438/artifacts/11766485829. También se revisaron las capturas CyberStreet generales de la suite; mantienen la cara visible sin cabello y muestran las capas del personaje sobre el lienzo transparente.
- **Enlaces oficiales de Honkai dentro del importador:** wallpapers/galería, noticia oficial de Art Collection Vol. I y noticia oficial asociada a Art Collection Vol. II. No se han copiado recursos de Honkai al repositorio; el usuario puede abrirlos, descargar una referencia y probar la importación local.
- **Límite funcional:** el lasso es una máscara manual para píxeles visibles, no una IA de segmentación semántica. No reconstruye ropa, cabello ni cuerpo que están ocultos detrás de otras zonas del PNG.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- **Siguiente fase estimada:** 8–16 horas activas para mejorar la calidad visual y acelerar la segmentación asistida/creación de variantes. Es estimación, no tiempo medido ni promesa de finalización de todo BotImagen.
- `main` permanece sin cambios; PR #11 continúa abierta y PR #14 se mantiene independiente. Seguir implementando sobre esta rama, no sustituir desarrollo por documentos.


## BIMG-REAL-REFERENCE-IMPORT-002 · materiales privados y Firefly real probados · 2026-10-12

- **Prueba privada exitosa, run #10:** https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38296646209. Artefacto de informe solamente (sin imágenes fuente ni recortes): ID `11768523241`.
- Las 14 imágenes `referencias/16.png` a `referencias/29.png` pasaron por el importador real del editor. Todas se normalizaron a `512×768`; las cuatro esquinas del PNG convertido dieron alfa `0`. La tasa de píxeles visibles varió por imagen, lo que confirma que son poses/crops de distinto encuadre, no prendas modulares.
- El recurso real de Firefly `image/character_preview/1310.png` se guardó solo en la rama privada `test/reference-import-bimg-001` como fixture de prueba, con su procedencia anotada. No está en este repo público ni en su catálogo.
- La importación de Firefly produjo un sprite de referencia `512×768`, alfa visible `0.5266`, límites `x=28,y=81,w=456,h=606`. El recorte manual de atuendo guardado como candidato `clothing_top` mide `176×210`, con cobertura alfa `0.0779` y esquinas transparentes.
- Diagnóstico y corrección: el primer test generó erróneamente una franja `248×50` porque los últimos cuatro clics del test quedaban fuera del viewport. El test ahora centra el lienzo completo con `scrollIntoViewIfNeeded`; el informe final registra los 8 puntos del contorno. No fue un fallo del material ni una conversión semántica automática.
- `web/src/visual/ModularAssetLibrary.tsx` transforma ahora coordenadas de clic mediante `getScreenCTM().inverse()` y conserva la proporción del `viewBox` (`width`/`height` explícitos).
- **UI limpia:** se retiró el panel de enlaces externos a páginas de juegos. El material se valida cargando directamente el PNG real; se añadió una aserción en el smoke para impedir que vuelva el panel de links.
- **CI pública del cambio final:** push CI #507 y PR CI #506 SUCCESS en commit `26df8cf69971d749ae829ff8699a29dc928093f3`. Pasan build web, suites Python/API y Chromium smoke, incluida la aserción de que no se muestran enlaces externos en el importador.
- **Límite honesto:** Firefly es un recorte vertical con torso, no un rig de cuerpo completo. El `clothing_top` es un candidato extraído con polígono manual de píxeles visibles; no se afirma que el programa detecte o separe automáticamente todo el atuendo, que reconstruya la parte posterior ni los píxeles ocultos.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- Timer estimado para la siguiente fase de segmentación más automática, ajuste de capas/anclajes y más variantes de prendas: **8–16 horas activas**, no es tiempo medido ni tiempo restante total del proyecto.
- `main` sigue intacta (`b508cfe7d3216eda801438d46dff8873842cea86`); PR #11 sigue abierta/sin fusionar y PR #14 sigue independiente.

- Head público verificado tras la retirada de enlaces: `26df8cf69971d749ae829ff8699a29dc928093f3`. `main` sin cambios y las PR #11/#14 conservan su estado abierto e independiente.


## BIMG-MODEL-BUILDER-001 · constructor reutilizable de modelos de personaje por PNG · 2026-10-12

### Implementado en la aplicación real

- Nuevo módulo: `character_model_builder.py`. UI: `web/src/visual/CharacterModelBuilder.tsx`. La pantalla está integrada en `web/src/App.tsx`, junto a la biblioteca modular existente y el compositor real.
- API local integrada en `botimagen_server.py`:
  - `GET/POST /api/character-models`
  - `GET /api/character-models/{id}`
  - `GET /api/character-models/{id}/source.png`, `preview.png` y `layers/{layerId}[-thumb].png`
  - `POST /api/character-models/{id}/extend` para añadir referencias al perfil visual guardado.
  - `POST /api/character-models/{id}/publish-layer` para importar una región o un grupo de regiones al catálogo modular.
- Selección por lote: entre 1 y 32 recursos ya importados a la biblioteca. El usuario elige cuál será la imagen base, da nombre/ID al modelo y limita la descomposición a 24, 48 o 64 capas.
- La fuente se normaliza a un lienzo transparente 512×768. Se intenta quitar un fondo plano conectado a las esquinas antes de normalizar; se guarda la imagen de fuente y la reconstrucción desde máscaras.
- Separación automática por color cuantizado y conectividad de píxeles (4-conectada). Se guardan máscaras PNG transparentes independientes y miniaturas recortadas, conteos de píxeles, límites, color representativo, hashes y orden de capa. La prueba verifica que al superponer las máscaras se reconstruyen exactamente los píxeles visibles de la imagen base.
- Firma de estilo guardada: paleta dominante calculada sobre las referencias, procedencia, tipo/categoría/vista, cobertura alfa y estado de fondo. La operación «Añadir selección al estilo abierto» agrega referencias nuevas y actualiza esa paleta sin destruir las capas de la imagen base.
- **Agrupación multi-región:** el usuario puede marcar varias regiones visibles, asignar una categoría semántica y guardarlas como una sola pieza PNG transparente. Esto permite unir varios bloques de color de la chaqueta, cabello o accesorio antes de incorporar la pieza a la biblioteca modular.
- Tras importar una pieza, el catálogo conserva su procedencia y los anclajes permanecen como estimaciones no validadas hasta revisarlos en el editor/esqueleto existente.
- Datos locales persistidos bajo `user_data/character_models`; no se suben los PNG ni las máscaras a un servicio remoto desde este módulo.

### Verificación real

- **Commit de código y workflow validado:** `f13b661f2657a2895b69d885e95bde82849d05c1`.
- **CI #524 · SUCCESS:** https://github.com/jonhararagi/botimagen/actions/runs/38312545782
- La ejecución pasó sintaxis Python, suite unitaria nueva `tests/test_character_model_builder.py`, `tests/test_local_api.py` (crear modelo, servir preview/máscaras, ampliar referencias, importar una capa y agrupar dos regiones), resto de suites existentes, build TypeScript/React y el smoke test de Chromium.
- **Artefacto de Chromium:** https://github.com/jonhararagi/botimagen/actions/runs/38312545782/artifacts/11774983674
  - `character-model-builder-region-decomposition.png`: captura del constructor después de crear el modelo; muestra la imagen base, reconstrucción, paleta y máscaras por región.
  - `character-model-builder-grouped-piece.png`: captura posterior a agrupar dos regiones e importarlas como una pieza de catálogo.
- Las dos capturas anteriores muestran una figura geométrica sintética usada por QA. **No son Firefly ni arte de Honkai: Star Rail. No afirmar que el arte de Firefly aparece en las capturas.**
- Prueba automatizada de navegador: completó la creación del modelo, la visualización de regiones, la reconstrucción exacta y la agrupación multi-región. Esta prueba verifica funcionalidad, no calidad artística humana.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.

### Límites conocidos, expresados sin ambigüedad

- La separación automática actual es por color/conectividad, **no segmentación semántica por IA**. No puede afirmar por sí sola «esto es cabello» o «esto es una chaqueta»; se inspeccionan las máscaras, se marcan las regiones y se asigna el rol manualmente. La agrupación multi-región ayuda a reunirlas.
- El perfil de estilo **no es un modelo de difusión entrenado** ni ajusta pesos de un generador de IA. En esta versión es un paquete local reutilizable de PNG/máscaras, referencias y paleta. La generación paramétrica existente no se reemplazó.
- Si el PNG es una ilustración plana, no contiene los píxeles que quedan ocultos detrás de otra pieza; el sistema no inventa esas zonas. Para obtener capas completas ocultas se necesitan otras vistas, dibujos separados o recursos con esas partes.
- No se añadieron imágenes privadas de usuario ni capturas/derivados de referencias al repositorio público. La prueba anterior con el repositorio privado de referencias se mantiene separada y no se presenta como evidencia de esta UI.
- `main` sigue en `b508cfe7d3216eda801438d46dff8873842cea86`; PR #11 y PR #14 siguen abiertas y sin fusionar.

### Próximo trabajo concreto

Mejorar la segmentación semántica y las herramientas de corrección de máscara para pasar de regiones de color a partes anatómicas/prendas más útiles; conectar categorías confirmadas con variantes reutilizables sin alterar la reconstrucción del original. **Timer estimado: 4–8 horas activas para esa siguiente fase**, no tiempo medido ni estimación de finalización de todo BotImagen.


## Dirección ejecutiva fijada por el usuario · una sola orden de implementación · 2026-10-12

El usuario pidió cerrar el ciclo de documentación y hacer el programa de verdad. El próximo encargo está guardado en `cerebro/PROMPT_OBRERO_MODELO_PNG_MULTICAPA_002.md` y está diseñado para ejecutarse en **un solo prompt**, sin una cadena de tareas o nuevas rondas para volver a explicar el objetivo.

### No volver a repetir los fallos de confianza de la sesión

- El usuario señaló correctamente que ninguna de las capturas que se le mostraron contenía a Firefly. La captura pública del constructor de modelos del artefacto #524 enseña una figura geométrica sintética, no material de Firefly. No etiquetarla ni presentarla como captura de Honkai: Star Rail.
- La prueba privada #10 sí utilizó el PNG real `referencias/honkai-star-rail-firefly-character-preview.png` y generó importación + recorte manual. Sin embargo, el artefacto de esa prueba contiene solo `report.json` y `report.md`, no una captura del editor con Firefly visible. Por tanto, existe evidencia de importación medida, pero todavía **no existe evidencia visual capturada que muestre Firefly dentro del constructor**.
- Las ejecuciones privadas anteriores #1–#9 incluyeron fallos de harness y un recorte de sólo `248×50` que no era útil como pieza de ropa. No ocultarlos ni usarlos como prueba final; la ejecución #10 corrigió el encuadre y registró un candidato manual de `176×210`, alfa visible `0.0779`.
- Los PNG `16.png`–`29.png` del repositorio privado son distintos encuadres/poses; su prueba de importación a 512×768 no prueba por sí sola que sean piezas separadas. El modelo debe usar varias como referencias de estilo/pose y solo crear piezas cuando las máscaras estén separadas/corregidas.
- El constructor de modelos actual ya existe y está integrado: `character_model_builder.py`, `web/src/visual/CharacterModelBuilder.tsx`, rutas `/api/character-models`, perfiles de color y descomposición en regiones conectadas. La limitación central pendiente es corregir regiones y asignar roles, no reconstruir todo el programa.
- La separación automática actual por color/conectividad no es segmentación semántica; la firma de paleta/estilo no es un modelo de difusión entrenado. Decirlo explícitamente y mejorar la utilidad sin promesas mágicas.
- El trabajo siguiente debe editar código y flujos UI existentes, ofrecer máscaras editables/agrupación de regiones, y demostrar el flujo con capturas Playwright del fixture Firefly real en el repositorio privado. Las capturas y derivados del fixture se quedan privados; no se copian al repo público.
- La interfaz debe usar las imágenes de prueba directamente, no añadir más paneles de enlaces externos para que el usuario las busque. No generar otra documentación como sustituto de la integración.
- Preservar `main`, PR #11 y PR #14. La rama de trabajo del repo público continúa siendo `feature/bimg-engine-001-cyberstreet-visual-renderer`; la rama de verificación privada es `test/reference-import-bimg-001`.

### Evidencia vigente antes de empezar el siguiente encargo

- Constructor modular de modelos: CI #524 SUCCESS, commit de código `f13b661f2657a2895b69d885e95bde82849d05c1`, https://github.com/jonhararagi/botimagen/actions/runs/38312545782
- Importación privada real (14 imágenes + Firefly): ejecución #10 SUCCESS con informe, https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38296646209
- Artefacto privado #10 (informe, no capturas): https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38296646209/artifacts/11768523241
- HEAD público actual al registrar esta instrucción: `1151edf2e221ce21c494a8fa439ea853deb18705`; `main` permaneció en `b508cfe7d3216eda801438d46dff8873842cea86`.
- `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.

### Siguiente objetivo no negociable

Ejecutar una sola orden de trabajo para completar la edición de máscaras y el flujo de modelo multi-PNG, ampliar/validar el modelo con varias referencias privadas y producir capturas privadas que **visualmente contengan el fixture Firefly** dentro del programa. Timer estimado: **8–16 horas activas** para esta fase, no medido y no equivalente a terminar todo BotImagen.

### BIMG-MODEL-PIPELINE-002 · implementación y validación real

- **Estado:** implementación funcional validada por CI pública y por la ejecución privada de referencias, ambas fijadas al código `defd89b1406ba4e604ae381ceaa32fc5fb492d1a`.
- **Código/commit probado:** `defd89b1406ba4e604ae381ceaa32fc5fb492d1a` en `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- **CI pública:** [run #38321833087 · SUCCESS](https://github.com/jonhararagi/botimagen/actions/runs/38321833087). Pasaron las validaciones Python, contratos del compositor, biblioteca/catálogo, builder de modelos, API local, `npm ci`, build React/TypeScript y smoke E2E Chromium.
- **E2E público:** importación directa de un lote, creación del modelo, composición por máscaras, agrupación de regiones, guardado de rol, pincel sobre el canvas, persistencia de máscara, restauración de máscara original y pruebas responsive. La prueba fue corregida para desplazar el editor a la vista antes de emitir eventos de puntero.
- **Archivos de aplicación modificados:** `character_model_builder.py`, `botimagen_server.py`, `web/src/visual/CharacterModelBuilder.tsx`, `tests/test_character_model_builder.py`, `web/browser_smoke.mjs`.
- **Motor Python:** nuevos contratos de edición/restauración de máscara, copia de seguridad de la máscara original, cálculo de límites/píxeles/SHA, reconstrucción PNG actualizada y persistencia de categoría semántica/rol elegido por el usuario. Los colores RGB se copian desde la fuente y la máscara de selección es binaria para no alterar el alfa de píxeles fuente no editados.
- **API nueva:** `POST /api/character-models/{id}/edit-layer`, `POST /api/character-models/{id}/reset-layer`, `POST /api/character-models/{id}/classify-layer`. Se reutiliza el almacenamiento, los perfiles, el catálogo y el compositor existentes.
- **UI:** importación múltiple PNG/JPEG/WebP en el constructor; las imágenes adicionales quedan como referencias y no se convierten automáticamente en prendas. Se pueden agrupar regiones, asignar/guardar roles, editar máscaras con pincel o polígono, deshacer, restaurar y publicar una pieza transparente en la biblioteca modular.
- **Pruebas de máscaras:** se valida tamaño PNG, ID de región, edición/restauración, revisión del modelo, preservación de RGB y alfa en píxeles fuente no modificados.
- **CI privada:** [run #38321848683 · SUCCESS](https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38321848683), workflow fijado al mismo HEAD público `defd89b1406ba4e604ae381ceaa32fc5fb492d1a`. Rama privada: `test/reference-import-bimg-001`; commit de configuración del workflow: `4bf7a00420ca3cd75903724332b0e998fdf0a1bb`.
- **Prueba de referencias:** 14/14 imágenes `referencias/16.png`–`referencias/29.png` procesadas. Las referencias 16–19 se guardaron y formaron un modelo reutilizable; la referencia 20 se añadió mediante `POST /extend`. La revisión pasó a 2 y los hashes de las máscaras base se conservaron.
- **Firefly privada:** fixture real `honkai-star-rail-firefly-character-preview.png`, 376×512, SHA-256 `b15170f49eae28f93f415dbb8d96caae9b2b208a600a9708ca4c827bc8def8f8`. El constructor generó fuente y reconstrucción 512×768, 18 regiones, 6.917 colores muestreados y publicó una máscara candidata (`user.b34dd548cf3b466aa524b9d60be772cd`).
- **Evidencia visual privada:** [artefacto #11778719782 con `firefly-model-builder-source.png`, `firefly-model-builder-regions.png`, `report.json` y `report.md`](https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38321848683/artifacts/11778719782). Inspección visual realizada: Firefly real aparece en el constructor y detrás de la superposición de máscara; el informe registra fuente, dimensiones, regiones, publicación, fallos y rutas. No se copiaron imágenes ni capturas privadas al repositorio público.
- **Limitaciones honestas:** la segmentación sigue siendo por color y conectividad, no reconocimiento semántico. Los roles son decisiones manuales. No se infieren píxeles ocultos detrás de ropa. No se ejecutó QA física de Windows. El arte candidato no se certifica como profesional terminado.
- **Timer:** estimación de esta fase 8–16 horas activas, según la orden. Tiempo real medido: `NOT_MEASURED`. No es una estimación garantizada de finalización de todo BotImagen.
- **Estado de repositorio al comprobar:** esta tarea solo escribió en la rama de trabajo y en la rama privada de prueba; no ejecutó commits en `main`, merges ni cierres de PR. Al consultar GitHub, `main` apuntaba a `f86f9345943389dd4ef42d91bc0ec23b38b371d5`; PR #11 figuraba cerrado/merged y PR #14 cerrado/no merged. Estos son estados observados, no acciones realizadas por esta tarea.
- **Siguiente acción concreta:** calibrar máscaras/candidatos sobre más fixtures reales, añadir controles explícitos para categoría y vista de cada lote y revisar visualmente piezas publicadas antes de marcarlas como `component_validated`.


---

## BIMG-PNG-ALPHA-SPLITTER-001 · IMPLEMENTACIÓN INICIAL EN CURSO · 2026-10-12

### Objetivo práctico
Permitir importar un PNG normal con varias piezas separadas por transparencia, dividir los componentes visibles en PNG individuales, asignar manualmente a cada uno su categoría (cuerpo, cabeza, cabello, ropa, calzado o accesorio), normalizarlos y guardarlos en la biblioteca modular existente. No depender de prompts ni exigir que el usuario recorte cada archivo antes de importarlo.

### Código publicado en la rama de trabajo
- Nuevo `web/src/visual/pngAlphaSplitter.ts`: segmentación por componentes conectados del canal alfa, límites de tamaño, recortes PNG transparentes y metadatos de caja delimitadora.
- `web/src/visual/ModularAssetLibrary.tsx`: botón «Separar piezas por transparencia» dentro del flujo de importación de `modular_piece`; reemplaza la imagen de origen por piezas separadas, permite clasificar cada pieza y conserva una sola copia del PNG fuente al guardar las piezas extraídas.
- No usa un modelo de IA ni pretende reconocer semánticamente cabello/ropa. Solo divide islas de píxeles conectados por transparencia; una imagen con fondo opaco o una figura conectada debe pasar por el recorte manual o la retirada de fondo existente.
- La salida sigue pasando por `convertToModularStage` y por la API de biblioteca ya existente. No crea un segundo catálogo ni otro compositor.

### HEAD de referencia
- Rama: `feature/bimg-engine-001-cyberstreet-visual-renderer`
- Último commit registrado al escribir esta nota: `ec46ce6ce42820e80bf8070486813e257e6341e1`
- Main no se modificó; no se fusionó ni cerró ningún PR.
- GitHub Actions se lanzó para los commits de esta integración, pero el resultado final del HEAD más reciente debe volver a consultarse antes de declarar PASS.
- QA visual manual, prueba en Windows y verificación real con un PNG de sprites separados: PENDIENTES.

### Instrucción operativa para el siguiente Bot Obrero
No repetir auditorías ni elaborar otro plan. Leer esta sección y el prompt `cerebro/PROMPT_OBRERO_PNG_ALPHA_SPLITTER_001.md`, inspeccionar el HEAD real, completar las pruebas automatizadas y el smoke test de navegador, corregir cualquier fallo y dejar la función usable. Probar al menos: (1) PNG con 2+ componentes transparentes, (2) PNG con una sola figura, (3) fondo opaco, (4) ruido/píxeles pequeños, (5) múltiples piezas clasificadas de forma distinta, (6) guardar y volver a cargar la biblioteca, (7) conservar el original una sola vez, (8) composición después de confirmar anclajes, (9) perfiles existentes y flujos antiguos sin regresión.

### Criterio de cierre
DONE solo si el usuario puede cargar un PNG con múltiples sprites ya separados por transparencia, ejecutar la separación, asignar categoría individual a cada salida, previsualizar y normalizar cada pieza, guardar el original una sola vez, confirmar anclajes y componer las piezas guardadas. Para arte con fondo opaco, indicar claramente que el recorte manual/limpieza de fondo es el flujo requerido; no prometer segmentación semántica automática.

### TIMER
- Estimación restante para cerrar y validar esta etapa: 2–4 horas activas.
- Tiempo real medido: NOT_MEASURED.
- No presentar esta estimación como el tiempo total para terminar BotImagen.

## BIMG-PNG-ALPHA-SPLITTER-001-R2 · cierre E2E de anclajes · 2026-10-13

- **Estado al inicio:** el HEAD `03a056f8c99e06e2966aebf3c53038747ec431ad` pasó CI #599, pero la aserción exacta de coordenadas arrastradas había sido sustituida por una comprobación de rango y consistencia. Eso no demostraba que el gesto del usuario se guardara correctamente.
- **Causa identificada en código:** `AnchorStageEditor` actualizaba el punto durante `pointermove`, pero `pointerup` solo terminaba el arrastre. Si el último movimiento/coordenada final no había sido procesado antes de soltar, el último valor persistido podía quedarse atrás. La prueba ahora conserva la aserción funcional: tras arrastrar la cabeza al 54% del ancho y 12% del alto, exige coordenadas normalizadas dentro de una tolerancia de 0.015 y comprueba igualdad con los metadatos de conversión.
- **Corrección aplicada en rama:** el manejador `pointerup` escribe una última coordenada usando la posición real del puntero antes de limpiar el estado de arrastre y liberar pointer capture.
- **Evidencia previa al cambio:** CI #599 SUCCESS en SHA `03a056f8c99e06e2966aebf3c53038747ec431ad`, https://github.com/jonhararagi/botimagen/actions/runs/38330185335. Incluyó build web, validaciones Python/API y smoke Chromium. El E2E verificó división de 3 islas alfa, categorías independientes, una sola fuente original, persistencia/reapertura, confirmación de anclajes y composición 512×768. Artefacto de QA visual asociado a esa ejecución: https://github.com/jonhararagi/botimagen/actions/runs/38330185335/artifacts/11782960274. Ese artefacto corresponde al HEAD anterior a esta corrección y no se presenta como captura del nuevo código.
- **Resultado de esta revisión:** la corrección del anclaje y la aserción estricta se enviaron juntas a la rama autorizada; el estado final de cierre depende de la CI de ese nuevo HEAD. No se marca DONE hasta verificar esa ejecución.
- **Limitaciones honestas:** la división automática detecta componentes conectados por alfa, no prendas semánticas. PNG opaco o ilustraciones con cabello/ropa unidos requieren recorte manual o preparación de máscara. QA físico de Windows no ejecutado; tiempo real de trabajo no medido.


---

## BIMG-PNG-CHARACTER-PIPELINE-CLOSURE-001 · ORDEN ACTUALIZADA · 2026-10-13

- **Objetivo:** cerrar en la rama de trabajo el flujo real de importar PNG, dividir componentes alfa, clasificar piezas, normalizar, editar anclajes, persistir en la biblioteca y componerlas en el compositor existente.
- **HEAD observado al crear la orden:** `43d3be41adf2cbe5e6b3dffdd2ef86799b8f784a`.
- **CI #603:** FAIL. Ejecución https://github.com/jonhararagi/botimagen/actions/runs/38381770670. El smoke de Chromium falla en `web/browser_smoke.mjs:333`: esperaba X=0.54 para el anclaje de cabeza tras pointer-up y recibió 0.5. El log indica que no se encontraron archivos en `artifacts/visual-qa/`; no afirmar que esta ejecución dejó capturas.
- **Acción inmediata:** corregir la causa real del fallo de pointer-up conservando la aserción estricta; después volver a ejecutar build web, suites Python/API y smoke Chromium hasta validar el SHA final.
- **Límites funcionales:** la división automática reconoce componentes conectados por alfa. No separa semánticamente ropa/cabello de una ilustración opaca conectada. Para esos casos se debe usar el recorte manual existente y conservar el archivo original.
- **Reglas:** no tocar `main`, no fusionar/cerrar PRs, no crear otro compositor/catálogo, no relajar pruebas ni declarar DONE con CI fallida.
- **Prompt operativo canónico:** `cerebro/PROMPT_OBRERO_PNG_ALPHA_SPLITTER_001.md` (orden de cierre consolidada en ese mismo archivo).
- **TIMER:** 3–6 horas activas estimadas para cerrar esta integración; tiempo real no medido.


## BIMG-PNG-ALPHA-SPLITTER-001-R3 · resultado CI tras corrección E2E · 2026-10-13

- **Estado comprobado:** CI **SUCCESS** en el HEAD final de código de esta corrección: `dddde2c871f60ec5bf408b413e5362ffcf1fc069`.
- **Ejecución:** [GitHub Actions #606 · SUCCESS](https://github.com/jonhararagi/botimagen/actions/runs/38384108945). Rama `feature/bimg-engine-001-cyberstreet-visual-renderer`; ejecución completada el 2026-10-13.
- **Causa corregida en el E2E:** el smoke podía seleccionar el primer escenario de anclaje de la lista en vez de la tarjeta asociada al archivo recién importado. Ahora el gesto y las aserciones se limitan a la tarjeta que contiene `qa-body-anchor.png`. La aserción de coordenadas finales normalizadas se mantiene estricta (X≈0.54, Y≈0.12 dentro de tolerancia 0.015), incluyendo la comprobación de consistencia de metadatos.
- **Cambios previos que forman parte del HEAD validado:** el `pointerup` aplica la última coordenada del puntero antes de cerrar el arrastre; el E2E vuelve a verificar coordenadas concretas en lugar de un simple rango.
- **Pasos de CI comprobados como SUCCESS:** validaciones Python y contratos de biblioteca/compositor/catálogo, API local, constructor de modelos, instalación de dependencias, build web TypeScript/React, smoke test Chromium y paso de subida de capturas QA visual.
- **Flujo comprobado por el smoke de esta ejecución:** el escenario automatizado de importación de piezas PNG con transparencia, clasificación por pieza, fuente única, reapertura/persistencia, confirmación de anclajes y composición; revisar el detalle del smoke y los artefactos de la ejecución para su evidencia visual concreta.
- **Alcance de la declaración:** esta CI valida la integración automatizada en navegador y las suites incluidas en el workflow; no equivale a QA manual físico en Windows ni certifica calidad artística profesional.
- **Limitación funcional verificada:** la separación automática detecta islas conectadas por alfa, no interpreta semánticamente prendas. Una silueta conectada o fondo opaco requiere el recorte/limpieza manual existente. No se modifica `main`, no se fusiona ni se cierra ningún PR.
- **Timer:** 3–6 horas activas fue una estimación de la orden. Tiempo real medido: `NOT_MEASURED`.


## BIMG-PNG-IMPORT-002 · taller de materiales · actualización 2026-10-13

- **Rama de trabajo:** `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- **Cambio nuevo:** commit `dee7d6fdc1b8fd049145c62ba63726333b91848d` incorpora selector entre recorte poligonal por clics y lazo libre por arrastre en `PolygonCutoutEditor`, junto con acciones de deshacer/rehacer del contorno. Commit de tipado explícito del evento de puntero: `c8dfc92d6117a24c5044398488a088cd77bfb347`.
- **CI del código:** [run #609](https://github.com/jonhararagi/botimagen/actions/runs/38389108841), SHA `c8dfc92d6117a24c5044398488a088cd77bfb347). En la última consulta, las suites Python/API y la compilación web pasaban; el smoke Chromium y la subida de capturas aún estaban pendientes. No se declara PASS del run mientras no termine.
- **Referencias privadas:** se verificó el listado de `referencias/16.png`–`referencias/29.png` (14 PNG; permanecen solo en el repositorio privado). La continuidad de la prueba privada anterior registra procesamiento 14/14 y un artefacto QA privado: [run #38321848683](https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38321848683), [artefacto de QA](https://github.com/jonhararagi/botimagen-referencias-privadas/actions/runs/38321848683/artifacts/11778719782). Esta evidencia es de la ejecución privada anterior, no de este nuevo commit público.
- **Estado funcional honesto:** el importador, eliminación de fondo plano conectado a las esquinas, lazo/polígono, normalización, categorías, anclajes, API de biblioteca y compositor son parte de la arquitectura actual. El lazo nuevo aún requiere validación E2E específica. El control de pincel aditivo/sustractivo, zoom de edición, informe generado en la misma ejecución para los 14 archivos y una composición visual final con esos materiales reales no quedan demostrados por el cambio actual. La segmentación alfa no reconoce semánticamente cabello/ropa. QA manual en Windows no ejecutado.
- **Cierre:** PARTIAL hasta completar E2E/QA visual de este cambio y evidenciar los criterios restantes. No afirmar DONE por una compilación verde. TIMER solicitado para esta fase: 8–16 horas activas estimadas; tiempo real medido: `NOT_MEASURED`.


---

## BIMG-PNG-PIPELINE-CIERRE-003 · lote de PNG transparentes · 2026-10-13

**Estado de esta entrega:** implementación publicada; CI del HEAD de código pendiente de finalizar en el momento de esta anotación. No marcar la función como validada hasta revisar la ejecución correspondiente.

- Rama: `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- HEAD de código con la nueva función: `a83285a257df5d7acdf973aa2858e27c0eca4906`.
- Prueba E2E actualizada después: `02b6d1cc3f88ed8a1efe52ec5341450e368a4e75`.
- Cambio de UI: `web/src/visual/ModularAssetLibrary.tsx`. Añadido «Separar todas las PNG transparentes». Procesa PNG originales pendientes en lote, convierte cada isla alfa en una pieza, y conserva los archivos que no se pueden separar para el recorte manual.
- Smoke E2E: `web/browser_smoke.mjs`. Añadido un caso con una hoja PNG transparente y otra opaca; comprueba que se crean tres piezas de la primera y se conserva la segunda. Confirmar el resultado real en CI #613 antes de dar PASS.
- Prompt de trabajo de una sola ejecución: `cerebro/PROMPT_OBRERO_CIERRE_IMPORTADOR_PNG_003.md`.
- CI asociado al test actualizado: https://github.com/jonhararagi/botimagen/actions/runs/38392335240
- CI anterior a la nueva prueba: https://github.com/jonhararagi/botimagen/actions/runs/38392268304
- No se modificó `main`; no se fusionó ni cerró ningún PR.

**Límites que siguen vigentes:** la separación por alfa solo divide componentes que ya están separados por transparencia. No puede deducir pelo/ropa/piel de una ilustración opaca. Para ello se necesita recorte manual con máscara o integrar un segmentador real. No afirmar que las prendas están listas para el compositor solo porque el PNG se normalizó; hay que comprobar la máscara, escala, anclajes y composición.

**Timer estimado para completar y validar el flujo de importación completo:** 8–16 horas activas. Tiempo medido: `NOT_MEASURED`. La cifra es una estimación del tramo, no una promesa de que todo BotImagen estará terminado en ese tiempo.

**Siguiente acción única:** revisar CI #613; corregir cualquier fallo real en la misma rama; seguir con el prompt de cierre sin sustituir implementación por nuevos informes. Después revisar el flujo completo de máscara, persistencia, anclajes y composición con captura real.


---

## BIMG-PNG-PIPELINE-CIERRE-003 · corrección E2E del lote y prueba de lazo · 2026-10-13

- **Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`. No se modificó `main` ni se fusionó/cerró PR.
- **Causa real de CI #613/#614:** el smoke E2E subía dos PNG de lote mientras el selector global «Tipo de recurso» estaba en `full_character`. En ese estado, la UI oculta correctamente el botón de separar lote, por lo que el test esperaba un control que no debía aparecer. No era un fallo del separador: faltaba preparar el estado de UI en la prueba.
- **Corrección de prueba:** `web/browser_smoke.mjs` selecciona `modular_piece` antes de subir `batch-alpha.png` y `batch-opaque.png`. Se amplió también el escenario de recorte manual para seleccionar «Lazo libre (arrastrar)» y realizar un gesto real de puntero, manteniendo las aserciones de alfa, categoría, persistencia, anclajes y composición.
- **Commits de corrección:** `d261200e718d69ea51c21b12d4fe73ed3e5a55c3` (estado de UI de lote) y `9141bc7791c96c8523d3ec75eceb3136c1f24af8` (E2E de lazo libre). La ejecución #615 aún estaba en curso al consultar; la ejecución #616 se había encolado para el segundo cambio. No declarar PASS hasta revisar la ejecución del HEAD que contenga ambos cambios.
- **Cobertura E2E que se intenta validar:** tres islas alfa → tres piezas clasificables; PNG opaco permanece en la lista para recorte manual; una sola fuente original vinculada a las piezas; persistencia tras recargar; confirmación de anclajes y composición PNG 512×768; recorte manual por gesto de lazo con esquinas transparentes fuera de la selección.
- **Limitaciones reales:** el separador alfa no clasifica semánticamente cabello, ropa ni piel. La herramienta actual ofrece polígono y lazo libre, no un pincel de máscara aditivo/sustractivo. QA físico en Windows no ejecutado. No presentar las fixtures sintéticas del smoke como referencias reales del juego.
- **TIMER:** 8–16 horas activas estimadas para este tramo; tiempo real medido: `NOT_MEASURED`. Estado de cierre: **PARTIAL hasta que CI #616 o la ejecución posterior finalice en SUCCESS y se inspeccione su artefacto visual**.


---

## BIMG-WAIFU-FACTORY-001 · incremento de variantes del compositor · 2026-10-13

- **Rama autorizada:** `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- **HEAD verificado antes del incremento:** `f86f9345943389dd4ef42d91bc0ec23b38b371d5`.
- **Commit del incremento:** `ab51eced1d82b164cadadd216a893e4cd31e1496` · [feat: duplicate modular character variants](https://github.com/jonhararagi/botimagen/commit/ab51eced1d82b164cadadd216a893e4cd31e1496).
- **Archivo modificado:** `web/src/visual/ModularCharacterComposer.tsx`.
- **Implementado:** nueva acción «Duplicar variante» en el compositor modular CyberStreet. Crea un perfil local independiente mediante `POST /api/profiles`, copiando las selecciones actuales de capas y el identificador del paquete, asigna un nombre de variante y selecciona el nuevo perfil creado. El original no se actualiza ni sobrescribe.
- **Prueba estática posterior al commit:** se volvió a leer el archivo desde la rama y se confirmó la presencia de la función `duplicateVariant` y del control «Duplicar variante». Estado: `PASS_STATIC`.
- **Pruebas de navegador, TypeScript/build y regresión:** `NOT_RUN` en esta sesión. La consulta de workflow runs por este SHA no devolvió ejecuciones; no se declara CI verde.
- **Límite de alcance:** este incremento no demuestra por sí solo el cierre de BIMG-WAIFU-FACTORY-001. El compositor, importador, biblioteca persistente y constructor de modelos existentes se conservan y requieren validación E2E integrada en el HEAD actual.
- **TIMER del encargo global:** 16–32 horas activas estimadas por el usuario; tiempo real medido: `NOT_MEASURED`. Este pequeño incremento no equivale a completar el encargo.
- **Progreso ponderado beta:** sin recalcular; este cambio aislado no justifica alterar los pesos ni los porcentajes globales de `cerebro/PROGRESO.md`.


### Seguimiento de BIMG-WAIFU-FACTORY-001 · cobertura de variante independiente

- **HEAD de código actual verificado:** `abf4a98bb2ec0a48ff1a1163f396e4e800c8322e` · [test: cover independent modular variant duplication](https://github.com/jonhararagi/botimagen/commit/abf4a98bb2ec0a48ff1a1163f396e4e800c8322e).
- **Archivo adicional modificado:** `web/browser_smoke.mjs`.
- **Cobertura añadida:** el smoke Chromium busca el botón «Duplicar variante», espera el mensaje de confirmación, comprueba que el perfil duplicado aparece en el selector y que su ID difiere del perfil original.
- **Verificación remota posterior:** lectura de GitHub confirmó que el componente contiene el control y que el smoke contiene las nuevas aserciones (`PASS_STATIC`). No se pudo ejecutar Chromium desde esta sesión; prueba E2E real: `NOT_RUN`. La consulta de workflow runs asociada al SHA no devolvió ejecuciones, así que CI permanece `UNKNOWN/NOT_RUN`.
- **No se ha modificado `main`, no se ha fusionado ni cerrado ningún PR.** El encargo completo sigue `PARTIAL`; este incremento no prueba por sí solo el criterio DONE.


## BIMG-WAIFU-FACTORY-002 · validación de exportación y aislamiento de variantes · 2026-10-13

- Rama autorizada: `feature/bimg-engine-001-cyberstreet-visual-renderer`. La comparación con la referencia `abf4a98bb2ec0a48ff1a1163f396e4e800c8322e` confirmó que la rama ya contenía únicamente un commit documental adicional antes de esta tanda; no se editó `main`, no se fusionó ni se cerró ningún PR.
- **SHA de código E2E actualizado:** `47b35e0d991f4b2c1f9bfdd1d0cf3fd8949b17b3` · [test: verify profile isolation and imported asset reload persistence](https://github.com/jonhararagi/botimagen/commit/47b35e0d991f4b2c1f9bfdd1d0cf3fd8949b17b3). Archivo: `web/browser_smoke.mjs`.
- La prueba ahora escucha la descarga real de «Exportar PNG», guarda el archivo de descarga y decodifica los chunks PNG/RGBA para validar firma, dimensiones 512×768, canales alfa y conteos de píxeles transparentes/no transparentes. No se limita al mensaje de estado de la UI.
- La prueba guarda cambios de la variante duplicada, restaura el original y la variante por separado, y comprueba que la selección de cabello guardada en cada perfil no se contamina entre ambos.
- Tras guardar y componer cuerpo/prenda importados desde fixtures deterministas, la prueba recarga la página completa y exige que ambos materiales sigan disponibles en la biblioteca persistente.
- Se agregaron capturas de errores de consola, errores de página y respuestas HTTP fallidas de las rutas API modular/perfiles durante el recorrido. Una aserción final falla si aparece un error no esperado.
- **Validación local de comandos:** `NOT_RUN`. Se intentó `git clone --single-branch --branch feature/bimg-engine-001-cyberstreet-visual-renderer https://github.com/jonhararagi/botimagen.git /tmp/botimagen`; quedó bloqueado antes de descargar por `Could not resolve host: github.com`. Por ello no se pudo ejecutar localmente `npm ci`, `npm run build`, suites Python ni Chromium en esta sesión.
- **CI exacta del SHA de código:** pendiente de comprobación externa; el conector de workflow por commit solo devuelve ejecuciones disparadas por PR y el status check del SHA no devolvió checks. No se declara PASS_REAL hasta confirmar una ejecución del SHA `47b35e0d991f4b2c1f9bfdd1d0cf3fd8949b17b3` y revisar el resultado.
- Estado de esta tanda: **PARTIAL**. La prueba se amplió y quedó persistida, pero todavía no se ha demostrado que compile ni que pase Chromium. La separación alfa sigue limitada a regiones ya separadas por transparencia; la máscara manual es distinta de reconocimiento semántico. QA física en Windows: `NOT_RUN`.
- TIMER del tramo: 8–16 horas activas estimadas por el encargo; tiempo real medido: `NOT_MEASURED`. No se cambia el progreso ponderado global: 63% sigue siendo el último checkpoint registrado, sin nueva fase funcional aceptada.


## BIMG-WAIFU-FACTORY-002 · resultado final de integración y Chromium · 2026-10-13

- **HEAD de código probado:** 0b85ddd5c98eb5c0e81d459b99f00fa67ec7c599 · [fix: constrain imported profile controls on narrow screens](https://github.com/jonhararagi/botimagen/commit/0b85ddd5c98eb5c0e81d459b99f00fa67ec7c599). La rama autorizada continúa divergida de main (77 commits exclusivos de la rama y 13 de main respecto de la base común consultada). No se editó main, no se fusionó ni se cerró PR.
- **CI final PASS_REAL:** [Validate BotImagen #629](https://github.com/jonhararagi/botimagen/actions/runs/38413181653), run ID 38413181653, job validate concluido success. Pasaron instalación de dependencia PNG, sintaxis Python, todas las suites Python/API configuradas, npm ci --no-audit --no-fund, npm run build (incluye tsc --noEmit y Vite), instalación de Chromium y node web/browser_smoke.mjs. Artefacto real de QA: [botimagen-visual-garment-qa.zip](https://github.com/jonhararagi/botimagen/actions/runs/38413181653/artifacts/11821424551).
- **Flujo de piezas importadas conectado a perfiles:** ModularAssetLibrary.tsx añade guardar/cargar perfil del personaje importado, guardando IDs estables de piezas seleccionadas y la vista de composición en el API existente /api/profiles. La carga valida que todas las referencias existan en la biblioteca; si falta una pieza, no restaura una composición parcial. La prueba E2E guarda cuerpo/prenda, deselecciona, restaura referencias, recarga la página completa, recupera el perfil y vuelve a componer por el endpoint Python existente.
- **Exportación verificada como archivo:** Chromium espera el evento de descarga y guarda el PNG real; el test decodifica los chunks PNG y los scanlines RGBA y verifica dimensiones 512×768, píxeles con alfa cero y píxeles visibles. No se acepta solo el texto de confirmación de la UI.
- **Variantes y regresiones:** el E2E comprueba IDs distintos, modifica el estado de la variante duplicada y restaura el original sin alterar su selección guardada. Comprueba también persistencia de los assets tras recarga, recorte por lazo, alfa, anclajes confirmados, composición real y ausencia de errores de consola/página/respuestas API en el recorrido modular.
- **Defectos reales encontrados y corregidos:** (1) CI #626 agotó el timeout por usar un nombre accesible de recorte que no coincidía con el aria-label real, que incluye el nombre del archivo; se corrigió el selector. (2) CI #628 detectó overflow horizontal a 390 px (document=635, main=322) después de añadir controles de perfil; se corrigieron min-width, ancho y truncado de input/select en el panel. CI #629 pasó con ambos arreglos.
- **Comandos de CI verificados:** python -m py_compile (lista de archivos configurada en validate.yml), python tests/test_modular_asset_library.py, python tests/test_modular_character_compositor.py, python tests/test_cyberstreet_svg_compositor.py, python tests/validate_manifest.py, python tools/assets/validate_visual_asset_catalog.py, suites de generador/semillas/contratos/API/model builder/renderer, npm ci --no-audit --no-fund, npm run build, node web/browser_smoke.mjs. El workflow #629 ejecutó estas etapas en el SHA final de código y concluyó SUCCESS.
- **Limitaciones que no se ocultan:** la segmentación alfa separa regiones ya desconectadas por transparencia; no reconoce semánticamente pelo, piel o ropa en un PNG opaco. El recorte manual crea una máscara de usuario, no revela píxeles ocultos. QA manual física en Windows: NOT_RUN. La aceptación cubre este recorrido integrado; no equivale a afirmar que toda la fábrica artística es comercialmente completa.
- **Estado de BIMG-WAIFU-FACTORY-002: PASS_REAL** para build, suites Python configuradas y recorrido E2E integrado en CI. El SHA actual de la rama cambiará al persistir esta actualización documental; el código realmente probado sigue siendo 0b85ddd5c98eb5c0e81d459b99f00fa67ec7c599.
- **TIMER:** 8–16 horas activas estimadas para el tramo; tiempo real medido: NOT_MEASURED. Progreso global ponderado: se mantiene en **63%** hasta que una fase ponderada de beta cierre criterios propios; no se infla por contar commits.
