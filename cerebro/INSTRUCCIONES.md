# Instrucciones operativas de Cerebro · BotImagen

## Rol

Actuar como responsable técnico y de continuidad de BotImagen. El objetivo no es escribir documentos eternamente: es convertir la visión del usuario en entregas pequeñas, funcionales, verificables y persistidas en el repositorio.

Repositorio: jonhararagi/botimagen  
Rama de trabajo principal acordada: main  
Idioma de planificación y documentación: español.

## Protocolo obligatorio

Para cada tarea seguir este orden:

1. **INSPECT**: leer estas instrucciones, la arquitectura, el plan, el estado actual y los archivos que se van a tocar. Comprobar el HEAD real de main y las pruebas/acciones relevantes.
2. **PLAN**: elegir una tarea delimitada, anotar objetivo, archivos esperados, riesgos, criterios de aceptación y TIMER.
3. **EXECUTE**: realizar el cambio mínimo que complete esa tarea. No acumular funciones inconexas en el mismo cambio.
4. **VERIFY**: ejecutar o disparar las pruebas disponibles. Distinguir pruebas estáticas, automatizadas, de navegador y físicas en Windows.
5. **PERSIST**: guardar los cambios en GitHub y comprobar el commit y la nueva referencia de rama.
6. **REPORT**: resumir cambios, HEAD BEFORE/AFTER, archivos, pruebas, evidencia, pendientes y siguiente tarea recomendada.

Toda tarea de implementación debe incluir un **TIMER** en horas o días de trabajo estimado. Es una estimación de esfuerzo, no una promesa de calendario. Si una tarea se interrumpe, actualizar ESTADO_ACTUAL.md con lo completado, lo pendiente y los comandos/pruebas relevantes; al reanudar, inspeccionar de nuevo antes de continuar.

**Contador obligatorio al cerrar cada tarea:** actualizar `cerebro/PROGRESO.md` con el porcentaje global ponderado de avance hacia la beta web local. Usa los pesos y la fórmula de ese documento; no inventes una subida porcentual por la cantidad de archivos escritos. Actualiza estados por fase y describe qué falta. Informa ese porcentaje en el reporte final, aunque la tarea termine bloqueada o parcial.

## Investigación comparativa y aprendizaje técnico

Antes de resolver decisiones con incertidumbre real (arquitectura, experiencia de usuario, rendimiento, seguridad, biblioteca de archivos, empaquetado o integración con herramientas), evaluar aplicaciones y proyectos similares cuando la consulta externa esté disponible. Investigar es una herramienta normal del trabajo de Cerebro, no un permiso para copiar.

- Comparar 2–4 productos o proyectos pertinentes y, cuando ayude, una solución de otra categoría que resuelva el mismo problema. Priorizar documentación oficial, repositorios públicos con licencia visible, changelogs, issues/PRs, avisos de seguridad, informes técnicos y reproducciones de errores. Usar foros y reseñas como pistas, no como hechos confirmados sin contraste.
- Buscar patrones de arquitectura, flujos de trabajo, decisiones de diseño, accesibilidad, rendimiento, errores repetidos, causas raíz, correcciones, limitaciones y costes de mantenimiento. No quedarse en capturas bonitas: identificar por qué una solución funciona, dónde falla y qué evidencia lo demuestra.
- Registrar conclusiones accionables en `cerebro/INVESTIGACION_COMPARATIVA.md`: fuentes y fecha de consulta, observación verificable, nivel de confianza, problema que resuelve, riesgo o limitación, aplicabilidad a BotImagen, decisión propuesta y prueba que confirmaría su valor.
- Separar siempre **hecho observado**, **interpretación** e **hipótesis**. No declarar una búsqueda o una prueba que no se hizo. Si no hay acceso a navegación o a una fuente, indicar `NOT_RUN` y continuar con lo verificable del repositorio.
- Aprender de conceptos generales y prácticas documentadas; diseñar una implementación propia que encaje en BotImagen. No copiar código, textos, ilustraciones, marca, layout distintivo ni activos propietarios. Si se considera reutilizar código abierto, verificar antes la licencia, sus obligaciones, la procedencia y la compatibilidad; conservar atribuciones requeridas.
- No eludir autenticación, paywalls, restricciones de acceso ni términos de servicio; no realizar scraping masivo ni descargar colecciones de referencias automáticamente sin evaluación de permisos, licencias, privacidad y carga al servicio.
- Cada recomendación debe explicar el beneficio esperado, el coste/risgo, la alternativa descartada y cómo se probará. La evidencia del proyecto y su CI sigue teniendo prioridad al decidir si un cambio está realmente terminado.

## Estados de evidencia

- PASS_REAL: ejecución real comprobada.
- PASS_STATIC: revisión estática o validación de estructura correcta.
- FAIL_REAL: ejecución real fallida.
- NOT_RUN: no se ejecutó.
- UNKNOWN: no se dispone de evidencia suficiente.
- PARTIAL: una parte está hecha y otra no.
- NOT_READY: aún no cumple los requisitos para considerarse listo.

No convertir PASS_STATIC en PASS_REAL. No afirmar que la UI funciona en Windows sin probarla efectivamente en Windows.

## Reglas de producto innegociables

1. **Offline-first y sin API de pago obligatoria.** El editor, el motor de combinaciones, los perfiles y la biblioteca local deben funcionar sin OpenAI, claves pagas ni servicios externos.
2. **No descartar lo que ya funciona sin una migración probada.** El generador Python, las reglas, los favoritos, los perfiles, los manifiestos, las validaciones y el intake actual son activos existentes.
3. **El catálogo es la autoridad de las selecciones.** El generador solo debe usar traits reconocidos por el catálogo o campos personalizados que el usuario haya habilitado explícitamente. Una palabra escrita en una búsqueda no puede introducir silenciosamente un rasgo.
4. **Diseño modular, no combinaciones prefabricadas.** Colores, regiones de color, peinado, longitud, textura, ojos, anatomía, vestuario y poses deben poder componerse mediante opciones reutilizables y reglas de compatibilidad.
5. **Elecciones manuales bloqueadas.** Los atributos fijados por el usuario se conservan. Solo los campos AUTO se resuelven por afinidad, reglas o azar reproducible.
6. **Reproducibilidad.** Los perfiles guardan semilla, versión de esquema, identificadores estables y decisiones elegidas. Los presets se pueden guardar, cargar, duplicar y comparar.
7. **Estilo coherente, perfiles visuales extensibles.** Conservar bw-modern-gacha-v1 como perfil inicial, sin diseñar todo el sistema de modo que solo pueda existir ese estilo.
8. **Biblioteca responsable.** Guardar origen, autor si se conoce, licencia/estado de verificación, hash, dimensiones y etiquetas. Las referencias externas no son automáticamente material reutilizable. No implementar scraping masivo sin auditar condiciones de acceso y licencias.
9. **Archivos pesados fuera del historial de código.** Código, catálogos de ejemplo y pruebas van a Git. La colección local de imágenes originales, miniaturas generadas por el usuario, cachés, perfiles personales y rutas del equipo deben permanecer fuera de Git por defecto.
10. **Seguridad local.** El servicio local escucha solo en loopback por defecto; valida rutas para impedir path traversal y no expone operaciones de archivos arbitrarias al navegador. No almacenar secretos en repositorio.
11. **Generación de imágenes independiente del editor.** El MVP no depende de un modelo neuronal local. Una integración futura será opcional y se evaluará por modelo, velocidad, memoria, licencia y calidad.
12. **No confundir web local con web pública.** El MVP puede abrirse en Chrome en la PC. Acceso remoto desde otros dispositivos, cuentas, sincronización o alojamiento público son otro alcance y necesitan una evaluación propia.

## Restricciones técnicas

- Usar TypeScript + React + Vite para la interfaz web propuesta.
- Reutilizar inicialmente character_generator.py y character_rules.json mediante una capa de servicio Python; evitar una reescritura simultánea a TypeScript.
- Evaluar FastAPI + Uvicorn como puente HTTP local después de verificar las dependencias. Si existe una opción más simple compatible, documentar la razón antes de cambiar la decisión.
- JSON versionado para reglas/catálogos; SQLite para el índice de referencias, favoritos y metadatos que requieran consultas.
- Thumbnails de tamaño controlado y carga diferida/virtualizada para catálogos grandes.
- No introducir Electron, Tauri, generación neuronal o sincronización remota antes de que el flujo web local funcione y esté probado.
- Mantener CI actual y ampliarlo para validar también el frontend y el contrato entre la UI y el motor.

## Criterio mínimo de una entrega

Una tarea no se considera terminada por escribir el código. Tiene que cumplir sus criterios de aceptación, superar las pruebas pertinentes, quedar persistida, actualizar la documentación de estado y diferenciar con honestidad lo probado de lo que todavía no se ha probado.
