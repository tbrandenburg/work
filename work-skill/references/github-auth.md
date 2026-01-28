# GitHub Authentication Guide

Complete guide for GitHub authentication in work CLI using the three-tier hierarchy.

## Authentication Hierarchy

work CLI uses a three-tier authentication system prioritizing convenience and security:

1. **GitHub CLI** (Highest priority, most secure)
2. **Manual Credentials** (Explicit token management)
3. **Environment Variables** (CI/CD and legacy workflows)

## Setup Methods

### Method 1: GitHub CLI (Recommended)

**Why this is best**: No manual token management, automatic rotation, secure credential storage, works with 2FA and SSO.

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Ubuntu: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate with GitHub
gh auth login  # Follow browser prompts

# Verify authentication
gh auth status

# work CLI automatically uses these credentials
work context add my-project --tool github --url https://github.com/owner/repo
work context set my-project
# No additional work auth steps needed!
```

### Method 2: Personal Access Token

For explicit token management or when GitHub CLI isn't available:

**Step 1: Create Token**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "work-cli-access"
4. Select scopes:
   - `repo` (for private repositories)
   - `public_repo` (for public repositories only)
5. Click "Generate token" and save the token

**Step 2: Use Token**

```bash
# Option A: Provide during context creation
work context add my-project \
  --tool github \
  --url https://github.com/owner/repo \
  --token ghp_your_token_here

# Option B: Environment variable
export GITHUB_TOKEN=ghp_your_token_here
work context add my-project --tool github --url https://github.com/owner/repo
```

### Method 3: Environment Variables

For CI/CD pipelines or automated environments:

```bash
# Set environment variable
export GITHUB_TOKEN=ghp_your_token_here
# or in CI/CD:
export GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}

# Create context (will automatically use env var)
work context add ci-context --tool github --url https://github.com/owner/repo
```

## Authentication Priority

work CLI checks sources in this exact order:

1. **GitHub CLI**: Runs `gh auth token` command
2. **Manual Credentials**: Token provided during `work context add --token`
3. **Environment Variables**: Checks `GITHUB_TOKEN` then `CI_GITHUB_TOKEN`

Higher-priority methods automatically override lower ones.

## Common Workflows

### Personal Development

```bash
# One-time setup
gh auth login

# Per-project setup (no tokens needed)
work context add personal-site --tool github --url https://github.com/me/personal-site
work context add work-project --tool github --url https://github.com/company/project

# Switch between projects seamlessly
work context set personal-site
work list where assignee=me

work context set work-project
work create "Fix critical bug" --kind bug --priority critical
```

### Team Development

```bash
# Team lead sets up shared context pattern
gh auth login  # Each team member does this

# Everyone uses same context setup
work context add team-backend --tool github --url https://github.com/team/backend-api
work context add team-frontend --tool github --url https://github.com/team/frontend-app

# Team coordination
work list where state=new order by priority desc
work notify target add team-slack --type telegram --bot-token TOKEN --chat-id CHAT
work notify send where priority=critical to team-slack
```

### CI/CD Pipeline

```bash
#!/bin/bash
# In GitHub Actions workflow

export GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}
work context add ci-context --tool github --url ${{ github.repository }}

# Create issues for build failures
if [ "$BUILD_STATUS" = "failed" ]; then
  work create "Build #$BUILD_NUMBER failed" --kind bug --priority high
  work notify send where title contains "Build #$BUILD_NUMBER" to alerts
fi

# Update work items based on commits
work list where state=active --format json | jq -r '.[] | select(.title | test("(?i)fix|close")) | .id' | \
while read id; do
  work close "$id" --comment "Closed via commit $GITHUB_SHA"
done
```

## Troubleshooting

### "No GitHub token found" Error

```
GitHub authentication error: No GitHub token found. Please authenticate using one of these methods:
1. GitHub CLI (recommended): gh auth login
2. Environment variable: export GITHUB_TOKEN=your_token
3. Manual credentials: work context add --tool github --token your_token
```

**Solutions in priority order:**

```bash
# Solution 1: Use GitHub CLI
gh auth login

# Solution 2: Environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Solution 3: Recreate context with token
work context remove problematic-context
work context add problematic-context --tool github --token ghp_your_token_here
```

### GitHub CLI Not Found

```bash
# Install GitHub CLI
# macOS
brew install gh

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh

# Windows
winget install GitHub.cli

# Verify installation
gh --version
```

### Token Validation Errors

```bash
# Check token format (should start with ghp_, gho_, or ghs_)
echo $GITHUB_TOKEN | cut -c1-4  # Should show ghp_ or similar

# Check token length (should be 40+ characters)
echo $GITHUB_TOKEN | wc -c

# Test token manually
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

### Permission Errors (403)

Common causes and fixes:

**Insufficient scopes:**

```bash
# Check current token scopes
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | jq -r '.plan'

# Recreate token with correct scopes:
# - repo (for private repos)
# - public_repo (for public repos)
```

**Repository access:**

```bash
# Verify repository URL format
work context show  # Check URL is correct

# Test repository access
gh repo view owner/repo  # Should show repo details
```

**Token expiration:**

```bash
# Check token status
gh auth status

# Refresh if needed
gh auth refresh
```

## Advanced Scenarios

### Multiple GitHub Accounts

```bash
# Switch GitHub CLI accounts
gh auth switch

# Or use different contexts with explicit tokens
work context add work-account --tool github --token $WORK_GITHUB_TOKEN
work context add personal-account --tool github --token $PERSONAL_GITHUB_TOKEN
```

### Enterprise GitHub

```bash
# Authenticate with GitHub Enterprise
gh auth login --hostname github.enterprise.com

# Add enterprise contexts
work context add enterprise-project \
  --tool github \
  --url https://github.enterprise.com/org/repo
```

### Migration Between Methods

**From Environment Variable to GitHub CLI:**

```bash
# Remove environment variable
unset GITHUB_TOKEN

# Authenticate with GitHub CLI
gh auth login

# Existing contexts automatically use new method
work auth status  # Should show GitHub CLI authentication
```

**From Manual Token to GitHub CLI:**

```bash
# Remove context with manual token
work context remove old-context

# Authenticate with GitHub CLI
gh auth login

# Recreate context (no --token needed)
work context add old-context --tool github --url https://github.com/owner/repo
```

## Security Best Practices

### Token Security

- **Never commit tokens to version control**
- Use GitHub CLI when possible (most secure)
- Set appropriate token expiration (recommend 90 days max)
- Use minimal required scopes
- Rotate tokens regularly
- Use repository secrets in CI/CD

### Environment Variables

When using environment variables, work CLI shows warning:

```
Using GitHub token from environment variable. Consider using "gh auth login" for better security.
```

### Team Security

```bash
# Team setup checklist
# 1. All members use GitHub CLI: gh auth login
# 2. Shared context patterns (no tokens in repos)
# 3. Use repository secrets for CI/CD
# 4. Regular token rotation policy
# 5. Audit token permissions quarterly
```

## Integration Examples

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Auto-create work items for TODOs
git diff --cached | grep "TODO" | while IFS= read -r line; do
  work create "TODO: $line" --kind task --priority low
done
```

### Build Integration

```bash
#!/bin/bash
# build-status.sh

if [ "$1" = "success" ]; then
  work create "Deploy build #$BUILD_NUMBER" --kind task --assignee devops
else
  work create "Build #$BUILD_NUMBER failed" --kind bug --priority critical
  work notify send where title contains "Build #$BUILD_NUMBER failed" to alerts
fi
```
