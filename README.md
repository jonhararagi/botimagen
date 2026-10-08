# BotImagen · BaseWarriors Asset Intake

Herramienta local para recibir imágenes generadas por IA y colocarlas en el destino correcto del proyecto.

## Objetivo

Evitar el clásico cementerio de archivos `final.png`, `final2.png`, `ahora-si-final.png`.

La aplicación muestra qué asset se espera, permite seleccionar una imagen con **+**, valida formato y dimensiones, genera el nombre correcto y copia el archivo al destino configurado.

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

También se puede ejecutar:

```bat
py app.py
```

## Flujo

1. Filtrar/buscar el asset en el catálogo.
2. Seleccionar el contrato que quieres completar.
3. Usar **COPIAR PROMPT** para llevar el prompt directamente a tu herramienta de generación.
4. Pulsar **+ SUBIR IMAGEN**.
3. La app muestra una vista previa.
4. Se validan extensión, dimensiones y tamaño.
5. Pulsar **PREPARAR ASSET** o **PREPARAR + SIGUIENTE** para trabajar en cadena.
6. Los assets preparados quedan marcados con ✓ durante la sesión.
7. Si el archivo ya existe en el destino configurado, la aplicación lo indica al seleccionar el asset.
8. La imagen se copia a la ruta indicada por el manifiesto.
9. El archivo queda listo para Git.
10. Opcionalmente se puede usar **ABRIR CARPETA** para revisar el resultado.
11. **GIT STATUS** y **GIT PUSH** permiten revisar y enviar solamente el asset seleccionado.

## Configuración

La ruta local del repositorio destino se guarda en `botimagen_config.json` y está ignorada por Git.

El catálogo vive en `assets_manifest.json`.

El MVP incluye contratos de ejemplo para:

- `stage.background.far`
- `stage.background.mid`
- `stage.ground`
- `stage.foreground`
- `character.bw001`
- `prop.baseball.bat`

Estos contratos son una base inicial y deben ampliarse según los contratos reales de BaseWarriors.

## Seguridad

La aplicación no sube imágenes a un servidor propio. Trabaja localmente.

La sincronización Git usa el Git instalado en el PC y las credenciales/configuración Git del usuario.

## TIMER

MVP implementado: ~3–5 h de trabajo estimado.
Mejoras posteriores: ~3–6 h adicionales.
Iteración actual: búsqueda de catálogo + copiar prompt + detección de destino existente.

## Validación automática

GitHub Actions ejecuta en cada cambio de `main`:

- compilación sintáctica de `app.py` con `python -m py_compile`;
- validación estructural de `assets_manifest.json`;
- comprobación de que los contratos apunten a PNG.

Esto no sustituye la prueba real de la interfaz Tkinter en Windows, que sigue siendo una validación local.

## Inicio rápido en Windows

También puedes usar `Iniciar_BotImagen.bat` con doble clic. El lanzador usa el Python Launcher (`py`) cuando está disponible.

## Estado

MVP funcional en evolución. La prueba de interfaz gráfica real todavía debe ejecutarse en un PC Windows con Python/Tkinter.
