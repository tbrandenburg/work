# Work CLI Notifications User Guide

The work CLI provides a flexible notification system that allows you to send work item updates to external services via bash scripts or Telegram.

## Overview

Notifications in work CLI are:
- **Stateless**: No background processes or scheduling
- **Query-based**: Send results of work item queries to targets
- **Explicit**: Triggered manually, not automated

## Notification Targets

### Bash Script Targets

Bash scripts receive notification data as JSON via stdin and can integrate with any external service.

#### Setup

```bash
# Add a bash script target
work notify target add my-script --type bash --script /path/to/script.sh

# With custom timeout (default: 30 seconds)
work notify target add my-script --type bash --script /path/to/script.sh --timeout 60
```

#### Script Requirements

Your script must:
- Read JSON from stdin
- Exit 0 for success, non-zero for failure
- Be executable (`chmod +x`)

#### Example Script

```bash
#!/bin/bash

# Read notification data
data=$(cat)

# Parse JSON (requires jq)
message=$(echo "$data" | jq -r '.message')
work_item=$(echo "$data" | jq -r '.workItem.title // "N/A"')

# Log notification
echo "$(date): $message - $work_item" >> /var/log/work-notifications.log

# Send to webhook
curl -X POST https://your-service.com/webhook \
  -H "Content-Type: application/json" \
  -d "$data"

exit 0
```

#### JSON Structure

The script receives:
```json
{
  "message": "Notification message",
  "workItem": {
    "id": "TASK-123",
    "title": "Work item title",
    "state": "new",
    "priority": "high"
  },
  "timestamp": "2026-01-25T20:30:00Z",
  "target": {
    "name": "my-script",
    "type": "bash"
  }
}
```

### Telegram Targets

Send notifications directly to Telegram chats.

#### Setup

1. Create a Telegram bot via [@BotFather](https://t.me/botfather)
2. Get your chat ID (send `/start` to [@userinfobot](https://t.me/userinfobot))
3. Add the target:

```bash
work notify target add team-chat --type telegram \
  --bot-token "YOUR_BOT_TOKEN" \
  --chat-id "YOUR_CHAT_ID"
```

## Sending Notifications

### Basic Usage

```bash
# Send simple message
work notify send "Build completed!" to my-script

# Send work item query results
work notify send where state=new to team-chat

# Send filtered results
work notify send where priority=high and assignee=me to alerts
```

### Advanced Queries

```bash
# With ordering and limits
work notify send where state=open order by priority desc limit 5 to team-chat

# Multiple conditions
work notify send where kind=bug and state=new and priority=critical to alerts
```

## Managing Targets

```bash
# List all targets
work notify target list

# Remove a target
work notify target remove old-target

# View target details (JSON format)
work notify target list --format json
```

## Use Cases

### Development Workflow
```bash
# Notify team of new high-priority items
work notify send where priority=high and state=new to team-chat

# Alert on critical bugs
work notify send where kind=bug and priority=critical to alerts
```

### CI/CD Integration
```bash
# In your build script
work create "Build #$BUILD_NUMBER failed" --kind bug --priority high
work notify send where title contains "Build #$BUILD_NUMBER" to build-alerts
```

### Custom Integrations
Create bash scripts that:
- Update external dashboards
- Send emails via sendmail
- Post to Slack webhooks
- Update JIRA tickets
- Log to monitoring systems

## Error Handling

Notifications fail if:
- Target doesn't exist
- Script exits with non-zero code
- Network issues (Telegram)
- Invalid bot token/chat ID

Check exit codes and logs for troubleshooting.

## Security Notes

- Store sensitive tokens in environment variables
- Use restricted file permissions for scripts
- Validate input in bash scripts
- Consider rate limiting for external APIs

## Examples Repository

See `examples/notifications/` for complete working examples of:
- Slack webhook integration
- Email notifications via sendmail
- Custom dashboard updates
- Multi-service notification scripts
