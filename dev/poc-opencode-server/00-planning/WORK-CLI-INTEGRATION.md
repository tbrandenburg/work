# OpenCode ACP Integration for `work` CLI

## CLI Design Recommendations

Based on the PoC findings, here's the recommended design for integrating OpenCode ACP as a notification target in the `work` CLI.

---

## 1. Adding an ACP Target

### Basic Command Structure

```bash
work notify target add <name> \
  --type acp \
  --cmd "opencode acp" \
  [OPTIONS]
```

### Recommended Parameters

```bash
work notify target add my-opencode-acp \
  --type acp \
  --cmd "opencode acp" \
  --cwd "$(pwd)" \
  --model "github-copilot/gpt-5.2-codex" \
  --mode build \
  --capabilities @capabilities.json \
  --session-strategy persist \
  --timeout 10s
```

### Parameter Details

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `<name>` | ✅ Yes | - | Target identifier (e.g., `my-opencode-acp`) |
| `--type` | ✅ Yes | - | Must be `acp` for OpenCode ACP protocol |
| `--cmd` | ✅ Yes | - | Command to spawn ACP process |
| `--cwd` | ⚠️ Recommended | Current dir | Working directory for OpenCode context |
| `--model` | ❌ Optional | Agent default | Default model ID (31 available, see PoC) |
| `--mode` | ❌ Optional | `build` | `build` or `plan` mode |
| `--capabilities` | ⚠️ Recommended | Minimal | File path or JSON string for permissions |
| `--session-strategy` | ❌ Optional | `persist` | `persist`, `ephemeral`, or `resume` |
| `--timeout` | ❌ Optional | `30s` | Initialization timeout |
| `--client-name` | ❌ Optional | `work-cli` | Client identifier in protocol |
| `--client-version` | ❌ Optional | `1.0.0` | Client version |

---

## 2. Capabilities File Format

### Example: `capabilities.json`

```json
{
  "fileSystem": {
    "readTextFile": true,
    "writeTextFile": true,
    "listDirectory": true
  },
  "terminal": {
    "create": true,
    "sendText": true
  },
  "editor": {
    "applyDiff": true,
    "openFile": true
  }
}
```

### Preset Options

Instead of JSON files, provide presets:

```bash
# Full permissions
--capabilities full

# Read-only (safe for analysis)
--capabilities readonly

# Minimal (just prompts)
--capabilities minimal

# Custom file
--capabilities @my-caps.json

# Inline JSON
--capabilities '{"fileSystem":{"readTextFile":true}}'
```

---

## 3. Session Strategies

### `persist` (Default - Recommended)

- Creates session on first use
- Reuses same session for all future prompts
- Maintains conversation history
- Session survives CLI restarts

```bash
work notify target add my-opencode \
  --type acp \
  --cmd "opencode acp" \
  --session-strategy persist
```

**Use case**: Continuous work context, iterative development

### `ephemeral`

- Creates new session for each `work notify send`
- No history between prompts
- Clean state every time

```bash
work notify target add my-opencode \
  --type acp \
  --cmd "opencode acp" \
  --session-strategy ephemeral
```

**Use case**: Independent prompts, no context needed

### `resume`

- Creates session on first use
- Resumes without history replay on restart
- Fast reconnection (no 5-7 second wait)

```bash
work notify target add my-opencode \
  --type acp \
  --cmd "opencode acp" \
  --session-strategy resume
```

**Use case**: Long-running sessions with fast restarts

---

## 4. Sending Prompts

### Basic Send

```bash
work notify send "Analyze the authentication module" to my-opencode-acp
```

### With Overrides

```bash
# Override model for this prompt
work notify send "Explain this error" to my-opencode-acp \
  --model "github-copilot/claude-sonnet-4.5"

# Override mode
work notify send "Design a caching layer" to my-opencode-acp \
  --mode plan

# Both
work notify send "Refactor user service" to my-opencode-acp \
  --model "openai/gpt-5.2-codex" \
  --mode build
```

### Stream vs Wait

```bash
# Stream response (default)
work notify send "Write tests" to my-opencode-acp

# Wait for complete response
work notify send "Write tests" to my-opencode-acp --wait

# JSON output
work notify send "Write tests" to my-opencode-acp --json
```

---

## 5. Target Management

### List Targets

```bash
work notify target list

# Output:
# my-opencode-acp    acp    opencode acp    persist    online    session-abc123
# other-target       http   https://...     -          online    -
```

### Show Target Details

```bash
work notify target show my-opencode-acp

# Output:
# Name: my-opencode-acp
# Type: acp
# Command: opencode acp
# CWD: /home/user/project
# Model: github-copilot/gpt-5.2-codex
# Mode: build
# Session Strategy: persist
# Current Session: session-abc123
# Status: online
# Last Used: 2 minutes ago
# Total Prompts: 15
```

### Update Target

```bash
# Change default model
work notify target update my-opencode-acp \
  --model "github-copilot/claude-sonnet-4.5"

# Change working directory
work notify target update my-opencode-acp \
  --cwd "/path/to/other/project"
```

### Remove Target

```bash
work notify target remove my-opencode-acp

# With session cleanup
work notify target remove my-opencode-acp --cleanup-session
```

---

## 6. Session Management Commands

### List Sessions

```bash
work notify session list my-opencode-acp

# Output:
# session-abc123    active     15 prompts    2m ago
# session-xyz789    archived   42 prompts    2h ago
```

### Reset Session

```bash
# Create new session (archive old one)
work notify session reset my-opencode-acp

# Delete session entirely
work notify session delete session-abc123
```

### Show Session History

```bash
work notify session history my-opencode-acp

# Output:
# [1] 2m ago: "Analyze authentication module"
#     Response: The authentication module uses JWT...
# [2] 5m ago: "Explain error in login.ts"
#     Response: The error occurs because...
```

---

## 7. Complete Examples

### Example 1: Simple Setup

```bash
# Add target with defaults
work notify target add opencode \
  --type acp \
  --cmd "opencode acp"

# Send prompt
work notify send "Review my code" to opencode
```

### Example 2: Read-Only Analysis

```bash
# Safe read-only setup for code review
work notify target add code-reviewer \
  --type acp \
  --cmd "opencode acp" \
  --cwd "$(pwd)" \
  --capabilities readonly \
  --mode build \
  --session-strategy persist

# Use it
work notify send "Find security issues" to code-reviewer
work notify send "Check for performance problems" to code-reviewer
```

### Example 3: Planning Agent

```bash
# Setup planning agent with claude
work notify target add architect \
  --type acp \
  --cmd "opencode acp" \
  --model "github-copilot/claude-sonnet-4.5" \
  --mode plan \
  --capabilities minimal

# Use for architecture design
work notify send "Design a distributed cache" to architect
```

### Example 4: Multiple Projects

```bash
# Frontend project
work notify target add fe-agent \
  --type acp \
  --cmd "opencode acp" \
  --cwd ~/projects/frontend \
  --model "github-copilot/gpt-5.2-codex"

# Backend project
work notify target add be-agent \
  --type acp \
  --cmd "opencode acp" \
  --cwd ~/projects/backend \
  --model "github-copilot/claude-sonnet-4.5"

# Use each
work notify send "Add loading spinner" to fe-agent
work notify send "Optimize database query" to be-agent
```

### Example 5: Ephemeral for Independent Tasks

```bash
# Setup ephemeral target
work notify target add quick-help \
  --type acp \
  --cmd "opencode acp" \
  --session-strategy ephemeral

# Each prompt is independent (no context)
work notify send "What is CORS?" to quick-help
work notify send "Explain closures" to quick-help
```

---

## 8. Configuration File Format

Store targets in `.work/notify-targets.json`:

```json
{
  "targets": {
    "my-opencode-acp": {
      "type": "acp",
      "cmd": "opencode acp",
      "cwd": "/home/user/project",
      "model": "github-copilot/gpt-5.2-codex",
      "mode": "build",
      "capabilities": {
        "fileSystem": {
          "readTextFile": true,
          "writeTextFile": true
        }
      },
      "sessionStrategy": "persist",
      "sessionId": "session-abc123",
      "timeout": "30s",
      "clientInfo": {
        "name": "work-cli",
        "version": "1.0.0"
      },
      "metadata": {
        "createdAt": "2026-02-02T08:00:00Z",
        "lastUsed": "2026-02-02T08:30:00Z",
        "totalPrompts": 15
      }
    }
  }
}
```

---

## 9. Implementation Notes

### Process Management

```typescript
// Spawn ACP process
const acp = spawn('opencode', ['acp', '--cwd', target.cwd]);

// Keep process alive for session reuse
// Store in memory: Map<targetName, ACPProcess>

// Cleanup on exit
process.on('exit', () => {
  acp.kill();
});
```

### Session Persistence

```typescript
// Store session ID in config after creation
config.targets[name].sessionId = response.result.sessionId;
await config.save();

// Reuse on next prompt
if (target.sessionStrategy === 'persist' && target.sessionId) {
  await send('session/resume', {
    sessionId: target.sessionId,
    cwd: target.cwd,
    mcpServers: []
  });
}
```

### Error Handling

```typescript
// Handle ACP process crash
acp.on('exit', (code) => {
  if (code !== 0) {
    console.error(`OpenCode crashed (${code})`);
    // Clear session ID
    delete config.targets[name].sessionId;
    // Attempt restart on next use
  }
});

// Handle timeout
const timeout = setTimeout(() => {
  acp.kill();
  throw new Error('OpenCode initialization timeout');
}, target.timeout);
```

---

## 10. Model Selection Reference

### Recommended Models

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| `github-copilot/gpt-5.2-codex` | Code generation | Fast | Moderate |
| `github-copilot/claude-sonnet-4.5` | Analysis, planning | Medium | Higher |
| `openai/gpt-5.2-codex` | OAuth required | Fast | Moderate |
| `opencode/big-pickle` | Free tier | Slower | Free |

### Get Available Models

```bash
# List all 31 models
work notify models my-opencode-acp

# Output:
# github-copilot/gpt-5.2-codex          (default)
# github-copilot/claude-sonnet-4.5
# github-copilot/gemini-3-pro-preview
# openai/gpt-5.2-codex
# opencode/big-pickle
# ... (31 total)
```

---

## 11. Recommended Presets

### Quick Setup Commands

```bash
# Create common presets
work notify preset create code-review \
  --type acp \
  --capabilities readonly \
  --mode build

work notify preset create architect \
  --type acp \
  --model "github-copilot/claude-sonnet-4.5" \
  --mode plan

work notify preset create fast-coder \
  --type acp \
  --model "github-copilot/gpt-5.2-codex" \
  --capabilities full

# Use preset
work notify target add my-reviewer --preset code-review
```

---

## 12. Testing Commands

```bash
# Test target without sending prompt
work notify target test my-opencode-acp

# Output:
# ✓ Spawning process... OK
# ✓ Initializing protocol... OK (1.2s)
# ✓ Creating session... OK (6.5s)
# ✓ Sending test prompt... OK (0.3s)
# ✓ Receiving response... OK
# 
# Target is healthy and ready to use.
```

---

## 13. Migration from HTTP/Webhook Targets

If you already have HTTP notification targets:

```bash
# Old HTTP target
work notify target add old-webhook \
  --type http \
  --url "https://example.com/notify"

# New ACP target (more powerful)
work notify target add new-acp \
  --type acp \
  --cmd "opencode acp"

# ACP advantages:
# - Bidirectional communication
# - Session context/history
# - Model selection
# - File system access
# - Streaming responses
```

---

## 14. Security Considerations

### Sensitive Projects

```bash
# Read-only for security audits
work notify target add security-review \
  --type acp \
  --cmd "opencode acp" \
  --capabilities readonly

# No file system access
work notify target add prompt-only \
  --type acp \
  --cmd "opencode acp" \
  --capabilities minimal
```

### Credential Isolation

OpenCode ACP uses local OpenCode installation's credentials:
- User must be authenticated: `opencode auth login`
- Credentials never exposed to `work` CLI
- Each user has their own OpenCode instance

---

## 15. Troubleshooting

### Target Won't Initialize

```bash
# Check OpenCode is installed
which opencode

# Check authentication
opencode auth status

# Test manually
opencode acp --cwd "$(pwd)"

# Check work CLI logs
work notify target test my-opencode-acp --verbose
```

### Session Creation Slow

```bash
# Normal: 5-7 seconds on first session
# If longer, check:
# - Network connection (downloads models)
# - Disk space
# - OpenCode version: opencode --version
```

### Process Crashes

```bash
# View OpenCode logs
work notify target logs my-opencode-acp

# Reset target
work notify target reset my-opencode-acp

# Recreate from scratch
work notify target remove my-opencode-acp
work notify target add my-opencode-acp --type acp --cmd "opencode acp"
```

---

## 16. Summary: Recommended Minimal Setup

```bash
# 1. Add target (minimal config)
work notify target add ai \
  --type acp \
  --cmd "opencode acp"

# 2. Send prompt
work notify send "Review my code" to ai

# That's it! Work CLI handles:
# - Process spawning
# - Protocol initialization  
# - Session creation & persistence
# - Response streaming
# - Process cleanup
```

---

## 17. Advanced: Multiple Modes

```bash
# Build mode for implementation
work notify target add builder \
  --type acp \
  --cmd "opencode acp" \
  --mode build

# Plan mode for architecture
work notify target add planner \
  --type acp \
  --cmd "opencode acp" \
  --mode plan

# Use appropriately
work notify send "Implement user auth" to builder
work notify send "Design system architecture" to planner
```

---

## Implementation Priority

### MVP (Phase 1): ✅ COMPLETE (2026-02-02)
1. ✅ Basic target add with `--type acp --cmd`
2. ✅ Simple send command
3. ✅ Session persistence (hardcode `persist` strategy)
4. ✅ Target list/show/remove

**Implementation Details:**
- Handler: `src/core/target-handlers/acp-handler.ts` (generic, works with any ACP client)
- Tests: `tests/e2e/acp-integration.test.ts` (using OpenCode as example)
- Unit tests: `tests/unit/core/target-handlers/acp-handler.test.ts`
- Coverage: Unit tests pass, E2E tests pass (OpenCode integration verified)

### Phase 2:
5. ⏳ Model override in send
6. ⏳ Capabilities presets (readonly, full, minimal)
7. ⏳ Session management commands

### Phase 3:
8. ⏳ Multiple session strategies
9. ⏳ Presets
10. ⏳ Advanced testing/troubleshooting

---

## References

- See `complete-acp-test.js` for raw JSON-RPC implementation
- See `SESSION-RESUME-GUIDE.md` for session management
- See `AGENTS-MODELS-PERMISSIONS.md` for model/capability details
- See `SDK-EVALUATION.md` for why raw JSON-RPC is recommended

---

**Status**: Design complete - Ready for implementation

**Recommendation**: Start with MVP (Phase 1) using raw JSON-RPC as proven in PoC.
