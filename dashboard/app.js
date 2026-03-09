/**
 * =============================================================================
 * ORG BRAIN DASHBOARD APPLICATION - Enhanced Version
 * =============================================================================
 * Features:
 * - Per-repo workflow controls
 * - Bulk actions
 * - Workflow status indicators
 * - Failure reporting panel
 * - Auto-repair functionality
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
    lastUpdated: null,
    selectedRepos: new Set(),
    workflowFailures: null,
    bulkActionMode: false
};

// Available workflows for dispatch
const AVAILABLE_WORKFLOWS = [
    { id: 'org-pr-swarm-manager.yml', name: '🤖 PR Swarm Manager', icon: '🔀' },
    { id: 'org-dependabot-batch-manager.yml', name: '📦 Dependabot Batch', icon: '📦' },
    { id: 'org-repo-health-check.yml', name: '🏥 Health Check', icon: '🏥' },
    { id: 'org-self-heal.yml', name: '🔧 Self-Heal', icon: '🔧' },
    { id: 'org-automation-conflict-detector.yml', name: '⚠️ Conflict Detector', icon: '⚠️' },
    { id: 'autonomous-agents-manager.yml', name: '🤖 Agents Manager', icon: '🤖' },
    { id: 'pages-auto-setup.yml', name: '📄 Pages Setup', icon: '📄' },
    { id: 'analyze-code.yml', name: '🔍 Code Analysis', icon: '🔍' },
    { id: 'scan-workflow-failures.yml', name: '🔍 Scan Failures', icon: '📊' },
    { id: 'generate-repo-data.yml', name: '📊 Generate Data', icon: '📈' },
    { id: 'workflow-generator.yml', name: '⚙️ Workflow Generator', icon: '⚙️' },
    { id: 'autonomous-setup.yml', name: '🚀 One-Click Setup', icon: '🚀' },
    { id: 'auto-repair.yml', name: '🔧 Auto-Repair', icon: '🛠️' }
];

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initDashboard() {
    log('Initializing Org Brain Dashboard...');
    updateHeader();
    setupEventListeners();
    await loadRepositoryData();
    await loadWorkflowFailures();
    renderDashboard();
    log('Dashboard initialized successfully');
}

function updateHeader() {
    const orgName = CONFIG.orgDisplayName || CONFIG.orgName;
    document.getElementById('org-name').textContent = orgName;
    document.getElementById('dashboard-title').textContent = CONFIG.dashboardTitle;
    document.getElementById('dashboard-subtitle').textContent = CONFIG.dashboardSubtitle;
    document.title = `${CONFIG.dashboardTitle} - ${orgName}`;
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    const languageFilter = document.getElementById('language-filter');
    if (languageFilter) {
        languageFilter.addEventListener('change', handleLanguageFilter);
    }

    const healthFilter = document.getElementById('health-filter');
    if (healthFilter) {
        healthFilter.addEventListener('change', handleHealthFilter);
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    const archivedToggle = document.getElementById('archived-toggle');
    if (archivedToggle) {
        archivedToggle.addEventListener('change', handleArchivedToggle);
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadRepositoryData());
    }

    const bulkActionsBtn = document.getElementById('bulk-actions-btn');
    if (bulkActionsBtn) {
        bulkActionsBtn.addEventListener('click', toggleBulkActions);
    }

    const failuresPanelBtn = document.getElementById('failures-panel-btn');
    if (failuresPanelBtn) {
        failuresPanelBtn.addEventListener('click', toggleFailuresPanel);
    }

    setupPaginationListeners();

    if (CONFIG.refreshInterval > 0) {
        setInterval(() => {
            loadRepositoryData(true);
            loadWorkflowFailures(true);
        }, CONFIG.refreshInterval);
    }
}

// =============================================================================
// DATA LOADING
// =============================================================================

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

        extractLanguages();
        applyFiltersAndSort();

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

async function loadWorkflowFailures(silent = false) {
    try {
        const response = await fetch('data/workflow-failures/failures.json');
        if (response.ok) {
            AppState.workflowFailures = await response.json();
            log('Loaded workflow failures data');
        }
    } catch (error) {
        log('No workflow failures data available');
    }
}

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

function applyFiltersAndSort() {
    let filtered = [...AppState.repositories];

    if (AppState.searchQuery) {
        const query = AppState.searchQuery.toLowerCase();
        filtered = filtered.filter(repo =>
            repo.name.toLowerCase().includes(query) ||
            repo.description.toLowerCase().includes(query) ||
            (repo.topics && repo.topics.some(t => t.toLowerCase().includes(query)))
        );
    }

    if (AppState.selectedLanguage !== 'all') {
        filtered = filtered.filter(repo => repo.language === AppState.selectedLanguage);
    }

    if (AppState.selectedHealth !== 'all') {
        filtered = filtered.filter(repo => repo.health_status === AppState.selectedHealth);
    }

    if (!AppState.showArchived) {
        filtered = filtered.filter(repo => !repo.archived);
    }

    AppState.filteredRepos = filtered;
    sortRepositories();
    AppState.currentPage = 1;
}

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
}

function handleArchivedToggle(event) {
    AppState.showArchived = event.target.checked;
    applyFiltersAndSort();
    renderDashboard();
}

function toggleBulkActions() {
    AppState.bulkActionMode = !AppState.bulkActionMode;
    renderDashboard();
}

function toggleFailuresPanel() {
    const panel = document.getElementById('failures-panel');
    if (panel) {
        panel.classList.toggle('open');
    }
}

function toggleRepoSelection(repoName) {
    if (AppState.selectedRepos.has(repoName)) {
        AppState.selectedRepos.delete(repoName);
    } else {
        AppState.selectedRepos.add(repoName);
    }
    renderDashboard();
}

function selectAllRepos() {
    AppState.filteredRepos.forEach(repo => AppState.selectedRepos.add(repo.name));
    renderDashboard();
}

function clearRepoSelection() {
    AppState.selectedRepos.clear();
    renderDashboard();
}

// =============================================================================
// WORKFLOW ACTIONS
// =============================================================================

async function triggerWorkflow(owner, repo, workflowId) {
    const token = prompt('Enter your GitHub PAT (Personal Access Token) with repo and workflow scopes:');
    if (!token) {
        alert('Workflow trigger cancelled. PAT required.');
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    repository: repo,
                    mode: 'single'
                }
            })
        });

        if (response.ok) {
            alert(`✅ Workflow "${workflowId}" triggered successfully on ${repo}!`);
        } else {
            const error = await response.json();
            alert(`❌ Failed to trigger workflow: ${error.message}`);
        }
    } catch (error) {
        alert(`❌ Error triggering workflow: ${error.message}`);
    }
}

async function bulkTriggerWorkflow(workflowId) {
    if (AppState.selectedRepos.size === 0) {
        alert('Please select repositories first.');
        return;
    }

    const token = prompt('Enter your GitHub PAT (Personal Access Token) with repo and workflow scopes:');
    if (!token) return;

    const owner = CONFIG.orgName;
    let successCount = 0;
    let failCount = 0;

    for (const repo of AppState.selectedRepos) {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ref: 'main' })
            });

            if (response.ok) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            failCount++;
        }
    }

    alert(`Bulk trigger complete:\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
}

async function installWorkflow(owner, repo, workflowType) {
    const token = prompt('Enter your GitHub PAT (Personal Access Token) with repo scope:');
    if (!token) return;

    const workflowFiles = {
        'health-check': { name: 'org-repo-health-check.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/org-repo-health-check.yml' },
        'dependabot-batch': { name: 'org-dependabot-batch-manager.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/org-dependabot-batch-manager.yml' },
        'pr-swarm': { name: 'org-pr-swarm-manager.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/org-pr-swarm-manager.yml' },
        'self-heal': { name: 'org-self-heal.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/org-self-heal.yml' },
        'conflict-detector': { name: 'org-automation-conflict-detector.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/org-automation-conflict-detector.yml' },
        'agents-manager': { name: 'autonomous-agents-manager.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/autonomous-agents-manager.yml' },
        'pages-setup': { name: 'pages-auto-setup.yml', url: 'https://raw.githubusercontent.com/940smiley/Org-Brain/main/.github/workflows/pages-auto-setup.yml' }
    };

    const workflow = workflowFiles[workflowType];
    if (!workflow) {
        alert('Invalid workflow type.');
        return;
    }

    try {
        const contentResponse = await fetch(workflow.url);
        const content = await contentResponse.text();

        const createResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows/${workflow.name}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `chore: add ${workflow.name} from Org Brain`,
                content: btoa(content)
            })
        });

        if (createResponse.ok) {
            alert(`✅ Workflow ${workflow.name} installed successfully on ${repo}!`);
        } else {
            const error = await createResponse.json();
            alert(`❌ Failed to install workflow: ${error.message}`);
        }
    } catch (error) {
        alert(`❌ Error installing workflow: ${error.message}`);
    }
}

async function runCodeAnalysis(owner, repo) {
    const token = prompt('Enter your GitHub PAT (Personal Access Token) with repo and workflow scopes:');
    if (!token) return;

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/Org-Brain/actions/workflows/analyze-code.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: { repo: repo, owner: owner }
            })
        });

        if (response.ok) {
            alert(`✅ Code analysis started for ${repo}!\n\nResults will be available in the dashboard once complete.`);
        } else {
            const error = await response.json();
            alert(`❌ Failed to start analysis: ${error.message}`);
        }
    } catch (error) {
        alert(`❌ Error starting analysis: ${error.message}`);
    }
}

async function runOneClickSetup(owner, repo) {
    const token = prompt('Enter your GitHub PAT (Personal Access Token) with repo and workflow scopes:');
    if (!token) return;

    if (!confirm(`⚠️ This will install all Org Brain workflows to ${repo} and configure settings.\n\nContinue?`)) {
        return;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${owner}/Org-Brain/actions/workflows/autonomous-setup.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    target_repo: repo,
                    mode: 'single'
                }
            })
        });

        if (response.ok) {
            alert(`✅ One-Click Setup started for ${repo}!\n\nThis will:\n- Install all workflows\n- Configure permissions\n- Run initial scans\n\nCheck the Actions tab for progress.`);
        } else {
            const error = await response.json();
            alert(`❌ Failed to start setup: ${error.message}`);
        }
    } catch (error) {
        alert(`❌ Error starting setup: ${error.message}`);
    }
}

async function showAnalysisModal(owner, repo) {
    const analysis = await fetchAnalysisResults(repo);

    let content = analysis ? `
        <div class="analysis-results">
            <h3>Analysis Results for ${repo}</h3>
            <p class="analysis-date">Analyzed: ${new Date(analysis.analyzed_at).toLocaleString()}</p>

            <div class="health-score-display">
                <div class="health-score-circle ${analysis.health_status}">
                    <span class="score">${analysis.health_score}</span>
                </div>
                <span class="health-status">${analysis.health_status.toUpperCase()}</span>
            </div>

            <div class="metrics-grid">
                <div class="metric-card">
                    <span class="metric-label">Code Quality</span>
                    <span class="metric-value">${analysis.metrics.code_quality}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Documentation</span>
                    <span class="metric-value">${analysis.metrics.documentation}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Testing</span>
                    <span class="metric-value">${analysis.metrics.testing}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Security</span>
                    <span class="metric-value">${analysis.metrics.security}</span>
                </div>
                <div class="metric-card">
                    <span class="metric-label">Maintenance</span>
                    <span class="metric-value">${analysis.metrics.maintenance}</span>
                </div>
            </div>

            <div class="analysis-stats">
                <h4>Repository Stats</h4>
                <ul>
                    <li>Total Files: ${analysis.stats.total_files}</li>
                    <li>Code Files: ${analysis.stats.code_files}</li>
                    <li>Documentation Files: ${analysis.stats.doc_files}</li>
                    <li>Test Files: ${analysis.stats.test_files}</li>
                </ul>
            </div>
        </div>
    ` : `
        <div class="analysis-pending">
            <h3>No Analysis Available for ${repo}</h3>
            <p>Run a new analysis to get code quality metrics and recommendations.</p>
        </div>
    `;

    content += `
        <div class="analysis-actions">
            <button onclick="runCodeAnalysis('${owner}', '${repo}')" class="btn btn-primary">
                🔄 Run New Analysis
            </button>
            <button onclick="closeModal()" class="btn btn-secondary">
                Close
            </button>
        </div>
    `;

    showModal(`Code Analysis: ${repo}`, content);
}

async function fetchAnalysisResults(repo) {
    try {
        const response = await fetch(`data/analysis/${repo}.json`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        return null;
    }
}

function showWorkflowMenu(owner, repo, event) {
    event.stopPropagation();

    const workflowsHtml = AVAILABLE_WORKFLOWS.map(wf => `
        <button class="workflow-menu-item" onclick="triggerWorkflow('${owner}', '${repo}', '${wf.id}')">
            ${wf.icon} ${wf.name}
        </button>
    `).join('');

    const content = `
        <div class="workflow-menu">
            <h4>Run Workflow on ${repo}</h4>
            ${workflowsHtml}
        </div>
    `;

    showModal(`Workflow Menu: ${repo}`, content);
}

function showBulkWorkflowMenu() {
    if (AppState.selectedRepos.size === 0) {
        alert('Please select repositories first.');
        return;
    }

    const workflowsHtml = AVAILABLE_WORKFLOWS.map(wf => `
        <button class="workflow-menu-item" onclick="bulkTriggerWorkflow('${wf.id}')">
            ${wf.icon} ${wf.name} (on ${AppState.selectedRepos.size} repos)
        </button>
    `).join('');

    const content = `
        <div class="workflow-menu">
            <h4>Bulk Workflow Actions</h4>
            <p>Selected: ${AppState.selectedRepos.size} repositories</p>
            ${workflowsHtml}
        </div>
    `;

    showModal('Bulk Workflow Actions', content);
}

function showInstallMenu(owner, repo, event) {
    event.stopPropagation();

    const content = `
        <div class="workflow-menu">
            <h4>Install Workflows to ${repo}</h4>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'health-check')">🏥 Health Check</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'dependabot-batch')">📦 Dependabot Batch</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'pr-swarm')">🤖 PR Swarm Manager</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'self-heal')">🔧 Self-Heal</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'conflict-detector')">⚠️ Conflict Detector</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'agents-manager')">🤖 Agents Manager</button>
            <button class="workflow-menu-item" onclick="installWorkflow('${owner}', '${repo}', 'pages-setup')">📄 Pages Setup</button>
            <hr>
            <button class="workflow-menu-item" onclick="runOneClickSetup('${owner}', '${repo}')" style="background-color: var(--color-success);">
                🚀 One-Click Setup (All Workflows)
            </button>
        </div>
    `;

    showModal(`Install Workflows: ${repo}`, content);
}

// =============================================================================
// RENDERING
// =============================================================================

function renderDashboard() {
    renderStats();
    renderRepoGrid();
    renderPagination();
    renderBulkActionsBar();
    renderFailuresPanel();
}

function renderStats() {
    const total = AppState.repositories.length;
    const archived = AppState.repositories.filter(r => r.archived).length;
    const healthy = AppState.repositories.filter(r => r.health_status === 'healthy').length;
    const totalStars = AppState.repositories.reduce((sum, r) => sum + r.stargazers_count, 0);
    const totalForks = AppState.repositories.reduce((sum, r) => sum + r.forks_count, 0);

    // Get failure stats if available
    let totalFailures = 0;
    let reposWithFailures = 0;
    if (AppState.workflowFailures) {
        totalFailures = AppState.workflowFailures.scan_summary?.total_failures || 0;
        reposWithFailures = AppState.workflowFailures.scan_summary?.repos_with_failures || 0;
    }

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = total - archived;
    document.getElementById('stat-healthy').textContent = healthy;
    document.getElementById('stat-stars').textContent = formatNumber(totalStars);
    document.getElementById('stat-forks').textContent = formatNumber(totalForks);

    const statFailures = document.getElementById('stat-failures');
    if (statFailures) {
        statFailures.textContent = totalFailures;
        statFailures.style.color = totalFailures > 0 ? 'var(--color-danger)' : 'var(--color-success)';
    }
}

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

function createRepoCard(repo) {
    const healthConfig = CONFIG.healthStatusConfig[repo.health_status];
    const languageClass = repo.language ? repo.language.toLowerCase().replace(/[^a-z]/g, '-') : '';
    const isArchived = repo.archived ? 'archived' : '';
    const owner = CONFIG.orgName;
    const isSelected = AppState.selectedRepos.has(repo.name);

    // Get failure count for this repo
    let failureCount = 0;
    if (AppState.workflowFailures && AppState.workflowFailures.repositories) {
        const repoData = AppState.workflowFailures.repositories.find(r => r.name === repo.name);
        if (repoData) {
            failureCount = repoData.failures?.length || 0;
        }
    }

    return `
        <div class="repo-card ${isArchived} ${isSelected ? 'selected' : ''}" data-repo="${repo.name}">
            ${AppState.bulkActionMode ? `
                <div class="repo-select-overlay">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleRepoSelection('${repo.name}')">
                </div>
            ` : ''}

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
                ${failureCount > 0 ? `
                    <span class="stat failure-badge" title="Workflow Failures">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        ${failureCount}
                    </span>
                ` : ''}
            </div>

            <div class="repo-card-footer">
                <span class="last-updated">
                    Updated ${formatDate(repo.updated_at)}
                </span>
                <div class="repo-actions">
                    <a href="${repo.html_url}" target="_blank" rel="noopener" class="btn btn-sm">
                        View
                    </a>
                    <button onclick="showAnalysisModal('${owner}', '${repo.name}')" class="btn btn-sm btn-outline" title="Analyze Code">
                        🔍
                    </button>
                    <button onclick="showWorkflowMenu('${owner}', '${repo.name}', event)" class="btn btn-sm btn-primary" title="Run Workflow">
                        ▶️
                    </button>
                    <button onclick="showInstallMenu('${owner}', '${repo.name}', event)" class="btn btn-sm btn-outline" title="Install Workflows">
                        📥
                    </button>
                </div>
            </div>

            ${repo.archived ? '<div class="archived-badge">Archived</div>' : ''}
        </div>
    `;
}

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
        <button class="pagination-btn" onclick="goToPage(1)" ${AppState.currentPage === 1 ? 'disabled' : ''}>First</button>
        <button class="pagination-btn" onclick="goToPage(${AppState.currentPage - 1})" ${AppState.currentPage === 1 ? 'disabled' : ''}>Previous</button>
        ${pages.map(page => {
            if (page === '...') {
                return '<span class="pagination-ellipsis">...</span>';
            }
            return `<button class="pagination-btn ${page === AppState.currentPage ? 'active' : ''}" onclick="goToPage(${page})">${page}</button>`;
        }).join('')}
        <button class="pagination-btn" onclick="goToPage(${AppState.currentPage + 1})" ${AppState.currentPage === totalPages ? 'disabled' : ''}>Next</button>
        <button class="pagination-btn" onclick="goToPage(${totalPages})" ${AppState.currentPage === totalPages ? 'disabled' : ''}>Last</button>
    `;

    const start = (AppState.currentPage - 1) * AppState.itemsPerPage + 1;
    const end = Math.min(AppState.currentPage * AppState.itemsPerPage, AppState.filteredRepos.length);
    document.getElementById('page-info').textContent = `Showing ${start}-${end} of ${AppState.filteredRepos.length}`;
}

function renderBulkActionsBar() {
    const container = document.getElementById('bulk-actions-bar');
    if (!container) return;

    if (!AppState.bulkActionMode) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
        <span class="bulk-info">${AppState.selectedRepos.size} repositories selected</span>
        <button class="btn btn-sm" onclick="selectAllRepos()">Select All</button>
        <button class="btn btn-sm" onclick="clearRepoSelection()">Clear Selection</button>
        <button class="btn btn-sm btn-primary" onclick="showBulkWorkflowMenu()">▶️ Run Workflow</button>
        <button class="btn btn-sm" onclick="bulkInstallWorkflows()">📥 Install Workflows</button>
        <button class="btn btn-sm" onclick="bulkAnalyze()">🔍 Analyze All</button>
    `;
}

function renderFailuresPanel() {
    const container = document.getElementById('failures-panel-content');
    if (!container) return;

    if (!AppState.workflowFailures || AppState.workflowFailures.scan_summary?.total_failures === 0) {
        container.innerHTML = `
            <div class="no-failures">
                <div class="no-failures-icon">✅</div>
                <p>No workflow failures detected!</p>
            </div>
        `;
        return;
    }

    const failures = AppState.workflowFailures.repositories
        .filter(r => r.failures && r.failures.length > 0)
        .flatMap(r => r.failures.map(f => ({ ...f, repo: r.name })));

    container.innerHTML = `
        <div class="failures-header">
            <h4>Recent Failures (${AppState.workflowFailures.scan_summary.total_failures})</h4>
            <button class="btn btn-sm" onclick="window.open('data/workflow-failures/summary.md', '_blank')">View Full Report</button>
        </div>
        <div class="failures-list">
            ${failures.slice(0, 10).map(f => `
                <div class="failure-item">
                    <div class="failure-repo">${f.repo}</div>
                    <div class="failure-workflow">${f.workflow}</div>
                    <div class="failure-status">${f.conclusion}</div>
                    <a href="${f.url}" target="_blank" class="btn btn-sm btn-outline">View Run</a>
                </div>
            `).join('')}
        </div>
    `;
}

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
    const languageFilter = document.getElementById('language-filter');
    if (languageFilter) {
        languageFilter.innerHTML = `
            <option value="all">All Languages</option>
            ${AppState.languages.map(lang => `<option value="${lang}">${lang}</option>`).join('')}
        `;
        languageFilter.value = AppState.selectedLanguage;
    }

    const healthFilter = document.getElementById('health-filter');
    if (healthFilter) {
        healthFilter.value = AppState.selectedHealth;
    }

    const archivedToggle = document.getElementById('archived-toggle');
    if (archivedToggle) {
        archivedToggle.checked = AppState.showArchived;
    }
}

function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && AppState.lastUpdated) {
        el.textContent = `Last updated: ${AppState.lastUpdated.toLocaleTimeString()}`;
    }
}

function setupPaginationListeners() {
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

// Bulk action helpers
function bulkInstallWorkflows() {
    if (AppState.selectedRepos.size === 0) {
        alert('Please select repositories first.');
        return;
    }
    alert(`Bulk install feature coming soon for ${AppState.selectedRepos.size} repositories.`);
}

function bulkAnalyze() {
    if (AppState.selectedRepos.size === 0) {
        alert('Please select repositories first.');
        return;
    }
    alert(`Bulk analysis feature coming soon for ${AppState.selectedRepos.size} repositories.`);
}

// =============================================================================
// MODAL SYSTEM
// =============================================================================

function showModal(title, content) {
    closeModal();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${escapeHtml(title)}</h2>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.remove();
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
