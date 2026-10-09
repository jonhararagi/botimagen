# Progreso global de BotImagen

**Último cálculo:** 2026-10-09  
**Objetivo medido:** beta local-first web en Windows, no el producto final con funciones opcionales futuras.  
**Progreso global actual: 47%**

El porcentaje usa puntos ponderados por fase. No se calcula por cantidad de archivos, líneas de código ni tiempo transcurrido. Cada tarea tiene un peso fijo dentro del alcance de la beta y una estimación de terminación documentada con evidencia. Fórmula:

`Progreso = suma(peso de fase × porcentaje de terminación de esa fase) / 100`

Los porcentajes parciales son juicio técnico de alcance restante, no resultados de pruebas. La evidencia de pruebas se registra por separado en `ESTADO_ACTUAL.md`.

| Tarea | Peso beta | Terminación estimada | Contribución |
|---|---:|---:|---:|
| BIMG-001 · Dirección técnica y continuidad | 4% | 100% · DONE | 4,0 |
| BIMG-002 · Auditoría de base existente | 8% | 100% · DONE | 8,0 |
| BIMG-003 · Shell web y build reproducible | 12% | 90% · PARTIAL | 10,8 |
| BIMG-004 · Servicio local y conexión UI/API | 12% | 90% · PARTIAL | 10,8 |
| BIMG-005 · Editor completo por categorías | 18% | 60% · PARTIAL | 10,8 |
| BIMG-006 · Ampliación modular del catálogo | 15% | 20% · PARTIAL | 3,0 |
| BIMG-007 · Biblioteca visual local | 12% | 0% · NOT_STARTED | 0,0 |
| BIMG-008 · Intake de assets en la interfaz web | 8% | 0% · NOT_STARTED | 0,0 |
| BIMG-009 · QA físico de navegador/Windows y rendimiento | 6% | 0% · NOT_STARTED | 0,0 |
| BIMG-010 · Empaquetar y validar beta local | 5% | 0% · NOT_STARTED | 0,0 |
| **Total ponderado** | **100%** | | **47,4 / 100 → 47%** |

BIMG-011, la investigación de generación neuronal local, es opcional y posterior a la beta; no se incluye en este denominador porque la beta no depende de generar píxeles.

## Evidencia más reciente

- Lockfile generado por npm y versionado en `web/package-lock.json` (lockfileVersion 3).
- CI #65: PASS_REAL en `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; instalación reproducible con `npm ci`, build React/TypeScript y validaciones Python pasan.
- Ejecución npm reproducible: https://github.com/jonhararagi/botimagen/actions/runs/37920504103
- Editor web: 46 campos para 46 categorías y 8 pestañas. CI #82 prueba cobertura exacta, motor, prompts, `npm ci` y build: https://github.com/jonhararagi/botimagen/actions/runs/37921734995
- Smoke test de navegador real y prueba física en Windows: **NOT_RUN**.

## Nota de continuidad · 2026-10-09

Se añadió el protocolo de investigación comparativa en `cerebro/INSTRUCCIONES.md` y `cerebro/INVESTIGACION_COMPARATIVA.md`. Esta entrega cierra la reproducibilidad de dependencias web: `web/package-lock.json` se generó desde npm y CI valida `npm ci`. La reproducibilidad web elevó el total a 33,6/100. La expansión del editor a 46 controles actualizó BIMG-005 a 60%. El primer bloque modular añadió seis categorías en catálogo, motor, prompt, UI y pruebas, llevando BIMG-006 a 20%. Total actual: **47,4 / 100 → 47%**. Browser/Windows continúan `NOT_RUN`.

## Siguiente trabajo que más reduce el riesgo

1. Ampliar las pruebas de compatibilidad de escamas por especie y ejecución con múltiples semillas en AUTO.
2. Añadir duplicación de perfiles y mejorar el flujo de regeneración.
3. Realizar smoke test real de navegador y después prueba física en Windows.

Actualizar este archivo al finalizar cada tarea. Los pesos no deben cambiarse para aparentar avance; solo revisarlos si cambia de forma aprobada el alcance de la beta, documentando la razón.
