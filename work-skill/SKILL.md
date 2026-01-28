---
name: work-cli-usage
description: Guide for using the work CLI to manage work items across multiple backends (GitHub, Jira, Linear, Azure DevOps, local filesystem). Use when working with work item management, task tracking, project coordination, CLI automation, or any work CLI commands like create, list, edit, start, close, context, auth, notify, or schema operations.
---

# Work CLI Usage

## Overview

The work CLI is a unified, stateless command-line tool for managing work items across multiple project management backends. It enables seamless work item management whether you're working with GitHub Issues, local filesystem, or planning to integrate with Jira, Linear, or Azure DevOps.

## Quick Start

### Local Filesystem (No External Dependencies)

```bash
# Create and set context
work context add my-project --tool local-fs --path ./work-items
work context set my-project

# Start creating work items immediately
work create "Set up project structure" --kind task --priority medium
work list
```

### GitHub Integration

```bash
# Authenticate with GitHub CLI (recommended)
gh auth login

# Create GitHub context
work context add my-project --tool github --url https://github.com/owner/repo
work context set my-project
work auth login

# Create work items that appear as GitHub issues
work create "Fix login bug" --kind bug --priority high
```

## Core Operations

### 1. Lifecycle Management

Manage work item states through their lifecycle:

```bash
# Create work items
work create "Title" --kind task --priority medium --assignee username
work create "Bug description" --kind bug --priority critical

# Manage state transitions
work start ITEM-123        # new → active
work close ITEM-123        # active/new → closed
work reopen ITEM-123       # closed → active
```

### 2. Querying and Access

Find and retrieve work items with powerful filtering:

```bash
# Get specific item
work get ITEM-123

# List with filters
work list                                    # All items
work list where state=active                 # Active items only
work list where priority=high and state=new  # High priority new items
work list where assignee=me order by priority desc
work list where kind=bug limit 10
```

### 3. Attribute Management

Update work item properties:

```bash
# Set attributes
work set ITEM-123 priority=high assignee=alice
work set ITEM-123 title="New title" description="Updated description"

# Edit interactively
work edit ITEM-123 --title "Fix login bug" --priority critical
work edit ITEM-123 --editor  # Opens $EDITOR for description

# Clear attributes
work unset ITEM-123 assignee
work unset ITEM-123 priority
```

### 4. Relations and Dependencies

Create relationships between work items:

```bash
# Create relationships
work link ITEM-123 parent_of ITEM-456    # 456 is child of 123
work link ITEM-123 blocks ITEM-789       # 123 blocks 789
work link ITEM-123 duplicates ITEM-999   # 123 duplicates 999

# Remove relationships
work unlink ITEM-123 blocks ITEM-789
```

### 5. Comments and Documentation

Add context and updates:

```bash
# Add comments
work comment ITEM-123 "Fixed the authentication flow"
work close ITEM-123 --comment "Completed testing"
```

## Context Management

Contexts define tool + scope + credentials for different projects:

```bash
# Add contexts for different backends
work context add personal --tool local-fs --path ~/personal-tasks
work context add work-repo --tool github --url https://github.com/company/repo
work context add jira-project --tool jira --url https://company.atlassian.net --project KEY

# Switch between contexts
work context set personal        # Work with local filesystem
work context set work-repo       # Work with GitHub issues
work context list               # Show all contexts
work context show              # Show active context details
work context remove old-context
```

## Authentication

Authentication is context-specific and varies by backend:

### GitHub Authentication (3-tier hierarchy)

```bash
# Option 1: GitHub CLI (recommended - most secure)
gh auth login

# Option 2: Environment variable (CI/CD friendly)
export GITHUB_TOKEN=ghp_token

# Option 3: Manual token (explicit management)
work context add --token ghp_token

# Check and manage auth status
work auth status    # Check current context auth
work auth login     # Context-specific login
work auth logout    # Context-specific logout
```

### Local Filesystem

```bash
# No authentication required for local-fs
work context add local --tool local-fs --path ./work
# Ready to use immediately
```

## Notifications System

Send work item data to external services for team coordination:

### Setup Notification Targets

```bash
# Telegram notifications
work notify target add team-chat --type telegram \
  --bot-token "YOUR_BOT_TOKEN" --chat-id "YOUR_CHAT_ID"

# Bash script notifications (webhook, email, etc.)
work notify target add custom-webhook --type bash \
  --script /path/to/webhook-script.sh --timeout 60
```

### Send Notifications

```bash
# Send query results to targets
work notify send where priority=critical to team-chat
work notify send where state=new and assignee=me to alerts
work notify send where kind=bug order by priority desc limit 5 to team-chat

# Send specific item updates
work notify send ITEM-123 to team-chat
```

### Custom Notification Scripts

Create bash scripts that receive JSON via stdin:

```bash
#!/bin/bash
# webhook-script.sh - receives work item data as JSON

data=$(cat)
message=$(echo "$data" | jq -r '.message')
title=$(echo "$data" | jq -r '.workItem.title // "N/A"')

# Log notification
echo "$(date): $message - $title" >> /var/log/work-notifications.log

# Send to external service
curl -X POST https://your-service.com/webhook \
  -H "Content-Type: application/json" \
  -d "$data"
```

## Schema Discovery

Understand what's available in your current backend:

```bash
work schema show              # Full schema overview
work schema kinds            # Available work item types (task, bug, epic, story)
work schema attrs            # Available attributes (priority, assignee, etc.)
work schema relations        # Available relationship types
```

## Advanced Usage Patterns

### Multi-Context Workflow

```bash
# Set up multiple contexts for different projects
work context add frontend --tool github --url https://github.com/team/frontend
work context add backend --tool local-fs --path ./backend-tasks
work context add planning --tool jira --url https://company.atlassian.net

# Work across contexts
work context set frontend && work create "Update navbar" --kind task
work context set backend && work create "Optimize queries" --kind task
work context set planning && work list where state=active
```

### CI/CD Integration

```bash
#!/bin/bash
# In CI pipeline - create issues for build failures

if [ $BUILD_STATUS = "failed" ]; then
  work context set ci-issues
  work create "Build #$BUILD_NUMBER failed" --kind bug --priority critical
  work notify send where title contains "Build #$BUILD_NUMBER" to alerts
fi
```

### AI Agent Coordination

The work CLI enables mixed human-agent teams:

```bash
# Agent creates tasks for humans
work create "Review PR #123" --kind task --assignee human-reviewer
work notify send where assignee=human-reviewer to team-channel

# Agent processes its own assigned tasks
work list where assignee=ai-agent and state=new --format json | \
  jq -r '.[] | .id' | while read id; do
    work start "$id"
    # Agent processes the task...
    work close "$id" --comment "Processed by AI agent"
  done
```

## Common Query Examples

```bash
# Team coordination queries
work list where assignee=alice and state=active
work list where state=active order by priority desc
work notify send where priority=high and state=new to team-alerts

# Sprint planning
work list where kind=story and state=new order by priority desc limit 20
work list where parent_of and kind=epic  # Epics with children

# Bug triage
work list where kind=bug and state=new order by priority desc
work notify send where kind=bug and priority=critical to bug-triage

# Progress tracking
work list where assignee=me and state=active
work list where updated gt "2026-01-01" order by updated desc
```

## Troubleshooting

### Authentication Issues

```bash
# Check GitHub authentication
gh auth status
work auth status

# Re-authenticate if needed
gh auth login
work auth logout && work auth login
```

### Context Problems

```bash
# Verify contexts
work context list
work context show

# Reset problematic context
work context remove problematic-context
work context add problematic-context --tool github --url https://github.com/owner/repo
```

### Permission Errors

- Verify GitHub token has `repo` scope for private repos or `public_repo` for public repos
- Check filesystem permissions for local-fs contexts
- Ensure work CLI config directory (~/.work/) is accessible

## Resources

For detailed setup and advanced configurations, see:

- [Quick Start Reference](references/quick-start.md) - Complete 5-minute setup guide
- [GitHub Authentication](references/github-auth.md) - Comprehensive auth setup
- [Notification Examples](references/notification-examples.md) - Integration patterns
