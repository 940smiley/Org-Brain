/**
 * =============================================================================
 * ORG BRAIN DASHBOARD CONFIGURATION (ENHANCED)
 * =============================================================================
 */

const CONFIG = {
    // =========================================================================
    // ORGANIZATION SETTINGS
    // =========================================================================

    orgName: '940smiley',
    orgDisplayName: 'Org Brain',

    // =========================================================================
    // DATA SETTINGS
    // =========================================================================

    /**
     * Load repos from ../data/repos.json when deployed to dashboard subdirectory
     * Falls back to data/repos.json for local development
     */
    dataPath: typeof window !== 'undefined' && window.location.pathname.includes( '/dashboard/' )
        ? '../data/repos.json'
        : 'data/repos.json',

    /**
     * Auto-refresh every 5 minutes
     */
    refreshInterval: 300000,

    debug: false,

    // =========================================================================
    // DISPLAY SETTINGS
    // =========================================================================

    itemsPerPage: 20,
    pageSizeOptions: [ 10, 20, 50, 100 ],

    defaultSortField: 'health',
    defaultSortOrder: 'desc',

    showArchivedByDefault: false,

    // =========================================================================
    // FEATURE FLAGS (EXPANDED)
    // =========================================================================

    enableSearch: true,
    enableLanguageFilter: true,
    enableHealthFilter: true,
    enableSorting: true,
    enablePagination: true,

    /**
     * Enable workflow trigger buttons
     * You requested this ON.
     */
    enableWorkflowTriggers: true,

    /**
     * Enable workflow installation
     * Allows installing workflows to repositories
     */
    enableWorkflowInstallation: true,

    /**
     * Enable code analysis
     */
    enableCodeAnalysis: true,

    /**
     * NEW: Show workflow status badges
     */
    enableWorkflowStatusBadges: true,

    /**
     * NEW: Show PR/Issue counts
     */
    enableRepoActivityStats: true,

    /**
     * NEW: Show last workflow run timestamp
     */
    enableLastWorkflowRun: true,

    // =========================================================================
    // HEALTH SCORE CONFIGURATION
    // =========================================================================

    healthThresholds: {
        healthy: 80,
        warning: 60,
        unhealthy: 40,
        critical: 0
    },

    healthStatusConfig: {
        healthy: {
            label: 'Healthy',
            color: '#22c55e',
            bgColor: 'rgba(34, 197, 94, 0.1)'
        },
        warning: {
            label: 'Warning',
            color: '#eab308',
            bgColor: 'rgba(234, 179, 8, 0.1)'
        },
        unhealthy: {
            label: 'Unhealthy',
            color: '#f97316',
            bgColor: 'rgba(249, 115, 22, 0.1)'
        },
        critical: {
            label: 'Critical',
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)'
        }
    },

    // =========================================================================
    // UI CUSTOMIZATION
    // =========================================================================

    dashboardTitle: 'Org Brain',
    dashboardSubtitle: 'Organization Command Center',

    showHeaderStats: true,

    footerText: 'Powered by Org Brain',

    /**
     * Optional custom CSS
     */
    customCssPath: null,

    // =========================================================================
    // API ENDPOINTS (WORKFLOW TRIGGERS ENABLED)
    // =========================================================================

    githubApiBase: 'https://api.github.com',

    workflowDispatchTemplate:
        '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches'
};

if ( typeof module !== 'undefined' && module.exports )
{
    module.exports = CONFIG;
}
