# BOTIMAGEN · BIMG-MODULAR-INTEGRATION-REAL-003 · INTEGRACIÓN FUNCIONAL, NO DOCUMENTAL

**ROL:** Bot Obrero. Senior Software Architect, Python Imaging Engineer, SVG Compositing Engineer, React/TypeScript Engineer, Character Customization Engineer, Test Engineer, Browser QA Engineer y GitHub Maintainer.

**REPOSITORIO CANÓNICO:** https://github.com/jonhararagi/botimagen  
**RAMA DE TRABAJO:** `feature/bimg-engine-001-cyberstreet-visual-renderer`  
**REGLA:** No escribir directamente en `main`. No fusionar ni cerrar PRs. Preservar PR #11 y PR #14. Consultar el HEAD real antes de editar.

**TIMER:** estima 6–12 horas activas para este tramo de integración y validación. Registra el tiempo real solo si lo mediste. No confundas este tramo con la finalización de todo el producto.

## OBJETIVO ÚNICO

Deja de producir planes, auditorías y documentos como resultado principal. **Implementa y conecta el paquete modular CyberStreet al editor real de BotImagen.** El usuario necesita ver y editar un personaje dentro del programa, no leer otra descripción de lo que podría hacerse.

## FUENTE DE VERDAD Y CONTEXTO

Primero lee `cerebro/ESTADO_ACTUAL.md`, luego inspecciona el HEAD real y el código existente. No confíes ciegamente en referencias de commits antiguas.

Paquete nuevo ya versionado:
- `assets/modular/oc-cyberstreet/base-body.svg`
- `assets/modular/oc-cyberstreet/hair-midnight-cyan.svg`
- `assets/modular/oc-cyberstreet/top-neon-jacket.svg`
- `assets/modular/oc-cyberstreet/skirt-tech-pleated.svg`
- `assets/modular/oc-cyberstreet/manifest.json`

Los cuatro SVG comparten lienzo 512×768 con transparencia y sus anclajes son provisionales. Están registrados en `assets/visual_asset_catalog.json`, con estado de candidato, no validado. Son recursos originales de arranque, no arte final profesional.

BotImagen es un editor visual offline-first y creador modular de personajes originales, no un generador libre de imágenes IA ni una fábrica de prompts. La meta es que el usuario edite rostro, anatomía, cabello, prendas y accesorios, guarde perfiles OC y exporte la imagen compuesta. Mantén la dirección anime/cyberpunk elaborada y crea personajes originales.

## TRABAJO OBLIGATORIO EN ESTA EJECUCIÓN

### 1. Encontrar el renderer real
- Inspecciona la estructura y localiza el motor Python de render, endpoint/API de render de personajes, punto de entrada React y sistema de perfiles.
- Localiza la ruta real por la que el usuario ve y exporta el personaje.
- No inventes otra aplicación o segundo motor si el renderer existente se puede ampliar.
- Comprueba cómo se renderizan actualmente las recetas v1/v2/v3 y conserva compatibilidad.

### 2. Implementar composición real con las piezas existentes
- Carga y valida el manifiesto del paquete, con rutas seguras relativas al repositorio.
- Compón cuerpo, falda, chaqueta y cabello en un orden de capas explícito, preservando alfa y el mismo lienzo.
- Evita doble escalado, fondos blancos accidentales, desplazamientos por tamaños distintos y piezas fuera del lienzo.
- Si el renderer actual utiliza SVG/Pillow u otro pipeline, integra el paquete en ese pipeline en lugar de construir un sistema alternativo.
- Devuelve/renderiza una imagen final real que la interfaz existente pueda mostrar y exportar.

### 3. Controles conectados al resultado real
- Añade al editor existente controles para activar/desactivar el cabello, chaqueta y falda, y elegir las piezas disponibles.
- Cada cambio debe volver a componer la imagen real, no solo cambiar una etiqueta o estado decorativo de React.
- Usa el mecanismo de estado y API existentes.
- Guarda y restaura las selecciones con el sistema de perfiles OC existente. No rompas perfiles previos: migración aditiva y valores por defecto seguros.
- Añade una acción real de exportación PNG con transparencia y dimensiones esperadas.

### 4. Anatomía y calidad mínima
- Renderiza el paquete y comprueba visualmente que cuello, hombros, cintura, cadera y cabello encajen con el cuerpo.
- Corrige los SVG/anclajes si la composición muestra desalineación evidente. No declares arte de nivel profesional si todavía parece un maniquí geométrico.
- Conserva el carácter original cyberpunk anime y los detalles cyan/fuchsia.
- No uses imágenes de Honkai ni de terceros como sustituto del arte propio. No cambies el alcance hacia generación IA.

### 5. Pruebas reales
Crea/actualiza pruebas automatizadas para:
- esquema del manifiesto y existencia de todos los SVG;
- rechazo de rutas absolutas o traversal `..`;
- composición con capas habilitadas/deshabilitadas y preservación de alpha;
- exportación PNG y tamaño;
- guardar/restaurar las opciones del personaje sin romper perfiles antiguos;
- endpoint de render, si el sistema lo ofrece.

Ejecuta las pruebas pertinentes. Ejecuta el smoke test de Chromium/navegador existente y toma/revisa una captura real cuando el entorno lo permita. Corrige los fallos que aparezcan. No afirmes que corriste Windows QA si no estás en Windows.

### 6. Catálogo y trazabilidad
- Mantén las entradas existentes del catálogo y las IDs estables.
- Añade metadatos solo si hacen falta para que el sistema existente descubra y utilice las piezas.
- Promueve de `component_candidate` a `component_validated` únicamente después de tests y revisión visual real.
- No descargues o incluyas modelos/ilustraciones externos sin fuente, autor y condiciones de uso verificadas.

## PROHIBIDO

- Entregar solo auditoría, plan, README, documentación o una lista de siguientes pasos.
- Crear una demo aislada que no use el renderer/interfaz reales.
- Reemplazar la aplicación o reescribir módulos estables sin necesidad.
- Romper recetas v1/v2/v3, perfiles, Style Lab, NanoWear, Chromapatch, catálogo, prendas o APIs existentes.
- Cambiar `main`, fusionar/cerrar PRs o borrar trabajo previo.
- Fingir descargas, ejecución local, tests, CI o QA visual.
- Dar por terminado el trabajo solo porque el código compila.

## CRITERIOS DE ACEPTACIÓN PARA MARCAR DONE

1. El editor muestra el personaje compuesto a través del renderer real.
2. Cabello, chaqueta y falda se pueden activar/desactivar y el resultado visual cambia.
3. Las opciones persisten y se restauran desde un perfil.
4. PNG exportado corresponde a la composición visible y conserva transparencia.
5. Pruebas automatizadas nuevas pasan y las relevantes anteriores no regresionan.
6. Hay evidencia de navegador/captura real o se explica exactamente por qué no se pudo obtener.
7. `cerebro/ESTADO_ACTUAL.md` se actualiza con archivos tocados, commit/HEAD, comandos ejecutados y resultados exactos, limitaciones, QA visual y siguiente acción.
8. La respuesta final informa qué cambió, qué se ejecutó y qué pasó. No declarar PASS si no hay evidencia.

Si una parte está bloqueada por el entorno, termina las partes implementables y testeables, deja un fallo concreto y no reemplaces el trabajo por documentación. **No preguntes al usuario lo que puedas resolver inspeccionando el repo. Empieza a implementar ahora.**
