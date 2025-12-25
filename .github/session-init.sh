#!/bin/bash
# ============================================
# FORGE LABS Session Initialization
# Claude Code 세션 시작 시 실행
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 FORGE LABS Session Initializing..."
echo ""

# === Git 설정 ===
source "$SCRIPT_DIR/git-setup.sh" 2>/dev/null || {
    # Inline setup if script not found
    git config --local commit.gpgsign false
    git config --local tag.gpgsign false
    git config --global push.default current
    git config --global push.autoSetupRemote true
    echo "✓ Basic git config applied"
}

# === Git Hooks 설치 ===
if [ -d "$SCRIPT_DIR/hooks" ]; then
    cp "$SCRIPT_DIR/hooks/"* "$REPO_ROOT/.git/hooks/" 2>/dev/null
    chmod +x "$REPO_ROOT/.git/hooks/"* 2>/dev/null
    echo "✓ Git hooks installed"
fi

# === 상태 요약 ===
echo ""
echo "📊 Repository Status:"
echo "  Branch: $(git branch --show-current)"
echo "  Status: $(git status --short | wc -l) changes"
echo "  Last commit: $(git log -1 --format='%h %s' 2>/dev/null || echo 'No commits')"
echo ""

# === GitHub 연결 확인 ===
if gh auth status &>/dev/null; then
    ACCOUNT=$(gh api user --jq '.login' 2>/dev/null)
    echo "✓ GitHub: Connected as $ACCOUNT"
else
    echo "⚠ GitHub: Not authenticated"
fi

echo ""
echo "✅ Session ready! Use 'ㅋ' for quick commit & push"
