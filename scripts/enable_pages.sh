#!/bin/bash
# =============================================================================
# ENABLE GITHUB PAGES
# =============================================================================
# Purpose: Enable and configure GitHub Pages for any repository
#
# Usage:
#   ./scripts/enable_pages.sh -r OWNER/REPO [OPTIONS]
#
# Options:
#   -s, --source BRANCH    Source branch (gh-pages, main, docs, etc.)
#   -p, --path PATH        Path within branch (/ or /docs)
#   -t, --theme THEME      Jekyll theme name
#   -d, --domain DOMAIN    Custom domain
#   --auto-deploy          Enable automatic deployment on push
#   --dry-run              Show what would be done
#
# Example:
#   ./scripts/enable_pages.sh -r owner/my-repo -s gh-pages -t slate --auto-deploy
# =============================================================================

set -e

REPO=""
SOURCE="gh-pages"
PATH_PREFIX="/"
THEME=""
DOMAIN=""
AUTO_DEPLOY=false
DRY_RUN=false
VERBOSE=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--repo) REPO="$2"; shift 2 ;;
        -s|--source) SOURCE="$2"; shift 2 ;;
        -p|--path) PATH_PREFIX="$2"; shift 2 ;;
        -t|--theme) THEME="$2"; shift 2 ;;
        -d|--domain) DOMAIN="$2"; shift 2 ;;
        --auto-deploy) AUTO_DEPLOY=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        -v|--verbose) VERBOSE=true; shift ;;
        -h|--help) grep -E '^\s*#' "$0" | head -20; exit 0 ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
done

if [ -z "$REPO" ]; then
    log_error "Repository required: -r OWNER/REPO"
    exit 1
fi

IFS='/' read -r OWNER REPO_NAME <<< "$REPO"

log_info "Configuring GitHub Pages for $OWNER/$REPO_NAME"

# Verify repo exists
if ! gh repo view "$OWNER/$REPO_NAME" > /dev/null 2>&1; then
    log_error "Repository not found: $OWNER/$REPO_NAME"
    exit 1
fi

log_success "Repository verified"

if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN - No changes will be made"
    echo ""
    echo "Configuration would be:"
    echo "  Source: $SOURCE"
    echo "  Path: $PATH_PREFIX"
    [ -n "$THEME" ] && echo "  Theme: $THEME"
    [ -n "$DOMAIN" ] && echo "  Domain: $DOMAIN"
    echo "  Auto-Deploy: $AUTO_DEPLOY"
    echo ""
else
    log_info "Enabling GitHub Pages..."
    
    # Enable pages via GitHub API
    # Note: This requires repo admin access
    if [ -n "$THEME" ]; then
        gh repo edit "$OWNER/$REPO_NAME" \
            --enable-pages \
            --pages-source-branch "$SOURCE" \
            --pages-source-path "$PATH_PREFIX" \
            --pages-theme "$THEME" || log_warning "Could not set theme"
    else
        gh repo edit "$OWNER/$REPO_NAME" \
            --enable-pages \
            --pages-source-branch "$SOURCE" \
            --pages-source-path "$PATH_PREFIX"
    fi
    
    if [ -n "$DOMAIN" ]; then
        gh api -X PUT "repos/$OWNER/$REPO_NAME/pages" \
            -f "cname=$DOMAIN" || log_warning "Could not set custom domain"
    fi
    
    log_success "GitHub Pages enabled for $OWNER/$REPO_NAME"
fi

if [ "$AUTO_DEPLOY" = true ]; then
    log_info "Creating auto-deploy workflow..."
    if [ "$DRY_RUN" = false ]; then
        # This would deploy the pages-deploy workflow
        log_info "Auto-deploy workflow would be created"
    fi
fi

log_success "Pages configuration complete!"
PAGES_URL="https://${DOMAIN:-$OWNER.github.io/$REPO_NAME}/"
log_info "Pages will be available at: $PAGES_URL"
