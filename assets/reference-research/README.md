# Catálogo de referencias externas y bases modulares para BotImagen

Estado: **PASS para la estructura y los SVG originales; PARTIAL para importar archivos externos**. Se verificaron fichas de fuentes y licencias, pero los archivos binarios externos todavía no están replicados en este repositorio. Los enlaces de origen están registrados en `manifest.json`.

## Modelos, LoRA y búsqueda de semejanzas

- **PixAI**: https://pixai.art/en/generator/image  
  Para buscar modelos comunitarios, LoRA y referencias anime. La guía oficial indica que hay que revisar modelo, LoRA, referencias y propiedad intelectual por separado: https://blog.pixai.art/en/pixai-commercial-use-licensing-guide/
- **Civitai**: https://civitai.com/models  
  Cada ficha tiene condiciones propias; registrar licencia exacta antes de descargar pesos.
- **Hugging Face**: https://huggingface.co/models?pipeline_tag=text-to-image  
  Las licencias se deben verificar en la ficha del modelo. Candidato localizado: https://huggingface.co/BackGwa/Character-LoRA-Anima, que declara uso no comercial, por lo que no se aprueba para un paquete comercial.
- **SeaArt**: https://www.seaart.ai/  
  Fuente de descubrimiento; no implica permiso para redistribuir resultados o modelos.

## Recursos de imagen con licencia comprobada en su ficha

- **Hordana, “Anime Girl / Michona” (OpenGameArt)**: https://opengameart.org/content/anime-girl  
  La ficha muestra **CC0** y lista `13jump.png`, `11walk.png` y `blink strip 5.png`. Es una referencia de sprite/animación, no un conjunto de capas de cabeza y ropa. Los enlaces directos y la atribución del autor están registrados en `manifest.json`.
- **FALLiNG_AiR, “Visual novel Character Sprite” (OpenGameArt)**: https://opengameart.org/content/visual-novel-character-sprite  
  La ficha muestra **CC0** y ofrece `character.zip` (26,2 MB), descrito como un paquete con PSD, Clip Studio y PNG. Es el candidato prioritario para evaluar capas reales, pero su contenido interno todavía no se ha inspeccionado.
- **MakeHuman Community, cartoon01**: https://static.makehumancommunity.org/assets/assetpacks/cartoon01.html  
  Catálogo de assets cartoon; verificar la licencia de cada archivo individual.

## Bases originales creadas para este repositorio

- Base completa editable: [`prepared/botimagen-modular-base-v1.svg`](prepared/botimagen-modular-base-v1.svg)
- Partes separadas con el mismo lienzo 512×768:
  - [Cuerpo](prepared/parts/body.svg)
  - [Ropa](prepared/parts/clothing.svg)
  - [Cabeza](prepared/parts/head.svg)
  - [Ojos](prepared/parts/eyes.svg)
  - [Cabello](prepared/parts/hair.svg)
  - [Marca de agua](prepared/parts/watermark.svg)

Son piezas vectoriales originales, no arte copiado de PixAI u otro autor. Se pueden abrir y editar por separado; para usarlas como conjunto deben conservar el mismo lienzo y alineación. La base está pensada para iteración y no sustituye la revisión visual de las piezas en el editor.

## Próximo paso para recursos externos

1. Descargar desde la ficha de OpenGameArt los paquetes CC0.
2. Inspeccionar el ZIP y confirmar que cada archivo interno está cubierto por la licencia declarada.
3. Guardar el original, aviso de licencia, URL, autor, fecha y SHA-256.
4. Copiar solo assets verificados a `incoming/`; preparar copias de trabajo en `prepared/`.
5. No publicar imágenes de galerías de PixAI/Civitai/SeaArt sin permisos explícitos. No incluir checkpoints ni LoRA grandes en el repositorio; registrar enlaces a sus fichas.

Una imagen plana no se convierte mágicamente en capas semánticas. La separación de cabeza, ojos, cabello, cuerpo y ropa requiere archivos por capas o revisión manual.


## Recursos CC0 incorporados y preparados

Los binarios fuente ya se descargan y verifican en la misma rama de trabajo mediante el flujo [Import verified CC0 character references](../../.github/workflows/import-cc0-assets.yml). La carpeta [incoming/opengameart](incoming/opengameart/) conserva los cuatro originales, hashes e inventarios. La carpeta [prepared/fallingair](prepared/fallingair/) incluye PNG listos para importar y archivos PSD maestros editables extraídos del ZIP CC0. El ZIP enumera 96 miembros: 66 PNG, 10 PSD y 10 archivos Clip Studio, además de 10 carpetas.

Los PSD se conservan como fuentes editables, pero todavía no se afirma que sus capas internas tengan nombres semánticos utilizables por el generador. Las tiras de Hordana son sprites de animación y no se presentan como capas de ropa/cuerpo. Ver hashes y procedencia en los inventarios JSON de cada carpeta.


## Inspección de capas e integración con BotImagen

- `prepared/fallingair/psd-layer-inventory.json` registra los nombres, visibilidad, tipo y límites de las 82 capas de los 10 PSD maestros inspeccionados.
- Los PSD de expresiones tienen capas con nombres de estados faciales; varias están etiquetadas en coreano. Las capas de algunos PSD de cuerpo usan nombres genéricos y requieren clasificación manual.
- `web/public/cc0-character-library/manifest.json` cataloga 66 PNG, sus rutas públicas, hashes, autoría y licencia declarada.
- La biblioteca universal ofrece **Añadir colección CC0** para guardar la colección en IndexedDB. El constructor de modelos ofrece **Importar colección CC0 al constructor**, que envía 65 PNG como referencias con metadatos CC0 al API local. Se mantienen como referencias hasta que alguien asigne sus roles, no se presentan como piezas semánticas ya separadas.
- Validación de código y smoke test Chromium: [run #734 PASS](https://github.com/jonhararagi/botimagen/actions/runs/38695428134).
