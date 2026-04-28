@echo off
setlocal enabledelayedexpansion

:: Get the directory where the script is located
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Check for Administrator rights
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] This script requires Administrator rights to install dependencies.
    echo Please right-click setup.bat and select 'Run as administrator'.
    pause
    exit /b 1
)

echo ==========================================
echo Pomelo Local Setup ^& Run Script
echo ==========================================

echo [1/6] Detecting dependencies...

:: 1. Try to find PostgreSQL via Registry (smarter parsing)
set "PG_REG_KEY=HKEY_LOCAL_MACHINE\SOFTWARE\PostgreSQL\Installations"
for /f "tokens=2*" %%a in ('reg query "%PG_REG_KEY%" /s /v "Base Directory" 2^>nul ^| findstr "Base Directory"') do (
    set "RAW_VAL=%%b"
    :: Strip "REG_SZ" and leading spaces
    set "PG_DIR=!RAW_VAL:*REG_SZ=!"
    for /f "tokens=* " %%i in ("!PG_DIR!") do set "PG_DIR=%%i"
    
    if defined PG_DIR (
        echo [+] Found PostgreSQL in registry: !PG_DIR!
        set "PATH=!PATH!;!PG_DIR!\bin"
    )
)

:: 2. Check PostgreSQL
psql --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] PostgreSQL not found in PATH. Checking winget...
    call winget install -e --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
) else (
    echo [+] PostgreSQL is detected.
)

:: 3. Check Python 3.11
py -3.11 --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] Python 3.11 not found. Attempting to install via winget...
    call winget install -e --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
) else (
    echo [+] Python 3.11 is detected.
)

:: 4. Check Node.js
node -v >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [!] Node.js not found. Attempting to install via winget...
    call winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
) else (
    echo [+] Node.js is detected.
)

echo [2/6] Setting up Backend...
cd /d "%PROJECT_ROOT%backend"
if exist venv (
    echo Refreshing virtual environment for Python 3.11...
    rmdir /s /q venv
)
echo Creating virtual environment (Python 3.11)...
echo This may take a minute, please wait...
call py -3.11 -m venv venv

echo Installing Python requirements...
call venv\Scripts\activate
call python -m pip install --upgrade pip
call python -m pip install -r requirements.txt

echo [3/6] Configuring Database...
set "PGPASSWORD=postgres"
if exist .env (
    for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PASSWORD=" .env') do set PGPASSWORD=%%a
)
set PGPASSWORD=%PGPASSWORD: =%
set PGPASSWORD=%PGPASSWORD:"=%

echo Testing connection to PostgreSQL (127.0.0.1)...
call psql -U postgres -h 127.0.0.1 -p 5432 -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not connect to PostgreSQL.
    pause
    exit /b 1
)

echo Checking if database 'pomelo' exists...
call psql -U postgres -h 127.0.0.1 -p 5432 -lqt | findstr /C:"pomelo" >nul
if %ERRORLEVEL% neq 0 (
    echo Creating database 'pomelo'...
    call createdb -U postgres -h 127.0.0.1 -p 5432 pomelo
)

echo [4/6] Running Migrations and Seeding...
call alembic upgrade head
call python seed.py

echo [5/6] Setting up Frontend...
cd /d "%PROJECT_ROOT%frontend"
echo Installing npm packages...
call npm install --legacy-peer-deps

echo [6/6] Launching Application...
echo.
start "Pomelo Backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
call npm run dev

pause
