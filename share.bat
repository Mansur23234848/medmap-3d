@echo off
chcp 65001 >nul
title MEDMAP 3D - public link
rem Run start.bat first (site must be running on http://localhost:5173).
rem Creates a temporary public https://...trycloudflare.com link. Requires: winget install Cloudflare.cloudflared
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate --url http://localhost:5173
