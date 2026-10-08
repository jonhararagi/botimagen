# BotImagen · BaseWarriors Asset Intake

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
Siguiente mejora útil: ~2–3 h para modo de lote con multi-selección/cola y detección automática de imágenes compatibles, más ~30–60 min de prueba real.

## Estado

Estado: **MVP funcional en evolución**. El proyecto tiene preflight local para Windows, prompts de producción por contrato y validación estática automatizada; la interfaz real todavía debe probarse físicamente en tu PC.
