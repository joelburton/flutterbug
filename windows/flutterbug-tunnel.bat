@echo off
REM Drag a story file onto this batch file to play with friends via
REM Localhost.run tunnel. Prompts for a password your friends will use.

setlocal

if "%~1" == "" (
    echo.
    echo Drag a story file onto this batch file to start playing with friends.
    echo.
    echo Supported formats include: .z3 .z5 .z8 .zblorb .ulx .gblorb .t3 .hex .saa
    goto :wait_and_exit
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
goto :wait_and_exit
:found_python

set "PASSWORD="
set /p PASSWORD="Enter a password your friends will use to sign in: "
if "%PASSWORD%" == "" (
    echo.
    echo No password entered. Aborting.
    goto :wait_and_exit
)

cd /d "%~dp1"
%PYTHON% -m flutterbug_server --password "%PASSWORD%" --tunnel --open --story="%~nx1"

:wait_and_exit
echo.
echo Press any key to close this window...
pause >nul
