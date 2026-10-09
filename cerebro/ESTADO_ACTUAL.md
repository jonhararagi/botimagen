# Estado de continuidad · BotImagen

Última actualización de esta ficha: 2026-10-09, al iniciar la migración web-first.

## Repositorio

- Repositorio: jonhararagi/botimagen
- Rama principal: main
- HEAD BEFORE de esta entrega: 0a23a7136632d4e66ecee5f871ea40a47ea324e4
- Commit base: test: fix visual catalog test execution order
- Árbol del commit base: a9a2f79ca0da4af637bf6e21519d3ccf76fc720a

El HEAD debe volver a consultarse en GitHub antes de iniciar la próxima tarea. El commit que incorpora esta carpeta debe registrarse después en el reporte de entrega.

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
- En la continuidad previa del proyecto, la ejecución de GitHub Actions 37868974765 (run #53) figura como SUCCESS con validación de sintaxis, manifiesto, generador y contrato de estilo. Debe confirmarse la ejecución asociada a este commit documental antes de declarar las pruebas actuales PASS.
- La interfaz Tkinter no se consideraba probada físicamente en Windows. La migración no debe convertir esa ausencia de evidencia en una afirmación de funcionamiento web o Windows.

## Todavía NO implementado

- Interfaz web TypeScript/React/Vite.
- Servicio HTTP local y contrato estable entre interfaz y motor.
- Biblioteca de referencias avanzada con SQLite, miniaturas, filtros y metadatos.
- Comparación lado a lado de variantes.
- Integración de generación de imágenes local.
- Interfaz remota con acceso desde otras máquinas.
- Empaquetado de escritorio con Tauri/Electron.
- Prueba completa de la nueva aplicación en Chrome/Edge y Windows físico.

## Estado de la entrega actual

- BIMG-001: la documentación de dirección técnica se está incorporando en esta entrega.
- BIMG-002: NEXT, auditar y ejecutar las pruebas del baseline actual.
- Evidencia de runtime de la nueva interfaz: NOT_RUN, porque la interfaz todavía no existe.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.
