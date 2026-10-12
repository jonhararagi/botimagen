# BOTIMAGEN — Auditoría de baseline (2026-10-10)

## Alcance y fuente de verdad

Auditoría documental de solo lectura sobre GitHub. La rama `main` es la fuente de verdad; no se modificó `main`.

- Repositorio: https://github.com/jonhararagi/botimagen
- Rama por defecto: `main`
- HEAD observado: `57fe81ac1597076bcf0bb6b185d5640861a6eee1`
- Último commit observado: `docs: checkpoint restore-example and responsive editor E2E`
- CI observada: [Validate BotImagen #191](https://github.com/jonhararagi/botimagen/actions/runs/38022284137), resultado `success`, sobre el mismo SHA.
- PR abiertos observados: 0.
- Issues abiertos observados: 0.

Esta auditoría no reemplaza una revisión local de todos los módulos ni una prueba manual en Windows.

## Arquitectura observada

- Aplicación de escritorio Python/Tkinter en `app.py`.
- Motor de personajes y reglas en `character_generator.py` y `character_rules.json`.
- API local en `botimagen_server.py`, basada en la biblioteca estándar `http.server`, configurada para escuchar en `127.0.0.1:8765`.
- Editor web React + TypeScript + Vite en `web/`.
- Contrato de assets y prompts de producción en `assets_manifest.json`.
- Pruebas Python en `tests/` y smoke test de navegador en `web/browser_smoke.mjs`.
- CI en `.github/workflows/validate.yml`.

## Evidencia CI

El workflow #191 completó con éxito estos pasos: sintaxis Python, validación del manifiesto, pruebas del generador, reproducibilidad por semilla, contrato de estilo, API local, cobertura de campos del editor, instalación npm, build TypeScript/Vite e integración smoke en Chromium headless.

Esto demuestra que esos pasos pasaron en el runner Linux para el SHA indicado. **No** demuestra que se haya hecho una prueba física/manual en Windows ni que la aplicación esté empaquetada como producto de escritorio final.

## Riesgos y brechas priorizadas

### P0 — Decisión de licencia del repositorio

La metadata de GitHub no declara una licencia y no se encontró un archivo raíz `LICENSE` en el árbol auditado. No asumir que el código o los assets de terceros pueden copiarse. Antes de importar recursos externos, registrar titular, URL de origen, licencia, atribución requerida, modificaciones y compatibilidad con el uso previsto. El uso personal/no comercial no elimina por sí solo restricciones de copyright.

**Decisión pendiente del titular:** elegir y añadir una licencia para el código propio, si desea conceder permisos de reutilización. Esta auditoría no selecciona una licencia legal por él.

### P1 — Entrega de producto

La ficha de continuidad identifica como pendientes una prueba manual en Chrome/Edge sobre Windows, un launcher de producción integrado, una biblioteca de referencias avanzada, comparación de variantes, intake web de assets y empaquetado de escritorio. Confirmar cada elemento contra el estado real antes de marcarlo terminado.

### P1 — Seguridad operativa

Mantener la API enlazada a loopback mientras no exista autenticación y un modelo de seguridad para acceso remoto. Antes de exponerla fuera del equipo, revisar autenticación, CORS/orígenes, límites de frecuencia, tamaño de archivos, rutas y tratamiento de errores.

### P2 — Mantenibilidad

Conservar la CI actual y añadir pruebas específicas al cambiar comportamiento. Para cambios de backend, cubrir entradas inválidas y límites de payload; para el editor, cubrir restauración de estado, perfiles y accesibilidad; para el empaquetado, verificar instalación limpia y arranque/cierre.

## Siguiente secuencia recomendada

1. Resolver la política de licencia del código propio y el procedimiento de revisión de licencias de assets.
2. Ejecutar y registrar una prueba manual en Windows (arranque, generación, guardar/cargar perfil, cierre y logs).
3. Cerrar el camino de distribución: launcher único de producción y empaquetado reproducible.
4. Implementar la biblioteca de referencias y comparación de variantes con pruebas y migración de datos explícitas.
5. Mantener el estado GREEN ligado a SHA y ejecuciones verificables; separar CI Linux de pruebas manuales de Windows.

## Estado de esta tarea

- [x] Leer metadata, árbol, commits recientes, workflow y ejecución CI actual.
- [x] Registrar baseline y riesgos documentales.
- [x] Preparar la auditoría en una rama separada para revisión.
- [ ] Revisión/merge del PR.
- [ ] Prueba manual de Windows (fuera del alcance de esta auditoría).
- [ ] Decisión de licencia por parte del titular.

No se incorporaron código, imágenes, textos ni otros assets de terceros en esta tarea.
