/**
 * =============================================================================
 * ORG BRAIN DASHBOARD APPLICATION
 * =============================================================================
 * 
 * Main application logic for the Org Brain dashboard.
 * Handles data loading, rendering, filtering, sorting, and user interactions.
 */

// =============================================================================
// APPLICATION STATE
// =============================================================================

const AppState = {
    repositories: [],
    filteredRepos: [],
    currentPage: 1,
    itemsPerPage: CONFIG.itemsPerPage,
    sortField: CONFIG.defaultSortField,
    sortOrder: CONFIG.defaultSortOrder,
    searchQuery: '',
    selectedLanguage: 'all',
    selectedHealth: 'all',
    showArchived: CONFIG.showArchivedByDefault,
    languages: [],
    isLoading: false,
    error: null,
    lastUpdated: null
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the dashboard application
 */
async function initDashboard() {
    log('Initializing Org Brain Dashboard...');
    
    // Update header with organization info
    updateHeader();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load repository data
    await loadRepositoryData();
    
    // Render initial view
    renderDashboard();
    
    log('Dashboard initialized successfully');
}

/**
 * Update header with organization information
 */
function updateHeader() {
    const orgName = CONFIG.orgDisplayName || CONFIG.orgName;
    document.getElementById('org-name').textContent = orgName;
    document.getElementById('dashboard-title').textContent = CONFIG.dashboardTitle;
    document.getElementById('dashboard-subtitle').textContent = CONFIG.dashboardSubtitle;
    document.title = `${CONFIG.dashboardTitle} - ${orgName}`;
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Language filter
    const languageFilter = document.getElementById('language-filter');
    if (languageFilter) {
        languageFilter.addEventListener('change', handleLanguageFilter);
    }
    
    // Health filter
    const healthFilter = document.getElementById('health-filter');
    if (healthFilter) {
        healthFilter.addEventListener('change', handleHealthFilter);
    }
    
    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }
    
    // Sort order toggle
    const sortOrderToggle = document.getElementById('sort-order-toggle');
    if (sortOrderToggle) {
        sortOrderToggle.addEventListener('click', toggleSortOrder);
    }
    
    // Archived toggle
    const archivedToggle = document.getElementById('archived-toggle');
    if (archivedToggle) {
        archivedToggle.addEventListener('change', handleArchivedToggle);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadRepositoryData());
    }
    
    // Pagination
    setupPaginationListeners();
    
    // Auto-refresh if enabled
    if (CONFIG.refreshInterval > 0) {
        setInterval(() => loadRepositoryData(true), CONFIG.refreshInterval);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

/**
 * Load repository data from JSON file
 * @param {boolean} silent - If true, don't show loading indicator
 */
async function loadRepositoryData(silent = false) {
    if (AppState.isLoading) return;
    
    AppState.isLoading = true;
    AppState.error = null;
    
    if (!silent) {
        showLoading(true);
    }
    
    try {
        const response = await fetch(CONFIG.dataPath);
        
        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.status}`);
        }
        
        const data = await response.json();
        AppState.repositories = data;
        AppState.lastUpdated = new Date();
        
        // Extract unique languages
        extractLanguages();
        
        // Apply filters and sorting
        applyFiltersAndSort();
        
        // Update UI
        if (!silent) {
            updateFiltersUI();
            renderDashboard();
            updateLastUpdated();
        }
        
        log(`Loaded ${data.length} repositories`);
        
    } catch (error) {
        AppState.error = error.message;
        logError('Failed to load repository data:', error);
        showError(error.message);
    } finally {
        AppState.isLoading = false;
        if (!silent) {
            showLoading(false);
        }
    }
}

/**
 * Extract unique languages from repositories
 */
function extractLanguages() {
    const languageSet = new Set();
    AppState.repositories.forEach(repo => {
        if (repo.language && repo.language !== 'Unknown') {
            languageSet.add(repo.language);
        }
    });
    AppState.languages = Array.from(languageSet).sort();
}

// =============================================================================
// FILTERING AND SORTING
// =============================================================================

/**
 * Apply all filters and sorting to repositories
 */
function applyFiltersAndSort() {
    let filtered = [...AppState.repositories];
    
    // Filter by search query
    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        filtered = filtered.filter(repo => 
            repo.name.toLowerCase().includes(query) ||
            repo.description.toLowerCase().includes(query) ||
            (repo.topics && repo.topics.some(t => t.toLowerCase().includes(query)))
        );
    }
    
    // Filter by language
    if (AppState.selectedLanguage !== 'all') {
        filtered = filtered.filter(repo => repo.language === AppState.selectedLanguage);
    }
    
    // Filter by health status
    if (AppState.selectedHealth !== 'all') {
        filtered = filtered.filter(repo => repo.health_status === AppState.selectedHealth);
    }
    
    // Filter archived
    if (!AppState.showArchived) {
        filtered = filtered.filter(repo => !repo.archived);
    }
    
    AppState.filteredRepos = filtered;
    
    // Sort
    sortRepositories();
    
    // Reset to first page
    AppState.currentPage = 1;
}

/**
 * Sort repositories based on current sort settings
 */
function sortRepositories() {
    const field = AppState.sortField;
    const order = AppState.sortOrder === 'asc' ? 1 : -1;
    
    AppState.filteredRepos.sort((a, b) => {
        let aVal, bVal;
        
        switch (field) {
            case 'name':
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
                break;
            case 'stars':
                aVal = a.stargazers_count;
                bVal = b.stargazers_count;
                break;
            case 'forks':
                aVal = a.forks_count;
                bVal = b.forks_count;
                break;
            case 'issues':
                aVal = a.open_issues_count;
                bVal = b.open_issues_count;
                break;
            case 'updated':
                aVal = new Date(a.updated_at).getTime();
                bVal = new Date(b.updated_at).getTime();
                break;
            case 'health':
                aVal = a.health_score;
                bVal = b.health_score;
                break;
            default:
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
        }
        
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
    });
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

function handleSearch(event) {
    AppState.searchQuery = event.target.value;
    applyFiltersAndSort();
    renderDashboard();
}

function handleLanguageFilter(event) {
    AppState.selectedLanguage = event.target.value;
    applyFiltersAndSort();
    renderDashboard();
}

function handleHealthFilter(event) {
    AppState.selectedHealth = event.target.value;
    applyFiltersAndSort();
    renderDashboard();
}

function handleSort(event) {
    const value = event.target.value.split('-');
    AppState.sortField = value[0];
    AppState.sortOrder = value[1] || 'desc';
    sortRepositories();
    renderDashboard();
    updateSortOrderIcon();
}

function toggleSortOrder() {
    AppState.sortOrder = AppState.sortOrder === 'asc' ? 'desc' : 'asc';
    sortRepositories();
    renderDashboard();
    updateSortOrderIcon();
}

function handleArchivedToggle(event) {
    AppState.showArchived = event.target.checked;
    applyFiltersAndSort();
    renderDashboard();
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Render the entire dashboard
 */
function renderDashboard() {
    renderStats();
    renderRepoGrid();
    renderPagination();
}

/**
 * Render statistics cards
 */
function renderStats() {
    const total = AppState.repositories.length;
    const filtered = AppState.filteredRepos.length;
    const archived = AppState.repositories.filter(r => r.archived).length;
    const healthy = AppState.repositories.filter(r => r.health_status === 'healthy').length;
    const totalStars = AppState.repositories.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = AppState.repositories.reduce((sum, r) => sum + r.forks_count, 0);
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = total - archived;
    document.getElementById('stat-healthy').textContent = healthy;
    document.getElementById('stat-stars').textContent = formatNumber(totalStars);
    document.getElementById('stat-forks').textContent = formatNumber(totalForks);
}

/**
 * Render repository grid
 */
function renderRepoGrid() {
    const grid = document.getElementById('repo-grid');
    if (!grid) return;
    
    const start = (AppState.currentPage - 1) * AppState.itemsPerPage;
    const end = start + AppState.itemsPerPage;
    const pageRepos = AppState.filteredRepos.slice(start, end);
    
    if (pageRepos.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No repositories found</h3>
                <p>Try adjusting your filters or search query</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = pageRepos.map(repo => createRepoCard(repo)).join('');
}

/**
 * Create HTML for a single repository card
 * @param {Object} repo - Repository data
 * @returns {string} HTML string
 */
function createRepoCard(repo) {
    const healthConfig = CONFIG.healthStatusConfig[repo.health_status];
    const languageClass = repo.language ? repo.language.toLowerCase().replace(/[^a-z]/g, '-') : '';
    const isArchived = repo.archived ? 'archived' : '';
    
    return `
        <div class="repo-card ${isArchived}" data-repo="${repo.name}">
            <div class="repo-card-header">
                <div class="repo-name">
                    <a href="${repo.html_url}" target="_blank" rel="noopener">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${repo.name}
                    </a>
                </div>
                <span class="health-badge" style="background-color: ${healthConfig.bgColor}; color: ${healthConfig.color}">
                    ${healthConfig.label}
                </span>
            </div>
            
            <p class="repo-description">${escapeHtml(repo.description)}</p>
            
            <div class="repo-meta">
                ${repo.language ? `
                    <span class="repo-language">
                        <span class="language-dot ${languageClass}"></span>
                        ${repo.language}
                    </span>
                ` : ''}
                
                ${repo.topics && repo.topics.length > 0 ? `
                    <div class="repo-topics">
                        ${repo.topics.slice(0, 3).map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="repo-stats">
                <span class="stat" title="Stars">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    ${formatNumber(repo.stargazers_count)}
                </span>
                <span class="stat" title="Forks">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="18" r="3"></circle>
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="18" cy="6" r="3"></circle>
                        <path d="M6 9v3a6 6 0 0 0 6 6"></path>
                        <path d="M18 9v3a6 6 0 0 1-6 6"></path>
                    </svg>
                    ${formatNumber(repo.forks_count)}
                </span>
                <span class="stat" title="Issues">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${formatNumber(repo.open_issues_count)}
                </span>
            </div>
            
            <div class="repo-card-footer">
                <span class="last-updated">
                    Updated ${formatDate(repo.updated_at)}
                </span>
                <div class="repo-actions">
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-sm">
                        View Repo
                    </a>
                    ${repo.homepage ? `
                        <a href="${repo.homepage}" target="_blank" rel="noopener" class="btn btn-sm btn-outline">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    ` : ''}
                </div>
            </div>
            
            ${repo.archived ? '<div class="archived-badge">Archived</div>' : ''}
        </div>
    `;
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(AppState.filteredRepos.length / AppState.itemsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    const pages = getPaginationPages(AppState.currentPage, totalPages);
    
    container.innerHTML = `
        <button class="pagination-btn" onclick="goToPage(1)" ${AppState.currentPage === 1 ? 'disabled' : ''}>
            First
        </button>
        <button class="pagination-btn" onclick="goToPage(${AppState.currentPage - 1})" ${AppState.currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
        
        ${pages.map(page => {
            if (page === '...') {
                return '<span class="pagination-ellipsis">...</span>';
            }
            return `<button class="pagination-btn ${page === AppState.currentPage ? 'active' : ''}" onclick="goToPage(${page})">${page}</button>`;
        }).join('')}
        
        <button class="pagination-btn" onclick="goToPage(${AppState.currentPage + 1})" ${AppState.currentPage === totalPages ? 'disabled' : ''}>
            Next
        </button>
        <button class="pagination-btn" onclick="goToPage(${totalPages})" ${AppState.currentPage === totalPages ? 'disabled' : ''}>
            Last
        </button>
    `;
    
    // Update page info
    const start = (AppState.currentPage - 1) * AppState.itemsPerPage + 1;
    const end = Math.min(AppState.currentPage * AppState.itemsPerPage, AppState.filteredRepos.length);
    document.getElementById('page-info').textContent = `Showing ${start}-${end} of ${AppState.filteredRepos.length}`;
}

/**
 * Get pagination page numbers
 */
function getPaginationPages(current, total) {
    const delta = 2;
    const range = [];
    
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
    }
    
    if (current - delta > 2) {
        range.unshift('...');
    }
    if (current + delta < total - 1) {
        range.push('...');
    }
    
    range.unshift(1);
    if (total > 1) {
        range.push(total);
    }
    
    return range;
}

/**
 * Navigate to specific page
 * @param {number} page - Page number
 */
function goToPage(page) {
    const totalPages = Math.ceil(AppState.filteredRepos.length / AppState.itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    AppState.currentPage = page;
    renderRepoGrid();
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// UI HELPERS
// =============================================================================

function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    const content = document.getElementById('main-content');
    
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
    if (content) {
        content.style.opacity = show ? '0.5' : '1';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>${escapeHtml(message)}</span>
            </div>
        `;
        errorContainer.style.display = 'block';
    }
}

function updateFiltersUI() {
    // Update language filter
    const languageFilter = document.getElementById('language-filter');
    if (languageFilter) {
        languageFilter.innerHTML = `
            <option value="all">All Languages</option>
            ${AppState.languages.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
        `;
        languageFilter.value = AppState.selectedLanguage;
    }
    
    // Update health filter
    const healthFilter = document.getElementById('health-filter');
    if (healthFilter) {
        healthFilter.value = AppState.selectedHealth;
    }
    
    // Update archived toggle
    const archivedToggle = document.getElementById('archived-toggle');
    if (archivedToggle) {
        archivedToggle.checked = AppState.showArchived;
    }
}

function updateSortOrderIcon() {
    const icon = document.getElementById('sort-order-icon');
    if (icon) {
        icon.innerHTML = AppState.sortOrder === 'asc' 
            ? '<path d="M12 19V5M5 12l7-7 7 7"/>'
            : '<path d="M12 5v14M5 12l7 7 7-7"/>';
    }
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && AppState.lastUpdated) {
        el.textContent = `Last updated: ${AppState.lastUpdated.toLocaleTimeString()}`;
    }
}

function setupPaginationListeners() {
    // Page size selector
    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
        pageSizeSelect.innerHTML = CONFIG.pageSizeOptions.map(size => 
            `<option value="${size}" ${size === AppState.itemsPerPage ? 'selected' : ''}>${size} per page</option>`
        ).join('');
        
        pageSizeSelect.addEventListener('change', (e) => {
            AppState.itemsPerPage = parseInt(e.target.value);
            AppState.currentPage = 1;
            renderRepoGrid();
            renderPagination();
        });
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function log(...args) {
    if (CONFIG.debug) {
        console.log('[Org Brain]', ...args);
    }
}

function logError(...args) {
    if (CONFIG.debug) {
        console.error('[Org Brain]', ...args);
    }
}

// =============================================================================
// START APPLICATION
// =============================================================================

document.addEventListener('DOMContentLoaded', initDashboard);
