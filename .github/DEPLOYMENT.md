# Deployment Guide

## Cách deploy apps

### 1. Commit Message Convention (Khuyến nghị)

Thêm tag `[deploy:...]` vào commit message để chỉ định app cần deploy.

```bash
# Deploy 1 app
git commit -m "fix: update styles [deploy:4kvideopro]"

# Deploy nhiều apps
git commit -m "feat: new feature [deploy:4kvideopro,ytmp3.my]"

# Deploy tất cả apps
git commit -m "chore: update packages [deploy:all]"
```

**Danh sách app names hợp lệ:**
- `y2matepro`
- `y2matevc`
- `mp3fast`
- `ytmp3.my`
- `4kvideopro`
- `ssvid.cc`
- `ezconv`

### 2. Manual Trigger (GitHub Actions UI)

1. Vào tab **Actions** trên GitHub
2. Chọn workflow **CI/CD Pipeline**
3. Click **Run workflow**
4. Chọn options:
   - `deploy_all`: Deploy tất cả apps
   - `specific_app`: Chọn 1 app cụ thể từ dropdown

### 3. Auto-detect (Mặc định)

Nếu không có tag `[deploy:...]` trong commit message, CI sẽ tự động detect:
- Thay đổi trong `apps/[app-name]/**` → deploy app đó
- Thay đổi trong `packages/**` → deploy tất cả apps

## Branches

| Branch | Environment | Robots |
|--------|-------------|--------|
| `main` | Production | index |
| `test-production` | Test | noindex |

## Ví dụ sử dụng

```bash
# Chỉ deploy 4kvideopro
git add .
git commit -m "fix: update logo [deploy:4kvideopro]"
git push

# Deploy 4kvideopro và ytmp3.my
git add .
git commit -m "feat: add new feature [deploy:4kvideopro,ytmp3.my]"
git push

# Deploy tất cả (khi update shared packages)
git add .
git commit -m "chore: update dependencies [deploy:all]"
git push

# Auto-detect (chỉ deploy apps có thay đổi)
git add .
git commit -m "fix: bug fix"
git push
```
