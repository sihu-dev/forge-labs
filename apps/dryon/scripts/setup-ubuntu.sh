#!/usr/bin/env bash
set -euo pipefail

# Ubuntu setup script for Claude Code CLI + project dependencies
# Usage:
#   Run from repository root:
#     bash scripts/setup-ubuntu.sh

SUDO=''
if [ "$EUID" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO='sudo'
  else
    echo "This script needs root privileges. Install sudo or run as root." >&2
    exit 1
  fi
fi

echo "== Updating system packages =="
$SUDO apt-get update -y
$SUDO apt-get upgrade -y

echo "== Installing core packages =="
$SUDO apt-get install -y curl wget git build-essential ca-certificates gnupg lsb-release 

# Install Node.js LTS (20.x). Change setup_20.x to desired version if needed.
echo "== Installing Node.js (LTS) =="
curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash -
$SUDO apt-get install -y nodejs

# Verify Node/npm
echo "Node version: " $(node -v || true)
echo "npm version:  " $(npm -v || true)

# Install Claude Code CLI globally
CLAUDE_PKG="@anthropic-ai/claude-code-cli"

echo "== Installing Claude Code CLI ($CLAUDE_PKG) globally (may not be published on npm) =="
if ! $SUDO npm install -g "$CLAUDE_PKG"; then
  echo "Warning: failed to install $CLAUDE_PKG from npm. It may not be published or requires authentication." >&2
  echo "Fallback: you can run via npx: npx $CLAUDE_PKG --help or follow Anthropic's install docs. Skipping global install." >&2
fi

# Verify install by locating binary(s)
if command -v claude >/dev/null 2>&1; then
  echo "Found 'claude' CLI: $(command -v claude)"
  claude --version || true
elif command -v claude-code >/dev/null 2>&1; then
  echo "Found 'claude-code' CLI: $(command -v claude-code)"
  claude-code --version || true
else
  echo "Note: Claude CLI binary not found as 'claude' or 'claude-code'. Use 'npm -g bin' to inspect global bins." >&2
  npm -g bin || true
fi

# Install project dependencies (run in repo root)
if [ -f package-lock.json ]; then
  echo "== Installing dependencies with npm ci =="
  npm ci
else
  echo "== Installing dependencies with npm install =="
  npm install
fi

# Helpful reminders
cat <<'EOF'

=== DONE ===

Next steps:
- Make this script executable: chmod +x scripts/setup-ubuntu.sh
- Create or update credentials (.env, credentials.json, token.json) as needed.
- If you're on WSL: ensure Windows firewall/ports and file permissions are configured as needed.
- To test: try `node -v`, `npm -v`, and `claude --help` (or `npx @anthropic-ai/claude-code-cli --help`).

If any command fails, re-run with output or paste the error for assistance.

EOF

exit 0
