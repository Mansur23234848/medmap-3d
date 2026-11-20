@echo off
chcp 65001 >nul
title MEDMAP 3D
cd /d "%~dp0"
echo.
echo  MEDMAP 3D - iske kosylyp jatyr...
echo  1) XAMPP Control Panel-de MySQL kosuly ekenin tekseriniz (port 3307).
echo.
if not exist node_modules call npm install
if not exist server\node_modules call npm --prefix server install
if not exist client\node_modules call npm --prefix client install
start "" http://localhost:5173
call npm run dev
