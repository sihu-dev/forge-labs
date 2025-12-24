#!/bin/bash

# Content Marketing Automation System - Setup Script
# This script sets up the entire content automation system

set -e  # Exit on error

echo "======================================"
echo "Content Marketing Automation Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo "ℹ $1"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm $(npm --version) found"

# Check Docker (for n8n)
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. You'll need Docker to run n8n locally."
    echo "Install from: https://docs.docker.com/get-docker/"
    read -p "Continue without Docker? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Docker $(docker --version | cut -d ' ' -f 3) found"
fi

echo ""
echo "======================================"
echo "Step 1: Environment Configuration"
echo "======================================"

# Check if .env exists
if [ -f "../config/.env" ]; then
    print_warning ".env file already exists."
    read -p "Overwrite with .env.example? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp ../config/.env.example ../config/.env
        print_success "Created new .env file"
    fi
else
    cp ../config/.env.example ../config/.env
    print_success "Created .env file from template"
fi

print_info "Please edit config/.env and add your API keys:"
echo "  - CLAUDE_API_KEY (required)"
echo "  - NOTION_API_KEY (required)"
echo "  - Other API keys as needed"
echo ""
read -p "Press Enter when you've configured .env..."

echo ""
echo "======================================"
echo "Step 2: Install Dependencies"
echo "======================================"

print_info "Installing npm packages..."
npm install

print_success "Dependencies installed"

echo ""
echo "======================================"
echo "Step 3: Set Up n8n"
echo "======================================"

read -p "Do you want to set up n8n locally with Docker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting n8n with Docker..."

    docker run -d \
        --name n8n \
        -p 5678:5678 \
        -v n8n_data:/home/node/.n8n \
        -e N8N_BASIC_AUTH_ACTIVE=true \
        -e N8N_BASIC_AUTH_USER=admin \
        -e N8N_BASIC_AUTH_PASSWORD=changeme \
        n8nio/n8n

    print_success "n8n started on http://localhost:5678"
    print_warning "Default credentials: admin / changeme (change these!)"

    echo ""
    print_info "Waiting for n8n to start (15 seconds)..."
    sleep 15

    print_info "n8n is ready! Opening in browser..."
    if command -v open &> /dev/null; then
        open http://localhost:5678
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5678
    else
        echo "Please open http://localhost:5678 in your browser"
    fi
else
    print_info "Skipping n8n setup. You can use n8n cloud instead."
    echo "Sign up at: https://n8n.io/cloud"
fi

echo ""
echo "======================================"
echo "Step 4: Create Notion Databases"
echo "======================================"

echo ""
print_info "You need to create these Notion databases manually:"
echo ""
echo "1. Content Calendar Database"
echo "   Properties:"
echo "   - Title (title)"
echo "   - Status (select): Idea, Outline, Ready to Write, Draft, Review, Ready to Publish, Published"
echo "   - Primary Keyword (text)"
echo "   - Secondary Keywords (text)"
echo "   - Target Audience (select)"
echo "   - Content Type (select): Tutorial, Guide, Comparison, Opinion, Case Study"
echo "   - Unique Angle (text)"
echo "   - Word Count (number)"
echo "   - SEO Score (number)"
echo "   - Overall Score (number)"
echo "   - Meta Description (text)"
echo "   - URL Slug (text)"
echo "   - Published URL (url)"
echo "   - Publish Date (date)"
echo "   - Distributed (checkbox)"
echo "   - LinkedIn URL (url)"
echo "   - Twitter Thread URL (url)"
echo ""
echo "2. Newsletter Snippets Database"
echo "   Properties:"
echo "   - Title (title)"
echo "   - Snippet (text)"
echo "   - Blog URL (url)"
echo "   - Status (select): Ready for Newsletter, Included, Archived"
echo "   - Added Date (date)"
echo ""
read -p "Press Enter when you've created these databases..."

echo ""
read -p "Enter Content Calendar Database ID: " CONTENT_CAL_DB_ID
read -p "Enter Newsletter Snippets Database ID: " NEWSLETTER_DB_ID

# Update .env with database IDs
sed -i.bak "s/NOTION_CONTENT_CALENDAR_DB=xxxxx/NOTION_CONTENT_CALENDAR_DB=$CONTENT_CAL_DB_ID/" ../config/.env
sed -i.bak "s/NOTION_NEWSLETTER_SNIPPETS_DB=xxxxx/NOTION_NEWSLETTER_SNIPPETS_DB=$NEWSLETTER_DB_ID/" ../config/.env

print_success "Notion database IDs saved to .env"

echo ""
echo "======================================"
echo "Step 5: Import n8n Workflows"
echo "======================================"

print_info "Import these workflow files into n8n:"
echo "  1. workflows/1-keyword-research-automation.json"
echo "  2. workflows/2-blog-generation-pipeline.json"
echo "  3. workflows/3-multi-platform-distribution.json"
echo ""
echo "In n8n:"
echo "  1. Go to Workflows"
echo "  2. Click 'Import from File'"
echo "  3. Select each JSON file"
echo "  4. Configure credentials for each node"
echo ""
read -p "Press Enter when you've imported all workflows..."

print_success "Workflows imported"

echo ""
echo "======================================"
echo "Step 6: Set Up Claude Projects"
echo "======================================"

print_info "Create 4 Claude Projects at https://claude.ai"
echo ""
echo "Upload these custom instructions to each project:"
echo "  1. Blog Writer: claude-projects/blog-writer.md"
echo "  2. Social Media: claude-projects/social-media.md"
echo "  3. Newsletter: claude-projects/newsletter.md"
echo "  4. SEO Optimizer: claude-projects/seo-optimizer.md"
echo ""
read -p "Press Enter when you've created all Claude Projects..."

print_success "Claude Projects configured"

echo ""
echo "======================================"
echo "Step 7: Test the System"
echo "======================================"

read -p "Do you want to run a test workflow? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running test workflow..."
    npm run test:workflow
    print_success "Test completed!"
else
    print_info "Skipping test. You can run 'npm run test:workflow' later."
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Add a test article to your Notion Content Calendar"
echo "  2. Set status to 'Ready to Write'"
echo "  3. Watch the automation run!"
echo ""
echo "Useful commands:"
echo "  npm run generate:content     - Generate content from CLI"
echo "  npm run status              - Check system status"
echo "  npm run analytics           - View content performance"
echo ""
echo "Documentation:"
echo "  - Main docs: ../CONTENT_MARKETING_AUTOMATION.md"
echo "  - Claude Projects: ../claude-projects/"
echo "  - Workflows: ../workflows/"
echo ""
print_success "Happy automating! 🚀"
