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

**Estado:** PARTIAL (~90%). Shell React/TypeScript, proxy `/api`, conexión a catálogo/API y `web/package-lock.json` están implementados. CI usa `npm ci` y el build pasa. El smoke test real de navegador/Windows sigue pendiente y se mantiene en BIMG-009.  
**TIMER:** 3–5 horas estimadas para el spike inicial; el tiempo de integración está registrado también en BIMG-004.  
**Trabajo:**
- Crear un frontend TypeScript + React + Vite en una carpeta propia, sin tocar ni retirar aún la app Tkinter.
- Añadir lint/build o comprobaciones equivalentes y una interfaz de shell adaptable.
- Diseñar una dirección visual de estudio de personajes: panel de categorías, área central del diseño, panel de resumen y vista de prompts.
- Configurar CI para instalar dependencias reproducibles desde `package-lock.json` mediante `npm ci` y compilar.

**Evidencia:** CI #65 `PASS_REAL` en `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`: `npm ci` y `npm run build` pasaron junto a las pruebas Python. https://github.com/jonhararagi/botimagen/actions/runs/37920504103. El smoke test real en Chrome/Edge y Windows sigue pendiente.

### BIMG-004 · Puente web hacia el motor Python

**Estado:** PARTIAL (~90%).  
**TIMER:** 4–8 horas estimadas para el puente inicial; la API y la UI principal ya están conectadas.
**Implementado:** servicio Python de biblioteca estándar en `botimagen_server.py`; endpoints `/api/health`, `/api/catalog`, `/api/generate`, `/api/profiles` y lectura por UUID; validación de categorías/opciones contra el catálogo oficial; límite de JSON, semilla/coherencia validadas, guardado atómico con ID generado por servidor y rutas restringidas a UUID; Vite proxy local; UI consume catálogo y motor, guarda perfiles, lista y carga perfiles guardados.
**Evidencia:** CI #60 PASS, incluidas pruebas HTTP de catálogo, generación, reproducibilidad, rechazo de rasgos desconocidos y persistencia local, junto con compilación de interfaz: https://github.com/jonhararagi/botimagen/actions/runs/37887835609.
**Pendiente:** smoke test real de navegador/Windows y revisión final del flujo local antes de cerrar la tarea.

**Criterio de aceptación final:** tests del servicio, errores controlados, perfil generado por el motor existente, integración UI/API y persistencia local; documentar el runtime físico por separado.

### BIMG-005 · Migrar el editor de rasgos

**Estado:** PARTIAL (~60%). El editor ofrece 46 rasgos del catálogo oficial repartidos en 8 pestañas; quedan pendientes duplicación/regeneración más pulida, pruebas de interacción completa y QA real en navegador/Windows.  
**TIMER:** 1–3 días.  
**Trabajo:**
- Implementar las pestañas IDENTIDAD, CUERPO, ANATOMÍA, CARA, CABELLO, VESTUARIO, COMBATE y DETALLE. **Completado:** las ocho pestañas cubren las 46 categorías actuales de `character_rules.json`, cada una con un único control individual.
- Mantener la regla: las opciones disponibles provienen del catálogo; las búsquedas no crean rasgos.
- Mostrar de forma explícita valores fijados y AUTO.
- Añadir semilla editable, coherencia/variedad, generar, guardar, duplicar, cargar y regenerar desde un favorito.
- Incluir el perfil inicial bw-modern-gacha-v1.

**Evidencia parcial:** CI #82 valida que cada una de las 46 categorías del catálogo tenga exactamente un control de edición, que no existan campos duplicados y que los 8 grupos y pestañas coincidan; `npm ci`, generación de perfiles y build pasan.

**Pendiente para cerrar:** duplicar perfiles desde la UI, reforzar pruebas de combinaciones/locks y realizar smoke test real del navegador/Windows.

**Aceptación:** se genera un perfil JSON válido y un prompt desde elecciones estructuradas; las elecciones bloqueadas no cambian; la semilla queda registrada y las pruebas cubren combinaciones compatibles.

### BIMG-006 · Ampliar el modelo modular de rasgos

**Estado:** PARTIAL (~20%). Se añadieron seis categorías nuevas e independientes para busto, patrón/color de escamas y color de raíces/coronilla/interior del cabello; se integraron en el prompt y en los ocho grupos de la UI. Falta ampliar zonas y compatibilidad, además de más pruebas con especies y patrones distintos.  
**TIMER:** 1–3 días por el primer bloque de mejoras; la ampliación de catálogos será continua.  
**Prioridad:** cabello, ojos y anatomía/cuerpo.  
**Trabajo:**
- **Completado en este bloque:** añadir campos independientes con IDs estables y conectarlos al catálogo, motor, prompt y UI: `bust_size`, `scale_pattern`, `scale_color`, `hair_root_color`, `hair_crown_color`, `hair_inner_color`.
- Modelar, tras definir vocabulario compatible, color de base, raíz, coronilla, interior, puntas, mechones, patrón/gradiente y acabado del cabello.
- Añadir opciones de ojos, forma/pupila y heterocromía, y proporciones/categorías de cuerpo, incluido busto.
- Primera cobertura implementada para distribución/color de escamas y zonas separadas de cabello; faltan nuevas regiones de escamas/cabello, mejoras de compatibilidad por especie y validaciones semánticas adicionales.
- Añadir compatibilidad, exclusiones, selección AUTO y pruebas por combinación.

**Evidencia parcial:** CI #82 ejecuta `test_modular_bust_scales_and_hair_zones_are_independent`: comprueba que las elecciones manuales permanecen fijadas y que busto, patrón/color de escamas, raíces, coronilla e inner hair aparecen como conceptos separados en el prompt. La prueba de cobertura exige un control UI por cada categoría del catálogo.

**Pendiente para cerrar:** probar múltiples familias de especie y los modos AUTO con varias semillas, sumar opciones de zonas/patrones que falten y revisar compatibilidad/exclusiones. La generación de imagen no está incluida en este criterio.

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

**Estado:** NOT_STARTED.  
**TIMER:** 4–8 horas, sin contar correcciones imprevistas.  
**Trabajo:** iniciar y detener con .bat, abrir el navegador, diseñar/guardar/recargar un perfil, importar imágenes, probar caracteres de rutas con acentos y espacios, revisar errores y medir RAM/tiempo al navegar por un catálogo de prueba.

**Aceptación:** resultado real en el PC, con versión de Windows, pasos ejecutados, mediciones observadas y fallos pendientes. CI verde no sustituye esta prueba.

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
