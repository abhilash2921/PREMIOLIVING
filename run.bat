@echo off
title Premio Living OS Launcher
echo ===================================================
echo             PREMIO LIVING OS LAUNCHER
echo ===================================================
echo Checking environment for local web server hosting...
echo.

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [FOUND] Python is installed.
    echo Starting local server on http://localhost:8000 ...
    echo (You can close this window to stop the server)
    start http://localhost:8000
    python -m http.server 8000
    goto end
)

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [FOUND] Node.js is installed.
    echo Starting local server on http://localhost:3000 ...
    start http://localhost:3000
    node -e "const http = require('http'), fs = require('fs'), path = require('path'); http.createServer((req, res) => { let filePath = '.' + decodeURIComponent(req.url); if (filePath === './') filePath = './index.html'; const ext = path.extname(filePath); let contentType = 'text/html'; if (ext === '.js') contentType = 'text/javascript'; else if (ext === '.css') contentType = 'text/css'; else if (ext === '.pdf') contentType = 'application/pdf'; fs.readFile(filePath, (err, content) => { if (err) { res.writeHead(404); res.end('File not found'); } else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content); } }); }).listen(3000);"
    goto end
)

echo [INFO] Neither Python nor Node.js were found in your PATH.
echo Launching index.html directly in your default web browser...
echo.
start index.html

:end
pause
