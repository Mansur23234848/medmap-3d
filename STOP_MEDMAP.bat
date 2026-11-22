@echo off
chcp 65001 >nul
title MEDMAP 3D - STOP
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\medmap.ps1" stop
echo.
pause
