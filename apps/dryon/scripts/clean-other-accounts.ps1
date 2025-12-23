# ========================================
# Clean GitHub Credentials (Keep SauceFirst)
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleaning GitHub Credentials" -ForegroundColor Cyan
Write-Host "(Keeping: SauceFirst account)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get all credentials
$allCreds = cmdkey /list

Write-Host "Searching for GitHub credentials..." -ForegroundColor Yellow
Write-Host ""

$foundGitHub = $false
$deletedCount = 0

# Parse credentials
$allCreds | ForEach-Object {
    $line = $_.Trim()

    if ($line -match "Target:") {
        $target = $line -replace "^\s*Target:\s*", ""

        # Check if it's a GitHub credential
        if ($target -match "github" -or $target -match "git:") {
            $foundGitHub = $true

            # Check if it contains SauceFirst
            if ($target -match "SauceFirst" -or $target -match "saucefirst") {
                Write-Host "KEEPING: $target" -ForegroundColor Green
            } else {
                Write-Host "DELETING: $target" -ForegroundColor Red
                cmdkey /delete:$target | Out-Null
                $deletedCount++
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($foundGitHub) {
    Write-Host "Deleted $deletedCount credential(s)" -ForegroundColor Yellow
    Write-Host "SauceFirst account preserved" -ForegroundColor Green
} else {
    Write-Host "No GitHub credentials found" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Show current Git config
Write-Host "Current Git Configuration:" -ForegroundColor White
$name = git config --global user.name 2>$null
$email = git config --global user.email 2>$null

if ($name) { Write-Host "  Name : $name" -ForegroundColor Green }
if ($email) { Write-Host "  Email: $email" -ForegroundColor Green }

Write-Host ""
Write-Host "Complete!" -ForegroundColor Green
Write-Host ""
