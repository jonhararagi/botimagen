# BotImagen Studio Web · Beta en construcción

La interfaz React + TypeScript consume el catálogo y el motor reales mediante el servicio Python local. El editor ya ofrece 47 categorías en 8 pestañas, incluida una ampliación para busto, color independiente por raíz/coronilla/interior/puntas y reglas de compatibilidad declaradas en el catálogo v16. Todavía faltan categorías avanzadas, la biblioteca visual, la prueba manual de navegador en Windows y una imagen generada. La CI ya ejecuta un smoke test headless de Chromium en Linux.

## Requisitos

- Python 3.10+ (sin dependencias Python extra para el servidor actual).
- Node.js 22 y npm.
- `package-lock.json` está versionado: `npm ci` instala el árbol fijado por el proyecto y falla si el manifiesto y el lockfile divergen. La instalación inicial requiere Internet para acceder al registro npm; la app no usa APIs de IA ni servicios remotos durante la generación del perfil.

## Ejecutar en Windows

Abre dos terminales desde la carpeta del repositorio.

**Terminal 1, iniciar el motor local:**

```bat
py botimagen_server.py
```

El servicio escucha únicamente en `127.0.0.1:8765`. Deja esa terminal abierta.

**Terminal 2, iniciar la interfaz web:**

```bat
cd web
npm ci
npm run dev
```

Abre la dirección local que indique Vite, normalmente `http://127.0.0.1:5173`. La configuración de Vite reenvía las solicitudes `/api` al servicio local Python. Para comprobar el frontend compilado, ejecuta `npm run build` dentro de `web/`. La CI valida ese mismo camino con `npm ci --no-audit --no-fund` y `npm run build`.

## Smoke test automatizado del navegador

La CI instala Playwright y Chromium en un directorio temporal y ejecuta `web/browser_smoke.mjs`. El test arranca la API local y Vite, abre Chromium headless y verifica el catálogo, semántica de opciones explícitas «ninguno», fallos HTTP recuperables, bloqueo de acciones con cambios pendientes, compatibilidad de rasgos entre categorías, preservación de elecciones manuales y ciclo de guardar/duplicar/cargar perfiles.

Evidencia reciente: CI #168 **PASS_REAL**, https://github.com/jonhararagi/botimagen/actions/runs/38004033939. CI #167 también pasó tras ajustar el contrato para no publicar el campo interno `prompt_en`: https://github.com/jonhararagi/botimagen/actions/runs/38003917950. Playwright no se añade a las dependencias de ejecución de la aplicación ni modifica `web/package-lock.json`. Esta prueba corre en Linux; la validación manual en Chrome/Edge y Windows sigue pendiente.

## Funciones conectadas

- 47 categorías de identidad, cuerpo, anatomía, cara, cabello, vestuario, combate y detalle servidas desde `character_rules.json`; la UI mantiene solo la estructura de los campos y no duplica sus listas de opciones.
- Rasgos anatómicos/visuales independientes: tamaño del busto, patrón y color de escamas (11 opciones de región/patrón), raíces, coronilla, interior y puntas del cabello como controles independientes.
- Generación real de perfiles y prompts mediante `CharacterGenerator`, con elecciones fijadas, campos AUTO, semilla y coherencia.
- Visualización del prompt y negative prompt oficiales, copia al portapapeles y exportación JSON.
- Guardado de perfiles mediante `POST /api/profiles` en `generated_characters/web_profiles/`, ignorado por Git por defecto.
- Panel de perfiles locales: permite actualizar la lista, cargar un perfil guardado y duplicarlo como copia independiente. El guardado genera un UUID nuevo y la prueba HTTP confirma que el original permanece intacto.
- `GET /api/assets/contracts` expone los diez contratos PNG del manifiesto oficial con prompt, destino relativo y límites esperados. Es una ruta de solo lectura; no importa ni escribe archivos.
- Pruebas HTTP del servicio y validación de selecciones para que una opción inventada no se acepte.

## Límites actuales

La silueta SVG es un marcador temporal de la interfaz, no una ilustración generada. No existe todavía generación neuronal de imagen, biblioteca visual con miniaturas/SQLite, comparación de variantes ni migración completa del intake de assets. La API ya publica los contratos oficiales en modo de solo lectura; selección, vista previa, validación binaria y copia de la imagen siguen pendientes. El servicio debe iniciarse manualmente en una terminal; el lanzador unificado de Windows se desarrollará más adelante.

El smoke test automatizado headless de Chromium en Linux ya pasa en GitHub Actions. Falta probar manualmente en Chrome/Edge en Windows y medir memoria/rendimiento; la prueba de CI no sustituye esa verificación física.
