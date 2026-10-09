# Progreso global de BotImagen

**Último cálculo:** 2026-10-09  
**Objetivo medido:** beta local-first web en Windows, no el producto final con funciones opcionales futuras.  
**Progreso global actual: 31%**

El porcentaje usa puntos ponderados por fase. No se calcula por cantidad de archivos, líneas de código ni tiempo transcurrido. Cada tarea tiene un peso fijo dentro del alcance de la beta y una estimación de terminación documentada con evidencia. Fórmula:

`Progreso = suma(peso de fase × porcentaje de terminación de esa fase) / 100`

Los porcentajes parciales son juicio técnico de alcance restante, no resultados de pruebas. La evidencia de pruebas se registra por separado en `ESTADO_ACTUAL.md`.

| Tarea | Peso beta | Terminación estimada | Contribución |
|---|---:|---:|---:|
| BIMG-001 · Dirección técnica y continuidad | 4% | 100% · DONE | 4,0 |
| BIMG-002 · Auditoría de base existente | 8% | 100% · DONE | 8,0 |
| BIMG-003 · Shell web y build reproducible | 12% | 75% · PARTIAL | 9,0 |
| BIMG-004 · Servicio local y conexión UI/API | 12% | 80% · PARTIAL | 9,6 |
| BIMG-005 · Editor completo por categorías | 18% | 0% · NOT_STARTED | 0,0 |
| BIMG-006 · Ampliación modular del catálogo | 15% | 0% · NOT_STARTED | 0,0 |
| BIMG-007 · Biblioteca visual local | 12% | 0% · NOT_STARTED | 0,0 |
| BIMG-008 · Intake de assets en la interfaz web | 8% | 0% · NOT_STARTED | 0,0 |
| BIMG-009 · QA físico de navegador/Windows y rendimiento | 6% | 0% · NOT_STARTED | 0,0 |
| BIMG-010 · Empaquetar y validar beta local | 5% | 0% · NOT_STARTED | 0,0 |
| **Total ponderado** | **100%** | | **30,6 / 100 → 31%** |

BIMG-011, la investigación de generación neuronal local, es opcional y posterior a la beta; no se incluye en este denominador porque la beta no depende de generar píxeles.

## Evidencia más reciente

- Código: commit `b9612adf25ef25dd6f3fdcaf5cfefdba126b6e59`.
- CI #58: PASS en validaciones Python, manifiesto, generador, API local, instalación web y compilación React/TypeScript.
- Ejecución: https://github.com/jonhararagi/botimagen/actions/runs/37887532209
- Smoke test de navegador real y prueba física en Windows: **NOT_RUN**.

## Siguiente trabajo que más reduce el riesgo

1. Generar y versionar `web/package-lock.json`.
2. Añadir controles de listar/cargar perfiles a la UI; los endpoints de listado y lectura ya existen.
3. Realizar una prueba de navegador y después una prueba física en Windows.
4. Ampliar las categorías que hacen falta para el diseño completo: busto, escamas, regiones de color de cabello y más controles de pose.

Actualizar este archivo al finalizar cada tarea. Los pesos no deben cambiarse para aparentar avance; solo revisarlos si cambia de forma aprobada el alcance de la beta, documentando la razón.
