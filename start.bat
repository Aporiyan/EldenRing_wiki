@echo off
cd /d "%~dp0"
if not exist "node_modules\" (
    echo First run detected. Installing dependencies...
    npm install
)
echo Starting server...
npx vite --port 3000 --open
pause
