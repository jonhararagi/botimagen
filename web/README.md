# BotImagen Studio Web · Beta en construcción

La interfaz React + TypeScript consume el catálogo y el motor reales mediante el servicio Python local. El editor todavía no es la beta completa: no incluye el catálogo anatómico ampliado, la biblioteca visual ni una imagen generada.

## Requisitos

- Python 3.10+ (sin dependencias Python extra para el servidor actual).
- Node.js 22 y npm.
- La instalación inicial de dependencias web requiere Internet para acceder al registro npm. La app no usa APIs de IA ni servicios remotos durante la generación del perfil.

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
npm install
npm run dev
```

Abre la dirección local que indique Vite, normalmente `http://127.0.0.1:5173`. La configuración de Vite reenvía las solicitudes `/api` al servicio local Python. Para comprobar el frontend compilado, ejecuta `npm run build` dentro de `web/`.

## Funciones conectadas

- Catálogo de especies, cuerpo, cabello, ojos y poses servido desde `character_rules.json`; la UI ya no mantiene sus propias listas de opciones.
- Generación real de perfiles y prompts mediante `CharacterGenerator`, con elecciones fijadas, campos AUTO, semilla y coherencia.
- Visualización del prompt y negative prompt oficiales, copia al portapapeles y exportación JSON.
- Guardado de perfiles mediante `POST /api/profiles` en `generated_characters/web_profiles/`, ignorado por Git por defecto.
- Panel de perfiles locales: permite actualizar la lista y cargar un perfil guardado. La API lista y recupera por UUID.
- Pruebas HTTP del servicio y validación de selecciones para que una opción inventada no se acepte.

## Límites actuales

La silueta SVG es un marcador temporal de la interfaz, no una ilustración generada. No existe todavía generación neuronal de imagen, biblioteca visual con miniaturas/SQLite, comparación de variantes ni migración del intake de assets. El servicio debe iniciarse manualmente en una terminal; el lanzador unificado de Windows se desarrollará más adelante.

El smoke test real en Chrome/Edge y Windows aún debe completarse. La compilación en GitHub Actions no sustituye esa verificación física.
