# BotImagen · BaseWarriors Asset Intake

> **Nueva dirección web-first:** consulta el [Cerebro de BotImagen](cerebro/README.md) para ver la arquitectura acordada, el plan por fases y el estado verificado de la migración web local. El prototipo web inicial vive en `web/` y ya consume el catálogo y el motor Python mediante una API local; consulta `cerebro/ESTADO_ACTUAL.md` para ver los límites pendientes.


Herramienta local para recibir imágenes generadas por IA y colocarlas en el destino correcto del proyecto.

## Objetivo

Evitar el clásico cementerio de archivos `final.png`, `final2.png`, `ahora-si-final.png`.

La aplicación funciona como una pequeña estación de trabajo: muestra el contrato del asset, copia su prompt, recibe la imagen, la valida, la coloca en la ruta canónica y deja un historial local de imports.

## Requisitos

- Windows 10/11
- Python 3.10+
- Tkinter/Tk, disponible con la instalación normal de Python para Windows
- Git for Windows, si se quiere usar `GIT STATUS`/`GIT PUSH`

No necesita instalar paquetes de PyPI ni Node.js.

La documentación oficial de Python confirma que Tkinter está disponible en Windows y forma parte de la biblioteca estándar. La instalación oficial de Git for Windows proporciona Git para la consola y GUI.

Fuentes consultadas:
- Python Tkinter: https://docs.python.org/3/library/tkinter.html
- Python Windows: https://www.python.org/downloads/windows/
- Git for Windows: https://gitforwindows.org/
- Instalación oficial de Git: https://git-scm.com/install/windows

## Ejecutar

La aplicación está pensada para Windows 10/11. No necesita un servidor, una cuenta ni conexión a Internet para abrirse. Solo usa Python/Tkinter y, para las funciones Git, Git for Windows.

### Forma recomendada en Windows

Haz doble clic en `Iniciar_BotImagen.bat`. El launcher ejecuta primero un diagnóstico del PC y solo abre la aplicación si Python, Tkinter, Git y los archivos locales básicos están disponibles.

También puedes abrir el diagnóstico manualmente:

```bat
py doctor.py
```

Si el diagnóstico devuelve `PASS`, el entorno local está listo para ejecutar BotImagen.

Desde la carpeta del repositorio:

```bat
python app.py
```

También:

```bat
py app.py
```

O con doble clic en `Iniciar_BotImagen.bat`.

## Flujo

1. Filtrar/buscar el asset en el catálogo.
2. Seleccionar el contrato que quieres completar.
3. Usar **COPIAR PROMPT** para llevar el prompt directamente a tu herramienta de generación.
4. Pulsar **+ SUBIR IMAGEN**.
5. La app muestra una vista previa y la información del contrato.
6. Se validan formato, dimensiones y tamaño máximo.
7. Pulsar **PREPARAR ASSET** o **PREPARAR + SIGUIENTE** para trabajar en cadena.
8. Los assets ya preparados quedan marcados con ✓. También se marcan como completados los destinos que ya existen en el repositorio configurado.
9. **COPIAR DESTINO** copia la ruta absoluta para localizarla rápidamente.
10. **ABRIR CARPETA** abre el directorio del asset; si el archivo ya existe, abre directamente el archivo.
11. **HISTORIAL** conserva hasta 100 imports locales y permite abrir la carpeta de una entrada con doble clic.
12. **GIT STATUS** y **GIT PUSH** permiten revisar y enviar solamente el asset seleccionado.

## Configuración

La ruta local del repositorio destino se guarda en `botimagen_config.json` y está ignorada por Git.

El historial de imports se guarda en `botimagen_history.json`, también ignorado por Git, porque contiene rutas locales de tu PC.

El catálogo vive en `assets_manifest.json`.

Cada contrato usa ahora `prompt_version: production-v2`, un **prompt de producción** detallado y un **negative prompt**. La intención es que el texto pueda copiarse directamente a una herramienta de generación de imágenes y mantener mejor composición, materiales, iluminación, silueta, uso del PNG y coherencia con BaseWarriors.

## Catálogo actual

El manifiesto incluye contratos de:

- backgrounds y capas del combat stage 2.5D;
- `character.bw001`;
- props comunes de baseball: bate, pelota y casco;
- enemigos comunes: Kytos y robot de combate.

Los contratos están pensados como punto de entrada y pueden ampliarse sin cambiar el flujo de la aplicación.

## Seguridad y Git

La aplicación no sube imágenes a un servidor propio. Trabaja localmente.

La sincronización Git usa el Git instalado en el PC y las credenciales/configuración Git del usuario.

Antes del commit, **GIT PUSH** comprueba que solamente el asset seleccionado esté staged. Si detecta otros archivos en el índice, detiene la operación.

La aplicación nunca renombra el archivo fuente original. Copia el archivo al destino canónico del manifiesto.

## Generador de personajes

BotImagen incluye un generador local de diseño de personajes. No necesita una API externa.

En **GENERADOR PERSONAJE** puedes elegir con listas:

- Personalidad: alegre, rebelde, seria, kuudere, protectora, tímida, traviesa, disciplinada, hiperactiva.
- Estatura: bajita, media, alta.
- Silueta: compacta/ágil, atlética, elegante, guardiana.
- Expresión: sonrisa, mirada enfocada, desafiante, fría, enojada, somnolienta, etc.
- Cabello, ojos y voz: pueden quedar en **AUTO**.
- Rol de combate: striker, support, tank, control/debuffer o pitcher/especialista.

El motor usa reglas de afinidad y una semilla de variación. Los rasgos que fijes quedan bloqueados; los demás se completan automáticamente.

Ejemplo de intención de diseño:

`Alegre + Bajita` → aumenta la afinidad por una silueta compacta, energía visual y cabello rojo coral/naranja.

`Seria + Mirada enojada` → aumenta la afinidad por cabello violeta/obsidiana y una identidad vocal de timbre violeta/oscuro.

Esto no es una regla biológica ni una asociación obligatoria: es una **heurística artística editable** para producir personajes con coherencia interna y variedad.

El resultado incluye:

- perfil completo;
- explicación de por qué se eligieron los rasgos AUTO;
- prompt de producción;
- negative prompt;
- seed para reproducir o comparar una variación;
- opción **GUARDAR PERFIL** como JSON local.

Los perfiles guardados en `generated_characters/` se excluyen de Git por defecto. Primero se generan y revisan; después pueden convertirse en contratos reales de BaseWarriors.

## Diseño de personajes avanzado

El generador ahora funciona como un sistema de diseño por capas:

**Identidad → físico → rostro → cabello → vestimenta → paleta → rol → prop → pose.**

Puedes fijar solo dos o tres cosas y dejar el resto en **AUTO**. Cada elección automática usa pesos de compatibilidad y etiquetas compartidas, y una semilla para conservar reproducibilidad.

También existe un control **Coherencia / variedad**:
- alto: mantiene las decisiones muy cerca de la combinación que elegiste;
- bajo: permite alternativas compatibles para descubrir diseños inesperados.

### Referencias visuales

El botón **VER IMÁGENES WEB** abre una búsqueda visual basada en el rasgo seleccionado o en el personaje completo. Esto sirve para comparar rápidamente peinados, ropa, expresiones, paletas o poses antes de generar.

La carpeta **references/** puede usarse como espacio local para imágenes de inspiración descargadas manualmente. Se mantiene fuera de Git para no mezclar material de referencia con los assets oficiales.

Las referencias son inspiración visual. El prompt del personaje siempre pide un diseño original y no convierte una referencia externa en una instrucción de copia.

### Ideas tomadas de herramientas externas

La arquitectura incorpora patrones que aparecen repetidamente en herramientas de generación anime y prompt engineering:

- bibliotecas de tags y autocompletado por categoría;
- wildcards con semilla y variación reproducible;
- presets separados de personaje, estilo y referencias;
- galerías y comparación/organización de resultados;
- formatos de prompt dependientes del modelo;
- separación entre prompt positivo, negativo y controles del modelo.

Por ejemplo, NAIWeaver combina biblioteca de tags con ejemplos visuales, wildcards, presets y referencias de personaje/estilo; Character Select Stand Alone usa taggers locales, listas JSON/CSV, wildcards y referencias para ComfyUI/WebUI; y RandomPromptBuilder separa atributos de personaje, acción, ropa, ubicación y fondo y utiliza seed/batch para variaciones reproducibles.

## Descubrimiento de personajes: ⭐ Favoritos y 🎲 Sorpresa

El generador tiene dos herramientas para explorar diseños:

**⭐ FAVORITO** guarda el perfil completo, prompt, negative prompt, seed y nivel de coherencia en un archivo local. **⭐ VER FAVORITOS** permite revisar los diseños guardados y abrir su prompt.

**🎲 SORPRÉNDEME** mantiene los rasgos que hayas fijado, pero reduce temporalmente la coherencia y aumenta la exploración del sistema. Además, da más peso a quirks `uncommon` y `rare`.

### Quirks creíbles pero divertidos

El catálogo incluye pequeños detalles como:

- ponerle nombre al bate;
- coleccionar stickers diminutos;
- llevar snacks de emergencia;
- perderse incluso con un mapa;
- realizar un ritual antes de usar el equipo;
- ponerse nerviosa frente a una mascota gigante;
- practicar poses de victoria cuando nadie mira;
- cantar maravillosamente cuando cree estar sola;
- tomar rivalidades absurdamente serias;
- tener una debilidad por merchandising adorable.

La regla de diseño es **“detalle memorable, no caricatura”**. El quirk debe poder aparecer naturalmente en una línea de diálogo, una animación idle, una pose de victoria, un prop o una escena corta.

Esto toma como referencia un patrón muy útil de *Uma Musume*: personajes fuertes por tener una identidad central clara más uno o varios comportamientos pequeños y memorables. La investigación usada para diseñar el sistema encontró ejemplos como El Condor Pasa, cuyo personaje combina una presentación muy definida con detalles cotidianos y contradicciones, y Twin Turbo, asociada a una personalidad muy energética. El objetivo aquí es aplicar la técnica de construcción de personaje, no copiar personajes concretos.

## Diagnóstico del PC

`doctor.py` comprueba automáticamente:

- versión de Python;
- Tkinter/Tk y que pueda crear una ventana;
- Git disponible en `PATH`;
- archivos básicos de BotImagen;
- lectura de la configuración local.

La aplicación también incluye el botón **DIAGNÓSTICO PC** para ejecutar estas comprobaciones sin salir de la interfaz.

El launcher `.bat` ejecuta este preflight antes de abrir la app. Esto evita que una instalación incompleta llegue directamente a una pantalla que luego falla.

## Mejoras de la iteración

- Corregida la selección cuando el catálogo está filtrado: ahora el índice visible se resuelve contra la lista filtrada real.
- El estado ✓ considera tanto la sesión actual como un archivo que ya existe en el destino configurado.
- Nuevo historial local de imports, limitado a 100 entradas.
- Nuevo botón **COPIAR DESTINO**.
- **ABRIR REPOSITORIO** ahora abre realmente el repositorio; ya no se usa como selector.
- Éxitos de preparación sin popup, para que **PREPARAR + SIGUIENTE** sea realmente utilizable como cola rápida.
- Control explícito para detectar cuando la imagen seleccionada ya es exactamente el archivo de destino.
- Validador de manifiesto reforzado: títulos, descripciones, prompts, tamaños máximos y pares de dimensiones.
- Validación automática reutilizable en GitHub Actions.

## Validación automática

GitHub Actions ejecuta en cada cambio de `main` y en pull requests:

- compilación sintáctica de `app.py` con `python -m py_compile`;
- validación estructural de `assets_manifest.json`;
- comprobación de contratos PNG, campos obligatorios y límites numéricos.

Esto no sustituye la prueba real de la interfaz Tkinter en Windows.

## Limitación conocida

Tkinter puro no incorpora drag & drop de archivos de Windows de forma nativa. Por ahora se mantiene el selector **+ SUBIR IMAGEN** sin añadir dependencias externas. Esto mantiene el proyecto portable y sin instalación de paquetes.

## TIMER

Bloque ejecutado: ~1–2 h de implementación.
Prueba real pendiente: ~30–60 min en Windows.
Siguiente mejora útil: ~3–5 h para miniaturas locales por rasgo, presets de personaje y perfiles visuales guardados; después ~30–60 min de prueba real.

## Estado

Estado: **MVP funcional en evolución**. El proyecto tiene preflight local para Windows, prompts de producción por contrato y validación estática automatizada; la interfaz real todavía debe probarse físicamente en tu PC.


## Beta visual universal · Anime moderno de gacha

La dirección artística universal del generador queda fijada en `visual_style_catalog.json` bajo el ID `bw-modern-gacha-v1`. La personalidad y el vestuario pueden variar, pero no pueden cambiar la familia de render: ilustración 2D anime moderna, lineart limpio y controlado, cel shading pulido, reflejos definidos y una silueta legible para presentación 2.5D.

### Catálogo normalizado de rasgos

El perfil ahora separa las partes que muchos editores visuales permiten combinar:

- **Cara:** forma del rostro, forma y color de ojos, pupila, cejas, nariz, boca y detalle facial.
- **Cabello:** longitud, flequillo, peinado principal, piezas laterales, parte trasera/recogido y color.
- **Diseño de juego:** complexión, silueta, vestuario, capa exterior, calzado, accesorios, paleta, pose y prop de béisbol.

Las categorías visuales principales contienen diez opciones normalizadas cada una. Los IDs son estables, las etiquetas son legibles para la interfaz y las etiquetas de afinidad ayudan a elegir opciones compatibles. Las selecciones del usuario se conservan como bloqueos; la generación automática rellena los demás campos.

La interfaz organiza los controles en pestañas `IDENTIDAD`, `CARA`, `CABELLO`, `VESTUARIO`, `COMBATE` y `DETALLE`, y muestra el estilo universal activo.

### Contrato de metadatos de referencias

El mismo archivo define el esquema futuro de la biblioteca de referencias: origen, autor, licencia, categorías, IDs de rasgos, etiquetas originales y detectadas, prompt original, modelo, sampler, pasos, CFG, seed, dimensiones, hash y confianza del dato.

**Regla de procedencia:** las etiquetas detectadas por un modelo se guardan separadas de los metadatos originales. Una licencia desconocida se trata como `reference_only` hasta comprobar sus términos. La beta todavía no descarga masivamente imágenes externas: esta iteración fija el vocabulario y el contrato de estilo sobre los que se construirá la ingesta e indexación local.

### Validación

GitHub Actions valida que cada categoría visual configurada tenga diez opciones únicas, que exista un único estilo activo, que esté definido el esquema de metadatos, y que el prompt utilice las piezas separadas de cara y cabello sin perder las elecciones bloqueadas. También prueba que la semilla reproduzca el mismo perfil y prompt.


## Diseño composable ampliado: cabello, especie, cuerpo y altura

La beta conserva el estilo universal `bw-modern-gacha-v1`, pero cada vez permite expresar diseños más precisos mediante piezas separadas.

### Combinaciones de cabello

- `hair_length`: longitud del cabello.
- `hairstyle`: corte o forma base, como bob, wolf cut, hime cut, largo liso o capas.
- `hair_arrangement`: suelto, coleta alta/baja/lateral, coletas gemelas, media coleta, coleta trenzada o moños.
- `hair_texture`: liso, ondas, rizos, volumen, hebras finas o capas texturizadas.
- `hair`: color base; la biblioteca incluye verde esmeralda y rubio dorado.
- `hair_color_pattern`: color sólido, puntas doradas, degradados, split-dye, capa interior de color, mechones o reflejos.
- `hair_secondary_color`: color de las puntas/degradado o acento secundario.

Ejemplo reproducible: cabello largo + coleta alta + base verde esmeralda + patrón de puntas doradas + color secundario oro metálico + pupilas de estrella.

### Especie y rasgos anatómicos

`species` ofrece diez familias iniciales: humana, gato, zorro, lobo, conejo, elfa, oni, dracónica, androide y espíritu de energía. Los controles de orejas, cola y cuernos/rasgo craneal son independientes. Cuando quedan en AUTO, se eligen por compatibilidad con la especie; las selecciones manuales se conservan para permitir híbridos deliberados.

### Cuerpo y altura

`body_build`, `body_proportions` y `silhouette` son controles diferentes. `height_cm` ofrece diez alturas desde 145 cm hasta 190 cm en saltos de 5 cm; la categoría amplia de estatura se ajusta a la altura escogida. También se puede seleccionar uno de diez tonos de piel estilizados, manteniendo el diseño como heroína adulta y no sexualizada.

### Estado del catálogo

El esquema contiene 40 categorías en total. Hay 35 categorías visuales con diez opciones cada una, y la paleta de color base de cabello tiene doce opciones. Las categorías de personalidad, estatura general, voz, rol de combate y quirk mantienen sus recuentos propios. Los controles siguen siendo listas locales ligeras: no requieren modelos de visión ni de generación de imágenes.

La validación automática comprueba los recuentos, compatibilidad de especie, altura, reproducción por semilla y el caso de prueba del cabello verde esmeralda con puntas doradas y pupilas de estrella.


## Interfaz web local (beta en construcción)

La interfaz React + TypeScript vive en `web/`. Para utilizarla durante el desarrollo, abre dos terminales:

1. Ejecuta `py botimagen_server.py` desde la raíz del repositorio.
2. En otra terminal ejecuta `cd web`, `npm install` y `npm run dev`.

Abre la URL local indicada por Vite. El servicio Python solo escucha en `127.0.0.1:8765`; Vite redirige las solicitudes `/api` al motor. El catálogo procede de `character_rules.json` y la generación de prompts utiliza `CharacterGenerator`. Los perfiles se guardan en `generated_characters/web_profiles/`, excluida de Git.

La figura central todavía es un marcador vectorial, no una imagen generada. La galería de perfiles en la UI, la biblioteca visual, el intake de assets en web y la prueba real completa en Windows siguen pendientes. Revisa [`web/README.md`](web/README.md) para comandos y límites, y [`cerebro/PROGRESO.md`](cerebro/PROGRESO.md) para el porcentaje global ponderado.
