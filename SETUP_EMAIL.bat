@echo off
chcp 65001 >nul
title MEDMAP 3D - SETUP_EMAIL
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\medmap.ps1" setup-email
echo.
pause
