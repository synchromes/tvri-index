@echo off
echo ========================================
echo   TVRI Index - Full Stack Startup
echo ========================================
echo.
echo Starting both Backend and Frontend servers...
echo.

REM Start backend in new window
start "TVRI Backend" cmd /k "%~dp0start-backend.bat"

REM Wait 3 seconds
timeout /t 3 /nobreak >nul

REM Start frontend in new window  
start "TVRI Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo [SUCCESS] Both servers are starting!
echo.
echo Backend:  http://localhost:8000/docs
echo Frontend: http://localhost:3000
echo.

pause
