# Progreso global de BotImagen

**Último cálculo:** 2026-10-09  
**Objetivo medido:** beta local-first web en Windows, no el producto final con funciones opcionales futuras.  
**Progreso global actual: 62%**

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
| BIMG-008 · Intake de assets en la interfaz web | 8% | 0% · NOT_STARTED | 0,0 |
| BIMG-009 · QA físico de navegador/Windows y rendimiento | 6% | 20% · PARTIAL | 1,2 |
| BIMG-010 · Empaquetar y validar beta local | 5% | 0% · NOT_STARTED | 0,0 |
| **Total ponderado** | **100%** | | **62,16 / 100 → 62%** |

BIMG-011, la investigación de generación neuronal local, es opcional y posterior a la beta; no se incluye en este denominador porque la beta no depende de generar píxeles.

## Evidencia más reciente

- Lockfile generado por npm y versionado en `web/package-lock.json` (lockfileVersion 3).
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
