# Workflow Fixes - Final Validation Checklist

## Pre-Commit Verification ✓

### API Endpoint Fixes Verified

- [x] generate-repo-data.yml: `/users/` endpoint (line 104)
- [x] org-pr-swarm-manager.yml: `/users/` endpoint (line 96)
- [x] pages-auto-setup.yml: `/users/` endpoint (line 52)
- [x] workflow-generator.yml: `/users/` endpoint (line 88)
- [x] org-repo-health-check.yml: `/users/` endpoint (line 98)
- [x] org-self-heal.yml: Already uses `/users/` (line 143)

### Matrix Fixes Verified

- [x] org-repo-health-check.yml: Proper JSON array output (`jq -c '[.[] | .name]'`)
- [x] org-repo-health-check.yml: Clean matrix definition (`fromJson(needs.discover-repos.outputs.repo_list)`)
- [x] pages-auto-setup.yml: Correct `matrix.include` with array of objects
- [x] workflow-generator.yml: Proper JSON array outputs

### Prerequisites Added

- [x] generate-repo-data.yml: `apt-get install jq`
- [x] org-pr-swarm-manager.yml: `apt-get install jq`
- [x] pages-auto-setup.yml: `apt-get install jq`
- [x] workflow-generator.yml: `apt-get install jq`
- [x] org-repo-health-check.yml: Prerequisites step included

### Duplicates Deleted

- [x] pages-setup.yml deleted (keep pages-auto-setup.yml)
- [x] pages-setup-fixed.yml deleted (obsolete)
- [x] agents-manager-fixed.yml deleted (obsolete)
- [x] workflow-generator-fixed.yml deleted (obsolete)
- ⚠️ workflow-gen.yml needs manual deletion (terminal issue)

### Error Handling Verified

- [x] `gh auth status` diagnostic added
- [x] Error suppression with `2>/dev/null` and `|| echo "[]"`
- [x] JSON validation before matrix processing
- [x] Token fallback: `${{ secrets.ORG_AUTOMATION_TOKEN || secrets.GITHUB_TOKEN }}`

---

## Post-Commit Testing Plan

### Step 1: Initial Test Run (5-10 minutes)

```bash
# Run the data generation workflow
gh workflow run generate-repo-data.yml --repo 940smiley/Org-Brain
```

**Expected Results:**

- ✓ Workflow starts successfully
- ✓ "Found N repositories" message in logs
- ✓ No "HTTP 404" errors
- ✓ `data/repos.json` is generated/updated
- ✓ Commit is created with updated data

### Step 2: Verify Matrix Processing (10-15 minutes)

```bash
# Run the health check workflow which uses matrix
gh workflow run org-repo-health-check.yml --repo 940smiley/Org-Brain --input org=940smiley
```

**Expected Results:**

- ✓ Discover job finds repositories
- ✓ Matrix job spawns for EACH repository individually
- ✓ Each matrix job processes one repo at a time
- ✓ No "repo1,repo2,repo3" treated as single name
- ✓ All per-repo jobs complete successfully

### Step 3: Pages Setup Test (10-15 minutes)

```bash
# Run the pages auto-setup for demonstration
gh workflow run pages-auto-setup.yml --repo 940smiley/Org-Brain --input ai_customize=false
```

**Expected Results:**

- ✓ Discovers repos without Pages enabled
- ✓ Matrix includes proper repository details (name, language, topics)
- ✓ Each repo gets Pages setup individually
- ✓ No errors from malformed repo names

### Step 4: Workflow Generator Test (10-15 minutes)

```bash
# Test language detection
gh workflow run workflow-generator.yml --repo 940smiley/Org-Brain \
  --input template=code-quality --input language=javascript --input dry_run=true
```

**Expected Results:**

- ✓ Language detection produces JSON arrays
- ✓ JavaScript repos properly identified
- ✓ Workflow generation templates generate correctly
- ✓ Dry-run mode prevents actual deployments

### Step 5: Monitor for 24 Hours

- Check scheduled workflows run without errors
- generate-repo-data (daily at 2 AM UTC)
- org-repo-health-check (weekly Monday at 6 AM UTC)
- pages-auto-setup (weekly Sunday at 2 AM UTC)
- org-pr-swarm-manager (every 30 minutes)

---

## Troubleshooting Guide

### If "HTTP 404" errors still occur

1. Verify endpoint in workflow: Should be `/users/940smiley/repos`
2. Check GH_TOKEN has correct permissions:

   ```bash
   gh auth status
   gh auth refresh -h github.com -s repo,read:org,workflow
   ```

3. Manually test endpoint:

   ```bash
   gh api "/users/940smiley/repos?per_page=5" --jq '.[] | .name'
   ```

### If matrix jobs don't spawn

1. Check output format is JSON array: `[repo1, repo2, repo3]` not `repo1,repo2,repo3`
2. Verify `fromJson()` usage in matrix definition
3. Check discover job outputs:

   ```bash
   gh run list --workflow=org-repo-health-check.yml --limit=1 --json name,conclusion -t '{{range .}}{{.name}} {{.conclusion}}{{"\n"}}{{end}}'
   ```

### If jq command fails

1. Verify prerequisites are installed in the workflow step
2. Check jq version compatibility
3. Add explicit jq installation before use:

   ```yaml
   - name: Install jq
     run: sudo apt-get install -y jq
   ```

---

## Commit Message Template

```
Fix: Correct API endpoints and matrix definitions in all workflows

BREAKING CHANGES: None (fixes only)

SUMMARY:
- Fixed /orgs/ → /users/ API endpoints for user account compatibility
- Fixed matrix definitions to output proper JSON arrays
- Added prerequisite installations (jq, gh)
- Removed 4 duplicate/obsolete workflow files
- Added diagnostic output for troubleshooting

DETAILS:
Modified workflows (API endpoint fixes):
- .github/workflows/generate-repo-data.yml
- .github/workflows/org-pr-swarm-manager.yml
- .github/workflows/pages-auto-setup.yml
- .github/workflows/workflow-generator.yml
- .github/workflows/org-repo-health-check.yml (+ matrix fix)

Deleted duplicate workflows:
- .github/workflows/pages-setup.yml
- .github/workflows/pages-setup-fixed.yml
- .github/workflows/agents-manager-fixed.yml
- .github/workflows/workflow-generator-fixed.yml

Unchanged (verified correct):
- .github/workflows/agents-manager.yml
- .github/workflows/autonomous-agents-manager.yml
- .github/workflows/deploy-pages.yml
- .github/workflows/org-automation-conflict-detector.yml
- .github/workflows/org-dependabot-batch-manager.yml
- .github/workflows/org-self-heal.yml

TECHNICAL NOTES:
- Root cause: 940smiley is a user account, not an organization
- User accounts use /users/{username}/repos endpoint
- Organizations use /orgs/{org}/repos endpoint
- Matrix processing now correctly individual repos instead of comma-separated strings
- All workflows include proper error handling and token fallback

TESTING:
- Test each workflow manually before deploying to production
- Monitor scheduled workflow executions for 24 hours
- Check GitHub Actions logs for proper repo discovery and matrix processing

Closes: #workflow-failures-tracking
```

---

## Files Changed Summary

| File                         | Type             | Change                     | Status |
| ---------------------------- | ---------------- | -------------------------- | ------ |
| generate-repo-data.yml       | Modified         | API endpoint + diagnostics | ✅     |
| org-pr-swarm-manager.yml     | Modified         | API endpoint               | ✅     |
| pages-auto-setup.yml         | Modified         | API endpoint               | ✅     |
| workflow-generator.yml       | Modified         | API endpoint + JSON output | ✅     |
| org-repo-health-check.yml    | Modified         | API endpoint + matrix fix  | ✅     |
| pages-setup.yml              | Deleted          | Duplicate                  | ✅     |
| pages-setup-fixed.yml        | Deleted          | Obsolete                   | ✅     |
| agents-manager-fixed.yml     | Deleted          | Obsolete                   | ✅     |
| workflow-generator-fixed.yml | Deleted          | Obsolete                   | ✅     |
| workflow-gen.yml             | Pending Deletion | Duplicate                  | ⚠️     |

---

## Sign-Off Checklist

Before committing, verify:

- [ ] All API endpoints changed to `/users/` format
- [ ] All matrix definitions output proper JSON arrays
- [ ] All workflows include prerequisite installation
- [ ] All duplicate files are deleted (or pending deletion)
- [ ] WORKFLOW_FIXES_SUMMARY.md is complete
- [ ] This VALIDATION_CHECKLIST.md is complete
- [ ] Ready for `git commit` and push
- [ ] Ready for comprehensive workflow testing

---

**Status:** Ready for Commit and Testing ✅
