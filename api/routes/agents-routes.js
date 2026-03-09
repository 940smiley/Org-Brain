/**
 * =============================================================================
 * AGENTS API ROUTES
 * =============================================================================
 * Endpoints for managing autonomous agents
 */

const express = require('express');
const AgentService = require('../services/agent-service');
const router = express.Router();

const githubToken = process.env.GITHUB_TOKEN;
const orgName = process.env.ORG_NAME;
const agentService = new AgentService(githubToken, orgName);

/**
 * POST /api/agents/initialize
 * Initialize an agent for a repository
 */
router.post('/initialize', async (req, res) => {
  try {
    const { repo, type, config = {} } = req.body;

    if (!repo || !type) {
      return res.status(400).json({ error: 'Repository and agent type required' });
    }

    const agent = await agentService.initializeAgent(repo, type, config);

    res.json({
      success: true,
      message: `${type} agent initialized for ${repo}`,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to initialize agent',
      message: error.message
    });
  }
});

/**
 * POST /api/agents/:agentId/execute
 * Execute an agent action
 */
router.post('/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { action, params = {} } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action required' });
    }

    const execution = await agentService.executeAction(agentId, action, params);

    res.json({
      success: true,
      message: `Action ${action} executed`,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to execute action',
      message: error.message
    });
  }
});

/**
 * GET /api/agents/:agentId/status
 * Get status of an agent
 */
router.get('/:agentId/status', (req, res) => {
  try {
    const { agentId } = req.params;
    const status = agentService.getAgentStatus(agentId);

    if (!status) {
      return res.status(404).json({
        error: 'Agent not found',
        agentId
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get agent status',
      message: error.message
    });
  }
});

/**
 * GET /api/agents
 * List all agents (with optional repo filter)
 */
router.get('/', (req, res) => {
  try {
    const { repo } = req.query;
    const agents = agentService.listAgents(repo);

    res.json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list agents',
      message: error.message
    });
  }
});

/**
 * GET /api/agents/:agentId/executions
 * Get execution history for an agent
 */
router.get('/:agentId/executions', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentService.agents.get(agentId);

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
        agentId
      });
    }

    res.json({
      success: true,
      agentId,
      executionCount: agent.executions.length,
      data: agent.executions.slice(-10)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get executions',
      message: error.message
    });
  }
});

module.exports = router;
