# Progreso global de BotImagen

**Último cálculo:** 2026-10-12  
**Objetivo medido:** beta local-first web en Windows, no el producto final con funciones opcionales futuras.  
**Progreso global actual: 63%**

El porcentaje usa puntos ponderados por fase. No se calcula por cantidad de archivos, líneas de código ni tiempo transcurrido. Cada tarea tiene un peso fijo dentro del alcance de la beta y una estimación de terminación documentada con evidencia. Fórmula:

`Progreso = suma(peso de fase × porcentaje de terminación de esa fase) / 100`

Los porcentajes parciales son juicio técnico de alcance restante, no resultados de pruebas. La evidencia de pruebas se registra por separado en `ESTADO_ACTUAL.md`.

| Tarea | Peso beta | Terminación estimada | Contribución |
|---|---:|---:|---:|
| BIMG-001 · Dirección técnica y continuidad | 4% | 100% · DONE | 4,0 |
| BIMG-002 · Auditoría de base existente | 8% | 100% · DONE | 8,0 |
| BIMG-003 · Shell web y build reproducible | 12% | 95% · PARTIAL | 11,4 |
| BIMG-004 · Servicio local y conexión UI/API | 12% | 95% · PARTIAL | 11,4 |
| BIMG-005 · Editor completo por categorías | 18% | 87% · PARTIAL | 15,66 |
| BIMG-006 · Ampliación modular del catálogo | 15% | 70% · PARTIAL | 10,5 |
| BIMG-007 · Biblioteca visual local | 12% | 0% · NOT_STARTED | 0,0 |
| BIMG-008 · Intake de assets en la interfaz web | 8% | 10% · PARTIAL | 0,8 |
| BIMG-009 · QA físico de navegador/Windows y rendimiento | 6% | 20% · PARTIAL | 1,2 |
| BIMG-010 · Empaquetar y validar beta local | 5% | 0% · NOT_STARTED | 0,0 |
| **Total ponderado** | **100%** | | **62,96 / 100 → 63%** |

BIMG-011, la investigación de generación neuronal local, es opcional y posterior a la beta; no se incluye en este denominador porque la beta no depende de generar píxeles. **62,96 / 100 (63%) es el avance hacia la beta local definida aquí, no un porcentaje inventado del producto final completo**: la biblioteca visual, la importación completa, QA física y empaquetado siguen pendientes.

## Evidencia más reciente

- Lockfile generado por npm y versionado en `web/package-lock.json` (lockfileVersion 3).
- BIMG-008: `GET /api/assets/contracts` publica los 10 contratos PNG con destinos relativos validados. CI #194 **PASS_REAL**: prueba HTTP, método permitido, validación del manifiesto, proxy web y Chromium E2E. https://github.com/jonhararagi/botimagen/actions/runs/38024212437.
- CI #193 detectó un NameError de prueba, corregido antes de CI #194; el resultado validado es el commit `e08d3de4a40e0003893447a3011199b32fa8e7b3`.
- CI #65: PASS_REAL en `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; instalación reproducible con `npm ci`, build React/TypeScript y validaciones Python pasan.
- Ejecución npm reproducible: https://github.com/jonhararagi/botimagen/actions/runs/37920504103
- Editor web: 46 campos para 46 categorías y 8 pestañas. CI #82 prueba cobertura exacta, motor, prompts, `npm ci` y build: https://github.com/jonhararagi/botimagen/actions/runs/37921734995
- CI #86: PASS_REAL; test de compatibilidad AUTO de escamas entre humana/dracónica con 12 semillas y coherencia reducida: https://github.com/jonhararagi/botimagen/actions/runs/37921964365
- CI #93: PASS_REAL; duplicación de perfil conserva el original, genera UUID distinto y crea segunda entrada en biblioteca. Pruebas del motor/API, cobertura de 46 campos, `npm ci` y build pasan: https://github.com/jonhararagi/botimagen/actions/runs/37922321639
- Smoke test E2E en Chromium headless Linux: **PASS_REAL**, CI #112. Prueba física en Windows y mediciones de rendimiento: **NOT_RUN**.
- Mejora del motor, **CI #99 PASS_REAL**: el prompt ya no menciona color de escamas cuando el patrón está fijado en `no_visible_scales`; prueba de regresión verde. https://github.com/jonhararagi/botimagen/actions/runs/37924780083.
- Mejora de sincronización UI, **CI #100 PASS_REAL**: guardar/copiar/exportar se bloquea con cambios pendientes hasta regenerar; se comparan perfiles antiguos al cargarlos y los controles se bloquean durante generación. `tests/test_web_field_coverage.py` cubre el contrato estático. https://github.com/jonhararagi/botimagen/actions/runs/37925030261.
- Ambas son correcciones de calidad, no cierre de fases ni evidencia de navegador. Progreso sin cambio: **49,2 / 100 → 49%**.
- Ampliación de regiones de escamas, **CI #102 PASS_REAL**: catálogo v6, cuatro nuevas regiones y pruebas de prompt manual para cada una; AUTO cubre las 10 especies con 12 semillas (120 combinaciones). https://github.com/jonhararagi/botimagen/actions/runs/37925309773.
- CI #103: PASS_REAL tras sincronizar la documentación del catálogo v6, el plan maestro, estado de continuidad y contador ponderado: https://github.com/jonhararagi/botimagen/actions/runs/37925495723.
- Esta ampliación sí aumenta la terminación estimada de BIMG-006 del 20% al 24%. Total actualizado: **49,8 / 100 → 50%**. Navegador físico/Windows sigue **NOT_RUN**.
- Catálogo v7, **CI #107 PASS_REAL**: nueva categoría `hair_tip_color` con 12 opciones; el patrón de cabello expresa distribución/transición sin codificar la tonalidad de las puntas. Generador, contrato visual, API, cobertura UI, `npm ci` y build pasaron: https://github.com/jonhararagi/botimagen/actions/runs/37926064467.
- **CI #112 PASS_REAL**: smoke test E2E en Chromium headless, arranque de API/UI, generación con dos colores de puntas, guardado bloqueado con cambios pendientes, regeneración, guardado, duplicación y carga de perfil. https://github.com/jonhararagi/botimagen/actions/runs/37927181644.
- CI #117 PASS_REAL: compatibilidad semántica AUTO capilar, familias cromáticas declarativas, respeto a bloqueos manuales, batería Python y smoke test Chromium E2E. https://github.com/jonhararagi/botimagen/actions/runs/37927965567.
- Catálogo v12 y compatibilidad de prop de baseball/rol: CI #139 detectó una regresión de compatibilidad inversa; CI #140 la corrigió con una pasada final basada en selecciones manuales originales. https://github.com/jonhararagi/botimagen/actions/runs/37960828210.
- CI #141 PASS_REAL verifica las referencias de todas las restricciones del catálogo, 140 escenarios con semilla en la nueva relación prop/rol, API v12, `npm ci`, build y Chromium E2E. https://github.com/jonhararagi/botimagen/actions/runs/37961039389.
- **CI #144 PASS_REAL**: catálogo v13 añade compatibilidad de capa exterior/rol y calzado/rol. Batería con 264 escenarios con semilla en esas relaciones (60+72 por tipo), locks manuales, API v13, `npm ci`, build y Chromium E2E comprobando rol tank en outfit/capa/calzado/prop y roundtrip de perfiles: https://github.com/jonhararagi/botimagen/actions/runs/37962093038.
- CI #149 PASS_REAL: Chromium verifica la compatibilidad de anatomía AUTO con especie a través del editor local: https://github.com/jonhararagi/botimagen/actions/runs/37965447416.
- CI #151 PASS_REAL: se consolidó la paridad de metadatos del catálogo, cubriendo ID/orden, etiqueta, tags, color_family, compatible_with y evitando exponer bias/prompt_en internos: https://github.com/jonhararagi/botimagen/actions/runs/37995430125.
- CI #152 PASS_REAL: el override manual de anatomía incompatible sobrevive regeneración y roundtrip de guardar/duplicar/cargar en Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37995518309.
- CI #153 PASS_REAL: matriz del generador para las 111 opciones que declaran compatibilidad, más API, build y smoke E2E Chromium: https://github.com/jonhararagi/botimagen/actions/runs/37995616096.
- El catálogo v15 mantiene 47 categorías; compatible_with abarca 303 valores permitidos en 11 relaciones. BIMG-006 sube de 65% a 70%; total ponderado **61,8 / 100 → 62%**. QA física Windows y mediciones de rendimiento siguen NOT_RUN.
- BIMG-006 sube de 60% a 65% y BIMG-005 de 80% a 85% por el E2E ampliado. Total ponderado: **61,05 / 100 → 61%**. La prueba física de Windows y las mediciones de rendimiento siguen `NOT_RUN`.
- Catálogo v9 y compatibilidad de peinado, **CI #122 PASS_REAL**: referencias de compatibilidad, 120 escenarios con semilla para cinco largos y cinco cortes, locks manuales, API v9, `npm ci`, build y smoke E2E Chromium. https://github.com/jonhararagi/botimagen/actions/runs/37928912408.
- Catálogo v10 extiende compatibilidad a los diez arreglos capilares, **CI #124 PASS_REAL**: 264 escenarios con semilla entre largo/corte/arreglo, locks manuales, API v10, build y smoke E2E Chromium. https://github.com/jonhararagi/botimagen/actions/runs/37929316506.
- Catálogo v11 añade compatibilidad declarada entre diez outfits y cinco roles. CI #132 PASS_REAL: 144 escenarios con semilla (60 rol→outfit y 84 outfit→rol), locks manuales, API v11, build y smoke test previo: https://github.com/jonhararagi/botimagen/actions/runs/37935668304.
- - CI #134 PASS_REAL: smoke test Chromium confirma la compatibilidad declarada entre largo/corte/arreglo y el nuevo recorrido de rol de combate fijado → outfit AUTO, además de guardar/duplicar/cargar el perfil. https://github.com/jonhararagi/botimagen/actions/runs/37936099162.
- CI #127 amplía el E2E a la compatibilidad de largo/corte/arreglo a través del API local, y confirma el ciclo de perfil con el lock restaurado. Corrige el contrato para propagar `color_family` y `compatible_with`; generador/API/build/Chromium PASS_REAL: https://github.com/jonhararagi/botimagen/actions/runs/37929857432.
- CI #118 detectó una aserción de versión antigua en `tests/test_local_api.py` (`catalog_version == 7` después del cambio a v8). Corregida a v8; CI #119 PASS_REAL ejecuta toda la batería, `npm ci`, build y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/37928453343.
- BIMG-006 sube de 50% a 55% por compatibilidad outfit/rol; BIMG-005 de 75% a 80% por el recorrido E2E ampliado entre pestañas y perfil persistido. Total ponderado: **58,65 / 100 → 59%**. La prueba física Windows y las mediciones de rendimiento continúan **NOT_RUN**.
- CI #136/#137 mejora la validación del campo de semilla. Chromium confirma rechazo de formato malformado y fuera de rango, aceptación del máximo entero seguro y recuperación con semilla válida. El porcentaje no cambia porque es una corrección de calidad: **58,65 / 100 → 59%**. https://github.com/jonhararagi/botimagen/actions/runs/37950307373.
- CI #189 PASS_REAL: restaurar ejemplo restablece locks/semilla, el guardado permanece bloqueado hasta regeneración y Chromium no detecta overflow horizontal en 320/390/768/1024 px: https://github.com/jonhararagi/botimagen/actions/runs/38022092458.
- CI #190 PASS_REAL: además de la batería Python, API, npm ci y build, Chromium audita que cada selector visible tenga etiqueta conectada en las ocho pestañas: https://github.com/jonhararagi/botimagen/actions/runs/38022168780.
- Estas son mejoras de cobertura E2E, no una fase funcional cerrada. El total ponderado permanece **62,16 / 100 → 62%**. La validación física Windows y las mediciones de rendimiento siguen NOT_RUN.


## Nota de continuidad · 2026-10-09

Se añadió el protocolo de investigación comparativa en `cerebro/INSTRUCCIONES.md` y `cerebro/INVESTIGACION_COMPARATIVA.md`. Esta entrega cierra la reproducibilidad de dependencias web: `web/package-lock.json` se generó desde npm y CI valida `npm ci`. La reproducibilidad web elevó el total a 33,6/100. La expansión del editor a 46 controles actualizó BIMG-005 a 60%. El primer bloque modular añadió seis categorías de rasgo en catálogo, motor, prompt, UI y pruebas, llevando BIMG-006 inicialmente a 20%. La duplicación local quedó implementada y probada, llevando BIMG-005 a 70%. Ese checkpoint era **49,2 / 100 → 49%**. El catálogo v6 amplió cuatro regiones de escamas y llevó el checkpoint a **49,8 / 100 → 50%**. El catálogo v7 añadió color de puntas y actualizó el checkpoint a **50,7 / 100 → 51%**. La CI #112 añadió smoke test headless Chromium y elevó el checkpoint a **53,1 / 100 → 53%**. La compatibilidad capilar AUTO y la CI #117 subieron el checkpoint a **54,6 / 100 → 55%**. Catálogo v9 y las pruebas de largo/corte llevaron el checkpoint a **55,35 / 100 → 55%**. Catálogo v10 amplió compatibilidad a arreglos capilares y dejó el checkpoint en **56,1 / 100 → 56%**. CI #127 añadió el primer E2E de compatibilidad UI/API y llevó BIMG-005 a 75%. Catálogo v11 amplió compatibilidad a outfit/rol; CI #134 validó el recorrido entre pestañas y perfiles, elevando BIMG-005 a 80%, BIMG-006 a 55% y el total actual a **58,65 / 100 → 59%**. La prueba física Windows continúa `NOT_RUN`. Catálogo v14 añade accesorio/rol y v15 anatomía/especie; CI #149/#151/#152/#153 verifica compatibilidad, proyección de metadatos y persistencia manual. BIMG-006 sube a 70% y el checkpoint actual es **61,8 / 100 → 62%**. La prueba física Windows continúa NOT_RUN.

## Siguiente trabajo que más reduce el riesgo

1. Ampliar compatibilidad AUTO a vestuario, anatomía y peinados, aprovechando los patrones y las familias de color sin crear combinaciones prefabricadas.
2. Ampliar tests E2E de Chromium a más campos, errores de validación y perfiles heredados.
3. Ejecutar prueba física en Windows, revisar rutas con acentos/espacios y medir RAM/tiempos.

Actualizar este archivo al finalizar cada tarea. Los pesos no deben cambiarse para aparentar avance; solo revisarlos si cambia de forma aprobada el alcance de la beta, documentando la razón.

- BIMG-RESEARCH-001 (2026-10-09): investigación inicial de dos generadores de avatares documentada con fuentes y límites en `cerebro/INVESTIGACION_COMPARATIVA.md`. Decisión: evitar servicios de nube/cuentas en la beta local-first; mantener el intake y la generación neuronal como módulos separados. **El porcentaje no cambia**: investigación sin cambio funcional no cierra criterios de fase. HEAD de código base consultado: `10773b3ac0336697318df8f14cad2c0aeabe256c`.

- CI #156 PASS_REAL: E2E Chromium simula un 500 transitorio en `/api/generate`, verifica el mensaje de error y confirma recuperación de la generación. https://github.com/jonhararagi/botimagen/actions/runs/38000016639. BIMG-005 sube de 85% a 87%; progreso recalculado **62,16 / 100 → 62%**. QA física Windows sigue NOT_RUN.
- CI #159 PASS_REAL: el servidor rechaza `Content-Type: text/plain` con HTTP 415 y una longitud declarada superior a 64 KiB con HTTP 413 antes de leer el cuerpo. https://github.com/jonhararagi/botimagen/actions/runs/38001028451.
- CI #160 PASS_REAL: añade HTTP 411 cuando falta `Content-Length`; Chromium comprueba que el mensaje del 500 transitorio se retire tras la recuperación. Suite completa y build PASS. https://github.com/jonhararagi/botimagen/actions/runs/38001184083. **Progreso ponderado sin cambio: 62,16 / 100 → 62%**; QA física Windows y rendimiento siguen NOT_RUN.
- CI #167 PASS_REAL: catálogo v16 y semántica explícita de `outer_layer=none`; el generador comprueba el prompt natural y Chromium valida el flujo real de selección, regeneración y estado de guardado. https://github.com/jonhararagi/botimagen/actions/runs/38003917950. **Progreso sin cambio: 62,16 / 100 → 62%**; se mejora una arista de calidad sin cerrar criterios de fase.

- Investigación comparativa BIMG-RESEARCH-002 sobre intake local: MDN/W3C (validación de archivos y ciclo de vida de object URLs) y reportes públicos de Filerobot Image Editor. Decisiones y casos de prueba propuestos para BIMG-008 quedan en `cerebro/INVESTIGACION_COMPARATIVA.md`; no se ejecutó un benchmark ni cambió el progreso: **62,16 / 100 → 62%**.

- CI #179 PASS_REAL: PR #2 fusiona la regresión de reproducibilidad de semilla. El payload completo se repite exactamente con cinco semillas y ambos modos `surprise`; también pasan generador, API, build web y Chromium E2E: https://github.com/jonhararagi/botimagen/actions/runs/38013431814. Es cobertura de calidad, no cierre de fase: progreso ponderado sin cambio, **62,16 / 100 → 62%**. QA física Windows sigue NOT_RUN.


- BIMG-ENGINE-005 CyberStreet visual slice, first implementation: CI #294 PASS_REAL for Python/API/recipe checks, React/TypeScript build, Chromium smoke and 81-file visual QA artifact: https://github.com/jonhararagi/botimagen/actions/runs/38061347842. Inspection of real screenshots found two visual issues (bomber pockets at fit 0 and long-coat length); follow-up corrections are in progress. This is incremental renderer QA, not phase completion. Global beta progress remains **63%**; WINDOWS_MANUAL_QA: NOT_RUN.

- BIMG-ENGINE-005 follow-up: commit 808ad1f67969d5fbd499d84a7f34874dd0037115 corrected bomber pockets at fit 0 and extended long-coat length. Exact-head CI #295 succeeded, including the existing Python/API/recipe checks, React+TypeScript build, Chromium smoke and 81-file artifact: https://github.com/jonhararagi/botimagen/actions/runs/38061573243. I inspected the final 20 visual-slice captures and compared them with baseline artifact from run 38059670221. The bomber, tactical baseball jacket and long coat now differ more clearly in garment construction; remaining anatomy/rigging limits mean the result stays **PARTIAL**, not commercial-grade approval. Global beta progress remains **63%**; WINDOWS_MANUAL_QA: NOT_RUN.


- **BIMG-ENGINE-007-R1A checkpoint (2026-10-11): BLOCKED_BEFORE_CODE_CHANGE.** La inspección confirmó `main` en `b508cfe7d3216eda801438d46dff8873842cea86`, merge-base `46bc7e702ae5d608927345991b5c4f0a661318a9`, y una divergencia reportada de 98 commits de la rama del PR #11 frente a 2 commits exclusivos de main. No se editó el renderer ni se modificó catálogo/recetas/dataset porque no se pudo realizar un merge normal verificable mediante las operaciones disponibles. La documentación del gate registra la causa y el procedimiento de reanudación. **Progreso global sin cambios: 63%**; no se completó capacidad funcional ponderada. TIMER inicial 4–8 h; tiempo real NOT_MEASURED; 0 h de implementación de código; R1A continúa pendiente.


- BIMG-ENGINE-007-R1A-REMOTE-01 (2026-10-11): landmarks compartidos consumidos por cuello/torso, contrato de capas aplicado y CI #314 `SUCCESS` en `9b8f9a69465c5b21e2a3d43fd29ad94674c42365`; capturas front/back generadas y seis revisadas. Se conserva **63%** porque la fase de beta no está cerrada. QA física Windows: `NOT_RUN`. TIMER 4–6 h estimadas; tiempo real `NOT_MEASURED`.


- **BIMG-ENGINE-007-R1A-REMOTE-02 (2026-10-11):** se conectaron landmarks compartidos a brazos, manos, pelvis, piernas y forma base del calzado; las raíces de prendas y capas exponen IDs semánticos, y Chromium comprueba el orden no decreciente de las capas etiquetadas en la matriz visual. CI #38152019549 `SUCCESS` en el HEAD exacto `9613bca14f730c8357aaf9054c2a374615f079e9`: https://github.com/jonhararagi/botimagen/actions/runs/38152019549. La ejecución anterior falló porque `street_bomber` no tenía marcador `outfit`; se corrigió antes del PASS final. Artefacto QA de 81 archivos: https://github.com/jonhararagi/botimagen/actions/runs/38152019549/artifacts/11706434232. La reconstrucción anatómica y revisión artística completa siguen pendientes; `WINDOWS_MANUAL_QA: NOT_RUN`. TIMER 4–6 h estimadas; tiempo real `NOT_MEASURED`. **Progreso global sin cambios: 63%**.


- **Inspección visual acotada de R1A-REMOTE-02 (2026-10-11):** se revisó una matriz de contacto de seis capturas front/back (fit 50) para `street_bomber`, `tactical_baseball` y `long_coat` desde el artefacto CI #38152019549. Las prendas se mantienen diferenciadas, pero la figura sigue compacta/chibi y la vista posterior esquemática. La revisión de seis capturas no es una inspección individual de los 81 archivos ni una aprobación artística. Próximo objetivo: re-proporción de silueta compartida y continuidad pierna-calzado. El progreso ponderado sigue en **63%**; `WINDOWS_MANUAL_QA: NOT_RUN`.

## BIMG-ENGINE-008-R5 · 2026-10-12

- El arnés SVG y sus pruebas se reforzaron, pero no se cierra ninguna fase de la beta ni se aumenta el porcentaje: el renderer aún no ofrece una superficie anatómica neutra independiente de prendas. La estimación ponderada se mantiene en **62,96 / 100 → 63%**.
- Evidencia/continuidad: [informe R5](../docs/engineering/BIMG-ENGINE-008-R5-ANATOMICAL-SVG-HARNESS.md). CI exacta y artefactos quedan pendientes de verificar contra el HEAD final. `WINDOWS_MANUAL_QA: NOT_RUN`.
- TIMER: 2–4 horas estimadas; tiempo real no medido de forma fiable.


- **BIMG-ENGINE-009-R1 (2026-10-12):** separación estructural de cuerpo base y vestuario implementada; las capturas front/back sin prendas y la composición vestida se inspeccionaron desde el artefacto [CI #349](https://github.com/jonhararagi/botimagen/actions/runs/38204514831/artifacts/11726378465). La CI del código revisado pasó en el SHA `0e86fbd6fe9cfd927387975d3bfac81e9f93af34`: [run #349](https://github.com/jonhararagi/botimagen/actions/runs/38204514831). Resultado `PARTIAL`, porque la base es esquemática y hombros/tórax, cintura y articulaciones no están suficientemente segmentados para calibración. La tarea no cierra una fase ponderada de beta: progreso permanece en **63%**. `WINDOWS_MANUAL_QA: NOT_RUN`. TIMER: 4–7 h estimadas; tiempo real `NOT_MEASURED`. La CI del HEAD final tras estos cambios documentales debe verificarse antes del cierre. Informe: [BIMG-ENGINE-009-R1](../docs/engineering/BIMG-ENGINE-009-R1-BODY-GARMENT-SEPARATION.md).

- 2026-10-12 · BIMG-ENGINE-010 conecta una ruta de dibujo SVG paramétrico a la vista previa visible. El progreso ponderado sigue en 63% hasta revisar CI, capturas y QA física; no se aumenta por sumar código o documentación.


## BIMG-PRODUCT-001-R1 · evidencia pendiente

- Biblioteca inicial versionada con recursos locales originales, catálogo y validador de procedencia/licencias/rutas.
- El estudio permite cargar dos presets editables y cambiar entre tres fondos locales sin red; la única ilustración visible del personaje procede del motor Python. El renderer React histórico queda como fixture oculto de QA.
- CI #377 pasó en `fee1524ae241857d8b51bb319f954a21956c8795`: validación Python, catálogo/procedencia, contrato del motor, build React/TypeScript y smoke Chromium E2E. Evidencia: https://github.com/jonhararagi/botimagen/actions/runs/38248187422.
- Artefacto Chromium del mismo SHA: [botimagen-visual-garment-qa](https://github.com/jonhararagi/botimagen/actions/runs/38248187422/artifacts/11746755371). Contiene capturas del estudio frontal/posterior y presets; no se pudo descargar desde la sesión actual para inspección visual humana, así que la aceptación artística permanece `PARTIAL`.
- La biblioteca local inicial y el selector de fondos ya están conectados al editor; la biblioteca de referencias indexada, el intake completo y la QA física siguen pendientes. El progreso global permanece en **63%** para no inflarlo por documentación/recursos solamente. `WINDOWS_MANUAL_QA: NOT_RUN`.


## BIMG-ART-002-R1 · checkpoint de mejora artística

- Se conectaron controles faciales existentes con el SVG (perfiles de forma, espaciado ocular, desplazamiento de boca y tratamiento de nariz) y se corrigió la longitud de la masa capilar posterior para que siga el largo elegido y los landmarks del cuerpo.
- Se amplió la cobertura de pruebas del renderer y se añadieron capturas Chromium para ambos presets, vistas posteriores y variantes faciales/capilares.
- La implementación está en revisión: CI del HEAD final, generación/inspección de PNG y aceptación artística siguen pendientes. No aumentar el progreso ponderado por archivos o pruebas solamente.
- Estado: **PARTIAL**. Beta global conservada en **63%**. `WINDOWS_MANUAL_QA: NOT_RUN`. Tiempo real: `NOT_MEASURED`.
- Informe técnico: [BIMG-ART-002-R1](../docs/engineering/BIMG-ART-002-R1.md).


## BIMG-ART-002-R1 · resultado de QA visual

- CI #399 pasó para el código de renderer/pruebas en `32d2b71b0ce9c77b4825bbb566ec53a20a95d6ab`. Artefacto real inspeccionado: https://github.com/jonhararagi/botimagen/actions/runs/38253325201/artifacts/11748818282.
- Evidencia visual: la caída posterior del cabello sigue el largo elegido, las formas faciales cambian el contorno real y los paneles de sombra/costuras añaden algo de profundidad a la ropa. La mejora de volumen frontal sigue siendo moderada; pose/manos y reutilización de familias de peinados requieren otra iteración.
- Estado artístico: **PARTIAL**. No subir la beta global del **63%**. `WINDOWS_MANUAL_QA: NOT_RUN`; tiempo real `NOT_MEASURED`.


## BIMG-MODULAR-2D-002 · actualización 2026-10-12

- Publicado el contrato modular v1, el compositor determinista PNG y un panel integrado en la aplicación existente.
- Pruebas añadidas para contrato, anclajes, transparencia/dimensiones, reproducibilidad, recursos ausentes y migración conservadora de recetas v1/v2/v3.
- **Estado: EN PROGRESO / NO ACEPTADO.** Aún faltan ejecución CI del HEAD actual, E2E real de cambio de cabello/prendas, perfil modular conectado al sistema persistente de perfiles y revisión de capturas.
- No se incrementa el porcentaje global del producto con esta entrega parcial. `WINDOWS_MANUAL_QA: NOT_RUN`; `TIME_MEASURED: NOT_MEASURED`.
- Estimación restante de ingeniería: **8–16 horas activas**, más producción y calibración de recursos artísticos independientes.


- **BIMG-WAIFU-FACTORY-002 (2026-10-13):** se amplió el smoke E2E para validar el PNG descargado (dimensiones/RGBA/alfa/contenido), la independencia persistente de la variante y la persistencia de piezas importadas después de recargar la app. Código de prueba: `47b35e0d991f4b2c1f9bfdd1d0cf3fd8949b17b3`. Ejecución local y CI exacta aún sin evidencia verificable; estado PARTIAL, sin subir el progreso ponderado global (**63%**, último checkpoint registrado). TIMER estimado 8–16 h; tiempo real `NOT_MEASURED`.


- **BIMG-WAIFU-FACTORY-002 · cierre técnico del recorrido (2026-10-13):** CI #629 PASS_REAL en el SHA de código 0b85ddd5c98eb5c0e81d459b99f00fa67ec7c599: [run y pasos](https://github.com/jonhararagi/botimagen/actions/runs/38413181653), [artefacto visual QA](https://github.com/jonhararagi/botimagen/actions/runs/38413181653/artifacts/11821424551). Build TS/Vite, suites Python/API y Chromium pasaron; se verificó el archivo PNG descargado con alfa y contenido, perfiles independientes, guardado/carga de referencias de piezas importadas tras recarga y composición real. El porcentaje ponderado permanece **63%** porque no se ha declarado cerrada la beta completa. QA física Windows y segmentación semántica de imágenes opacas continúan pendientes.


- **BIMG-WAIFU-FACTORY-003 · personalización artística de piezas (2026-10-13):** estado `PASS_REAL` para el código probado `405a1283d3402f2b78f25bb9206c864ec8065298`; [CI #639](https://github.com/jonhararagi/botimagen/actions/runs/38451083604) completó las suites Python/API, build TypeScript/Vite y Chromium E2E. Se añadieron controles reales de posición X/Y, escala, rotación, orden de capa y visibilidad, con persistencia por perfil. Las pruebas verifican cambios de píxeles, orden y visibilidad, restauración e independencia de variantes, PNG RGBA 512×768 con alfa y ausencia de overflow/API/console errors. [Artefacto QA visual](https://github.com/jonhararagi/botimagen/actions/runs/38451083604/artifacts/11840835816). La captura usa fixtures sintéticos y no representa una aceptación de arte profesional. QA física Windows: `NOT_RUN`; segmentación semántica de PNG opacos sigue sin estar implementada/validada. TIMER estimado 12–24 h; tiempo real `NOT_MEASURED`. El porcentaje global no cambia: **63%**.


## BIMG-WAIFU-FACTORY-004-R2 · evidencia incremental · 2026-10-14

- CI PASS para el SHA probado `ca3b518cc7aece9c7ace1ee03f71e509b42a9a51`: [Actions run 643](https://github.com/jonhararagi/botimagen/actions/runs/38512999758).
- Implementados y probados en Chromium los controles del compositor CyberStreet para visibilidad, movimiento, escala, rotación y orden; guardado/duplicación/restauración de perfil; PNG RGBA transparente 512×768.
- Artefacto visual real: [botimagen-visual-garment-qa](https://github.com/jonhararagi/botimagen/actions/runs/38512999758/artifacts/11871071978).
- BIMG-WAIFU-FACTORY-004-R2 sigue **PARTIAL**: pendiente cambiar una pieza por una alternativa PNG de la biblioteca importada y validar ese roundtrip. QA física Windows **NOT_RUN**.

## BIMG-WAIFU-FACTORY-004-R4 · evidencia de integración PNG · 2026-10-14

- Alcance específico **PASS_REAL** en SHA probado `7de4e7305bd0463c37429a5b2d39a41b85c55244`; [CI #652](https://github.com/jonhararagi/botimagen/actions/runs/38564001716) pasó suites Python/API, `npm ci`, build y Chromium E2E.
- El smoke E2E importa una pieza PNG de la biblioteca, la asigna a la capa real de chaqueta CyberStreet, verifica que el SVG contiene el ID del PNG, exporta antes/después y confirma que cambian los bytes del PNG RGBA 512×768. Después recarga la app y restaura el mismo ID de pieza desde el perfil persistido. [Artefacto QA](https://github.com/jonhararagi/botimagen/actions/runs/38564001716/artifacts/11893795035).
- Esto cierra el hueco concreto de conexión biblioteca PNG → compositor CyberStreet → exportación → perfil. No cierra por sí solo todas las tareas BIMG-007/008/009/010 ni la beta completa; por ello el porcentaje ponderado global queda en **63%**, sin recalcular fases ajenas a este alcance.
- QA física en Windows: `NOT_RUN`. El fixture es sintético; la evaluación de assets artísticos reales sigue siendo independiente.
- TIMER estimado original: 4–8 horas activas; tiempo real medido: `NOT_MEASURED`.
