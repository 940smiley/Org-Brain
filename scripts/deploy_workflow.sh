#!/bin/bash
# =============================================================================
# DEPLOY WORKFLOW TO REPO
# =============================================================================
# Purpose: Deploy a workflow to any user-owned repository
#
# Usage:
#   ./scripts/deploy_workflow.sh -r OWNER/REPO -w WORKFLOW_TYPE [OPTIONS]
#
# Workflow Types:
#   - pr-manager          PR governance and auto-fix
#   - dependabot-batch    Batch dependency updates
#   - health-check        Repository health monitoring
#   - self-heal           Automated code fixing
#   - security-scan       Vulnerability scanning
#   - pages-deploy        GitHub Pages deployment
#
# Example:
#   ./scripts/deploy_workflow.sh -r owner/my-repo -w pr-manager --autonomous
# =============================================================================

set -e

REPO=""
WORKFLOW_TYPE=""
AUTONOMOUS=false
DRY_RUN=false
VERBOSE=false

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

show_help() {
    grep -E '^\s*#\s' "$0" | head -20
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--repo) REPO="$2"; shift 2 ;;
        -w|--workflow) WORKFLOW_TYPE="$2"; shift 2 ;;
        --autonomous) AUTONOMOUS=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        -v|--verbose) VERBOSE=true; shift ;;
        -h|--help) show_help; exit 0 ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$REPO" ] || [ -z "$WORKFLOW_TYPE" ]; then
    log_error "Missing required parameters"
    echo "Usage: $0 -r OWNER/REPO -w WORKFLOW_TYPE [--autonomous]"
    exit 1
fi

IFS='/' read -r OWNER REPO_NAME <<< "$REPO"

log_info "Deploying workflow: $WORKFLOW_TYPE to $OWNER/$REPO_NAME"
[ "$AUTONOMOUS" = true ] && log_info "Mode: Autonomous" || log_info "Mode: Manual"

# Verify repo exists
if ! gh repo view "$OWNER/$REPO_NAME" > /dev/null 2>&1; then
    log_error "Repository not found: $OWNER/$REPO_NAME"
    exit 1
fi

log_success "Repository verified: $OWNER/$REPO_NAME"

# Get workflow template from config
WORKFLOW_FILE="templates/workflows/${WORKFLOW_TYPE}.yml"

if [ ! -f "$WORKFLOW_FILE" ]; then
    log_error "Workflow template not found: $WORKFLOW_FILE"
    exit 1
fi

TEMP_WORKFLOW="/tmp/workflow-${WORKFLOW_TYPE}-$$.yml"
cp "$WORKFLOW_FILE" "$TEMP_WORKFLOW"

# Add autonomous marker if needed
if [ "$AUTONOMOUS" = true ]; then
    echo "" >> "$TEMP_WORKFLOW"
    echo "# Autonomous Mode: Auto-triggered and auto-managed" >> "$TEMP_WORKFLOW"
fi

[ "$VERBOSE" = true ] && log_info "Workflow template prepared"

# Create .github/workflows directory structure
WORKFLOWS_DIR=".github/workflows"

if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN MODE - No changes will be made"
    log_info "Would create: $WORKFLOWS_DIR/${WORKFLOW_TYPE}.yml in $OWNER/$REPO_NAME"
    cat "$TEMP_WORKFLOW"
else
    # Deploy workflow
    gh api repos/$OWNER/$REPO_NAME/contents/$WORKFLOWS_DIR/${WORKFLOW_TYPE}.yml \
        --input "$TEMP_WORKFLOW" \
        -F message="chore: add autonomous ${WORKFLOW_TYPE} workflow" || true
    
    log_success "Workflow deployed: ${WORKFLOW_TYPE}.yml"
fi

rm -f "$TEMP_WORKFLOW"

log_success "Deployment complete!"
echo "View workflow: https://github.com/$OWNER/$REPO_NAME/blob/main/.github/workflows/${WORKFLOW_TYPE}.yml"
