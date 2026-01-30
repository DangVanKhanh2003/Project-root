# 🚀 Hướng Dẫn Deploy

Tài liệu này hướng dẫn cách deploy các apps trong monorepo lên server production.

---

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cách Deploy Nhanh (Khuyến Nghị)](#cách-deploy-nhanh-khuyến-nghị)
- [Cách Deploy Thủ Công](#cách-deploy-thủ-công)
- [Danh Sách Apps](#danh-sách-apps)
- [Troubleshooting](#troubleshooting)

---

## Yêu Cầu Hệ Thống

### Trên máy local (Windows)
- ✅ Git Bash hoặc PowerShell
- ✅ Node.js 20+
- ✅ pnpm 10+
- ✅ SSH client (OpenSSH)
- ✅ tar (có sẵn trong Git Bash)

### Trên server
- ✅ SSH access với key hoặc password
- ✅ Nginx đã cấu hình
- ✅ Quyền write vào `/var/www/KhanhHAUI/CICD/run/`

---

## Cách Deploy Nhanh (Khuyến Nghị)

### 🎯 Sử dụng Menu Interactive

#### Trên Windows PowerShell:
```powershell
.\deploy-menu.ps1
```

#### Trên Git Bash / Linux:
```bash
chmod +x deploy-menu.sh
./deploy-menu.sh
```

### Menu có các option:

```
[1-7] Deploy một app cụ thể
[A]   Deploy TẤT CẢ apps
[M]   Deploy NHIỀU apps (ví dụ: 1,2,5)
[Q]   Thoát
```

### Ví dụ sử dụng:

1. **Deploy 1 app**: Nhập số `2` để deploy ytmp3.my
2. **Deploy nhiều apps**: Nhập `M`, sau đó nhập `1,2,7` để deploy 3 apps
3. **Deploy tất cả**: Nhập `A` và confirm với `y`

---

## Cách Deploy Thủ Công

Nếu không dùng script, xem hướng dẫn chi tiết trong file **[deploy.md](./deploy.md)**

### Quick Commands:

#### Deploy ytmp3.my (All-in-One)
```bash
# Build và upload
pnpm --filter ./apps/ytmp3.my run build && \
tar -czf ytmp3.my-dist.tar.gz -C apps/ytmp3.my/dist . && \
scp ytmp3.my-dist.tar.gz root@85.10.196.119:/tmp/

# SSH vào server và deploy
ssh root@85.10.196.119
PROJECT_NAME="ytmp3.my" && RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME" && mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "/tmp/ytmp3.my-dist.tar.gz" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "/tmp/ytmp3.my-dist.tar.gz" && echo "✅ Deployed!"
```

#### Deploy 4kvideopro (All-in-One)
```bash
# Build và upload
pnpm --filter ./apps/4kvideopro run build && \
tar -czf 4kvideopro-dist.tar.gz -C apps/4kvideopro/dist . && \
scp 4kvideopro-dist.tar.gz root@85.10.196.119:/tmp/

# SSH vào server và deploy
ssh root@85.10.196.119
PROJECT_NAME="4kvideo.pro" && RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME" && mkdir -p "$RUN_DIR" && find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf "/tmp/4kvideopro-dist.tar.gz" -C "$RUN_DIR" && find "$RUN_DIR" -type d -exec chmod 755 {} + && find "$RUN_DIR" -type f -exec chmod 644 {} + && chgrp -R nginx "$RUN_DIR" && rm -f "/tmp/4kvideopro-dist.tar.gz" && echo "✅ Deployed!"
```

---

## Danh Sách Apps

| # | App Name | Domain | Directory |
|---|----------|--------|-----------|
| 1 | 4kvideopro | 4kvideo.pro | apps/4kvideopro |
| 2 | ytmp3.my | ytmp3.my | apps/ytmp3.my |
| 3 | y2matepro | y2matepro.com | apps/y2matepro |
| 4 | y2matevc | y2mate.vc | apps/y2matevc |
| 5 | ytmp3-clone-3 | ytmp3-clone-3.com | apps/ytmp3-clone-3 |
| 6 | mp3fast | mp3fast.net | apps/mp3fast |
| 7 | ytmp3-clone-5 | ytmp3-clone-5.com | apps/ytmp3-clone-5 |

---

## 📁 Files Liên Quan

- **`deploy-menu.ps1`** - Script menu interactive cho Windows PowerShell (KHUYẾN NGHỊ)
- **`deploy-menu.sh`** - Script menu interactive cho Git Bash/Linux
- **`quick-deploy.ps1`** - Deploy 1 app nhanh (Windows): `.\quick-deploy.ps1 ytmp3.my`
- **`quick-deploy.sh`** - Deploy 1 app nhanh (Linux): `./quick-deploy.sh ytmp3.my`
- **`deploy.md`** - Hướng dẫn chi tiết các lệnh thủ công

---

## Quy Trình Deploy

### 1. Build App
```bash
pnpm --filter ./apps/<app-name> run build
```

### 2. Tạo Archive
```bash
tar -czf <app-name>-dist.tar.gz -C apps/<app-name>/dist .
```

### 3. Upload lên Server
```bash
scp <app-name>-dist.tar.gz root@85.10.196.119:/tmp/
```

### 4. Deploy trên Server
```bash
ssh root@85.10.196.119
# Chạy lệnh deploy (xem deploy.md)
```

---

## Troubleshooting

### ❌ Lỗi "tar: Cannot open: No such file or directory"
**Nguyên nhân**: File tar chưa được upload lên server

**Giải quyết**: Chạy lại bước 2 và 3 (tạo archive và upload)

### ❌ Lỗi "Permission denied" khi tạo thư mục
**Nguyên nhân**: User SSH không có quyền write

**Giải quyết**:
```bash
# Trên server, với quyền root:
mkdir -p /var/www/KhanhHAUI/CICD/run
chown -R gitdeploy:nginx /var/www/KhanhHAUI/CICD/run
chmod -R 775 /var/www/KhanhHAUI/CICD/run
```

### ❌ Build fail
**Giải quyết**:
```bash
# Xóa node_modules và cài lại
rm -rf node_modules
pnpm install --frozen-lockfile

# Build lại
pnpm --filter ./apps/<app-name> run build
```

### ❌ SSH connection timeout
**Giải quyết**:
- Kiểm tra IP server: `ping 85.10.196.119`
- Kiểm tra SSH port: `ssh -v root@85.10.196.119`
- Kiểm tra firewall

### ⚠️ Website không cập nhật sau deploy
**Giải quyết**:
```bash
# Trên server
# 1. Kiểm tra files đã deploy
ls -lh /var/www/KhanhHAUI/CICD/run/<domain>/

# 2. Reload nginx
sudo nginx -t
sudo systemctl reload nginx

# 3. Clear browser cache
# Ctrl + F5 hoặc Ctrl + Shift + R
```

---

## Tips & Best Practices

### ✅ Deploy an toàn
1. Test trên môi trường local trước: `pnpm dev`
2. Build và kiểm tra dist folder: `ls apps/<app>/dist/`
3. Backup trước khi deploy (nếu cần)
4. Deploy từng app một thay vì deploy all

### ✅ Tối ưu tốc độ
1. Sử dụng **deploy-menu.ps1** thay vì lệnh thủ công
2. Deploy nhiều apps cùng lúc nếu chúng độc lập: Option `M` trong menu
3. Giữ SSH connection alive bằng cách thêm vào `~/.ssh/config`:
   ```
   Host 85.10.196.119
       ServerAliveInterval 60
       ServerAliveCountMax 3
   ```

### ✅ Monitoring
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check access logs: `sudo tail -f /var/log/nginx/access.log`
- Test website: `curl -I https://<domain>`

---

## 🎯 Quick Start

**Cách nhanh nhất để deploy:**

1. Mở PowerShell trong thư mục project
2. Chạy: `.\deploy-menu.ps1`
3. Chọn app số `2` (ytmp3.my)
4. Đợi deploy xong
5. Truy cập https://ytmp3.my để kiểm tra

**Chỉ cần 30 giây!** ⚡

---

## 🆘 Liên Hệ & Support

Nếu gặp vấn đề, check các file:
- `deploy.md` - Chi tiết các lệnh
- `.github/workflows/ci.yml` - CI/CD config cũ (tham khảo)
- `CLAUDE.md` - Project guidelines

---

**Happy Deploying! 🚀**
