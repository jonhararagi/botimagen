# Estado de continuidad · BotImagen

Última actualización de esta ficha: cierre BIMG-002 y spike web inicial, 2026-10-09.

## Repositorio

- HEAD BEFORE de la entrega de código: 65d883824c90c3bc4637a0584ef3796c599f1aef
- La sesión actual añade el spike web y registra la auditoría. Commit funcional: `787be57d0b224f4d9c0d6a07a0c09b17750a87f8`. Para la continuidad, consulta siempre el HEAD real de `main`, que puede incluir commits posteriores de documentación.

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

## Implementación web inicial

- `web/` contiene React + TypeScript + Vite y una interfaz adaptable para escritorio/ventanas estrechas.
- Incluye controles de ejemplo basados en IDs y etiquetas que existen en `character_rules.json`: especie, altura, constitución, proporciones, color base/patrón/color secundario del cabello, color de ojos, pupila y pose.
- Incluye FIJO/AUTO, selección demostrativa a partir de semilla, vista de prompt de muestra, copia, exportación JSON y guardado temporal en `localStorage`.
- La silueta SVG central es un marcador temporal de interfaz, no una ilustración generada.
- `web/README.md` describe comandos y límites. La CI se amplía para compilar el frontend.

## Todavía NO implementado

- Catálogo web cargado en tiempo de ejecución desde el motor: el subconjunto de `web/src/App.tsx` está copiado temporalmente.
- Servicio HTTP local y contrato estable entre interfaz y motor.
- Biblioteca de referencias avanzada con SQLite, miniaturas, filtros y metadatos.
- Comparación lado a lado de variantes.
- Integración de generación de imágenes local.
- Interfaz remota con acceso desde otras máquinas.
- Empaquetado de escritorio con Tauri/Electron.
- Prueba completa de la nueva aplicación en Chrome/Edge y Windows físico.

## Estado de la entrega actual

- BIMG-001: DONE. Continuidad inicial guardada en commit 33de0c8fd08448e2767a6fa9fb0efe52895a7d6e.
- BIMG-002: DONE. Auditoría por fuente y CI; runtime físico Windows: NOT_RUN.
- BIMG-003: PARTIAL. Shell web creada y build de CI PASS en el run #56. Faltan `package-lock.json` y smoke test real de navegador/Windows.
- BIMG-004: NEXT después de cerrar los pendientes de BIMG-003: API local segura que entregue al frontend el catálogo auténtico y reutilice `CharacterGenerator`.
- Evidencia del build web: PASS_REAL en GitHub Actions run #56, commit de código `787be57d0b224f4d9c0d6a07a0c09b17750a87f8`: https://github.com/jonhararagi/botimagen/actions/runs/37882017431. Pasaron las pruebas Python, instalación de dependencias y `npm run build`.
- Evidencia de runtime del prototipo web en navegador/Windows: NOT_RUN.

## Próxima acción exacta

1. Consultar el HEAD y la CI reales de `main`.
2. Generar y guardar `web/package-lock.json` para instalaciones reproducibles.
3. Hacer un smoke test real en Chrome/Edge; probar Windows cuando el entorno esté disponible. Hasta entonces, mantenerlo como NOT_RUN.
4. Al cumplir esos pasos, marcar BIMG-003 DONE y comenzar BIMG-004: servicio local con catálogo servido desde Python, validación estricta, tests de contrato y reutilización del motor actual.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.
