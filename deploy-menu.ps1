# Interactive Deploy Menu for Windows PowerShell
# Usage: .\deploy-menu.ps1

$SERVER = "root@85.10.196.119"
$PROJECT_ROOT = "/var/www/KhanhHAUI/CICD"

# App configs
$APP_CONFIGS = @{
    "1" = @{ name = "4kvideopro"; domain = "4kvideo.pro"; path = "./apps/4kvideopro" }
    "2" = @{ name = "ytmp3.my"; domain = "ytmp3.my"; path = "./apps/ytmp3.my" }
    "3" = @{ name = "y2matepro"; domain = "y2matepro.com"; path = "./apps/y2matepro" }
    "4" = @{ name = "y2matevc"; domain = "y2mate.vc"; path = "./apps/y2matevc" }
    "5" = @{ name = "ytmp3-clone-3"; domain = "ytmp3-clone-3.com"; path = "./apps/ytmp3-clone-3" }
    "6" = @{ name = "mp3fast"; domain = "mp3fast.net"; path = "./apps/mp3fast" }
    "7" = @{ name = "ytmp3-clone-5"; domain = "ytmp3-clone-5.com"; path = "./apps/ytmp3-clone-5" }
}

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[DEPLOY] Deploy Menu" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Available Apps:" -ForegroundColor White
    Write-Host ""

    foreach ($key in ($APP_CONFIGS.Keys | Sort-Object)) {
        $app = $APP_CONFIGS[$key]
        Write-Host "  [$key] " -ForegroundColor Cyan -NoNewline
        Write-Host ("{0,-20}" -f $app.name) -NoNewline
        Write-Host " -> " -NoNewline
        Write-Host $app.domain -ForegroundColor Blue
    }

    Write-Host ""
    Write-Host "  [A] Deploy " -ForegroundColor Yellow -NoNewline
    Write-Host "ALL" -ForegroundColor White -NoNewline
    Write-Host " apps"
    Write-Host "  [M] Deploy " -ForegroundColor Yellow -NoNewline
    Write-Host "MULTIPLE" -ForegroundColor White -NoNewline
    Write-Host " apps (e.g., 1,2,5)"
    Write-Host "  [Q] Quit" -ForegroundColor Red
    Write-Host ""
}

function Deploy-App {
    param(
        [string]$AppName,
        [string]$Domain,
        [string]$AppPath
    )

    $tarFile = "$AppName-dist.tar.gz"

    Write-Host ""
    Write-Host ">>> Deploying: " -ForegroundColor Magenta -NoNewline
    Write-Host $AppName -ForegroundColor White
    Write-Host "    Domain: $Domain" -ForegroundColor Cyan
    Write-Host "    Path: $AppPath" -ForegroundColor Cyan
    Write-Host ""

    try {
        # Step 1: Build
        Write-Host "  [1/4] Building..." -ForegroundColor Yellow
        pnpm --filter $AppPath run build | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
        Write-Host "  OK Build success" -ForegroundColor Green

        # Step 2: Create archive
        Write-Host "  [2/4] Creating archive..." -ForegroundColor Yellow
        $distPath = Join-Path $AppPath.Replace("./", "") "dist"
        tar -czf $tarFile -C $distPath .
        if ($LASTEXITCODE -ne 0) { throw "Archive creation failed" }
        $size = [math]::Round((Get-Item $tarFile).Length / 1MB, 2)
        Write-Host "  OK Archive created: $size MB" -ForegroundColor Green

        # Step 3: Upload
        Write-Host "  [3/4] Uploading to server..." -ForegroundColor Yellow
        scp $tarFile "${SERVER}:/tmp/" 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
        Write-Host "  OK Upload complete" -ForegroundColor Green

        # Step 4: Deploy on server
        Write-Host "  [4/4] Deploying on server..." -ForegroundColor Yellow
        $deployScript = @"
set -ex
PROJECT_NAME='$Domain'
RUN_DIR='$PROJECT_ROOT/run/`$PROJECT_NAME'
echo "Deploying to: `$RUN_DIR"
mkdir -p "`$RUN_DIR"
find "`$RUN_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
tar -xzf /tmp/$tarFile -C "`$RUN_DIR"
find "`$RUN_DIR" -type d -exec chmod 755 {} +
find "`$RUN_DIR" -type f -exec chmod 644 {} +
chgrp -R nginx "`$RUN_DIR" 2>/dev/null || true
rm -f /tmp/$tarFile
echo "OK Deployed to `$RUN_DIR"
"@
        $sshOutput = ssh $SERVER $deployScript 2>&1
        Write-Host $sshOutput
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  SSH Output: $sshOutput" -ForegroundColor Red
            throw "Deploy failed"
        }
        Write-Host "  OK Deploy success" -ForegroundColor Green

        # Cleanup
        Remove-Item $tarFile -ErrorAction SilentlyContinue

        Write-Host "OK Completed: $AppName -> https://$Domain" -ForegroundColor Green
        return $true

    } catch {
        Write-Host "  ERROR Error: $_" -ForegroundColor Red
        Remove-Item $tarFile -ErrorAction SilentlyContinue
        return $false
    }
}

function Deploy-Multiple {
    param([string]$Selection)

    $numbers = $Selection -split ',' | ForEach-Object { $_.Trim() }
    $validApps = @()

    foreach ($num in $numbers) {
        if ($APP_CONFIGS.ContainsKey($num)) {
            $validApps += $num
        } else {
            Write-Host "!  Invalid selection: $num" -ForegroundColor Red
        }
    }

    if ($validApps.Count -eq 0) {
        Write-Host "ERROR No valid apps selected" -ForegroundColor Red
        return
    }

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[DEPLOY] Deploy $($validApps.Count) Apps" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan

    $successCount = 0
    $failCount = 0
    $failedApps = @()

    foreach ($num in $validApps) {
        $app = $APP_CONFIGS[$num]
        if (Deploy-App -AppName $app.name -Domain $app.domain -AppPath $app.path) {
            $successCount++
        } else {
            $failCount++
            $failedApps += $app.name
        }
        Write-Host ""
    }

    # Summary
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[SUMMARY] Deploy Summary" -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "OK Success: $successCount" -ForegroundColor Green
    Write-Host "ERROR Failed: $failCount" -ForegroundColor Red

    if ($failCount -gt 0) {
        Write-Host ""
        Write-Host "Failed apps:" -ForegroundColor Red
        foreach ($app in $failedApps) {
            Write-Host "  - $app" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Cyan
    Read-Host
}

function Deploy-All {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[DEPLOY] Deploy ALL Apps" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan

    $successCount = 0
    $failCount = 0
    $failedApps = @()

    foreach ($key in ($APP_CONFIGS.Keys | Sort-Object)) {
        $app = $APP_CONFIGS[$key]
        if (Deploy-App -AppName $app.name -Domain $app.domain -AppPath $app.path) {
            $successCount++
        } else {
            $failCount++
            $failedApps += $app.name
        }
        Write-Host ""
    }

    # Summary
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "[SUMMARY] Deploy Summary" -ForegroundColor White
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "OK Success: $successCount" -ForegroundColor Green
    Write-Host "ERROR Failed: $failCount" -ForegroundColor Red

    if ($failCount -gt 0) {
        Write-Host ""
        Write-Host "Failed apps:" -ForegroundColor Red
        foreach ($app in $failedApps) {
            Write-Host "  - $app" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "Press Enter to continue..." -ForegroundColor Cyan
    Read-Host
}

# Main loop
function Main {
    while ($true) {
        Show-Menu

        $choice = Read-Host "Select option"

        switch ($choice.ToUpper()) {
            {$_ -match '^[1-7]$'} {
                $app = $APP_CONFIGS[$choice]
                Write-Host ""
                Write-Host "==========================================" -ForegroundColor Cyan
                Write-Host "[DEPLOY] Deploy Single App" -ForegroundColor Green
                Write-Host "==========================================" -ForegroundColor Cyan
                Deploy-App -AppName $app.name -Domain $app.domain -AppPath $app.path
                Write-Host ""
                Write-Host "Press Enter to continue..." -ForegroundColor Cyan
                Read-Host
            }
            'A' {
                Write-Host ""
                $confirm = Read-Host "Deploy ALL apps? (y/N)"
                if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                    Deploy-All
                }
            }
            'M' {
                Write-Host ""
                $selection = Read-Host "Enter app numbers (e.g., 1,2,5)"
                Deploy-Multiple -Selection $selection
            }
            'Q' {
                Write-Host ""
                Write-Host " Goodbye!" -ForegroundColor Green
                Write-Host ""
                exit 0
            }
            default {
                Write-Host ""
                Write-Host "ERROR Invalid option: $choice" -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    }
}

# Run
Main
