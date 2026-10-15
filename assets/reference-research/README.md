# Catálogo de referencias externas para BotImagen

Estado: **investigación inicial, no paquete de imágenes descargadas**  
Objetivo: encontrar personajes anime y recursos de modelos/LoRA que sirvan para estudiar siluetas y preparar bases 2D desmontables (cuerpo, cabeza, ojos, cabello, ropa y accesorios).

## Fuentes revisadas

### Generación y búsqueda de modelos/LoRA
- **PixAI** — https://pixai.art/en/generator/image  
  Útil para buscar modelos comunitarios, LoRA y referencias anime. Las imágenes de la galería y los modelos no se copian aquí automáticamente: hay que revisar los permisos de cada recurso antes de incorporarlo al repositorio. La guía pública de PixAI recuerda que la licencia de cada LoRA/modelo y los derechos de terceros siguen importando: https://blog.pixai.art/en/pixai-commercial-use-licensing-guide
- **Civitai** — https://civitai.com/models  
  Catálogo de checkpoints y LoRA; cada ficha puede tener una licencia distinta. Términos oficiales: https://civitai.com/content/tos
- **Hugging Face** — https://huggingface.co/models?pipeline_tag=text-to-image  
  Las fichas muestran la licencia declarada por el publicador. Ejemplo localizado durante la búsqueda: https://huggingface.co/BackGwa/Character-LoRA-Anima (licencia no comercial declarada; **no** incluir sus pesos en un paquete comercial).
- **SeaArt** — https://www.seaart.ai/  
  Otra fuente de búsqueda visual/modelos. Revisar licencia del modelo, términos de la plataforma y permisos de la imagen concreta antes de copiar archivos.

### Recursos 2D con licencia abierta que merece la pena evaluar primero
- **OpenGameArt: Visual Novel Character Sprite (CC0 declarado en la ficha)** — https://opengameart.org/content/visual-novel-character-sprite  
  La ficha menciona PNG, PSD y archivos de Clip Studio; el ZIP es grande. Revisar el paquete y guardar copia de la licencia/ficha antes de incorporarlo.
- **MakeHuman Community: cartoon01** — https://static.makehumancommunity.org/assets/assetpacks/cartoon01.html  
  Catálogo de assets cartoon/anime-like con varias entradas etiquetadas CC0, incluidos ejemplos de cabezas y cuerpos. Verificar el archivo individual y su origen antes de copiarlo.

## Política para llenar la carpeta de imágenes

1. Priorizar recursos **CC0, dominio público o licencias explícitas compatibles** con la distribución de BotImagen.
2. No descargar en masa ni volver a publicar arte de usuarios de PixAI/Civitai/SeaArt solo porque la página sea visible.
3. Por cada archivo incorporado, guardar URL de origen, autor, licencia exacta, fecha de consulta, SHA-256 y cualquier requisito de atribución en manifest.json.
4. No empaquetar checkpoints/LoRA grandes dentro del repositorio. Registrar enlaces y licencias; el usuario puede descargar modelos directamente de su autor.
5. Mantener originales intactos. Las marcas de agua «BotImagen · BASE» se aplican solo a copias derivadas preparadas para el editor, no a la referencia fuente.
6. Para el generador, marcar de forma manual las regiones de cabeza, ojos, cabello, torso, brazos, piernas y ropa. Una imagen plana no se convierte automáticamente en capas semánticas perfectas.

## Estructura

- manifest.json: fuentes revisadas y estado de derechos.
- incoming/: lugar para assets de licencia confirmada antes de procesarlos.
- prepared/: copias de trabajo preparadas para el compositor; conservar procedencia en el manifiesto.

No se colocaron imágenes de terceros en este commit porque las páginas de búsqueda no conceden por sí solas permiso para redistribuir sus imágenes. Esta carpeta deja las fuentes investigadas y la trazabilidad listas sin introducir material de licencia incierta.
