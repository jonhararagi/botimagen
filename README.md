# BotImagen · BaseWarriors Asset Intake

Herramienta local para recibir imágenes generadas por IA y colocarlas en el destino correcto del proyecto.

## Objetivo

Evitar el clásico cementerio de archivos `final.png`, `final2.png`, `ahora-si-final.png`.

La aplicación funciona como una pequeña estación de trabajo: muestra el contrato del asset, copia su prompt, recibe la imagen, la valida, la coloca en la ruta canónica y deja un historial local de imports.

## Requisitos

- Windows 10/11
- Python 3.10+
- Tkinter (normalmente incluido en Python para Windows)
- Git, si se quiere usar el botón de sincronización

No necesita instalar paquetes de PyPI.

## Ejecutar

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
Siguiente mejora útil: ~2–3 h para un modo de lote con multi-selección/cola y detección de archivos compatibles, más ~30–60 min de prueba real.

## Estado

Estado: **MVP funcional en evolución**. La validación estática queda automatizada; la interfaz real de Windows todavía debe probarse físicamente.
