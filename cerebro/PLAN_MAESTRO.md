# Plan maestro de trabajo · BotImagen Web-first

## Objetivo de la beta

Una aplicación local para Windows que se abre en el navegador y permite diseñar personajes adultos originales con opciones modulares, generar perfiles/prompts reproducibles, guardar favoritos y diseños, importar imágenes y buscar referencias en una biblioteca local indexada. No necesita Internet para el flujo principal ni APIs pagadas.

La beta inicial no requiere que BotImagen genere píxeles por sí mismo ni que la web sea accesible públicamente.

## Progreso global

El porcentaje ponderado de la beta local se mantiene en [`PROGRESO.md`](PROGRESO.md). El cálculo cuenta únicamente alcance de beta web local, no funciones futuras opcionales como generación neuronal.

## TIMER y alcance

Todos los TIMER indican esfuerzo técnico estimado. No son fechas prometidas y pueden ajustarse tras inspeccionar el código y probar en Windows. Los tiempos de fase pueden solaparse parcialmente, pero no deben sumarse como garantía de calendario.

### BIMG-001 · Crear dirección técnica y continuidad

**Estado:** DONE en esta entrega.  
**TIMER:** 1–2 horas estimadas.  
**Archivos:** cerebro/README.md, INSTRUCCIONES.md, ARQUITECTURA.md, PLAN_MAESTRO.md, ESTADO_ACTUAL.md y enlace desde el README raíz.  
**Aceptación:** arquitectura elegida, estado inicial y orden de trabajo registrados. La nueva interfaz no se declara implementada.

### BIMG-002 · Auditar y preservar la base vigente

**Estado:** DONE en esta entrega del 2026-10-09.  
**TIMER:** 2–4 horas estimadas.  
**Trabajo:**
- Ejecutar o volver a confirmar toda la CI actual y documentar el resultado.
- Inspeccionar character_generator.py, character_rules.json, favoritos, guardado de perfil, manifest, intake y validaciones.
- Identificar dependencias reales de Tkinter y separar la lógica de dominio que deba poder usarse desde una API.
- Ejecutar doctor.py en Windows si el equipo local está disponible.
- Anotar contratos de entrada/salida y muestras de perfil.

**Aceptación:** completada con inspección del código y pruebas automatizadas de CI. `doctor.py` y la UI en Windows: NOT_RUN porque no se dispuso de una sesión física de Windows. La app Tkinter se conserva.

### BIMG-003 · Spike de frontend web

**Estado:** PARTIAL (~95%). Shell React/TypeScript, proxy `/api`, catálogo/API y `web/package-lock.json` están implementados. `npm ci`, build y smoke E2E headless Chromium pasan en CI #112. Falta prueba manual en Chrome/Edge sobre Windows.  
**TIMER:** 3–5 horas estimadas para el spike inicial; el tiempo de integración está registrado también en BIMG-004.  
**Trabajo:**
- Crear un frontend TypeScript + React + Vite en una carpeta propia, sin tocar ni retirar aún la app Tkinter.
- Añadir lint/build o comprobaciones equivalentes y una interfaz de shell adaptable.
- Diseñar una dirección visual de estudio de personajes: panel de categorías, área central del diseño, panel de resumen y vista de prompts.
- Configurar CI para instalar dependencias reproducibles desde `package-lock.json` mediante `npm ci` y compilar.

**Evidencia:** CI #65 `PASS_REAL` en `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`: `npm ci` y `npm run build` pasaron junto a las pruebas Python. CI #112 `PASS_REAL` ejecuta Chromium headless contra API y Vite locales, cubriendo generación, cambios pendientes, guardado, duplicación y carga: https://github.com/jonhararagi/botimagen/actions/runs/37927181644. Falta ejecutar manualmente Chrome/Edge en Windows.

### BIMG-004 · Puente web hacia el motor Python

**Estado:** PARTIAL (~95%).  
**TIMER:** 4–8 horas estimadas para el puente inicial; la API y la UI principal ya están conectadas.
**Implementado:** servicio Python de biblioteca estándar en `botimagen_server.py`; endpoints `/api/health`, `/api/catalog`, `/api/generate`, `/api/profiles` y lectura por UUID; validación de categorías/opciones contra el catálogo oficial; límite de JSON, semilla/coherencia validadas, guardado atómico con ID generado por servidor y rutas restringidas a UUID; Vite proxy local; UI consume catálogo y motor, guarda perfiles, lista y carga perfiles guardados.
**Evidencia:** CI #60 PASS, incluidas pruebas HTTP de catálogo, generación, reproducibilidad, rechazo de rasgos desconocidos y persistencia local, junto con compilación de interfaz: https://github.com/jonhararagi/botimagen/actions/runs/37887835609.
**Evidencia nueva:** CI #112 `PASS_REAL` comprueba desde Chromium headless que el catálogo y generador Python funcionan a través del navegador, incluyendo guardar/duplicar/cargar y bloquear acciones con snapshot desactualizado: https://github.com/jonhararagi/botimagen/actions/runs/37927181644.
**Pendiente:** prueba manual en Windows y revisión final del flujo local antes de cerrar la tarea.

**Criterio de aceptación final:** tests del servicio, errores controlados, perfil generado por el motor existente, integración UI/API y persistencia local; documentar el runtime físico por separado.

### BIMG-005 · Migrar el editor de rasgos

**Estado:** PARTIAL (~85%). El editor ofrece 47 categorías del catálogo oficial en 8 pestañas y permite guardar, listar, cargar y duplicar perfiles con IDs independientes. CI #144 PASS_REAL verifica en Chromium que el rol tank restringe AUTO de vestuario, capa exterior, calzado y prop mediante el catálogo servido por la API, y que el perfil conserva compatibilidad al guardar, duplicar y cargar. Quedan pruebas de otros flujos de error, revisión visual amplia y QA física en Windows.  
**TIMER:** 1–3 días.  
**Trabajo:**
- Implementar las pestañas IDENTIDAD, CUERPO, ANATOMÍA, CARA, CABELLO, VESTUARIO, COMBATE y DETALLE. **Completado:** las ocho pestañas cubren las 46 categorías actuales de `character_rules.json`, cada una con un único control individual.
- Mantener la regla: las opciones disponibles provienen del catálogo; las búsquedas no crean rasgos.
- Mostrar de forma explícita valores fijados y AUTO.
- **Completado:** semilla editable, coherencia, generación, guardar, cargar y duplicar perfiles; la acción generar regenera cualquier perfil cargado.
- Incluir el perfil inicial bw-modern-gacha-v1.

**Evidencia parcial:** CI #93 valida cobertura del editor, motor/API, `npm ci` y build. CI #127 PASS_REAL verifica en Chromium los cambios pendientes, compatibilidad de largo/corte/arreglo a través del API local y el ciclo guardar/duplicar/cargar. La prueba HTTP de perfiles verifica UUID independiente, copia de datos y que el original no sea alterado. CI #86 también comprueba compatibilidad AUTO de escamas en 12 semillas por especie.

**Pendiente para cerrar:** mejorar pruebas de interacciones completas y errores de UI, y realizar smoke test real del navegador/Windows.

**Aceptación:** se genera un perfil JSON válido y un prompt desde elecciones estructuradas; las elecciones bloqueadas no cambian; la semilla queda registrada y las pruebas cubren combinaciones compatibles.

### BIMG-006 · Ampliar el modelo modular de rasgos

**Estado:** PARTIAL (~65%). El catálogo v13 mantiene 47 categorías y declara compatibilidad en diez cortes, diez arreglos capilares, diez vestimentas, diez props de baseball, diez capas exteriores y diez tipos de calzado. El motor filtra AUTO en ambas direcciones y conserva cualquier elección manual aunque contradiga las reglas. CI #144 PASS_REAL incluye batería de motor/API, referencias declarativas, build y Chromium E2E con comprobación de vestuario, capa, calzado y prop por rol. 
**TIMER:** 1–3 días por el primer bloque de mejoras; la ampliación de catálogos será continua.  
**Prioridad:** cabello, ojos y anatomía/cuerpo.  
**Trabajo:**
- **Completado en este bloque:** añadir campos independientes con IDs estables y conectarlos al catálogo, motor, prompt y UI: `bust_size`, `scale_pattern`, `scale_color`, `hair_root_color`, `hair_crown_color`, `hair_inner_color`, `hair_tip_color`.
- Modelar, tras definir vocabulario compatible, color de base, raíz, coronilla, interior, puntas, mechones, patrón/gradiente y acabado del cabello.
- Añadir opciones de ojos, forma/pupila y heterocromía, y proporciones/categorías de cuerpo, incluido busto.
- Catálogo v6 añadió cuatro regiones de escamas; v7 añadió `hair_tip_color`; v8 incorporó familias cromáticas; v9 definió compatibilidad entre cortes y largos; v10 extendió esas reglas a los arreglos capilares; v11 añadió compatibilidad entre outfit y rol; v12 añadió compatibilidad entre props de baseball y rol; v13 cubre capas exteriores y calzado. La validación genérica de referencias evita IDs huérfanos. Quedan accesorios y combinaciones de anatomía por revisar.
- Añadir compatibilidad, exclusiones, selección AUTO y pruebas por combinación.

**Evidencia parcial:** CI #132 y CI #134 PASS_REAL prueban compatibilidad declarativa outfit/rol y el flujo UI/API en Chromium. CI #140 confirma la corrección de una regresión encontrada al probar prop→rol AUTO; CI #141 valida el catálogo v12, referencias declarativas, API y recorrido Chromium. CI #86 ejecuta `test_modular_bust_scales_and_hair_zones_are_independent`, que comprueba elecciones fijadas y la presencia independiente de busto, patrón/color de escamas y raíces/coronilla/interior de cabello en el prompt. `test_auto_scale_pattern_respects_species_compatibility` verifica las 10 especies con 12 semillas a coherencia 0,4: bajo la política actual, la especie dracónica recibe un patrón visible y las otras nueve no. `test_new_scale_regions_are_manual_and_prompted_independently` verifica el prompt de las cuatro nuevas regiones. CI #102: PASS_REAL, https://github.com/jonhararagi/botimagen/actions/runs/37925309773. CI #107 también valida `hair_tip_color` y el nuevo contrato de color capilar: https://github.com/jonhararagi/botimagen/actions/runs/37926064467. La prueba de cobertura exige un control UI por cada categoría.

**Pendiente para cerrar:** sumar opciones de zonas/patrones de cabello y extender compatibilidad/exclusiones declarativas a accesorios y combinaciones de anatomía. La generación de imagen no está incluida en este criterio.

### BIMG-007 · Biblioteca visual local

**Estado:** NOT_STARTED.  
**TIMER:** 1–3 días para un MVP útil.  
**Trabajo:**
- Crear base de datos SQLite y esquema versionado de referencias.
- Ingresar imágenes manualmente desde archivos/carpetas, generar miniaturas controladas y registrar hash, dimensiones, tags, autoría, fuente y licencia/estado.
- Implementar búsqueda, filtros por categoría/etiquetas, vista de miniaturas y apertura del original.
- Guardar la biblioteca fuera de Git por defecto y excluir datos personales/locales en .gitignore.
- Permitir asociar referencias con un rasgo y con un perfil.

**Aceptación:** importar, indexar, buscar, abrir y eliminar/retirar una referencia; duplicados detectados por hash; los metadatos desconocidos se marcan como desconocidos, no inventados.

### BIMG-008 · Integrar el flujo de assets existente

**Estado:** NOT_STARTED.  
**TIMER:** 1–2 días.  
**Trabajo:** adaptar selección de archivo, vista previa, validación, copiado a destino, historial local y manifiesto para usar la nueva interfaz; conservar la posibilidad de usar la aplicación anterior mientras la migración no esté completa.

**Aceptación:** importar un archivo válido y rechazar ejemplos inválidos con mensaje útil; no alterar el original; las operaciones de Git se mantienen explícitas y restringidas.

### BIMG-009 · QA real de Windows y rendimiento

**Estado:** PARTIAL (~20%). El smoke test automatizado Chromium headless en Linux está implementado y pasa en CI #112; cubre generación, actualización de prompt, protección frente a cambios pendientes y persistencia de perfiles. La prueba física Windows y las mediciones de rendimiento aún no se hicieron.  
**TIMER pendiente:** 4–8 horas, sin contar correcciones imprevistas.  
**Trabajo:** iniciar y detener con .bat, abrir el navegador, diseñar/guardar/recargar un perfil, importar imágenes, probar caracteres de rutas con acentos y espacios, revisar errores y medir RAM/tiempo al navegar por un catálogo de prueba.

**Aceptación:** resultado real en el PC, con versión de Windows, pasos ejecutados, mediciones observadas y fallos pendientes. El smoke headless de CI cubre solo una parte; no sustituye esta prueba.

### BIMG-010 · Empaquetar y publicar la beta local

**Estado:** NOT_STARTED.  
**TIMER:** 1–2 días después de que BIMG-002 a BIMG-009 estén aceptadas en el alcance beta.  
**Trabajo:** launcher claro, diagnóstico, instrucciones, datos de ejemplo con procedencia, recuperación ante error y ruta segura de actualización. No empaquetar un modelo de imagen pesado.

**Aceptación beta:** arranque repetible desde un directorio limpio siguiendo el README, diseño, guardado, referencia local e importación funcionales en las pruebas aceptadas.

### BIMG-011 · Evaluar generación de imágenes local

**Estado:** FUTURO OPCIONAL.  
**TIMER:** 2–4 horas para investigar alternativas y hacer una prueba de viabilidad inicial; el trabajo posterior depende del modelo elegido.  
**Trabajo:** evaluar modelos/licencias, compatibilidad real con el Ryzen 5 5600G y 16 GB RAM, resolución, VRAM compartida, tiempo por imagen y controles de pose/composición. Evitar cualquier dependencia obligatoria de API paga.

**Aceptación de investigación:** informe reproducible con modelo/versión, configuración, tiempos y uso de recursos reales, o conclusión documentada de que no resulta práctico.

## Puerta de beta

No decir BETA READY hasta que:
- el frontend compila en CI;
- el servicio tiene tests y validación de rutas/datos;
- las pruebas del generador anterior siguen pasando;
- los flujos diseñar, guardar, recargar, buscar referencia e importar imagen funcionan;
- hay una prueba real de navegador local y una prueba en Windows documentadas;
- errores y límites conocidos aparecen en la documentación;
- los datos locales y la biblioteca pesada no se suben accidentalmente a Git.

## Alcance excluido de la primera beta

- generación neuronal de imagen obligatoria;
- hosting remoto, login o sincronización multi-dispositivo;
- scraping masivo de plataformas de artistas;
- copiar personajes existentes;
- modelo 3D o rigging real;
- prometer precisión perfecta de cada prompt en cualquier generador.
