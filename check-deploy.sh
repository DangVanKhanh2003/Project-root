#!/bin/bash
# Script to check deployment status on server
# Usage: ./check-deploy.sh ytmp3.my

APP_NAME="${1:-ytmp3.my}"
SERVER="root@85.10.196.119"

# Map app name to domain
case "$APP_NAME" in
  "4kvideopro") DOMAIN="4kvideo.pro" ;;
  "ytmp3.my") DOMAIN="ytmp3.my" ;;
  "y2matepro") DOMAIN="y2matepro.com" ;;
  "y2matevc") DOMAIN="y2mate.vc" ;;
  "ytmp3-clone-3") DOMAIN="ytmp3-clone-3.com" ;;
  "mp3fast") DOMAIN="mp3fast.net" ;;
  "ytmp3-clone-5") DOMAIN="ytmp3-clone-5.com" ;;
  *) DOMAIN="$APP_NAME" ;;
esac

RUN_DIR="/var/www/KhanhHAUI/CICD/run/$DOMAIN"

echo "=========================================="
echo "Checking deployment: $APP_NAME"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

ssh "$SERVER" "
echo '1. Check if directory exists:'
ls -ld '$RUN_DIR' 2>/dev/null || echo 'Directory not found!'

echo ''
echo '2. Recent files (last modified):'
find '$RUN_DIR' -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -10

echo ''
echo '3. File count:'
find '$RUN_DIR' -type f 2>/dev/null | wc -l

echo ''
echo '4. Index.html info:'
ls -lh '$RUN_DIR/index.html' 2>/dev/null || echo 'index.html not found!'

echo ''
echo '5. Nginx config for this domain:'
grep -r '$DOMAIN' /etc/nginx/sites-enabled/ 2>/dev/null | head -5

echo ''
echo '6. Check if nginx config has correct root:'
grep -A 10 'server_name.*$DOMAIN' /etc/nginx/sites-enabled/* 2>/dev/null | grep root
"

echo ""
echo "=========================================="
echo "Troubleshooting commands:"
echo "=========================================="
echo ""
echo "# If files are old, redeploy:"
echo "pnpm deploy"
echo ""
echo "# Check nginx config:"
echo "ssh $SERVER 'sudo nginx -t'"
echo ""
echo "# Reload nginx:"
echo "ssh $SERVER 'sudo systemctl reload nginx'"
echo ""
echo "# Check nginx logs:"
echo "ssh $SERVER 'sudo tail -f /var/log/nginx/error.log'"
echo ""
