# OpenCode Integration Application Guide

## For Application Developers

This guide explains how to integrate OpenCode's Agent Client Protocol (ACP) into your application, IDE, or tool.

---

## Architecture Overview

```
Your Application
       ↓
   Spawn subprocess
       ↓
   opencode acp
       ↓
  JSON-RPC over stdin/stdout
       ↓
   Sessions & Agents
```

---

## Integration Steps

### Step 1: Install OpenCode

**Users must install OpenCode** before your app can use it:

```bash
npm install -g opencode-ai
# or via other installation methods
```

Verify installation:
```bash
opencode --version
# Should output: 1.1.36 or later
```

### Step 2: Authentication (One-time)

Users must authenticate once:

```bash
opencode auth login
```

This links OpenCode to their GitHub account or other providers.

**Check if authenticated** programmatically:
```javascript
const { execSync } = require('child_process');
try {
  execSync('opencode auth status', { stdio: 'pipe' });
  console.log('✓ User is authenticated');
} catch {
  console.log('✗ User needs to run: opencode auth login');
}
```

### Step 3: Spawn ACP Process

Start OpenCode as a subprocess:

```javascript
const { spawn } = require('child_process');

const acp = spawn('opencode', [
  'acp',
  '--cwd', '/path/to/user/project'
], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// stdin: Send JSON-RPC requests
// stdout: Receive JSON-RPC responses
// stderr: Logs (ignore or monitor)
```

### Step 4: Implement JSON-RPC Communication

#### Message Format

**Request**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method_name",
  "params": { ... }
}
```

**Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

**Error**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

#### Send Function

```javascript
let messageId = 0;

function send(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: ++messageId,
    method,
    params
  };
  acp.stdin.write(JSON.stringify(request) + '\n');
  return messageId;
}
```

#### Receive Handler

```javascript
let buffer = '';

acp.stdout.on('data', (data) => {
  buffer += data.toString();
  
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line
  
  for (const line of lines) {
    if (line.trim()) {
      const message = JSON.parse(line);
      handleResponse(message);
    }
  }
});

function handleResponse(message) {
  if (message.id) {
    // Response to our request
    if (message.error) {
      console.error('Error:', message.error);
    } else {
      console.log('Result:', message.result);
    }
  } else if (message.method) {
    // Notification from server
    handleNotification(message);
  }
}
```

### Step 5: Initialize Protocol

```javascript
send('initialize', {
  protocolVersion: 1,
  clientInfo: {
    name: 'my-app-name',
    version: '1.0.0'
  },
  capabilities: {
    fileSystem: {
      readTextFile: true,
      writeTextFile: true,
      listDirectory: true
    },
    terminal: {
      create: true,
      sendText: true
    },
    editor: {
      applyDiff: true,
      openFile: true
    }
  }
});
```

**Wait for response** with `agentCapabilities` and `authMethods`.

### Step 6: Create Session

```javascript
send('session/new', {
  cwd: '/path/to/user/project',
  mcpServers: [] // Optional MCP server configs
});
```

**Response includes**:
- `sessionId`: Use in subsequent calls
- `models`: Available LLMs
- `modes`: Available modes (build, plan, etc.)

**Store the session ID**:
```javascript
let currentSessionId = null;

function handleResponse(message) {
  if (message.id === 2 && message.result.sessionId) {
    currentSessionId = message.result.sessionId;
  }
}
```

### Step 7: Send User Prompts

```javascript
send('session/prompt', {
  sessionId: currentSessionId,
  content: [
    {
      role: 'user',
      content: 'Write a function to calculate fibonacci numbers'
    }
  ]
});
```

**Optional parameters**:
- `model`: Override default model (e.g., `"github-copilot/claude-sonnet-4.5"`)
- `mode`: Set mode (e.g., `"plan"` vs `"build"`)
- `embeddedContext`: Include file contents, screenshots, etc.

### Step 8: Handle Streaming Responses

OpenCode sends **incremental updates** via `session/update` notifications:

```javascript
function handleNotification(message) {
  if (message.method === 'session/update') {
    const { sessionId, update } = message.params;
    
    if (update.messageUpdate) {
      // Message content update
      console.log('Agent says:', update.messageUpdate);
    } else if (update.toolCall) {
      // Agent is using a tool (file edit, terminal command)
      console.log('Tool call:', update.toolCall);
    } else if (update.sessionUpdate) {
      // Session metadata update (commands available, etc.)
      console.log('Session update:', update.sessionUpdate);
    }
  }
}
```

---

## Model Selection

### List Available Models

Models are returned in `session/new` response:

```javascript
{
  "models": {
    "currentModelId": "openai/gpt-5.2-codex",
    "availableModels": [
      {
        "modelId": "github-copilot/gpt-5.2-codex",
        "name": "GitHub Copilot/GPT-5.2-Codex"
      },
      {
        "modelId": "github-copilot/claude-sonnet-4.5",
        "name": "GitHub Copilot/Claude Sonnet 4.5"
      }
      // ... 30+ models
    ]
  }
}
```

### Set Model Per Prompt

```javascript
send('session/prompt', {
  sessionId: currentSessionId,
  model: 'github-copilot/claude-sonnet-4.5', // Override here
  content: [{ role: 'user', content: 'Hello' }]
});
```

### Change Session Default Model

```javascript
send('session/configure', {
  sessionId: currentSessionId,
  modelId: 'github-copilot/gpt-5.2-codex'
});
```

---

## Permission Management

### Declare Capabilities on Initialize

```javascript
{
  capabilities: {
    fileSystem: {
      readTextFile: true,   // Allow reading files
      writeTextFile: true,  // Allow writing files
      listDirectory: true   // Allow listing directories
    },
    terminal: {
      create: true,  // Allow creating terminal sessions
      sendText: true // Allow sending commands
    },
    editor: {
      applyDiff: true,  // Allow applying code changes
      openFile: true    // Allow opening files in editor
    }
  }
}
```

### Handle Tool Requests

When OpenCode needs to use a tool, it sends requests:

```javascript
{
  "method": "fileSystem/readTextFile",
  "params": {
    "path": "/path/to/file.js"
  }
}
```

**Your app must respond**:
```javascript
{
  "jsonrpc": "2.0",
  "id": requestId,
  "result": {
    "content": "file contents here..."
  }
}
```

### Safety: User Confirmation

**Recommended**: Prompt user before destructive operations:

```javascript
function handleToolRequest(method, params) {
  if (method === 'fileSystem/writeTextFile') {
    const confirmed = await showConfirmDialog(
      `OpenCode wants to write to: ${params.path}`
    );
    if (!confirmed) {
      return { error: { code: -32000, message: 'User denied' } };
    }
  }
  // ... proceed with operation
}
```

---

## System Prompts & Configuration

### Per-Session Prompts

System prompts are set via session configuration:

```javascript
send('session/configure', {
  sessionId: currentSessionId,
  systemPrompt: 'You are a Python expert. Always use type hints.'
});
```

### Persistent Configuration

Set in OpenCode's config file (`~/.config/opencode/config.json`):

```json
{
  "defaultModel": "github-copilot/claude-sonnet-4.5",
  "systemPrompt": "You are a helpful coding assistant.",
  "codeStyle": "functional"
}
```

Users can edit this file or use `opencode configure` commands.

---

## Multiple Agent Instances

### Scenario: Multiple Projects

```javascript
// Project 1: Python backend
const acp1 = spawn('opencode', ['acp', '--cwd', '/path/to/backend']);

// Project 2: React frontend
const acp2 = spawn('opencode', ['acp', '--cwd', '/path/to/frontend']);

// Each maintains independent context
```

### Scenario: Specialized Agents

```javascript
// Agent 1: Code reviewer (read-only)
const reviewer = spawn('opencode', ['acp', '--cwd', process.cwd()]);
send(reviewer, 'initialize', {
  capabilities: { fileSystem: { readTextFile: true } } // Read-only
});

// Agent 2: Code writer (full permissions)
const writer = spawn('opencode', ['acp', '--cwd', process.cwd()]);
send(writer, 'initialize', {
  capabilities: {
    fileSystem: { readTextFile: true, writeTextFile: true }
  }
});
```

---

## Error Handling

### Common Errors

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| -32602 | Invalid params | Missing required param | Check params match method signature |
| -32601 | Method not found | Wrong method name | Verify method exists in ACP spec |
| -32700 | Parse error | Malformed JSON | Ensure valid JSON + newline |
| -32000 | User denied | Permission denied by user | Prompt user for permission |

### Retry Strategy

```javascript
async function sendWithRetry(method, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await send(method, params);
      return result;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

---

## Performance Optimization

### 1. Connection Pooling

Keep ACP process alive across multiple requests:

```javascript
class OpencodePool {
  constructor() {
    this.process = null;
    this.sessions = new Map();
  }
  
  async getOrCreateProcess() {
    if (!this.process) {
      this.process = spawn('opencode', ['acp', '--cwd', process.cwd()]);
      await this.initialize();
    }
    return this.process;
  }
  
  async getOrCreateSession(cwd) {
    if (!this.sessions.has(cwd)) {
      const sessionId = await this.createSession(cwd);
      this.sessions.set(cwd, sessionId);
    }
    return this.sessions.get(cwd);
  }
}
```

### 2. Batch Operations

Instead of multiple small requests, batch file reads:

```javascript
// Bad: Multiple requests
const file1 = await readFile('a.js');
const file2 = await readFile('b.js');

// Good: Single request with multiple files
const files = await readFiles(['a.js', 'b.js']);
```

### 3. Streaming

For long responses, process chunks as they arrive:

```javascript
let accumulator = '';

function handleNotification(message) {
  if (message.params.update.messageUpdate?.append) {
    accumulator += message.params.update.messageUpdate.append;
    updateUI(accumulator); // Update incrementally
  }
}
```

---

## Production Checklist

- [ ] Handle ACP process crashes (restart logic)
- [ ] Implement timeout for long-running operations
- [ ] Add logging/telemetry for debugging
- [ ] Version lock ACP protocol (`protocolVersion: 1`)
- [ ] Test authentication failures
- [ ] Handle offline mode gracefully
- [ ] Add user controls (pause/stop/cancel)
- [ ] Monitor memory usage of ACP processes
- [ ] Implement graceful shutdown (close sessions)
- [ ] Test with large codebases (>10k files)

---

## Client Setup Instructions

### For End Users

**Step 1: Install OpenCode**
```bash
npm install -g opencode-ai
```

**Step 2: Authenticate**
```bash
opencode auth login
```

Follow browser prompt to authenticate with GitHub.

**Step 3: (Optional) Configure**
```bash
opencode configure set defaultModel github-copilot/claude-sonnet-4.5
```

**Done!** Your app can now use OpenCode via ACP.

### For App Developers

**Language-Specific SDKs**:
- **Python**: `pip install acp-client` (community package)
- **JavaScript**: Use `child_process` (built-in)
- **Go**: Use `os/exec` package
- **Rust**: `vtcode-acp-client` crate

**Testing**:
```bash
# Verify OpenCode is available
which opencode

# Test ACP manually
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1,"clientInfo":{"name":"test","version":"1.0"},"capabilities":{}}}' | opencode acp
```

---

## Support & Resources

- **ACP Specification**: https://agentclientprotocol.com/
- **OpenCode Docs**: https://opencode.ai/docs/acp/
- **GitHub**: https://github.com/opencode-ai/opencode
- **Discord**: https://discord.gg/opencode

---

## Example: Complete Integration

See `complete-acp-test.js` for a full working example demonstrating:
- Process spawning
- Protocol initialization
- Session creation
- Prompt sending
- Response handling

Run it:
```bash
node complete-acp-test.js
```
