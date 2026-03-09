/**
 * =============================================================================
 * PAGES API ROUTES
 * =============================================================================
 * Endpoints for managing GitHub Pages across repositories
 */

const express = require('express');
const PagesService = require('../services/pages-service');
const router = express.Router();

const githubToken = process.env.GITHUB_TOKEN;
const orgName = process.env.ORG_NAME;
const pagesService = new PagesService(githubToken, orgName);

/**
 * POST /api/pages/enable
 * Enable Pages for a repository
 */
router.post('/enable', async (req, res) => {
  try {
    const { repo, source = 'gh-pages', theme = 'minimal', customDomain } = req.body;

    if (!repo) {
      return res.status(400).json({ error: 'Repository name required' });
    }

    const result = await pagesService.enablePages(repo, {
      source,
      theme,
      customDomain
    });

    res.json({
      success: true,
      message: `Pages enabled for ${repo}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to enable Pages',
      message: error.message
    });
  }
});

/**
 * POST /api/pages/deploy-template
 * Deploy a Pages template to repository
 */
router.post('/deploy-template', async (req, res) => {
  try {
    const { repo, template, content = {} } = req.body;

    if (!repo || !template) {
      return res.status(400).json({ error: 'Repository and template required' });
    }

    const result = await pagesService.deployTemplate(repo, template, content || {});

    res.json({
      success: true,
      message: `Template ${template} deployed to ${repo}`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to deploy template',
      message: error.message
    });
  }
});

/**
 * GET /api/pages/config/:repo
 * Get Pages configuration for repository
 */
router.get('/config/:repo', async (req, res) => {
  try {
    const { repo } = req.params;
    const config = await pagesService.getPagesConfig(repo);

    res.json({
      success: true,
      repo,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get Pages config',
      message: error.message
    });
  }
});

/**
 * GET /api/pages/list
 * List all repositories with Pages enabled
 */
router.get('/list', async (req, res) => {
  try {
    const repos = await pagesService.listRepositoriesWithPages();

    res.json({
      success: true,
      count: repos.length,
      data: repos
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list Pages repositories',
      message: error.message
    });
  }
});

/**
 * PATCH /api/pages/config/:repo
 * Update Pages configuration
 */
router.patch('/config/:repo', async (req, res) => {
  try {
    const { repo } = req.params;
    const { customDomain } = req.body;

    if (customDomain) {
      await pagesService.setCustomDomain(repo, customDomain);
    }

    res.json({
      success: true,
      message: `Pages configuration updated for ${repo}`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update Pages config',
      message: error.message
    });
  }
});

module.exports = router;
