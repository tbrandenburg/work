# Investigation: Add streaming notification support to ACP handler

**Issue**: #995 (https://github.com/tbrandenburg/work/issues/995)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-02T17:20:11.993Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                                                  |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Enhances user experience with real-time feedback but not blocking MVP; PoC already demonstrates value, and only affects long-running AI operations                        |
| Complexity | LOW    | Single file change (acp-handler.ts), isolated modification to handleMessage(), optional callback pattern maintains backward compatibility, +15 lines of implementation   |
| Confidence | HIGH   | Clear implementation path with PoC reference, existing message routing infrastructure, straightforward callback pattern, well-tested message handling already in place    |

---

## Problem Statement

The ACP handler currently ignores all JSON-RPC notifications (messages without `id` field) at line 140 of `acp-handler.ts`. The PoC demonstrates that `session/update` streaming notifications provide valuable real-time progress feedback during long AI responses, but this functionality is not available in the production code.

---

## Analysis

### Root Cause / Change Rationale

**Current Limitation**: The `handleMessage()` method in `ACPTargetHandler` only processes RPC responses (messages with an `id` field that match pending requests). All other messages are silently ignored with a comment at line 140.

**Why This Matters**: 
- ACP clients can send streaming notifications using JSON-RPC 2.0 notification format (no `id` field)
- The PoC at `dev/poc-opencode-server/03-demos/complete-acp-test.js:76-80` demonstrates handling `session/update` notifications
- These provide incremental progress updates during long AI responses, improving user experience
- Currently, users have no visibility into AI response generation progress

**Design Decision**:
The proposed solution adds an optional callback mechanism to `ACPTargetConfig` that gets invoked when notifications are received. This maintains backward compatibility (existing code without callbacks continues to ignore notifications) while enabling consumers to opt-in to streaming updates.

### Evidence Chain

**CURRENT BEHAVIOR:**
↓ **File**: `src/core/target-handlers/acp-handler.ts:129-141`

```typescript
private handleMessage(msg: ACPMessage): void {
  if (msg.id && this.pendingRequests.has(msg.id)) {
    const { resolve, reject } = this.pendingRequests.get(msg.id)!;
    this.pendingRequests.delete(msg.id);

    if (msg.error) {
      reject(new ACPError(msg.error.message, 'ACP_RPC_ERROR'));
    } else {
      resolve(msg.result);
    }
  }
  // Ignore notifications (no id)  ← Line 140: BLOCKS ALL NOTIFICATIONS
}
```

↓ **BECAUSE**: No code path exists to handle messages without `id`

↓ **EVIDENCE FROM POC**: `dev/poc-opencode-server/03-demos/complete-acp-test.js:76-80`

```javascript
// Handle streaming notifications
if (msg.method === 'session/update') {
  console.log('  Streaming update:', JSON.stringify(msg.params).substring(0, 150));
  results.responses.push({ notification: msg.method, params: msg.params });
}
```

↓ **ROOT CAUSE**: Missing callback mechanism in `ACPTargetConfig` to route notifications to consumers

### Affected Files

| File                         | Lines   | Action | Description                                                |
| ---------------------------- | ------- | ------ | ---------------------------------------------------------- |
| `src/types/notification.ts`  | 38-44   | UPDATE | Add optional `onNotification` callback to ACPTargetConfig  |
| `src/core/target-handlers/acp-handler.ts` | 25-30   | UPDATE | Store current config to access callback                    |
| `src/core/target-handlers/acp-handler.ts` | 56-70   | UPDATE | Store config reference in send() method                    |
| `src/core/target-handlers/acp-handler.ts` | 129-141 | UPDATE | Handle notifications by invoking callback                  |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | NEW     | UPDATE | Add test cases for notification handling                   |

### Integration Points

**Upstream Callers:**
- `NotificationService.sendNotification()` (`src/core/notification-service.ts:50`) - Dispatches to handler
- Engine instantiates and registers handler (`src/core/engine.ts:~145`)

**Message Flow:**
1. ACP client sends notification: `{"jsonrpc":"2.0","method":"session/update","params":{...}}`
2. Received in `setupMessageHandler()` (line 108-127) via stdout EventEmitter
3. Parsed and routed to `handleMessage()` (line 129-141)
4. **NEW**: If `msg.method` exists and callback registered, invoke callback with params

**No Breaking Changes:**
- Existing consumers without callback continue to ignore notifications
- Only RPC responses (with `id`) are required for current functionality
- Callback is optional, so existing code works unchanged

### Git History

- **Introduced**: commit `fed1eb34` - 2026-02-02 - "Feature: ACP (Agent Client Protocol) Notification Target (#976)"
- **Last modified**: Same commit (fresh implementation)
- **Implication**: Brand new feature, no regression risk; ignore behavior was intentional placeholder for future enhancement

---

## Implementation Plan

### Step 1: Add notification callback to ACPTargetConfig interface

**File**: `src/types/notification.ts`
**Lines**: 38-44
**Action**: UPDATE

**Current code:**

```typescript
export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string; // Mutable to allow session persistence
}
```

**Required change:**

```typescript
export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string; // Mutable to allow session persistence
  onNotification?: (method: string, params: unknown) => void; // NEW: Optional streaming callback
}
```

**Why**: This provides the mechanism for consumers to register a handler for incoming notifications. The callback receives both the notification method name and parameters for flexible handling of different notification types.

---

### Step 2: Store config reference in ACPTargetHandler class

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 25-30
**Action**: UPDATE

**Current code:**

```typescript
export class ACPTargetHandler implements TargetHandler {
  private processes = new Map<string, ChildProcess>();
  private pendingRequests = new Map<
    number,
    { resolve: (result: unknown) => void; reject: (error: Error) => void }
  >();
  private requestId = 0;
```

**Required change:**

```typescript
export class ACPTargetHandler implements TargetHandler {
  private processes = new Map<string, ChildProcess>();
  private pendingRequests = new Map<
    number,
    { resolve: (result: unknown) => void; reject: (error: Error) => void }
  >();
  private requestId = 0;
  private currentConfig: ACPTargetConfig | null = null; // NEW: Track current config for callback access
```

**Why**: We need access to the config (specifically the callback) in `handleMessage()`. Storing it as an instance variable allows message handler to invoke the notification callback.

---

### Step 3: Store config in send() method

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 56-70
**Action**: UPDATE

**Current code:**

```typescript
async send(config: TargetConfig, notification: Notification): Promise<unknown> {
  if (config.type !== 'acp') {
    throw new ACPError('Invalid config type for ACP handler', 'INVALID_CONFIG');
  }

  const acpConfig = config as ACPTargetConfig;

  // Ensure process is running
  this.ensureProcess(acpConfig);

  // Initialize session if needed
  if (!acpConfig.sessionId) {
    const sessionId = await this.initializeSession(acpConfig);
    (acpConfig as { sessionId: string }).sessionId = sessionId;
  }
```

**Required change:**

```typescript
async send(config: TargetConfig, notification: Notification): Promise<unknown> {
  if (config.type !== 'acp') {
    throw new ACPError('Invalid config type for ACP handler', 'INVALID_CONFIG');
  }

  const acpConfig = config as ACPTargetConfig;
  this.currentConfig = acpConfig; // NEW: Store config for callback access

  // Ensure process is running
  this.ensureProcess(acpConfig);

  // Initialize session if needed
  if (!acpConfig.sessionId) {
    const sessionId = await this.initializeSession(acpConfig);
    (acpConfig as { sessionId: string }).sessionId = sessionId;
  }
```

**Why**: This captures the config with its callback before processing begins, making it available in the message handler.

---

### Step 4: Handle notifications in handleMessage()

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 129-141
**Action**: UPDATE

**Current code:**

```typescript
private handleMessage(msg: ACPMessage): void {
  if (msg.id && this.pendingRequests.has(msg.id)) {
    const { resolve, reject } = this.pendingRequests.get(msg.id)!;
    this.pendingRequests.delete(msg.id);

    if (msg.error) {
      reject(new ACPError(msg.error.message, 'ACP_RPC_ERROR'));
    } else {
      resolve(msg.result);
    }
  }
  // Ignore notifications (no id)
}
```

**Required change:**

```typescript
private handleMessage(msg: ACPMessage): void {
  if (msg.id && this.pendingRequests.has(msg.id)) {
    const { resolve, reject } = this.pendingRequests.get(msg.id)!;
    this.pendingRequests.delete(msg.id);

    if (msg.error) {
      reject(new ACPError(msg.error.message, 'ACP_RPC_ERROR'));
    } else {
      resolve(msg.result);
    }
  } else if (msg.method && this.currentConfig?.onNotification) {
    // NEW: Handle notifications by invoking callback
    this.currentConfig.onNotification(msg.method, msg.params);
  }
  // Otherwise ignore unhandled notifications
}
```

**Why**: This adds the notification handling path. When a message has a `method` (indicating it's a notification) and a callback is registered, we invoke it with the method name and parameters. This matches the PoC pattern.

---

### Step 5: Add test cases for notification handling

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Action**: UPDATE (add new test suite)

**Test cases to add:**

```typescript
describe('notification handling', () => {
  it('should invoke onNotification callback for session/update', () => {
    const notifications: Array<{ method: string; params: unknown }> = [];
    
    const configWithCallback: ACPTargetConfig = {
      ...mockConfig,
      onNotification: (method, params) => {
        notifications.push({ method, params });
      }
    };

    (handler as any).ensureProcess(configWithCallback);
    (handler as any).currentConfig = configWithCallback;

    // Simulate notification from ACP client
    const notification = {
      jsonrpc: '2.0',
      method: 'session/update',
      params: { progress: 50, message: 'Processing...' }
    };

    mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');

    // Verify callback was invoked
    expect(notifications).toHaveLength(1);
    expect(notifications[0].method).toBe('session/update');
    expect(notifications[0].params).toEqual({ progress: 50, message: 'Processing...' });
  });

  it('should handle multiple notifications in sequence', () => {
    const notifications: Array<{ method: string; params: unknown }> = [];
    
    const configWithCallback: ACPTargetConfig = {
      ...mockConfig,
      onNotification: (method, params) => {
        notifications.push({ method, params });
      }
    };

    (handler as any).ensureProcess(configWithCallback);
    (handler as any).currentConfig = configWithCallback;

    // Send multiple notifications
    const notif1 = { jsonrpc: '2.0', method: 'session/update', params: { step: 1 } };
    const notif2 = { jsonrpc: '2.0', method: 'session/update', params: { step: 2 } };

    mockProcess.stdout.emit('data', JSON.stringify(notif1) + '\n' + JSON.stringify(notif2) + '\n');

    expect(notifications).toHaveLength(2);
    expect(notifications[0].params).toEqual({ step: 1 });
    expect(notifications[1].params).toEqual({ step: 2 });
  });

  it('should ignore notifications when no callback registered', () => {
    // Use config without onNotification callback
    (handler as any).ensureProcess(mockConfig);
    (handler as any).currentConfig = mockConfig;

    const notification = {
      jsonrpc: '2.0',
      method: 'session/update',
      params: { progress: 50 }
    };

    // Should not throw
    expect(() => {
      mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');
    }).not.toThrow();
  });

  it('should handle notifications alongside RPC responses', () => {
    const notifications: Array<{ method: string }> = [];
    
    const configWithCallback: ACPTargetConfig = {
      ...mockConfig,
      onNotification: (method, params) => {
        notifications.push({ method });
      }
    };

    (handler as any).ensureProcess(configWithCallback);
    (handler as any).currentConfig = configWithCallback;

    // Send interleaved notification and RPC response
    const notification = { jsonrpc: '2.0', method: 'session/update', params: {} };
    const response = { jsonrpc: '2.0', id: 1, result: 'ok' };

    mockProcess.stdout.emit(
      'data',
      JSON.stringify(notification) + '\n' + JSON.stringify(response) + '\n'
    );

    // Both should be handled without interference
    expect(notifications).toHaveLength(1);
    expect(notifications[0].method).toBe('session/update');
  });
});
```

**Why**: These tests verify:
1. Notifications invoke the callback when registered
2. Multiple sequential notifications are handled correctly
3. Backward compatibility - no callback means silent ignore (existing behavior)
4. Notifications and RPC responses can be interleaved without conflicts

---

## Patterns to Follow

**From codebase - mirror these exactly:**

### Pattern 1: Optional callback in config

**SOURCE**: Similar pattern exists in Node.js EventEmitter usage throughout codebase

```typescript
// Pattern: Optional callback field in config interfaces
export interface SomeConfig {
  readonly field1: string;
  optionalCallback?: (data: unknown) => void; // Optional, maintains backward compat
}
```

### Pattern 2: Message handling with EventEmitter

**SOURCE**: `src/core/target-handlers/acp-handler.ts:108-127`

```typescript
// Pattern for processing streamed messages
private setupMessageHandler(child: ChildProcess): void {
  let buffer = '';
  child.stdout?.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line) as ACPMessage;
          this.handleMessage(msg); // Route to handler
        } catch (error) {
          // Handle parse errors
        }
      }
    }
  });
}
```

### Pattern 3: Conditional callback invocation

**SOURCE**: Common pattern in codebase for optional callbacks

```typescript
// Pattern: Check callback exists before invoking
if (config?.callbackName) {
  config.callbackName(data);
}
```

---

## Edge Cases & Risks

| Risk/Edge Case                           | Mitigation                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Callback throws exception                | No explicit handling needed - caller is responsible for error handling in their callback                |
| Notification received before config set  | Safe: `this.currentConfig` is null initially, optional chaining prevents invocation                     |
| Multiple concurrent send() calls         | Low risk: Each send() stores its config; last one wins; notifications are per-session                   |
| Message without method field             | Safe: Check `msg.method` exists before invoking callback                                                |
| Backward compatibility                   | Guaranteed: Callback is optional, existing code without it continues to work unchanged                  |
| Partial notifications (buffering)        | Already handled: Existing message buffering in setupMessageHandler() works for all message types        |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Unit tests - verify new tests pass
npm test -- acp-handler.test.ts

# Full test suite
npm test

# Linting
npm run lint
```

### Manual Verification

1. **Create test script** that sends notifications:
   ```javascript
   // test-notifications.js
   const handler = new ACPTargetHandler();
   const config = {
     type: 'acp',
     cmd: 'node dev/poc-opencode-server/03-demos/simple-acp-server.js',
     onNotification: (method, params) => {
       console.log(`Received ${method}:`, params);
     }
   };
   await handler.send(config, testNotification);
   ```

2. **Verify backward compatibility**: Run existing tests without modifications - all should pass

3. **Test with actual ACP client** that emits `session/update` notifications during long responses

---

## Scope Boundaries

**IN SCOPE:**

- Add optional `onNotification` callback to `ACPTargetConfig`
- Modify `handleMessage()` to invoke callback for notifications
- Store config reference to access callback
- Add test cases for notification handling
- Maintain 100% backward compatibility

**OUT OF SCOPE (do not touch):**

- Changes to RPC request/response handling (working correctly)
- Modifications to process management or session initialization
- Other notification types beyond `session/update` (callback handles any method)
- CLI/UI integration (consumer's responsibility to use callback)
- Performance optimization (not identified as issue)
- Message buffering logic (already working for all message types)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-02T17:20:11.993Z
- **Artifact**: `.claude/PRPs/issues/issue-995.md`
- **Related PR**: #976 (introduced ACP handler)
- **PoC Reference**: `dev/poc-opencode-server/03-demos/complete-acp-test.js:76-80`
