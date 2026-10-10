# Cerebro de BotImagen

Este directorio es la memoria operativa y la fuente de dirección técnica de la evolución de BotImagen. Debe leerse antes de abrir una línea de trabajo importante.

## Documentos

- **INSTRUCCIONES.md**: reglas permanentes para planificar, modificar, probar y reportar cambios.
- **ARQUITECTURA.md**: tecnologías y límites de la arquitectura acordada.
- **PLAN_MAESTRO.md**: fases, tareas, dependencias y TIMER estimado de cada trabajo.
- **ESTADO_ACTUAL.md**: punto de partida verificado y funciones que todavía no deben darse por terminadas.
- **PROGRESO.md**: porcentaje global ponderado hacia la beta local, reglas de cálculo y contribuciones de cada fase.
- **VISION_CREADOR_PERSONAJES.md**: visión de largo plazo para BotImagen Character Studio, con personalización modular inspirada en creadores como Koikatsu y tres direcciones artísticas: sci-fi anime inspirado en NIKKE, pixel art y Toon Style.

## Misión de la beta actual

Estabilizar un editor modular de personajes con una interfaz web interactiva que funcione localmente en Windows y reutilice el motor Python existente. La beta se centra en perfiles, opciones de catálogo, generación de prompts, guardado y las demás capacidades enumeradas en el plan maestro y estado verificado.

## Visión del producto a largo plazo

La dirección creativa futura está documentada en [VISION_CREADOR_PERSONAJES.md](VISION_CREADOR_PERSONAJES.md). Es una meta para explorar por etapas, no una declaración de que ya exista un creador 3D, un renderizador completo o un catálogo casi infinito.

La herramienta debe servir para diseñar personajes destinados a distintos videojuegos, historias, novelas, cómics y proyectos personales. BaseWarriors: Meta-Strike es uno de los proyectos que podrá beneficiarse de BotImagen, no su único destino.

Los tres estilos deseados son paquetes diferenciados. No se deben mezclar automáticamente, y cada uno puede necesitar recursos o un flujo técnico distinto.

## Estado actual

Consultar [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md) y [PROGRESO.md](PROGRESO.md) antes de declarar una tarea completa. El porcentaje de progreso mide exclusivamente la beta local definida en el plan, no toda la visión futura del producto.

No afirmar que una función está implementada solo porque figure en la visión. Verificar código y pruebas, y distinguir CI automatizada de QA física en Windows.

## Regla de continuidad

Antes de trabajar, verificar el HEAD real de main y leer INSTRUCCIONES.md, ARQUITECTURA.md, PLAN_MAESTRO.md, ESTADO_ACTUAL.md y esta visión cuando la tarea afecte el alcance creativo. Después de trabajar, actualizar la documentación de estado con hechos, pruebas y enlaces verificables.
