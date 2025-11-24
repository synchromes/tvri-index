@echo off
echo ========================================
echo   TVRI Index - Backend Server Startup
echo ========================================
echo.

REM Change to backend directory
cd /d "%~dp0backend"

REM Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment tidak ditemukan!
    echo Silakan jalankan: python -m venv venv
    echo Lalu install dependencies: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Starting FastAPI server...
echo [INFO] Server akan berjalan di: http://localhost:8000
echo [INFO] API Docs tersedia di: http://localhost:8000/docs
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo ========================================
echo.

REM Run uvicorn server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
