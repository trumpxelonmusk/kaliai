@echo off
echo ========================================
echo    Security AI Frontend Startup
echo ========================================
echo.

echo Starting frontend server...
echo.
echo Frontend URL: http://localhost:3000/chatbot-ui-1/
echo Backend URL: http://127.0.0.1:8000
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
python -m http.server 3000

pause 