# Work Item Prioritization Example

This example demonstrates using the `work` CLI with GitHub Issues and OpenCode ACP to automatically assess and prioritize work items based on business value.

## ⚠️ Known Issue

**OpenCode ACP Response Timeout**: The first run with a new session can take 60+ seconds (initialize + session creation + system prompt + work items prompt). This currently exceeds the 60-second timeout, causing the notification to fail.

**Workaround**: This is a known limitation documented in [Issue #1361](https://github.com/tbrandenburg/work/issues/1361). The script correctly demonstrates the workflow but requires ACP handler improvements for production use.

## What It Does

The `prioritize.sh` script:

1. **Sets up GitHub context** - Connects to the work CLI repository
2. **Authenticates** - Logs into GitHub using existing credentials
3. **Configures OpenCode ACP agent** - Sets up an AI agent to analyze work items
4. **Lists open items** - Shows current new/active work items  
5. **Triggers prioritization** - Sends work items to the AI agent for business value assessment

**Note**: Due to GitHub adapter pagination limits ([Issue #1361](https://github.com/tbrandenburg/work/issues/1361)), only the 100 most recent issues are accessible. Some older open issues may not appear in the list.

## Prerequisites

- `work` CLI installed globally: `npm install -g @tbrandenburg/work`
- GitHub CLI authenticated: `gh auth login`
- OpenCode CLI installed and available in PATH

## Usage

```bash
cd examples/work-item-prioritization
./prioritize.sh
```

## How It Works

The script uses the **notification system** to send work items to an AI agent configured via the Agent Client Protocol (ACP). The agent:

- Receives work item data in JSON format
- Analyzes each item for business impact and urgency
- Updates priorities using `work set` commands
- Provides reasoning for changes

## System Prompt

The prioritizer agent uses this prompt:

> "You are a business value analyst. Analyze the passed work items and assess their priority based on business impact, user value, and urgency. Use 'work set <id> priority=<low|medium|high|critical>' to update priorities. Provide brief reasoning for each change."

## Customization

Modify the `--system-prompt` in the script to change the prioritization criteria:

```bash
work notify target add prioritizer \
  --type acp \
  --cmd "opencode acp" \
  --system-prompt "Your custom instructions here..."
```

## Related Examples

- [AI Scrum](../ai-scrum/) - Local filesystem workflow
- [AI Scrum GitHub](../ai-scrum-github/) - Complete GitHub integration guide

## Learn More

- [Notification System Documentation](../../docs/work-notifications.md)
- [GitHub Authentication Guide](../../docs/work-github-auth.md)
- [CLI Specification](../../docs/work-cli-spec.md)
