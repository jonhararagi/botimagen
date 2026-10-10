# BIMG-008-R2 · QA manual en Windows 11

**Estado de esta guía:** preparada para ejecución manual. La QA física en Chrome/Edge sigue **NOT_RUN** hasta que el propietario ejecute los pasos y registre evidencia.

## Objetivo y límites

Validar, en un clon temporal aislado, el importador PNG de BIMG-008 y el guardado de perfiles web sin tocar el repositorio normal, la rama principal ni los assets oficiales. No se modifican las reglas de validación, los límites, los controles de ruta ni la protección contra sobrescritura.

- Código funcional que se debe probar: **518988b372439fb981cfb798b3cac0eb22148940**.
- Repositorio: https://github.com/jonhararagi/botimagen
- PR de referencia: https://github.com/jonhararagi/botimagen/pull/8
- Sistema objetivo: Windows 11, Windows PowerShell 5.1, Python 3.10 o posterior, Node.js 22 o posterior, npm y Git for Windows.
- Tiempo previsto: **30–60 minutos** para la ejecución manual, sin contar instalaciones o descargas.

La guía se versiona en el PR, por lo que el HEAD de la rama puede ser un commit documental posterior al código que se prueba. El procedimiento fija explícitamente el SHA funcional anterior en modo detached; no debe sustituirse por el HEAD más reciente de la rama.

## 1. Preparar el entorno

Abre Windows PowerShell 5.1. Ejecuta:

~~~powershell
$PSVersionTable.PSVersion
py -3 --version
node --version
npm --version
git --version
~~~

Comprueba que PowerShell sea 5.1, Python sea 3.10+, Node sea 22+ y Git esté disponible. Si falta una herramienta o una versión no cumple el requisito, detente y registra el resultado. No instales herramientas durante esta prueba si no puedes verificar la procedencia de los instaladores.

Comprueba si los puertos locales ya están ocupados:

~~~powershell
Get-NetTCPConnection -State Listen -LocalPort 8765,5173 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess
~~~

Si aparece un proceso que no reconoces, no lo cierres ni lo mates. Detén la prueba hasta identificarlo. El servidor Python y Vite deben escuchar solo en loopback, nunca en 0.0.0.0.

## 2. Clonar la rama y fijar el código funcional

El clon debe ser una carpeta nueva dentro de TEMP. No ejecutes este procedimiento desde tu clon de trabajo habitual.

~~~powershell
$Branch = "feat/bimg-008-safe-png-import"
$FunctionalSha = "518988b372439fb981cfb798b3cac0eb22148940"
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"

if (Test-Path -LiteralPath $QaRoot) {
  throw "La carpeta temporal de QA ya existe. No se modificó: $QaRoot"
}

git clone --single-branch --branch $Branch https://github.com/jonhararagi/botimagen.git $QaRoot
if ($LASTEXITCODE -ne 0) { throw "Falló el clon de la rama de QA." }

Set-Location $QaRoot

git cat-file -e "$FunctionalSha^{commit}"
if ($LASTEXITCODE -ne 0) {
  throw "El SHA funcional no está disponible en el clon. Detén la QA e informa al BOT CEREBRO."
}

git merge-base --is-ancestor $FunctionalSha "origin/$Branch"
if ($LASTEXITCODE -ne 0) {
  throw "El SHA funcional no es ancestro de la rama remota clonada. Detén la QA e informa al BOT CEREBRO."
}

git checkout --detach $FunctionalSha
if ($LASTEXITCODE -ne 0) { throw "No se pudo fijar el SHA funcional." }

$ActualSha = (git rev-parse HEAD).Trim()
if ($ActualSha -ne $FunctionalSha) {
  throw "SHA inesperado. Esperado: $FunctionalSha; obtenido: $ActualSha"
}

Write-Host "SHA funcional fijado: $ActualSha"
git status --short
~~~

**Condición de parada:** si el SHA no existe en el clon, no es ancestro de la rama remota, o el HEAD detached no coincide exactamente, no adaptes la guía a otro código. Conserva la salida y comunica el bloqueo al BOT CEREBRO. No continúes con un SHA diferente.

## 3. Crear contratos y archivos de prueba aislados

El servidor obtiene los destinos del manifiesto canónico que lee desde la raíz del repositorio clonado. Por eso, en este clon temporal se reemplaza únicamente la copia local de assets_manifest.json por dos contratos de QA. No hagas este cambio en el repositorio normal ni en main.

El script auxiliar de abajo es deliberadamente ASCII para que Windows PowerShell 5.1 pueda guardarlo con Encoding ASCII sin convertir títulos a signos de interrogación. Los títulos exactos que deben aparecer en la interfaz son **QA - PNG valido** y **QA - PNG corrupto**.

Desde PowerShell, con la ubicación actual en la raíz temporal del clon:

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
Set-Location $QaRoot

$PrepareScript = @'
import json
import struct
import zlib
import binascii
from pathlib import Path

root = Path(__file__).resolve().parent
manifest = {
    "version": 1,
    "project": "BotImagen QA only",
    "assets": [
        {
            "id": "qa.valid",
            "title": "QA - PNG valido",
            "description": "Contrato temporal para verificar un PNG valido.",
            "prompt": "QA only. No production asset.",
            "negative_prompt": "N/A",
            "prompt_version": "qa-only",
            "destination": "qa-output/valid.png",
            "expected": {"format": "PNG", "width": 2, "height": 1, "max_bytes": 1024}
        },
        {
            "id": "qa.corrupt",
            "title": "QA - PNG corrupto",
            "description": "Contrato temporal para rechazar bytes que no son PNG.",
            "prompt": "QA only. No production asset.",
            "negative_prompt": "N/A",
            "prompt_version": "qa-only",
            "destination": "qa-output/corrupt.png",
            "expected": {"format": "PNG", "width": 2, "height": 1, "max_bytes": 1024}
        }
    ]
}
(root / "assets_manifest.json").write_text(
    json.dumps(manifest, indent=2, ensure_ascii=True) + "\n",
    encoding="utf-8"
)

def chunk(kind, payload):
    crc = binascii.crc32(kind + payload) & 0xffffffff
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", crc)

signature = b"\x89PNG\r\n\x1a\n"
ihdr = struct.pack(">IIBBBBB", 2, 1, 8, 6, 0, 0, 0)
raw_pixels = bytes([0, 255, 0, 0, 255, 0, 255, 0, 255])
valid_png = (
    signature
    + chunk(b"IHDR", ihdr)
    + chunk(b"IDAT", zlib.compress(raw_pixels))
    + chunk(b"IEND", b"")
)
(root / "qa-valid.png").write_bytes(valid_png)
(root / "qa-corrupt.png").write_bytes(b"This is not a PNG file.\n")
print("QA manifest and sample files created in the temporary clone.")
'@

Set-Content -LiteralPath (Join-Path $QaRoot "prepare_qa.py") -Value $PrepareScript -Encoding ascii
py -3 (Join-Path $QaRoot "prepare_qa.py")
if ($LASTEXITCODE -ne 0) { throw "No se pudieron preparar los archivos de QA." }

py -3 -m py_compile (Join-Path $QaRoot "prepare_qa.py")
if ($LASTEXITCODE -ne 0) { throw "El script auxiliar no supera la comprobación de sintaxis." }

git status --short
~~~

Las únicas rutas de salida permitidas en el manifiesto de QA son:

- **qa-output/valid.png**
- **qa-output/corrupt.png**

El script auxiliar y los archivos de muestra también quedan dentro del clon temporal. No los añadas al índice de Git, no hagas commit y no hagas push. Si el manifiesto no contiene exactamente los dos contratos QA y esos dos destinos, detente.

## 4. Iniciar el servicio y la interfaz

Abre dos terminales nuevas de PowerShell. Mantén la primera terminal abierta mientras haces las pruebas.

**Terminal 1: API local**

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
Set-Location $QaRoot
py -3 botimagen_server.py
~~~

El servidor debe indicar que escucha en **127.0.0.1:8765**. Si muestra otra dirección, detente y no continúes.

**Terminal 2: interfaz web**

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
Set-Location (Join-Path $QaRoot "web")
npm ci
if ($LASTEXITCODE -ne 0) { throw "Falló npm ci. Conserva el error y no continúes." }
npm run dev
~~~

Abre la URL local que informe Vite, normalmente http://127.0.0.1:5173. La configuración de Vite fija host 127.0.0.1, puerto estricto y proxy /api hacia el servicio Python en 127.0.0.1:8765. No cambies esos valores.

## 5. Verificar API y contratos antes de importar

En una tercera terminal de PowerShell:

~~~powershell
$Health = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/health" -Method Get
$Health | Format-List

$Contracts = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/assets/contracts" -Method Get
$Contracts.count
$Contracts.contracts | Select-Object id,title,destination,
  @{Name="Ancho";Expression={$_.expected.width}},
  @{Name="Alto";Expression={$_.expected.height}},
  @{Name="MaxBytes";Expression={$_.expected.max_bytes}} | Format-Table -AutoSize
~~~

**Resultado esperado:**

- El endpoint de salud devuelve status **ok** y service **botimagen-local**.
- El catálogo tiene exactamente dos contratos: **qa.valid** y **qa.corrupt**.
- Los destinos son exclusivamente **qa-output/valid.png** y **qa-output/corrupt.png**.
- Ambos contratos exigen 2 × 1 píxeles y máximo 1024 bytes.

Si aparece cualquier contrato oficial o un destino fuera de qa-output, no importes ningún archivo. Detén ambos servicios y revisa la preparación del manifiesto antes de continuar.

## 6. Caso A: importar el PNG válido

En la interfaz:

1. Localiza la sección **INTAKE DE ASSETS**.
2. Selecciona el contrato **QA - PNG valido**.
3. Comprueba que el destino mostrado sea **qa-output/valid.png**.
4. Selecciona el archivo qa-valid.png dentro de la carpeta temporal BotImagen-BIMG008-QA.
5. Ejecuta la importación y espera el resultado.

**Resultado esperado:** la interfaz confirma la importación, muestra el contrato/destino correcto y las dimensiones **2 × 1**. No basta con que desaparezca el mensaje de error.

Comprueba en PowerShell:

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
$Source = Join-Path $QaRoot "qa-valid.png"
$Target = Join-Path $QaRoot "qa-output\valid.png"

Test-Path -LiteralPath $Target
Get-FileHash -Algorithm SHA256 -LiteralPath $Source
Get-FileHash -Algorithm SHA256 -LiteralPath $Target
~~~

**Resultado esperado:** el destino existe y los valores SHA256 del archivo fuente y el importado coinciden exactamente.

## 7. Caso B: rechazar bytes que no son PNG

En la interfaz:

1. Selecciona **QA - PNG corrupto**.
2. Comprueba el destino **qa-output/corrupt.png**.
3. Selecciona qa-corrupt.png, que contiene texto y no una imagen PNG.
4. Intenta importarlo.

**Resultado esperado:** la interfaz muestra un error de importación y no muestra una confirmación de éxito. El servidor rechaza los bytes aunque el archivo se seleccione en el control de archivos.

Comprueba que no se publicó ningún destino:

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
$CorruptTarget = Join-Path $QaRoot "qa-output\corrupt.png"
Test-Path -LiteralPath $CorruptTarget
~~~

El resultado debe ser **False**. Si el archivo existe, conserva la evidencia y detén la prueba. No lo borres para ocultar el fallo.

## 8. Caso C: rechazar una sobrescritura

Vuelve a seleccionar **QA - PNG valido**, el archivo qa-valid.png y el destino qa-output/valid.png. El archivo válido ya debe existir tras el caso A. Antes del segundo intento, guarda el hash actual:

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
$Target = Join-Path $QaRoot "qa-output\valid.png"
$Before = (Get-FileHash -Algorithm SHA256 -LiteralPath $Target).Hash
$Before
~~~

Intenta importar el mismo archivo de nuevo.

**Resultado esperado:** la interfaz muestra un conflicto o mensaje equivalente a que el asset ya existe y no fue sobrescrito. No debe mostrar confirmación de éxito para el segundo intento.

Después, verifica:

~~~powershell
$After = (Get-FileHash -Algorithm SHA256 -LiteralPath $Target).Hash
[PSCustomObject]@{ Before = $Before; After = $After; Unchanged = ($Before -eq $After) } | Format-List
~~~

**Resultado esperado:** **Unchanged = True**. Si el destino cambia o desaparece, registra el fallo y detén la prueba. No restaures ni elimines archivos para convertir el resultado en PASS.

## 9. Caso D: generar y guardar un perfil local

En la interfaz:

1. En el panel del diseñador, pulsa **Generar perfil con motor local**.
2. Espera a que se muestre el resultado generado y a que desaparezcan los cambios pendientes.
3. Pulsa **Guardar perfil local**.
4. Confirma el mensaje de perfil guardado.
5. Expande **Perfiles locales** y pulsa **Actualizar lista**. Comprueba que el perfil aparece en la lista.

Verifica el archivo local:

~~~powershell
$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
$Profiles = Join-Path $QaRoot "generated_characters\web_profiles"
$SavedProfiles = @(Get-ChildItem -LiteralPath $Profiles -Filter "profile-*.json" -File -ErrorAction SilentlyContinue)
$SavedProfiles | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
$SavedProfiles.Count
~~~

**Resultado esperado:** existe al menos un archivo profile-*.json y su tamaño es mayor que cero. Si no se crea el directorio, comprueba primero si la interfaz informó un error al guardar. No fabriques un perfil de prueba para sustituir un guardado fallido.

## 10. Cerrar la prueba y revisar residuos

1. Guarda capturas y salidas de consola antes de cerrar.
2. En la terminal de Vite, pulsa Ctrl+C.
3. En la terminal de Python, pulsa Ctrl+C.
4. Comprueba los puertos y los temporales del clon:

~~~powershell
Get-NetTCPConnection -State Listen -LocalPort 8765,5173 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,OwningProcess

$QaRoot = Join-Path $env:TEMP "BotImagen-BIMG008-QA"
Get-ChildItem -LiteralPath $QaRoot -Filter ".botimagen-import-*.tmp" -Recurse -File -ErrorAction SilentlyContinue |
  Select-Object FullName,Length
~~~

**Resultado esperado:** ningún listener del test permanece activo y no quedan temporales .botimagen-import-*.tmp. Si un puerto sigue ocupado, no mates el proceso a ciegas. Identifica su propietario primero.

Conserva el clon temporal hasta que el BOT CEREBRO haya revisado la evidencia. Después puedes eliminar manualmente solo la carpeta BotImagen-BIMG008-QA dentro de la carpeta TEMP, tras comprobar la ruta exacta. No ejecutes comandos de borrado recursivo contra la raíz del repositorio normal.

## 11. Lista de resultados y evidencia

Registra cada fila como **PASS_REAL**, **FAIL_REAL**, **NOT_RUN** o **BLOCKED**. No marques una prueba PASS sin observar el resultado y conservar evidencia.

| Comprobación | Estado inicial |
|---|---|
| Herramientas y versiones compatibles | NOT_RUN |
| SHA detached exacto | NOT_RUN |
| API de salud | NOT_RUN |
| Solo aparecen los dos contratos QA | NOT_RUN |
| Vite y API en loopback | NOT_RUN |
| Importación PNG válida | NOT_RUN |
| Destino canónico temporal correcto | NOT_RUN |
| SHA256 fuente/destino coinciden | NOT_RUN |
| PNG falso rechazado | NOT_RUN |
| No existe destino para el PNG falso | NOT_RUN |
| Sobrescritura rechazada | NOT_RUN |
| Hash antes/después permanece igual | NOT_RUN |
| Generación de perfil | NOT_RUN |
| Guardado y listado de perfil | NOT_RUN |
| Cierre de servicios y ausencia de temporales | NOT_RUN |
| Prueba física Chrome en Windows 11 | NOT_RUN |
| Prueba física Edge en Windows 11 | NOT_RUN |

Adjunta al informe para el BOT CEREBRO:

- salida de versión de las herramientas y SHA detached;
- respuesta de health y tabla de contratos;
- captura del contrato y destino antes de importar;
- captura de la importación válida y ambos hashes SHA256;
- mensaje de rechazo del PNG falso y comprobación False del destino;
- mensaje de rechazo de sobrescritura y hashes antes/después;
- captura del perfil generado/guardado y listado de JSON;
- salida final de puertos y búsqueda de temporales;
- mensaje de error completo y paso exacto ante cualquier fallo.

No incluyas tokens, credenciales, nombres de usuario de Windows ni otras rutas personales en las capturas compartidas. La CI headless de Chromium en Linux es evidencia automatizada, no sustituye Chrome/Edge físico en Windows.

## 12. Referencias de implementación inspeccionadas

Esta guía se preparó contra el SHA funcional **518988b372439fb981cfb798b3cac0eb22148940**:

- **botimagen_server.py**: lee el manifiesto desde la raíz del clon, expone GET /api/health y GET /api/assets/contracts, acepta POST /api/assets/import?asset_id=..., valida PNG y publica sin sobrescribir destinos existentes. Los perfiles se guardan/listan bajo generated_characters/web_profiles/.
- **assets_manifest.json**: manifiesto canónico versionado, reemplazado solo en el clon temporal para esta prueba.
- **web/vite.config.ts**: host 127.0.0.1, strictPort y proxy /api a 127.0.0.1:8765.
- **web/package.json**: requiere Node.js >=22 y ofrece npm ci y npm run dev.
- **web/src/AssetImporter.tsx**: muestra los contratos recibidos, importa el archivo y comprueba los campos de la confirmación.
- **web/src/App.tsx**: genera perfiles con el motor local y los guarda mediante POST /api/profiles.
- **web/README.md**: instrucciones de arranque y límites conocidos.
- **.github/workflows/validate.yml**: CI en pull requests, pruebas Python/API, npm ci, build y smoke test headless de Chromium.

## TIMER

- Preparación e inspección documental: estimación original de 20–40 minutos; no se usa como medida de tiempo realmente transcurrido.
- QA manual del propietario: 30–60 minutos adicionales, sin contar instalaciones.
- Evidencia física Windows: **NOT_RUN** hasta la ejecución real.
