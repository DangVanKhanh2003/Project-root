#!/bin/bash
# Setup Nginx config for apps
# Usage: ./setup-nginx.sh

SERVER="root@85.10.196.119"

echo "Setting up Nginx configs on server..."

ssh "$SERVER" 'bash -s' << 'ENDSSH'

# Create nginx config directory if not exists
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Check if main nginx.conf includes sites-enabled
if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
  echo "Adding sites-enabled to nginx.conf..."
  sed -i '/http {/a \    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
fi

# Function to create site config
create_site_config() {
  local DOMAIN=$1
  local RUN_DIR=$2
  local CONFIG_FILE="/etc/nginx/sites-available/$DOMAIN"

  echo "Creating config for $DOMAIN..."

  cat > "$CONFIG_FILE" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $RUN_DIR;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;

    # Main location
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }

    # 404 page
    error_page 404 /404.html;
}
EOF

  # Enable site
  ln -sf "$CONFIG_FILE" /etc/nginx/sites-enabled/

  echo "✓ Created and enabled: $DOMAIN"
}

# Create configs for all apps
create_site_config "4kvideo.pro" "/var/www/KhanhHAUI/CICD/run/4kvideo.pro"
create_site_config "ytmp3.my" "/var/www/KhanhHAUI/CICD/run/ytmp3.my"
create_site_config "y2matepro.com" "/var/www/KhanhHAUI/CICD/run/y2matepro.com"
create_site_config "y2mate.vc" "/var/www/KhanhHAUI/CICD/run/y2mate.vc"
create_site_config "ytmp3-clone-3.com" "/var/www/KhanhHAUI/CICD/run/ytmp3-clone-3.com"
create_site_config "mp3fast.net" "/var/www/KhanhHAUI/CICD/run/mp3fast.net"
create_site_config "ytmp3-clone-5.com" "/var/www/KhanhHAUI/CICD/run/ytmp3-clone-5.com"

echo ""
echo "=========================================="
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ Nginx config is valid!"
  echo ""
  echo "Reloading nginx..."
  systemctl reload nginx
  echo "✓ Nginx reloaded!"
  echo ""
  echo "=========================================="
  echo "Enabled sites:"
  ls -1 /etc/nginx/sites-enabled/
else
  echo ""
  echo "✗ Nginx config has errors. Please check manually."
  exit 1
fi

ENDSSH

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Test your sites:"
echo "  curl -I http://4kvideo.pro"
echo "  curl -I http://ytmp3.my"
echo ""
