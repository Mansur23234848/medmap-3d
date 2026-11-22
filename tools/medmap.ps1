param([ValidateSet('start', 'stop', 'setup-email')][string]$Action = 'start')
# MEDMAP 3D launcher for Windows + XAMPP. Called by START_MEDMAP.bat / STOP_MEDMAP.bat / SETUP_EMAIL.bat.
# Native tools (npm, prisma) write warnings to stderr; results are checked explicitly instead.
$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$Root = Split-Path -Parent $PSScriptRoot
$Server = Join-Path $Root 'server'
$Client = Join-Path $Root 'client'
$Xampp = 'C:\xampp'
$Htdocs = Join-Path $Xampp 'htdocs\medmap3d'
$EnvFile = Join-Path $Server '.env'
$LogDir = Join-Path $Root 'logs'

function Say($msg, $color = 'Gray') { Write-Host "  $msg" -ForegroundColor $color }
function Ok($msg) { Say "[OK] $msg" 'Green' }
function Warn($msg) { Say "[!]  $msg" 'Yellow' }
function Fail($msg) { Say "[X]  $msg" 'Red' }

function Test-Port([int]$Port) {
  $c = New-Object System.Net.Sockets.TcpClient
  try { $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null); $ok = $iar.AsyncWaitHandle.WaitOne(400); if ($ok) { $c.EndConnect($iar) }; return $ok -and $c.Connected } catch { return $false } finally { $c.Close() }
}
function Wait-Port([int]$Port, [int]$Seconds) {
  for ($i = 0; $i -lt $Seconds; $i++) { if (Test-Port $Port) { return $true }; Start-Sleep -Seconds 1 }
  return $false
}
function Get-HttpStatus([string]$Url) {
  try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).StatusCode } catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode } return 0 }
}
function Get-MySqlPort {
  $ini = Join-Path $Xampp 'mysql\bin\my.ini'
  if (Test-Path $ini) {
    $m = Select-String -Path $ini -Pattern '^\s*port\s*=\s*(\d+)' | Select-Object -First 1
    if ($m) { return [int]$m.Matches[0].Groups[1].Value }
  }
  return 3306
}
function Set-EnvValue([string]$Key, [string]$Value) {
  $lines = if (Test-Path $EnvFile) { [System.IO.File]::ReadAllLines($EnvFile) } else { @() }
  $found = $false
  $out = foreach ($l in $lines) { if ($l -match "^\s*$Key\s*=") { $found = $true; "$Key=$Value" } else { $l } }
  if (-not $found) { $out = @($out) + "$Key=$Value" }
  [System.IO.File]::WriteAllLines($EnvFile, [string[]]$out, (New-Object System.Text.UTF8Encoding($false)))
}

# ======================================================================
if ($Action -eq 'stop') {
  Write-Host ''; Say 'MEDMAP 3D тоқтатылуда...' 'Cyan'
  foreach ($p in 4000, 5173) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) { try { Stop-Process -Id $c.OwningProcess -Force; Ok "Порт $p босатылды (PID $($c.OwningProcess))" } catch { Warn "PID $($c.OwningProcess) тоқтатылмады" } }
  }
  Say 'XAMPP Apache мен MySQL басқа жобалар үшін қосулы қалады (XAMPP Control Panel арқылы тоқтатуға болады).'
  Ok 'MEDMAP 3D сервері тоқтатылды.'
  exit 0
}

# ======================================================================
if ($Action -eq 'setup-email') {
  Write-Host ''; Say 'Gmail SMTP баптауы' 'Cyan'
  Say 'Қажет: Google аккаунтында 2 қадамды растау қосулы болуы және App Password (қолданба құпиясөзі) жасалуы керек:'
  Say 'https://myaccount.google.com/apppasswords'
  Write-Host ''
  $user = Read-Host '  Gmail мекенжайы (мыс. example@gmail.com)'
  if ($user -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') { Fail 'Email мекенжайы дұрыс емес'; exit 1 }
  $sec = Read-Host '  App Password (16 таңба, экранда көрінбейді)' -AsSecureString
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)) -replace '\s', ''
  if ($plain.Length -lt 16) { Fail 'App Password 16 таңбадан тұруы керек'; exit 1 }
  $admin = Read-Host "  Жаңа өтінімдер туралы хат баратын мекенжай (Enter = $user)"
  if (-not $admin) { $admin = $user }
  Set-EnvValue 'SMTP_HOST' 'smtp.gmail.com'
  Set-EnvValue 'SMTP_PORT' '587'
  Set-EnvValue 'SMTP_USER' $user
  Set-EnvValue 'SMTP_PASS' $plain
  Set-EnvValue 'SMTP_FROM' "`"MEDMAP 3D <$user>`""
  Set-EnvValue 'ADMIN_NOTIFY_EMAIL' $admin
  $plain = $null
  Ok 'SMTP параметрлері server\.env файлына сақталды (бұл файл GitHub-қа жіберілмейді).'
  Say 'Өзгеріс күшіне енуі үшін STOP_MEDMAP.bat, содан кейін START_MEDMAP.bat іске қосыңыз.'
  exit 0
}

# ======================================================================
Write-Host ''
Write-Host '  ==============================================' -ForegroundColor Cyan
Write-Host '     MEDMAP 3D — іске қосу' -ForegroundColor Cyan
Write-Host '  ==============================================' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# 1) Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail 'Node.js табылмады. https://nodejs.org сайтынан LTS нұсқасын орнатыңыз.'; exit 1 }
Ok "Node.js $(node -v)"

# 2) MySQL (XAMPP)
$dbPort = Get-MySqlPort
if (-not (Test-Port $dbPort)) {
  Warn "MySQL ($dbPort порт) өшірулі — XAMPP MySQL іске қосылуда..."
  $svc = Get-Service -Name mysql -ErrorAction SilentlyContinue
  if ($svc) { try { Start-Service mysql } catch { Start-Process -FilePath (Join-Path $Xampp 'mysql_start.bat') -WindowStyle Minimized } }
  else { Start-Process -FilePath (Join-Path $Xampp 'mysql_start.bat') -WindowStyle Minimized }
  if (-not (Wait-Port $dbPort 30)) { Fail 'MySQL іске қосылмады. XAMPP Control Panel-де MySQL → Start басыңыз да, қайталаңыз.'; exit 1 }
}
Ok "MySQL жұмыс істеп тұр (порт $dbPort)"

# 3) server/.env (first run on a new computer)
if (-not (Test-Path $EnvFile)) {
  Copy-Item (Join-Path $Server '.env.example') $EnvFile
  $bytes = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  Set-EnvValue 'JWT_SECRET' ('"' + (($bytes | ForEach-Object { $_.ToString('x2') }) -join '') + '"')
  Set-EnvValue 'DATABASE_URL' "`"mysql://root:@127.0.0.1:$dbPort/medmap3d`""
  & (Join-Path $Xampp 'mysql\bin\mysql.exe') -h 127.0.0.1 -P $dbPort -u root -e 'CREATE DATABASE IF NOT EXISTS medmap3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;' 2>$null
  Ok 'server\.env жасалды (XAMPP root, құпиясөзсіз)'
}

# 4) Dependencies
foreach ($d in @($Root, $Server, $Client)) {
  if (-not (Test-Path (Join-Path $d 'node_modules'))) {
    Say "npm install: $d (бірінші рет бірнеше минут алады)..."
    Push-Location $d; cmd /c 'npm install --no-audit --no-fund >nul 2>&1'; Pop-Location
  }
}
Ok 'npm пакеттері орнатылған'

# 5) Database schema + demo data (never wipes existing data)
Push-Location $Server
$dbLog = Join-Path $LogDir 'db.log'
cmd /c "npx prisma migrate deploy > `"$dbLog`" 2>&1"
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "Деректер базасы жаңартылмады. Толығырақ: logs\db.log"; exit 1 }
if (-not (Test-Path (Join-Path $Server 'node_modules\.prisma\client\index.js'))) { cmd /c "npx prisma generate >> `"$dbLog`" 2>&1" }
cmd /c 'set NODE_NO_WARNINGS=1&& npx tsx scripts/ensure-db.ts 2>&1'
Pop-Location
Ok 'Деректер базасы дайын (medmap3d)'

# 6) Web app build → XAMPP htdocs
$dist = Join-Path $Client 'dist'
$distIndex = Join-Path $dist 'index.html'
$needBuild = -not (Test-Path $distIndex)
if (-not $needBuild) {
  # Rebuild when any source file is newer than the last build.
  $builtAt = (Get-Item $distIndex).LastWriteTime
  $newer = Get-ChildItem -Path (Join-Path $Client 'src'), (Join-Path $Client 'public'), (Join-Path $Client 'index.html') -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -gt $builtAt } | Select-Object -First 1
  $needBuild = [bool]$newer
}
if ($needBuild) {
  Say 'Сайт құрастырылуда (build)...'
  $buildLog = Join-Path $LogDir 'build.log'
  Push-Location $Client; cmd /c "npm run build > `"$buildLog`" 2>&1"; Pop-Location
  if (-not (Test-Path (Join-Path $dist 'index.html'))) { Fail 'Build сәтсіз. logs\build.log қараңыз.'; exit 1 }
}
if (Test-Path (Join-Path $Xampp 'htdocs')) {
  robocopy $dist $Htdocs /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
  Ok "Сайт файлдары көшірілді: $Htdocs"
}

# 7) Apache (XAMPP)
$apacheOk = $false
if (Test-Port 80) { $apacheOk = $true }
elseif (Test-Path (Join-Path $Xampp 'apache\bin\httpd.exe')) {
  Warn 'Apache өшірулі — XAMPP Apache іске қосылуда...'
  Start-Process -FilePath (Join-Path $Xampp 'apache\bin\httpd.exe') -WorkingDirectory (Join-Path $Xampp 'apache') -WindowStyle Hidden
  $apacheOk = Wait-Port 80 15
}
if ($apacheOk) { Ok 'Apache жұмыс істеп тұр (порт 80)' } else { Warn 'Apache қосылмады — сайт Node сервері арқылы ашылады.' }

# 8) Node API (port 4000)
if (-not (Test-Port 4000)) {
  $log = Join-Path $LogDir 'server.log'
  Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', "npm run start > `"$log`" 2>&1" -WorkingDirectory $Server -WindowStyle Hidden
  $healthy = $false
  for ($i = 0; $i -lt 60; $i++) { if ((Get-HttpStatus 'http://localhost:4000/api/health') -eq 200) { $healthy = $true; break }; Start-Sleep -Seconds 1 }
  if (-not $healthy) { Fail 'API сервері іске қосылмады. logs\server.log қараңыз.'; exit 1 }
}
Ok 'API сервері жұмыс істеп тұр (http://localhost:4000/api)'

# 9) Open the site
$url = 'http://localhost:4000/medmap3d/'
if ($apacheOk -and (Get-HttpStatus 'http://localhost/medmap3d/') -eq 200) { $url = 'http://localhost/medmap3d/' }
Write-Host ''
Write-Host '  ==============================================' -ForegroundColor Green
Write-Host "   Сайт дайын:  $url" -ForegroundColor Green
Write-Host '   Әкімші:      admin@medmap.demo / Admin2026!' -ForegroundColor Green
Write-Host '   Барлық демо аккаунттар: DEMO_ACCOUNTS.md' -ForegroundColor Green
Write-Host '   Тоқтату:     STOP_MEDMAP.bat' -ForegroundColor Green
Write-Host '  ==============================================' -ForegroundColor Green
Start-Process $url

exit 0
