# BotImagen Studio Web · Beta en construcción

La interfaz React + TypeScript consume el catálogo y el motor reales mediante el servicio Python local. El editor ofrece 47 categorías en 8 pestañas y ahora incluye el primer motor vectorial CyberStreet, un Style Lab con receta versionada, tres estados NanoWear y un Chromapatch personalizable. La CI ejecuta un smoke test headless de Chromium en Linux; la validación manual de navegador en Windows sigue pendiente.


## Requisitos

- Python 3.10+.
- Node.js 22+ y npm.
- Pillow para la composición PNG del motor local.
- web/package-lock.json fija las dependencias; npm ci instala las versiones declaradas en el lockfile. La primera instalación puede requerir Internet.

## Ejecutar en Windows

**Modo recomendado:** desde la raíz del repositorio, haz doble clic en Iniciar_BotImagen_Web.bat. El lanzador comprueba requisitos, prepara dependencias cuando corresponde, inicia la API y Vite solo si no responden ya en sus direcciones locales y abre http://127.0.0.1:5173. Las ventanas de procesos muestran sus logs; déjalas abiertas mientras uses la beta.

Para verificar o preparar requisitos sin abrir servicios ni navegador, ejecuta:

    Iniciar_BotImagen_Web.bat -CheckOnly

El modo manual sigue disponible en dos terminales. En la primera, desde la raíz:

    py botimagen_server.py

En la segunda:

    cd web
    npm ci
    npm run dev

La API escucha solamente en 127.0.0.1:8765; Vite escucha en 127.0.0.1:5173 y reenvía llamadas /api. Ejecuta npm run build dentro de web/ para verificar la compilación.

## Smoke test automatizado del navegador

La CI Linux instala Playwright y Chromium en un directorio temporal y ejecuta `web/browser_smoke.mjs`. Los últimos incrementos validados prueban composición PNG real, descarga de 512 × 768 y compuerta de derechos/procedencia; los resultados se registran con sus SHA exactos en `cerebro/ESTADO_ACTUAL.md`. El test arranca la API local y Vite, abre Chromium headless y verifica el catálogo, semántica de opciones explícitas «ninguno», fallos HTTP recuperables, bloqueo de acciones con cambios pendientes, compatibilidad de rasgos entre categorías, preservación de elecciones manuales y ciclo de guardar/duplicar/cargar perfiles.

Evidencia reciente: CI #168 **PASS_REAL**, https://github.com/jonhararagi/botimagen/actions/runs/38004033939. CI #167 también pasó tras ajustar el contrato para no publicar el campo interno `prompt_en`: https://github.com/jonhararagi/botimagen/actions/runs/38003917950. Playwright no se añade a las dependencias de ejecución de la aplicación ni modifica `web/package-lock.json`. Esta prueba corre en Linux; la validación manual en Chrome/Edge y Windows sigue pendiente.

## Funciones conectadas

- 47 categorías de identidad, cuerpo, anatomía, cara, cabello, vestuario, combate y detalle servidas desde `character_rules.json`; la UI mantiene solo la estructura de los campos y no duplica sus listas de opciones.
- Rasgos anatómicos/visuales independientes: tamaño del busto, patrón y color de escamas (11 opciones de región/patrón), raíces, coronilla, interior y puntas del cabello como controles independientes.
- Generación real de perfiles y prompts mediante `CharacterGenerator`, con elecciones fijadas, campos AUTO, semilla y coherencia.
- Renderizador SVG original `web/src/visual/VisualCharacterRenderer.tsx`: vista frontal/trasera, geometría 2D estilizada, rasgos representables y paleta derivada de las selecciones existentes.
- Style Lab con influencia Anime/Toon, equilibrio Streetwear/Cyberpunk, densidad de detalle, estados NanoWear `everyday`/`nanoweave`/`transformation` y acabados textil/técnico/sintético.
- Chromapatch con cinco formas vectoriales originales, color, posición y contraste automático por luminancia o modo manual con aviso. La receta `visual_recipe` v1 se guarda/carga/duplica junto con el perfil y se incluye en el prompt oficial mediante un contrato API opcional y retrocompatible.
- Visualización del prompt y negative prompt oficiales, copia al portapapeles y exportación JSON.
- Guardado de perfiles mediante `POST /api/profiles` en `generated_characters/web_profiles/`, ignorado por Git por defecto.
- Panel de perfiles locales: permite actualizar la lista, cargar un perfil guardado y duplicarlo como copia independiente. El guardado genera un UUID nuevo y la prueba HTTP confirma que el original permanece intacto.
- `GET /api/assets/contracts` expone los diez contratos PNG del manifiesto oficial con prompt, destino relativo y límites esperados. Es una ruta de solo lectura; no importa ni escribe archivos.
- La biblioteca modular registra hash SHA-256, archivo fuente, licencia declarada, estado de derechos, tamaño, categoría, pose y metadatos de conversión.
- La API bloquea la composición de una pieza modular si la declaración de derechos/procedencia sigue pendiente, aunque se invoque el endpoint directamente.
- Para confirmar se admite obra propia declarada o una lista limitada de licencias abiertas con URL HTTPS. BotImagen registra lo declarado; no verifica automáticamente autoría, licencia o contenido de la página.
- Pruebas HTTP del servicio y validación de selecciones para que una opción inventada no se acepte.

## Límites actuales

El motor visual base sigue siendo un dibujo 2D estilizado, no una ilustración anime final ni un sistema 3D. Las piezas modulares deben importarse y clasificarse explícitamente. Confirmar anclajes no limpia una pieza automáticamente ni recupera zonas ocultas por otra prenda. Los 43 recortes PSD siguen como referencias/candidatos pendientes de revisión semántica, no como cabello/cuerpo/ropa intercambiables verificados.

Se añade una CI Windows para comprobar el preflight del lanzador, las pruebas Python, el build y la disponibilidad de API/Vite sobre loopback. Esa comprobación remota no sustituye QA físico en el ordenador del usuario. El lanzador tampoco es un instalador .exe autónomo; empaquetado independiente y mediciones de memoria/rendimiento siguen pendientes.


## Motor de dibujo anime local

La vista previa principal usa un motor paramétrico SVG incorporado en \`vendor/anime_character_creator/\` bajo licencia MIT. El adaptador \`character_render_engine.py\` traduce opciones admitidas del catálogo al esqueleto, cabello, rostro, anatomía y capas de vestuario. El navegador consulta \`POST /api/render/character\` en el servicio Python local. No requiere una API externa ni nuevas dependencias de ejecución. El renderizador CyberStreet anterior queda como respaldo explícito si la ruta nueva no está disponible y como fixture de compatibilidad para algunas pruebas históricas del Style Lab.
