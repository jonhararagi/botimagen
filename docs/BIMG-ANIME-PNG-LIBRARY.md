# BIMG · Biblioteca universal PNG + mini IA anime local

## Biblioteca universal de personajes

- Panel web conectado a «Biblioteca de PNG».
- Importación múltiple de PNG o de una carpeta completa desde Chrome/Edge.
- Validación de firma PNG real, decodificación, resolución mínima de 128 × 128 y máximo de 25 MB por archivo.
- Galería con miniaturas sobre patrón de transparencia, búsqueda, vista ampliada, descarga y eliminación.
- Persistencia local mediante IndexedDB. Las imágenes no se suben al servidor ni se incorporan automáticamente a GitHub.
- Clase de asset `universal-character` para ilustraciones completas y sprites, sin forzar una anatomía ni un esquema de capas.
- Enlaces a catálogos externos para descubrir recursos. Cada recurso necesita revisión individual de calidad y licencia.

**No se afirma que haya miles de ilustraciones precargadas:** no se deben redistribuir obras ajenas sin comprobar licencia y permiso. La biblioteca puede almacenar colecciones grandes que el usuario ya tenga derecho a usar; no hace scraping ni descarga automática de catálogos externos.

## Mini IA de diseño de personajes anime

Se añade un panel de generación local que utiliza la API de **AUTOMATIC1111 Stable Diffusion WebUI o Forge**, si el usuario instala y configura ese motor en su propio equipo. No se incluyen pesos/modelos de difusión en el repositorio, no se llama a una API de pago y no se envían prompts a un servicio remoto.

### Activación en Windows

1. Instalar localmente AUTOMATIC1111 o Forge y descargar un checkpoint anime cuyo uso permita el objetivo del usuario.
2. Activar su API local con el argumento `--api` y arrancar el motor.
3. Dejar el endpoint en `http://127.0.0.1:7860`, o configurar `BOTIMAGEN_SD_API_URL` con otra dirección de loopback y puerto local.
4. Iniciar BotImagen normalmente. Abrir «Mini IA anime», comprobar que detecta el modelo y generar.

Por seguridad, el puente rechaza destinos que no sean `127.0.0.1`, `localhost` o `::1`. El estado consulta los modelos instalados, no descarga modelos por su cuenta.

### Reglas para reducir desviaciones

- Ficha separada para identidad/arquetipo, cabello, ojos, ropa, paleta, pose, fondo y detalles.
- Prompt de arte anime profesional generado por plantilla y prompt negativo fijo contra garabatos, anatomía rota, personajes duplicados, cambios de vestuario, marcas de agua y recortes.
- Semilla numérica fija para repetir una receta; botón de variación incrementa la semilla sin borrar el resto de la ficha.
- Una sola imagen por solicitud, sin lotes ni alta resolución; tamaño 512 × 768, sampler fijo y pasos limitados a 4–16.
- Bloqueo de concurrencia para evitar varias generaciones simultáneas.
- Tiempo solicitado limitado a 30–300 segundos; al agotarse se intenta enviar `/sdapi/v1/interrupt` al motor.
- Presupuesto preventivo de RAM configurable entre 4 y 12 GB: se cancela antes de empezar si la RAM libre detectada es inferior al presupuesto elegido.

### Límites que deben quedar claros

El límite de RAM actual es una **barrera preventiva**, no una cuota dura de memoria impuesta al proceso externo. El límite de tiempo envía una orden de interrupción, pero la respuesta depende de que el motor local acepte la interrupción. BotImagen no controla el uso exacto de CPU ni puede garantizar que el motor se cierre a una hora exacta. Un tope duro de RAM/CPU requiere ejecutar el motor dentro de un proceso aislado y limitarlo mediante el sistema operativo; no se debe presentar el ajuste preventivo actual como ese aislamiento.

La semilla y las reglas reducen cambios, pero la difusión no garantiza identidad perfecta entre imágenes. Para consistencia fuerte se necesita un checkpoint apropiado y, según el motor, referencia de imagen/ControlNet/IP-Adapter o entrenamiento LoRA. No se incorpora ni entrena un LoRA automáticamente.

En un equipo con 16 GB de RAM y gráficos integrados, usar un modelo anime ligero compatible con el motor, 512 × 768 y 8–12 pasos. La generación por CPU puede tardar más de cinco minutos; si ocurre, el motor puede interrumpirse sin entregar imagen. La aplicación no cambia a un servicio en la nube como alternativa silenciosa.

## Validación

- La CI ejecuta prueba de reglas del prompt y bloqueo de endpoints remotos.
- El build web y el smoke test del editor siguen siendo puertas de aceptación.
- Pruebas manuales pendientes en Windows: conexión real con AUTOMATIC1111/Forge, generación PNG, interrupción, consumo de RAM y descarga del resultado.
- La biblioteca IndexedDB y la mini IA son funciones distintas: la imagen generada se descarga como PNG y luego puede importarse a la biblioteca.
