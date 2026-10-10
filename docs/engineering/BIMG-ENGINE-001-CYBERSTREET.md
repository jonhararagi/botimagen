# BIMG-ENGINE-001 · Motor visual CyberStreet

**Estado de implementación:** `PASS_CI_VALIDATION` para la compilación, las pruebas Python y el smoke test Chromium headless de la ejecución CI indicada abajo. La implementación usa geometría SVG original; no incorpora recursos binarios externos ni dependencias npm. La validación física en Windows sigue pendiente.

## Arquitectura

- `web/src/visual/VisualCharacterRenderer.tsx` define `VisualRecipe` v2, migración segura v1→v2, paleta de nanotela, patrones, composición SVG y controles Style Lab.
- `web/src/App.tsx` conecta el renderizador con las selecciones del generador actual. Los valores se leen de `generated.profile` cuando existe un resultado generado, y se usan las selecciones del formulario como fallback.
- `web/src/styles.css` contiene los controles adaptables del Style Lab.
- `character_generator.py` agrega la descripción de receta al prompt solo cuando se envía una receta visual.
- `botimagen_server.py` valida el contrato opcional `visual_recipe` y conserva compatibilidad con clientes antiguos que no lo envían.
- `tests/test_visual_recipe_contract.py` cubre validación de campos, prompt y retrocompatibilidad. `web/browser_smoke.mjs` cubre interacción, vista trasera, estados NanoWear y persistencia en el ciclo de perfiles.

## Receta visual v2

`visual_recipe` contiene `schema_version`, `family`, `anime_influence`, `toon_influence`, `streetwear_cyberpunk`, `detail_level`, `garment_base_color`, `garment_panel_color`, `garment_accent_color`, `fabric_pattern`, `nanowear_state`, `material_finish`, `emblem_shape`, `emblem_color`, `emblem_contrast`, `emblem_position` y `view`.

Valores admitidos:
- Familia: `cyberstreet`.
- Influencias y detalle: enteros 0–100.
- NanoWear: `everyday`, `nanoweave`, `transformation`.
- Acabado: `textile`, `nanoweave`, `synthetic`.
- Emblema: `bunny`, `star`, `fox`, `skull`, `geo`.
- Contraste: `auto`, `manual`; posición: `chest`, `sleeve`, `hood`; presentación: `front`, `back`.
- Colores base, paneles, acento y emblema: hexadecimal `#RRGGBB` validado. Patrones: `plain`, `circuit`, `geometric`, `gradient`.
- Las recetas v1 se normalizan a v2 con colores y patrón predeterminados deterministas. Los perfiles sin receta siguen recibiendo defaults en la interfaz; leerlos no escribe de vuelta ni altera el registro histórico.

Los perfiles antiguos que no tengan receta reciben valores predeterminados seguros en la interfaz. Guardar y duplicar persiste la receta en el bloque del perfil; duplicar utiliza la copia completa que ya proporciona la API y genera un registro independiente.

## Efectos visuales implementados

- Silueta frontal/trasera estilizada, rostro, ojos, cabello, torso, mangas y calzado.
- El renderizador usa identificadores actuales de pelo, ojos, piel, orejas, cuernos, expresión y detalle facial cuando hay una correspondencia sencilla; el resto se representa de forma neutral.
- Los cuatro controles del Style Lab modifican proporciones de rasgos, grosor de contorno, acentos tecnológicos o densidad de líneas.
- Los tres estados NanoWear y los tres acabados modifican brillo, paneles y costuras sin reemplazar los colores elegidos.
- Style Lab controla color base, panel secundario, acento tecnológico y patrón liso/circuitos/geométrico/degradado. Los cambios se aplican en SVG sin petición Python.
- Chromapatch automático rota 180° el tono HSL de la nanotela y ajusta saturación/luminosidad; elige un candidato con contraste relativo mínimo 3:1. Negro/blanco solo son candidatos de corrección final. El modo manual conserva el color y advierte cuando el contraste de muestra es menor que 3:1.
- Las definiciones SVG de gradientes y patrones usan IDs derivados de `useId`, evitando colisiones entre instancias.
- Chromapatch incluye cinco formas originales y permanece en la misma receta. En la vista trasera se coloca sobre la zona posterior del vestuario.
- El contraste automático usa luminancia relativa y el modo manual advierte cuando el contraste calculado queda por debajo de 3:1 sobre la zona de muestra.

## Límites conocidos

- Es un renderizador vectorial 2D, no un modelo 3D, rig ni ilustración final de acabado profesional.
- Se han añadido formas diferenciadas para las diez opciones actuales de `outfit`, las diez de `outer_layer` y las diez de `footwear`. Las siluetas son estilizadas y algunas comparten geometría base; `none` no dibuja capa exterior. La anatomía y la perspectiva trasera siguen siendo aproximaciones 2D.
- Los controles de estilo son parámetros discretos del renderizador; no son un generador arbitrario de ilustraciones.
- La vista posterior es una aproximación estilizada y no una anatomía 3D completa.
- El modo manual advierte del contraste bajo, pero no sustituye el color elegido por el usuario.
- No se incorpora VRoid, Kenney, Tiny RPG, imágenes externas ni IA como dependencia.
- La aplicación sigue usando el generador y la API Python existentes; no se crea un backend paralelo.

## Verificación

Las pruebas previstas para CI son:
1. `python -m py_compile` incluyendo `tests/test_visual_recipe_contract.py`.
2. Tests Python existentes y `python tests/test_visual_recipe_contract.py`.
3. `npm ci --no-audit --no-fund` y `npm run build` dentro de `web/`.
4. Smoke test de Chromium headless mediante `web/browser_smoke.mjs`, ampliado para los controles CyberStreet y la persistencia.

**Resultado verificado:** GitHub Actions `Validate BotImagen` [run 38051290737](https://github.com/jonhararagi/botimagen/actions/runs/38051290737) — `success` para BIMG-ENGINE-001. La CI de BIMG-ENGINE-002 debe registrarse después de completar el nuevo run. Completó `py_compile`, pruebas del generador, reproducibilidad, contrato visual, API local, cobertura del editor, nuevo contrato de receta, `npm ci`, `npm run build` y smoke test de Chromium. No se ejecutó una compilación local porque el entorno de trabajo no pudo resolver `github.com` para clonar el repositorio. Las pruebas físicas en Windows no se afirman ni se sustituyen por CI Linux.

## Próximos pasos

1. Confirmar CI del HEAD BIMG-ENGINE-002 y conservar la cobertura previa.
2. Revisar contraste y posición del Chromapatch en capturas de Chromium, especialmente manga y vista trasera.
3. Hacer prueba manual de Chrome/Edge en Windows.
4. Añadir mapeos visuales solo para categorías actuales que se puedan representar con geometría fiable; mantener Pixel Art como pipeline separado.


## BIMG-ENGINE-002 · Nanotela y fidelidad de prendas

- Receta v2 añade `garment_base_color`, `garment_panel_color`, `garment_accent_color` y `fabric_pattern`.
- API Python acepta receta v1 y v2; v1 migra en memoria a v2 con defaults estables. Las solicitudes sin receta mantienen el contrato anterior.
- El prompt de generación incluye los colores y el patrón cuando recibe receta, pero la vista SVG es la representación interactiva inmediata y no depende de generación.
- Los mapeos oficiales se conservan: `outfit`: `tactical_baseball`, `combat_jacket`, `techwear_sport`, `light_armor`, `idol_combat`, `elegant_command`, `support_coat`, `street_bomber`, `baseball_tech_suit`, `armadura_asimetrica`; `outer_layer`: `none`, `short_bomber`, `hooded_jacket`, `long_coat`, `utility_cape`, `chaleco_tactico`, `chaqueta_corta_asimetrica`, `capa_corta_energetica`, `hombrera_modular`, `mangas_desmontables`; `footwear`: `combat_sneakers`, `armored_boots`, `high_top`, `sleek_boots`, `botas_cortas`, `zapatillas_plataforma`, `botas_asimetricas`, `calzado_ligero_pitcher`, `botines_elegantes`, `botas_reforzadas`.
- Limitación: los mapeos siguen siendo SVG 2D con perspectiva simplificada; no equivalen a una ilustración final ni a una malla 3D. Validación manual Chrome/Edge en Windows pendiente.
