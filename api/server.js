/**
 * =============================================================================
 * ORG BRAIN - REPO MANAGEMENT API SERVER
 * =============================================================================
 * 
 * Central API for autonomous repository management across all user-owned repos.
 * Provides endpoints for:
 *   - Repository discovery and management
 *   - Workflow generation and deployment
 *   - GitHub Pages configuration
 *   - Autonomous feature deployment
 *   - AI-powered customization suggestions
 *   - Manual and autonomous routing
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Service imports
const RepoService = require('../services/repo-service');
const WorkflowService = require('../services/workflow-service');
const PagesService = require('../services/pages-service');
const AutomationService = require('../services/automation-service');
const AIService = require('../services/ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize services
const repoService = new RepoService(process.env.GITHUB_TOKEN);
const workflowService = new WorkflowService(process.env.GITHUB_TOKEN);
const pagesService = new PagesService(process.env.GITHUB_TOKEN);
const automationService = new AutomationService(process.env.GITHUB_TOKEN);
const aiService = new AIService();

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// =============================================================================
// REPOSITORY MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/repos - List all user-owned repositories
 * Query params:
 *   - includeArchived: boolean
 *   - language: string (filter by language)
 *   - sort: 'stars' | 'updated' | 'name'
 */
app.get('/api/repos', async (req, res) => {
    try {
        const options = {
            includeArchived: req.query.includeArchived === 'true',
            language: req.query.language,
            sort: req.query.sort || 'updated'
        };
        
        const repos = await repoService.listAllUserRepos(options);
        res.json({ success: true, data: repos });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/repos/:owner/:repo - Get repository details
 */
app.get('/api/repos/:owner/:repo', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const details = await repoService.getRepoDetails(owner, repo);
        res.json({ success: true, data: details });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/repos/:owner/:repo/config - Get repository configuration
 */
app.get('/api/repos/:owner/:repo/config', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const config = await repoService.getRepoConfig(owner, repo);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/config - Update repository configuration
 */
app.post('/api/repos/:owner/:repo/config', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const config = await repoService.updateRepoConfig(owner, repo, req.body);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =============================================================================
// WORKFLOW MANAGEMENT ENDPOINTS
// =============================================================================

/**
 * GET /api/repos/:owner/:repo/workflows - List available workflows
 */
app.get('/api/repos/:owner/:repo/workflows', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const workflows = await workflowService.listWorkflows(owner, repo);
        res.json({ success: true, data: workflows });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/workflows/generate - Generate and deploy workflow
 * Body:
 *   - type: string (pr-manager, dependabot-batch, health-check, self-heal, etc.)
 *   - config: object (workflow-specific configuration)
 *   - autonomous: boolean (deploy as autonomous or manual)
 */
app.post('/api/repos/:owner/:repo/workflows/generate', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { type, config, autonomous } = req.body;
        
        const workflow = await workflowService.generateWorkflow(
            owner,
            repo,
            type,
            config,
            autonomous
        );
        
        res.json({ 
            success: true, 
            data: workflow,
            message: `Workflow ${type} deployed to ${owner}/${repo}`
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/workflows/:workflowId/trigger - Manually trigger workflow
 */
app.post('/api/repos/:owner/:repo/workflows/:workflowId/trigger', async (req, res) => {
    try {
        const { owner, repo, workflowId } = req.params;
        const result = await workflowService.triggerWorkflow(owner, repo, workflowId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =============================================================================
// GITHUB PAGES CONFIGURATION ENDPOINTS
// =============================================================================

/**
 * GET /api/repos/:owner/:repo/pages - Get Pages configuration
 */
app.get('/api/repos/:owner/:repo/pages', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const pages = await pagesService.getPagesConfig(owner, repo);
        res.json({ success: true, data: pages });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/pages/enable - Enable and configure GitHub Pages
 * Body:
 *   - source: 'gh-pages' | 'main' | 'develop' (branch)
 *   - path: '/' | '/docs' (path within branch)
 *   - theme: string (Jekyll theme)
 *   - customDomain: string (optional)
 *   - autonomous: boolean (auto-deploy or manual)
 */
app.post('/api/repos/:owner/:repo/pages/enable', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const config = await pagesService.enablePages(owner, repo, req.body);
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/pages/customize - Customize Pages with AI suggestions
 * Body:
 *   - type: 'readme' | 'showcase' | 'docs' | 'portfolio'
 *   - aiSuggestions: boolean (use AI to generate content)
 *   - branding: object (colors, logo, etc.)
 */
app.post('/api/repos/:owner/:repo/pages/customize', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const customization = await pagesService.customizePages(owner, repo, req.body);
        res.json({ success: true, data: customization });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =============================================================================
// AUTONOMOUS AUTOMATION ENDPOINTS
// =============================================================================

/**
 * POST /api/repos/:owner/:repo/automation/enable - Enable autonomous automation
 * Body:
 *   - features: string[] (pr-manager, dependabot, health-check, etc.)
 *   - config: object (feature-specific configuration)
 */
app.post('/api/repos/:owner/:repo/automation/enable', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const result = await automationService.enableAutomation(
            owner,
            repo,
            req.body.features,
            req.body.config
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * GET /api/repos/:owner/:repo/automation/status - Get automation status
 */
app.get('/api/repos/:owner/:repo/automation/status', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const status = await automationService.getAutomationStatus(owner, repo);
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =============================================================================
// AI CUSTOMIZATION ENDPOINTS
// =============================================================================

/**
 * POST /api/repos/:owner/:repo/ai/suggest-features - Get AI suggestions for repo features
 * Body:
 *   - repoType: string (library, app, tool, documentation)
 *   - context: string (additional context about repo)
 */
app.post('/api/repos/:owner/:repo/ai/suggest-features', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const repoData = await repoService.getRepoDetails(owner, repo);
        
        const suggestions = await aiService.suggestFeatures(
            repoData,
            req.body.repoType,
            req.body.context
        );
        
        res.json({ success: true, data: suggestions });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/ai/customize-pages - Get AI suggestions for page customization
 * Body:
 *   - pageType: string (readme, showcase, docs, portfolio)
 *   - style: string (minimal, detailed, interactive)
 */
app.post('/api/repos/:owner/:repo/ai/customize-pages', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const repoData = await repoService.getRepoDetails(owner, repo);
        
        const suggestions = await aiService.customizePagesWithAI(
            repoData,
            req.body.pageType,
            req.body.style
        );
        
        res.json({ success: true, data: suggestions });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * POST /api/repos/:owner/:repo/ai/generate-config - Generate optimal configuration via AI
 */
app.post('/api/repos/:owner/:repo/ai/generate-config', async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const repoData = await repoService.getRepoDetails(owner, repo);
        
        const config = await aiService.generateOptimalConfig(
            repoData,
            req.body.preferences || {}
        );
        
        res.json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
    console.log(`\n🧠 Org Brain API Server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api/docs\n`);
});

module.exports = app;
