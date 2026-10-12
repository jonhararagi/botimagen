# Procedencia y licencias de la biblioteca visual

## Recursos originales incluidos en esta entrega

Los fondos SVG de `assets/backgrounds/`, los dos emblemas SVG de `assets/ui/` y los presets JSON de `assets/characters/` se crearon específicamente para la interfaz y las pruebas de BotImagen Studio. No se han copiado de los repositorios de referencias enumerados en el encargo ni contienen imágenes de personajes de terceros.

En el catálogo se identifican como `LicenseRef-BotImagen-Original-Assets`. Esta etiqueta no pretende declarar los recursos como CC0 o MIT: indica que son originales del proyecto y que su reutilización queda sujeta a los términos del repositorio y a los derechos de su titular. La atribución de estos recursos se conserva por trazabilidad: **BotImagen Studio · recurso original creado para este repositorio**.

## Código de terceros separado de los assets

- `vendor/anime_character_creator/` incorpora código de `rhedak/anime-character-creator` bajo MIT. Su aviso de licencia debe permanecer junto al código vendorizado. La licencia del código no se extiende automáticamente a imágenes de referencia o ejemplos externos.
- No se incorporan imágenes de `dsh-whale-galgame`, `charactercreator`, Kenney ni Universal LPC en esta biblioteca inicial. Por lo tanto, no se atribuye a esos repositorios la autoría de los SVG creados aquí ni se presume una licencia común para sus recursos.
- `references/dataset-cuerpos/` permanece fuera de esta biblioteca de producto y su revisión de procedencia/licencia sigue siendo independiente y pendiente.

El catálogo `assets/visual_asset_catalog.json` es la fuente de metadatos por recurso. El validador rechaza rutas externas o fuera del repositorio, recursos ausentes y campos de procedencia/licencia incompletos.
