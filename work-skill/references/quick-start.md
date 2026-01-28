# Quick Start Reference

Complete setup guide for getting started with work CLI in 5 minutes.

## Installation Options

### Option 1: npm install (when published)

```bash
npm install -g @tbrandenburg/work
work --version
```

### Option 2: From source

```bash
git clone https://github.com/tbrandenburg/work-cli
cd work-cli
npm install && npm run build
npm install -g .
work --version  # Should show version
```

## Quick Setup Paths

### Local Filesystem (No External Dependencies)

Perfect for personal projects, offline work, or quick trials:

```bash
# 1. Create context
work context add my-project --tool local-fs --path ./my-work
work context set my-project

# 2. Create and manage work items
work create "Set up project structure" --kind task --priority medium
work list
work start TASK-001
work comment TASK-001 "Created initial directory structure"
work close TASK-001

# 3. View generated files
ls -la ./my-work/  # See work CLI's file structure
```

**Benefits**: No setup, works offline, version controllable, easy backup

### GitHub Integration

Best for teams already using GitHub:

```bash
# 1. Authenticate with GitHub CLI (recommended)
gh auth login  # Follow browser prompts

# 2. Create context for your repository
work context add my-project --tool github --url https://github.com/YOUR-USERNAME/YOUR-REPO
work context set my-project
work auth login

# 3. Create work items (become GitHub Issues)
work create "Fix login bug" --kind bug --priority high
# Visit your GitHub repo → Issues to see it

# 4. Manage lifecycle
work start ISSUE-123
work comment ISSUE-123 "Found root cause in auth.js"
work close ISSUE-123 --comment "Fixed authentication flow"
```

**Benefits**: Integrates with existing GitHub workflow, team visibility, automatic issue tracking

## Essential Commands Summary

```bash
# Context management
work context add NAME --tool TOOL --url URL
work context set NAME
work context list

# Work item lifecycle
work create "Title" --kind TYPE --priority LEVEL
work start ITEM-ID
work close ITEM-ID
work reopen ITEM-ID

# Querying and updates
work list [where FILTERS]
work get ITEM-ID
work set ITEM-ID attr=value
work comment ITEM-ID "message"

# Authentication (context-specific)
work auth login
work auth status
work auth logout
```

## Common First Day Workflows

### Solo Developer

```bash
work context add personal --tool local-fs --path ~/tasks
work context set personal
work create "Learn work CLI" --kind task --priority high
work create "Set up new project" --kind task
work start TASK-001
# ... work on it ...
work close TASK-001 --comment "Completed work CLI setup"
```

### Team Member

```bash
work context add team-project --tool github --url https://github.com/team/project
work context set team-project
work auth login
work list where assignee=me
work start ISSUE-456  # Start assigned work
work comment ISSUE-456 "Working on this now"
```

### Project Manager

```bash
work context add planning --tool github --url https://github.com/team/project
work context set planning
work auth login
work create "Sprint 12 planning" --kind epic --priority medium
work list where kind=story order by priority desc
work notify target add team-chat --type telegram --bot-token TOKEN --chat-id CHAT
work notify send where priority=high to team-chat
```

## Verification Steps

After setup, verify everything works:

```bash
# Check context setup
work context show  # Should show active context details

# Test basic operations
work create "Test item" --kind task
work list  # Should show your test item
work get ITEM-ID  # Should show item details

# Test authentication (if using external backend)
work auth status  # Should show authenticated status
```

## Next Steps After Quick Start

1. **Explore filtering**: `work list where priority=high and state=active`
2. **Set up notifications**: Add Telegram or bash script targets
3. **Try relationships**: Link work items with `work link`
4. **Multiple contexts**: Add contexts for different projects
5. **Team workflows**: Share context setup with teammates

## Common Issues During Setup

### GitHub Authentication

```bash
# If "No GitHub token found"
gh auth status  # Check GitHub CLI auth
gh auth login   # Re-authenticate if needed

# If token format errors
# Ensure token starts with ghp_, gho_, or ghs_
export GITHUB_TOKEN=ghp_your_token_here
```

### Context Issues

```bash
# If context not found
work context list  # See available contexts
work context set correct-name

# If path issues (local-fs)
mkdir -p ./work-items  # Ensure directory exists
```

### Permission Errors

```bash
# GitHub: Verify token has repo access
# Local-fs: Check directory permissions
chmod 755 ./work-items
```
