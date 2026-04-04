/**
 * =============================================================================
 * PAGES SERVICE
 * =============================================================================
 * Manages GitHub Pages setup, configuration, and customization across repos
 */

const axios = require('axios');

class PagesService {
  constructor(token, org) {
    this.token = token;
    this.org = org;
    this.api = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }

  /**
   * Enable GitHub Pages for a repository
   * @param {string} repo - Repository name
   * @param {object} options - Configuration options
   * @returns {Promise<object>} Pages configuration
   */
  async enablePages(repo, options = {}) {
    const {
      source = 'gh-pages',
      theme = 'minimal',
      customDomain = null
    } = options;

    try {
      console.log(`📄 Enabling Pages for ${this.org}/${repo}`);

      // Create gh-pages branch if it doesn't exist
      await this.ensureGhPagesBranch(repo);

      // Configure Pages settings
      const pagesConfig = {
        source: {
          branch: source
        }
      };

      if (theme) {
        pagesConfig.source.path = '/';
      }

      const response = await this.api.post(
        `/repos/${this.org}/${repo}/pages`,
        pagesConfig
      );

      if (customDomain) {
        await this.setCustomDomain(repo, customDomain);
      }

      return {
        success: true,
        repo,
        pagesUrl: response.data.html_url,
        source: response.data.source,
        customDomain
      };
    } catch (error) {
      console.error(`❌ Failed to enable Pages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ensure gh-pages branch exists
   * @param {string} repo - Repository name
   */
  async ensureGhPagesBranch(repo) {
    try {
      // Check if gh-pages branch exists
      await this.api.get(`/repos/${this.org}/${repo}/branches/gh-pages`);
      console.log(`✓ Branch 'gh-pages' exists`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`Creating branch 'gh-pages'...`);
        // Get the default branch's latest commit
        const repoInfo = await this.api.get(`/repos/${this.org}/${repo}`);
        const defaultBranch = repoInfo.data.default_branch;

        const branchInfo = await this.api.get(
          `/repos/${this.org}/${repo}/branches/${defaultBranch}`
        );

        // Create gh-pages branch
        await this.api.post(`/repos/${this.org}/${repo}/git/refs`, {
          ref: 'refs/heads/gh-pages',
          sha: branchInfo.data.commit.sha
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Set custom domain for Pages
   * @param {string} repo - Repository name
   * @param {string} domain - Custom domain
   */
  async setCustomDomain(repo, domain) {
    try {
      console.log(`🔗 Setting custom domain: ${domain}`);
      await this.api.patch(`/repos/${this.org}/${repo}/pages`, {
        cname: domain
      });
    } catch (error) {
      console.error(`⚠️ Failed to set custom domain: ${error.message}`);
    }
  }

  /**
   * Deploy template to Pages
   * @param {string} repo - Repository name
   * @param {string} template - Template name
   * @param {object} content - Template content/files
   */
  async deployTemplate(repo, template, content) {
    try {
      console.log(`📂 Deploying template '${template}' to ${repo}`);

      // Get file tree and create commits for each file
      const commits = [];
      for (const [path, fileContent] of Object.entries(content)) {
        if (typeof fileContent === 'string') {
          const commit = await this.createOrUpdateFile(
            repo,
            path,
            fileContent,
            `docs: deploy ${template} template`
          );
          commits.push(commit);
        }
      }

      return {
        success: true,
        repo,
        template,
        filesDeployed: commits.length
      };
    } catch (error) {
      console.error(`❌ Failed to deploy template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a file in repository
   * @param {string} repo - Repository name
   * @param {string} path - File path
   * @param {string} content - File content
   * @param {string} message - Commit message
   */
  async createOrUpdateFile(repo, path, content, message) {
    try {
      // Try to get existing file
      let sha = undefined;
      try {
        const existing = await this.api.get(
          `/repos/${this.org}/${repo}/contents/${path}`
        );
        sha = existing.data.sha;
      } catch (error) {
        if (error.response?.status !== 404) {
          throw error;
        }
      }

      const response = await this.api.put(
        `/repos/${this.org}/${repo}/contents/${path}`,
        {
          message,
          content: Buffer.from(content).toString('base64'),
          ...(sha && { sha })
        }
      );

      return {
        path,
        commit: response.data.commit.sha,
        url: response.data.content.html_url
      };
    } catch (error) {
      console.error(`❌ Failed to create/update file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Pages configuration for repository
   * @param {string} repo - Repository name
   */
  async getPagesConfig(repo) {
    try {
      const response = await this.api.get(
        `/repos/${this.org}/${repo}/pages`
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { enabled: false };
      }
      throw error;
    }
  }

  /**
   * List repositories with Pages enabled
   */
  async listRepositoriesWithPages() {
    try {
      const repos = await this.api.get(`/orgs/${this.org}/repos`);
      const pagesRepos = [];

      for (const repo of repos.data) {
        const pagesConfig = await this.getPagesConfig(repo.name);
        if (pagesConfig.enabled) {
          pagesRepos.push({
            name: repo.name,
            url: pagesConfig.html_url,
            source: pagesConfig.source
          });
        }
      }

      return pagesRepos;
    } catch (error) {
      console.error(`❌ Failed to list Pages repositories: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PagesService;

