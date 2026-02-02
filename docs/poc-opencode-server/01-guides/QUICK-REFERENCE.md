# Quick Reference: Agents, Models & Permissions

## TL;DR

```javascript
// 1. AGENT: OpenCode (no selection needed)
const acp = spawn('opencode', ['acp', '--cwd', '/project']);

// 2. PERMISSIONS: Set on initialize
send('initialize', {
  protocolVersion: 1,
  clientInfo: { name: 'my-app', version: '1.0' },
  capabilities: {
    fileSystem: { readTextFile: true, writeTextFile: true },
    terminal: { create: true, sendText: true },
    editor: { applyDiff: true, openFile: true }
  }
});

// 3. MODELS: Select per-prompt (31 available)
send('session/prompt', {
  sessionId: 'ses_xyz',
  model: 'github-copilot/claude-sonnet-4.5',  // ← Select here
  content: [{ role: 'user', content: 'Your prompt' }]
});

// 4. MODES: Switch between 'build' and 'plan'
send('session/configure', {
  sessionId: 'ses_xyz',
  mode: 'plan'  // or 'build'
});
```

---

## Agents

**One agent: OpenCode**

| Action | Method |
|--------|--------|
| Get agent info | Check `initialize` response → `agentInfo` |
| Multiple agents | Spawn multiple ACP processes |

---

## Models (31 Available)

**Providers:**
- `github-copilot/*` - 19 models (GPT-5.2, Claude 4.5, Gemini 3)
- `openai/*` - 6 models (GPT-5.2 OAuth, GPT-5.1)
- `opencode/*` - 6 models (Big Pickle, free models)

**Selection:**

| Method | Code | Use Case |
|--------|------|----------|
| Per-prompt | `session/prompt` + `model` param | Different models for different tasks |
| Session default | `session/configure` + `modelId` | Change default for all prompts |
| Startup flag | `--model` CLI flag | Set at process start |

**Discovery:**
```javascript
// Create session to see available models
const result = await send('session/new', { cwd: '.', mcpServers: [] });
console.log(result.models.availableModels);
```

---

## Modes (2 Available)

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `build` | Direct implementation | Clear requirements, ready to code |
| `plan` | Planning & architecture | Complex systems, need design first |

**Switching:**
```javascript
send('session/configure', { sessionId, mode: 'plan' });
```

---

## Permissions (Capabilities)

**Set once during `initialize`:**

### File System
```javascript
fileSystem: {
  readTextFile: true,    // Read files
  writeTextFile: true,   // Write files
  listDirectory: true,   // List dirs
  deleteFile: false      // Delete files (usually false)
}
```

### Terminal
```javascript
terminal: {
  create: true,     // Create terminal
  sendText: true,   // Run commands
  close: true       // Close terminal
}
```

### Editor
```javascript
editor: {
  applyDiff: true,   // Apply code changes
  openFile: true,    // Open files
  showDiff: true     // Show diffs
}
```

**Security Levels:**

```javascript
// Read-only
capabilities: {
  fileSystem: { readTextFile: true }
}

// Safe mode
capabilities: {
  fileSystem: { readTextFile: true, writeTextFile: true },
  terminal: { create: false }  // No command execution
}

// Full access
capabilities: {
  fileSystem: { readTextFile: true, writeTextFile: true, deleteFile: true },
  terminal: { create: true, sendText: true },
  editor: { applyDiff: true, openFile: true }
}
```

---

## Complete Flow

```javascript
// 1. Start agent
const acp = spawn('opencode', ['acp', '--cwd', '/project']);

// 2. Initialize with permissions
await send('initialize', {
  protocolVersion: 1,
  clientInfo: { name: 'my-app', version: '1.0' },
  capabilities: { /* permissions */ }
});

// 3. Create session (discover models)
const { sessionId, models } = await send('session/new', {
  cwd: '/project',
  mcpServers: []
});

// 4. Set mode
await send('session/configure', { sessionId, mode: 'build' });

// 5. Send prompt with model
await send('session/prompt', {
  sessionId,
  model: 'github-copilot/claude-sonnet-4.5',
  content: [{ role: 'user', content: 'Write code' }]
});
```

---

## Common Patterns

### Pattern: Task-Specific Models
```javascript
// Code generation
model: 'github-copilot/gpt-5.2-codex'

// Reasoning/planning
model: 'github-copilot/claude-sonnet-4.5'

// Quick responses
model: 'github-copilot/gpt-5-mini'
```

### Pattern: Progressive Permissions
```javascript
// Start restricted
capabilities: { fileSystem: { readTextFile: true } }

// Ask user before write operations
if (userConfirms('Allow file write?')) {
  // Grant permission for this operation
}
```

### Pattern: Mode Switching
```javascript
// Plan first
await configure({ mode: 'plan' });
await prompt('Design the architecture');

// Then build
await configure({ mode: 'build' });
await prompt('Implement the design');
```

---

## Files

- **AGENTS-MODELS-PERMISSIONS.md** - Detailed guide
- **models-permissions-demo.js** - Working code
- This file - Quick reference

**Status:** ✅ Complete
