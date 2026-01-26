# AI Scrum PoC - GitHub Integration

Demonstrates AI agents collaborating through work CLI's notification system in a scrum-like workflow using GitHub Issues as the backend.

**Location**: `examples/ai-scrum-github/`

## Prerequisites

- work CLI installed and available in PATH (`work --help` should work)
- GitHub authentication configured (one of):
  - `gh auth login` (GitHub CLI - recommended)
  - `GITHUB_TOKEN` environment variable
  - `CI_GITHUB_TOKEN` environment variable
- jq for JSON parsing (`jq --version` should work)
- Access to repository: `tbrandenburg/work`

## Setup

1. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

2. **Create and activate GitHub context**:
   ```bash
   work context add github-demo --tool github --url https://github.com/tbrandenburg/work
   work context set github-demo
   ```

3. **Verify connection**:
   ```bash
   work list
   ```

## Quick Start

```bash
# Demo version (shows work CLI orchestration)
./demo.sh

# Verbose version (full details)
./demo.sh --verbose
```

## Manual Usage

```bash
# 1. Initialize tasks
./init.sh "My Project"

# 2. Run scrum cycles
./scrum-cycle.sh
```

## Architecture

Uses work CLI's notification system to orchestrate AI agents with GitHub Issues as the backend:

- **⚙️ work CLI** - Central orchestrator that notifies agents and tracks task state in GitHub
- **Scrum Master** - Analyzes and prioritizes GitHub issues when notified by work CLI
- **Developer** - Works on high-priority GitHub issues when notified by work CLI  
- **Reviewer** - Reviews completed GitHub issues when notified by work CLI

The work CLI maintains task state in GitHub Issues and coordinates agent collaboration through its notification system.

## GitHub Authentication

The work CLI supports multiple authentication methods:

1. **GitHub CLI** (Recommended):
   ```bash
   gh auth login
   ```

2. **Environment Variable**:
   ```bash
   export GITHUB_TOKEN="your_token_here"
   ```

3. **CI Environment**:
   ```bash
   export CI_GITHUB_TOKEN="your_ci_token_here"
   ```

## Repository Setup

This example uses the `tbrandenburg/work` repository. Make sure you have access to create and manage issues in this repository.

## Troubleshooting

If you encounter authentication errors:

1. Verify GitHub CLI authentication: `gh auth status`
2. Check token permissions include `repo` scope
3. Ensure the repository exists and you have write access
4. Try refreshing the token: `gh auth refresh`
