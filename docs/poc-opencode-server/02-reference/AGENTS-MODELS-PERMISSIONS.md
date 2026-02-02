# Agents, Models & Permissions in ACP - Complete Guide

## Quick Answer

### 1. **Agents** 
**There is only ONE agent: OpenCode**
- No "agent selection" - OpenCode IS the agent
- One ACP process = one agent instance
- Agent info returned in `initialize` response

### 2. **Models**
**31 models available - select per-prompt or set default**
- Discovered in `session/new` response
- Override per-prompt: Add `model` parameter
- Change default: Use `session/configure` method

### 3. **Permissions**
**Declarative capabilities set during initialization**
- Define what agent CAN do
- Agent requests permission for actions
- Client approves or denies in real-time

---

## 1. Agent Selection

### Concept: OpenCode IS the Agent

OpenCode acts as the AI coding agent. There's no separate "agent" to select - when you spawn `opencode acp`, you're connecting to the OpenCode agent.

### Agent Information

Get agent details from `initialize` response:

```javascript
send('initialize', {
  protocolVersion: 1,
  clientInfo: { name: 'my-app', version: '1.0' },
  capabilities: {}
});

// Response:
{
  "agentInfo": {
    "name": "OpenCode",
    "version": "1.1.36"
  },
  "agentCapabilities": {
    "loadSession": true,
    "mcpCapabilities": { "http": true, "sse": true },
    "promptCapabilities": { "embeddedContext": true, "image": true },
    "sessionCapabilities": { "fork": {}, "list": {}, "resume": {} }
  }
}
```

### Multiple "Agents" = Multiple Processes

To have multiple agents with different configurations:

```javascript
// Agent 1: For Python project
const pythonAgent = spawn('opencode', ['acp', '--cwd', '/path/to/python-project']);

// Agent 2: For JavaScript project  
const jsAgent = spawn('opencode', ['acp', '--cwd', '/path/to/js-project']);

// Each is an independent OpenCode agent instance
```

---

## 2. Model Selection

### Discovery: Available Models

Models are returned when you create a session:

```javascript
send('session/new', {
  cwd: process.cwd(),
  mcpServers: []
});

// Response includes:
{
  "sessionId": "ses_xyz...",
  "models": {
    "currentModelId": "openai/gpt-5.2-codex",
    "availableModels": [
      {
        "modelId": "github-copilot/claude-sonnet-4.5",
        "name": "GitHub Copilot/Claude Sonnet 4.5"
      },
      {
        "modelId": "github-copilot/gpt-5.2-codex",
        "name": "GitHub Copilot/GPT-5.2-Codex"
      },
      // ... 29 more models
    ]
  }
}
```

### Available Model Categories

**31 total models across 3 providers:**

| Provider | Count | Examples |
|----------|-------|----------|
| `github-copilot/*` | 19 | GPT-5.2-Codex, Claude Sonnet 4.5, Gemini 3 Pro |
| `openai/*` | 6 | GPT-5.2-Codex (OAuth), GPT-5.1-Codex-Max |
| `opencode/*` | 6 | Big Pickle, Trinity Large, Kimi K2.5 Free |

### Selection Method 1: Per-Prompt Override

**Most common**: Specify model for each prompt

```javascript
send('session/prompt', {
  sessionId: sessionId,
  model: 'github-copilot/claude-sonnet-4.5',  // ← Select model
  content: [{
    role: 'user',
    content: 'Write a Python function'
  }]
});
```

**Use case:** Different models for different tasks
- Use GPT-5.2-Codex for code generation
- Use Claude Sonnet for reasoning/planning
- Use Gemini for multimodal tasks

### Selection Method 2: Change Session Default

Change the default model for all subsequent prompts:

```javascript
send('session/configure', {
  sessionId: sessionId,
  modelId: 'github-copilot/gpt-5.2-codex'  // New default
});

// Future prompts use this model unless overridden
```

### Selection Method 3: Startup Flag

Set default model when starting ACP:

```bash
opencode acp --model github-copilot/claude-sonnet-4.5
```

Or from code:
```javascript
const acp = spawn('opencode', [
  'acp',
  '--model', 'github-copilot/claude-sonnet-4.5',
  '--cwd', process.cwd()
]);
```

### Model Selection Best Practices

```javascript
// Pattern: Task-specific models
async function generateCode(prompt) {
  return send('session/prompt', {
    sessionId,
    model: 'github-copilot/gpt-5.2-codex',  // Best for code
    content: [{ role: 'user', content: prompt }]
  });
}

async function planArchitecture(prompt) {
  return send('session/prompt', {
    sessionId,
    model: 'github-copilot/claude-sonnet-4.5',  // Best for reasoning
    content: [{ role: 'user', content: prompt }]
  });
}

async function quickResponse(prompt) {
  return send('session/prompt', {
    sessionId,
    model: 'github-copilot/gpt-5-mini',  // Fast & cheap
    content: [{ role: 'user', content: prompt }]
  });
}
```

---

## 3. Modes Selection

OpenCode has **two modes**:

### Available Modes

```javascript
{
  "modes": {
    "currentModeId": "build",
    "availableModes": [
      { "id": "build", "name": "build" },
      { "id": "plan", "name": "plan" }
    ]
  }
}
```

### Mode Differences

| Mode | Behavior | When to Use |
|------|----------|-------------|
| **build** | Direct implementation, writes code immediately | Ready to implement, clear requirements |
| **plan** | Planning and design, thinks through approach first | Complex problems, need architecture first |

### Switching Modes

```javascript
// Switch to planning mode
send('session/configure', {
  sessionId: sessionId,
  mode: 'plan'
});

// Later, switch to building
send('session/configure', {
  sessionId: sessionId,
  mode: 'build'
});
```

### Mode Selection Pattern

```javascript
// Start with planning for complex tasks
send('session/configure', { sessionId, mode: 'plan' });
send('session/prompt', { 
  sessionId, 
  content: [{ role: 'user', content: 'Design a microservices architecture' }]
});

// Switch to build for implementation
send('session/configure', { sessionId, mode: 'build' });
send('session/prompt', { 
  sessionId, 
  content: [{ role: 'user', content: 'Implement the API gateway' }]
});
```

---

## 4. Permissions (Capabilities)

### Concept: Declarative Security

Permissions are declared upfront during `initialize`. The agent knows what it's allowed to do.

### Setting Permissions

```javascript
send('initialize', {
  protocolVersion: 1,
  clientInfo: { name: 'my-app', version: '1.0' },
  capabilities: {
    // File system permissions
    fileSystem: {
      readTextFile: true,      // Can read files
      writeTextFile: true,     // Can write files  
      listDirectory: true,     // Can list directories
      deleteFile: false        // CANNOT delete files
    },
    
    // Terminal permissions
    terminal: {
      create: true,            // Can create terminal sessions
      sendText: true,          // Can send commands
      close: true              // Can close terminals
    },
    
    // Editor permissions
    editor: {
      applyDiff: true,         // Can apply code changes
      openFile: true,          // Can open files
      showDiff: true,          // Can show diffs
      closeFile: true          // Can close files
    }
  }
});
```

### Permission Categories

#### 1. File System Capabilities

```javascript
fileSystem: {
  readTextFile: boolean,      // Read file contents
  writeTextFile: boolean,     // Write/modify files
  listDirectory: boolean,     // List directory contents
  deleteFile: boolean,        // Delete files
  createDirectory: boolean,   // Create directories
  moveFile: boolean,          // Move/rename files
  copyFile: boolean          // Copy files
}
```

#### 2. Terminal Capabilities

```javascript
terminal: {
  create: boolean,           // Create terminal session
  sendText: boolean,         // Send commands to terminal
  close: boolean,           // Close terminal
  resize: boolean           // Resize terminal
}
```

#### 3. Editor Capabilities

```javascript
editor: {
  applyDiff: boolean,        // Apply code changes
  openFile: boolean,         // Open file in editor
  showDiff: boolean,         // Show diff preview
  closeFile: boolean,        // Close file
  navigate: boolean         // Navigate to line/position
}
```

### Runtime Permission Requests

When the agent needs to perform an action, it sends a request:

```javascript
// Agent → Client
{
  "method": "fileSystem/writeTextFile",
  "params": {
    "path": "/path/to/file.js",
    "content": "console.log('hello');"
  }
}

// Client → Agent (approve)
{
  "jsonrpc": "2.0",
  "id": requestId,
  "result": { "success": true }
}

// OR deny
{
  "jsonrpc": "2.0",
  "id": requestId,
  "error": {
    "code": -32000,
    "message": "User denied permission"
  }
}
```

### Permission Patterns

#### Read-Only Mode
```javascript
capabilities: {
  fileSystem: {
    readTextFile: true,
    writeTextFile: false,   // No modifications
    deleteFile: false
  },
  terminal: {
    create: false,          // No command execution
    sendText: false
  }
}
```

#### Full Access Mode
```javascript
capabilities: {
  fileSystem: {
    readTextFile: true,
    writeTextFile: true,
    listDirectory: true,
    deleteFile: true,
    createDirectory: true
  },
  terminal: {
    create: true,
    sendText: true,
    close: true
  },
  editor: {
    applyDiff: true,
    openFile: true,
    showDiff: true
  }
}
```

#### Safe Mode (Ask First)
```javascript
// Start with minimal permissions
capabilities: {
  fileSystem: { readTextFile: true }  // Only read
}

// Handle permission requests with user confirmation
function handleToolRequest(method, params) {
  if (method === 'fileSystem/writeTextFile') {
    const confirmed = await askUser(
      `Allow OpenCode to write to ${params.path}?`
    );
    
    if (!confirmed) {
      return { 
        error: { code: -32000, message: 'User denied' }
      };
    }
  }
  
  // Execute the operation
  return performOperation(method, params);
}
```

---

## Complete Example

```javascript
import { spawn } from 'child_process';

// 1. Start agent
const acp = spawn('opencode', ['acp', '--cwd', '/my/project']);

// 2. Initialize with permissions
send('initialize', {
  protocolVersion: 1,
  clientInfo: { name: 'my-ide', version: '2.0' },
  capabilities: {
    fileSystem: { readTextFile: true, writeTextFile: true },
    terminal: { create: true, sendText: true },
    editor: { applyDiff: true, showDiff: true }
  }
});

// 3. Create session (get models)
const sessionResponse = await send('session/new', {
  cwd: '/my/project',
  mcpServers: []
});

const { sessionId, models } = sessionResponse;
console.log('Available models:', models.availableModels);

// 4. Set mode
await send('session/configure', {
  sessionId,
  mode: 'build'  // or 'plan'
});

// 5. Send prompt with specific model
await send('session/prompt', {
  sessionId,
  model: 'github-copilot/claude-sonnet-4.5',
  content: [{
    role: 'user',
    content: 'Refactor this function for better performance'
  }]
});
```

---

## Summary

| Aspect | How to Select | When Decided |
|--------|---------------|--------------|
| **Agent** | Spawn `opencode acp` | Process creation |
| **Model** | `model` param in prompt | Per-prompt or session config |
| **Mode** | `session/configure` | Session config (changeable) |
| **Permissions** | `capabilities` in initialize | Initialization (fixed) |

---

## Files

- **`models-permissions-demo.js`** - Working demonstration
- **`models-permissions-results.json`** - Full model list and details
- This guide - Complete reference

**Status:** ✅ All features documented with examples
