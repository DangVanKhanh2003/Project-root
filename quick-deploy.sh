#!/bin/bash
# Quick Deploy Script
# Usage: ./quick-deploy.sh 4kvideopro
#        ./quick-deploy.sh ytmp3.my

set -e

APP_NAME="${1:-}"
SERVER="root@85.10.196.119"

# App configs
declare -A APP_DOMAINS=(
  ["4kvideopro"]="4kvideo.pro"
  ["ytmp3.my"]="ytmp3.my"
  ["y2matepro"]="y2matepro.com"
  ["y2matevc"]="y2mate.vc"
  ["ytmp3-clone-3"]="ytmp3-clone-3.com"
  ["mp3fast"]="mp3fast.net"
  ["ytmp3-clone-5"]="ytmp3-clone-5.com"
)

declare -A APP_PATHS=(
  ["4kvideopro"]="./apps/4kvideopro"
  ["ytmp3.my"]="./apps/ytmp3.my"
  ["y2matepro"]="./apps/y2matepro"
  ["y2matevc"]="./apps/y2matevc"
  ["ytmp3-clone-3"]="./apps/ytmp3-clone-3"
  ["mp3fast"]="./apps/mp3fast"
  ["ytmp3-clone-5"]="./apps/ytmp3-clone-5"
)

if [[ -z "$APP_NAME" ]]; then
  echo "ERROR: Usage: $0 <app-name>"
  echo ""
  echo "Available apps:"
  for app in "${!APP_DOMAINS[@]}"; do
    echo "  - $app"
  done
  exit 1
fi

if [[ -z "${APP_DOMAINS[$APP_NAME]}" ]]; then
  echo "ERROR: Unknown app: $APP_NAME"
  exit 1
fi

DOMAIN="${APP_DOMAINS[$APP_NAME]}"
APP_PATH="${APP_PATHS[$APP_NAME]}"
TAR_FILE="${APP_NAME}-dist.tar.gz"

echo "=========================================="
echo "[DEPLOY] Quick Deploy: $APP_NAME"
echo "=========================================="
echo "Domain: $DOMAIN"
echo "Path: $APP_PATH"
echo ""

# Step 1: Build
echo "[BUILD] [1/4] Building..."
pnpm --filter "$APP_PATH" run build

# Step 2: Create archive
echo "[BUILD] [2/4] Creating archive..."
tar -czf "$TAR_FILE" -C "${APP_PATH}/dist" .
echo "OK: Created: $TAR_FILE ($(du -h "$TAR_FILE" | cut -f1))"

# Step 3: Upload
echo "[UPLOAD] [3/4] Uploading to server..."
scp "$TAR_FILE" "$SERVER:/tmp/"

# Step 4: Deploy on server
echo "[DEPLOY] [4/4] Deploying on server..."
ssh "$SERVER" "
set -e
PROJECT_NAME='$DOMAIN'
RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME'
echo \"Deploying to: \$RUN_DIR\"
mkdir -p \"\$RUN_DIR\"
find \"\$RUN_DIR\" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar -xzf /tmp/$TAR_FILE -C \"\$RUN_DIR\"
find \"\$RUN_DIR\" -type d -exec chmod 755 {} +
find \"\$RUN_DIR\" -type f -exec chmod 644 {} +
chgrp -R nginx \"\$RUN_DIR\" 2>/dev/null || true
rm -f /tmp/$TAR_FILE
echo \"OK: Deployed to \$RUN_DIR\"
ls -lh \"\$RUN_DIR\" | head -5
"

# Cleanup local
rm -f "$TAR_FILE"

echo ""
echo "=========================================="
echo "OK: Deploy completed: $APP_NAME"
echo "[WEB] Check: https://$DOMAIN"
echo "=========================================="
