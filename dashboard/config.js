/**
 * =============================================================================
 * ORG BRAIN DASHBOARD CONFIGURATION
 * =============================================================================
 * 
 * This file contains all configurable settings for the Org Brain dashboard.
 * Modify these values to customize the dashboard behavior.
 */

const CONFIG = {
    // =========================================================================
    // ORGANIZATION SETTINGS
    // =========================================================================
    
    /**
     * GitHub organization name
     * This is used to fetch organization data and display in the header
     */
    orgName: '940smiley',
    
    /**
     * Organization display name (shown in header)
     * If empty, uses orgName
     */
    orgDisplayName: '',
    
    // =========================================================================
    // DATA SETTINGS
    // =========================================================================
    
    /**
     * Path to repository data JSON file
     * Can be relative or absolute URL
     */
    dataPath: 'repos.json',
    
    /**
     * Auto-refresh interval in milliseconds
     * Set to 0 to disable auto-refresh
     */
    refreshInterval: 300000, // 5 minutes
    
    /**
     * Enable debug mode (shows console logs)
     */
    debug: false,
    
    // =========================================================================
    // DISPLAY SETTINGS
    // =========================================================================
    
    /**
     * Default number of repositories to show per page
     */
    itemsPerPage: 20,
    
    /**
     * Available page size options
     */
    pageSizeOptions: [10, 20, 50, 100],
    
    /**
     * Default sort field
     * Options: 'name', 'stars', 'forks', 'issues', 'updated', 'health'
     */
    defaultSortField: 'health',
    
    /**
     * Default sort order
     * Options: 'asc', 'desc'
     */
    defaultSortOrder: 'desc',
    
    /**
     * Show archived repositories by default
     */
    showArchivedByDefault: false,
    
    // =========================================================================
    // FEATURE FLAGS
    // =========================================================================
    
    /**
     * Enable repository search
     */
    enableSearch: true,
    
    /**
     * Enable filtering by language
     */
    enableLanguageFilter: true,
    
    /**
     * Enable filtering by health status
     */
    enableHealthFilter: true,
    
    /**
     * Enable sorting
     */
    enableSorting: true,
    
    /**
     * Enable pagination
     */
    enablePagination: true,
    
    /**
     * Enable workflow trigger buttons
     * Requires proper authentication setup
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
    
    // =========================================================================
    // HEALTH SCORE CONFIGURATION
    // =========================================================================
    
    /**
     * Health score thresholds
     */
    healthThresholds: {
        healthy: 80,    // >= 80: Green
        warning: 60,    // >= 60: Yellow
        unhealthy: 40,  // >= 40: Orange
        critical: 0     // < 40: Red
    },
    
    /**
     * Health status labels and colors
     */
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
    
    /**
     * Dashboard title
     */
    dashboardTitle: 'Org Brain',
    
    /**
     * Dashboard subtitle/tagline
     */
    dashboardSubtitle: 'Organization Command Center',
    
    /**
     * Show repository statistics in header
     */
    showHeaderStats: true,
    
    /**
     * Footer text
     */
    footerText: 'Powered by Org Brain',
    
    /**
     * Custom CSS file path (optional)
     * Set to null to use only built-in styles
     */
    customCssPath: null,
    
    // =========================================================================
    // API ENDPOINTS (for future workflow triggers)
    // =========================================================================
    
    /**
     * GitHub API base URL
     */
    githubApiBase: 'https://api.github.com',
    
    /**
     * Workflow dispatch endpoint template
     * {owner} and {repo} will be replaced
     */
    workflowDispatchTemplate: '/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
