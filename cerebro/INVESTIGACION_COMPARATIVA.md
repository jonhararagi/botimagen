# Investigación comparativa y aprendizaje técnico · BotImagen

**Propósito:** aprender de productos, aplicaciones y proyectos comparables para tomar mejores decisiones técnicas en BotImagen. La referencia externa sirve para comprender problemas y soluciones, no para copiar productos ajenos.

## Cuándo investigar

Abrir una investigación breve cuando una decisión tenga impacto apreciable o exista incertidumbre: diseño del editor, organización de rasgos, generación y guardado de perfiles, biblioteca visual, importación de assets, rendimiento en PC modesta, manejo local de archivos, seguridad, accesibilidad, empaquetado, errores de integración o mantenimiento.

No investigar por acumular enlaces. Definir primero la pregunta concreta y qué decisión podría cambiar a partir de la evidencia. Para tareas pequeñas y conocidas, usar el repositorio, las pruebas y la documentación local antes de expandir el alcance.

## Método

1. **Definir la pregunta.** Explicar el problema de BotImagen, las restricciones relevantes y el criterio de éxito.
2. **Seleccionar referencias.** Elegir de 2 a 4 productos/proyectos relacionados; añadir referencias de otra categoría si resuelven la misma necesidad de una forma útil. Comparar alternativas reales, no solo la solución favorita.
3. **Priorizar evidencias.** Preferir documentación oficial, guías técnicas, repositorios públicos con licencia identificable, changelogs, issues/PRs, avisos de seguridad, benchmarks reproducibles e informes de incidentes. Blogs, videos, foros y reseñas pueden revelar problemas, pero se contrastan antes de tratarlos como hechos.
4. **Buscar también los fallos.** Revisar bugs reportados, regresiones, limitaciones conocidas, decisiones revertidas y soluciones que no funcionaron. Cuando haya información, distinguir síntoma, causa raíz, corrección, versión afectada y efectos secundarios.
5. **Triangular.** No generalizar desde una sola reseña ni asumir que una característica existe porque aparece en una captura. Contrastar fuentes y registrar su fecha.
6. **Traducir a una decisión propia.** Extraer principios generales; diseñar una solución que respete las capas, objetivos, estilo y límites de BotImagen.
7. **Validar.** Formular una hipótesis comprobable, definir una prueba o métrica, implementarla en una tarea delimitada y comparar el resultado con la línea base.
8. **Cerrar el registro.** Dejar claro qué se aplicó, qué se descartó y por qué. No sumar progreso de producto por el mero hecho de leer fuentes o escribir una investigación.

## Qué observar en cada referencia

- Arquitectura y límites entre presentación, dominio, almacenamiento y servicios.
- Flujo de interacción: pasos, controles, estados vacíos, recuperación de errores, accesibilidad y atajos.
- Modelo de datos, extensibilidad, importación/exportación y compatibilidad hacia atrás.
- Rendimiento: tamaño de recursos, carga diferida, memoria, tiempo de respuesta y degradación en hardware modesto.
- Seguridad y privacidad: permisos, acceso al sistema de archivos, validación, secretos, operaciones destructivas y datos enviados fuera del equipo.
- Fallos: mensajes confusos, pérdida de trabajo, problemas de instalación, corrupción, fallos de red y errores de concurrencia.
- Soluciones: qué resolvieron, qué sacrificaron y si la evidencia indica que funcionaron.
- Mantenimiento: tests, migraciones, versionado, documentación, actividad del proyecto y coste de añadir funciones.

## Límites éticos y de reutilización

- No copiar código, textos, ilustraciones, identidad visual, marca, composición distintiva ni recursos propietarios.
- Los patrones generales y las lecciones técnicas pueden inspirar una implementación independiente. No recrear una pantalla ajena píxel por píxel.
- Antes de reutilizar código o recursos, comprobar licencia, titularidad, versión, compatibilidad y obligaciones de atribución. Una URL pública no significa que el contenido tenga una licencia abierta.
- Respetar términos del servicio, límites de acceso, privacidad y derechos de autor. No eludir autenticación o paywalls, no hacer scraping masivo y no descargar bibliotecas de imágenes sin una evaluación previa de permisos y licencias.
- Guardar referencias externas con procedencia y estado de licencia cuando pasen a la biblioteca de BotImagen. Una referencia de estudio no se convierte automáticamente en un asset reutilizable.
- No copiar claves, datos personales, repositorios privados o material confidencial a notas compartidas.

## Calidad de las conclusiones

Etiquetar cada apunte como:

- **HECHO OBSERVADO:** respaldado directamente por una fuente identificada.
- **INTERPRETACIÓN:** explicación razonada derivada de una o más observaciones.
- **HIPÓTESIS:** idea plausible que todavía necesita una prueba.
- **NO VERIFICADO:** afirmación no confirmada o fuente insuficiente.
- **NOT_RUN:** la búsqueda, reproducción o prueba no se pudo ejecutar.

No anunciar resultados de navegación, reproducción de errores, benchmarks o tests si no se realizaron. Si las herramientas de consulta externa no están disponibles, reconocer la limitación y avanzar con el material verificable del repositorio.

## Ficha reutilizable de investigación

Copia esta estructura al registrar cada estudio:

### [ID] · [Pregunta concreta]

- **Fecha de consulta:**
- **Responsable / tarea:**
- **Problema de BotImagen:**
- **Restricciones y criterio de éxito:**
- **Referencias consultadas:**
  - Producto/proyecto:
  - Fuente exacta (URL, título, versión o fecha):
  - Tipo de fuente: oficial / repositorio / issue / changelog / informe / comunidad.
  - Hecho observado:
  - Confianza: alta / media / baja.
- **Errores y causas raíz encontrados:**
- **Soluciones, límites y compromisos:**
- **Patrones transferibles (sin copiar implementación):**
- **Interpretaciones e hipótesis:**
- **Aplicabilidad a BotImagen:**
- **Opciones consideradas y decisión:**
- **Riesgos, coste y alternativa descartada:**
- **Prueba de validación y resultado:**
- **Estado final:** ADOPTAR / ADAPTAR / DESCARTAR / INVESTIGACIÓN INCOMPLETA / NOT_RUN.
- **Archivos/ADR relacionados:**

## Regla de decisión

Investigar lo suficiente para reducir un riesgo concreto, no para aplazar la entrega. Si no existe evidencia fiable, registrar la incertidumbre. Toda propuesta adoptada debe transformarse en una tarea con alcance, TIMER, criterios de aceptación y pruebas; el cambio solo se considera terminado después de verificarlo y persistirlo en GitHub.
