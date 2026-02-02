# Work CLI Notifications User Guide

The work CLI provides a flexible notification system that allows you to send work item updates to external services via bash scripts, Telegram, or AI coding agents via the Agent Client Protocol (ACP).

## Overview

Notifications in work CLI are:
- **Stateless**: No background processes or scheduling
- **Query-based**: Send results of work item queries to targets
- **Explicit**: Triggered manually, not automated

## Notification Targets

### ACP (Agent Client Protocol) Targets

Send work items to AI coding agents that support the Agent Client Protocol (ACP) such as OpenCode, Cursor, Cody, and other ACP-compliant tools.

#### Setup

```bash
# Add an ACP target (generic, works with any ACP client)
work notify target add ai --type acp --cmd "opencode acp"

# With custom working directory
work notify target add ai --type acp --cmd "opencode acp" --cwd /path/to/project

# With timeout (default: 30 seconds)
work notify target add ai --type acp --cmd "cursor acp" --timeout 60
```

#### Supported ACP Clients

Any tool that implements the [Agent Client Protocol](https://agentclientprotocol.com/):
- **OpenCode**: `opencode acp`
- **Cursor**: `cursor acp`
- **Cody**: `cody acp`
- **Custom ACP servers**: Any command that accepts JSON-RPC 2.0 over stdio

#### Usage

```bash
# Send a specific task to AI for analysis
work notify send TASK-123 to ai

# Send all open tasks
work notify send where state=open to ai

# Send high-priority bugs
work notify send where kind=bug and priority=high to ai
```

#### How It Works

1. Work CLI spawns the ACP client as a subprocess
2. Establishes JSON-RPC 2.0 communication over stdio
3. Initializes a new ACP session
4. Formats work items as a prompt
5. Sends prompt to ACP client
6. Returns AI response
7. Cleans up subprocess

#### Known Limitations

**Session Persistence**: Sessions are NOT persisted across CLI invocations. Each `work notify send` command creates a new ACP session.

**Impact**: Multi-turn conversations with the AI require manual session management or using a single command with multiple work items.

**Example**:
```bash
# ❌ These create SEPARATE sessions (no conversation context)
work notify send TASK-1 to ai
work notify send TASK-2 to ai  # AI doesn't remember TASK-1

# ✅ Workaround: Send multiple items in one command
work notify send where id in (TASK-1,TASK-2) to ai
```

**Why**: The `TargetConfig` type is readonly for immutability. Handlers cannot modify config to save session IDs.

**Resolution**: See [Issue #963](https://github.com/tbrandenburg/work/issues/963) for planned enhancement.

#### Authentication

ACP clients must be authenticated before use. For OpenCode:

```bash
# Check authentication status
opencode auth status

# Login if needed (follow prompts)
opencode auth login
```

#### Troubleshooting

**"ACP client not found"**: Ensure the client is installed and in PATH
```bash
which opencode  # Should return path to executable
```

**Timeout errors**: Increase timeout for slow AI responses
```bash
work notify target add ai --type acp --cmd "opencode acp" --timeout 120
```

**Process hangs**: The CLI automatically cleans up spawned processes after notifications complete. If you see hung processes, please report an issue.

#### System Prompts and Conversation History

ACP targets support system prompts that establish the AI's role and behavior:

```bash
# Set up AI with specific expertise
work notify target add security-reviewer \
  --type acp \
  --cmd "opencode acp" \
  --system-prompt "You are a security expert. Focus on identifying vulnerabilities, auth issues, and data exposure risks."

# All notifications use this context
work notify send where kind=feature to security-reviewer
# AI analyzes with security mindset
```

**Conversation Continuity**: The ACP protocol maintains conversation history within
a session. When you reuse the same target:

```bash
work notify send TASK-1 to security-reviewer  # First message
work notify send TASK-2 to security-reviewer  # AI remembers TASK-1
work notify send TASK-3 to security-reviewer  # AI remembers TASK-1 and TASK-2
```

The system prompt is sent once during session creation and persists throughout
the conversation. Each subsequent notification adds to the accumulated context.

**Best Practices for System Prompts:**
- **Define role clearly**: "You are a [role] focused on [expertise area]"
- **Set boundaries**: "Focus only on [scope], ignore [out-of-scope]"
- **Specify output format**: "Provide analysis in bullet points with severity ratings"
- **Keep concise**: Aim for 2-3 sentences that establish clear context

**Example System Prompts:**
- Code Review: `"You are a senior code reviewer. Analyze code for bugs, performance issues, and maintainability. Provide specific line-by-line feedback."`
- Security Audit: `"You are a security expert. Identify vulnerabilities, authentication flaws, and data exposure risks. Rate severity as critical/high/medium/low."`
- Architecture Review: `"You are a software architect. Evaluate design patterns, scalability, and system integration. Focus on long-term maintainability."`

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
