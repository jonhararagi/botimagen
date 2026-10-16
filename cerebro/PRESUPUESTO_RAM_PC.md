# Presupuesto de memoria de BotImagen para PC

**Equipo objetivo:** Ryzen 5 5600G con gráficos integrados. BotImagen debe reservar memoria para Windows y otras aplicaciones, por lo que no debe asumir que toda la RAM del equipo está libre.

## Límites de producto

- **Objetivo de consumo total del proceso de trabajo:** hasta 2 GiB en uso normal.
- **Techo absoluto de aceptación:** 3 GiB. Si se supera durante un flujo habitual, el trabajo se considera bloqueado hasta corregirlo.
- **Presupuesto inicial de la interfaz web (heap JavaScript después de carga y estabilización):** hasta 300 MiB en la prueba automatizada de Chromium. Es un indicador parcial, no representa toda la memoria del navegador.
- **IA generativa:** desactivada por defecto y fuera del presupuesto básico. No descargar ni iniciar modelos grandes automáticamente.

## Reglas de implementación

1. Preferir el renderizador SVG 2D y las capas PNG locales; no cargar modelos neuronales para crear, editar, guardar o exportar un personaje.
2. Mantener miniaturas pequeñas en galerías. Decodificar el PNG de resolución completa solo al abrirlo o usarlo en la composición.
3. Limitar importaciones a imágenes con dimensiones y tamaño razonables; rechazar entradas extremas antes de decodificarlas o crear copias RGBA.
4. No mantener simultáneamente múltiples copias innecesarias de una imagen (archivo, Data URL base64, canvas temporal y bitmap decodificado).
5. Liberar object URLs, canvases temporales, bitmaps y buffers cuando cambie la selección o termine la exportación.
6. Las tareas por lotes deben procesar una imagen a la vez y permitir cancelación. Nunca cargar una carpeta completa a resolución completa en memoria.
7. El catálogo y los perfiles son metadatos ligeros. No duplicar los catálogos completos en varios estados de React.
8. La exportación estándar es PNG transparente de 512 × 768. Una exportación mayor debe ser una acción explícita y tener validación de memoria.

## Validación y evidencia

- La CI ejecuta una prueba Chromium que espera a que el motor local y la vista SVG inicial estén listos, solicita recolección de basura cuando Chromium lo permite y verifica que el heap JavaScript usado quede por debajo de 300 MiB.
- Esta prueba es una alarma de regresión del heap JavaScript; **no demuestra** el consumo total de RAM de Chrome, Python, Vite, Windows ni de la GPU.
- Antes de declarar PASS para el límite total de 2/3 GiB, hay que medir en Windows 10/11 con el Administrador de tareas o el Monitor de rendimiento mientras se carga el catálogo, se importan PNG, se separan piezas, se cambia entre perfiles y se exporta.
- Registrar el pico de memoria y la revisión exacta del commit. Sin una medición en el PC real, el límite total permanece **PENDIENTE DE VALIDACIÓN EN WINDOWS**.

## TIMER

- Integración de presupuesto y smoke test automatizado: 1–2 h estimadas.
- Medición completa en el PC objetivo y corrección de regresiones: 1–3 h estimadas, según los picos observados.
