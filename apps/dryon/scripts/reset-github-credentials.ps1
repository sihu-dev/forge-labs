# ========================================
# GitHub Credentials Reset Script
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Credential Reset Started" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Clean Windows Credential Manager
Write-Host "[1/5] Cleaning Windows Credential Manager..." -ForegroundColor Yellow
$credentials = cmdkey /list | Select-String "github"

if ($credentials) {
    Write-Host "Found GitHub credentials:" -ForegroundColor White
    $credentials | ForEach-Object {
        $line = $_.Line.Trim()
        Write-Host "  - $line" -ForegroundColor Gray

        if ($line -match "Target: (.+)$") {
            $target = $matches[1]
            Write-Host "    Deleting: $target" -ForegroundColor Red
            cmdkey /delete:$target | Out-Null
        }
    }
    Write-Host "SUCCESS: Windows Credential Manager cleaned" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "SUCCESS: No GitHub credentials found (already clean)" -ForegroundColor Green
    Write-Host ""
}

# 2. Check Git Configuration
Write-Host "[2/5] Checking Git configuration..." -ForegroundColor Yellow
$gitName = git config --global user.name 2>$null
$gitEmail = git config --global user.email 2>$null

if ($gitName -or $gitEmail) {
    Write-Host "Current Git settings:" -ForegroundColor White
    if ($gitName) { Write-Host "  Name : $gitName" -ForegroundColor Gray }
    if ($gitEmail) { Write-Host "  Email: $gitEmail" -ForegroundColor Gray }
    Write-Host ""

    $response = Read-Host "Reset Git user info? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        git config --global --unset user.name 2>$null
        git config --global --unset user.email 2>$null

        $newName = Read-Host "Enter new name"
        $newEmail = Read-Host "Enter new email"

        git config --global user.name "$newName"
        git config --global user.email "$newEmail"
        git config --global credential.helper manager-core

        Write-Host "SUCCESS: Git configuration updated" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "SKIPPED: Keeping existing Git settings" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "WARNING: No Git user info configured" -ForegroundColor Yellow

    $response = Read-Host "Configure now? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        $newName = Read-Host "Enter name"
        $newEmail = Read-Host "Enter email"

        git config --global user.name "$newName"
        git config --global user.email "$newEmail"
        git config --global credential.helper manager-core

        Write-Host "SUCCESS: Git configuration completed" -ForegroundColor Green
        Write-Host ""
    }
}

# 3. Check VSCode Settings
Write-Host "[3/5] Checking VSCode settings..." -ForegroundColor Yellow
$vscodePath = "$env:APPDATA\Code\User\globalStorage\github.copilot"
if (Test-Path $vscodePath) {
    Write-Host "VSCode GitHub Copilot cache found" -ForegroundColor White
    $response = Read-Host "Delete VSCode Copilot cache? (y/N)"
    if ($response -eq "y" -or $response -eq "Y") {
        Remove-Item -Path $vscodePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "SUCCESS: VSCode Copilot cache deleted" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host "SKIPPED: Keeping VSCode cache" -ForegroundColor Yellow
        Write-Host ""
    }
} else {
    Write-Host "SUCCESS: No VSCode GitHub Copilot cache" -ForegroundColor Green
    Write-Host ""
}

# 4. Check .env File
Write-Host "[4/5] Checking .env file..." -ForegroundColor Yellow
$envPath = ".\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "GITHUB_TOKEN=") {
        Write-Host "WARNING: GITHUB_TOKEN found in .env file" -ForegroundColor Yellow
        Write-Host "   Please generate a new GitHub Personal Access Token" -ForegroundColor White
        Write-Host "   https://github.com/settings/tokens" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "SUCCESS: No GITHUB_TOKEN in .env file" -ForegroundColor Green
        Write-Host ""
    }
} else {
    Write-Host "WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "   Copy .env.example to .env" -ForegroundColor White
    Write-Host ""
}

# 5. Summary
Write-Host "[5/5] Final Check..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reset Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Restart VSCode" -ForegroundColor Yellow
Write-Host "     Ctrl+Shift+P -> 'Reload Window'" -ForegroundColor Gray
Write-Host ""

Write-Host "  2. Sign in to GitHub in VSCode" -ForegroundColor Yellow
Write-Host "     - Click account icon (bottom left)" -ForegroundColor Gray
Write-Host "     - Click 'Sign in with GitHub'" -ForegroundColor Gray
Write-Host ""

Write-Host "  3. Sign in to GitHub Copilot (if using)" -ForegroundColor Yellow
Write-Host "     Ctrl+Shift+P -> 'GitHub Copilot: Sign In'" -ForegroundColor Gray
Write-Host ""

Write-Host "  4. Test Git Push" -ForegroundColor Yellow
Write-Host "     git push" -ForegroundColor Gray
Write-Host "     (Login with correct account in browser)" -ForegroundColor Gray
Write-Host ""

Write-Host "  5. Generate new GitHub Token and update .env" -ForegroundColor Yellow
Write-Host "     https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host ""

Write-Host "Detailed guide: docs\GITHUB_ACCOUNT_RESET.md" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display Current Git Settings
Write-Host "Current Git Configuration:" -ForegroundColor White
$currentName = git config --global user.name 2>$null
$currentEmail = git config --global user.email 2>$null
if ($currentName) { Write-Host "  Name : $currentName" -ForegroundColor Green }
if ($currentEmail) { Write-Host "  Email: $currentEmail" -ForegroundColor Green }
Write-Host ""

Write-Host "Press Enter to exit..."
Read-Host
