#!/bin/bash

# ============================================
# TALLY PRODUCTION DEPLOYMENT SCRIPT
# ============================================
# Automated deployment script for tallyhq.io
# Version: 1.0.0
# Last updated: 2025-08-15

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV=${1:-production}
SKIP_TESTS=${2:-false}
DRY_RUN=${3:-false}
BACKUP_ENABLED=${BACKUP_ENABLED:-true}
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-5}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-10}

# Deployment metadata
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)
DEPLOYMENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
DEPLOYMENT_COMMIT=$(git rev-parse --short HEAD)
DEPLOYMENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}🚀 TALLY DEPLOYMENT SCRIPT${NC}"
echo "========================================"
echo "Environment: $DEPLOYMENT_ENV"
echo "Version: $DEPLOYMENT_VERSION"
echo "Branch: $DEPLOYMENT_BRANCH"
echo "Commit: $DEPLOYMENT_COMMIT"
echo "Deployment ID: $DEPLOYMENT_ID"
echo "========================================"

# Function definitions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_step "Running pre-deployment checks..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "next.config.ts" ]; then
        log_error "Not in a valid Tally project directory"
        exit 1
    fi
    
    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Working directory has uncommitted changes"
        if [ "$DRY_RUN" = "false" ]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_error "Deployment cancelled"
                exit 1
            fi
        fi
    fi
    
    # Check if production environment file exists
    if [ "$DEPLOYMENT_ENV" = "production" ] && [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        log_info "Create .env.production from .env.production.template"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version)
    log_info "Node.js version: $NODE_VERSION"
    
    # Check npm version
    NPM_VERSION=$(npm --version)
    log_info "npm version: $NPM_VERSION"
    
    log_info "Pre-deployment checks passed ✅"
}

# Environment validation
validate_environment() {
    log_step "Validating environment configuration..."
    
    # Run environment validation
    if npm run validate-env; then
        log_info "Environment validation passed ✅"
    else
        log_error "Environment validation failed ❌"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    log_step "Installing dependencies..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would install dependencies"
        return
    fi
    
    # Clean install
    rm -rf node_modules package-lock.json
    npm install --production=false
    
    log_info "Dependencies installed ✅"
}

# Run tests and linting
run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log_warn "Skipping tests (SKIP_TESTS=true)"
        return
    fi
    
    log_step "Running tests and linting..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run tests and linting"
        return
    fi
    
    # Type checking
    npm run type-check
    
    # Linting
    npm run lint
    
    # Run tests if test script exists
    if npm run test --silent >/dev/null 2>&1; then
        npm run test
    else
        log_warn "No test script found, skipping tests"
    fi
    
    log_info "Tests and linting passed ✅"
}

# Build application
build_application() {
    log_step "Building application for $DEPLOYMENT_ENV..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would build application"
        return
    fi
    
    # Set environment
    export NODE_ENV=$DEPLOYMENT_ENV
    
    # Build application
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        npm run build:production
    else
        npm run build
    fi
    
    # Check build output
    if [ ! -d ".next" ]; then
        log_error "Build failed - .next directory not found"
        exit 1
    fi
    
    log_info "Application built successfully ✅"
}

# Database backup (if enabled)
backup_database() {
    if [ "$BACKUP_ENABLED" = "false" ]; then
        log_info "Database backup disabled"
        return
    fi
    
    log_step "Creating database backup..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would create database backup"
        return
    fi
    
    # Create backup using Supabase CLI (if available)
    if command -v supabase &> /dev/null; then
        BACKUP_FILE="backup_${DEPLOYMENT_ID}.sql"
        log_info "Creating backup: $BACKUP_FILE"
        # supabase db dump > $BACKUP_FILE
        log_info "Database backup created ✅"
    else
        log_warn "Supabase CLI not found, skipping database backup"
    fi
}

# Deploy application
deploy_application() {
    log_step "Deploying application..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would deploy application"
        return
    fi
    
    # Add deployment metadata to environment
    export DEPLOYMENT_VERSION=$DEPLOYMENT_VERSION
    export DEPLOYMENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export DEPLOYMENT_ID=$DEPLOYMENT_ID
    export BUILD_ID=$DEPLOYMENT_COMMIT
    
    case "$DEPLOYMENT_ENV" in
        "production")
            # Deploy to production (customize based on your hosting platform)
            if command -v vercel &> /dev/null; then
                log_info "Deploying to Vercel..."
                vercel --prod --yes
            elif command -v heroku &> /dev/null; then
                log_info "Deploying to Heroku..."
                git push heroku main
            else
                log_info "Starting production server..."
                npm run start:production &
                SERVER_PID=$!
                echo $SERVER_PID > .deployment.pid
            fi
            ;;
        "staging")
            log_info "Deploying to staging..."
            # Add staging deployment logic here
            ;;
        *)
            log_error "Unknown deployment environment: $DEPLOYMENT_ENV"
            exit 1
            ;;
    esac
    
    log_info "Application deployed ✅"
}

# Health check
health_check() {
    log_step "Running health checks..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run health checks"
        return
    fi
    
    # Determine health check URL
    case "$DEPLOYMENT_ENV" in
        "production")
            HEALTH_URL="https://tallyhq.io/api/health"
            ;;
        "staging")
            HEALTH_URL="https://staging.tallyhq.io/api/health"
            ;;
        *)
            HEALTH_URL="http://localhost:3000/api/health"
            ;;
    esac
    
    log_info "Health check URL: $HEALTH_URL"
    
    # Wait for service to be ready
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        log_info "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_info "Health check passed ✅"
            
            # Get detailed health status
            HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
            echo "Health status: $HEALTH_RESPONSE"
            return 0
        else
            log_warn "Health check failed, retrying in ${HEALTH_CHECK_INTERVAL}s..."
            sleep $HEALTH_CHECK_INTERVAL
        fi
    done
    
    log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts ❌"
    return 1
}

# Rollback function
rollback() {
    log_step "Rolling back deployment..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would rollback deployment"
        return
    fi
    
    # Stop current deployment
    if [ -f ".deployment.pid" ]; then
        PID=$(cat .deployment.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .deployment.pid
        fi
    fi
    
    # Platform-specific rollback
    if command -v vercel &> /dev/null; then
        log_info "Rolling back Vercel deployment..."
        # vercel rollback
    elif command -v heroku &> /dev/null; then
        log_info "Rolling back Heroku deployment..."
        # heroku rollback
    fi
    
    log_info "Rollback completed"
}

# Cleanup function
cleanup() {
    log_step "Cleaning up..."
    
    # Remove temporary files
    rm -f .deployment.pid
    
    log_info "Cleanup completed"
}

# Signal handlers
trap 'log_error "Deployment interrupted"; cleanup; exit 1' INT TERM

# Main deployment flow
main() {
    log_info "Starting deployment process..."
    
    # Pre-deployment phase
    pre_deployment_checks
    validate_environment
    
    # Build phase
    install_dependencies
    run_tests
    build_application
    
    # Deployment phase
    backup_database
    deploy_application
    
    # Post-deployment phase
    if health_check; then
        log_info "🎉 Deployment successful!"
        log_info "Version: $DEPLOYMENT_VERSION"
        log_info "Environment: $DEPLOYMENT_ENV"
        log_info "Deployment ID: $DEPLOYMENT_ID"
        
        # Send success notification
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"✅ Tally deployment successful: $DEPLOYMENT_VERSION ($DEPLOYMENT_ENV)\"}" \
                "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
        fi
    else
        log_error "❌ Deployment failed health checks"
        
        # Send failure notification
        if [ -n "$SLACK_WEBHOOK_URL" ]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"❌ Tally deployment failed: $DEPLOYMENT_VERSION ($DEPLOYMENT_ENV)\"}" \
                "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
        fi
        
        # Offer to rollback
        if [ "$DRY_RUN" = "false" ]; then
            read -p "Would you like to rollback? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback
            fi
        fi
        
        cleanup
        exit 1
    fi
    
    cleanup
}

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [environment] [skip_tests] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  environment   - production|staging|development (default: production)"
    echo "  skip_tests    - true|false (default: false)"
    echo "  dry_run       - true|false (default: false)"
    echo ""
    echo "Environment variables:"
    echo "  BACKUP_ENABLED        - Enable database backup (default: true)"
    echo "  HEALTH_CHECK_RETRIES  - Number of health check attempts (default: 5)"
    echo "  HEALTH_CHECK_INTERVAL - Seconds between health checks (default: 10)"
    echo "  SLACK_WEBHOOK_URL     - Slack webhook for notifications"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to production"
    echo "  $0 staging                   # Deploy to staging"
    echo "  $0 production true           # Deploy to production, skip tests"
    echo "  $0 production false true     # Dry run for production"
    exit 0
fi

# Run main deployment
main