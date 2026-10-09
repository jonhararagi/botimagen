# Progreso global de BotImagen

**Último cálculo:** 2026-10-09  
**Objetivo medido:** beta local-first web en Windows, no el producto final con funciones opcionales futuras.  
**Progreso global actual: 50%**

El porcentaje usa puntos ponderados por fase. No se calcula por cantidad de archivos, líneas de código ni tiempo transcurrido. Cada tarea tiene un peso fijo dentro del alcance de la beta y una estimación de terminación documentada con evidencia. Fórmula:

`Progreso = suma(peso de fase × porcentaje de terminación de esa fase) / 100`

Los porcentajes parciales son juicio técnico de alcance restante, no resultados de pruebas. La evidencia de pruebas se registra por separado en `ESTADO_ACTUAL.md`.

| Tarea | Peso beta | Terminación estimada | Contribución |
|---|---:|---:|---:|
| BIMG-001 · Dirección técnica y continuidad | 4% | 100% · DONE | 4,0 |
| BIMG-002 · Auditoría de base existente | 8% | 100% · DONE | 8,0 |
| BIMG-003 · Shell web y build reproducible | 12% | 90% · PARTIAL | 10,8 |
| BIMG-004 · Servicio local y conexión UI/API | 12% | 90% · PARTIAL | 10,8 |
| BIMG-005 · Editor completo por categorías | 18% | 70% · PARTIAL | 12,6 |
| BIMG-006 · Ampliación modular del catálogo | 15% | 24% · PARTIAL | 3,6 |
| BIMG-007 · Biblioteca visual local | 12% | 0% · NOT_STARTED | 0,0 |
| BIMG-008 · Intake de assets en la interfaz web | 8% | 0% · NOT_STARTED | 0,0 |
| BIMG-009 · QA físico de navegador/Windows y rendimiento | 6% | 0% · NOT_STARTED | 0,0 |
| BIMG-010 · Empaquetar y validar beta local | 5% | 0% · NOT_STARTED | 0,0 |
| **Total ponderado** | **100%** | | **49,8 / 100 → 50%** |

BIMG-011, la investigación de generación neuronal local, es opcional y posterior a la beta; no se incluye en este denominador porque la beta no depende de generar píxeles.

## Evidencia más reciente

- Lockfile generado por npm y versionado en `web/package-lock.json` (lockfileVersion 3).
- CI #65: PASS_REAL en `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; instalación reproducible con `npm ci`, build React/TypeScript y validaciones Python pasan.
- Ejecución npm reproducible: https://github.com/jonhararagi/botimagen/actions/runs/37920504103
- Editor web: 46 campos para 46 categorías y 8 pestañas. CI #82 prueba cobertura exacta, motor, prompts, `npm ci` y build: https://github.com/jonhararagi/botimagen/actions/runs/37921734995
- CI #86: PASS_REAL; test de compatibilidad AUTO de escamas entre humana/dracónica con 12 semillas y coherencia reducida: https://github.com/jonhararagi/botimagen/actions/runs/37921964365
- CI #93: PASS_REAL; duplicación de perfil conserva el original, genera UUID distinto y crea segunda entrada en biblioteca. Pruebas del motor/API, cobertura de 46 campos, `npm ci` y build pasan: https://github.com/jonhararagi/botimagen/actions/runs/37922321639
- Smoke test de navegador real y prueba física en Windows: **NOT_RUN**.
- Mejora del motor, **CI #99 PASS_REAL**: el prompt ya no menciona color de escamas cuando el patrón está fijado en `no_visible_scales`; prueba de regresión verde. https://github.com/jonhararagi/botimagen/actions/runs/37924780083.
- Mejora de sincronización UI, **CI #100 PASS_REAL**: guardar/copiar/exportar se bloquea con cambios pendientes hasta regenerar; se comparan perfiles antiguos al cargarlos y los controles se bloquean durante generación. `tests/test_web_field_coverage.py` cubre el contrato estático. https://github.com/jonhararagi/botimagen/actions/runs/37925030261.
- Ambas son correcciones de calidad, no cierre de fases ni evidencia de navegador. Progreso sin cambio: **49,2 / 100 → 49%**.
- Ampliación de regiones de escamas, **CI #102 PASS_REAL**: catálogo v6, cuatro nuevas regiones y pruebas de prompt manual para cada una; AUTO cubre las 10 especies con 12 semillas (120 combinaciones). https://github.com/jonhararagi/botimagen/actions/runs/37925309773.
- Esta ampliación sí aumenta la terminación estimada de BIMG-006 del 20% al 24%. Total actualizado: **49,8 / 100 → 50%**. Navegador físico/Windows sigue **NOT_RUN**.


## Nota de continuidad · 2026-10-09

Se añadió el protocolo de investigación comparativa en `cerebro/INSTRUCCIONES.md` y `cerebro/INVESTIGACION_COMPARATIVA.md`. Esta entrega cierra la reproducibilidad de dependencias web: `web/package-lock.json` se generó desde npm y CI valida `npm ci`. La reproducibilidad web elevó el total a 33,6/100. La expansión del editor a 46 controles actualizó BIMG-005 a 60%. El primer bloque modular añadió seis categorías de rasgo en catálogo, motor, prompt, UI y pruebas, llevando BIMG-006 inicialmente a 20%. La duplicación local quedó implementada y probada, llevando BIMG-005 a 70%. Ese checkpoint era **49,2 / 100 → 49%**. El catálogo v6 amplía cuatro regiones de escamas y refuerza compatibilidad multi-especie, actualizando el checkpoint actual a **49,8 / 100 → 50%**. Browser/Windows continúan `NOT_RUN`.

## Siguiente trabajo que más reduce el riesgo

1. Ampliar regiones y compatibilidad de cabello, gradientes y detalles por especie.
2. Añadir tests de interacción visual para fijar/desfijar, generar, cargar y duplicar perfiles; la prueba contractual actual es estática.
3. Realizar smoke test real de navegador y después prueba física en Windows.

Actualizar este archivo al finalizar cada tarea. Los pesos no deben cambiarse para aparentar avance; solo revisarlos si cambia de forma aprobada el alcance de la beta, documentando la razón.
