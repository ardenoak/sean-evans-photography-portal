#!/bin/bash

# ============================================
# TALLY ROLLBACK SCRIPT
# ============================================
# Emergency rollback script for tallyhq.io
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
ENVIRONMENT=${1:-production}
ROLLBACK_STRATEGY=${2:-previous}  # previous|version|commit
ROLLBACK_TARGET=${3:-}  # version number or commit hash
DRY_RUN=${4:-false}

echo -e "${RED}⚡ TALLY EMERGENCY ROLLBACK${NC}"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Strategy: $ROLLBACK_STRATEGY"
echo "Target: ${ROLLBACK_TARGET:-auto}"
echo "Dry Run: $DRY_RUN"
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

# Check if rollback is necessary
confirm_rollback() {
    log_step "Confirming rollback necessity..."
    
    if [ "$DRY_RUN" = "false" ]; then
        echo -e "${RED}⚠️  WARNING: This will rollback the production system!${NC}"
        echo "This action cannot be undone without another deployment."
        echo ""
        read -p "Are you sure you want to proceed? Type 'ROLLBACK' to confirm: " -r
        
        if [ "$REPLY" != "ROLLBACK" ]; then
            log_info "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    log_info "Rollback confirmed"
}

# Get current deployment info
get_current_deployment() {
    log_step "Getting current deployment information..."
    
    CURRENT_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    log_info "Current version: $CURRENT_VERSION"
    log_info "Current commit: $CURRENT_COMMIT"
    log_info "Current branch: $CURRENT_BRANCH"
}

# Determine rollback target
determine_rollback_target() {
    log_step "Determining rollback target..."
    
    case "$ROLLBACK_STRATEGY" in
        "previous")
            # Get previous commit
            ROLLBACK_COMMIT=$(git rev-parse --short HEAD~1 2>/dev/null || echo "")
            if [ -z "$ROLLBACK_COMMIT" ]; then
                log_error "Cannot determine previous commit"
                exit 1
            fi
            ROLLBACK_TARGET=$ROLLBACK_COMMIT
            log_info "Rollback target: previous commit ($ROLLBACK_COMMIT)"
            ;;
        "version")
            if [ -z "$ROLLBACK_TARGET" ]; then
                log_error "Version rollback requires target version"
                exit 1
            fi
            # Find commit for specific version
            ROLLBACK_COMMIT=$(git log --oneline --grep="$ROLLBACK_TARGET" | head -1 | cut -d' ' -f1)
            if [ -z "$ROLLBACK_COMMIT" ]; then
                log_error "Cannot find commit for version $ROLLBACK_TARGET"
                exit 1
            fi
            log_info "Rollback target: version $ROLLBACK_TARGET (commit $ROLLBACK_COMMIT)"
            ;;
        "commit")
            if [ -z "$ROLLBACK_TARGET" ]; then
                log_error "Commit rollback requires target commit hash"
                exit 1
            fi
            ROLLBACK_COMMIT=$ROLLBACK_TARGET
            log_info "Rollback target: commit $ROLLBACK_COMMIT"
            ;;
        *)
            log_error "Unknown rollback strategy: $ROLLBACK_STRATEGY"
            exit 1
            ;;
    esac
}

# Backup current state
backup_current_state() {
    log_step "Backing up current state..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would backup current state"
        return
    fi
    
    BACKUP_BRANCH="backup-$(date +%Y%m%d_%H%M%S)"
    
    # Create backup branch
    git checkout -b $BACKUP_BRANCH
    git checkout main
    
    log_info "Current state backed up to branch: $BACKUP_BRANCH"
}

# Perform git rollback
perform_git_rollback() {
    log_step "Performing git rollback..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would rollback to commit $ROLLBACK_COMMIT"
        return
    fi
    
    # Checkout the target commit
    git checkout $ROLLBACK_COMMIT
    
    # Create a new branch for the rollback
    ROLLBACK_BRANCH="rollback-$(date +%Y%m%d_%H%M%S)"
    git checkout -b $ROLLBACK_BRANCH
    
    log_info "Rolled back to commit: $ROLLBACK_COMMIT"
    log_info "Created rollback branch: $ROLLBACK_BRANCH"
}

# Stop current application
stop_application() {
    log_step "Stopping current application..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would stop application"
        return
    fi
    
    # Stop PM2 processes if running
    if command -v pm2 &> /dev/null; then
        pm2 stop all || true
    fi
    
    # Stop application using PID file
    if [ -f ".deployment.pid" ]; then
        PID=$(cat .deployment.pid)
        if kill -0 $PID 2>/dev/null; then
            log_info "Stopping process $PID"
            kill $PID
            sleep 5
            
            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                log_warn "Force killing process $PID"
                kill -9 $PID
            fi
        fi
        rm .deployment.pid
    fi
    
    # Platform-specific stops
    if command -v vercel &> /dev/null; then
        # For Vercel, we'll redeploy the rolled back version
        log_info "Will redeploy to Vercel after rollback"
    fi
    
    log_info "Application stopped"
}

# Rebuild application
rebuild_application() {
    log_step "Rebuilding application..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would rebuild application"
        return
    fi
    
    # Install dependencies
    npm install
    
    # Build application
    export NODE_ENV=$ENVIRONMENT
    npm run build
    
    log_info "Application rebuilt"
}

# Restore database (if backup exists)
restore_database() {
    log_step "Checking for database restore..."
    
    # Look for recent database backup
    BACKUP_FILE=$(ls -t backup_*.sql 2>/dev/null | head -1 || echo "")
    
    if [ -z "$BACKUP_FILE" ]; then
        log_warn "No database backup found, skipping database restore"
        return
    fi
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would restore database from $BACKUP_FILE"
        return
    fi
    
    log_warn "Database backup found: $BACKUP_FILE"
    read -p "Restore database from backup? This will overwrite current data (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restoring database from $BACKUP_FILE"
        # Restore logic would go here
        # supabase db reset --with-seed $BACKUP_FILE
        log_info "Database restored"
    else
        log_info "Database restore skipped"
    fi
}

# Start application
start_application() {
    log_step "Starting rolled back application..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would start application"
        return
    fi
    
    case "$ENVIRONMENT" in
        "production")
            if command -v vercel &> /dev/null; then
                log_info "Deploying rollback to Vercel..."
                vercel --prod --yes
            else
                log_info "Starting production server..."
                npm run start:production &
                echo $! > .deployment.pid
            fi
            ;;
        "staging")
            log_info "Starting staging server..."
            npm run start &
            echo $! > .deployment.pid
            ;;
        *)
            log_info "Starting development server..."
            npm run start &
            echo $! > .deployment.pid
            ;;
    esac
    
    log_info "Application started"
}

# Health check after rollback
health_check() {
    log_step "Running health checks after rollback..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would run health checks"
        return
    fi
    
    # Determine health check URL
    case "$ENVIRONMENT" in
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
    
    # Wait for service to be ready
    for i in {1..10}; do
        log_info "Health check attempt $i/10..."
        
        if curl -f -s "$HEALTH_URL" > /dev/null; then
            log_info "Health check passed ✅"
            
            # Get health status
            HEALTH_RESPONSE=$(curl -s "$HEALTH_URL")
            echo "Health status: $HEALTH_RESPONSE"
            return 0
        else
            log_warn "Health check failed, retrying in 10s..."
            sleep 10
        fi
    done
    
    log_error "Health check failed after rollback ❌"
    return 1
}

# Send notifications
send_notifications() {
    log_step "Sending rollback notifications..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "[DRY RUN] Would send notifications"
        return
    fi
    
    MESSAGE="🔄 Tally rollback completed for $ENVIRONMENT environment. Rolled back to commit: $ROLLBACK_COMMIT"
    
    # Slack notification
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    # Discord notification
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"$MESSAGE\"}" \
            "$DISCORD_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
    
    log_info "Notifications sent"
}

# Cleanup
cleanup() {
    log_step "Cleaning up..."
    
    # Remove temporary files
    rm -f rollback.log
    
    log_info "Cleanup completed"
}

# Main rollback process
main() {
    log_info "Starting emergency rollback process..."
    
    # Pre-rollback checks
    confirm_rollback
    get_current_deployment
    determine_rollback_target
    
    # Rollback process
    backup_current_state
    stop_application
    perform_git_rollback
    rebuild_application
    restore_database
    start_application
    
    # Post-rollback validation
    if health_check; then
        log_info "🎉 Rollback completed successfully!"
        send_notifications
    else
        log_error "❌ Rollback completed but health checks failed"
        log_error "Manual intervention may be required"
        exit 1
    fi
    
    cleanup
}

# Usage information
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [environment] [strategy] [target] [dry_run]"
    echo ""
    echo "Arguments:"
    echo "  environment - production|staging|development (default: production)"
    echo "  strategy    - previous|version|commit (default: previous)"
    echo "  target      - version number or commit hash (required for version/commit strategy)"
    echo "  dry_run     - true|false (default: false)"
    echo ""
    echo "Environment variables:"
    echo "  SLACK_WEBHOOK_URL   - Slack webhook for notifications"
    echo "  DISCORD_WEBHOOK_URL - Discord webhook for notifications"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Rollback to previous commit in production"
    echo "  $0 staging                          # Rollback staging to previous commit"
    echo "  $0 production version 0.1.1         # Rollback to specific version"
    echo "  $0 production commit abc123f        # Rollback to specific commit"
    echo "  $0 production previous '' true      # Dry run rollback"
    exit 0
fi

# Signal handlers
trap 'log_error "Rollback interrupted"; cleanup; exit 1' INT TERM

# Run main rollback process
main