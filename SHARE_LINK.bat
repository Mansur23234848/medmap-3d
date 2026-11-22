@echo off
chcp 65001 >nul
title MEDMAP 3D - SHARE LINK
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\medmap.ps1" share
echo.
pause
