#!/bin/bash
##############################################################################
# BIDFLOW MCP Server Setup Script
# Automated setup for development and production environments
##############################################################################

set -e  # Exit on error

echo "🚀 BIDFLOW MCP Server Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js version
echo ""
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js 20+ is required. Current: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) installed${NC}"

# Step 2: Install dependencies
echo ""
echo "📦 Installing dependencies..."
if command -v pnpm &> /dev/null; then
  pnpm install
else
  echo -e "${YELLOW}⚠ pnpm not found. Installing with npm...${NC}"
  npm install -g pnpm
  pnpm install
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Setup environment
echo ""
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠ Please edit .env with your credentials${NC}"
  echo "  Required:"
  echo "    - SUPABASE_URL"
  echo "    - SUPABASE_ANON_KEY"
  echo "    - BIDFLOW_API_URL (default: http://localhost:3010)"
  echo ""
  read -p "Press Enter to open .env in editor..."
  ${EDITOR:-nano} .env
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 4: Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
pnpm build
echo -e "${GREEN}✓ Build successful${NC}"

# Step 5: Test connection
echo ""
echo "🔍 Testing Supabase connection..."
node -e "
  require('dotenv').config();
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  supabase.from('bids').select('id').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('\x1b[31m❌ Supabase connection failed:', error.message, '\x1b[0m');
        process.exit(1);
      }
      console.log('\x1b[32m✓ Supabase connection successful\x1b[0m');
    })
    .catch(err => {
      console.log('\x1b[31m❌ Connection test failed:', err.message, '\x1b[0m');
      process.exit(1);
    });
"

# Step 6: Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start development server:"
echo "     $ pnpm dev"
echo ""
echo "  2. Test with MCP Inspector:"
echo "     $ pnpm inspector"
echo ""
echo "  3. Add to Claude Code config:"
echo "     $ cp ../mcp_config.json ~/.config/claude-code/mcp.json"
echo ""
echo "  4. Run tests:"
echo "     $ pnpm test"
echo ""
echo "📚 Documentation: ./README.md"
echo "🔧 Architecture: ../.forge/MCP_INTEGRATION_ARCHITECTURE.md"
echo ""
