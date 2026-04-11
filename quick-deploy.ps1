# Quick Deploy Script for Windows
# Usage: .\quick-deploy.ps1 ytmp3.my
# Usage: .\quick-deploy.ps1 4kvideopro

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName
)

$SERVER = "root@85.10.196.119"

$APP_CONFIGS = @{
    "4kvideopro" = @{
        domain = "4kvideo.pro"
        path = "./apps/4kvideopro"
    }
    "ytmp3.my" = @{
        domain = "ytmp3.my"
        path = "./apps/ytmp3.my"
    }
    "y2matepro" = @{
        domain = "y2matepro.com"
        path = "./apps/y2matepro"
    }
    "y2matevc" = @{
        domain = "y2mate.vc"
        path = "./apps/y2matevc"
    }
    "ytmp3-clone-3" = @{
        domain = "ytmp3-clone-3.com"
        path = "./apps/ytmp3-clone-3"
    }
    "mp3fast" = @{
        domain = "mp3fast.net"
        path = "./apps/mp3fast"
    }
    "ytmp3-clone-5" = @{
        domain = "ytmp3-clone-5.com"
        path = "./apps/ytmp3-clone-5"
    }
}

if (-not $APP_CONFIGS.ContainsKey($AppName)) {
    Write-Host "ERROR: Unknown app: $AppName" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available apps:" -ForegroundColor Yellow
    foreach ($app in $APP_CONFIGS.Keys) {
        Write-Host "  - $app" -ForegroundColor Cyan
    }
    exit 1
}

$config = $APP_CONFIGS[$AppName]
$DOMAIN = $config.domain
$APP_PATH = $config.path
$TAR_FILE = "$AppName-dist.tar.gz"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "[DEPLOY] Quick Deploy: $AppName" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Domain: $DOMAIN"
Write-Host "Path: $APP_PATH"
Write-Host ""

# Step 1: Build
Write-Host "[BUILD] [1/4] Building..." -ForegroundColor Yellow
pnpm --filter $APP_PATH run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    exit 1
}

# Step 2: Create archive
Write-Host "[BUILD] [2/4] Creating archive..." -ForegroundColor Yellow
$distPath = Join-Path $APP_PATH.Replace("./", "") "dist"
tar -czf $TAR_FILE -C $distPath .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Archive creation failed" -ForegroundColor Red
    exit 1
}
$fileSize = (Get-Item $TAR_FILE).Length / 1MB
Write-Host "OK: Created: $TAR_FILE ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green

# Step 3: Upload
Write-Host "[UPLOAD] [3/4] Uploading to server..." -ForegroundColor Yellow
scp $TAR_FILE "${SERVER}:/tmp/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Upload failed" -ForegroundColor Red
    Remove-Item $TAR_FILE -ErrorAction SilentlyContinue
    exit 1
}

# Step 4: Deploy on server
Write-Host "[DEPLOY] [4/4] Deploying on server..." -ForegroundColor Yellow
$deployScript = @"
set -e
PROJECT_NAME='$DOMAIN'
RUN_DIR='/var/www/KhanhHAUI/CICD/run/`$PROJECT_NAME'
echo "Deploying to: `$RUN_DIR"
mkdir -p "`$RUN_DIR"
find "`$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar -xzf /tmp/$TAR_FILE -C "`$RUN_DIR"
find "`$RUN_DIR" -type d -exec chmod 755 {} +
find "`$RUN_DIR" -type f -exec chmod 644 {} +
chgrp -R nginx "`$RUN_DIR" 2>/dev/null || true
rm -f /tmp/$TAR_FILE
echo "OK: Deployed to `$RUN_DIR"
ls -lh "`$RUN_DIR" | head -5
"@

ssh $SERVER $deployScript
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deploy failed" -ForegroundColor Red
    Remove-Item $TAR_FILE -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup local
Remove-Item $TAR_FILE -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "OK: Deploy completed: $AppName" -ForegroundColor Green
Write-Host "[WEB] Check: https://$DOMAIN" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
