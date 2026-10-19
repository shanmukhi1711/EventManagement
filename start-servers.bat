@echo off
echo Starting VNR VJIET Event Management System...
echo.

echo Starting Backend Server (Port 6017)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server (Port 3017)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:6017
echo Frontend: http://localhost:3017
echo.
echo Press any key to exit...
pause > nul