# Estado de continuidad · BotImagen

Última actualización de esta ficha: catálogo v11, compatibilidad de vestuario por rol y E2E bidireccional, 2026-10-09.

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
- Catálogo actual v7: 47 categorías y 11 opciones de patrón/región de escamas. El color de puntas de cabello es independiente del patrón de distribución, del color secundario y de las zonas de raíces/coronilla/interior.

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
- BIMG-005: PARTIAL (~80%). Editor con 47 categorías en 8 pestañas; guarda, lista, carga y duplica perfiles. CI #134 PASS_REAL comprueba en Chromium largo fijo→corte/arreglo AUTO, arreglo fijo→largo AUTO, rol tank fijo→outfit AUTO en otra pestaña, protección por cambios pendientes y restauración compatible tras guardar/duplicar/cargar. Faltan más grupos UI, errores y revisión visual amplia.
- BIMG-006: PARTIAL (~55%). Catálogo v11 mantiene 47 categorías; `compatible_with` declara compatibilidad entre largo, corte, arreglo y outfit/rol de combate. AUTO respeta las restricciones desde cualquier elección manual relacionada, mientras que dos elecciones manuales incompatibles no se modifican. El API conserva `color_family` y `compatible_with` en todos los items que los declaran. CI #132 y CI #134 PASS_REAL; QA física en Windows sigue pendiente.
- BIMG-004: PARTIAL (~95%). API de catálogo/generación/perfiles y UI están conectadas. CI #112 ejecuta un recorrido real desde Chromium headless hasta el motor local para generar, guardar, duplicar y cargar; falta QA física en Windows.
- Evidencia CI #65: PASS_REAL en commit `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; `npm ci` y `npm run build` pasan: https://github.com/jonhararagi/botimagen/actions/runs/37920504103.
- Evidencia CI #75: PASS_REAL para la UI previa de 40 campos y cobertura de categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921018803.
- Evidencia CI #82: PASS_REAL para la primera integración de rasgos y cobertura de 46 categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921734995.
- Evidencia CI #86: PASS_REAL en commit `6e2a0c64b239cb12ba07a0a42b534d898afeb327`; se prueban 12 semillas con AUTO para especie humana y dracónica: https://github.com/jonhararagi/botimagen/actions/runs/37921964365.
- Evidencia CI #93: PASS_REAL en commit `f8f214cab17a1b3dbca1cfd67434b5e033a12b5d`; duplicación API con UUID independiente, original intacto, cobertura del editor, pruebas del motor, `npm ci` y compilación: https://github.com/jonhararagi/botimagen/actions/runs/37922321639.
- Runtime E2E en Chromium headless de GitHub Actions: **PASS_REAL**, CI #112. Navegador físico en Windows: **NOT_RUN**.
- Progreso total ponderado hacia la beta local: **59%**, calculado en `cerebro/PROGRESO.md` (**58,65/100** sin redondear).

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
- El protocolo compara soluciones y registra evidencia, sin copiar activos propietarios. En la tarea de rasgos actual no se hizo búsqueda externa porque se resolvió mediante contratos y código existentes; la consulta comparativa queda `NOT_RUN` para este incremento.

## Próxima acción exacta

1. **BIMG-006 · Compatibilidad restante:** ampliar pruebas semánticas a vestuario, anatomía y combinaciones de peinado, sin convertirlas en presets completos.
2. **BIMG-005 · Interacciones:** ampliar los recorridos E2E más allá del campo de cabello probado, cubriendo FIJO/AUTO, validaciones, perfiles heredados y casos de error.
3. **BIMG-009 · QA física:** ejecutar prueba manual en Chrome/Edge y en Windows, revisar rutas con acentos/espacios y medir memoria/tiempos. Mantener el estado físico `NOT_RUN` hasta realizarla; CI Linux no equivale al PC del usuario.
4. Cerrar BIMG-003/BIMG-004 solo después de completar los criterios funcionales y el QA que les corresponda.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.
