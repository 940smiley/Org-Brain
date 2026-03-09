# Workflow Fixes - Quick Start Guide

## Status: ✅ All Fixes Applied and Ready

All GitHub Actions workflows have been corrected and duplicates removed. The following document provides step-by-step instructions to commit and test the changes.

---

## Step 1: Commit the Fixed Workflows

### Commands to Run:

```bash
cd /workspaces/Org-Brain

# Stage all modified and deleted workflow files
git add .github/workflows/

# Verify what will be committed
git status
git diff --cached .github/workflows/

# Commit with comprehensive message
git commit -m "fix: Correct API endpoints and matrix definitions in all workflows

- Change /orgs/ to /users/ endpoints for user account 940smiley
- Fix matrix JSON output to proper arrays (not comma-separated strings)
- Add prerequisite installations (jq, gh) to all workflows
- Remove 4 duplicate and obsolete workflow files
- Add diagnostic output for better troubleshooting

Modified workflows:
- generate-repo-data.yml: API endpoint + diagnostics
- org-pr-swarm-manager.yml: API endpoint
- pages-auto-setup.yml: API endpoint
- workflow-generator.yml: API endpoint + JSON output
- org-repo-health-check.yml: API endpoint + matrix parsing fix

Deleted duplicates:
- pages-setup.yml (consolidated into pages-auto-setup.yml)
- pages-setup-fixed.yml
- agents-manager-fixed.yml
- workflow-generator-fixed.yml

Fixes:
- User account endpoints: /users/940smiley/repos (not /orgs/940smiley/repos)
- Matrix definitions now use proper JSON arrays via fromJson()
- All workflows include gh auth status for diagnostics
- Error handling with fallback values"

# Push the commit
git push origin master
```

---

## Step 2: Verify Fixes in GitHub Actions UI

### View Workflow Runs:

1. Go to repository: https://github.com/940smiley/Org-Brain/actions
2. Check each workflow's recent runs:
   - ✅ No 404 errors in logs
   - ✅ "Found N repositories" messages
   - ✅ Proper repo discovery output
   - ✅ Matrix jobs spawn individually per repo

---

## Step 3: Manual Testing (5-15 min per workflow)

### Test 1: **Generate Repo Data** (5-10 minutes)

```bash
# Trigger the workflow
gh workflow run generate-repo-data.yml \
  --repo 940smiley/Org-Brain \
  --input org=940smiley

# Monitor in real-time
gh run list --workflow=generate-repo-data.yml --limit=1 --watch
```

**Check for:**

- ✓ No "HTTP 404" errors
- ✓ Echo: "🔍 Fetching repositories for: 940smiley"
- ✓ Count of repositories found (should be > 0)
- ✓ `data/repos.json` committed with updates

---

### Test 2: **Org PR Swarm Manager** (5-10 minutes)

```bash
# This workflow runs automatically every 30 minutes
# Or trigger manually:
gh workflow run org-pr-swarm-manager.yml \
  --repo 940smiley/Org-Brain \
  --input org=940smiley \
  --input dry_run=true

# Monitor
gh run list --workflow=org-pr-swarm-manager.yml --limit=1 --watch
```

**Check for:**

- ✓ Repository discovery succeeds
- ✓ Shows list of active repos found
- ✓ No API endpoint errors

---

### Test 3: **Pages Auto-Setup** (5-10 minutes)

```bash
# Trigger the workflow
gh workflow run pages-auto-setup.yml \
  --repo 940smiley/Org-Brain \
  --input ai_customize=false

# Monitor
gh run list --workflow=pages-auto-setup.yml --limit=1 --watch
```

**Check for:**

- ✓ Repository discovery finds repos without Pages
- ✓ Matrix jobs spawn individually for each repo
- ✓ Each repo processes separately (not as comma-separated string)
- ✓ Pages setup completes for each matching repo

---

### Test 4: **Repo Health Check** (15-20 minutes - longer due to matrix)

```bash
# This is the most complex workflow (uses matrix heavily)
gh workflow run org-repo-health-check.yml \
  --repo 940smiley/Org-Brain \
  --input org=940smiley \
  --input include_archived=false

# Monitor
gh run list --workflow=org-repo-health-check.yml --limit=1 --watch
```

**Check for:**

- ✓ Discovery job finds repos and outputs JSON array
- ✓ Collect-Metrics spawns individual jobs for EACH repo
- ✓ No "collect-metrics: repo1,repo2,repo3" (which would fail)
- ✓ All matrix jobs complete with proper per-repo metrics

Check the workflow output:

```bash
# Get the latest run details
gh run list --workflow=org-repo-health-check.yml --limit=1 --json status,name,conclusion

# View specific job logs
gh run view <run-id> --log
```

---

### Test 5: **Workflow Generator** (5-10 minutes)

```bash
# Test language detection
gh workflow run workflow-generator.yml \
  --repo 940smiley/Org-Brain \
  --input template=code-quality \
  --input language=javascript \
  --input dry_run=true

# Monitor
gh run list --workflow=workflow-generator.yml --limit=1 --watch
```

**Check for:**

- ✓ Language detection produces proper JSON arrays
- ✓ JavaScript/Python/Go repos properly categorized
- ✓ Dry-run mode prevents actual deployments

---

## Step 4: Schedule Monitoring (24 hours)

### Automated Workflow Schedules:

```yaml
generate-repo-data: Daily at 2:00 AM UTC
org-repo-health-check: Weekly Monday at 6:00 AM UTC
pages-auto-setup: Weekly Sunday at 2:00 AM UTC
org-pr-swarm-manager: Every 30 minutes
org-self-heal: Daily at 3:00 AM UTC
```

### Monitor Command:

```bash
# Check if all scheduled workflows completed successfully in the last 24 hours
gh run list --repo 940smiley/Org-Brain --limit=50 \
  --json status,name,conclusion,createdAt \
  --jq '.[] | select(.createdAt > (now - 86400)) |
  {name, status, conclusion, createdAt}'
```

---

## Step 5: Verify API Endpoint Fix

### Manual API Test (without workflow):

```bash
# This is what the workflows now use - should return repos
gh api "/users/940smiley/repos?per_page=5" \
  --jq '.[] | {name, language, archived}'

# Expected output:
# {
#   "name": "repo-name",
#   "language": "language-name",
#   "archived": false
# }

# Compare with the OLD (incorrect) endpoint - should return 404:
gh api "/orgs/940smiley/repos?per_page=5" 2>&1 | grep -i "404\|not found" || echo "Endpoint check complete"
```

---

## Troubleshooting Matrix Issues

### If Matrix Jobs Don't Spawn:

1. **Check discover job output is proper JSON:**

   ```bash
   # In workflow logs, look for output like:
   # repo_list=["repo1","repo2","repo3"]
   # NOT: repo_list=repo1,repo2,repo3
   ```

2. **Verify fromJson() is receiving array:**

   ```yaml
   # Correct:
   matrix:
     repo: ${{ fromJson(needs.discover.outputs.repo_list) }}

   # Incorrect would be:
   matrix:
     repo: ${{ fromJson(needs.discover.outputs.repo_list_as_string) }}
   ```

3. **Check jq is installed:**
   ```bash
   # If workflow fails on jq command, verify prerequisite step runs:
   sudo apt-get install -y jq
   which jq
   jq --version
   ```

---

## Success Criteria

All workflows are working correctly when:

| Workflow              | Success Indicator                           |
| --------------------- | ------------------------------------------- |
| generate-repo-data    | ✓ `data/repos.json` updated with 950+ repos |
| org-pr-swarm-manager  | ✓ Finds and processes PRs across repos      |
| pages-auto-setup      | ✓ Enables Pages for repos without it        |
| org-repo-health-check | ✓ Matrix spawns individual jobs per repo    |
| workflow-generator    | ✓ Detects language categories correctly     |

---

## Next Steps After Verification

1. **If all tests pass:** ✅ Workflows are production-ready
2. **If any test fails:**
   - Check error message in GitHub Actions log
   - Verify the specific workflow YAML syntax
   - Re-check the API endpoint being used
   - Contact support with workflow run URL

3. **Long-term monitoring:**
   - Set up Slack/email notifications for workflow failures
   - Monitor workflow execution times for performance
   - Review health-check reports weekly
   - Update workflows if API changes occur

---

## Files Changed

### Modified Files (5):

- `.github/workflows/generate-repo-data.yml`
- `.github/workflows/org-pr-swarm-manager.yml`
- `.github/workflows/pages-auto-setup.yml`
- `.github/workflows/workflow-generator.yml`
- `.github/workflows/org-repo-health-check.yml`

### Deleted Files (4):

- `.github/workflows/pages-setup.yml`
- `.github/workflows/pages-setup-fixed.yml`
- `.github/workflows/agents-manager-fixed.yml`
- `.github/workflows/workflow-generator-fixed.yml`

### Documentation Added (2):

- `WORKFLOW_FIXES_SUMMARY.md` - Detailed technical summary
- `VALIDATION_CHECKLIST.md` - Testing and verification checklist
- `WORKFLOW_FIXES_QUICKSTART.md` - This file

---

## Support & References

- GitHub Actions Documentation: https://docs.github.com/en/actions
- GitHub CLI Reference: https://cli.github.com/manual
- User vs Organization Repositories: https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repositories-for-a-user
- Matrix Workflows: https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs

---

**Last Updated:** March 9, 2026  
**Status:** ✅ Ready for Testing and Deployment
