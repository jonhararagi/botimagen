# BIMG · Biblioteca universal de personajes anime PNG

## Objetivo

Añadir una clase de asset universal para ilustraciones de personajes completos y sprites PNG, independiente de si después se usarán como referencia visual, personaje de perfil o material para segmentación modular.

## Incluido en esta entrega

- Panel web conectado al acceso «Biblioteca de PNG».
- Importación múltiple de PNG o de una carpeta completa desde Chrome/Edge.
- Validación de firma PNG real, imagen decodificable, resolución mínima de 128 × 128 y límite de 25 MB por archivo.
- Galería con miniaturas sobre patrón de transparencia, nombre, dimensiones, tamaño, búsqueda, vista ampliada y descarga del original.
- Almacenamiento local en IndexedDB del navegador. Los archivos no se envían al servidor ni se añaden automáticamente al repositorio.
- Clase inicial fija: `universal-character`, destinada a personajes completos y sprites. No fuerza una anatomía ni un esquema de capas.

## Límites importantes

Esta entrega **no incluye miles de ilustraciones precargadas**. El repositorio no debe llenarse con arte de terceros sin verificar licencia, atribución y permisos de redistribución. La biblioteca permite inspeccionar colecciones grandes que el usuario ya tenga derecho a utilizar, pero no descarga ni licencia imágenes por su cuenta.

La importación y la galería tampoco realizan segmentación semántica automática: un PNG de personaje completo sigue siendo una imagen completa. Separar cabello, cuerpo, ropa, accesorios y zonas ocultas requiere una etapa posterior del constructor modular.

El almacenamiento disponible depende de la cuota del navegador y del espacio libre. Si una carpeta supera esa cuota, los archivos que fallen se notifican en el estado de importación; no se afirma que se hayan guardado.

## Validación pendiente

- Ejecutar `npm ci` y `npm run build` en `web/`.
- Verificar importación de PNG válido, rechazo de archivos renombrados con otra extensión, persistencia al recargar, búsqueda, vista ampliada, descarga y eliminación.
- Probar una carpeta de varios cientos de archivos y revisar el uso de memoria.
- Prueba física en Windows 11 aún no realizada por esta entrega.
