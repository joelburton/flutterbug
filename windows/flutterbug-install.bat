@echo off
REM Flutterbug installer for Windows.
REM Installs Flutterbug (via pip) and emglken (via npm).

setlocal

REM Locate Python: prefer 'python' on PATH, fall back to the py launcher.
where python >nul 2>nul
if %ERRORLEVEL% == 0 (
    set PYTHON=python
    goto :found_python
)
where py >nul 2>nul
if %ERRORLEVEL% == 0 (
    set PYTHON=py -3
    goto :found_python
)
echo.
echo ERROR: Python is not installed (or not on PATH).
echo.
echo Install Python 3 from https://www.python.org/downloads/ and try again.
echo During install, leave "Install launcher for all users" checked.
goto :wait_and_exit
:found_python

REM Locate npm.
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Node.js / npm is not installed ^(or not on PATH^).
    echo.
    echo Install Node.js LTS from https://nodejs.org/ and try again.
    goto :wait_and_exit
)

echo.
echo === Installing Flutterbug ===
%PYTHON% -m pip install --user --upgrade git+https://github.com/joelburton/flutterbug.git@v0.95
if %ERRORLEVEL% neq 0 (
    echo.
    echo Flutterbug install failed. See errors above.
    goto :wait_and_exit
)

echo.
echo === Installing emglken (interactive fiction interpreter) ===
call npm install -g emglken@0.6.0
if %ERRORLEVEL% neq 0 (
    echo.
    echo emglken install failed. See errors above.
    goto :wait_and_exit
)

echo.
echo === Done! ===
echo.
echo To play a game: drag a story file onto one of the
echo flutterbug-solo / flutterbug-tunnel / flutterbug-cloudflare batch files.

:wait_and_exit
echo.
set /p "DUMMY=Press ENTER to close this window: "
