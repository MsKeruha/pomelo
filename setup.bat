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

echo [1/6] Checking dependencies...

:: Install PostgreSQL (ensure it's in path)
psql --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Installing PostgreSQL 15...
    call winget install -e --id PostgreSQL.PostgreSQL.15 --silent --accept-package-agreements --accept-source-agreements
)

:: Refresh Path
set "PATH=%PATH%;C:\Program Files\PostgreSQL\15\bin;C:\Program Files\Python311;C:\Program Files\nodejs"

echo [2/6] Setting up Backend...
cd /d "%PROJECT_ROOT%backend"
if not exist venv (
    echo Creating virtual environment...
    call python -m venv venv
)

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
:: Try a simple psql command to see if we can connect
call psql -U postgres -h 127.0.0.1 -p 5432 -c "SELECT 1" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not connect to PostgreSQL at 127.0.0.1.
    echo Please ensure the PostgreSQL service is running and the password is correct.
    echo Current password being tried: !PGPASSWORD!
    echo.
    echo Instruction to fix password in SQL Shell:
    echo ALTER USER postgres PASSWORD 'postgres';
    echo.
    pause
    exit /b 1
)

echo Checking if database 'pomelo' exists...
call psql -U postgres -h 127.0.0.1 -p 5432 -lqt | findstr /C:"pomelo" >nul
if %ERRORLEVEL% neq 0 (
    echo Creating database 'pomelo'...
    :: No hiding errors here so we can see what's wrong
    call createdb -U postgres -h 127.0.0.1 -p 5432 pomelo
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create database 'pomelo'.
        pause
        exit /b 1
    )
) else (
    echo Database 'pomelo' already exists.
)

echo [4/6] Running Migrations and Seeding...
echo Applying migrations (alembic)...
call alembic upgrade head
echo Seeding data...
call python seed.py

echo [5/6] Setting up Frontend...
cd /d "%PROJECT_ROOT%frontend"
echo Installing npm packages...
call npm install

echo [6/6] Launching Application...
echo.
echo Starting Backend in a new window...
start "Pomelo Backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Starting Frontend...
call npm run dev

pause
