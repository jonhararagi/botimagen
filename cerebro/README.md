# Cerebro de BotImagen

Este directorio es la memoria operativa y la fuente de dirección técnica de la evolución de BotImagen. Debe leerse antes de abrir una línea de trabajo importante.

## Documentos

- **INSTRUCCIONES.md**: reglas permanentes para planificar, modificar, probar y reportar cambios.
- **ARQUITECTURA.md**: tecnologías y límites de la arquitectura acordada.
- **PLAN_MAESTRO.md**: fases, tareas, dependencias y TIMER estimado de cada trabajo.
- **ESTADO_ACTUAL.md**: punto de partida verificado y funciones que todavía no deben darse por terminadas.

## Misión

Convertir BotImagen en un editor modular de personajes con una interfaz web interactiva que funcione localmente en Windows, reutilizando lo que ya sirve del motor Python. Debe permitir combinaciones visuales muy amplias, gestionar referencias e imágenes y mantener abierta una ruta futura hacia una aplicación de escritorio y, por separado, una experiencia web remota.

## Estado de este commit

Esta entrega crea la hoja de dirección técnica y la memoria de continuidad. **No implementa todavía la nueva interfaz web ni afirma que el producto beta esté terminado.**

Punto de partida registrado: main en 0a23a7136632d4e66ecee5f871ea40a47ea324e4 antes de esta documentación. El siguiente trabajo es verificar el entorno, las pruebas existentes y el comportamiento actual; después se inicia el esqueleto web sin eliminar la aplicación que ya funciona.

## Regla de continuidad

Antes de trabajar, verificar el HEAD real de main y leer INSTRUCCIONES.md, ARQUITECTURA.md, PLAN_MAESTRO.md y ESTADO_ACTUAL.md. Después de trabajar, actualizar la documentación de estado con hechos, pruebas y enlaces verificables.
