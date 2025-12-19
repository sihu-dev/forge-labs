@echo off
chcp 65001 >nul
echo ========================================
echo   FORGE LABS WSL2 Ubuntu 세팅 실행
echo ========================================
echo.
echo WSL Ubuntu에서 세팅 스크립트를 실행합니다...
echo.
wsl -d Ubuntu -e bash -c "cd /mnt/c/Users/sihu2/OneDrive/Desktop/Projects/forge-labs && bash wsl-setup.sh"
echo.
echo ========================================
echo   완료! 아무 키나 누르면 종료됩니다.
echo ========================================
pause >nul
