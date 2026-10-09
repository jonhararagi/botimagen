# Estado de continuidad · BotImagen

Última actualización de esta ficha: panel de perfiles local y progreso ponderado, 2026-10-09.

## Repositorio

- HEAD BEFORE de la tarea de perfiles locales: `1a66b8eda4d6d43046973750418b4a3719f6fc09`.
- Último commit funcional: `509eb98e2c3fb13134aa23573749f18a1c7d8270`.
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
- El catálogo de rasgos contiene especies y anatomía combinable, campos de cabello separados, altura exacta y opciones de proporción/rostro según la versión vigente de las reglas.

## Evidencia previa disponible

- La búsqueda de commits de GitHub devolvió HEAD 0a23a7136632d4e66ecee5f871ea40a47ea324e4 como el commit más reciente visible al comenzar este trabajo.
- La ejecución de GitHub Actions 37880305833 (run #54), asociada al commit 33de0c8fd08448e2767a6fa9fb0efe52895a7d6e, finalizó SUCCESS. Pasaron validación de sintaxis Python, manifiesto de assets, tests del generador y contrato de estilo: https://github.com/jonhararagi/botimagen/actions/runs/37880305833.
- La CI cubre las validaciones automatizadas configuradas; no ejecuta una prueba real de interfaz en Windows.
- La interfaz Tkinter no se consideraba probada físicamente en Windows. La migración no debe convertir esa ausencia de evidencia en una afirmación de funcionamiento web o Windows.
- Auditoría BIMG-002: `CharacterGenerator.generate()` acepta elecciones, `seed` y `coherence`; devuelve `profile`, `prompt`, `negative_prompt`, `seed`, `coherence`, estilo y justificación. Carga reglas JSON y `visual_style_catalog.json`. `app.py` concentra el shell Tkinter y el flujo de intake; el motor es reutilizable, pero la UI aún no usa un servicio HTTP.
- GitHub Actions run #55 del HEAD anterior terminó SUCCESS: https://github.com/jonhararagi/botimagen/actions/runs/37880345143. Pasaron sintaxis Python, manifiesto, tests del generador y contrato de estilo. No es una prueba de Windows.

## Implementación web y API local

- `web/` contiene React + TypeScript + Vite con editor adaptable de 5 grupos: identidad, cuerpo, cabello, rostro y pose.
- Los selectores cargan opciones mediante `GET /api/catalog`; las listas provienen de `character_rules.json`, no de una copia de opciones en TypeScript.
- El botón de generar llama a `POST /api/generate` y reutiliza `CharacterGenerator`; respeta IDs manuales, AUTO, semilla y coherencia, y devuelve prompt/negative prompt oficiales.
- `botimagen_server.py` utiliza `http.server` de la biblioteca estándar, escucha solo en `127.0.0.1:8765`, limita el cuerpo JSON, valida campos contra el catálogo y no expone rutas de archivos arbitrarias.
- Endpoints de perfiles: `POST /api/profiles` guarda atomicamente bajo `generated_characters/web_profiles/`; `GET /api/profiles` lista; `GET /api/profiles/{uuid}` recupera. El frontend guarda; la lista/carga desde la UI aún está pendiente.
- La silueta SVG central es un marcador temporal de interfaz, no una ilustración generada.
- Vite redirige `/api` al motor local en desarrollo. La interfaz de producción servida desde un único launcher aún está pendiente.

## Todavía NO implementado

- `web/package-lock.json` para instalaciones reproducibles.
- Prueba real en Chrome/Edge y Windows.
- Biblioteca de referencias avanzada con SQLite, miniaturas, filtros y metadatos.
- Comparación lado a lado de variantes.
- Intake de assets migrado a la web.
- Integración de generación de imágenes local.
- Interfaz remota con acceso desde otras máquinas.
- Empaquetado de escritorio con Tauri/Electron.

## Estado de la entrega actual

- BIMG-001: DONE. Dirección inicial persistida en GitHub.
- BIMG-002: DONE. Auditoría de la base y CI completadas; prueba física Windows NOT_RUN.
- BIMG-003: PARTIAL (~75%). UI React/TypeScript, proxy local y build CI disponibles; faltan lockfile y smoke test de navegador/Windows.
- BIMG-004: PARTIAL (~90%). API de catálogo/generación/perfiles y controles UI para listar/cargar integrados; smoke test físico pendiente.
- Evidencia CI #60: PASS_REAL en commit `509eb98e2c3fb13134aa23573749f18a1c7d8270`: https://github.com/jonhararagi/botimagen/actions/runs/37887835609.
- Runtime en navegador/Windows: NOT_RUN.
- Progreso total ponderado hacia la beta local: 32%, calculado en `cerebro/PROGRESO.md`.

## Próxima acción exacta

1. Consultar el HEAD actual y la CI.
2. Generar y guardar `web/package-lock.json` para instalaciones reproducibles.
3. Hacer un smoke test real en Chrome/Edge y una prueba física en Windows cuando el entorno esté disponible. Hasta entonces mantener runtime como NOT_RUN.
4. Cerrar BIMG-003/BIMG-004 solo cuando se cumplan sus criterios y, después, trabajar en los campos que faltan: tamaño del busto, escamas y zonas de color de cabello.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.
