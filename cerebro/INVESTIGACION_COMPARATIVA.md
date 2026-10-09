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

---

## BIMG-RESEARCH-001 · Editor de avatares modular vs. generador de IA en la nube

- **Fecha de consulta:** 2026-10-09.
- **Pregunta:** ¿Qué patrones de producto ayudan a diseñar un creador de personajes modular sin introducir dependencias de nube, costes recurrentes o deuda innecesaria?
- **Restricciones BotImagen:** Windows local-first, hardware modesto, rasgos independientes, perfiles persistentes y futuro intake de imágenes. No copiar identidad visual, personajes, activos ni código ajeno.
- **TIMER:** 5–10 minutos de exploración inicial; esto no sustituye una revisión completa de licencias, seguridad o issues.

### Referencia A · Avataaars Generator

- **Fuentes consultadas:** [README](https://github.com/fangpenlin/avataaars-generator/blob/master/README.md), [package.json](https://github.com/fangpenlin/avataaars-generator/blob/master/package.json), [LICENSE](https://github.com/fangpenlin/avataaars-generator/blob/master/LICENSE).
- **HECHO OBSERVADO:** el README describe una aplicación web React para crear avatares y enlaza un componente reutilizable separado. El manifiesto contiene comandos separados de start/build/test y una dependencia file-saver; la licencia de código visible es MIT.
- **HECHO OBSERVADO:** el manifiesto muestra un stack de generaciones anteriores (React 17, react-scripts-ts, Bootstrap 4 y TypeScript 4.3). Esto describe las versiones declaradas, no demuestra por sí solo una vulnerabilidad ni el estado actual de mantenimiento.
- **INTERPRETACIÓN:** un editor visual y el componente que representa el avatar pueden ser límites distintos. Exportar el resultado debe ser un flujo explícito, no una operación oculta dentro del generador.
- **Aplicabilidad:** BotImagen ya separa controles de rasgos, motor y prompts. Para el futuro intake conviene mantener separadas la selección/validación del archivo, la vista previa y la escritura final en el destino.
- **Límite de licencia:** la licencia MIT consultada corresponde al código de ese repositorio. No se verificó la licencia de todos los recursos visuales asociados; no importar ilustraciones ni copiar su composición.

### Referencia B · Photoshot

- **Fuentes consultadas:** [README](https://github.com/premieroctet/photoshot/blob/main/README.md), [package.json](https://github.com/premieroctet/photoshot/blob/main/package.json). La consulta de LICENSE devolvió 404; la licencia del repositorio queda **NO VERIFICADA**.
- **HECHO OBSERVADO:** el README lo describe como un generador web de avatares con IA. Su stack declara Next.js, Chakra UI, Prisma, Replicate, Stripe y Flux; también documenta PostgreSQL, almacenamiento S3, autenticación y variables secretas de proveedores.
- **INTERPRETACIÓN:** esa arquitectura responde a un producto remoto con cuentas, almacenamiento y servicios de generación. No es una plantilla adecuada para la beta local-first de BotImagen: sumaría red, credenciales, servicios y costes que no son necesarios para el editor de perfiles.
- **Patrón transferible:** documentar explícitamente cada dependencia externa y cada secreto; la generación de imágenes debe quedar como capacidad opcional separada, nunca como requisito para abrir el editor o guardar un perfil.
- **Límite:** se inspeccionaron README y manifiesto, no se ejecutó la aplicación ni se auditaron sus issues, incidentes o dependencias. No se afirma haber encontrado bugs reproducibles.

### Decisión para BotImagen

- **ADAPTAR:** conservar el editor local y sus contratos de rasgos; diseñar el futuro intake como un flujo local separado y con validación explícita; mantener cualquier motor neuronal detrás de una integración opcional.
- **DESCARTAR:** adoptar la arquitectura de Photoshot con cuentas, Stripe, S3 y servicio de inferencia remoto para la beta.
- **NO ADOPTAR:** copiar componentes visuales, ilustraciones, personajes o la composición de ninguna de las referencias.
- **Prueba de validación:** no se cambió código de producto en esta investigación. El criterio queda para la futura tarea BIMG-008: importar un archivo de prueba, validar/rechazar formatos, conservar intacto el original y registrar el destino local sin red ni credenciales.
- **Estado final:** INVESTIGACIÓN INICIAL COMPLETADA; auditoría de issues/seguridad, ejecución local y comprobación de licencias de recursos visuales NOT_RUN.
- **Impacto en progreso:** ninguno; investigar no cierra criterios de aceptación ni aumenta el porcentaje de la beta.
### Evidencia adicional · issues públicos consultados (no reproducidos)

- [Avataaars Generator #24](https://github.com/fangpenlin/avataaars-generator/issues/24): reporte de instalación que menciona conflicto de árbol de dependencias y la versión de ESLint requerida por react-scripts-ts. **Hecho observado:** el reporte documenta un conflicto de dependencias. **No verificado:** si la solución sugerida en ese hilo sigue siendo necesaria con el estado actual del repositorio.
- [Avataaars Generator #33](https://github.com/fangpenlin/avataaars-generator/issues/33): reporte de servicio externo Avataaars/Heroku que devuelve 503. Es un reporte histórico de usuario, no una comprobación de disponibilidad actual.
- [Avataaars Generator #54](https://github.com/fangpenlin/avataaars-generator/issues/54): un usuario reporta que la aplicación no funciona/está caída; la causa raíz no queda establecida en el extracto consultado.
- [Photoshot #57](https://github.com/premieroctet/photoshot/issues/57): reporte de error de despliegue asociado a una incompatibilidad declarada entre @next/font 13.5.4 y Next 13.0.6; el autor comenta una solución manual local, que no se considera solución general validada.
- **Patrones transferibles:** usar un lockfile y una instalación limpia como prueba reproducible; alinear versiones de framework y paquetes acoplados; no resolver conflictos instalando dependencias al azar; distinguir errores de la aplicación de fallos del proveedor remoto; diseñar mensajes de error recuperables.
- **Aplicación ya pertinente:** BotImagen usa package-lock.json y npm ci en CI. La nueva prueba E2E inyecta un 500 temporal en /api/generate y comprueba que el usuario ve el error y puede volver a generar cuando el servicio responde. Este test valida recuperación del lado UI; no simula fallos de instalación ni de proveedor externo.
- **Estado de investigación:** los issues fueron leídos como reportes, no reproducidos. Causa raíz y estado actual de los incidentes permanecen NOT_RUN salvo donde el texto del issue describe explícitamente el mensaje observado.
