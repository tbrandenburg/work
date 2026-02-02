# OpenCode Integration PoC - Results

## Executive Summary

**Core Finding**: OpenCode provides **two distinct interfaces**:
1. **`opencode serve`** - Web UI server (HTTP + WebSockets)
2. **`opencode acp`** - Programmatic API (JSON-RPC over stdin/stdout)

For programmatic integration, **use `opencode acp`** (Agent Client Protocol).

## Questions Answered

### ✓ Q1: How to spawn several opencode servers with different system prompts?

**Answer**: You don't spawn multiple `opencode serve` instances. Instead:
- Use **one** `opencode acp` process per agent configuration
- Each ACP process runs as a subprocess with its own configuration
- System prompts are set per-session, not per-server

**Evidence**:
- `opencode serve --port 0` auto-assigns ports (4096 default, then random)
- Multiple servers work but serve the same web UI
- No system prompt isolation between `serve` instances

### ✓ Q2: Are ports automatically chosen?

**Answer**: YES, when using `--port 0`
- First server: port 4096 (default)
- Additional servers: random high ports (e.g., 35373, 5555)

**Evidence**: See `explore.sh` output

### ✓ Q3: Is there a JSON return to analyze server properties?

**Answer**: 
- **`opencode serve`**: NO - serves HTML web UI, not JSON API
- **`opencode acp`**: YES - JSON-RPC protocol with structured responses

**Evidence**: 
- All `/api/*` endpoints on `serve` return HTML
- `acp` initialize returns:
  ```json
  {
    "protocolVersion": 1,
    "agentCapabilities": {
      "loadSession": true,
      "mcpCapabilities": { "http": true, "sse": true },
      "promptCapabilities": { "embeddedContext": true, "image": true },
      "sessionCapabilities": { "fork": {}, "list": {}, "resume": {} }
    },
    "agentInfo": { "name": "OpenCode", "version": "1.1.36" }
  }
  ```

### ✓ Q4: How to start server, connect later, and post prompts with JSON responses?

**Answer**: Use Agent Client Protocol (ACP) flow:

```javascript
// 1. Start ACP subprocess
const acp = spawn('opencode', ['acp', '--cwd', '/path/to/project']);

// 2. Initialize protocol
send({ method: 'initialize', params: {
  protocolVersion: 1,
  clientInfo: { name: 'my-client', version: '1.0' },
  capabilities: { fileSystem: { readTextFile: true } }
}});

// 3. Create session
send({ method: 'session/new', params: {
  cwd: '/path/to/project',
  mcpServers: []
}});
// → Returns: { sessionId: 'ses_xyz...' }

// 4. Send prompts
send({ method: 'session/prompt', params: {
  sessionId: 'ses_xyz...',
  content: [{ role: 'user', content: 'Write hello world' }]
}});
// → Streams back session/update notifications with responses
```

### ✓ Q5: How to select models, agents, and permissions?

**Answer**:
- **Models**: Returned in `session/new` response:
  ```json
  {
    "currentModelId": "openai/gpt-5.2-codex",
    "availableModels": [
      { "modelId": "github-copilot/gemini-3-pro-preview", ...},
      { "modelId": "anthropic/claude-3-5-sonnet-20241022", ...}
    ]
  }
  ```
- **Agents**: No separate "agent" concept - OpenCode is the agent
- **Permissions**: Set via `capabilities` in `initialize`:
  - `fileSystem`: `{ readTextFile, writeTextFile, listDirectory }`
  - `terminal`: `{ create, sendText }`
  - `editor`: `{ applyDiff, openFile }`

## Architecture Summary

```
┌─────────────────┐
│  Your App/IDE   │
└────────┬────────┘
         │
         │ spawn + stdio
         ▼
┌─────────────────┐
│  opencode acp   │  ← JSON-RPC over stdin/stdout
│                 │  ← Stateful sessions
│  [ACP Server]   │  ← Model/tool execution
└─────────────────┘
```

## Key Findings

1. **`opencode serve` is NOT for programmatic use** - it's a web UI
2. **`opencode acp` is the programmatic interface** - JSON-RPC protocol
3. **Sessions are stateful** - maintain context across prompts
4. **Session creation is slow** (~5-7 seconds) - bootstraps environment
5. **Responses are streamed** via `session/update` notifications
6. **No authentication required** for local ACP (subprocess model)

## Limitations Discovered

- **No multi-tenant support** - one session per ACP process
- **Slow session bootstrap** - 5-7s to create first session
- **No session migration** - can't transfer session between processes
- **Tightly coupled to directory** - CWD is required and fixed per session

## Files Created

- `explore.sh` - Multi-server port assignment test (bash)
- `explore-acp.js` - Initial ACP exploration (incomplete)
- `explore-http-api.js` - HTTP API exploration (incomplete)
- `test-single-server.js` - Single server HTTP test
- `test-acp-protocol.js` - Initial ACP protocol test
- `complete-acp-test.js` - **WORKING ACP INTEGRATION** ← Use this
- `findings.json` - HTTP API findings
- `acp-results.json` - ACP protocol test results

## Next Steps

See [README.md](README.md) for usage guide.
See [POC_NOTES.md](POC_NOTES.md) for implementation shortcuts.
