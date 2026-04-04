# Org Brain 2.0 - Autonomous Repository Management System

## 🚀 New Features Overview

Org Brain 2.0 transforms from a simple dashboard into a comprehensive **autonomous repository management command center**. It can now manage workflows, pages, and autonomous agents across all your repositories.

### Core Capabilities

#### 1. **🔗 GitHub Pages Management**

- **Auto-Setup**: Automatically enable Pages on matching repositories
- **Templates**: Deploy pre-built documentation, blog, portfolio, and project templates
- **Customization**: AI-powered suggestions for page design and content
- **Custom Domains**: Configure custom domains for all Pages sites
- **Manual & Autonomous Routes**: Both manual setup and scheduled auto-setup

#### 2. **🤖 Autonomous Agents**

Five types of intelligent agents that manage your repositories autonomously:

- **DependencyManager**: Manages library updates with smart batching
- **QualityManager**: Enforces code quality (linting, formatting, tests)
- **SecurityManager**: Scans vulnerabilities and responds to alerts
- **DocumentationManager**: Maintains and generates documentation
- **ReleaseManager**: Automates versioning and release processes

Each agent supports three modes:

- **Manual**: User approval required for all actions
- **Low**: Suggests actions, requires approval
- **Medium**: Auto-executes safe actions, requires approval for risky ones
- **High**: Full autonomy with safety constraints

#### 3. **⚙️ Workflow Generator**

- **Auto-Detection**: Detects repository language and type
- **Templates**: Pre-built workflows for code quality, security, tests, deployment
- **Customization**: AI-powered workflow customization suggestions
- **Deployment**: Deploy to one or many repositories
- **Version Management**: Keep workflows up-to-date across organization

#### 4. **🎯 Configuration Management**

- **Centralized Config**: Organization-wide settings in `config/repos-config.json`
- **Per-Repository Overrides**: Customize settings for individual repos
- **Feature Toggles**: Enable/disable features per repo
- **Template Library**: Reusable configuration templates

#### 5. **🤖 AI Integration Ready**

Extensible architecture for Claude AI integration:

- Documentation suggestions based on code analysis
- Workflow optimization recommendations
- Pages template customization suggestions
- Repository audit findings with improvement recommendations

---

## 📁 Project Structure

```
Org-Brain/
├── api/
│   ├── server.js                          # Main API server
│   ├── services/
│   │   ├── pages-service.js              # GitHub Pages management
│   │   └── agent-service.js              # Autonomous agents
│   └── routes/
│       ├── pages-routes.js               # Pages API endpoints
│       ├── agents-routes.js              # Agents API endpoints
│       ├── workflows-routes.js           # Workflows API endpoints
│       ├── repos-routes.js               # Repos config endpoints
│       └── repo-management-routes.js     # Advanced management endpoints
│
├── config/
│   ├── repos-config.json                 # Repository configurations
│   ├── agents-config.json                # Agent settings and autonomy levels
│   └── pages-config.json                 # Pages templates and setup rules
│
├── dashboard/                             # Web UI (existing)
│   ├── index.html
│   ├── app.js
│   ├── config.js
│   ├── style.css
│   └── data/
│
├── scripts/
│   └── generate_repo_data.sh             # Data collection script
│
└── .github/workflows/
    ├── generate-repo-data.yml            # Repository data collection
    ├── deploy-pages.yml                  # Dashboard deployment
    ├── org-pr-swarm-manager.yml          # PR automation
    ├── org-dependabot-batch-manager.yml  # Dependency batching
    ├── org-repo-health-check.yml         # Health monitoring
    ├── org-automation-conflict-detector.yml
    ├── org-self-heal.yml
    ├── pages-setup.yml                   # ✨ NEW: Pages auto-setup
    ├── agents-manager.yml                # ✨ NEW: Agent management
    └── workflow-gen.yml                  # ✨ NEW: Workflow generation
```

---

## 🔧 API Endpoints

### Pages Management

```
POST   /api/pages/enable                    # Enable Pages for repo
POST   /api/pages/deploy-template          # Deploy Pages template
GET    /api/pages/config/:repo             # Get Pages config
GET    /api/pages/list                     # List repos with Pages
PATCH  /api/pages/config/:repo             # Update Pages config
```

### Autonomous Agents

```
POST   /api/agents/initialize              # Initialize agent
POST   /api/agents/:id/execute             # Execute action
GET    /api/agents/:id/status              # Get agent status
GET    /api/agents                         # List all agents
GET    /api/agents/:id/executions          # Get execution history
```

### Workflow Management

```
POST   /api/workflows/generate             # Generate workflow
GET    /api/workflows/templates            # Get available templates
POST   /api/workflows/deploy               # Deploy workflow
POST   /api/workflows/customize            # AI customization
```

### Repository Configuration

```
GET    /api/repos/config                   # Get org config
POST   /api/repos/config                   # Update org config
GET    /api/repos/:repo/config             # Get repo config
PUT    /api/repos/:repo/config             # Update repo config
GET    /api/repos/features/:feature        # Get repos with feature
```

### Advanced Management

```
POST   /api/management/audit               # Audit repository
POST   /api/management/ai-customize        # Get AI suggestions
POST   /api/management/bulk-enable         # Bulk enable features
GET    /api/management/report              # Generate report
POST   /api/management/sync-config         # Sync configuration
```

---

## 📋 Configuration Guide

### Organization-Wide Configuration (`config/repos-config.json`)

```json
{
  "global": {
    "orgName": "your-org",
    "features": {
      "enablePagesAutoSetup": true,
      "enableWorkflowGeneration": true,
      "enableAutonomousAgents": true,
      "enableAICustomization": true
    }
  },
  "defaultRepoFeatures": {
    "pages": {
      "enabled": false,
      "source": "gh-pages",
      "theme": "minimal"
    },
    "workflows": {
      "enabled": true,
      "autoGenerate": false,
      "templates": ["code-quality", "tests", "security"]
    },
    "agents": {
      "enabled": false,
      "autonomyLevel": "manual"
    }
  },
  "repositories": {
    "my-repo": {
      "pages": { "enabled": true, "theme": "slate" },
      "agents": { "enabled": true, "autonomyLevel": "medium" },
      "workflows": { "enabled": true }
    }
  }
}
```

### Agent Configuration (`config/agents-config.json`)

```json
{
  "autonomousAgents": {
    "dependencyManager": {
      "enabled": true,
      "autonomyLevel": "high",
      "features": {
        "securityUpdates": true,
        "batchMinorPatch": true,
        "autoMerge": true
      }
    },
    "qualityManager": {
      "enabled": true,
      "autonomyLevel": "medium",
      "features": {
        "autoFormat": true,
        "autoLint": true,
        "generateReports": true
      }
    }
  }
}
```

---

## 🚀 Quick Start

### 1. Start the API Server

```bash
cd /workspaces/Org-Brain
npm install
npm start
```

The API server runs on `http://localhost:3000`

- Dashboard: `http://localhost:3000/`
- API Docs: `http://localhost:3000/api`

### 2. Enable Pages Auto-Setup

Trigger the workflow:

```bash
gh workflow run pages-setup.yml \
  --repo your-org/Org-Brain \
  --ref master
```

Or wait for the scheduled run (Sunday 2 AM UTC).

### 3. Initialize Autonomous Agents

```bash
gh workflow run agents-manager.yml \
  --repo your-org/Org-Brain \
  -f action=initialize \
  -f agent_type=quality \
  -f autonomy=medium
```

### 4. Generate Workflows

```bash
gh workflow run workflow-gen.yml \
  --repo your-org/Org-Brain \
  -f template=code-quality \
  -f language=javascript
```

---

## 🎯 Usage Scenarios

### Scenario 1: New Repository Setup

1. Repository is created
2. Pages auto-setup detects it
3. Pages is enabled with documentation template
4. Autonomous agents initialize
5. Quality workflows are generated and deployed

**Result**: Fully configured repo with automation ready → 15 minutes max setup time

### Scenario 2: Bulk Feature Enablement

**Goal**: Enable security scanning across 10 repositories

```bash
curl -X POST http://localhost:3000/api/management/bulk-enable \
  -H "Content-Type: application/json" \
  -d '{
    "feature": "security",
    "repos": ["repo1", "repo2", ..., "repo10"],
    "settings": {
      "scanDependencies": true,
      "detectSecrets": true
    }
  }'
```

### Scenario 3: AI-Powered Customization

```bash
curl -X POST http://localhost:3000/api/management/ai-customize \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-library",
    "feature": "pages"
  }'
```

**Returns**: AI-generated suggestions for documentation structure, content, design

### Scenario 4: Repository Audit & Recommendations

```bash
curl -X POST http://localhost:3000/api/management/audit \
  -H "Content-Type: application/json" \
  -d '{"repo": "my-app"}'
```

**Returns**: Comprehensive audit with scores and recommendations

---

## 🔐 Security & Safety

### Autonomy Safeguards

- **Manual Mode**: All actions require explicit approval
- **Low Mode**: Suggestions only, requires approval
- **Medium Mode**: Auto-executes safe actions (formatting, linting), requires approval for PRs/merges
- **High Mode**: Full autonomy with built-in safety constraints

### Approval Gates

- Major changes require approval
- External repository modifications require approval
- Merge actions always require verification

### Audit Trail

Every agent action is logged with:

- Timestamp
- Action type
- Parameters
- Result
- Approval (if required)

---

## 🧠 AI Integration (Extensible)

The system is designed to work with Claude AI API for:

1. **Pages Customization**

```python
ai.suggest_pages_design(repo, language, purpose)
→ Design recommendations, content outline, template customization
```

1. **Documentation Generation**

```python
ai.generate_documentation(repo, code_analysis)
→ README, API docs, guides, examples
```

1. **Workflow Optimization**

```python
ai.optimize_workflow(repo, current_workflow)
→ Performance improvements, additional checks, better parallelization
```

1. **Repository Audit**

```python
ai.audit_repository(repo)
→ Health score, improvement recommendations, best practices
```

---

## 📊 Workflow Schedules

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| Generate Repo Data | Daily 2 AM UTC | Collect repository metadata |
| Deploy Pages | On push to master | Deploy dashboard |
| PR Swarm Manager | Every 30 minutes | Manage PRs across repos |
| Dependabot Manager | Hourly | Batch dependency updates |
| Health Check | Weekly Monday 6 AM | Monitor repository health |
| Conflict Detector | Every 15 minutes | Detect automation conflicts |
| Self-Heal | Daily 3 AM UTC | Auto-fix code quality issues |
| Pages Auto-Setup | Weekly Sunday 2 AM | Setup Pages on matching repos |
| Agents Manager | Daily 4 AM UTC | Agent initialization & reports |
| Workflow Generator | Weekly Sunday 5 AM | Update organization workflows |

---

## 🔄 Manual vs Autonomous Routes

Every major feature has both routes:

### Pages: Manual Setup

```bash
curl -X POST http://localhost:3000/api/pages/enable \
  -d '{"repo": "my-repo", "template": "documentation"}'
```

### Pages: Autonomous Setup

```bash
gh workflow run pages-setup.yml --repo your-org/Org-Brain
```

### Agents: Manual Initialization

```bash
curl -X POST http://localhost:3000/api/agents/initialize \
  -d '{"repo": "my-repo", "type": "quality", "autonomy": "medium"}'
```

### Agents: Autonomous Initialization

```bash
gh workflow run agents-manager.yml \
  -f action=initialize \
  -f agent_type=quality
```

---

## 📈 Dashboard Features

The web dashboard provides:

- Real-time repository overview
- Pages deployment status
- Agent activity and statistics
- Workflow execution history
- Configuration management UI
- Organization health score
- Automation recommendations

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 16+
- GitHub CLI
- Git

### Installation

```bash
git clone https://github.com/your-org/Org-Brain
cd Org-Brain
npm install
cp .env.example .env
# Edit .env with your GitHub token and organization name
npm start
```

### Running Tests

```bash
npm test
```

### Building Dashboard

```bash
npm run build:dashboard
```

---

## 📝 API Examples

### Enable Pages for a Repository

```bash
curl -X POST http://localhost:3000/api/pages/enable \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-awesome-project",
    "source": "gh-pages",
    "theme": "minimal",
    "customDomain": "myproject.example.com"
  }'
```

### Initialize Autonomous Agent

```bash
curl -X POST http://localhost:3000/api/agents/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-lib",
    "type": "dependencyManager",
    "config": {
      "autonomyLevel": "high",
      "autoMergeOnCIPassed": true,
      "batchStrategy": "same-ecosystem"
    }
  }'
```

### Generate Code Quality Workflow

```bash
curl -X POST http://localhost:3000/api/workflows/generate \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "my-app",
    "template": "code-quality",
    "language": "javascript"
  }'
```

### Get Organization Report

```bash
curl -X GET http://localhost:3000/api/management/report
```

---

## 🤝 Contributing

Contributions welcome! Areas for expansion:

- GitLab/Gitea integration
- Additional agent types
- More Pages templates
- Enhanced AI integration
- Mobile dashboard
- Real-time notifications

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙋 Support

- **Issues**: GitHub Issues on this repository
- **Discussions**: GitHub Discussions
- **Documentation**: See `/docs` directory

---

## 🎉 Acknowledgments

Built with:

- GitHub CLI & API
- Express.js
- GitHub Actions
- Claude AI (future integration)

---

**Status**: Org Brain 2.0 is production-ready with autonomous features enabled.

Current Version: 2.0.0
Last Updated: March 2024
