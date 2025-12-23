#!/bin/bash
set -e

echo "🚀 Forge Labs Codespaces Setup Starting..."

# 1. Install pnpm dependencies
echo "📦 Installing pnpm dependencies..."
pnpm install

# 2. Setup environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Please update .env with your actual credentials"
fi

# 3. Install Claude Code CLI
echo "🤖 Installing Claude Code CLI..."
if ! command -v claude &> /dev/null; then
  curl -fsSL https://claude.ai/install.sh | bash
  echo "✅ Claude Code CLI installed"
else
  echo "✅ Claude Code CLI already installed"
fi

# 4. Install Supabase CLI
echo "🗄️  Installing Supabase CLI..."
if ! command -v supabase &> /dev/null; then
  npm install -g supabase
  echo "✅ Supabase CLI installed"
else
  echo "✅ Supabase CLI already installed"
fi

# 5. Git config
echo "🔧 Configuring git..."
git config --global core.autocrlf input
git config --global init.defaultBranch main

# 6. Install Playwright browsers (for testing)
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium

# 7. Display project structure
echo ""
echo "📂 Forge Labs Project Structure:"
echo "├── apps/"
echo "│   ├── HEPHAITOS (Trading Education Platform)"
echo "│   ├── BIDFLOW (Bid Automation System)"
echo "│   ├── ADE (AI Design Engine)"
echo "│   ├── FOLIO (SMB AI SaaS)"
echo "│   └── DRYON (Gov Support Automation)"
echo "└── packages/ (Shared packages)"
echo ""

# 8. Display next steps
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env with your credentials"
echo "2. Run 'claude' to authenticate Claude Code CLI"
echo "3. Start Supabase: pnpm supabase:start"
echo "4. Start development:"
echo "   - HEPHAITOS: pnpm --filter HEPHAITOS dev"
echo "   - BIDFLOW: pnpm --filter bidflow dev"
echo "   - ADE: pnpm --filter ade dev"
echo ""
echo "🔗 Useful Commands:"
echo "   - pnpm dev          # Start all apps"
echo "   - pnpm build        # Build all apps"
echo "   - pnpm test         # Run all tests"
echo "   - pnpm lint         # Lint all code"
echo ""
echo "Happy coding! 🎉"
