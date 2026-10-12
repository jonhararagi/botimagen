# Honkai Impact 3rd · índice de referencias artísticas y recursos

Estado: investigación inicial; no implica que los archivos binarios estén descargados ni integrados en el catálogo de componentes.

Este índice separa **referencias de estudio**, **modelos para herramientas específicas** y **recursos reutilizables con licencia identificada**. No registrar una referencia como pieza modular ni redistribuir su archivo hasta verificar su origen y sus condiciones.

## Fuentes localizadas

| Fuente | Tipo | Uso previsto | Estado para incluir binarios en este repositorio |
|---|---|---|---|
| [Honkai Impact 3rd · sitio oficial](https://honkaiimpact3.hoyoverse.com/) | Referencia oficial del juego | Identidad visual, personajes, vestuario y dirección artística | Referencia/enlace. No se descargan ilustraciones oficiales al repositorio por defecto. |
| [Art Collection Vol. 2: The Moon's Origin and Finality](https://honkaiimpact3.hoyoverse.com/m/global/en-us/news/112263) | Anuncio oficial de libro de arte y diseños | Investigar hojas de diseño, bocetos y decisiones de vestuario | Referencia/enlace. No asumir que las imágenes publicadas tienen licencia de redistribución. |
| [HoYoLAB: Official Honkai 3rd MMD Model DL Links (Updated)](https://www.hoyolab.com/article/9153161) | Índice comunitario de enlaces a modelos publicados en páginas oficiales de Bilibili | Referencia 3D, siluetas y estudio de vestuario; posible flujo de render de referencia | Verificar los términos de cada paquete y su formato antes de descargar, convertir o redistribuir. Los modelos MMD no son piezas 2D listas para ensamblar. |
| [Honkai Impact 3rd Wiki · Category: Images](https://honkaiimpact3.fandom.com/wiki/Category:Images) | Archivo comunitario de imágenes | Buscar arte conceptual y variantes visuales, registrando la página de origen | Solo referencia hasta verificar fuente, atribución y permiso aplicable a cada archivo. |
| [Skowt · Honkai Impact 3rd assets](https://skowt.cc/games/honkai-impact-3rd) | Índice de assets del juego, incluyendo arte y hojas de personajes | Localizar referencias por categoría | No copiar en bloque al repositorio. Tratar como referencia hasta verificar origen y condiciones de uso de cada recurso. |
| [OpenGameArt · 16x16 character sheet with separate clothing layers](https://opengameart.org/content/16x16-character-sheet-with-separate-clothing-layers) | Ejemplo de sprite modular con hasta cinco capas | Prueba técnica de capas y recoloreado, no modelo visual final | La página declara CC BY 4.0. Antes de empaquetarlo, conservar atribución al autor Chrisf, enlace de origen y licencia. Es pixel art 16×16 y no satisface por sí solo la dirección anime de alta fidelidad. |

## Clasificación obligatoria al importar

- `reference_only`: ilustración completa, captura o arte conceptual que solo guía el diseño.
- `component_candidate`: archivo potencialmente separable; todavía no validado anatómicamente.
- `component_validated`: pieza con transparencia, anclajes, capa, compatibilidad y prueba visual confirmadas.
- `license_review`: origen o condiciones pendientes de comprobación.
- `redistribution_approved`: recurso cuya licencia o autorización se ha comprobado y documentado para la distribución prevista.

Cada archivo importado debe registrar URL de origen, autor si está disponible, fecha de consulta, licencia/permiso conocido, SHA-256, formato, dimensiones y estado de validación. No inferir licencia por el mero hecho de que una imagen sea visible o descargable.

## Próxima tarea técnica

1. Priorizar referencias de diseños y vestuario de Honkai para análisis visual.
2. Buscar recursos originales de fans que declaren expresamente permiso de reutilización o licencias compatibles.
3. Descargar primero solo recursos con condiciones verificadas; conservar el archivo de licencia/atribución junto al recurso.
4. Importar referencias completas en la colección de referencias, no en el ensamblador de piezas.
5. Construir piezas originales inspiradas en rasgos generales del género anime/ciencia ficción cuando no existan componentes con permiso verificable.
6. No incluir en commits públicos paquetes de modelos extraídos, archivos de juego o arte de terceros solo porque estén accesibles en la web.

## Límite de esta entrega

Este documento registra fuentes encontradas durante la investigación inicial. No afirma que se hayan descargado imágenes, modelos MMD o paquetes de juego. La integración de binarios debe realizarse por una vía que preserve la licencia, la atribución y el origen de cada archivo; el conector de GitHub usado para este cambio solo permite crear archivos de texto, no subir binarios de imágenes/modelos.
