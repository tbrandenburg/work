# OpenCode Integration PoC

## 🎯 Executive Summary

**RECOMMENDATION: Use Raw JSON-RPC (Not SDK)**

This PoC thoroughly evaluates OpenCode integration approaches. After testing both raw JSON-RPC and the official `@agentclientprotocol/sdk`, we recommend **raw JSON-RPC** for programmatic integration.

✅ **Raw JSON-RPC**: Simple (~200 lines), zero dependencies, proven working  
⚠️ **SDK**: Complex (~500+ lines), requires adapter layer, overkill for most use cases

## Overview

This PoC demonstrates how to programmatically integrate with OpenCode using the Agent Client Protocol (ACP). It answers key questions about spawning servers, port management, JSON APIs, message handling, session resumption, model selection, and SDK evaluation.

## 📁 Repository Structure

This PoC is organized into focused directories for easy navigation:

```
dev/poc-opencode-server/
├── 00-planning/              # Research and planning documents
│   ├── POC_NOTES.md         # Initial research and planning notes
│   ├── FINDINGS.md          # Technical findings and insights
│   └── WORK-CLI-INTEGRATION.md  # Integration strategy with work CLI
│
├── 01-guides/               # Step-by-step guides
│   ├── QUICKSTART.md        # Quick getting started guide
│   ├── APPLICATION_GUIDE.md # How to build applications
│   ├── SESSION-RESUME-GUIDE.md  # Session management guide
│   ├── QUICK-REFERENCE.md   # API quick reference
│   └── SDK-EVALUATION.md    # SDK analysis and comparison
│
├── 02-reference/            # Technical reference documentation
│   ├── AGENTS-MODELS-PERMISSIONS.md  # Agent configuration reference
│   ├── INDEX.md             # Complete API documentation index
│   └── SUMMARY.md           # Technical summary
│
├── 03-demos/                # Working code examples
│   ├── explore-acp.js       # ACP protocol exploration
│   ├── complete-acp-test.js # Complete ACP workflow
│   ├── test-sdk.js          # SDK testing
│   └── ... (11 demo files)
│
├── 04-scripts/              # Automation scripts
│   ├── explore.sh           # Exploration automation
│   └── VERIFY.sh            # Verification script
│
└── 05-results/              # Test results and logs
    ├── acp-results.json     # ACP test results
    ├── _COMPLETION_REPORT.txt  # Final report
    └── logs/                # Execution logs
```

### Quick Navigation

- **New to OpenCode?** Start with [`01-guides/QUICKSTART.md`](01-guides/QUICKSTART.md)
- **Building an app?** See [`01-guides/APPLICATION_GUIDE.md`](01-guides/APPLICATION_GUIDE.md)
- **API reference?** Check [`02-reference/INDEX.md`](02-reference/INDEX.md)
- **Working code?** Browse [`03-demos/`](03-demos/)
- **Integration strategy?** Read [`00-planning/WORK-CLI-INTEGRATION.md`](00-planning/WORK-CLI-INTEGRATION.md)

## Quick Start

### Prerequisites

- OpenCode installed (`opencode` in PATH)
- Node.js 16+ (for test scripts)
- Bash (for shell scripts)

### Run the PoC

```bash
cd dev/poc-opencode-server

# Quick test: Single ACP integration (recommended)
node 03-demos/complete-acp-test.js

# View results
cat 05-results/acp-results.json

# Alternative: Test HTTP server behavior
node 03-demos/test-single-server.js

# Alternative: Test port auto-assignment
./04-scripts/explore.sh
```

## Key Takeaways

### 1. Use `opencode acp`, NOT `opencode serve`

**`opencode serve`**: Web UI server (browser interface)
- Serves HTML/CSS/JS for web interface
- No JSON API endpoints
- Not suitable for programmatic integration

**`opencode acp`**: Programmatic API (JSON-RPC)
- JSON-RPC 2.0 over stdin/stdout
- Subprocess communication model
- Full programmatic control

### 2. Protocol Flow

```javascript
// 1. Spawn ACP process
import { spawn } from 'child_process';
const acp = spawn('opencode', ['acp', '--cwd', process.cwd()]);

// 2. Send JSON-RPC messages to stdin
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: 1,
    clientInfo: { name: 'my-app', version: '1.0.0' },
    capabilities: {
      fileSystem: { readTextFile: true, writeTextFile: true }
    }
  }
};
acp.stdin.write(JSON.stringify(request) + '\n');

// 3. Read JSON-RPC responses from stdout
acp.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      const response = JSON.parse(line);
      console.log('Response:', response);
    }
  });
});
```

### 3. Essential Methods

| Method | Purpose | Params |
|--------|---------|--------|
| `initialize` | Start protocol handshake | `protocolVersion`, `clientInfo`, `capabilities` |
| `session/new` | Create conversation session | `cwd`, `mcpServers` |
| `session/prompt` | Send user message | `sessionId`, `content` |
| `session/update` | (Notification) Streaming responses | `sessionId`, `update` |

### 4. Model Selection

Models are returned in `session/new` response. Available models include:
- `github-copilot/gpt-5.2-codex`
- `github-copilot/claude-sonnet-4.5`
- `openai/gpt-5.2-codex`
- `opencode/big-pickle`
- And 30+ more (see `acp-results.json`)

To select a model: Include in `session/prompt` or set via session configuration.

### 5. Permissions

Set capabilities during `initialize`:

```javascript
{
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
}
```

## Architecture

```
┌─────────────────────┐
│   Your Application  │
│   (IDE, CLI, etc.)  │
└──────────┬──────────┘
           │
           │ spawn()
           ▼
    ┌──────────────┐
    │ opencode acp │  ◄─── stdin: JSON-RPC requests
    │              │  ───► stdout: JSON-RPC responses
    └──────────────┘  ───► stderr: logs (INFO, ERROR)
           │
           │ Manages
           ▼
    ┌──────────────┐
    │   Sessions   │  (Stateful conversations)
    │   Models     │  (LLM selection)
    │   Context    │  (File system, project)
    └──────────────┘
```

## System Prompts

System prompts are NOT set per-server. Instead:
1. Use different ACP processes for different configurations
2. Or set prompts within the session context
3. Each ACP process can manage multiple sessions

## Multiple Instances

To run multiple isolated OpenCode instances:

```javascript
// Instance 1: Python project
const acp1 = spawn('opencode', ['acp', '--cwd', '/path/to/python-project']);

// Instance 2: JavaScript project
const acp2 = spawn('opencode', ['acp', '--cwd', '/path/to/js-project']);

// Each has independent sessions, context, and state
```

## Client Setup Requirements

### For End Users
1. Install OpenCode: `npm install -g opencode-ai`
2. Authenticate: `opencode auth login`
3. That's it - ACP works locally without additional setup

### For Integrators
1. **Language**: Any language supporting subprocess spawning
2. **Dependencies**: JSON-RPC 2.0 message handling
3. **I/O**: Line-based stdin/stdout communication
4. **Optional**: WebSocket client (for remote agents)

### Example Clients
- **Python**: Use `subprocess.Popen` + `json` module
- **JavaScript**: Use `child_process.spawn`
- **Go**: Use `os/exec` package
- **Rust**: Use `std::process::Command`

## Performance Notes

- **Session creation**: ~5-7 seconds (bootstraps environment)
- **Subsequent prompts**: Fast (streaming responses)
- **Memory**: ~200-300MB per ACP process
- **Concurrency**: One prompt at a time per session

## Troubleshooting

**Problem**: `session/new` returns "Invalid params"
- **Solution**: Include required params: `cwd` and `mcpServers`

**Problem**: No response from ACP
- **Solution**: Ensure messages end with `\n` (newline)

**Problem**: "Method not found" error
- **Solution**: Check ACP protocol version and method names

**Problem**: Session creation times out
- **Solution**: Wait 8-10 seconds on first session (normal)

## 📚 Complete Documentation

This PoC includes comprehensive documentation covering every aspect of OpenCode integration:

### 🚀 Quick Start
- **[QUICKSTART.md](./QUICKSTART.md)** - 30-second quick start guide
- **[INDEX.md](./INDEX.md)** - Navigation hub for all documentation
- **[MANIFEST.md](./MANIFEST.md)** - File structure and recommended reading order

### 📋 Core Documentation
- **[SUMMARY.md](./SUMMARY.md)** - Executive summary with key findings and recommendations
- **[FINDINGS.md](./FINDINGS.md)** - Detailed answers to all 5 original questions
- **[POC_NOTES.md](./POC_NOTES.md)** - Implementation shortcuts, limitations, and lessons learned

### 📖 Integration Guides
- **[APPLICATION_GUIDE.md](./APPLICATION_GUIDE.md)** - Complete integration guide (12KB)
  - Step-by-step implementation instructions
  - Model selection patterns
  - Permission management
  - Complete working examples
  
- **[SESSION-RESUME-GUIDE.md](./SESSION-RESUME-GUIDE.md)** - Session management reference
  - `session/list` - List all sessions
  - `session/load` - Resume WITH history (slow, complete)
  - `session/resume` - Resume WITHOUT history (fast)

- **[AGENTS-MODELS-PERMISSIONS.md](./AGENTS-MODELS-PERMISSIONS.md)** - Selection guide (11KB)
  - How OpenCode acts as the agent
  - 31 available models and selection methods
  - Permission/capability system explained

- **[QUICK-REFERENCE.md](./QUICK-REFERENCE.md)** - Quick lookup reference
  - Method signatures
  - Model IDs
  - Common patterns

### ⚖️ SDK Evaluation
- **[SDK-EVALUATION.md](./SDK-EVALUATION.md)** - Complete SDK analysis ⭐
  - Can the SDK be used? (Answer: Yes, but not recommended)
  - Detailed comparison: Raw JSON-RPC vs SDK
  - Architecture mismatch analysis
  - Code complexity comparison (200 vs 500+ lines)
  - **Recommendation: Stick with raw JSON-RPC**

### 💻 Working Code Examples

| File | Purpose | Status |
|------|---------|--------|
| **complete-acp-test.js** | Main ACP example (initialize → session) | ✅ WORKING |
| **session-resume-WORKING.js** | Session list/load/resume examples | ✅ WORKING |
| **models-permissions-demo.js** | Model and permission demonstration | ✅ WORKING |
| **explore.sh** | Port auto-assignment test | ✅ WORKING |
| **test-single-server.js** | HTTP API exploration | ✅ WORKING |
| **test-sdk.js** | SDK integration attempt | ⚠️ ERROR (See SDK-EVALUATION.md) |

### 📊 Data Files
- **acp-results.json** - Full ACP protocol responses with 31 models
- **session-list.json** - Sample session data
- **models-permissions-results.json** - Model/capability data
- **findings.json** - HTTP API exploration results

## 🎓 What This PoC Proves

### ✅ All Questions Answered

1. **Multiple servers with different system prompts?**
   - ✅ Spawn multiple ACP processes, each with its own `--cwd`
   - Each process has independent configuration and context

2. **Are ports automatically chosen?**
   - ✅ `opencode serve --port 0` auto-assigns
   - But `opencode acp` uses stdin/stdout (no ports!)

3. **JSON API for server properties?**
   - ✅ `initialize` returns agent info (models, capabilities, version)
   - ✅ Full protocol responses captured in `acp-results.json`

4. **Start server, connect later, send prompts?**
   - ✅ Sessions persist across process restarts
   - ✅ Use `session/resume` to reconnect without history replay

5. **Select models, agents, permissions?**
   - ✅ 31 models available (see `AGENTS-MODELS-PERMISSIONS.md`)
   - ✅ OpenCode IS the agent (no selection needed)
   - ✅ Permissions set during `initialize` as capabilities

### ✅ Bonus: SDK Evaluated

**Question**: Can we use `@agentclientprotocol/sdk` instead of raw JSON-RPC?

**Answer**: SDK works but is NOT recommended for our use case.

**Why Raw JSON-RPC is better:**
- 3x simpler (200 vs 500+ lines)
- Zero dependencies vs 1
- Already proven working
- No stream conversion needed
- Portable to any language

**When SDK is useful:**
- Building full editor extensions
- Need TypeScript type safety
- Building new ACP agents
- Complex permission workflows

See **[SDK-EVALUATION.md](./SDK-EVALUATION.md)** for complete analysis.

## 🏆 Final Recommendation

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ✅ RECOMMENDATION: Use Raw JSON-RPC                ║
║                                                       ║
║   • Simple: ~200 lines of code                       ║
║   • Zero dependencies                                 ║
║   • Proven working in this PoC                       ║
║   • Easy to understand and maintain                  ║
║   • Portable to Python, Go, Rust, etc.              ║
║                                                       ║
║   ⚠️  Do NOT use @agentclientprotocol/sdk            ║
║                                                       ║
║   • Complex: ~500+ lines needed                      ║
║   • Requires Web Streams adapter                     ║
║   • Overkill for simple integrations                 ║
║   • Designed for building agents, not using them     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## Files in This PoC

### Core Implementation
- **complete-acp-test.js** ⭐ Main working example (recommended approach)
- **session-resume-WORKING.js** - Session management examples
- **models-permissions-demo.js** - Model/permission demonstration

### Documentation (12 markdown files)
- See "Complete Documentation" section above for full list
- Start with **INDEX.md** or **QUICKSTART.md**

### Exploration & Testing
- explore.sh, test-*.js - Exploratory scripts
- acp-results.json - Raw protocol responses
- Various .log and .json files

## References

- [Agent Client Protocol Spec](https://agentclientprotocol.com/)
- [OpenCode ACP Docs](https://opencode.ai/docs/acp/)
- [JSON-RPC 2.0 Spec](https://www.jsonrpc.org/specification)

## License

This PoC is for demonstration purposes only.
