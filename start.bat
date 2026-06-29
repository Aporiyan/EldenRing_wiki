@echo off
cd /d "%~dp0"
echo ====================================
echo   ELDEN RING Wiki - 本地知识库
echo ====================================
echo.
echo 正在启动服务器...
echo.
npx vite --port 3000 --open
echo.
pause
