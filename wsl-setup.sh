#!/bin/bash
# FORGE LABS WSL2 Ubuntu 개발 환경 세팅 스크립트
# 실행: bash wsl-setup.sh

set -e  # 에러 발생 시 중단

# Non-interactive / CI-friendly mode
# Set NONINTERACTIVE=true or CI=true to run without prompts.
NONINTERACTIVE=${NONINTERACTIVE:-false}
if [ "$NONINTERACTIVE" = "true" ] || [ "$CI" = "true" ] || [ "$FORCE_YES" = "true" ]; then
    export DEBIAN_FRONTEND=noninteractive
    APT_YES="-y"
    print_step "Non-interactive mode enabled (DEBIAN_FRONTEND=noninteractive)"
fi

echo "========================================"
echo "  FORGE LABS WSL2 개발 환경 세팅"
echo "========================================"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. 시스템 정보 확인
print_step "시스템 정보 확인"
echo "  - OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d '"' -f 2)"
echo "  - User: $(whoami)"
echo "  - Home: $HOME"
echo ""

# 2. 패키지 업데이트
print_step "패키지 업데이트 (apt update && upgrade)"
sudo DEBIAN_FRONTEND=${DEBIAN_FRONTEND:-dialog} apt update && sudo DEBIAN_FRONTEND=${DEBIAN_FRONTEND:-dialog} apt upgrade ${APT_YES:--y}
print_success "패키지 업데이트 완료"
echo ""

# 3. 필수 패키지 설치
print_step "필수 패키지 설치"
sudo DEBIAN_FRONTEND=${DEBIAN_FRONTEND:-dialog} apt install ${APT_YES:--y} \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip \
    htop \
    tree \
    jq
print_success "필수 패키지 설치 완료"
echo ""

# 4. Git 설정 확인
print_step "Git 설정 확인"
if [ -n "$GIT_NAME" ]; then
    git config --global user.name "$GIT_NAME"
elif [ -z "$(git config --global user.name)" ]; then
    if [ "$NONINTERACTIVE" = "true" ] || [ "$CI" = "true" ]; then
        print_warning "Git user.name not set; using default 'Forge Labs User'"
        git config --global user.name "Forge Labs User"
    else
        print_warning "Git user.name이 설정되지 않았습니다"
        read -p "  Git user.name 입력: " git_name
        git config --global user.name "$git_name"
    fi
fi

if [ -n "$GIT_EMAIL" ]; then
    git config --global user.email "$GIT_EMAIL"
elif [ -z "$(git config --global user.email)" ]; then
    if [ "$NONINTERACTIVE" = "true" ] || [ "$CI" = "true" ]; then
        print_warning "Git user.email not set; using default 'no-reply@forge.local'"
        git config --global user.email "no-reply@forge.local"
    else
        print_warning "Git user.email이 설정되지 않았습니다"
        read -p "  Git user.email 입력: " git_email
        git config --global user.email "$git_email"
    fi
fi
print_success "Git 설정: $(git config --global user.name) <$(git config --global user.email)>"
echo ""

# 5. Node.js 설치 (fnm - Fast Node Manager)
print_step "Node.js 설치 (fnm 사용)"
if ! command -v fnm &> /dev/null; then
    curl -fsSL https://fnm.vercel.app/install | bash
    export PATH="$HOME/.local/share/fnm:$PATH"
    eval "$(fnm env)"
fi

# fnm을 bashrc에 추가
if ! grep -q "fnm env" ~/.bashrc; then
    echo '' >> ~/.bashrc
    echo '# fnm (Fast Node Manager)' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/share/fnm:$PATH"' >> ~/.bashrc
    echo 'eval "$(fnm env)"' >> ~/.bashrc
fi

# 최신 LTS 버전 설치
source ~/.bashrc 2>/dev/null || true
export PATH="$HOME/.local/share/fnm:$PATH"
eval "$(fnm env)" 2>/dev/null || true

fnm install --lts
fnm use --lts
fnm default $(fnm current)

print_success "Node.js $(node -v) 설치 완료"
echo ""

# 6. pnpm 설치
print_step "pnpm 설치"
if ! command -v pnpm &> /dev/null; then
    curl -fsSL https://get.pnpm.io/install.sh | sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
fi

# pnpm을 bashrc에 추가
if ! grep -q "PNPM_HOME" ~/.bashrc; then
    echo '' >> ~/.bashrc
    echo '# pnpm' >> ~/.bashrc
    echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> ~/.bashrc
    echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.bashrc
fi

source ~/.bashrc 2>/dev/null || true
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

print_success "pnpm $(pnpm -v) 설치 완료"
echo ""

# 7. Docker 설치 (Docker Desktop WSL 통합 권장)
print_step "Docker 확인"
if command -v docker &> /dev/null; then
    print_success "Docker $(docker -v | cut -d ' ' -f 3 | tr -d ',')"
else
    print_warning "Docker가 설치되지 않았습니다"
    echo "  - Windows에서 Docker Desktop 설치 후 WSL Integration 활성화 권장"
    echo "  - 또는 아래 명령으로 Linux Docker 설치:"
    echo ""
    echo "    curl -fsSL https://get.docker.com | sh"
    echo "    sudo usermod -aG docker \$USER"
    echo ""
fi
echo ""

# 8. 유용한 alias 설정
print_step "개발용 alias 설정"
if ! grep -q "# FORGE LABS aliases" ~/.bashrc; then
    cat >> ~/.bashrc << 'EOF'

# FORGE LABS aliases
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias cls='clear'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias gd='git diff'
alias glog='git log --oneline --graph --decorate -10'

# pnpm aliases
alias pi='pnpm install'
alias pd='pnpm dev'
alias pb='pnpm build'
alias pt='pnpm test'

# Turbo aliases
alias td='pnpm turbo dev'
alias tb='pnpm turbo build'

# Directory shortcuts
alias projects='cd /mnt/c/Users/sihu2/OneDrive/Desktop/Projects'
alias forge='cd /mnt/c/Users/sihu2/OneDrive/Desktop/Projects/forge-labs'
EOF
    print_success "alias 설정 완료"
else
    print_success "alias 이미 설정됨"
fi
echo ""

# 9. Windows 프로젝트 경로 확인
print_step "FORGE LABS 프로젝트 경로 확인"
FORGE_PATH="/mnt/c/Users/sihu2/OneDrive/Desktop/Projects/forge-labs"
if [ -d "$FORGE_PATH" ]; then
    print_success "프로젝트 경로 확인됨: $FORGE_PATH"
    echo "  - 파일 수: $(find $FORGE_PATH -maxdepth 1 -type f | wc -l)"
    echo "  - 폴더 수: $(find $FORGE_PATH -maxdepth 1 -type d | wc -l)"
else
    print_warning "프로젝트 경로를 찾을 수 없습니다: $FORGE_PATH"
fi
echo ""

# 10. 최종 확인
echo "========================================"
echo "  설치 완료 요약"
echo "========================================"
echo ""
echo "  설치된 도구:"
echo "  - Git:    $(git --version 2>/dev/null || echo 'Not installed')"
echo "  - Node:   $(node -v 2>/dev/null || echo 'Not installed')"
echo "  - npm:    $(npm -v 2>/dev/null || echo 'Not installed')"
echo "  - pnpm:   $(pnpm -v 2>/dev/null || echo 'Not installed')"
echo "  - Docker: $(docker -v 2>/dev/null | cut -d ' ' -f 3 | tr -d ',' || echo 'Not installed')"
echo ""
echo "  다음 단계:"
echo "  1. 새 터미널을 열거나 'source ~/.bashrc' 실행"
echo "  2. 'forge' 명령으로 프로젝트 이동"
echo "  3. 'pnpm install'로 의존성 설치"
echo ""
if [ "$NONINTERACTIVE" = "true" ] || [ "$CI" = "true" ]; then
    echo "  Note: script ran in non-interactive mode. To run manually with env vars:"
    echo "    NONINTERACTIVE=true GIT_NAME='Your Name' GIT_EMAIL='you@example.com' bash wsl-setup.sh"
fi
print_success "FORGE LABS WSL2 개발 환경 세팅 완료!"
