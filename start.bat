@echo off
title ILDP Pangasinan Server

echo Building frontend...
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo Building server...
call npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
if %ERRORLEVEL% NEQ 0 (
    echo Server build failed!
    pause
    exit /b 1
)

echo Starting server on http://localhost:3000
node dist/server.cjs
