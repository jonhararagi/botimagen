# BIMG-ENGINE-001 · Motor visual CyberStreet

**Estado de implementación:** `PASS_CI_VALIDATION` para la compilación, las pruebas Python y el smoke test Chromium headless de la ejecución CI indicada abajo. La implementación usa geometría SVG original; no incorpora recursos binarios externos ni dependencias npm. La validación física en Windows sigue pendiente.

## Arquitectura

- `web/src/visual/VisualCharacterRenderer.tsx` define `VisualRecipe` v1, normalización segura, composición SVG, controles Style Lab y descripción de receta para prompt.
- `web/src/App.tsx` conecta el renderizador con las selecciones del generador actual. Los valores se leen de `generated.profile` cuando existe un resultado generado, y se usan las selecciones del formulario como fallback.
- `web/src/styles.css` contiene los controles adaptables del Style Lab.
- `character_generator.py` agrega la descripción de receta al prompt solo cuando se envía una receta visual.
- `botimagen_server.py` valida el contrato opcional `visual_recipe` y conserva compatibilidad con clientes antiguos que no lo envían.
- `tests/test_visual_recipe_contract.py` cubre validación de campos, prompt y retrocompatibilidad. `web/browser_smoke.mjs` cubre interacción, vista trasera, estados NanoWear y persistencia en el ciclo de perfiles.

## Receta visual v1

`visual_recipe` contiene `schema_version`, `family`, `anime_influence`, `toon_influence`, `streetwear_cyberpunk`, `detail_level`, `nanowear_state`, `material_finish`, `emblem_shape`, `emblem_color`, `emblem_contrast`, `emblem_position` y `view`.

Valores admitidos:
- Familia: `cyberstreet`.
- Influencias y detalle: enteros 0–100.
- NanoWear: `everyday`, `nanoweave`, `transformation`.
- Acabado: `textile`, `nanoweave`, `synthetic`.
- Emblema: `bunny`, `star`, `fox`, `skull`, `geo`.
- Contraste: `auto`, `manual`; posición: `chest`, `sleeve`, `hood`; presentación: `front`, `back`.
- Color: hexadecimal `#RRGGBB`.

Los perfiles antiguos que no tengan receta reciben valores predeterminados seguros en la interfaz. Guardar y duplicar persiste la receta en el bloque del perfil; duplicar utiliza la copia completa que ya proporciona la API y genera un registro independiente.

## Efectos visuales implementados

- Silueta frontal/trasera estilizada, rostro, ojos, cabello, torso, mangas y calzado.
- El renderizador usa identificadores actuales de pelo, ojos, piel, orejas, cuernos, expresión y detalle facial cuando hay una correspondencia sencilla; el resto se representa de forma neutral.
- Los cuatro controles del Style Lab modifican proporciones de rasgos, grosor de contorno, acentos tecnológicos o densidad de líneas.
- Los tres estados NanoWear y los tres acabados modifican paleta, costuras, paneles y brillo.
- Chromapatch incluye cinco formas originales y permanece en la misma receta. En la vista trasera se coloca sobre la zona posterior del vestuario.
- El contraste automático usa luminancia relativa y el modo manual advierte cuando el contraste calculado queda por debajo de 3:1 sobre la zona de muestra.

## Límites conocidos

- Es un renderizador vectorial 2D, no un modelo 3D, rig ni ilustración final de acabado profesional.
- No todos los identificadores del catálogo disponen todavía de geometría específica. Se usa una representación neutral para opciones sin mapeo.
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

**Resultado verificado:** GitHub Actions `Validate BotImagen` [run 38051068349](https://github.com/jonhararagi/botimagen/actions/runs/38051068349) — `success`. Completó `py_compile`, pruebas del generador, reproducibilidad, contrato visual, API local, cobertura del editor, nuevo contrato de receta, `npm ci`, `npm run build` y smoke test de Chromium. No se ejecutó una compilación local porque el entorno de trabajo no pudo resolver `github.com` para clonar el repositorio. Las pruebas físicas en Windows no se afirman ni se sustituyen por CI Linux.

## Próximos pasos

1. Revisar resultado de GitHub Actions para el commit del PR y corregir cualquier fallo sin debilitar las pruebas previas.
2. Revisar el contraste y la posición del Chromapatch en capturas de Chromium, especialmente manga y vista trasera.
3. Hacer prueba manual de Chrome/Edge en Windows.
4. Añadir mapeos visuales solo para categorías actuales que se puedan representar con geometría fiable; mantener Pixel Art como pipeline separado.
