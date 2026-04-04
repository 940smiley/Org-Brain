# 🧠 Org Brain

**Centralized GitHub Organization Management & Automation**

Org Brain is a comprehensive automation system for managing GitHub organizations at scale. It provides automated PR management, repository health monitoring, conflict prevention, and a beautiful dashboard for visibility.

## ✨ Features

### 🤖 Automation Workflows

| Workflow | Description | Schedule |
|----------|-------------|----------|
| **PR Swarm Manager** | Centralized PR governance with auto-fix and merge | Every 30 min |
| **Dependabot Batch Manager** | Batch dependency updates, reduce PR spam | Hourly |
| **Repo Health Check** | Weekly health metrics and reports | Weekly (Mon 6AM) |
| **Conflict Detector** | Prevent automation loops between bots | Every 15 min |
| **Self-Heal** | Automated code formatting and maintenance | Daily (3AM) |
| **Deploy Pages** | Dashboard deployment to GitHub Pages | On push |
| **Generate Repo Data** | Collect repository metadata | Daily (2AM) |

### 📊 Dashboard

- **Repository Overview**: View all repositories with health status
- **Search & Filter**: Find repos by name, language, or health status
- **Statistics**: Track stars, forks, and health metrics
- **Responsive Design**: Works on desktop and mobile
- **Auto-Refresh**: Keep data up-to-date automatically

### 🔒 Bot Conflict Prevention

Automatically detects and prevents conflicts between:

- `dependabot[bot]`
- `amazon-q[bot]`
- `github-actions[bot]`
- `llamabot`
- `google-jules[bot]`

## 🚀 Quick Start

### Prerequisites

1. GitHub organization with admin access
2. GitHub CLI (`gh`) installed locally (optional, for testing)
3. jq installed locally (optional, for testing)

### Installation

1. **Fork or clone this repository** to your organization:

   ```bash
   git clone https://github.com/940smiley/Org-Brain.git
   cd Org-Brain
   ```

2. **Create a Personal Access Token (PAT)**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Create a token with these scopes:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
     - `read:org` (Read organization membership)

3. **Add the secret to GitHub**:
   - Go to your repo Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `ORG_AUTOMATION_TOKEN`
   - Value: Your PAT from step 2

4. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Set Source to "GitHub Actions"
   - Save

5. **Enable Actions**:
   - Go to Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

6. **Run initial data generation**:
   - Go to Actions tab
   - Select "📊 Generate Repo Data"
   - Click "Run workflow"

7. **Access the dashboard**:
   - After the Deploy Pages workflow completes
   - Visit: `https://<your-org>.github.io/Org-Brain/`

## 📁 Repository Structure

```
org-brain/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml           # Dashboard deployment
│       ├── generate-repo-data.yml     # Repository data collection
│       ├── org-pr-swarm-manager.yml   # PR governance
│       ├── org-dependabot-batch-manager.yml  # Dependency batching
│       ├── org-repo-health-check.yml  # Health monitoring
│       ├── org-automation-conflict-detector.yml  # Conflict prevention
│       └── org-self-heal.yml          # Automated maintenance
├── dashboard/
│   ├── index.html                     # Dashboard UI
│   ├── style.css                      # Dashboard styles
│   ├── app.js                         # Dashboard logic
│   └── config.js                      # Configuration
├── docs/
│   └── index.html                     # GitHub Pages entry
├── scripts/
│   └── generate_repo_data.sh          # Data generation script
├── data/
│   └── repos.json                     # Generated repository data
└── README.md                          # This file
```

## ⚙️ Configuration

### Dashboard Configuration

Edit `dashboard/config.js` to customize:

```javascript
const CONFIG = {
    orgName: 'your-org',           // Your GitHub organization
    orgDisplayName: 'Your Org',    // Display name
    refreshInterval: 300000,       // Auto-refresh (5 min)
    itemsPerPage: 20,              // Pagination size
    defaultSortField: 'health',    // Default sort
    // ... more options
};
```

### Workflow Configuration

Each workflow has configurable inputs for manual dispatch:

```yaml
# Example: Run with custom parameters
on:
  workflow_dispatch:
    inputs:
      org:
        description: "Organization name"
        required: false
      dry_run:
        description: "Dry run mode"
        required: false
        type: boolean
```

## 🔧 Scripts

### Generate Repository Data (Local)

```bash
# Set your token
export GH_TOKEN=your_pat_token

# Run the script
./scripts/generate_repo_data.sh -o your-org -v

# Options:
#   -o, --org ORG        Organization name (required)
#   -t, --token TOKEN    GitHub token
#   -a, --archived       Include archived repos
#   -v, --verbose        Verbose output
```

## 📊 Health Score Algorithm

Repositories are scored 0-100 based on:

| Factor | Impact |
|--------|--------|
| No activity > 90 days | -30 |
| No activity > 30 days | -15 |
| > 50 open issues | -10 |
| Failing workflows | -20 |

**Status Levels:**

- 🟢 **Healthy**: 80-100
- 🟡 **Warning**: 60-79
- 🟠 **Unhealthy**: 40-59
- 🔴 **Critical**: 0-39

## 🔐 Security

- No external API keys required
- Uses GitHub's native `GITHUB_TOKEN` where possible
- PAT stored as encrypted secret
- All automation runs in GitHub Actions sandbox

## 📝 Bot Skip Rules

All workflows skip PRs where the last commit is from:

- `dependabot[bot]`
- `amazon-q[bot]`
- `github-actions[bot]`
- `llamabot`
- `google-jules[bot]`

This prevents automation conflicts and loops.

## 🛠️ Troubleshooting

### Workflows not running?

- Check Actions are enabled in Settings
- Verify `ORG_AUTOMATION_TOKEN` secret exists
- Check workflow run logs for errors

### Dashboard not deploying?

- Ensure Pages source is set to "GitHub Actions"
- Check the Deploy Pages workflow logs
- Verify `data/repos.json` exists

### Permission errors?

- PAT needs `repo`, `workflow`, `read:org` scopes
- For private repos, ensure token has full repo access

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

---

**Built with ❤️ using GitHub Actions and GitHub CLI**
