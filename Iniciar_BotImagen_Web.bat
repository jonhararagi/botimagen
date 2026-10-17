@echo off
setlocal
cd /d "%~dp0"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\launch_web.ps1" %*
set "RESULT=%ERRORLEVEL%"

if not "%RESULT%"=="0" (
    echo.
    echo BotImagen no pudo iniciarse. Lee el error anterior.
    if /I not "%~1"=="-CheckOnly" pause
    exit /b %RESULT%
)

if /I "%~1"=="-CheckOnly" exit /b 0

echo.
echo BotImagen Web esta disponible en http://127.0.0.1:5173
echo El motor local escucha en http://127.0.0.1:8765
echo Deja abiertas las ventanas del motor y de Vite mientras utilizas la aplicacion.
pause
exit /b 0
