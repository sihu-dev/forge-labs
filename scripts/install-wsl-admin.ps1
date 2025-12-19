# ═══════════════════════════════════════════════════════════════
# FORGE LABS - WSL Ubuntu 원클릭 설치 (관리자 권한)
# ═══════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔥 FORGE LABS - WSL Ubuntu 24.04 설치 시작" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ 관리자 권한이 필요합니다. 관리자로 다시 실행합니다..." -ForegroundColor Red
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "✅ 관리자 권한 확인됨" -ForegroundColor Green
Write-Host ""

# Step 1: WSL 기능 활성화
Write-Host "[1/4] WSL 기능 활성화 중..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Step 2: 가상 머신 플랫폼 활성화
Write-Host ""
Write-Host "[2/4] 가상 머신 플랫폼 활성화 중..." -ForegroundColor Cyan
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Step 3: WSL 2를 기본값으로 설정
Write-Host ""
Write-Host "[3/4] WSL 2를 기본값으로 설정..." -ForegroundColor Cyan
wsl --set-default-version 2

# Step 4: Ubuntu 24.04 설치
Write-Host ""
Write-Host "[4/4] Ubuntu 24.04 LTS 설치 중..." -ForegroundColor Cyan
wsl --install -d Ubuntu-24.04 --no-launch

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ WSL 설치 완료!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  📋 다음 단계:" -ForegroundColor Yellow
Write-Host "     1. 컴퓨터를 재부팅하세요" -ForegroundColor White
Write-Host "     2. 시작 메뉴에서 'Ubuntu 24.04' 실행" -ForegroundColor White
Write-Host "     3. 사용자명/비밀번호 설정" -ForegroundColor White
Write-Host "     4. 아래 명령어로 풀 세팅 실행:" -ForegroundColor White
Write-Host ""
Write-Host "        cd /mnt/c/Users/sihu2/OneDrive/Desktop/Projects/forge-labs/scripts" -ForegroundColor Cyan
Write-Host "        chmod +x wsl-setup.sh && ./wsl-setup.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green

# 재부팅 확인
Write-Host ""
$reboot = Read-Host "지금 재부팅하시겠습니까? (Y/N)"
if ($reboot -eq "Y" -or $reboot -eq "y") {
    Write-Host "5초 후 재부팅됩니다..." -ForegroundColor Red
    Start-Sleep -Seconds 5
    Restart-Computer -Force
} else {
    Write-Host "나중에 수동으로 재부팅하세요." -ForegroundColor Yellow
}
