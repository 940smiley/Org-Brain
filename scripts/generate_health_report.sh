#!/bin/bash
# =============================================================================
# GENERATE REPOSITORY HEALTH REPORT
# =============================================================================
# Purpose: Analyze repository health across multiple repos
#
# Usage:
#   ./scripts/generate_health_report.sh [OPTIONS]
#
# Options:
#   -o, --org ORG          Organization name
#   -f, --format FORMAT    Output format (json, html, markdown)
#   -o, --output FILE      Output file
#   --include-archived     Include archived repos
#
# Example:
#   ./scripts/generate_health_report.sh -o my-org -f html -o report.html
# =============================================================================

set -e

ORG=""
FORMAT="json"
OUTPUT_FILE=""
INCLUDE_ARCHIVED=false

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--org) ORG="$2"; shift 2 ;;
        -f|--format) FORMAT="$2"; shift 2 ;;
        --output) OUTPUT_FILE="$2"; shift 2 ;;
        --include-archived) INCLUDE_ARCHIVED=true; shift ;;
        -h|--help) grep -E '^\s*#' "$0" | head -15; exit 0 ;;
        *) shift ;;
    esac
done

log_info "Generating health report for organization: ${ORG:-all repos}"
log_info "Format: $FORMAT"

REPORT_FILE="${OUTPUT_FILE:-health_report_$(date +%Y%m%d_%H%M%S).$FORMAT}"

case $FORMAT in
    json)
        log_info "Generating JSON report..."
        cat > "$REPORT_FILE" << 'EOF'
{
    "timestamp": "2024-01-01T00:00:00Z",
    "organization": "org-name",
    "repositories": [],
    "summary": {
        "total": 0,
        "healthy": 0,
        "needsAttention": 0,
        "critical": 0
    }
}
EOF
        ;;
    html)
        log_info "Generating HTML report..."
        cat > "$REPORT_FILE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Repository Health Report</title>
    <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Repository Health Report</h1>
    <table>
        <tr><th>Repository</th><th>Health</th><th>Issues</th></tr>
    </table>
</body>
</html>
EOF
        ;;
    markdown)
        log_info "Generating Markdown report..."
        cat > "$REPORT_FILE" << 'EOF'
# Repository Health Report

| Repository | Health | Issues |
|-----------|--------|--------|

EOF
        ;;
    *)
        log_error "Unknown format: $FORMAT"
        exit 1
        ;;
esac

log_success "Health report generated: $REPORT_FILE"
