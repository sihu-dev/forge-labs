#!/bin/bash

# =============================================================================
# FORGE LABS Deployment Automation Script
# =============================================================================
# Automates deployment of HEPHAITOS and BIDFLOW to Vercel
#
# Usage:
#   ./deploy.sh hephaitos    # Deploy only HEPHAITOS
#   ./deploy.sh bidflow      # Deploy only BIDFLOW
#   ./deploy.sh both         # Deploy both apps
#   ./deploy.sh check        # Pre-deployment checks only
#
# Requirements:
#   - Node.js 18+
#   - Vercel CLI (npm install -g vercel)
#   - Git (clean working tree)
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Pre-flight checks
pre_flight_checks() {
    log_info "Running pre-flight checks..."

    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 18+ required (current: v$NODE_VERSION)"
        exit 1
    fi
    log_success "Node.js v$NODE_VERSION"

    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    log_success "Vercel CLI installed"

    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory has uncommitted changes"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    log_success "Git working tree clean"

    # Check if logged into Vercel
    if ! vercel whoami &> /dev/null; then
        log_warning "Not logged into Vercel"
        log_info "Running: vercel login"
        vercel login
    fi
    log_success "Vercel authentication valid"
}

# Build check
build_check() {
    local app=$1
    log_info "Building $app..."

    cd "apps/$app"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi

    # Run build
    if npm run build; then
        log_success "$app build successful"
    else
        log_error "$app build failed"
        cd ../..
        exit 1
    fi

    cd ../..
}

# Deploy app
deploy_app() {
    local app=$1
    local env=${2:-production}

    log_info "================================"
    log_info "Deploying $app to $env..."
    log_info "================================"

    cd "apps/$app"

    # Run build check first
    cd ../..
    build_check "$app"
    cd "apps/$app"

    # Deploy
    if [ "$env" = "production" ]; then
        log_info "Deploying to production..."
        if vercel --prod --yes; then
            log_success "$app deployed to production"
            DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*' | head -1)
            log_success "URL: $DEPLOY_URL"
        else
            log_error "$app deployment failed"
            cd ../..
            exit 1
        fi
    else
        log_info "Deploying to preview..."
        if vercel --yes; then
            log_success "$app deployed to preview"
            DEPLOY_URL=$(vercel --yes 2>&1 | grep -o 'https://[^ ]*' | head -1)
            log_success "URL: $DEPLOY_URL"
        else
            log_error "$app deployment failed"
            cd ../..
            exit 1
        fi
    fi

    cd ../..
}

# Main deployment flow
deploy() {
    local target=$1

    case $target in
        hephaitos)
            deploy_app "hephaitos"
            ;;
        bidflow)
            deploy_app "bidflow"
            ;;
        both)
            deploy_app "hephaitos"
            echo ""
            deploy_app "bidflow"
            ;;
        check)
            build_check "hephaitos"
            echo ""
            build_check "bidflow"
            log_success "All checks passed!"
            exit 0
            ;;
        *)
            log_error "Invalid target: $target"
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh hephaitos    # Deploy HEPHAITOS"
            echo "  ./deploy.sh bidflow      # Deploy BIDFLOW"
            echo "  ./deploy.sh both         # Deploy both"
            echo "  ./deploy.sh check        # Pre-deployment checks"
            exit 1
            ;;
    esac
}

# Main script
main() {
    echo ""
    log_info "🚀 FORGE LABS Deployment Script"
    echo ""

    # Check arguments
    if [ -z "$1" ]; then
        log_error "No deployment target specified"
        echo ""
        echo "Usage:"
        echo "  ./deploy.sh hephaitos    # Deploy HEPHAITOS"
        echo "  ./deploy.sh bidflow      # Deploy BIDFLOW"
        echo "  ./deploy.sh both         # Deploy both"
        echo "  ./deploy.sh check        # Pre-deployment checks"
        exit 1
    fi

    # Run pre-flight checks
    pre_flight_checks
    echo ""

    # Deploy
    deploy "$1"

    echo ""
    log_success "🎉 Deployment complete!"
    echo ""
    log_info "Next steps:"
    log_info "1. Verify deployment at Vercel dashboard"
    log_info "2. Test critical user flows"
    log_info "3. Monitor error rates and performance"
    echo ""
}

# Run main
main "$@"
