# BIMG-ASSET-002 · Banco de referencias visuales 2D, 2.5D, cartoon y 3D

**Estado:** RESEARCH_PARTIAL  
**Fecha:** 2026-10-10  
**Repositorio:** [jonhararagi/botimagen](https://github.com/jonhararagi/botimagen)

## Resumen ejecutivo

- **Prioridad 2D cartoon-anime:** [Cartoony Anime Style, Lioan](https://pixai.art/es/model/1821163402555657503). La ficha lo identifica como LoRA entrenado con 85 imágenes que el autor creó con Midjourney, recomienda bases Illustrious y muestra permisos para generar/compartir imágenes, descargar el modelo y uso comercial en PixAI. Es una señal prometedora, no una auditoría independiente de datos de entrenamiento ni una garantía para todas las salidas.
- **Prioridad de lineart y cel shading:** [a-teddy-a Toon Style](https://pixai.art/es/model/2064199521616992635). La descripción de ejemplo menciona lineart coloreado nítido, cel shading, gradientes pictóricos, reflejos y ojos expresivos. La base y licencia completa del peso no quedaron confirmadas.
- **Contraste de acabado anime:** [Crystalize Anime Style](https://pixai.art/es/model/1992024682225518933), descrito con pincelada delicada, reflejos suaves, colores vivos, atmósfera onírica y profundidad de campo. No está probado para siluetas de combate pequeñas.
- **Pixel art:** [AziibPixelMix](https://civitai.com/models/195730/aziibpixelmix), checkpoint merge para SD 1.5, variante fp16 SafeTensor de aproximadamente 1,99 GB, licencia declarada CreativeML Open RAIL-M Addendum. No descargar ni subir pesos.
- **Diseño 3D:** [VRoid Studio](https://vroid.com/en/studio) es la opción más práctica para construir un maniquí original anime y explorar proporciones/poses. Para modelos de VRoid Hub y marketplaces, revisar siempre las condiciones del creador.
- **Candidato 3D con licencia visible:** [Stylized Anime Girl | Futuristic 3D Character](https://sketchfab.com/3d-models/stylized-anime-girl-futuristic-3d-character-9f739a6984b641a49d476af342f84b5d). La ficha declara CC Attribution (CC BY), 71,4k triángulos y 36k vértices, y menciona uso de herramientas de IA durante el proceso. Verificar la licencia exacta y atribución antes de descargar o reutilizar.
- **Decisión de arte:** no aprobar todavía un estilo de producción. Comparar 2–3 referencias con el mismo personaje original, pose, vestuario y encuadre. Skullgirls y Senran Kagura son referencias generales de presentación, nunca permiso para copiar personajes, diseños o recursos.

## Estados de permiso

Los estados describen lo que se pudo comprobar en páginas públicas, no suposiciones:

- VISUAL_REFERENCE_ONLY: consulta visual; no implica permiso para copiar ni redistribuir.
- LOCAL_USE_ALLOWED: el uso local previsto está explícitamente permitido.
- MODIFICATION_ALLOWED: la modificación para el uso previsto está permitida.
- REDISTRIBUTION_ALLOWED: existe permiso expreso para redistribuir el archivo/derivado en la forma prevista.
- LICENSE_UNKNOWN: no se pudo confirmar el alcance de la licencia.
- SOURCE_UNVERIFIED: no se pudo verificar suficientemente la procedencia/titularidad.

Pueden coexistir varios estados. Que una plataforma permita generar imágenes no significa que se puedan redistribuir pesos, ejemplos o modelos base. La licencia del modelo no resuelve automáticamente los derechos de personajes, referencias, marcas o salidas concretas.

## A. Referencias 2D / 2.5D y cartoon

| Recurso y tipo | Evidencia y compatibilidad provisional | Permisos y restricciones | Próximo experimento |
|---|---|---|---|
| [TSG Mix Style](https://pixai.art/es/recipes/2055342419906937543) · receta PixAI | La ficha describe una receta de 07 Guest para Hoshino v2. No es un modelo base ni necesariamente un LoRA independiente. La muestra pública menciona Typhon/Arknights, por lo que es fan art. Compatibilidad: UNKNOWN/PARTIAL. | VISUAL_REFERENCE_ONLY; LICENSE_UNKNOWN para componentes y pesos. [Términos PixAI](https://pixai.art/es/terms). No copiar el personaje de muestra. | Registrar modelo base, LoRAs, sampler y parámetros desde los detalles completos; evaluar solo con personaje original si las condiciones lo permiten. |
| [TOONCITY](https://pixai.art/es/model/1855482878029959308) · LoRA de estilo, autor 老いchang | La descripción dice que mezcla estilos cartoon diversos y recomienda CuteLag_STLV2.0. La página contiene muestras y menciona variaciones de proporciones; parte de la orientación es adulta. Compatibilidad: PARTIAL. | La ficha muestra generación/compartición, descarga del modelo y uso comercial en PixAI. No demuestra por sí sola permiso de redistribución del peso ni derechos irrestrictos de la base. VISUAL_REFERENCE_ONLY; LICENSE_UNKNOWN para redistribución. | Inspeccionar ejemplos aptos y revisar base exacta y licencia completa antes de uso local. |
| [Cartoony Anime Style](https://pixai.art/es/model/1821163402555657503) · LoRA, autor Lioan | La descripción dice que fue entrenado con 85 imágenes creadas por el autor con Midjourney y que funciona mejor con modelos Illustrious. Mezcla cartoon con aspectos anime. Compatibilidad: PARTIAL_MATCH, prioridad alta para prueba. | La ficha muestra generación/compartición, descarga y uso comercial dentro de PixAI. No equivale a autorización de redistribución del peso ni resuelve derechos de cada salida/base. VISUAL_REFERENCE_ONLY; revisar [Términos PixAI](https://pixai.art/es/terms). | Probar cuerpo entero y retrato de un personaje original; evaluar legibilidad al 25%, rostro y contornos en fondos claros/oscuros. |
| [a-teddy-a Toon Style](https://pixai.art/es/model/2064199521616992635) · LoRA, autor Teddy | La descripción de muestra menciona lineart coloreado nítido, cel shading, gradientes pictóricos, reflejos brillantes y ojos expresivos. PARTIAL_MATCH, prioridad media-alta; el detalle ambiental puede competir con el personaje. | LICENSE_UNKNOWN para base, peso y redistribución. Las muestras no se pueden reutilizar sin permiso. | Probar figura aislada sobre fondo plano; verificar si conserva identidad con detalle reducido. |
| [Crystalize Anime Style](https://pixai.art/es/model/1992024682225518933) · LoRA, autora Nora | Descripción: pincelada delicada, reflejos suaves, colores vibrantes, atmósfera onírica, composición limpia y profundidad de campo; declara influencia del modelo Crystalize. PARTIAL para retratos/promoción, UNKNOWN para sprites de combate. | La ficha muestra permisos de generación/compartición, descarga y uso comercial en PixAI. No equivale a permiso de redistribución ni resuelve la base. VISUAL_REFERENCE_ONLY; LICENSE_UNKNOWN para redistribución. | Usar como contraste de iluminación/paleta; probar cuerpo entero y agrupación de sombras antes de recomendarlo. |
| [Ultimate Anime Style Booster XL](https://pixai.art/es/model/1754524791048754501) · LoRA de estilo/mejora, autor qw12 | La ficha recomienda fuerza 0.9; las muestras usan etiquetas de detalle, iluminación y profundidad de campo. Base exacta no confirmada en el extracto consultado. Compatibilidad PARTIAL/UNKNOWN: puede añadir detalle sin aportar un estilo consistente. | LICENSE_UNKNOWN para redistribución y requisitos completos de base. Las muestras de fan art no son diseños originales. | Comparar la misma base/prompt con y sin LoRA; descartar si solo aumenta detalle y reduce lectura de silueta. |

### Notas de licencia para PixAI

Una receta es una configuración de generación; un LoRA es un adaptador que requiere una base compatible; un checkpoint es un modelo completo o merge. No son intercambiables. La guía oficial de PixAI distingue entre permiso para generar, permisos del modelo/LoRA, derechos de las referencias y derechos de terceros: [PixAI Commercial Use & Licensing Guide](https://blog.pixai.art/en/pixai-commercial-use-licensing-guide). Los términos pueden cambiar; antes de usar un candidato, registrar autor, fecha, base exacta, licencia completa y condiciones vigentes. No guardar capturas o ejemplos de terceros en el repositorio sin permiso.

## B. Pixel art

| Recurso | Tipo, requisitos y licencia | Recomendación |
|---|---|---|
| [AziibPixelMix](https://civitai.com/models/195730/aziibpixelmix) | Checkpoint merge para Stable Diffusion 1.5. La ficha publica variante fp16 SafeTensor de 1,99 GB y recomienda resoluciones como 512×512, 768×768 y 1024×1024. Autor: aziib. Licencia declarada: CreativeML Open RAIL-M Addendum. | VISUAL_REFERENCE_ONLY; revisar licencia completa y restricciones antes de cualquier uso concreto. No descargar ni añadir pesos a Git. Dejarlo para una fase separada de pixel art. |
| [OpenGameArt: búsqueda pixel art filtrada por CC0](https://opengameart.org/art-search?keys=pixel+art&field_art_licenses_tid=4) | Índice de recursos 2D; el filtro no certifica cada resultado individual ni a todo el sitio. | VISUAL_REFERENCE_ONLY hasta abrir y verificar un asset concreto, su autor y licencia. Si el archivo individual es realmente CC0, evaluar LOCAL_USE_ALLOWED, MODIFICATION_ALLOWED y REDISTRIBUTION_ALLOWED para ese archivo. Útil para estudiar escala/paletas, no candidato directo al arte gacha final. |

## C. Herramientas y bibliotecas 3D

| Recurso | Uso de referencia | Permisos y recomendación |
|---|---|---|
| [VRoid Studio](https://vroid.com/en/studio) | Crear personajes anime estilizados y exportarlos como VRM; explorar proporciones, masas de cabello, vestuario, paleta, iluminación y poses. La web permite que cada creador establezca condiciones para los datos de sus propios modelos. | Herramienta prioritaria para un maniquí original. No confundir los modelos propios con los de terceros; revisar los términos de herramientas/materiales usados. |
| [VRoid Hub](https://hub.vroid.com/en) | Galería de personajes 3D con vistas, animaciones y, según la configuración, acceso a datos de modelo. | VISUAL_REFERENCE_ONLY por defecto. Descarga, uso en apps, modificación, redistribución y uso comercial dependen de cada creador. Consultar [directrices](https://hub.vroid.com/en/guidelines) y [condiciones Pixiv](https://policies.pixiv.net/en.html#vroidhub). |
| [Sketchfab: Stylized Anime Girl · Futuristic 3D Character](https://sketchfab.com/3d-models/stylized-anime-girl-futuristic-3d-character-9f739a6984b641a49d476af342f84b5d) | Personaje anime futurista estilizado, creado en Blender según la descripción. La ficha informa 71,4k triángulos, 36k vértices y licencia CC Attribution (CC BY); declara asistencia de IA en concepto/diseño/workflow. | VISUAL_REFERENCE_ONLY. CC BY normalmente permite reutilización con atribución, pero verificar versión, avisos y requisitos del archivo exacto antes de descargar/modificar. Prioridad alta para estudiar silueta sci-fi y materiales. |
| [Sketchfab: personajes y criaturas](https://sketchfab.com/3d-models/categories/characters-creatures) | Catálogo con visor 3D para estudiar topología aparente, materiales, poses y animaciones cuando existan. | Cada modelo tiene licencia propia. Que se pueda visualizar no implica descarga ni reutilización. Filtrar descargables y verificar ficha individual. |
| [BOOTH](https://booth.pm/en) | Mercado de modelos, ropa, cabello, accesorios y texturas, incluidos recursos VRM/VRChat. | LICENSE_UNKNOWN hasta abrir cada producto. Gratis o comprado no significa permiso de modificación, uso comercial o redistribución. Útil para referencias de vestuario/cabello, pero no descargar ni comprar en esta tarea. |
| [CGTrader](https://www.cgtrader.com/3d-models) | Mercado de personajes, ropa, props y modelos para juegos/animación; ofrece formatos como FBX y OBJ según los listados. | LICENSE_UNKNOWN hasta revisar el producto concreto. Comprobar límites comerciales, asientos, modificaciones y redistribución dentro del juego. No redistribuir archivos fuente sin permiso expreso. |

## D. Matriz de permisos resumida

| Candidato | Referencia visual | Uso local / modificación | Redistribución de fuente |
|---|---|---|---|
| TSG Mix Style | VISUAL_REFERENCE_ONLY | LICENSE_UNKNOWN | LICENSE_UNKNOWN |
| TOONCITY | VISUAL_REFERENCE_ONLY | Generación en PixAI visible; uso local del peso por verificar | LICENSE_UNKNOWN |
| Cartoony Anime Style | VISUAL_REFERENCE_ONLY | Permiso de generación comercial visible en ficha, sujeto a términos/base | LICENSE_UNKNOWN |
| a-teddy-a Toon Style | VISUAL_REFERENCE_ONLY | LICENSE_UNKNOWN | LICENSE_UNKNOWN |
| Crystalize Anime Style | VISUAL_REFERENCE_ONLY | Permiso de generación comercial visible en ficha, sujeto a términos/base | LICENSE_UNKNOWN |
| Ultimate Anime Style Booster XL | VISUAL_REFERENCE_ONLY | LICENSE_UNKNOWN | LICENSE_UNKNOWN |
| AziibPixelMix | VISUAL_REFERENCE_ONLY | Revisar Open RAIL-M Addendum antes de uso | No autorizado para este repo |
| VRoid Studio | Creación de referencia propia | Según términos de herramienta y entradas | Modelos propios según condiciones aplicables; no aplica a terceros automáticamente |
| VRoid Hub | VISUAL_REFERENCE_ONLY por defecto | Depende de cada modelo | Solo si el creador lo permite |
| Sketchfab anime girl | VISUAL_REFERENCE_ONLY | Posible bajo CC BY, tras verificar archivo/versión | Posible bajo CC BY con atribución y cumplimiento; verificar el archivo exacto |
| Sketchfab general | VISUAL_REFERENCE_ONLY | Depende del modelo | Depende del modelo |
| BOOTH | VISUAL_REFERENCE_ONLY | LICENSE_UNKNOWN hasta revisar producto | LICENSE_UNKNOWN |
| CGTrader | VISUAL_REFERENCE_ONLY | LICENSE_UNKNOWN hasta revisar producto | LICENSE_UNKNOWN |
| OpenGameArt búsqueda CC0 | VISUAL_REFERENCE_ONLY hasta seleccionar asset | Solo tras verificar licencia individual | Solo tras verificar CC0 individual |

## E. Evidencia y límites de inspección

- Se recuperaron descripciones públicas, autores, metadatos y permisos declarados en las páginas PixAI.
- Para Cartoony Anime Style, la descripción menciona 85 imágenes creadas por el autor con Midjourney y compatibilidad recomendada con Illustrious: [ficha](https://pixai.art/es/model/1821163402555657503).
- TOONCITY se describe como mezcla de estilos cartoon, con variaciones de proporciones y ejemplos de orientación adulta: [ficha](https://pixai.art/es/model/1855482878029959308).
- La descripción de a-teddy-a menciona lineart coloreado, cel shading, gradientes y ojos expresivos: [ficha](https://pixai.art/es/model/2064199521616992635).
- Crystalize se describe mediante etiquetas de pincelada delicada, reflejos suaves, color y profundidad de campo: [ficha](https://pixai.art/es/model/1992024682225518933).
- AziibPixelMix: tipo, base SD 1.5, tamaño publicado y licencia declarada: [ficha Civitai](https://civitai.com/models/195730/aziibpixelmix).
- Modelo 3D futurista: metadatos públicos de estilo y CC BY: [ficha Sketchfab](https://sketchfab.com/3d-models/stylized-anime-girl-futuristic-3d-character-9f739a6984b641a49d476af342f84b5d).
- **Limitación visual:** se leyeron metadatos, descripciones y enlaces a muestras públicas, pero no se realizó auditoría cuadro a cuadro de todas las imágenes ni de archivos descargados. No se afirma que todos los ejemplos hayan sido inspeccionados en resolución completa. Las imágenes externas permanecen enlazadas y no se copiaron al repo.

## F. Experimentos recomendados

1. **Cartoon-anime:** comparar Cartoony Anime Style y a-teddy-a Toon Style; usar Crystalize como contraste de acabado. Mismo personaje original, cuerpo entero, pose neutra, vestuario propio y fondo plano. Evaluar silueta a escala de combate, repetibilidad de rostro/cabello, manos, contornos, sombras, materiales y separación figura/fondo. No puntuar hasta revisar muestras reales comparables.
2. **Bloqueo 3D:** crear maniquí propio en VRoid Studio o seleccionar un modelo de VRoid Hub/Sketchfab solo si los términos permiten el uso concreto. Obtener vistas frontal, tres cuartos y perfil; usar como referencia de composición, no calcar detalles identificables.
3. **Pixel art separado:** no descargar AziibPixelMix. Si se aprueba esa línea más adelante, revisar licencia completa y entorno local primero; no versionar pesos en Git.

## G. Estado Git y restricciones

- Rama de trabajo creada desde main: research/bimg-asset-002-reference-catalog.
- Documento previsto: docs/art-research/BIMG-ASSET-002-REFERENCE-CATALOG.md.
- No se modificaron código funcional, manifiestos de assets, dependencias, assets de producción, PR #8 ni historial de main.
- No se descargaron modelos/pesos/texturas, no se generaron imágenes, no se compraron recursos ni se aceptaron términos.
- PR #8 se comprobó abierto y sin fusionar. Base main: 46bc7e702ae5d608927345991b5c4f0a661318a9; head feat/bimg-008-safe-png-import: 0aba96607d5b9f4f7a530d30f95d84b13510a3f8. El PR no se modificó.
- El catálogo es una guía de investigación, no una aprobación legal o artística ni autorización para producción.

## H. TIMER estimado

Estimaciones de planificación, no tiempo medido:
- Inspección visual detallada y revisión de licencias/base de los tres candidatos 2D prioritarios: 45–90 minutos.
- Revisar términos de un modelo 3D concreto para poses/capturas y registrar atribución: 30–60 minutos.
- Preparar una colección curada de 5–8 referencias con procedencia: 45–90 minutos.
- **Tiempo restante estimado para cerrar la investigación:** 2–4 horas.
- **Tiempo estimado para preparar una primera colección lista para evaluación:** 1,5–3 horas tras elegir candidatos y confirmar permisos.

**Conclusión:** RESEARCH_PARTIAL. Siguiente paso: revisión humana y decisión explícita sobre qué candidatos pasan a un experimento controlado.

## I. Registro de cierre documental BIMG-ASSET-002-R2

- **Resultado de la inspección adicional del navegador:** sin hallazgos nuevos ni fuentes verificables devueltas. La tarea terminó al alcanzar su límite de coste; no produjo evidencia visual utilizable para actualizar el catálogo.
- Este resultado es **neutral** respecto de los candidatos: no confirma ni refuta sus estilos, metadatos, procedencia o licencias. No se infiere evidencia positiva o negativa del intento fallido.
- No se inició otra sesión de navegador ni se realizaron búsquedas externas para este cierre.
- La inspección visual comparativa de muestras reales sigue incompleta. Las descripciones y metadatos anotados en este documento no equivalen a una comparación visual independiente en resolución completa.
- La revisión individual de licencias, modelos base, derechos de terceros y permisos de uso local, modificación y redistribución sigue pendiente donde se indica `LICENSE_UNKNOWN` o una condición por verificar. Los permisos declarados por una plataforma no se consideran autorización universal para pesos, bases, referencias o resultados.
- **Decisión documental:** el catálogo permanece en `RESEARCH_PARTIAL`. No se aprueba ningún estilo ni recurso para producción y no se declara BIMG-ASSET-002 completamente terminado.
- **Cambios de alcance:** este registro es la única adición prevista; no se modifican código, assets, manifiestos, dependencias, `main`, PR #8 ni PR #10.
- **Comprobaciones:** se revisó la coherencia del contenido existente y se compararon las referencias de rama/PR con GitHub. No se ejecutaron tests de software porque el cambio es documentación Markdown; no se afirma que se haya ejecutado un linter Markdown local.



## J. Primera selección de recursos para el prototipo de Character Studio · BIMG-ASSET-003

**Estado: PARTIAL.** Selección documental basada en las descripciones y metadatos ya registrados y en las fichas facilitadas para esta tarea. No se hicieron nuevas sesiones de navegador, descargas ni pruebas de archivos. Las categorías son recomendaciones para el siguiente paso, no aprobaciones legales ni compatibilidad técnica confirmada.

### Lista corta priorizada

| Recurso / tipo / autor | Aporte y modularidad conocida | Compatibilidad y límites | Estado recomendado y licencia |
|---|---|---|---|
| [VRoid Studio](https://vroid.com/en/studio) · [guías oficiales](https://vroid.com/en/studio/guidelines). Herramienta para personajes anime 3D; exportación VRM anunciada. | Permite partir de bases preparadas y personalizar rostro, cuerpo, cabello, ropa y texturas. Es una herramienta de creación, no una biblioteca de piezas redistribuibles. La intercambiabilidad entre piezas exportadas no está verificada. | Es la ruta más accesible para producir un personaje anime original sin modelar todo desde cero. No demuestra que el modelo final sea modular ni que materiales predefinidos puedan redistribuirse con BotImagen. | **PROTOTYPE_CANDIDATE**. Revisar los términos oficiales y las condiciones de cada material. Separar las partes originales del usuario de las de terceros. |
| [Kenney Character Assets](https://kenney.itch.io/kenney-character-assets). Paquete 3D low-poly; la ficha facilitada declara 4 modelos base, 75 skins, 40 accesorios y 17 animaciones. | Candidato técnico para explorar combinaciones de base, apariencia, accesorios y animación. La muestra gratuita debe distinguirse del paquete completo, cuya disponibilidad indicada es limitada. | Potencialmente útil para probar modularidad, pero no representa el acabado anime premium. No está confirmado que la muestra disponible incluya todas las piezas necesarias ni que cada skin sea un componente geométrico separado. | **TECHNICAL_PLACEHOLDER**. La ficha declara CC0; verificar que aplica al paquete/archivo exacto y qué contiene la muestra antes de una prueba. |
| [Tiny RPG CC0 Characters and Portraits](https://opengameart.org/content/tiny-rpg-cc0-characters-and-portraits) · autor indicado: tiopalada. Muestra 2D de personajes y retratos. | Puede iniciar una prueba del flujo de catálogo, ficha, miniatura y procedencia pixel art. No hay evidencia suficiente de capas intercambiables de ropa/cabello ni de personalización avanzada. | Útil para validar catálogo, no para afirmar que ya existe un editor modular ni que su estilo coincide con los sprites finales. Los formatos exactos de los archivos no se han verificado en esta tarea. | **PROTOTYPE_CANDIDATE** para una futura prueba de catálogo, condicionada a confirmar CC0 en el recurso individual y revisar el contenido exacto. |
| [Kenney Modular Characters](https://kenney.nl/assets/modular-characters). Biblioteca 2D; la ficha facilitada declara 425 archivos y CC0. | Puede servir para estudiar organización de piezas 2D y combinaciones. Deben revisarse cuadrícula, escala, pivotes, nombres y compatibilidad entre piezas. | No es anime 3D ni representa NIKKE-inspired. El ensamblado real no se ha probado. | **TECHNICAL_PLACEHOLDER**. Confirmar que CC0 cubre el paquete concreto y revisar su estructura en una tarea posterior. |
| [Stylized Anime Girl · Futuristic 3D Character](https://sketchfab.com/3d-models/stylized-anime-girl-futuristic-3d-character-9f739a6984b641a49d476af342f84b5d). Personaje 3D completo; ficha previamente registrada declara 71.400 triángulos, 36.000 vértices, Blender con asistencia de IA y CC BY. Autor exacto no reproducido en la evidencia disponible aquí. | Referencia de silueta sci-fi, materiales y acabado. No hay evidencia de que rostro, cabello, ropa o accesorios estén separados o sean intercambiables. | Un personaje completo puede requerir separación de mallas, materiales, rigging o reconstrucción antes de permitir cambios independientes. | **VISUAL_REFERENCE_ONLY**; **BLOCKED_LICENSE** para incorporación hasta confirmar versión CC BY, autor/atribución, avisos, derechos de componentes asistidos por IA y permisos del archivo descargable. |
| [a-teddy-a Toon Style LoRA](https://pixai.art/es/model/2064199521616992635) · autor indicado en el catálogo: Teddy. LoRA de generación. | Referencia para lineart coloreado, cel shading, gradientes y reflejos expresivos. No es un modelo 3D ni una biblioteca de piezas. | Requiere una base compatible y un flujo de generación. No debe ser necesaria para cambiar una pieza ya catalogada. Base exacta y permisos de peso/salidas siguen sin resolverse. | **FUTURE_AI_MODULE** y **VISUAL_REFERENCE_ONLY**. Mantener **LICENSE_UNKNOWN** para base/peso; no descargar. |
| [Cartoony Anime Style LoRA](https://pixai.art/es/model/1821163402555657503) · autor indicado: Lioan. LoRA de estilo. | El catálogo existente recoge la declaración de 85 imágenes creadas por el autor con Midjourney y recomendación de bases Illustrious. Sirve para investigar consistencia cartoon-anime, no para aportar piezas editables. | Depende de una base y un flujo de generación. No debe ser requisito para abrir, editar o guardar perfiles. | **FUTURE_AI_MODULE**; **VISUAL_REFERENCE_ONLY** hasta revisar condiciones vigentes de base, peso, entradas y salidas. |
| [AziibPixelMix](https://civitai.com/models/195730/aziibpixelmix) · autor indicado: aziib. Checkpoint merge para Stable Diffusion 1.5 según el catálogo existente. | Candidato futuro para conceptos pixel art generados por IA. No es una biblioteca de sprites ni un editor. | No se necesita para probar el catálogo ni las combinaciones de piezas 2D. | **FUTURE_AI_MODULE**. Revisar la licencia declarada Open RAIL-M Addendum para el uso concreto. No descargar ni versionar pesos. |

### Candidatos no prioritarios y límites de permiso

- Los modelos de VRoid Hub, BOOTH y CGTrader siguen como **VISUAL_REFERENCE_ONLY** o **BLOCKED_LICENSE** hasta revisar cada modelo/producto. Gratis, visible o comprado no significa que se permita modificarlo, usarlo comercialmente o redistribuirlo.
- Para CC BY hay que registrar la versión exacta, autor, atribución, avisos y condiciones del archivo. Para CC0 hay que confirmar que la declaración cubre el recurso individual elegido, no asumir que se extiende a una colección relacionada.
- Si no se puede confirmar un permiso, conservar **LICENSE_UNKNOWN** y no incorporar el recurso.
- No se ha abierto ni probado ningún archivo. Formatos exactos, rigs, separación de mallas, capas, resolución de sprites, pivotes y consistencia de nombres siguen siendo desconocidos cuando la ficha no los especifica.
- No se afirma que se hayan descargado, importado o probado modelos, pesos, texturas o sprites.

### Respuestas arquitectónicas

1. **Anime 3D sin modelar desde cero:** empezar con un personaje original creado en VRoid Studio. Es la vía más accesible para obtener una referencia propia con una base y controles preparados; no prueba que el resultado sea un conjunto de piezas intercambiables.
2. **Probar combinaciones modulares:** Kenney Character Assets es el candidato técnico inicial, si la muestra accesible contiene una base, skin y accesorio suficientes. Si no alcanza, registrar el bloqueo; no asumir que hace falta adquirir el paquete completo.
3. **Iniciar pixel art:** Tiny RPG CC0 Characters and Portraits puede probar catálogo, ficha y procedencia. Kenney Modular Characters puede ayudar a estudiar la organización de piezas 2D, pero no representa el estilo anime objetivo.
4. **Definir apariencia:** el modelo futurista de Sketchfab puede servir como referencia visual 3D; las LoRAs Toon ayudan a investigar una futura línea visual neuronal. Ninguna demuestra modularidad ni queda aprobada para incorporación.
5. **Límite de un personaje completo:** si rostro, cabello, ropa y accesorios están fusionados en malla o textura, cambiarlos independientemente puede exigir edición, separación de materiales, rigging o reconstrucción. El coste no se puede estimar sin inspeccionar la estructura real.
6. **Dependencias desconocidas:** inventario real de la muestra Kenney; separación/rig del modelo Sketchfab; capas y formatos de Tiny RPG; límites de exportación de VRoid; licencias individuales, bases de LoRAs/checkpoints y derechos de terceros.
7. **Experimento de mayor valor por esfuerzo:** crear en VRoid Studio un personaje original sencillo y registrar su procedencia, condiciones y capturas creadas por el usuario. En paralelo, definir una ficha de prueba para componentes: ID, estilo, base, pieza/capa, variante de color, accesorio, pose, fuente y estado de licencia. Solo si la muestra Kenney es accesible y suficiente, probar base + skin + accesorio. Para pixel art, confirmar primero la ficha y el inventario exacto de Tiny RPG.

### Contrato arquitectónico recomendado, sin implementación

Mantener comunes el catálogo, la interfaz de selección, los metadatos de procedencia y los perfiles guardados, pero no asumir un renderizador universal:

- **character_profile:** identidad, campos elegidos, seed opcional, fuentes y permisos.
- **style_package:** nikke_inspired_3d, pixel_art_2d o toon_style, con versión y estado del esquema.
- **components:** IDs de base y piezas que realmente existan, puntos de anclaje/capas y variantes compatibles.
- **provenance:** página original, autor, licencia exacta, fecha de verificación, restricciones y estado; usar **LICENSE_UNKNOWN** si falta evidencia.

Cambiar una pieza catalogada debe ser una operación de datos y presentación del paquete correspondiente, no una llamada obligatoria a IA. Perfiles y catálogo pueden ser comunes; un modelo 3D riggeado y un sprite 2D por capas necesitan ensamblado, validadores y renderizado específicos. Esta tarea no elige tecnología ni propone implementar un visor.

### Registro de alcance BIMG-ASSET-003

- Solo se añade esta sección al documento de investigación existente. No se modifican código, manifiestos, dependencias, assets, main, PR #8 ni PR #10.
- No se hicieron nuevas búsquedas ni sesiones de navegador. Se usaron el catálogo existente y la información facilitada para esta tarea.
- No se descargaron, probaron, importaron ni subieron archivos externos; no se generaron imágenes ni se aceptaron términos.
- No se ejecutaron pruebas de software ni linter Markdown local; no son afirmados como realizados.

**Conclusión: PARTIAL.** VRoid Studio es el primer candidato para crear una referencia anime 3D original; Kenney Character Assets es el candidato técnico para modularidad si la muestra lo permite; Tiny RPG es el candidato inicial para ensayar el catálogo pixel art. La incorporación real queda pendiente de verificar condiciones y estructura de archivos concretos.

**TIMER estimado, no medido:** trabajo documental, 1–2 horas. La prueba de viabilidad con archivos permitidos y verificados es una tarea posterior independiente.


## J. BIMG-ASSET-004 — Validación técnica de recursos prioritarios

**Estado de esta validación: `PARTIAL`.** Se consultaron páginas oficiales y sus condiciones publicadas. No se pudo inspeccionar el contenido de los archivos descargables: el intento de descargar el ZIP de Tiny RPG falló en el entorno de trabajo y no se descargó el sample de Kenney. Por tanto, no se atribuyen inventarios de archivo, resoluciones ni modularidad a muestras que no se abrieron.

**Alcance de la evidencia:** la revisión web confirma lo que las fuentes declaran en sus páginas. No equivale a ejecutar VRoid Studio, exportar un VRM ni inspeccionar paquetes ZIP/FBX/PNG. El entorno disponible no permite comprobar qué aplicaciones están instaladas en el PC personal del usuario; no se instaló software ni se intentó ejecutar archivos externos.

### J.1 Matriz comparativa

| Recurso | Evidencia | Prueba realizada | Archivos observados | Personalización | Modularidad | Licencia | Uso propuesto | Estado | Pendiente |
|---|---|---|---|---|---|---|---|---|---|
| [VRoid Studio](https://vroid.com/en/studio) | [Funciones oficiales](https://vroid.com/en/studio), [directrices de VRoid Studio](https://vroid.com/en/studio/guidelines), [directrices de VRoid Hub](https://hub.vroid.com/en/guidelines) | Lectura documental de las páginas oficiales. No se ejecutó la aplicación ni se creó/exportó un personaje. | Ninguno; no se descargó instalador ni modelo. La página documenta exportación VRM. | La página documenta controles para rostro, cuerpo, cabello, ropa, accesorios, parámetros y texturas; permite dibujar texturas con capas, editar pelo por mechones y superponer plantillas de ropa. | **Parcial para la experiencia de autoría; no demostrada como biblioteca modular integrable.** La propia guía restringe crear herramientas que generen o exporten modelos combinando mallas/texturas creadas con VRoid sin una licencia separada de pixiv. | Documentación oficial: los modelos exportados pueden usarse ampliamente, pero el contenido predeterminado de pixiv no es CC0; se aplican cláusulas especiales y licencias de materiales/terceros. Una aplicación de creación de personajes que combine/exporte esos elementos necesita consultar y obtener licencia separada de pixiv. | Herramienta externa para crear un personaje original y catalogar el VRM resultante, previa revisión de términos del contenido usado. No integrarlo como dependencia ni copiar su interfaz. | **DOCUMENTED** | Prueba práctica de creación/exportación VRM; términos vigentes; inventario y derechos de cada material usado; consulta de licencia de pixiv antes de cualquier editor integrado que combine/exporte sus mallas/texturas. |
| [Kenney Character Assets](https://kenney.itch.io/kenney-character-assets) | [Ficha oficial de Kenney en itch.io](https://kenney.itch.io/kenney-character-assets), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Lectura de ficha y disponibilidad publicada. La página anuncia un sample gratuito de 1,3 MB con 1 modelo y 4 skins; también indica que el paquete completo no está disponible actualmente. No se descargó ni abrió el sample. | **Ningún archivo observado directamente.** La ficha enumera para el paquete completo 4 modelos low-poly, 75 skins, 40 accesorios, 17 animaciones, archivos FBX, fuentes Blender, PNG, SVG/AI y paquete Unity. Esos totales no deben atribuirse al sample. | La ficha describe skins compatibles con modelos y accesorios; los archivos del sample no se inspeccionaron, así que no se confirma qué piezas incluye ni cómo están organizadas. | **No demostrada en los archivos disponibles.** La ficha sugiere modularidad a nivel del paquete completo, pero no demuestra que el sample permita combinar base + skin + accesorio en un resultado. | La ficha declara CC0 para los assets. La declaración es documental y no sustituye comprobar el contenido del archivo exacto antes de incorporarlo o redistribuirlo. | Demostrador técnico provisional, solo si el sample oficial puede descargarse e inspeccionarse. Es low-poly y no representa el acabado anime final. | **PARTIAL** | Descargar la muestra oficial en un entorno permitido; listar archivos, extensiones, tamaños y carpetas; comprobar una base, una skin y un accesorio independientes; documentar licencia incluida y formato real. |
| [Tiny RPG CC0 Characters and Portraits](https://opengameart.org/content/tiny-rpg-cc0-characters-and-portraits) | [Ficha de OpenGameArt](https://opengameart.org/content/tiny-rpg-cc0-characters-and-portraits), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | Lectura de ficha oficial. La ficha identifica al autor como **tiopalada**, declara **CC0** y ofrece `tinyrpgfacencharsdemocc0.zip` de 50,7 KB. El intento de descarga del ZIP en este entorno falló; no se intentó ejecutar nada ni repetir la descarga por otro medio. | **Ningún archivo observado directamente.** El nombre y tamaño corresponden a la ficha, no a una inspección del ZIP. La descripción indica que es una muestra de Tiny RPG Character Workshop I y Tiny RPG Face Workshop I. | No se puede confirmar resolución, formato, número de sprites/personajes/retratos, hojas de sprites ni variantes sin abrir el archivo. | **No demostrada.** La página habla de personajes y retratos de muestra, pero no acredita capas independientes de cabello, ropa o accesorios. Si solo contiene sprites completos, no debe tratarse como sistema de ensamblado. | La página declara CC0 para esta muestra y atribuye la publicación a tiopalada. La revisión práctica del archivo y su documentación no se completó; conservar el enlace a la fuente y verificar cualquier aviso incluido antes de reutilizarlo. | Candidato de bajo peso para una primera prueba de catálogo pixel art y procedencia, condicionado a poder inspeccionar la muestra. El catálogo puede probar metadatos sin prometer modularidad. | **PARTIAL** | Resolver la descarga; inspeccionar inventario, dimensiones, formatos, paleta y estructura; comprobar si hay componentes por capas o únicamente sprites completos; contrastar cualquier aviso del archivo con la ficha. |

### J.2 Hallazgos por pipeline

#### Anime 3D

VRoid Studio documenta un camino práctico para una persona sin experiencia artística: presets editables, controles visuales en tiempo real, personalización de rostro/cuerpo/pelo/ropa, capas de textura y exportación de modelos como VRM. Eso lo convierte en una buena herramienta externa para fabricar un personaje original y registrar su procedencia.

No demuestra que BotImagen pueda reutilizar legalmente las piezas predeterminadas como una biblioteca propia. La restricción más importante está expresada en las [directrices oficiales](https://vroid.com/en/studio/guidelines): una aplicación que genere o exporte modelos formados por mallas y texturas combinadas creadas en VRoid necesita una licencia separada de pixiv, salvo el caso limitado de una herramienta destinada únicamente al uso personal de su propio usuario. Por eso, antes de diseñar un editor integrado hay que consultar a pixiv y aclarar por escrito el caso de uso. Un flujo externo que importe un VRM creado por el usuario es una hipótesis distinta y también requiere validar formatos, términos y materiales concretos. No se ha demostrado en la práctica en esta tarea.

**Conclusión Anime 3D:** avanzar con cautela hacia una prueba externa de creación y catalogación de un VRM propio; no construir todavía un editor que combine/exporte componentes VRoid.

#### Pixel art

La ficha de Tiny RPG presenta un ZIP pequeño de muestra, atribuido a tiopalada y marcado CC0. Eso basta para justificar una **próxima inspección de muestra**, no para afirmar que la aplicación dispone de sprites utilizables, resoluciones conocidas o capas editables. El ZIP no se pudo descargar en este entorno, así que no se comprobó ni siquiera si contiene PNG u hojas de sprites.

**Conclusión Pixel art:** mantener Tiny RPG como candidato para probar catálogo, miniaturas, etiquetas y procedencia cuando se consiga inspeccionar el archivo. La modularidad real sigue sin demostrarse; un catálogo de sprites completos puede ser útil sin ensamblado.

#### Modularidad

Kenney anuncia para su paquete completo modelos, skins, accesorios y animaciones, y una muestra gratuita de un modelo con cuatro skins. El paquete completo figura como no disponible en la página consultada. Como no se inspeccionó la muestra, no hay evidencia directa de que el accesorio esté incluido ni de que las piezas se puedan intercambiar de forma independiente.

**Conclusión de modularidad:** todavía no se ha demostrado la operación **personaje base + skin + accesorio = personaje resultante**. Kenney sigue siendo el candidato técnico más específico, pero solo pasa a una prueba real después de inspeccionar el sample. No implementar ensamblado basándose únicamente en la descripción de la tienda.

### J.3 Estados y decisión

Los estados indican el nivel de evidencia alcanzado, no una aprobación de producción:

- `CONFIRMED`: comprobado directamente mediante una prueba o archivo observado.
- `DOCUMENTED`: respaldado por documentación/página, sin prueba práctica.
- `PARTIAL`: hay evidencia útil, pero falta una verificación esencial.
- `BLOCKED`: la comprobación no pudo realizarse por una limitación de acceso o del entorno.
- `NOT_SUPPORTED`: la característica examinada no está presente en el recurso efectivamente comprobado.

| Recurso | Decisión | Justificación |
|---|---|---|
| VRoid Studio | **CONDITIONAL** | Sí para explorar un flujo externo con personaje original y VRM; no para integrar un generador de mallas/texturas combinadas sin licencia separada de pixiv. La creación/exportación práctica sigue pendiente. |
| Kenney Character Assets | **CONDITIONAL** | La ficha declara CC0 y una muestra pequeña, pero el archivo no se inspeccionó y el paquete completo figura como no disponible. No se puede aprobar aún la prueba de combinación de piezas. |
| Tiny RPG CC0 Characters and Portraits | **CONDITIONAL** | La ficha declara CC0 y publica una muestra de 50,7 KB, apropiada en principio para una inspección de bajo coste; la descarga falló y el contenido/modularidad siguen desconocidos. |

**Siguiente prueba recomendada:** intentar, en un entorno con acceso de descarga, inspeccionar primero el ZIP de Tiny RPG por su tamaño publicado y su potencial para un catálogo pixel art. En una prueba separada, abrir el sample oficial de Kenney y comprobar si existen archivos independientes para modelo base, skin y accesorio. Si el usuario ya tiene VRoid Studio disponible, puede crear/exportar manualmente un personaje original para validar el flujo externo, sin instalarlo en el marco de esta tarea. No se recomienda elegir una única tecnología de ensamblado para los tres estilos.

### J.4 Registro de ejecución, límites y preservación

- Páginas oficiales consultadas: VRoid Studio, sus directrices, directrices de VRoid Hub, ficha de Kenney Character Assets y ficha de Tiny RPG en OpenGameArt.
- Intento de descarga: el ZIP de Tiny RPG (`tinyrpgfacencharsdemocc0.zip`, 50,7 KB según la ficha) no se descargó correctamente en el entorno. No se inspeccionó su contenido. El sample de Kenney (1,3 MB según la ficha) tampoco se descargó.
- No se comprobó si VRoid Studio está instalado en el PC personal del usuario, porque el entorno de herramientas no permite inspeccionar ese equipo. No se instaló VRoid Studio ni otro software.
- No se ejecutaron archivos externos, no se aceptaron términos adicionales, no se generaron personajes ni se exportaron VRM.
- No se incorporaron imágenes, modelos, texturas, sprites, binarios ni programas externos al repositorio.
- No se modificó código de la beta, perfiles, interfaz, backend, manifiestos ni dependencias.
- Se preservan las secciones y las incertidumbres registradas en BIMG-ASSET-002-R2 y BIMG-ASSET-003.
- **Markdown lint:** no se encontró ni ejecutó un linter Markdown mediante esta integración. La edición documental no debe interpretarse como un resultado de lint.
- **Estado final de BIMG-ASSET-004: `PARTIAL`**, porque las muestras no pudieron inspeccionarse y no hubo prueba práctica de VRoid.

### J.5 TIMER

- **Estimación solicitada:** 2–4 horas para investigación documental e inspección de muestras pequeñas.
- **Tiempo realmente empleado:** no medido.
- **Trabajo restante estimado:** 1–3 horas si las dos muestras descargan sin bloqueos; más si hace falta resolver permisos o acceso.
