#!/bin/bash
# =============================================================================
# ORG BRAIN - Install Automation Token to All Repositories
# =============================================================================
# Purpose: Install ORG_AUTOMATION_TOKEN secret to all repositories
#
# Usage:
#   export ORG_AUTOMATION_TOKEN="ghp_your_token"
#   ./install-token.sh [-o OWNER] [-s] [-v]
#
# Options:
#   -o, --owner       GitHub username/organization (default: 940smiley)
#   -n, --name        Secret name (default: ORG_AUTOMATION_TOKEN)
#   -s, --skip        Skip repos that already have the secret
#   -v, --verbose     Enable verbose output
#   -h, --help        Show this help message
#
# Output:
#   - data/token-install/results.jsonl (per-repo results)
#   - data/token-install/summary.md (summary report)
#   - data/token-install/<repo>.log (per-repo logs)
#
# Requirements:
#   - gh (GitHub CLI)
#   - jq
#   - python3 with pynacl
# =============================================================================

set -e

# Default values
OWNER="940smiley"
SECRET_NAME="ORG_AUTOMATION_TOKEN"
SKIP_EXISTING=false
VERBOSE=false
OUTPUT_DIR="data/token-install"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }
log_verbose() { [ "$VERBOSE" = true ] && echo -e "${BLUE}[DEBUG]${NC} $1"; }

show_help() {
    head -35 "$0" | tail -25
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--owner) OWNER="$2"; shift 2 ;;
        -n|--name) SECRET_NAME="$2"; shift 2 ;;
        -s|--skip) SKIP_EXISTING=true; shift ;;
        -v|--verbose) VERBOSE=true; shift ;;
        -h|--help) show_help ;;
        *) log_error "Unknown option: $1"; show_help ;;
    esac
done

# =============================================================================
# CRITICAL FIX: Read token from environment and validate
# =============================================================================

log_info "=== VALIDATION: Checking token ==="

# Read token from environment variable
TOKEN="$ORG_AUTOMATION_TOKEN"

# HARD FAIL if token is missing
if [ -z "$TOKEN" ]; then
    log_error "ERROR: No token received!"
    log_error "The ORG_AUTOMATION_TOKEN environment variable is empty."
    log_error ""
    log_error "Set the token before running this script:"
    log_error "  export ORG_AUTOMATION_TOKEN=\"ghp_your_token\""
    log_error "  ./install-token.sh"
    exit 1
fi

# Validate token format
if [[ ! "$TOKEN" =~ ^gh[pousr]_ ]] && [[ ! "$TOKEN" =~ ^github_pat_ ]]; then
    log_warning "Token does not appear to be a valid GitHub PAT"
    log_warning "Expected format: ghp_*, gho_*, ghu_*, ghs_*, ghr_*, or github_pat_*"
fi

log_success "Token validation passed"
log_info "Token length: ${#TOKEN} characters"
echo ""

# =============================================================================
# Check prerequisites
# =============================================================================

log_info "=== PREREQUISITES: Checking requirements ==="

command -v gh >/dev/null 2>&1 || { log_error "gh (GitHub CLI) is required."; exit 1; }
command -v jq >/dev/null 2>&1 || { log_error "jq is required."; exit 1; }
command -v python3 >/dev/null 2>&1 || { log_error "python3 is required."; exit 1; }

python3 -c "import nacl" 2>/dev/null || {
    log_error "pynacl is required. Install with: pip3 install pynacl"
    exit 1
}

log_success "All prerequisites installed"
echo ""

# =============================================================================
# PREFLIGHT: Validate GitHub API access
# =============================================================================

log_info "=== PREFLIGHT: Checking GitHub API access ==="

export GH_TOKEN="$TOKEN"

user_login=$(gh api user --jq '.login' 2>&1)
api_exit_code=$?

if [ $api_exit_code -ne 0 ]; then
    log_error "GitHub API access failed!"
    log_error "Response: $user_login"
    exit 1
fi

log_success "API access confirmed"
log_info "Authenticated as: $user_login"
echo ""

# =============================================================================
# Create output directory
# =============================================================================

mkdir -p "$OUTPUT_DIR"
log_info "Output directory: $OUTPUT_DIR"
echo ""

# =============================================================================
# Enumerate repositories
# =============================================================================

log_info "=== ENUMERATION: Fetching repositories ==="
log_info "Owner: $OWNER"

repos_json=$(gh api "/users/$OWNER/repos?per_page=100&type=all" --paginate 2>/dev/null || echo "[]")

if [ "$repos_json" = "[]" ] || [ -z "$repos_json" ]; then
    log_warning "No repositories found"
    exit 0
fi

# Filter out archived repos
active_repos=$(echo "$repos_json" | jq -c '[.[] | select(.archived == false) | {name: .name, private: .private}]')
repo_count=$(echo "$active_repos" | jq 'length')

log_success "Found $repo_count active repositories"

# Save repo names to file
echo "$active_repos" | jq -r '.[].name' > "$OUTPUT_DIR/repos.txt"

log_info "Repository list:"
cat "$OUTPUT_DIR/repos.txt"
echo ""

echo "$active_repos" > "$OUTPUT_DIR/repos.json"

# =============================================================================
# Install secrets to each repository
# =============================================================================

log_info "=== INSTALLATION: Installing secrets ==="
log_info "Secret Name: $SECRET_NAME"
log_info "Skip Existing: $SKIP_EXISTING"
echo ""

success_count=0
failure_count=0
skip_count=0

> "$OUTPUT_DIR/results.jsonl"

echo "$active_repos" | jq -c '.[]' | while read -r repo_info; do
    repo_name=$(echo "$repo_info" | jq -r '.name')
    is_private=$(echo "$repo_info" | jq -r '.private')
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "Processing: $repo_name (private: $is_private)"
    
    # Create log file for this repo
    log_file="$OUTPUT_DIR/${repo_name}.log"
    echo "Log: $repo_name" > "$log_file"
    echo "Started: $(date -u)" >> "$log_file"
    
    # Fetch repo's public key for encryption
    log_verbose "Fetching public key for $repo_name..."
    key_response=$(gh api "/repos/$OWNER/$repo_name/actions/secrets/public-key" 2>&1) || true
    
    if ! echo "$key_response" | jq -e '.key_id' > /dev/null 2>&1; then
        log_error "Failed to fetch public key: $key_response"
        failure_count=$((failure_count + 1))
        jq -n --arg repo "$repo_name" --arg status "failed" --arg error "Failed to fetch public key" \
            '{repo:$repo,status:$status,error:$error}' >> "$OUTPUT_DIR/results.jsonl"
        echo "Error: Failed to fetch public key" >> "$log_file"
        continue
    fi
    
    key_id=$(echo "$key_response" | jq -r '.key_id')
    public_key=$(echo "$key_response" | jq -r '.key')
    
    log_verbose "Key ID: $key_id"
    echo "Key ID: $key_id" >> "$log_file"
    
    # Check if secret already exists
    if [ "$SKIP_EXISTING" = true ]; then
        log_verbose "Checking if secret exists..."
        check_response=$(gh api "/repos/$OWNER/$repo_name/actions/secrets/$SECRET_NAME" 2>&1 || true)
        
        if echo "$check_response" | jq -e '.name' > /dev/null 2>&1; then
            log_warning "Secret already exists, skipping"
            skip_count=$((skip_count + 1))
            jq -n --arg repo "$repo_name" --arg status "skipped" --arg reason "Secret already exists" \
                '{repo:$repo,status:$status,reason:$reason}' >> "$OUTPUT_DIR/results.jsonl"
            echo "Skipped: Secret already exists" >> "$log_file"
            continue
        fi
    fi
    
    # Encrypt the token using Python/PyNaCl (libsodium)
    log_verbose "Encrypting token..."
    echo "Encrypting token..." >> "$log_file"
    
    encrypted_value=$(python3 << PYEOF
import base64
import sys
import os
from nacl import encoding, public

def encrypt(public_key: str, secret_value: str) -> str:
    public_key_bytes = base64.b64decode(public_key)
    sealed_box = public.SealedBox(public_key_bytes)
    encrypted = sealed_box.encrypt(secret_value.encode('utf-8'))
    return base64.b64encode(encrypted).decode('utf-8')

# Read token from environment
token = os.environ.get('ORG_AUTOMATION_TOKEN', '')
if not token:
    print("ERROR: No token in environment", file=sys.stderr)
    sys.exit(1)

print(encrypt('$public_key', token))
PYEOF
)
    
    if [ -z "$encrypted_value" ] || echo "$encrypted_value" | grep -q "ERROR"; then
        log_error "Encryption failed!"
        failure_count=$((failure_count + 1))
        jq -n --arg repo "$repo_name" --arg status "failed" --arg error "Encryption failed" \
            '{repo:$repo,status:$status,error:$error}' >> "$OUTPUT_DIR/results.jsonl"
        echo "Encryption failed" >> "$log_file"
        continue
    fi
    
    log_verbose "Token encrypted successfully"
    echo "Token encrypted" >> "$log_file"
    
    # Upload encrypted secret
    log_verbose "Uploading secret..."
    echo "Uploading secret..." >> "$log_file"
    
    upload_response=$(gh api -X PUT "/repos/$OWNER/$repo_name/actions/secrets/$SECRET_NAME" \
        -f encrypted_value="$encrypted_value" -f key_id="$key_id" 2>&1) || true
    
    if [ -z "$upload_response" ]; then
        log_success "Successfully installed secret"
        success_count=$((success_count + 1))
        jq -n --arg repo "$repo_name" --arg status "success" \
            '{repo:$repo,status:$status}' >> "$OUTPUT_DIR/results.jsonl"
        echo "Success" >> "$log_file"
    else
        log_error "Failed to upload secret: $upload_response"
        failure_count=$((failure_count + 1))
        jq -n --arg repo "$repo_name" --arg status "failed" --arg error "$upload_response" \
            '{repo:$repo,status:$status,error:$error}' >> "$OUTPUT_DIR/results.jsonl"
        echo "Error: $upload_response" >> "$log_file"
    fi
    
    echo "Completed: $(date -u)" >> "$log_file"
done

# =============================================================================
# Count results
# =============================================================================

if [ -f "$OUTPUT_DIR/results.jsonl" ]; then
    success_count=$(grep -c '"status":"success"' "$OUTPUT_DIR/results.jsonl" || echo "0")
    failure_count=$(grep -c '"status":"failed"' "$OUTPUT_DIR/results.jsonl" || echo "0")
    skip_count=$(grep -c '"status":"skipped"' "$OUTPUT_DIR/results.jsonl" || echo "0")
fi

# =============================================================================
# Generate summary
# =============================================================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Installation Summary"
log_info "  Total: $repo_count"
log_success "  Success: $success_count"
log_error "  Failed: $failure_count"
log_warning "  Skipped: $skip_count"

# Generate markdown report
cat << EOF > "$OUTPUT_DIR/summary.md"
# Token Installation Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Owner:** $OWNER
**Secret Name:** $SECRET_NAME

---

## Summary

| Metric | Count |
|--------|-------|
| Total Repositories | $repo_count |
| Successful | $success_count |
| Failed | $failure_count |
| Skipped | $skip_count |

---

## Detailed Results

\`\`\`json
$(cat "$OUTPUT_DIR/results.jsonl" | jq -s '.' 2>/dev/null || echo "[]")
\`\`\`
EOF

log_success "Report generated: $OUTPUT_DIR/summary.md"
echo ""

# =============================================================================
# Exit with error if any failures
# =============================================================================

if [ "$failure_count" -gt 0 ]; then
    log_warning "Completed with $failure_count failures"
    exit 1
else
    log_success "Completed successfully"
    exit 0
fi
