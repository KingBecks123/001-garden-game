@echo off
echo Starting Garden Game...

REM Check if Python is installed to use its simple HTTP server
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python web server...
    start "" http://localhost:8000
    python -m http.server 8000
    goto end
)

REM Check if Python3 is installed
where python3 >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Python web server...
    start "" http://localhost:8000
    python3 -m http.server 8000
    goto end
)

REM If neither Python nor Python3 is available, just open the file directly
echo Python not found, opening file directly...
start "" index.html

:end 