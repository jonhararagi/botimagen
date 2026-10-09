# BotImagen Studio Web · Beta en construcción

La interfaz React + TypeScript consume el catálogo y el motor reales mediante el servicio Python local. El editor ya ofrece 46 categorías en 8 pestañas, incluida una primera ampliación para busto, color por zonas del cabello y 11 opciones de patrón/región de escamas (catálogo v6). Todavía faltan categorías avanzadas, la biblioteca visual, las pruebas reales de navegador/Windows y una imagen generada.

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

## Funciones conectadas

- 46 categorías de identidad, cuerpo, anatomía, cara, cabello, vestuario, combate y detalle servidas desde `character_rules.json`; la UI mantiene solo la estructura de los campos y no duplica sus listas de opciones.
- Rasgos anatómicos/visuales independientes: tamaño del busto, patrón y color de escamas (11 opciones de región/patrón), raíces, coronilla e interior del cabello.
- Generación real de perfiles y prompts mediante `CharacterGenerator`, con elecciones fijadas, campos AUTO, semilla y coherencia.
- Visualización del prompt y negative prompt oficiales, copia al portapapeles y exportación JSON.
- Guardado de perfiles mediante `POST /api/profiles` en `generated_characters/web_profiles/`, ignorado por Git por defecto.
- Panel de perfiles locales: permite actualizar la lista, cargar un perfil guardado y duplicarlo como copia independiente. El guardado genera un UUID nuevo y la prueba HTTP confirma que el original permanece intacto.
- Pruebas HTTP del servicio y validación de selecciones para que una opción inventada no se acepte.

## Límites actuales

La silueta SVG es un marcador temporal de la interfaz, no una ilustración generada. No existe todavía generación neuronal de imagen, biblioteca visual con miniaturas/SQLite, comparación de variantes ni migración del intake de assets. El servicio debe iniciarse manualmente en una terminal; el lanzador unificado de Windows se desarrollará más adelante.

El smoke test real en Chrome/Edge y Windows aún debe completarse. La compilación en GitHub Actions no sustituye esa verificación física.
