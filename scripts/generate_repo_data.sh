#!/bin/bash
# =============================================================================
# GENERATE REPO DATA SCRIPT
# =============================================================================
# Purpose: Generate repository data JSON file using GitHub CLI
#
# Usage:
#   ./scripts/generate_repo_data.sh [options]
#
# Options:
#   -o, --org ORG        GitHub organization name (required)
#   -t, --token TOKEN    GitHub token (defaults to GH_TOKEN env)
#   -o, --output FILE    Output file (defaults to data/repos.json)
#   -a, --archived       Include archived repositories
#   -v, --verbose        Enable verbose output
#   -h, --help           Show this help message
#
# Example:
#   ./scripts/generate_repo_data.sh -o my-org -a -v
# =============================================================================

set -e

# Default values
ORG_NAME=""
GH_TOKEN="${GH_TOKEN:-}"
OUTPUT_FILE="data/repos.json"
INCLUDE_ARCHIVED=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

show_help() {
    head -30 "$0" | tail -20
    exit 0
}

# =============================================================================
# PARSE ARGUMENTS
# =============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--org)
            ORG_NAME="$2"
            shift 2
            ;;
        -t|--token)
            GH_TOKEN="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -a|--archived)
            INCLUDE_ARCHIVED=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# =============================================================================
# VALIDATE REQUIREMENTS
# =============================================================================

if [ -z "$ORG_NAME" ]; then
    log_error "Organization name is required. Use -o or --org option."
    exit 1
fi

if [ -z "$GH_TOKEN" ]; then
    log_error "GitHub token is required. Set GH_TOKEN environment variable or use -t option."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    log_error "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_error "jq is not installed. Please install it first."
    exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
if [ ! -d "$OUTPUT_DIR" ]; then
    log_info "Creating output directory: $OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR"
fi

# =============================================================================
# FETCH REPOSITORIES
# =============================================================================

log_info "Fetching repositories for organization: $ORG_NAME"

export GH_TOKEN

# Fetch all repositories with pagination
repos_json=$(gh api "/orgs/$ORG_NAME/repos?per_page=100&type=all" --paginate)

if [ "$INCLUDE_ARCHIVED" = false ]; then
    log_info "Filtering out archived repositories"
    repos_json=$(echo "$repos_json" | jq '[.[] | select(.archived == false)]')
fi

repo_count=$(echo "$repos_json" | jq 'length')
log_success "Found $repo_count repositories"

# =============================================================================
# PROCESS REPOSITORIES
# =============================================================================

log_info "Processing repository data..."

# Temporary file for processing
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Process each repository
echo "$repos_json" | jq -c '.[]' | while read -r repo; do
    name=$(echo "$repo" | jq -r '.name')
    full_name=$(echo "$repo" | jq -r '.full_name')
    description=$(echo "$repo" | jq -r '.description // "No description"')
    html_url=$(echo "$repo" | jq -r '.html_url')
    language=$(echo "$repo" | jq -r '.language // "Unknown"')
    stargazers_count=$(echo "$repo" | jq -r '.stargazers_count')
    forks_count=$(echo "$repo" | jq -r '.forks_count')
    open_issues_count=$(echo "$repo" | jq -r '.open_issues_count')
    archived=$(echo "$repo" | jq -r '.archived')
    private=$(echo "$repo" | jq -r '.private')
    created_at=$(echo "$repo" | jq -r '.created_at')
    updated_at=$(echo "$repo" | jq -r '.updated_at')
    pushed_at=$(echo "$repo" | jq -r '.pushed_at')
    homepage=$(echo "$repo" | jq -r '.homepage // ""')
    topics=$(echo "$repo" | jq -c '.topics // []')
    default_branch=$(echo "$repo" | jq -r '.default_branch')
    has_wiki=$(echo "$repo" | jq -r '.has_wiki')
    has_pages=$(echo "$repo" | jq -r '.has_pages')
    license=$(echo "$repo" | jq -r '.license.spdx_id // "None"')
    
    # Calculate days since last push
    pushed_timestamp=$(date -d "$pushed_at" +%s 2>/dev/null || echo "0")
    current_timestamp=$(date +%s)
    days_since_push=$(( (current_timestamp - pushed_timestamp) / 86400 ))
    
    # Calculate health score
    health_score=100
    
    if [ "$days_since_push" -gt 90 ]; then
        health_score=$((health_score - 30))
    elif [ "$days_since_push" -gt 30 ]; then
        health_score=$((health_score - 15))
    fi
    
    if [ "$open_issues_count" -gt 50 ]; then
        health_score=$((health_score - 10))
    fi
    
    if [ "$health_score" -lt 0 ]; then
        health_score=0
    fi
    
    # Determine health status
    if [ "$health_score" -ge 80 ]; then
        health_status="healthy"
    elif [ "$health_score" -ge 60 ]; then
        health_status="warning"
    elif [ "$health_score" -ge 40 ]; then
        health_status="unhealthy"
    else
        health_status="critical"
    fi
    
    # Create repository object
    jq -n \
        --arg name "$name" \
        --arg full_name "$full_name" \
        --arg description "$description" \
        --arg html_url "$html_url" \
        --arg language "$language" \
        --argjson stargazers_count "$stargazers_count" \
        --argjson forks_count "$forks_count" \
        --argjson open_issues_count "$open_issues_count" \
        --argjson archived "$archived" \
        --argjson private "$private" \
        --arg created_at "$created_at" \
        --arg updated_at "$updated_at" \
        --arg pushed_at "$pushed_at" \
        --arg homepage "$homepage" \
        --argjson topics "$topics" \
        --arg default_branch "$default_branch" \
        --argjson has_wiki "$has_wiki" \
        --argjson has_pages "$has_pages" \
        --arg license "$license" \
        --argjson health_score "$health_score" \
        --arg health_status "$health_status" \
        --argjson days_since_push "$days_since_push" \
        '{
            name: $name,
            full_name: $full_name,
            description: $description,
            html_url: $html_url,
            language: $language,
            stargazers_count: $stargazers_count,
            forks_count: $forks_count,
            open_issues_count: $open_issues_count,
            archived: $archived,
            private: $private,
            created_at: $created_at,
            updated_at: $updated_at,
            pushed_at: $pushed_at,
            homepage: $homepage,
            topics: $topics,
            default_branch: $default_branch,
            has_wiki: $has_wiki,
            has_pages: $has_pages,
            license: $license,
            health_score: $health_score,
            health_status: $health_status,
            days_since_push: $days_since_push
        }' >> "$TEMP_FILE"
    
    log_verbose "Processed: $name"
done

# Convert JSONL to JSON array
jq -s '.' "$TEMP_FILE" > "$OUTPUT_FILE"

log_success "Generated $OUTPUT_FILE with $repo_count repositories"

# =============================================================================
# GENERATE SUMMARY
# =============================================================================

echo ""
echo "=============================================="
echo "           GENERATION COMPLETE              "
echo "=============================================="
echo ""
echo "Organization:    $ORG_NAME"
echo "Repositories:    $repo_count"
echo "Output File:     $OUTPUT_FILE"
echo "Archived:        $INCLUDE_ARCHIVED"
echo "Generated:       $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# Show language distribution
echo "Language Distribution:"
jq -r 'group_by(.language) | map({language: .[0].language, count: length}) | sort_by(-.count) | .[] | "  \(.language): \(.count)"' "$OUTPUT_FILE"

echo ""
