@echo off
REM Drag a story file onto this batch file to play solo (no password, no tunnel).

setlocal

if "%~1" == "" (
    echo.
    echo Drag a story file onto this batch file to start playing.
    echo.
    echo Supported formats include: .z3 .z5 .z8 .zblorb .ulx .gblorb .t3 .hex .saa
    echo.
    pause
    exit /b 1
)

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
echo Run flutterbug-install.bat first.
echo.
pause
exit /b 1
:found_python

REM Run from the story file's directory so save files land beside it.
cd /d "%~dp1"
%PYTHON% -m flutterbug_server --no-password --open --story="%~nx1"
pause
