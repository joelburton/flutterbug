@echo off
REM Drag a story file onto this batch file to play with friends via
REM Cloudflare tunnel. Requires cloudflared to be installed separately.
REM Prompts for a password your friends will use.

setlocal

if "%~1" == "" (
    echo.
    echo Drag a story file onto this batch file to start playing with friends.
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

where cloudflared >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: cloudflared is not installed (or not on PATH).
    echo.
    echo Install it from:
    echo   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo or use flutterbug-tunnel.bat (Localhost.run) instead, which needs no extra install.
    echo.
    pause
    exit /b 1
)

set "PASSWORD="
set /p PASSWORD="Enter a password your friends will use to sign in: "
if "%PASSWORD%" == "" (
    echo.
    echo No password entered. Aborting.
    pause
    exit /b 1
)

cd /d "%~dp1"
%PYTHON% -m flutterbug_server --password "%PASSWORD%" --cloudflare --open --story="%~nx1"
pause
