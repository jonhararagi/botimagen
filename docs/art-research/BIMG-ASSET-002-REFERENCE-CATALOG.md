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
