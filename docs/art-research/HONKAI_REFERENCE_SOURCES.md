# Honkai Impact 3rd · índice de referencias artísticas y recursos

Estado: investigación de fuentes públicas. Este índice **no afirma que los binarios estén descargados**. Distingue referencias visuales, modelos de referencia, herramientas de creación 3D y componentes con licencia declarada.

## A. Fuentes de Honkai para referencia visual

| Fuente | Qué buscar | Cómo usarla en BotImagen |
|---|---|---|
| [Sitio oficial de Honkai Impact 3rd](https://honkaiimpact3.hoyoverse.com/) | Personajes, atuendos, ilustraciones y dirección artística | Referencia de estilo y análisis de siluetas. No tratar imágenes visibles como archivos redistribuibles por defecto. |
| [HoYoverse: Art Collection Vol. 2](https://honkaiimpact3.hoyoverse.com/m/global/en-us/news/112263) | Arte de personajes, vestuario y diseños de versiones anteriores | Referencia editorial; comprobar qué páginas y recursos se publican realmente. |
| [HoYoLAB: ALL HONKAI 6.4 CONCEPTS! (OUTFITS + CHARACTERS)](https://www.hoyolab.com/article/16815036) | Conceptos de vestuario y variantes propuestas por la comunidad | Investigación de siluetas, capas y decisiones de diseño. No asumir que todo concepto mostrado es un plano descargable. |
| [HoYoLAB: Official Honkai 3rd MMD Model DL Links (Updated)](https://www.hoyolab.com/article/9153161) | Índice comunitario de enlaces a modelos MMD publicados mediante páginas de Bilibili | Descargar desde la fuente enlazada cuando esté disponible y revisar las condiciones que acompañen a cada modelo. Usar como referencia 3D local solo según los permisos indicados. |
| [HoYoLAB: Honkai MMD Models V5.7](https://www.hoyolab.com/article/4861805) | Otro índice de modelos MMD de personajes | Fuente adicional para localizar modelos y rastrear sus páginas de origen. Verificar cada descarga y sus términos. |
| [DeviantArt: galería de modelos MMD de Honkai Impact 3rd](https://www.deviantart.com/oz-sys/gallery/90867715/mmd---honkai-impact-3rd---models) | Modelos y publicaciones comunitarias | Inspeccionar publicación por publicación; registrar autor, fuente y condiciones antes de usar o redistribuir. |
| [Skowt: Honkai Impact 3rd assets](https://skowt.cc/games/honkai-impact-3rd) | Índice de recursos del juego | Útil para localizar nombres y tipos de assets. No copiar archivos extraídos al repositorio sin verificar origen y autorización. |
| [Honkai Impact 3rd Wiki: imágenes](https://honkaiimpact3.fandom.com/wiki/Category:Images) | Arte e imágenes indexadas por la comunidad | Referencia y descubrimiento; seguir el enlace de origen de cada imagen. |

## B. Herramientas y bases 3D para construir un creador propio

| Fuente | Función | Evaluación inicial |
|---|---|---|
| [Blender](https://www.blender.org/) | Modelado, materiales, rigging, render y exportación | Herramienta principal recomendada para un flujo 3D original y automatizable. |
| [CharMorph](https://github.com/Upliner/CharMorph) | Generación paramétrica de personajes dentro de Blender | Investigar como posible base de cuerpo y personalización. Revisar las licencias exactas del complemento y de cada modelo base antes de incorporarlos. |
| [MakeHuman](https://www.makehumancommunity.org/) | Generación de mallas humanas parametrizadas | Posible base técnica para anatomía; por sí sola no proporciona el estilo anime de Honkai. Revisar licencias de modelos y complementos. |
| [Blend Swap: character base meshes](https://blendswap.com/3d/character-base-mesh) | Modelos base comunitarios para Blender | Buscar por licencia, formato, rig y calidad. Cada modelo tiene sus propias condiciones. |
| [Meshy: modelos 3D anime](https://www.meshy.ai/tags/anime) | Catálogo de modelos y flujo de generación/descarga | Fuente para explorar modelos de referencia; confirmar licencia y términos en cada ficha antes de incorporarlos. |

**Arquitectura propuesta:** Blender para el autorado 3D y el render de referencias; BotImagen para la biblioteca, los perfiles OC, los cambios de vestuario, las fichas de diseño y la preparación de referencias para generadores. No hacer depender el editor de un único sitio externo.

## C. Recurso modular con licencia declarada para probar el ensamblador 2D

[OpenGameArt: 16x16 character sheet with separate clothing layers](https://opengameart.org/content/16x16-character-sheet-with-separate-clothing-layers)

La página declara CC BY 4.0 y describe hasta cinco capas recoloreables. Autor indicado: Chrisf. Es útil para probar técnicamente las capas, no como arte final de alta fidelidad: es pixel art de 16×16. Si se descarga e integra, guardar atribución, URL, licencia y fecha de consulta junto al archivo.

## D. Tipos de material: no confundirlos

- **Hoja de diseño / concept art:** muestra apariencia, detalles o variantes, pero puede no incluir medidas ni archivos editables.
- **Modelo MMD / FBX / OBJ / GLB / BLEND:** geometría 3D que puede servir para observar el personaje o generar vistas, según formato, rig, texturas y permisos.
- **Texturas y mapas:** imágenes aplicadas a una malla; no son por sí solas prendas 2D separadas.
- **Assets extraídos del juego:** no son automáticamente redistribuibles ni adecuados para publicar en GitHub.
- **Pieza modular 2D:** PNG con transparencia y encuadre, anclajes, orden de capa y compatibilidad validados.
- **Referencia de fan:** puede tener condiciones distintas de la obra oficial; verificar la publicación concreta.

## E. Metadatos requeridos por recurso

Registrar URL original, autor si está disponible, fecha de consulta, licencia o permiso conocido, formato, dimensiones, SHA-256, categoría, estado de validación y restricciones de redistribución.

Estados permitidos:
- `reference_only`
- `component_candidate`
- `component_validated`
- `license_review`
- `redistribution_approved`

No etiquetar como aprobado un recurso solo porque sea accesible sin iniciar sesión.

## F. Ruta práctica de implementación

1. Descargar y revisar recursos desde las fuentes de origen, empezando por modelos MMD publicados con instrucciones de uso y componentes de prueba con licencia explícita.
2. Mantener referencias completas en una biblioteca separada de las piezas del ensamblador.
3. Probar si los modelos 3D compatibles pueden abrirse en Blender y renderizarse con vistas frontal, lateral, posterior y de detalle; guardar la procedencia de cada modelo.
4. Crear una base de personaje original y prendas originales en una dirección visual anime/ciencia ficción. Usar referencias para guiar la estética, no asumir que un modelo importado se convierte automáticamente en un creador modular.
5. Exportar renders de referencia y fichas estructuradas del OC desde BotImagen.
6. Integrar al catálogo 2D solo piezas que tengan transparencia, anclajes y oclusión validados.

## Límite y estado real

La investigación localizó páginas y catálogos públicos, pero no descargó archivos binarios en este commit. El conector de GitHub utilizado para modificar este documento crea archivos de texto; no sube imágenes ni modelos binarios. Para integrar archivos reales hace falta una sesión de repositorio con capacidad de transferencia de binarios, por ejemplo el workspace de desarrollo sincronizado, Git LFS para archivos grandes cuando proceda, o un flujo de descarga controlada que guarde los archivos y sus metadatos antes de hacer commit.

La meta no es acumular enlaces: es conseguir un personaje OC que se pueda editar, vestir, guardar y renderizar desde un flujo 2D/3D verificable.
