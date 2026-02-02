# Session Resume - Complete Guide

## Answer: YES, you can resume ACP sessions! ✅

OpenCode ACP provides **three** session persistence features:

### 1. `session/list` - List All Sessions
Lists all available sessions with their metadata.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "session/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "sessions": [
      {
        "sessionId": "ses_xyz...",
        "title": "My Conversation",
        "cwd": "/path/to/project",
        "updatedAt": "2026-02-02T07:47:31.552Z"
      }
    ]
  }
}
```

### 2. `session/load` - Resume WITH History Replay
Loads an existing session and replays the full conversation history.

**When to use:** Client needs complete message history restored

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "session/load",
  "params": {
    "sessionId": "ses_xyz...",
    "cwd": "/path/to/project",
    "mcpServers": []
  }
}
```

**Response:**
- Initial response with session details
- Multiple `session/update` notifications replaying history

### 3. `session/resume` - Resume WITHOUT History Replay
Continues an existing session without replaying messages (lightweight).

**When to use:** Agent retains context, client doesn't need history

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "session/resume",
  "params": {
    "sessionId": "ses_xyz...",
    "cwd": "/path/to/project",
    "mcpServers": []
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "sessionId": "ses_xyz...",
    "models": { ... },
    "modes": { ... }
  }
}
```

---

## Comparison

| Feature | session/load | session/resume |
|---------|--------------|----------------|
| **History replay** | ✅ Yes | ✗ No |
| **Speed** | Slower | Faster |
| **Client gets history** | ✅ Yes | ✗ No |
| **Context retained** | ✅ Yes | ✅ Yes |
| **Use case** | Client needs full history | Quick continuation |

---

## Capability Detection

Check if agent supports these features in `initialize` response:

```json
{
  "agentCapabilities": {
    "loadSession": true,          // Supports session/load
    "sessionCapabilities": {
      "resume": {},               // Supports session/resume
      "list": {},                 // Supports session/list
      "fork": {}                  // Supports forking sessions
    }
  }
}
```

OpenCode **supports all three** features. ✅

---

## Session Persistence

**Sessions persist:**
- ✅ Across ACP process restarts
- ✅ Across system reboots
- ✅ Full conversation history
- ✅ Context and file state
- ✅ Model selection
- ✅ Mode settings

**Location:** Sessions are stored in OpenCode's data directory  
(`~/.config/opencode/sessions/` or similar)

---

## Working Example

See `session-resume-WORKING.js` for a complete implementation that:
1. Lists available sessions
2. Shows session details (ID, title, directory, timestamp)
3. Demonstrates both load and resume methods
4. Handles responses correctly

**Run it:**
```bash
cd dev/poc-opencode-server
node session-resume-WORKING.js
```

---

## Practical Usage Patterns

### Pattern 1: Resume Last Session on Startup
```javascript
// List sessions
const { sessions } = await send('session/list', {});

// Resume most recent
if (sessions.length > 0) {
  const latest = sessions[0];
  await send('session/resume', {
    sessionId: latest.sessionId,
    cwd: latest.cwd,
    mcpServers: []
  });
}
```

### Pattern 2: Load Specific Session by Title
```javascript
const { sessions } = await send('session/list', {});

const target = sessions.find(s => 
  s.title.includes('Python project')
);

if (target) {
  await send('session/load', {
    sessionId: target.sessionId,
    cwd: target.cwd,
    mcpServers: []
  });
}
```

### Pattern 3: Session Picker UI
```javascript
// Show user a list of sessions
const { sessions } = await send('session/list', {});

sessions.forEach((s, i) => {
  console.log(`${i}. ${s.title} (${new Date(s.updatedAt).toLocaleString()})`);
});

// User selects one
const choice = await getUserChoice();
const selected = sessions[choice];

await send('session/resume', {
  sessionId: selected.sessionId,
  cwd: selected.cwd,
  mcpServers: []
});
```

---

## Benefits

**For Users:**
- Don't lose work when app closes
- Continue conversations later
- Switch between projects seamlessly

**For Developers:**
- State management handled by OpenCode
- No need to persist messages yourself
- Consistent across all ACP clients

---

## Implementation Notes

1. **Always include `cwd` and `mcpServers`** - Required for load/resume
2. **Use resume for speed** - Unless you need message history
3. **Handle streaming updates** - Load sends history via notifications
4. **Check capabilities first** - Not all agents support all methods
5. **Session IDs are opaque** - Don't parse or construct them

---

## Error Handling

Common errors:

```json
{
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "cwd": { "_errors": ["Required"] }
    }
  }
}
```

**Solution:** Include `cwd` and `mcpServers` in params

```json
{
  "error": {
    "code": -32600,
    "message": "Session not found"
  }
}
```

**Solution:** Session may have been deleted or expired

---

## Future: Session Forking

OpenCode also advertises `fork` capability for creating branches:

```json
"sessionCapabilities": {
  "fork": {}  // Create alternate timeline
}
```

This allows exploring "what if" scenarios without modifying the main session.

---

## Summary

✅ **YES, ACP sessions can be resumed**

Three methods:
- `session/list` - See all sessions
- `session/load` - Resume with history (slow)
- `session/resume` - Resume without history (fast)

Sessions persist across:
- Process restarts
- System reboots  
- Different clients

OpenCode fully supports all session management features.

---

## Files

- `session-resume-WORKING.js` - Working example
- `session-list.json` - Sample session list data
- This document - Complete reference

**Status:** ✅ Feature confirmed and working
