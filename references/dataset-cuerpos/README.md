# Dataset de referencia corporal de BotImagen

Este directorio contiene los PNG originales 0.png–15.png utilizados para estudiar proporciones, silueta y poses. El repositorio es público: las imágenes fuente son accesibles y descargables.

## Referencias examinadas para BIMG-ENGINE-009-R3

- **12.png (768×1280)**: principal candidata frontal de cuerpo completo. Se utiliza únicamente para orientar proporciones y landmarks aproximados; los brazos están ligeramente separados del torso y un tobillo queda parcialmente oculto.
- **15.png (768×1280)**: segunda comparación de cuerpo completo; presenta desplazamiento de cadera y tobillos cruzados, por lo que no se trata como pose neutral.
- **4.png (768×1280)**: cuerpo completo orientado al frente con desplazamiento de cadera y tobillos cruzados.
- **5.png (768×1280)**: silueta completa en tres cuartos, con manos en la cadera y codos flexionados.
- **6–11.png y 13–14.png (768×1280)**: las imágenes inspeccionadas sirven principalmente como referencias de pose, por recortes, giros fuertes o extremidades superpuestas.
- **0–3.png**: su clasificación visual permanece pendiente. No deben usarse para calibrar el cuerpo hasta revisarlas individualmente.

Las medidas empleadas por el motor son adaptaciones esquemáticas de relaciones visuales normalizadas al lienzo 340×490. No son captura de movimiento ni medidas clínicas, y no implican que el resultado reproduzca perfectamente una referencia.

## Auditoría reproducible

El workflow ejecuta tools/assets/audit_body_references.py, que calcula SHA-256 sobre los bytes originales, registra dimensiones y modo, valida que cada PNG pueda decodificarse, cuenta transparencia y calcula márgenes aproximados frente al fondo casi blanco. El inventario JSON se publica dentro del artefacto de QA de CI, sin copiar los originales a recursos del producto.

## Derechos y uso

La licencia y procedencia de estos dibujos no se han verificado. Hasta confirmar los permisos, deben usarse como referencias internas de proporciones; no se incorporan los píxeles al producto ni se redistribuyen como assets. El inventario no elimina ni modifica archivos originales.
