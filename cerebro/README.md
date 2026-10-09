# Cerebro de BotImagen

Este directorio es la memoria operativa y la fuente de dirección técnica de la evolución de BotImagen. Debe leerse antes de abrir una línea de trabajo importante.

## Documentos

- **INSTRUCCIONES.md**: reglas permanentes para planificar, modificar, probar y reportar cambios.
- **ARQUITECTURA.md**: tecnologías y límites de la arquitectura acordada.
- **PLAN_MAESTRO.md**: fases, tareas, dependencias y TIMER estimado de cada trabajo.
- **ESTADO_ACTUAL.md**: punto de partida verificado y funciones que todavía no deben darse por terminadas.

## Misión

Convertir BotImagen en un editor modular de personajes con una interfaz web interactiva que funcione localmente en Windows, reutilizando lo que ya sirve del motor Python. Debe permitir combinaciones visuales muy amplias, gestionar referencias e imágenes y mantener abierta una ruta futura hacia una aplicación de escritorio y, por separado, una experiencia web remota.

## Estado actual

La dirección técnica y la continuidad están guardadas en GitHub. La auditoría BIMG-002 está cerrada y el primer prototipo React/TypeScript/Vite de BIMG-003 ya está implementado en `web/`. El build pasa en GitHub Actions run #56: https://github.com/jonhararagi/botimagen/actions/runs/37882017431.

**No declarar beta ni migración completa:** la interfaz aún usa un subconjunto local temporal del catálogo, no está conectada a `character_generator.py`, no incluye la biblioteca de imágenes y no se ha probado en un navegador real/Windows. BIMG-003 permanece PARTIAL hasta que se añada `package-lock.json` y se complete ese smoke test. Después debe comenzar BIMG-004, el servicio local seguro.

## Regla de continuidad

Antes de trabajar, verificar el HEAD real de main y leer INSTRUCCIONES.md, ARQUITECTURA.md, PLAN_MAESTRO.md y ESTADO_ACTUAL.md. Después de trabajar, actualizar la documentación de estado con hechos, pruebas y enlaces verificables.
