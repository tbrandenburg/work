# E2E and Integration Tests

This document describes the end-to-end (E2E) and integration testing strategy for the work CLI, particularly focusing on GitHub authentication and external service integration.

## Overview

The work CLI includes comprehensive testing at multiple levels:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test adapter interactions with real external APIs
- **E2E Tests**: Test complete workflows from CLI commands to external services

## GitHub Authentication Testing Strategy

### Two Authentication Scenarios

The GitHub integration tests cover two distinct authentication scenarios to ensure the three-tier authentication hierarchy works correctly:

#### 1. GitHub CLI Authentication (`gh auth login`)
- **Repository**: Uses current repository (`tbrandenburg/work`)
- **Authentication**: Relies on `gh auth login` credentials
- **Use Case**: Developers using GitHub CLI in their workflow
- **Test**: `should complete GitHub CLI auth workflow with current repository`

#### 2. Token-Based Authentication
- **Repository**: Uses external private repository (`tbrandenburg/playground`)
- **Authentication**: Uses `CI_GITHUB_TOKEN` environment variable
- **Use Case**: CI/CD environments and automated workflows
- **Test**: `should complete token-based auth workflow with external repository`

### Environment Variables

The tests require different environment variables depending on the scenario:

#### Required for All Tests
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for notification testing
- `TELEGRAM_CHAT_ID`: Telegram chat ID for notification testing

#### GitHub CLI Scenario
- No additional tokens required (uses `gh auth login`)

#### Token-Based Scenario
- `CI_GITHUB_TOKEN`: GitHub token with access to private repositories

### Token Hierarchy

The authentication system follows this hierarchy:

1. **GitHub CLI** (`gh auth login`) - Preferred for local development
2. **Manual Token** (`--token` parameter) - Explicit token override
3. **Environment Variables** - Fallback for CI/CD
   - `CI_GITHUB_TOKEN` (preferred for CI with private repo access)
   - `GITHUB_TOKEN` (standard GitHub Actions token)

## Integration Tests

### GitHub Adapter Integration

**File**: `tests/integration/adapters/github/github-adapter.test.ts`

Tests the GitHub adapter's interaction with the real GitHub API:
- Authentication with private repositories
- Issue creation, retrieval, and updates
- State changes and filtering
- Error handling for non-existent resources

**Token Usage**: Uses `CI_GITHUB_TOKEN` (preferred) or falls back to `GITHUB_TOKEN`

### Skip Conditions

Tests are skipped gracefully when:
- Required environment variables are missing
- Authentication tokens are not available
- External services are not accessible

This ensures tests don't fail in environments where credentials are not configured.

## E2E Tests

### GitHub + Telegram Integration

**File**: `tests/e2e/github-telegram-integration.test.ts`

Tests the complete workflow:
1. GitHub context setup and authentication
2. Issue creation in GitHub repository
3. Telegram notification target configuration
4. Notification sending with work item filtering
5. Cleanup of created resources

### Test Isolation

Each test runs in an isolated temporary directory with:
- Fresh `.work` directory structure
- Independent context configuration
- Automatic cleanup of created resources

## CI/CD Considerations

### GitHub Actions Environment

In GitHub Actions, the tests use:
- `CI_GITHUB_TOKEN`: For accessing private repositories
- `GITHUB_TOKEN`: Standard Actions token (limited to current repository)
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`: For notification testing

### Private Repository Access

The `CI_GITHUB_TOKEN` is required for:
- Integration tests with private repositories
- E2E tests using external repositories
- Testing the complete authentication hierarchy

### Test Reliability

Tests are designed to be reliable in CI by:
- Using appropriate tokens for each scenario
- Graceful skipping when credentials are unavailable
- Proper cleanup of created resources
- Isolated test environments

## Running Tests Locally

### Prerequisites

1. **GitHub CLI Authentication** (for gh CLI scenario):
   ```bash
   gh auth login
   ```

2. **Environment Variables** (for token scenario):
   ```bash
   export CI_GITHUB_TOKEN="your_token_with_private_repo_access"
   export TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
   export TELEGRAM_CHAT_ID="your_telegram_chat_id"
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run only E2E tests
npm test tests/e2e/

# Run only integration tests
npm test tests/integration/

# Run specific test file
npm test tests/e2e/github-telegram-integration.test.ts
```

## Troubleshooting

### Common Issues

1. **"Skipping test - missing CI_GITHUB_TOKEN"**
   - Set `CI_GITHUB_TOKEN` environment variable
   - Ensure token has access to private repositories

2. **"Skipping test - missing Telegram credentials"**
   - Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
   - Verify bot token is valid and chat ID is accessible

3. **GitHub API 404 errors**
   - Verify repository URLs are correct
   - Check token permissions for repository access
   - Ensure repositories exist and are accessible

### Debug Mode

Enable debug logging for more detailed test output:

```bash
DEBUG=work:* npm test
```

## Best Practices

1. **Token Security**: Never commit tokens to version control
2. **Test Isolation**: Each test should clean up its resources
3. **Graceful Degradation**: Tests should skip when dependencies are unavailable
4. **Real Services**: Integration tests use real APIs for authentic testing
5. **Multiple Scenarios**: Cover different authentication methods and use cases
