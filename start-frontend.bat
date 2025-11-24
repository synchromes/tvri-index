@echo off
echo ========================================
echo   TVRI Index - Frontend Dev Server
echo ========================================
echo.

REM Change to frontend directory
cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] node_modules tidak ditemukan!
    echo [INFO] Installing dependencies...
    call npm install
    echo.
)

echo [INFO] Starting Next.js development server...
echo [INFO] Server akan berjalan di: http://localhost:3000
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo ========================================
echo.

REM Run Next.js dev server
npm run dev

pause
