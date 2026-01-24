# GitHub Adapter Guide

This guide explains how to set up and use the GitHub adapter for the work CLI, enabling you to manage GitHub Issues through the same unified interface as other backends.

## Prerequisites

- GitHub account with access to a repository
- GitHub Personal Access Token with appropriate permissions
- work CLI installed and configured

## GitHub Token Setup

### Creating a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give your token a descriptive name (e.g., "work-cli-access")
4. Set expiration as needed
5. Select scopes:
   - For public repositories: `public_repo`
   - For private repositories: `repo` (full repository access)
6. Click "Generate token"
7. **Important**: Copy the token immediately - you won't be able to see it again

### Token Security Best Practices

- Never commit tokens to version control
- Use environment variables or secure credential storage
- Set appropriate expiration dates
- Use minimal required scopes
- Rotate tokens regularly

## Context Configuration

### Adding a GitHub Context

```bash
# Add a GitHub context for your repository
work context add my-github-project \
  --adapter github \
  --url https://github.com/owner/repository
```

### Authentication Methods

#### Method 1: Environment Variable (Recommended)

```bash
# Set the token in your environment
export GITHUB_TOKEN=ghp_your_token_here

# Or for GitHub Actions (use CI_GITHUB_TOKEN to avoid conflicts)
export CI_GITHUB_TOKEN=ghp_your_token_here
```

#### Method 2: Context Credentials

```bash
# Authenticate with the context
work auth login my-github-project --token ghp_your_token_here
```

### Switching Contexts

```bash
# Use the GitHub context
work context use my-github-project

# Switch back to local filesystem
work context use local-project

# List all contexts
work context list
```

## Basic Usage

Once configured, the GitHub adapter provides the same commands as other backends:

### Creating Issues

```bash
# Create a new issue
work create "Fix login bug" --kind task --labels bug,high-priority

# Create with description
work create "Add user dashboard" \
  --kind feature \
  --description "Implement a user dashboard with analytics" \
  --labels feature,ui
```

### Listing Issues

```bash
# List all issues
work list

# Filter issues
work list --query "bug"
work list --state open
work list --labels high-priority
```

### Managing Issues

```bash
# Get issue details
work show ISSUE-123

# Update issue
work edit ISSUE-123 --title "Updated title" --labels bug,critical

# Change issue state
work start ISSUE-123  # Opens the issue
work close ISSUE-123  # Closes the issue

# Delete (close) issue
work delete ISSUE-123
```

## Context Switching Workflow

The power of the work CLI is seamless context switching:

```bash
# Work on local tasks
work context use local-project
work create "Review code" --kind task
work list

# Switch to GitHub issues
work context use github-project  
work create "Fix API endpoint" --kind bug
work list

# Same commands, different backends!
```

## GitHub-Specific Behavior

### Issue Mapping

| GitHub Issue | WorkItem |
|--------------|----------|
| Issue number | `id` |
| Title | `title` |
| Body | `description` |
| State (open/closed) | `state` (new/closed) |
| Labels | `labels` |
| Assignee | `assignee` |
| Created/Updated dates | `createdAt`/`updatedAt` |

### State Mapping

| WorkItem State | GitHub State |
|----------------|--------------|
| `new` | `open` |
| `active` | `open` |
| `closed` | `closed` |

### Limitations

- **Relations**: GitHub doesn't support custom relations natively
- **Kinds**: All GitHub issues are mapped to `task` kind
- **Priority**: Not directly supported (can use labels)
- **Delete**: Issues cannot be deleted, only closed

## Advanced Configuration

### Multiple Repositories

```bash
# Add multiple GitHub contexts
work context add frontend-repo \
  --adapter github \
  --url https://github.com/company/frontend

work context add backend-repo \
  --adapter github \
  --url https://github.com/company/backend

# Switch between them
work context use frontend-repo
work context use backend-repo
```

### CI/CD Integration

For GitHub Actions or other CI environments:

```yaml
# .github/workflows/work-cli.yml
name: Work CLI Integration
on: [push, pull_request]

jobs:
  sync-issues:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install work CLI
        run: npm install -g work-cli
      - name: Configure GitHub context
        run: |
          work context add ci-context \
            --adapter github \
            --url https://github.com/${{ github.repository }}
        env:
          CI_GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: List issues
        run: work context use ci-context && work list
```

## Troubleshooting

### Authentication Issues

```bash
# Check authentication status
work auth status

# Test token validity
work context use github-project
work list  # Should work if token is valid
```

**Common Issues:**
- Token expired: Generate a new token
- Insufficient permissions: Ensure `repo` or `public_repo` scope
- Wrong repository URL: Verify the URL format

### Rate Limiting

GitHub API has rate limits (5000 requests/hour for authenticated users). The adapter includes automatic retry with exponential backoff.

**If you hit rate limits:**
- Wait for the limit to reset
- Reduce frequency of operations
- Use pagination for large result sets

### Repository Access

```bash
# Verify repository access
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/owner/repository
```

**Common Issues:**
- Repository doesn't exist
- Token doesn't have access to private repository
- Repository name misspelled in URL

### Token Format Validation

Tokens must match GitHub's format:
- Start with `ghp_`, `gho_`, or `ghs_`
- Followed by at least 36 alphanumeric characters

**Invalid token error:**
```
GitHub authentication error: Invalid token format in credentials
```

## Examples

### Daily Workflow

```bash
# Morning: Check GitHub issues
work context use github-project
work list --state open

# Create issue for bug found
work create "Fix header alignment" --labels bug,css

# Work on local tasks
work context use local-project
work create "Update documentation" --kind task

# Afternoon: Update GitHub issue
work context use github-project
work start ISSUE-456  # Start working on it
work close ISSUE-456  # Complete and close
```

### Team Collaboration

```bash
# Team lead creates issues
work context use team-repo
work create "Implement user authentication" --labels feature,backend
work create "Design login page" --labels feature,frontend

# Developers pick up issues
work list --labels backend
work start ISSUE-789

# Update and close when done
work close ISSUE-789
```

## Schema Information

```bash
# Get GitHub adapter schema
work schema show

# Available kinds
work schema kinds  # Returns: [task]

# Available attributes
work schema attributes
# Returns: title, description, labels, assignee

# Relation types (empty for GitHub)
work schema relations  # Returns: []
```

## Migration from Other Tools

### From GitHub CLI

```bash
# Instead of: gh issue create --title "Bug fix" --body "Description"
work create "Bug fix" --description "Description"

# Instead of: gh issue list --state open
work list --state open

# Instead of: gh issue close 123
work close 123
```

### From Local Filesystem

```bash
# Export local work items (if needed)
work context use local-project
work list --format json > local-items.json

# Import concepts to GitHub (manual process)
work context use github-project
# Create issues based on local items
```

## Support

For issues with the GitHub adapter:

1. Check authentication and permissions
2. Verify repository URL format
3. Test with GitHub API directly
4. Check rate limiting status
5. Review token scopes and expiration

The GitHub adapter follows the same patterns as other work CLI adapters, so general work CLI documentation also applies.
