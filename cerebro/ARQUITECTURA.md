# Arquitectura objetivo de BotImagen

## Decisión

Construir una experiencia **web local-first** con tecnologías de navegador, conservando el motor Python existente. Primero funcionará en Chrome/Edge en la misma PC; una envoltura de escritorio y una versión web remota se estudiarán después como destinos distintos.

Esta arquitectura no significa que la aplicación ya esté migrada. Es la dirección autorizada para las próximas fases.

## Capas propuestas

### 1. Interfaz web

- TypeScript.
- React.
- Vite para desarrollo y compilación.
- HTML/CSS para la presentación adaptable.
- Componentes de editor por categorías, controles de color, filtros, formularios, galería y comparador de variantes.
- Accesibilidad básica mediante etiquetas, foco de teclado, contraste y mensajes claros de validación.
- El estado de edición se representa como datos tipados. La interfaz no contiene reglas narrativas ni duplica el generador.

### 2. Servicio local

- Python reutiliza el generador y la lógica de importación existentes.
- FastAPI + Uvicorn es la opción inicial para ofrecer endpoints locales tipados; debe confirmarse mediante un spike pequeño antes de convertirla en dependencia firme.
- El servicio escucha en 127.0.0.1 por defecto y sirve el frontend compilado cuando corresponda.
- Endpoints estrechos y explícitos: salud/estado, leer catálogo, generar perfil, obtener/guardar perfiles, consultar biblioteca, importar imagen y crear/recuperar miniatura.
- Validación estricta de argumentos, rutas dentro de las carpetas configuradas, límites de tamaño, errores legibles y ningún endpoint para ejecutar comandos arbitrarios.
- La UI muestra errores y no informa éxito antes de que el servicio confirme la operación.

### 3. Motor de diseño

- character_generator.py y character_rules.json son el motor vigente que se debe preservar durante la migración.
- Separar la lógica de dominio de la interfaz Tkinter de forma progresiva; evitar copiar la misma regla a Python y TypeScript.
- Perfil versionado con identificadores de opciones, campos bloqueados, campos AUTO, semilla, nivel de coherencia y perfil de estilo.
- Generación determinista cuando se da la misma versión del catálogo, las mismas elecciones y la misma semilla.
- Un atributo no disponible no se adivina: el editor solo ofrece opciones del catálogo aprobado. Notas libres, si se incorporan, deben estar separadas de las elecciones estructuradas.

### 4. Catálogos

JSON versionado es apropiado para definiciones editables y catálogos moderados. Cada categoría debe tener identificadores estables, etiqueta visible, tags, tokens de prompt, metadatos y reglas de compatibilidad cuando corresponda.

Las capas de cabello deben modelar de forma independiente, cuando el vocabulario y el generador lo soporten:

- color base;
- color de raíces;
- color de coronilla;
- color interior o inner hair;
- color de puntas;
- mechones y reflejos;
- patrón o transición, incluidos gradientes;
- intensidad, acabado y distribución del color;
- corte/peinado, longitud, textura, flequillo, laterales y parte posterior.

Otros sistemas ampliables: especie y rasgos anatómicos; altura y proporciones; tamaño del busto; rostro, forma y color de ojos y pupilas; vestuario por capas; calzado; accesorios; armas/props; pose; acción; perspectiva; distancia de cámara y encuadre.

No crear combinaciones completas para cada permutación. Usar piezas modulares, dependencias, compatibilidad, exclusiones y valores AUTO. El ejemplo de una dragonkin adulta de pelo rojo, escamas doradas, ojos dorados y busto grande debe expresarse como elecciones separadas, siempre que dichas opciones estén registradas.

### 5. Datos y almacenamiento

- JSON: reglas, catálogo de opciones, perfiles de ejemplo y contratos de assets versionados.
- SQLite: índice local de referencias, tags, búsquedas, fuentes, autoría, URL de origen, licencia/estado, hash, dimensiones, fecha de ingreso y ruta relativa.
- Archivos locales: originales, miniaturas WebP y perfiles guardados.
- Las rutas de archivos se guardan relativas a una raíz de biblioteca configurada, no como rutas absolutas que dependan de una única PC.
- Deduplicación por hash; las miniaturas se regeneran si faltan y se crean al ingresar una referencia.
- Paginación, carga diferida y virtualización de listas para evitar cargar toda la biblioteca en RAM.
- No versionar la biblioteca personal en Git. Preparar un catálogo de demostración pequeño, liviano y con procedencia clara.

### 6. Generación de ilustraciones

No forma parte del primer MVP. BotImagen debe primero producir perfiles y prompts confiables, importar imágenes que ya existan y comparar/organizar resultados.

Más adelante se investigará una integración local opcional. No prometer que un prompt controla perfectamente cada característica; medir modelos y controles reales con pruebas comparables en el Ryzen 5 5600G y 16 GB de RAM. No se necesita ni se presupone una API de pago.

### 7. Destinos

**MVP local:** iniciar con un script .bat, abrir el navegador en localhost, detener el servicio claramente y conservar los datos en el PC. No requiere cuentas ni nube.

**Aplicación de escritorio futura:** evaluar Tauri o Electron solo tras validar la UI web. Elegir con una comparación medida de empaquetado, memoria, acceso a archivos y facilidad de mantenimiento.

**Web remota futura:** servicio y almacenamiento remotos, autenticación, autorización, límites, backups y sincronización. No prometer coste cero de alojamiento ni compartir automáticamente la biblioteca local. Mantenerla fuera del MVP.

## Rendimiento objetivo inicial

Son presupuestos a verificar, no benchmarks existentes:

- edición de rasgos y creación de prompts sin inferencia neuronal: respuesta percibida inmediata, normalmente inferior a 1 segundo;
- cargar solo la página de miniaturas visible y no abrir todas las imágenes originales;
- objetivo tentativo de memoria de alrededor de 0,5–1,5 GB para navegador y servicio local en uso normal, sujeto a medición real;
- no mantener modelos de imagen cargados en segundo plano;
- evitar incluir imágenes personales pesadas dentro del repositorio.

## Seguridad y mantenimiento

- Bind local exclusivo a 127.0.0.1 por defecto.
- Validar tipo, tamaño y dimensiones de cada imagen importada.
- Rechazar rutas fuera de las raíces autorizadas y nombres de archivo inseguros.
- Escapar texto al mostrar metadatos y no ejecutar contenido encontrado en imágenes, tags o prompts.
- No iniciar subprocess o Git desde endpoints genéricos expuestos al frontend.
- Mantener pruebas de dominio Python y pruebas del frontend; añadir pruebas de contrato API y un smoke test en navegador.
