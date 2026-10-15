# PixAI · receta de bajo consumo para Gen Pibara V1

**Objetivo:** probar la LoRA Gen Pibara V1 con el menor gasto posible y evaluar si respeta un personaje anime de cuerpo completo, frontal y centrado.

- LoRA oficial: https://pixai.art/en/model/2035047104781084932/2035126237569336174
- Autor que figura en la página pública: eltio otaku.
- La ficha pública muestra el token `pibara gen` entre las etiquetas sugeridas. Puede activar rasgos específicos de la identidad entrenada; no debe confundirse con un token de estilo neutro.
- Esta receta no descarga ni redistribuye los pesos de la LoRA. Se utiliza desde PixAI y siempre sujeta a las condiciones que muestre la plataforma y la ficha del modelo.

## Protocolo de prueba

1. Abrir la ficha oficial y seleccionar Gen Pibara V1 en el generador de PixAI.
2. No ejecutar un lote. Hacer **una sola generación de prueba** con resolución moderada y el ajuste de menor coste que siga siendo útil.
3. Si el control de intensidad está disponible, empezar por **0,7** como valor experimental, no como valor óptimo garantizado.
4. Usar el prompt positivo generado desde el Creador de personajes de BotImagen y copiar también el negative prompt.
5. Mantener fija la semilla al comparar ajustes, si PixAI permite fijarla. Cambiar solo una variable por prueba.
6. Revisar primero: personaje completo sin recortes, vista frontal, fondo blanco, manos y calzado visibles, cabello y prendas reconocibles.
7. Si el token `pibara gen` hace que la LoRA fuerce demasiado la identidad aprendida y desobedezca el diseño, hacer como máximo una comparación controlada sin ese token. No lanzar variaciones en lote.
8. Guardar la imagen elegida y registrar semilla, intensidad, modelo base, resolución, pasos y coste mostrado por PixAI. No repetir una receta ya evaluada.

## Qué cambia en BotImagen

La sección **«Prueba económica · PixAI Gen Pibara V1»** del creador simple prepara un prompt con los valores actuales de cuerpo, piel, peinado, color de cabello, ojos, ropa y accesorio. Los botones de copia y el enlace oficial no generan imágenes y no consumen créditos de generación.

## Límite de integración

El generador local de BotImagen (AUTOMATIC1111/Forge) y la LoRA alojada en PixAI son rutas distintas. La receta no afirma que la LoRA esté instalada localmente ni que exista una API PixAI configurada. La integración automática requeriría un método oficial disponible, credenciales gestionadas de forma segura y verificar sus costes y permisos. No guardar claves, cookies ni tokens en GitHub.

## Procedencia y derechos

La ficha oficial es la fuente de referencia. No descargar, redistribuir ni empaquetar la LoRA o imágenes de terceros sin verificar permisos. La marca o atribución informativa no sustituye una licencia.