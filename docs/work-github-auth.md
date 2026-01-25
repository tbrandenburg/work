# GitHub Authentication Guide

This guide explains the enhanced GitHub authentication system in work CLI, which provides a three-tier hierarchy for seamless integration with your existing GitHub workflow.

## Authentication Hierarchy

The work CLI uses a three-tier authentication hierarchy that prioritizes convenience and security:

1. **GitHub CLI (Recommended)** - Uses your existing `gh auth login` credentials
2. **Manual Credentials** - Explicit token management via context configuration
3. **Environment Variables** - Fallback for CI/CD and legacy workflows

## Quick Start

### Option 1: GitHub CLI (Recommended)

If you already use GitHub CLI, work CLI will automatically use your existing authentication:

```bash
# Authenticate with GitHub CLI (if not already done)
gh auth login

# Add a GitHub context - no token needed!
work context add my-project --tool github --url https://github.com/owner/repo

# Start working immediately
work list
```

### Option 2: Manual Token

For explicit token management:

```bash
# Create context with token
work context add my-project \
  --tool github \
  --url https://github.com/owner/repo \
  --token ghp_your_token_here
```

### Option 3: Environment Variable

For CI/CD or when other methods aren't available:

```bash
# Set environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Add context
work context add my-project --tool github --url https://github.com/owner/repo
```

## Detailed Setup

### GitHub CLI Authentication

The GitHub CLI provides the most secure and convenient authentication method:

```bash
# Install GitHub CLI (if not already installed)
# macOS: brew install gh
# Ubuntu: sudo apt install gh
# Windows: winget install GitHub.cli

# Authenticate with GitHub
gh auth login

# Verify authentication
gh auth status

# work CLI will automatically use these credentials
work context add my-project --tool github --url https://github.com/owner/repo
```

**Benefits:**
- No manual token management
- Automatic token rotation
- Secure credential storage
- Works with 2FA and SSO

### Personal Access Token Setup

If you prefer manual token management or GitHub CLI isn't available:

1. **Create Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Name: "work-cli-access"
   - Scopes needed:
     - `repo` (for private repositories)
     - `public_repo` (for public repositories only)
   - Click "Generate token"

2. **Use Token**:
   ```bash
   # Method A: Via context creation
   work context add my-project \
     --tool github \
     --url https://github.com/owner/repo \
     --token ghp_your_token_here

   # Method B: Via environment variable
   export GITHUB_TOKEN=ghp_your_token_here
   work context add my-project --tool github --url https://github.com/owner/repo
   ```

## Authentication Priority

The work CLI checks authentication sources in this order:

1. **GitHub CLI**: `gh auth token` command
2. **Manual Credentials**: Token provided during context creation
3. **Environment Variables**: `GITHUB_TOKEN` or `CI_GITHUB_TOKEN`

If a higher-priority method is available, it will be used automatically.

## Troubleshooting

### "No GitHub token found" Error

```
GitHub authentication error: No GitHub token found. Please authenticate using one of these methods:

1. GitHub CLI (recommended): gh auth login
2. Environment variable: export GITHUB_TOKEN=your_token
3. Manual credentials: work context add --tool github --token your_token

For help: https://docs.github.com/en/authentication
```

**Solutions:**
1. Run `gh auth login` and follow the prompts
2. Set `GITHUB_TOKEN` environment variable
3. Recreate context with `--token` parameter

### GitHub CLI Not Found

If you get errors about `gh` command not found:

```bash
# Install GitHub CLI
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows
winget install GitHub.cli

# Verify installation
gh --version
```

### Token Validation Errors

If you get "Invalid token format" errors:

- Ensure token starts with `ghp_`, `gho_`, or `ghs_`
- Verify token is at least 40 characters long
- Check for extra spaces or newlines
- Regenerate token if necessary

### Permission Errors

If you get 403 or permission errors:

- Verify token has correct scopes (`repo` or `public_repo`)
- Check repository access permissions
- Ensure token hasn't expired
- Verify repository URL is correct

## Security Best Practices

### Token Security

- **Never commit tokens to version control**
- Use GitHub CLI when possible (most secure)
- Set appropriate token expiration dates
- Use minimal required scopes
- Rotate tokens regularly

### Environment Variables

When using environment variables, the work CLI will display a warning:

```
Using GitHub token from environment variable. Consider using "gh auth login" for better security.
```

This encourages migration to the more secure GitHub CLI method.

## CI/CD Integration

For automated environments where GitHub CLI isn't available:

```bash
# In CI/CD pipeline
export GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}
work context add ci-context --tool github --url ${{ github.repository }}
work list --format json
```

## Migration Guide

### From Environment Variables to GitHub CLI

```bash
# Current setup (environment variable)
export GITHUB_TOKEN=ghp_your_token_here
work context add my-project --tool github --url https://github.com/owner/repo

# Migrate to GitHub CLI
unset GITHUB_TOKEN
gh auth login
# Context will automatically use GitHub CLI credentials
```

### From Manual Tokens to GitHub CLI

```bash
# Remove existing context
work context remove my-project

# Authenticate with GitHub CLI
gh auth login

# Recreate context (no token needed)
work context add my-project --tool github --url https://github.com/owner/repo
```

## Advanced Configuration

### Multiple GitHub Accounts

If you work with multiple GitHub accounts:

```bash
# Switch GitHub CLI account
gh auth switch

# Or use different tokens for different contexts
work context add work-project --tool github --token $WORK_GITHUB_TOKEN
work context add personal-project --tool github --token $PERSONAL_GITHUB_TOKEN
```

### Enterprise GitHub

For GitHub Enterprise Server:

```bash
# Authenticate with GitHub CLI for enterprise
gh auth login --hostname github.enterprise.com

# Add enterprise context
work context add enterprise-project \
  --tool github \
  --url https://github.enterprise.com/owner/repo
```

## Related Documentation

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [work CLI Context Management](work-user-journey-context-and-query.md)
- [GitHub Adapter Architecture](work-adapter-architecture.md)
