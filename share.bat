@echo off
chcp 65001 >nul
title MEDMAP 3D - public link
rem Run START_MEDMAP.bat first. Creates a temporary public https://...trycloudflare.com link to the site.
rem Requires: winget install Cloudflare.cloudflared
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate --url http://localhost:4000
