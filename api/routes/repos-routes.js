/**
 * =============================================================================
 * REPOSITORY MANAGEMENT API ROUTES
 * =============================================================================
 * Endpoints for managing repository configurations
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const configPath = path.join(__dirname, '../../config/repos-config.json');

/**
 * GET /api/repos/config
 * Get repository configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(config);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/repos/config
 * Update repository configuration
 */
router.post('/config', async (req, res) => {
  try {
    const config = await fs.readFile(configPath, 'utf8');
    let parsed = JSON.parse(config);

    parsed = { ...parsed, ...req.body };

    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2));

    res.json({
      success: true,
      message: 'Configuration updated',
      data: parsed
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error.message
    });
  }
});

/**
 * GET /api/repos/:repo/config
 * Get specific repository configuration
 */
router.get('/:repo/config', async (req, res) => {
  try {
    const { repo } = req.params;
    const config = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(config);

    const repoConfig = parsed.repositories[repo] || parsed.defaultRepoFeatures;

    res.json({
      success: true,
      repo,
      data: repoConfig
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get repository configuration',
      message: error.message
    });
  }
});

/**
 * PUT /api/repos/:repo/config
 * Set specific repository configuration
 */
router.put('/:repo/config', async (req, res) => {
  try {
    const { repo } = req.params;
    const config = await fs.readFile(configPath, 'utf8');
    let parsed = JSON.parse(config);

    if (!parsed.repositories) {
      parsed.repositories = {};
    }

    parsed.repositories[repo] = {
      ...parsed.repositories[repo],
      ...req.body
    };

    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2));

    res.json({
      success: true,
      message: `Configuration updated for ${repo}`,
      data: parsed.repositories[repo]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update repository configuration',
      message: error.message
    });
  }
});

/**
 * GET /api/repos/features/:feature
 * Get configurations by feature
 */
router.get('/features/:feature', async (req, res) => {
  try {
    const { feature } = req.params;
    const config = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(config);

    const reposWithFeature = Object.entries(parsed.repositories || {})
      .filter(([_, repoConfig]) => {
        return repoConfig[feature]?.enabled === true;
      })
      .map(([name]) => name);

    res.json({
      success: true,
      feature,
      count: reposWithFeature.length,
      repositories: reposWithFeature
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get feature configurations',
      message: error.message
    });
  }
});

module.exports = router;

