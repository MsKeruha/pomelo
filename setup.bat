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
echo Pomelo Local Setup ^& Run Script (Python 3.11)
echo ==========================================

echo [1/6] Checking dependencies...

:: Install Python 3.11 specifically
py -3.11 --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Python 3.11 via winget...
    call winget install -e --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
) else (
    echo Python 3.11 is already installed.
)

:: Install Node.js
node --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing Node.js via winget...
    call winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
)

:: Install PostgreSQL
psql --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing PostgreSQL 15...
    call winget install -e --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
)

:: Refresh Path
set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin;C:\Windows"

echo [2/6] Setting up Backend...
cd /d "%PROJECT_ROOT%backend"
if exist venv (
    echo Refreshing virtual environment for Python 3.11...
    rmdir /s /q venv
)
echo Creating virtual environment (Python 3.11)...
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
