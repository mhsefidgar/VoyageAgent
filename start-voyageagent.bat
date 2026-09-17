@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)
start "VoyageAgent" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/login"
endlocal
