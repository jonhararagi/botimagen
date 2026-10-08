@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
    py app.py
    goto :end
)

where python >nul 2>nul
if %errorlevel%==0 (
    python app.py
    goto :end
)

echo No se encontro Python.
echo Instala Python 3.10+ y asegurate de habilitar el Python Launcher.
pause

:end
endlocal
