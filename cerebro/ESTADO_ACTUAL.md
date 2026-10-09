# Estado de continuidad · BotImagen

Última actualización de esta ficha: duplicación de perfiles locales, API testada y CI verde, 2026-10-09.

## Repositorio

- HEAD BEFORE de la tarea de perfiles locales: `1a66b8eda4d6d43046973750418b4a3719f6fc09`.
- Último commit funcional de interfaz anterior: `509eb98e2c3fb13134aa23573749f18a1c7d8270`.
- HEAD de implementación/pruebas verificado: `f8f214cab17a1b3dbca1cfd67434b5e033a12b5d` (botón de duplicación de perfiles y estado de UI corregido). Este checkpoint documental añade commits posteriores; consultar `main` antes de retomar.
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
- Catálogo actual v7: 47 categorías y 11 opciones de patrón/región de escamas. El color de puntas de cabello es independiente del patrón de distribución, del color secundario y de las zonas de raíces/coronilla/interior.

## Evidencia previa disponible

- La búsqueda de commits de GitHub devolvió HEAD 0a23a7136632d4e66ecee5f871ea40a47ea324e4 como el commit más reciente visible al comenzar este trabajo.
- La ejecución de GitHub Actions 37880305833 (run #54), asociada al commit 33de0c8fd08448e2767a6fa9fb0efe52895a7d6e, finalizó SUCCESS. Pasaron validación de sintaxis Python, manifiesto de assets, tests del generador y contrato de estilo: https://github.com/jonhararagi/botimagen/actions/runs/37880305833.
- La CI cubre las validaciones automatizadas configuradas; no ejecuta una prueba real de interfaz en Windows.
- La interfaz Tkinter no se consideraba probada físicamente en Windows. La migración no debe convertir esa ausencia de evidencia en una afirmación de funcionamiento web o Windows.
- Auditoría BIMG-002 (histórica, anterior al puente BIMG-004): `CharacterGenerator.generate()` acepta elecciones, `seed` y `coherence`; devuelve `profile`, `prompt`, `negative_prompt`, `seed`, `coherence`, estilo y justificación. La UI web actual sí usa el puente HTTP local descrito en la siguiente sección.
- GitHub Actions run #55 del HEAD anterior terminó SUCCESS: https://github.com/jonhararagi/botimagen/actions/runs/37880345143. Pasaron sintaxis Python, manifiesto, tests del generador y contrato de estilo. No es una prueba de Windows.

## Implementación web y API local

- `web/` contiene React + TypeScript + Vite con editor adaptable de 8 pestañas: identidad, cuerpo, anatomía, cara, cabello, vestuario, combate y detalle. Las 47 categorías actuales del catálogo tienen un control individual.
- Los selectores cargan opciones mediante `GET /api/catalog`; las listas provienen de `character_rules.json`, no de una copia de opciones en TypeScript.
- El botón de generar llama a `POST /api/generate` y reutiliza `CharacterGenerator`; respeta IDs manuales, AUTO, semilla y coherencia, y devuelve prompt/negative prompt oficiales.
- `botimagen_server.py` utiliza `http.server` de la biblioteca estándar, escucha solo en `127.0.0.1:8765`, limita el cuerpo JSON, valida campos contra el catálogo y no expone rutas de archivos arbitrarias.
- Endpoints de perfiles: `POST /api/profiles` guarda atómicamente bajo `generated_characters/web_profiles/`; `GET /api/profiles` lista; `GET /api/profiles/{uuid}` recupera. La UI permite guardar, listar, cargar y duplicar perfiles. La duplicación recupera el perfil completo y crea un nuevo registro por `POST /api/profiles`, con UUID nuevo y sin mutar el original. CI prueba esa propiedad; el smoke test real del navegador y la prueba física Windows siguen `NOT_RUN`.
- La silueta SVG central es un marcador temporal de interfaz, no una ilustración generada.
- Vite redirige `/api` al motor local en desarrollo. La interfaz de producción servida desde un único launcher aún está pendiente.

## Todavía NO implementado

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
- BIMG-003: PARTIAL (~90%). UI React/TypeScript y proxy local; `web/package-lock.json` versionado. CI #65 valida `npm ci` y el build. La prueba real de navegador/Windows no se ha ejecutado.
- BIMG-005: PARTIAL (~70%). Editor expandido a 46 categorías y 8 pestañas; guarda, lista, carga y duplica perfiles de forma independiente. CI #93 prueba API, motor, cobertura del editor, `npm ci` y build. QA real e interacciones visuales completas pendientes.
- BIMG-006: PARTIAL (~30%). Catálogo v7 contiene 47 categorías: añade `hair_tip_color` con 12 opciones y convierte `hair_color_pattern` en un control de distribución/transición sin imponer color fijo en las puntas. Las pruebas compuestas verifican patrón, color secundario, puntas, raíces, coronilla e interior como decisiones independientes.
- BIMG-004: PARTIAL (~90%). API de catálogo/generación/perfiles y controles UI para listar/cargar integrados; smoke test físico pendiente.
- Evidencia CI #65: PASS_REAL en commit `ee2eb8a2db0c72b969aadc8e9cfc116b74c4a48b`; `npm ci` y `npm run build` pasan: https://github.com/jonhararagi/botimagen/actions/runs/37920504103.
- Evidencia CI #75: PASS_REAL para la UI previa de 40 campos y cobertura de categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921018803.
- Evidencia CI #82: PASS_REAL para la primera integración de rasgos y cobertura de 46 categorías: https://github.com/jonhararagi/botimagen/actions/runs/37921734995.
- Evidencia CI #86: PASS_REAL en commit `6e2a0c64b239cb12ba07a0a42b534d898afeb327`; se prueban 12 semillas con AUTO para especie humana y dracónica: https://github.com/jonhararagi/botimagen/actions/runs/37921964365.
- Evidencia CI #93: PASS_REAL en commit `f8f214cab17a1b3dbca1cfd67434b5e033a12b5d`; duplicación API con UUID independiente, original intacto, cobertura del editor, pruebas del motor, `npm ci` y compilación: https://github.com/jonhararagi/botimagen/actions/runs/37922321639.
- Runtime en navegador/Windows: NOT_RUN.
- Progreso total ponderado hacia la beta local: 49%, calculado en `cerebro/PROGRESO.md` (49,2/100 sin redondear).

## Última ampliación capilar · catálogo v7

- El catálogo subió de v6 a v7 y de 46 a 47 categorías al añadir `hair_tip_color` con 12 opciones.
- `hair_color_pattern` ahora define distribución/transición, no una tonalidad fija para las puntas. El ID `puntas_doradas` permanece estable por compatibilidad, pero su etiqueta pasó a «Degradado localizado en puntas» y el prompt consume el color de puntas independiente.
- El prompt controla raíces, coronilla, interior y puntas por separado. Se añadió una instrucción para no imponer oro o plata salvo elección explícita.
- El test de composición combina pelo base esmeralda, patrón de puntas, acento dorado y color de puntas controlado explícitamente, validando el nuevo contrato.
- **CI #107: PASS_REAL** para generador, contrato visual, API, cobertura del editor, `npm ci` y build: https://github.com/jonhararagi/botimagen/actions/runs/37926064467.
- TIMER: 1–2 horas estimadas incluyendo ajuste de la prueba anterior. BIMG-006 sube de 24% a 30%; total ponderado **50,7 / 100 → 51%**. Prueba real de navegador/Windows continúa `NOT_RUN`.

## Última ampliación del catálogo

- `character_rules.json` pasó de versión 5 a 6, manteniendo 46 categorías para no romper el contrato UI.
- `scale_pattern` ahora tiene 11 opciones totales, incluido `no_visible_scales`, con cuatro regiones nuevas: `dorsal_hand_scales`, `outer_thigh_scales`, `nape_spine_scales` y `jawline_scales`.
- La compatibilidad AUTO se comprobó para las 10 especies con 12 semillas por especie: dracónica recibe regiones visibles y las demás conservan el patrón sin escamas visibles bajo la política actual.
- Pruebas manuales fijan cada una de las cuatro nuevas regiones y verifican su fragmento de prompt junto al color elegido.
- **CI #102: PASS_REAL**: https://github.com/jonhararagi/botimagen/actions/runs/37925309773.
- TIMER de trabajo estimado: 45–75 minutos. BIMG-006 sube de 20% a 24%; progreso recalculado a **49,8 / 100 → 50%**. QA física de navegador/Windows sigue `NOT_RUN`.
## Última mejora de calidad del motor

- Se detectó que el prompt incluía siempre el color de escamas aunque `scale_pattern=no_visible_scales`. La instrucción general de no dibujarlas entraba en conflicto con ese token de color.
- Corrección aplicada en `character_generator.py`: el prompt solo añade el color cuando el patrón permite escamas visibles. El perfil conserva el color seleccionado, así que el usuario no pierde su preferencia si luego cambia el patrón.
- Prueba de regresión añadida a `tests/test_character_generator.py` para garantizar que el perfil conserva el color pero el prompt no pide escamas coloreadas con el patrón invisible.
- **CI #99: PASS_REAL**, incluyendo pruebas de generador/API y compilación web: https://github.com/jonhararagi/botimagen/actions/runs/37924780083.
- TIMER de la corrección: 30–60 minutos estimados. No cambia el porcentaje global por sí sola.

## Última mejora de calidad de interfaz

- Se detectó que la UI podía guardar/exportar una combinación editada junto a un `generated` antiguo, haciendo que los rasgos elegidos y el prompt se contradijeran.
- `web/src/App.tsx` mantiene ahora un estado explícito de cambios pendientes. Editar rasgos, cambiar FIJO/AUTO, semilla o coherencia invalida el snapshot previo; guardar, copiar prompt y exportar quedan bloqueados hasta regenerar.
- Los controles de edición/carga/restauración también se bloquean mientras el generador está trabajando para evitar carreras con la respuesta asíncrona.
- Al cargar perfiles antiguos, la UI compara selecciones fijadas con el perfil generado y exige regeneración si detecta inconsistencia.
- `tests/test_web_field_coverage.py` valida estáticamente estos guardarraíles y conserva la comprobación de las 47 categorías/8 pestañas. Es cobertura de contrato fuente, no sustituye el test de navegador.
- **CI #100: PASS_REAL**, con pruebas Python, contrato de editor, `npm ci` y build React/TypeScript: https://github.com/jonhararagi/botimagen/actions/runs/37925030261.
- TIMER de la mejora: 30–60 minutos estimados. El total ponderado sigue siendo **49,2 / 100 → 49%** porque la QA real en navegador/Windows sigue pendiente.

## Investigación comparativa: regla permanente

La investigación de aplicaciones y proyectos similares queda integrada al protocolo de Cerebro. Objetivo: aprender arquitectura, patrones de UX, rendimiento, errores habituales, causas raíz, soluciones y lecciones de mantenimiento, y convertirlas en decisiones verificables para BotImagen, sin copiar identidad, código o activos ajenos.

- Método, límites de uso, registro de fuentes y plantilla: [`cerebro/INVESTIGACION_COMPARATIVA.md`](INVESTIGACION_COMPARATIVA.md).
- El protocolo compara soluciones y registra evidencia, sin copiar activos propietarios. En la tarea de rasgos actual no se hizo búsqueda externa porque se resolvió mediante contratos y código existentes; la consulta comparativa queda `NOT_RUN` para este incremento.

## Próxima acción exacta

1. **BIMG-006 · Cabello modular:** separar y probar mejor puntas, mechones, reflejos y transiciones de color sin multiplicar presets completos.
2. **BIMG-005 · Interacciones:** ampliar la validación de los estados FIJO/AUTO, generación, guardado, carga y duplicación. El contrato estático actual no sustituye un test de navegador.
3. **BIMG-009 · QA real:** ejecutar smoke test en Chrome/Edge y una prueba física en Windows cuando el equipo esté disponible. Mantener `NOT_RUN` hasta ejecutar; CI Linux no equivale a prueba en el PC del usuario.
4. Cerrar BIMG-003/BIMG-004 solo después de completar los criterios funcionales y el QA que les corresponda.

Actualizar esta ficha al final de cada tarea con HEAD BEFORE/AFTER, commit, archivos, pruebas y estado por evidencia. No borrar historial útil: mover la información obsoleta a una nota histórica fechada cuando haga falta.
