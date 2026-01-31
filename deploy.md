# Quick Deploy Guide - Step by Step

## Deploy 4kvideopro

```bash
# Step 1: Build
pnpm --filter ./apps/4kvideopro run build

# Step 2: Create tar
tar -czf 4kvideopro-dist.tar.gz -C apps/4kvideopro/dist .

# Step 3: Upload to server
scp 4kvideopro-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server (one command)
ssh root@85.10.196.119 "PROJECT_NAME='4kvideo.pro' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/4kvideopro-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/4kvideopro-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f 4kvideopro-dist.tar.gz
```

---

## Deploy ytmp3.my

```bash
# Step 1: Build
pnpm --filter ./apps/ytmp3.my run build

# Step 2: Create tar
tar -czf ytmp3.my-dist.tar.gz -C apps/ytmp3.my/dist .

# Step 3: Upload to server
scp ytmp3.my-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='ytmp3.my' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/ytmp3.my-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/ytmp3.my-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f ytmp3.my-dist.tar.gz
```

---

## Deploy y2matepro

```bash
# Step 1: Build
pnpm --filter ./apps/y2matepro run build

# Step 2: Create tar
tar -czf y2matepro-dist.tar.gz -C apps/y2matepro/dist .

# Step 3: Upload to server
scp y2matepro-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='y2matepro.com' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/y2matepro-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/y2matepro-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f y2matepro-dist.tar.gz
```

---

## Deploy y2matevc

```bash
# Step 1: Build
pnpm --filter ./apps/y2matevc run build

# Step 2: Create tar
tar -czf y2matevc-dist.tar.gz -C apps/y2matevc/dist .

# Step 3: Upload to server
scp y2matevc-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='y2mate.vc' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/y2matevc-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/y2matevc-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f y2matevc-dist.tar.gz
```

---

## Deploy ytmp3-clone-3

```bash
# Step 1: Build
pnpm --filter ./apps/ytmp3-clone-3 run build

# Step 2: Create tar
tar -czf ytmp3-clone-3-dist.tar.gz -C apps/ytmp3-clone-3/dist .

# Step 3: Upload to server
scp ytmp3-clone-3-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='ytmp3-clone-3.com' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/ytmp3-clone-3-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/ytmp3-clone-3-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f ytmp3-clone-3-dist.tar.gz
```

---

## Deploy mp3fast

```bash
# Step 1: Build
pnpm --filter ./apps/mp3fast run build

# Step 2: Create tar
tar -czf mp3fast-dist.tar.gz -C apps/mp3fast/dist .

# Step 3: Upload to server
scp mp3fast-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='mp3fast.net' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/mp3fast-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/mp3fast-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f mp3fast-dist.tar.gz
```

---

## Deploy ytmp3-clone-5

```bash
# Step 1: Build
pnpm --filter ./apps/ytmp3-clone-5 run build

# Step 2: Create tar
tar -czf ytmp3-clone-5-dist.tar.gz -C apps/ytmp3-clone-5/dist .

# Step 3: Upload to server
scp ytmp3-clone-5-dist.tar.gz root@85.10.196.119:/tmp/

# Step 4: Deploy on server
ssh root@85.10.196.119 "PROJECT_NAME='ytmp3-clone-5.com' && RUN_DIR='/var/www/KhanhHAUI/CICD/run/\$PROJECT_NAME' && mkdir -p \$RUN_DIR && find \$RUN_DIR -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /tmp/ytmp3-clone-5-dist.tar.gz -C \$RUN_DIR && find \$RUN_DIR -type d -exec chmod 755 {} + && find \$RUN_DIR -type f -exec chmod 644 {} + && chgrp -R nginx \$RUN_DIR && rm -f /tmp/ytmp3-clone-5-dist.tar.gz && echo 'Deploy complete!' && ls -lh \$RUN_DIR | head -10"

# Step 5: Cleanup local
rm -f ytmp3-clone-5-dist.tar.gz
```

---

## Manual Deploy (If SSH command fails)

If the SSH one-liner fails, do it manually:

```bash
# Step 1-3: Same as above (build, tar, upload)

# Step 4: SSH into server
ssh root@85.10.196.119
```

Then run on server (example for 4kvideopro):
```bash
PROJECT_NAME="4kvideo.pro"
RUN_DIR="/var/www/KhanhHAUI/CICD/run/$PROJECT_NAME"
mkdir -p "$RUN_DIR"
find "$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar -xzf /tmp/4kvideopro-dist.tar.gz -C "$RUN_DIR"
find "$RUN_DIR" -type d -exec chmod 755 {} +
find "$RUN_DIR" -type f -exec chmod 644 {} +
chgrp -R nginx "$RUN_DIR"
rm -f /tmp/4kvideopro-dist.tar.gz
echo "Deploy complete!"
ls -lh "$RUN_DIR" | head -10
exit
```

---

## App Mapping Reference

| App Name | Domain | Directory |
|----------|--------|-----------|
| 4kvideopro | 4kvideo.pro | apps/4kvideopro |
| ytmp3.my | ytmp3.my | apps/ytmp3.my |
| y2matepro | y2matepro.com | apps/y2matepro |
| y2matevc | y2mate.vc | apps/y2matevc |
| ytmp3-clone-3 | ytmp3-clone-3.com | apps/ytmp3-clone-3 |
| mp3fast | mp3fast.net | apps/mp3fast |
| ytmp3-clone-5 | ytmp3-clone-5.com | apps/ytmp3-clone-5 |

---

## After Deploy

### Clear browser cache
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Check files on server
```bash
ssh root@85.10.196.119 "ls -lth /var/www/KhanhHAUI/CICD/run/4kvideo.pro/ | head -20"
```

### Reload nginx (if needed)
```bash
ssh root@85.10.196.119 "sudo nginx -t && sudo systemctl reload nginx"
```

---

## Troubleshooting

### Build fails
```bash
rm -rf node_modules
pnpm install --frozen-lockfile
```

### Upload fails
```bash
ssh root@85.10.196.119 "echo 'Connection test'"
```

### Website not updating
1. Hard refresh: `Ctrl + Shift + R`
2. Check nginx: `ssh root@85.10.196.119 "systemctl status nginx"`
3. Check files timestamp: `ssh root@85.10.196.119 "ls -lth /var/www/KhanhHAUI/CICD/run/4kvideo.pro/ | head -5"`
