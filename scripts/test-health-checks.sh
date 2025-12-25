#!/bin/bash

# =============================================================================
# Health Check Test Script
# =============================================================================
# Tests health check endpoints for HEPHAITOS and BIDFLOW
#
# Usage:
#   ./scripts/test-health-checks.sh [local|production]
#
# Examples:
#   ./scripts/test-health-checks.sh local
#   ./scripts/test-health-checks.sh production
# =============================================================================

set -e

# Colors
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

# Test health endpoint
test_health() {
    local name=$1
    local url=$2

    log_info "Testing $name health endpoint..."
    echo "  URL: $url"

    # Make request and capture response
    local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)

    # Check HTTP status
    if [ "$status" = "200" ]; then
        log_success "$name is healthy (HTTP $status)"
    elif [ "$status" = "503" ]; then
        log_warning "$name is degraded/unhealthy (HTTP $status)"
    else
        log_error "$name health check failed (HTTP $status)"
        return 1
    fi

    # Pretty print JSON response
    if command -v jq &> /dev/null; then
        echo "$body" | jq .
    else
        echo "$body"
    fi

    echo ""
}

# Main
main() {
    local env=${1:-local}

    echo ""
    log_info "🏥 FORGE LABS Health Check Tests"
    echo ""

    if [ "$env" = "production" ]; then
        # Production URLs
        log_info "Environment: Production"
        echo ""

        test_health "HEPHAITOS" "https://hephaitos.vercel.app/api/health"
        test_health "BIDFLOW" "https://bidflow.vercel.app/api/health"

    elif [ "$env" = "local" ]; then
        # Local URLs
        log_info "Environment: Local Development"
        echo ""

        # Check if services are running
        if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
            log_warning "HEPHAITOS not running on localhost:3000"
            log_info "Start with: pnpm dev:hephaitos"
            echo ""
        else
            test_health "HEPHAITOS" "http://localhost:3000/api/health"
        fi

        if ! curl -s http://localhost:3010 > /dev/null 2>&1; then
            log_warning "BIDFLOW not running on localhost:3010"
            log_info "Start with: pnpm dev:bidflow"
            echo ""
        else
            test_health "BIDFLOW" "http://localhost:3010/api/health"
        fi

    else
        log_error "Invalid environment: $env"
        echo ""
        echo "Usage:"
        echo "  ./scripts/test-health-checks.sh [local|production]"
        exit 1
    fi

    log_success "Health check tests complete!"
    echo ""
}

# Run
main "$@"
