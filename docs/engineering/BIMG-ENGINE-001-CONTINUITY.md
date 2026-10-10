# BIMG-ENGINE-001 · Continuidad de implementación

## Baseline verificado

- Repositorio: `jonhararagi/botimagen`.
- Base remota usada: `main` en `46bc7e702ae5d608927345991b5c4f0a661318a9`.
- Rama creada desde ese SHA: `feature/bimg-engine-001-cyberstreet-visual-renderer`.
- Los PR #8, #9 y #10 se mantienen separados. No se trabajó en sus ramas.
- No se modificó `main`.

## Trabajo incorporado en esta rama

- Renderizador SVG original y receta visual v2 con migración v1 determinista.
- Style Lab para Anime, Toon, equilibrio Streetwear/Cyberpunk y densidad de detalle.
- NanoWear: `everyday`, `nanoweave`, `transformation`; acabados textil, técnico y sintético, colores base/panel/acento y patrones `plain`, `circuit`, `geometric`, `gradient`.
- Chromapatch con cinco símbolos, color, ubicación, modo de contraste y vista frontal/trasera.
- Integración de la receta con generación Python y contrato API opcional retrocompatible.
- Pruebas Python nuevas y smoke test Chromium ampliado para paleta, patrón, transformación y persistencia v2.
- Mapeos SVG diferenciados para los diez IDs oficiales de `outfit`, `outer_layer` y `footwear`; `none` no añade capa exterior.
- Documentación técnica y README web actualizados.

## Evidencia verificada y pendiente

- GitHub Actions `Validate BotImagen` [run 38051068349](https://github.com/jonhararagi/botimagen/actions/runs/38051068349): **SUCCESS**.
- Pasaron `py_compile`, las pruebas Python existentes, el nuevo contrato `visual_recipe`, `npm ci`, `npm run build` y el smoke test de Chromium headless que cubre Style Lab, NanoWear, Chromapatch, contraste automático, vista trasera y persistencia de receta.
- No se ejecutaron pruebas locales porque el entorno no pudo resolver `github.com` al clonar el repositorio.
- La prueba física de Chrome/Edge en Windows sigue pendiente. El resultado CI permite registrar la validación automatizada, pero no afirma una verificación física ni completa de la calidad artística.

## Preservación

No añadir recursos de terceros ni dependencias npm. No modificar el catálogo de rasgos, reglas de afinidad, semilla ni campos manuales/AUTO salvo que un fallo concreto lo exija. Mantener la API local loopback. No fusionar el PR automáticamente. Los próximos estilos Pixel Art y Anime 3D deben conservar pipelines separados del renderizador CyberStreet.


## BIMG-ENGINE-002 · Estado de la ampliación

- Receta normalizada `schema_version: 2`; API acepta v1 y v2 y migra v1 en memoria con defaults deterministas.
- Chromapatch auto calcula tono complementario desde el color base real de nanotela, busca contraste ≥3:1 y mantiene el color manual cuando corresponde.
- El renderizador usa `useId` para evitar colisiones de IDs SVG entre instancias.
- Pendiente hasta completar CI: validar resultado del smoke Chromium sobre el HEAD final, comprobar la migración/persistencia real y actualizar la descripción del PR #11.
- Windows Chrome/Edge manual: pendiente, no sustituido por CI Linux.
