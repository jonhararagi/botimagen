# Cerebro de BotImagen

Este directorio es la memoria operativa y la fuente de dirección técnica de la evolución de BotImagen. Debe leerse antes de abrir una línea de trabajo importante.

## Documentos

- **INSTRUCCIONES.md**: reglas permanentes para planificar, modificar, probar y reportar cambios.
- **ARQUITECTURA.md**: tecnologías y límites de la arquitectura acordada.
- **PLAN_MAESTRO.md**: fases, tareas, dependencias y TIMER estimado de cada trabajo.
- **ESTADO_ACTUAL.md**: punto de partida verificado y funciones que todavía no deben darse por terminadas.
- **PROGRESO.md**: porcentaje global ponderado hacia la beta local, reglas de cálculo y contribuciones de cada fase.

## Misión

Convertir BotImagen en un editor modular de personajes con una interfaz web interactiva que funcione localmente en Windows, reutilizando lo que ya sirve del motor Python. Debe permitir combinaciones visuales muy amplias, gestionar referencias e imágenes y mantener abierta una ruta futura hacia una aplicación de escritorio y, por separado, una experiencia web remota.

## Estado actual

La auditoría BIMG-002 está cerrada. La UI React/TypeScript/Vite consume el catálogo y `CharacterGenerator` mediante el servicio local `botimagen_server.py`; la API valida las opciones, genera prompts y permite guardar, listar y leer perfiles locales. CI #60 pasó, incluyendo UI de perfiles: https://github.com/jonhararagi/botimagen/actions/runs/37887835609.

**No declarar la beta completa:** faltan `package-lock.json`, la biblioteca visual, el intake web y el smoke test en navegador/Windows, que sigue NOT_RUN. El progreso ponderado hacia la beta local figura en [PROGRESO.md](PROGRESO.md).

## Regla de continuidad

Antes de trabajar, verificar el HEAD real de main y leer INSTRUCCIONES.md, ARQUITECTURA.md, PLAN_MAESTRO.md y ESTADO_ACTUAL.md. Después de trabajar, actualizar la documentación de estado con hechos, pruebas y enlaces verificables.
