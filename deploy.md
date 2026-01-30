# Hướng Dẫn Deploy Thủ Công

## Bước 1: Build App

### Build 1 app cụ thể
```bash
# Build 4kvideopro
pnpm --filter ./apps/4kvideopro run build

# Build ytmp3.my
pnpm --filter ./apps/ytmp3.my run build

# Build y2matepro
pnpm --filter ./apps/y2matepro run build

# Build các app khác
pnpm --filter ./apps/y2matevc run build
pnpm --filter ./apps/ytmp3-clone-3 run build
pnpm --filter ./apps/mp3fast run build
pnpm --filter ./apps/ytmp3-clone-5 run build
```

### Build cho test environment (với noindex)
```bash
pnpm --filter ./apps/4kvideopro run build:test
```

## Bước 2: Tạo Archive File

### Tạo tar.gz từ dist folder
```bash
# Đối với 4kvideopro
cd apps/4kvideopro
tar -czf 4kvideopro-dist.tar.gz -C dist .

# Đối với ytmp3.my
cd apps/ytmp3.my
tar -czf ytmp3.my-dist.tar.gz -C dist .

# Quay lại root
cd ../..
```

### Hoặc tạo từ root directory
```bash
# 4kvideopro
tar -czf 4kvideopro-dist.tar.gz -C apps/4kvideopro/dist .

# ytmp3.my
tar -czf ytmp3.my-dist.tar.gz -C apps/ytmp3.my/dist .

# y2matepro
tar -czf y2matepro-dist.tar.gz -C apps/y2matepro/dist .

# y2matevc
tar -czf y2matevc-dist.tar.gz -C apps/y2matevc/dist .

# ytmp3-clone-3
tar -czf ytmp3-clone-3-dist.tar.gz -C apps/ytmp3-clone-3/dist .

# mp3fast
tar -czf mp3fast-dist.tar.gz -C apps/mp3fast/dist .

# ytmp3-clone-5
tar -czf ytmp3-clone-5-dist.tar.gz -C apps/ytmp3-clone-5/dist .
```

## Bước 3: Upload lên Server

### Sử dụng SCP
```bash
# Thay YOUR_USER và YOUR_SERVER bằng thông tin của bạn
# Ví dụ: gitdeploy@192.168.1.100

# Upload 4kvideopro
scp 4kvideopro-dist.tar.gz root@85.10.196.119:/tmp/

# Upload ytmp3.my
scp ytmp3.my-dist.tar.gz root@85.10.196.119:/tmp/

# Upload các app khác
scp y2matepro-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/
scp y2matevc-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/
scp ytmp3-clone-3-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/
scp mp3fast-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/
scp ytmp3-clone-5-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/
```

### Hoặc sử dụng SFTP
```bash
sftp YOUR_USER@YOUR_SERVER
# Sau khi kết nối:
put 4kvideopro-dist.tar.gz /tmp/
put ytmp3.my-dist.tar.gz /tmp/
bye
```

## Bước 4: SSH vào Server và Deploy

### Kết nối SSH
```bash
ssh root@85.10.196.119
```

### Deploy 4kvideopro
```bash
# Biến môi trường
PROJECT_NAME="4kvideo.pro"
APP_TAR="/tmp/4kvideopro-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"

# Tạo thư mục
mkdir -p "$RUN_DIR"

# Kiểm tra quyền ghi
touch "$RUN_DIR/.writetest" && rm -f "$RUN_DIR/.writetest"

# Xóa files cũ
find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

# Giải nén
tar -xzf "$APP_TAR" -C "$RUN_DIR"

# Đặt quyền
find "$RUN_DIR" -type d -exec chmod 755 {} +
find "$RUN_DIR" -type f -exec chmod 644 {} +

# Đổi group (nếu cần)
chgrp -R nginx "$RUN_DIR" || true

# Xóa tar file
rm -f "$APP_TAR"

echo "✅ Deployed $PROJECT_NAME successfully!"
```

### Deploy ytmp3.my (Đã SSH vào server)
```bash
# ⚠️ Chạy TỪNG DÒNG sau khi đã: ssh root@85.10.196.119
PROJECT_NAME="ytmp3.my"
APP_TAR="/tmp/ytmp3.my-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"

mkdir -p "$RUN_DIR"
find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar -xzf "$APP_TAR" -C "$RUN_DIR"
find "$RUN_DIR" -type d -exec chmod 755 {} +
find "$RUN_DIR" -type f -exec chmod 644 {} +
chgrp -R nginx "$RUN_DIR" || true
rm -f "$APP_TAR"
echo "✅ Deployed $PROJECT_NAME successfully!"
```

### Deploy ytmp3.my (ONE LINE - trên server)
```bash
# ⚠️ Sau khi đã SSH vào server, chạy 1 dòng:
PROJECT_NAME="ytmp3.my" && RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME" && mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "/tmp/ytmp3.my-dist.tar.gz" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "/tmp/ytmp3.my-dist.tar.gz" && echo "✅ Deployed!"
```

### Deploy các app khác

#### y2matepro
```bash
PROJECT_NAME="y2matepro.com"
APP_TAR="/tmp/y2matepro-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "$APP_TAR" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "$APP_TAR" && echo "✅ Deployed!"
```

#### y2matevc
```bash
PROJECT_NAME="y2mate.vc"
APP_TAR="/tmp/y2matevc-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "$APP_TAR" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "$APP_TAR" && echo "✅ Deployed!"
```

#### ytmp3-clone-3
```bash
PROJECT_NAME="ytmp3-clone-3.com"
APP_TAR="/tmp/ytmp3-clone-3-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "$APP_TAR" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "$APP_TAR" && echo "✅ Deployed!"
```

#### mp3fast
```bash
PROJECT_NAME="mp3fast.net"
APP_TAR="/tmp/mp3fast-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "$APP_TAR" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "$APP_TAR" && echo "✅ Deployed!"
```

#### ytmp3-clone-5
```bash
PROJECT_NAME="ytmp3-clone-5.com"
APP_TAR="/tmp/ytmp3-clone-5-dist.tar.gz"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "$APP_TAR" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "$APP_TAR" && echo "✅ Deployed!"
```

## Bước 5: Kiểm Tra

### Kiểm tra files trên server
```bash
# List files trong RUN_DIR
ls -lh /var/www/KhanhHAUI/CICD/run/4kvideo.pro/

# Kiểm tra quyền
ls -la /var/www/KhanhHAUI/CICD/run/4kvideo.pro/ | head -20

# Test nginx config
sudo nginx -t

# Reload nginx (nếu cần)
sudo systemctl reload nginx
```

### Kiểm tra website
```bash
# Từ server
curl -I http://localhost

# Từ máy local
curl -I https://4kvideo.pro
```

## Bước 6: Cleanup

### Xóa file tar local
```bash
# Từ máy local, trong thư mục project
rm -f 4kvideopro-dist.tar.gz
rm -f ytmp3.my-dist.tar.gz
rm -f y2matepro-dist.tar.gz
rm -f y2matevc-dist.tar.gz
rm -f ytmp3-clone-3-dist.tar.gz
rm -f mp3fast-dist.tar.gz
rm -f ytmp3-clone-5-dist.tar.gz
```

---

## All-in-One Commands

### Deploy 4kvideopro (Full)
```bash
# Local - Build & Upload
pnpm --filter ./apps/4kvideopro run build && \
tar -czf 4kvideopro-dist.tar.gz -C apps/4kvideopro/dist . && \
scp 4kvideopro-dist.tar.gz YOUR_USER@YOUR_SERVER:/tmp/

# Server - Extract & Deploy
ssh YOUR_USER@YOUR_SERVER "
PROJECT_NAME='4kvideo.pro';
RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME';
mkdir -p \$RUN_DIR;
find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} +;
tar -xzf /tmp/4kvideopro-dist.tar.gz -C \$RUN_DIR;
find \$RUN_DIR -type d -exec chmod 755 {} +;
find \$RUN_DIR -type f -exec chmod 644 {} +;
chgrp -R nginx \$RUN_DIR;
rm -f /tmp/4kvideopro-dist.tar.gz;
echo '✅ Deployed!'
"

# Cleanup local
rm -f 4kvideopro-dist.tar.gz
```

### Deploy ytmp3.my (Full - ONE LINER từ local)
```bash
# Chạy TẤT CẢ từ máy local (không cần SSH vào trước)
pnpm --filter ./apps/ytmp3.my run build && \
tar -czf ytmp3.my-dist.tar.gz -C apps/ytmp3.my/dist . && \
scp ytmp3.my-dist.tar.gz root@85.10.196.119:/tmp/ && \
ssh root@85.10.196.119 "
PROJECT_NAME='ytmp3.my';
RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME';
mkdir -p \$RUN_DIR;
find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} +;
tar -xzf /tmp/ytmp3.my-dist.tar.gz -C \$RUN_DIR;
find \$RUN_DIR -type d -exec chmod 755 {} +;
find \$RUN_DIR -type f -exec chmod 644 {} +;
chgrp -R nginx \$RUN_DIR;
rm -f /tmp/ytmp3.my-dist.tar.gz;
echo '✅ Deployed!'
"

# Cleanup
rm -f ytmp3.my-dist.tar.gz
```

---

## Mapping Domain ↔ Project Name

| App Name | Domain/Project Name | Tar Filename |
|----------|-------------------|--------------|
| 4kvideopro | 4kvideo.pro | 4kvideopro-dist.tar.gz |
| ytmp3.my | ytmp3.my | ytmp3.my-dist.tar.gz |
| y2matepro | y2matepro.com | y2matepro-dist.tar.gz |
| y2matevc | y2mate.vc | y2matevc-dist.tar.gz |
| ytmp3-clone-3 | ytmp3-clone-3.com | ytmp3-clone-3-dist.tar.gz |
| mp3fast | mp3fast.net | mp3fast-dist.tar.gz |
| ytmp3-clone-5 | ytmp3-clone-5.com | ytmp3-clone-5-dist.tar.gz |

---

## Tips

1. **Thay YOUR_USER@YOUR_SERVER**: Ví dụ `gitdeploy@192.168.1.100`
2. **Chạy từng bước**: Kiểm tra từng bước trước khi chạy tiếp
3. **Kiểm tra quyền**: Đảm bảo user có quyền write vào `/var/www/KhanhHAUI/CICD/run/`
4. **Backup**: Có thể backup folder cũ trước khi deploy: `cp -r $RUN_DIR $RUN_DIR.backup`
5. **Log**: Kiểm tra nginx error log nếu có lỗi: `sudo tail -f /var/log/nginx/error.log`
