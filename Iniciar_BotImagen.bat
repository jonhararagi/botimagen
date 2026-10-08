@echo off
setlocal
cd /d "%~dp0"

set "PYTHON_CMD="

where py >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_CMD=py"
    goto :check
)

where python >nul 2>nul
if %errorlevel%==0 (
    set "PYTHON_CMD=python"
    goto :check
)

echo.
echo [ERROR] No se encontro Python.
echo Instala Python 3.10+ desde python.org y vuelve a ejecutar este archivo.
echo.
pause
goto :end

:check
%PYTHON_CMD% doctor.py --quiet >nul 2>nul
if not %errorlevel%==0 (
    echo.
    echo [REVISAR] BotImagen detecto un problema en este PC.
    echo.
    %PYTHON_CMD% doctor.py
    echo.
    echo Corrige los checks FAIL y vuelve a intentarlo.
    pause
    goto :end
)

%PYTHON_CMD% app.py

:end
endlocal
