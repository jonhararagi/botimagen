[CmdletBinding()]
param([switch]$CheckOnly)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$WebRoot = Join-Path $RepoRoot "web"
$ApiUrl = "http://127.0.0.1:8765/api/health"
$WebUrl = "http://127.0.0.1:5173"
$apiProcess = $null
$webProcess = $null

function Test-HttpEndpoint {
    param([string]$Url, [string]$ExpectedContent = "")
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) { return $false }
        if ($ExpectedContent) { return ($response.Content -match [regex]::Escape($ExpectedContent)) }
        return $true
    } catch { return $false }
}

function Wait-HttpEndpoint {
    param([string]$Url, [int]$TimeoutSeconds = 45, [string]$ExpectedContent = "", [System.Diagnostics.Process]$StartedProcess = $null)
    for ($attempt = 0; $attempt -lt $TimeoutSeconds; $attempt++) {
        if (Test-HttpEndpoint -Url $Url -ExpectedContent $ExpectedContent) { return }
        if ($StartedProcess -and $StartedProcess.HasExited) {
            throw "El proceso termino antes de responder en $Url (codigo $($StartedProcess.ExitCode))."
        }
        Start-Sleep -Seconds 1
    }
    throw "Tiempo de espera agotado esperando $Url. Revisa la ventana de logs del servicio."
}

try {
    Write-Host "BotImagen Web: comprobando requisitos..." -ForegroundColor Cyan

    $pythonCommand = $null
    $pythonVersion = $null
    foreach ($candidateName in @("python.exe", "py.exe")) {
        $candidate = Get-Command $candidateName -CommandType Application -ErrorAction SilentlyContinue
        if (-not $candidate) { continue }
        try {
            $candidateVersion = & $candidate.Source -c "import sys; print('.'.join(map(str, sys.version_info[:3])))" 2>$null
            if ($LASTEXITCODE -ne 0) { continue }
            $parsedVersion = [version]($candidateVersion.Trim())
            if ($parsedVersion -ge [version]"3.10") {
                $pythonCommand = $candidate
                $pythonVersion = $parsedVersion
                break
            }
        } catch { continue }
    }
    if (-not $pythonCommand) { throw "Se necesita Python 3.10 o posterior. Instala Python y vuelve a ejecutar el lanzador." }

    $nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
    if (-not $nodeCommand) { throw "No se encontro Node.js. Instala Node.js 22 o posterior." }
    $nodeVersion = (& $nodeCommand.Source --version).Trim()
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v?([0-9]+)\.') {
        throw "No se pudo determinar la version instalada de Node.js."
    }
    if ([int]$Matches[1] -lt 22) { throw "BotImagen requiere Node.js 22 o posterior; se detecto $nodeVersion." }

    $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue
    if (-not $npmCommand) { throw "No se encontro npm.cmd. Reinstala Node.js 22 o revisa PATH." }

    $lockfile = Join-Path $WebRoot "package-lock.json"
    if (-not (Test-Path -LiteralPath $lockfile)) { throw "No se encontro web/package-lock.json." }
    $lockHash = (Get-FileHash -LiteralPath $lockfile -Algorithm SHA256).Hash.ToLowerInvariant()
    $viteEntry = Join-Path $WebRoot "node_modules\vite\bin\vite.js"
    $dependencyStamp = Join-Path $WebRoot "node_modules\.botimagen-lock-sha256"
    $needsNpmInstall = (-not (Test-Path -LiteralPath $viteEntry)) -or (-not (Test-Path -LiteralPath $dependencyStamp))
    if (-not $needsNpmInstall) {
        $storedHash = (Get-Content -LiteralPath $dependencyStamp -Raw).Trim()
        $needsNpmInstall = ($storedHash -ne $lockHash)
    }
    if ($needsNpmInstall) {
        Write-Host "Sincronizando dependencias web con package-lock.json mediante npm ci..." -ForegroundColor Yellow
        Push-Location $WebRoot
        try {
            & $npmCommand.Source ci --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "npm ci fallo. Comprueba la conexion a Internet y web/package-lock.json." }
        } finally { Pop-Location }
        Set-Content -LiteralPath $dependencyStamp -Value $lockHash -Encoding Ascii -NoNewline
    }

    & $pythonCommand.Source -c "from PIL import Image" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Instalando dependencia Python de composicion PNG..." -ForegroundColor Yellow
        & $pythonCommand.Source -m pip install --disable-pip-version-check -r (Join-Path $RepoRoot "requirements-engine.txt")
        if ($LASTEXITCODE -ne 0) { throw "No se pudo instalar requirements-engine.txt." }
        & $pythonCommand.Source -c "from PIL import Image" 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Pillow sigue sin estar disponible en Python." }
    }

    Write-Host "PASS: Python $pythonVersion, Node $nodeVersion y dependencias comprobadas." -ForegroundColor Green
    if ($CheckOnly) {
        Write-Host "CheckOnly: requisitos preparados; no se iniciaron procesos ni se abrio el navegador."
        exit 0
    }

    if (-not (Test-HttpEndpoint -Url $ApiUrl)) {
        Write-Host "Iniciando motor Python local..." -ForegroundColor Cyan
        $apiProcess = Start-Process -FilePath $pythonCommand.Source -ArgumentList @("botimagen_server.py") -WorkingDirectory $RepoRoot -PassThru
        Wait-HttpEndpoint -Url $ApiUrl -TimeoutSeconds 45 -StartedProcess $apiProcess
    } else {
        Write-Host "La API local ya responde; no se inicia una instancia duplicada."
    }

    if (-not (Test-HttpEndpoint -Url $WebUrl -ExpectedContent "BotImagen Studio")) {
        Write-Host "Iniciando Vite..." -ForegroundColor Cyan
        $webCommand = 'call "' + $npmCommand.Source + '" run dev -- --host 127.0.0.1 --port 5173 --strictPort'
        $webProcess = Start-Process -FilePath $env:ComSpec -ArgumentList @("/d", "/s", "/c", $webCommand) -WorkingDirectory $WebRoot -PassThru
        Wait-HttpEndpoint -Url $WebUrl -TimeoutSeconds 45 -ExpectedContent "BotImagen Studio" -StartedProcess $webProcess
    } else {
        Write-Host "La interfaz local ya responde; no se inicia una instancia duplicada."
    }

    try { Start-Process $WebUrl } catch { Write-Host "Abre manualmente $WebUrl en Chrome o Edge." -ForegroundColor Yellow }
    Write-Host "BotImagen Web lista: $WebUrl" -ForegroundColor Green
    Write-Host "La API solo escucha en 127.0.0.1. Consulta las ventanas de procesos para ver sus logs."
} catch {
    Write-Host ("ERROR: " + $_.Exception.Message) -ForegroundColor Red
    foreach ($process in @($webProcess, $apiProcess)) {
        if ($process -and -not $process.HasExited) {
            try { & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null } catch {}
        }
    }
    exit 1
}
