@echo off
setlocal
set "URL=http://localhost:3000/login"
start "VoyageAgent" "%URL%"
echo VoyageAgent login page opened in your default browser.
echo If the app is not running, start it first with: npm run dev
endlocal
