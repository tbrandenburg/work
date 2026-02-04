# Investigation: Add --async flag to 'work notify send' for autonomous agent workflows

**Issue**: #1362 (https://github.com/tbrandenburg/work/issues/1362)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-04T06:06:09Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | HIGH   | Blocks autonomous agent workflows as documented in README; affects core value proposition of mixed human-agent teams; requested by project owner with detailed design analysis              |
| Complexity | MEDIUM | Requires 6 files to modify (CLI command, service interface, 3 handlers, engine layer), but changes are surgical and follow existing patterns; no architectural refactoring needed           |
| Confidence | HIGH   | Root cause clearly identified in ACP handler blocking on `await` (lines 72, 83); comprehensive analysis provided in issue including protocol research and implementation plan from project owner |

---

## Problem Statement

The `work notify send` command always blocks waiting for agent completion (with 5-minute default timeout), then kills the process. This prevents autonomous agent workflows where agents should work independently for hours/days after receiving notifications. The feature is documented in README.md for cron-based agent orchestration but not implemented.

---

## Analysis

### Change Rationale

**Why this change is needed:**
- README.md documents autonomous agent use case: `*/5 * * * * work notify send where priority=critical to ai-agent`
- Current implementation blocks CLI for 5-60+ seconds waiting for AI response
- Current implementation kills ACP process after response, preventing long-running work
- This is incompatible with fire-and-forget agent orchestration pattern
- Same agent should support both interactive (synchronous) and autonomous (asynchronous) modes

**What this change enables:**
- True autonomous agent workflows running for hours/days
- Cron-based agent orchestration without blocking
- Same agent configuration for both interactive queries and autonomous work
- Proper fire-and-forget notification pattern for agent-to-agent communication

### Evidence Chain

**SYMPTOM:** Cron-based agent workflows block and fail
```bash
# Current behavior (documented but broken)
*/5 * * * * work notify send where priority=critical to ai-agent
# ^ Blocks for 60s, then kills agent process, preventing autonomous work
```

↓ **BECAUSE:** CLI command always waits for handler completion

**Evidence:** `src/cli/commands/notify/send.ts:114-148`
```typescript
const result = await engine.sendNotification(workItems, target);
// ^ Always awaits - no async flag option exists
```

↓ **BECAUSE:** Engine always awaits notification service

**Evidence:** `src/core/engine.ts:553-579`
```typescript
async sendNotification(workItems, targetName): Promise<NotificationResult> {
  const result = await this.notificationService.sendNotification(workItems, target);
  // ^ Always blocks until handler returns
  await this.saveContexts();  // Must save sessionId for next invocation
  return result;
}
```

↓ **BECAUSE:** NotificationService always awaits handler.send()

**Evidence:** `src/core/notification-service.ts:37-57`
```typescript
async sendNotification(workItems, target): Promise<NotificationResult> {
  const handler = this.targetHandlers.get(target.type);
  return await handler.send(workItems, target.config);
  // ^ Always awaits handler completion - interface has no async option
}
```

↓ **BECAUSE:** ACP handler synchronously waits for AI response

**Evidence:** `src/core/target-handlers/acp-handler.ts:52-104`
```typescript
async send(workItems, config): Promise<NotificationResult> {
  // Line 72: Blocks 5-7s on session initialization
  const sessionId = config.sessionId || (await this.initializeSession(process, config));
  
  // Line 83: Blocks indefinitely (5min timeout) waiting for AI response
  const response = await this.sendPrompt(process, sessionId, prompt, config);
  
  // Line 88: Kills process after response
  setImmediate(() => this.cleanup());
  
  return { success: true, message: `AI response: ${JSON.stringify(response)}...` };
}
```

↓ **ROOT CAUSE:** No mechanism to skip await and keep process alive for async notifications

**The fixable thing:** Add `--async` flag that propagates through all layers, allowing handlers to skip await and avoid cleanup

### Affected Files

| File                                           | Lines      | Action | Description                                                   |
| ---------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| `src/cli/commands/notify/send.ts`              | 20-22      | UPDATE | Add `--async` flag definition                                 |
| `src/cli/commands/notify/send.ts`              | 114-148    | UPDATE | Pass async flag to engine.sendNotification()                  |
| `src/core/engine.ts`                           | 553-579    | UPDATE | Accept options parameter, handle async mode                   |
| `src/core/notification-service.ts`             | 13-18      | UPDATE | Update TargetHandler interface to accept options              |
| `src/core/notification-service.ts`             | 37-57      | UPDATE | Pass options to handler.send()                                |
| `src/core/target-handlers/acp-handler.ts`      | 52-104     | UPDATE | Implement async mode (skip await, don't cleanup)              |
| `src/core/target-handlers/bash-handler.ts`     | 14-41      | UPDATE | Update signature to accept options (ignore for now)           |
| `src/core/target-handlers/telegram-handler.ts` | 9-31       | UPDATE | Update signature to accept options (ignore for now)           |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | NEW | CREATE | Add tests for async mode behavior                             |
| `tests/integration/cli/commands/notify/send.test.ts` | APPEND | UPDATE | Add integration tests for --async flag                        |
| `examples/work-item-prioritization/prioritize.sh` | 32     | UPDATE | Add --async flag to example                                   |

### Integration Points

**Data flow through layers:**
1. CLI Command (`send.ts:114-148`) → Creates engine, calls sendNotification
2. Engine (`engine.ts:553-579`) → Manages context, calls notification service
3. NotificationService (`notification-service.ts:37-57`) → Routes to handler
4. Handler (`acp-handler.ts:52-104`) → Executes notification

**Dependencies:**
- Engine must save sessionId even in async mode (for session reuse)
- ACP process must stay alive in async mode (no cleanup)
- Other handlers (bash, telegram) need interface update but behavior unchanged
- Test framework must handle async process lifecycle

### Git History

**ACP Handler Evolution:**
- **Introduced**: commit `fed1eb3` - "Feature: ACP (Agent Client Protocol) Notification Target (#976)" - Feb 2026
- **Session persistence added**: commit `da2c654` - "Fix: Enable ACP session persistence across CLI invocations (#963)"
- **Recent fixes**: commit `75410c1` - "Fix: Unified configurable timeout for ACP operations (#1363)"
- **Implication**: Synchronous blocking was original design for interactive use case; async capability never implemented despite README documentation

**Notify Send Command:**
- **Introduced**: commit `3ce3527` - "feat: Implement notification system with context persistence (#28)"
- **Enhanced**: Multiple commits adding syntaxes (shorthand, plain messages, optional WHERE)
- **Implication**: Command structure stable, no --async flag ever existed

---

## Implementation Plan

### Step 1: Add --async Flag to CLI Command

**File**: `src/cli/commands/notify/send.ts`
**Lines**: 20-22
**Action**: UPDATE

**Current code:**
```typescript
static override flags = {
  ...BaseCommand.baseFlags,
};
```

**Required change:**
```typescript
static override flags = {
  ...BaseCommand.baseFlags,
  async: Flags.boolean({
    description: 'Send notification asynchronously (fire-and-forget, agent works independently)',
    default: false,
  }),
};
```

**Why**: Enables users to opt-in to async mode per-notification (not per-target configuration)

---

### Step 2: Pass Async Flag to Engine

**File**: `src/cli/commands/notify/send.ts`
**Lines**: 114-148
**Action**: UPDATE

**Current code:**
```typescript
const result = await engine.sendNotification(workItems, target);
```

**Required change:**
```typescript
const { flags } = await this.parse(NotifySend);
const result = await engine.sendNotification(workItems, target, {
  async: flags.async,
});
```

**Why**: Propagate user intent down through the layers

---

### Step 3: Update Engine to Handle Async Mode

**File**: `src/core/engine.ts`
**Lines**: 553-579
**Action**: UPDATE

**Current code:**
```typescript
async sendNotification(
  workItems: WorkItem[],
  targetName: string
): Promise<NotificationResult> {
  const target = targets.find(t => t.name === targetName);
  const result = await this.notificationService.sendNotification(workItems, target);
  await this.saveContexts();
  return result;
}
```

**Required change:**
```typescript
async sendNotification(
  workItems: WorkItem[],
  targetName: string,
  options?: { async?: boolean }
): Promise<NotificationResult> {
  const target = targets.find(t => t.name === targetName);
  
  if (options?.async) {
    // Fire-and-forget: don't await result, but still save sessionId
    const resultPromise = this.notificationService.sendNotification(workItems, target, options);
    
    // Save contexts to persist sessionId for next invocation
    await this.saveContexts();
    
    // Return immediately without waiting for handler
    return {
      success: true,
      message: `Notification sent to ${targetName} (${workItems.length} items, working asynchronously)`,
    };
  } else {
    // Synchronous: wait for result (current behavior)
    const result = await this.notificationService.sendNotification(workItems, target, options);
    await this.saveContexts();
    return result;
  }
}
```

**Why**: Enables fire-and-forget mode while still persisting sessionId for session reuse

---

### Step 4: Update NotificationService Interface

**File**: `src/core/notification-service.ts`
**Lines**: 13-18
**Action**: UPDATE

**Current code:**
```typescript
export interface TargetHandler {
  send(
    workItems: WorkItem[],
    config: TargetConfig
  ): Promise<NotificationResult>;
}
```

**Required change:**
```typescript
export interface TargetHandler {
  send(
    workItems: WorkItem[],
    config: TargetConfig,
    options?: { async?: boolean }
  ): Promise<NotificationResult>;
}
```

**Why**: Extend interface to pass async option to all handlers

---

### Step 5: Update NotificationService Method

**File**: `src/core/notification-service.ts`
**Lines**: 37-57
**Action**: UPDATE

**Current code:**
```typescript
async sendNotification(
  workItems: WorkItem[],
  target: NotificationTarget
): Promise<NotificationResult> {
  const handler = this.targetHandlers.get(target.type);
  try {
    return await handler.send(workItems, target.config);
  } catch (error) {
    return { success: false, error: ... };
  }
}
```

**Required change:**
```typescript
async sendNotification(
  workItems: WorkItem[],
  target: NotificationTarget,
  options?: { async?: boolean }
): Promise<NotificationResult> {
  const handler = this.targetHandlers.get(target.type);
  try {
    return await handler.send(workItems, target.config, options);
  } catch (error) {
    return { success: false, error: ... };
  }
}
```

**Why**: Pass options parameter to handler

---

### Step 6: Implement Async Mode in ACP Handler

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 52-104
**Action**: UPDATE

**Current code:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig
): Promise<NotificationResult> {
  const process = this.ensureProcess(config);
  const sessionId = config.sessionId || (await this.initializeSession(process, config));
  
  if (!config.sessionId && sessionId) {
    config.sessionId = sessionId;
  }
  
  const prompt = this.formatWorkItems(workItems);
  const response = await this.sendPrompt(process, sessionId, prompt, config);
  
  setImmediate(() => this.cleanup());
  
  return {
    success: true,
    message: `AI response: ${JSON.stringify(response).substring(0, 200)}...`,
  };
}
```

**Required change:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig,
  options?: { async?: boolean }
): Promise<NotificationResult> {
  try {
    this.debug('ACPHandler.send: Starting notification');
    const process = this.ensureProcess(config);
    
    // Always need session (blocking operation)
    const sessionId = config.sessionId || (await this.initializeSession(process, config));
    this.debug(`ACPHandler.send: Session ID: ${sessionId}`);
    
    // Persist sessionId for reuse
    if (!config.sessionId && sessionId) {
      config.sessionId = sessionId;
    }
    
    const prompt = this.formatWorkItems(workItems);
    
    if (options?.async) {
      // Async mode: fire-and-forget
      this.debug('ACPHandler.send: Async mode - sending prompt without waiting');
      this.sendPromptAsync(process, sessionId, prompt, config);
      
      // DON'T cleanup - keep process alive for agent to work
      // DON'T await response - return immediately
      
      return {
        success: true,
        message: `Notification sent to agent (${workItems.length} items, working asynchronously)`,
      };
    } else {
      // Sync mode: wait for response (current behavior)
      this.debug('ACPHandler.send: Sync mode - waiting for response');
      const response = await this.sendPrompt(process, sessionId, prompt, config);
      
      // Cleanup process after getting response
      setImmediate(() => this.cleanup());
      
      return {
        success: true,
        message: `AI response: ${JSON.stringify(response).substring(0, 200)}...`,
      };
    }
  } catch (error) {
    this.debug(`ACPHandler.send: Error: ${error instanceof Error ? error.message : String(error)}`);
    setImmediate(() => this.cleanup());
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send prompt without waiting for response (fire-and-forget)
 */
private sendPromptAsync(
  process: ChildProcess,
  sessionId: string,
  content: string,
  config: TargetConfig
): void {
  const request = {
    jsonrpc: '2.0',
    id: this.nextId++,
    method: 'session/prompt',
    params: {
      sessionId,
      prompt: [{ type: 'text', text: content }],
    },
  };
  
  this.debug(`Sending async prompt: ${JSON.stringify(request)}`);
  process.stdin?.write(JSON.stringify(request) + '\n');
  
  // Note: Response will come back asynchronously and be handled by existing
  // message handler, but we don't wait for it. Process stays alive to handle
  // response and continue working.
}
```

**Why**: Implements core async behavior - send prompt without waiting, keep process alive

---

### Step 7: Update Bash Handler Signature

**File**: `src/core/target-handlers/bash-handler.ts`
**Lines**: 14-41
**Action**: UPDATE

**Current code:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig
): Promise<NotificationResult> {
  // existing implementation
}
```

**Required change:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig,
  options?: { async?: boolean }
): Promise<NotificationResult> {
  // existing implementation unchanged
  // options parameter added for interface compliance
  // Can implement async mode in future if needed
}
```

**Why**: Interface compliance - bash handler can ignore options for now

---

### Step 8: Update Telegram Handler Signature

**File**: `src/core/target-handlers/telegram-handler.ts`
**Lines**: 9-31
**Action**: UPDATE

**Current code:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig
): Promise<NotificationResult> {
  // existing implementation
}
```

**Required change:**
```typescript
async send(
  workItems: WorkItem[],
  config: TargetConfig,
  options?: { async?: boolean }
): Promise<NotificationResult> {
  // existing implementation unchanged
  // options parameter added for interface compliance
}
```

**Why**: Interface compliance - telegram handler can ignore options for now

---

### Step 9: Add Unit Tests for Async Mode

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Action**: UPDATE (append tests)

**Test cases to add:**
```typescript
describe('ACPTargetHandler - Async Mode', () => {
  it('should send prompt without waiting in async mode', async () => {
    const handler = new ACPTargetHandler();
    const mockProcess = createMockProcess();
    
    const result = await handler.send(workItems, config, { async: true });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('working asynchronously');
    expect(mockProcess.stdin?.write).toHaveBeenCalled();
    // Verify cleanup NOT called
    expect(mockProcess.kill).not.toHaveBeenCalled();
  });
  
  it('should wait for response in sync mode (default)', async () => {
    const handler = new ACPTargetHandler();
    const mockProcess = createMockProcess();
    
    const result = await handler.send(workItems, config);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('AI response');
    // Verify cleanup called after response
    expect(mockProcess.kill).toHaveBeenCalled();
  });
  
  it('should persist sessionId in both modes', async () => {
    const handler = new ACPTargetHandler();
    const config = { ...baseConfig, sessionId: undefined };
    
    await handler.send(workItems, config, { async: true });
    
    expect(config.sessionId).toBeDefined();
  });
  
  it('should keep process alive in async mode', async () => {
    const handler = new ACPTargetHandler();
    const mockProcess = createMockProcess();
    
    await handler.send(workItems, config, { async: true });
    
    // Wait a bit to ensure cleanup not triggered
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockProcess.kill).not.toHaveBeenCalled();
  });
});
```

**Why**: Ensures async mode behavior is correct and process lifecycle is managed properly

---

### Step 10: Add Integration Tests

**File**: `tests/integration/cli/commands/notify/send.test.ts`
**Action**: UPDATE (append tests)

**Test cases to add:**
```typescript
describe('notify send --async', () => {
  it('should accept --async flag', async () => {
    const result = await runCommand(['notify', 'send', 'to', 'test-target', '--async']);
    expect(result.exitCode).toBe(0);
  });
  
  it('should return immediately in async mode', async () => {
    const startTime = Date.now();
    const result = await runCommand(['notify', 'send', 'where', 'state=new', 'to', 'acp-target', '--async']);
    const duration = Date.now() - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(2000); // Should return in < 2s (not wait for AI)
  });
  
  it('should work with all notification syntaxes', async () => {
    const syntaxes = [
      ['notify', 'send', 'to', 'target', '--async'],
      ['notify', 'send', '"message"', 'to', 'target', '--async'],
      ['notify', 'send', 'TASK-001', 'to', 'target', '--async'],
      ['notify', 'send', 'where', 'state=new', 'to', 'target', '--async'],
    ];
    
    for (const syntax of syntaxes) {
      const result = await runCommand(syntax);
      expect(result.exitCode).toBe(0);
    }
  });
});
```

**Why**: Validates --async flag works across all command syntaxes and returns quickly

---

### Step 11: Update Example Script

**File**: `examples/work-item-prioritization/prioritize.sh`
**Lines**: ~32
**Action**: UPDATE

**Current code:**
```bash
# Send work items and let agent work autonomously
work notify send where 'state=new OR state=active' to prioritizer
```

**Required change:**
```bash
# Send work items and let agent work autonomously
work notify send where 'state=new OR state=active' to prioritizer --async
```

**Why**: Update example to use new async flag for documented use case

---

## Patterns to Follow

### Pattern 1: Optional Flag with Boolean Default

**From codebase - mirror this exactly:**

```typescript
// SOURCE: src/cli/commands/notify/send.ts (other commands with flags)
import { Flags } from '@oclif/core';

static override flags = {
  ...BaseCommand.baseFlags,
  flagName: Flags.boolean({
    description: 'Description of what flag does',
    default: false,
  }),
};
```

### Pattern 2: Options Parameter Propagation

**From codebase - similar pattern in:**

```typescript
// SOURCE: Multiple engine methods accept optional parameters
async methodName(
  required: Type1,
  alsoRequired: Type2,
  options?: { optionalParam?: boolean }
): Promise<ReturnType>
```

### Pattern 3: Async/Sync Branching in Handler

**From codebase - conditional behavior pattern:**

```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:62-104 (error handling pattern)
if (condition) {
  // Path A behavior
  return { success: true, message: 'Path A result' };
} else {
  // Path B behavior
  return { success: true, message: 'Path B result' };
}
```

### Pattern 4: Debug Logging

**From codebase - mirror this exactly:**

```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:63-66
this.debug('ACPHandler.send: Starting notification');
this.debug(`ACPHandler.send: Work items count: ${workItems.length}`);
this.debug(`ACPHandler.send: Config: ${JSON.stringify(config)}`);
```

---

## Edge Cases & Risks

| Risk/Edge Case                                       | Mitigation                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| SessionId not saved in async mode                    | Engine saves contexts before returning in async mode (Step 3)                                 |
| Multiple async notifications to same agent conflict  | Natural queueing at JSON-RPC level (documented in issue comments)                             |
| Process stays alive indefinitely                     | Expected behavior - agent works until task complete; document in help text                    |
| Backward compatibility                               | Default behavior (sync) unchanged; --async is opt-in                                          |
| Error handling in async mode                         | Errors during send() still thrown; but response errors not visible (document)                 |
| Testing async process lifecycle                      | Use vi.useFakeTimers() and process mocks as in existing tests                                 |
| Other handlers (bash, telegram) behavior             | Interface updated but implementation unchanged; can add async later                           |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Run unit tests
npm test -- tests/unit/core/target-handlers/acp-handler.test.ts

# Run integration tests  
npm test -- tests/integration/cli/commands/notify/send.test.ts

# Run all tests
npm test

# Linting
npm run lint

# Full CI pipeline
make ci
```

### Manual Verification

1. **Test sync mode (unchanged behavior):**
   ```bash
   work notify send TASK-001 to acp-target
   # Should wait for response and display it
   ```

2. **Test async mode (new feature):**
   ```bash
   work notify send where priority=critical to acp-target --async
   # Should return immediately with "working asynchronously" message
   # CLI should exit quickly (< 2s)
   ```

3. **Test session persistence:**
   ```bash
   # First call (creates session)
   work notify send TASK-001 to acp-target --async
   # Second call (reuses session)
   work notify send TASK-002 to acp-target --async
   # Verify: Second call faster (no session init delay)
   ```

4. **Test cron pattern:**
   ```bash
   # Simulate cron with multiple rapid notifications
   for i in {1..3}; do
     work notify send where state=new to acp-target --async
     sleep 5
   done
   # Verify: All notifications sent, agent processes sequentially
   ```

5. **Test all syntaxes with --async:**
   ```bash
   work notify send to target --async
   work notify send "message" to target --async
   work notify send TASK-001 to target --async
   work notify send where state=new to target --async
   ```

---

## Scope Boundaries

**IN SCOPE:**

- Add `--async` flag to `work notify send` command
- Implement async mode in ACP handler (fire-and-forget)
- Update handler interface to accept options parameter
- Maintain session persistence in async mode
- Keep process alive in async mode
- Add comprehensive tests for async behavior
- Update example scripts
- Maintain backward compatibility (sync as default)

**OUT OF SCOPE (do not touch):**

- Implementing async mode for bash/telegram handlers (future enhancement)
- Adding process health monitoring or auto-restart
- Implementing local queuing mechanism (natural JSON-RPC queueing sufficient)
- Adding `work notify status` command for agent health checks
- Changing default behavior (must remain synchronous)
- Modifying session initialization logic
- Changing timeout configuration mechanism
- Adding streaming support for async mode
- Implementing batch notification APIs
- Changing ACP protocol itself

---

## Additional Context from Issue

### Recommended Implementation: Natural Queueing (from issue comment)

The issue includes detailed analysis of request queueing strategies. The recommended approach is **natural queueing**:

- ACP already handles request queueing internally via JSON-RPC
- Just write to stdin without waiting - ACP processes sequentially
- No need for explicit queue management in work CLI
- Simplest implementation with zero state tracking
- Works perfectly for cron workflows

### ACP Concurrent Request Behavior

From issue analysis:
- One prompt at a time per session (ACP enforces this)
- Multiple prompts queue naturally at ACP level
- No error responses for "busy" - ACP just processes sequentially
- Multiple sessions = multiple concurrent trains of thought possible

### Future Enhancements (documented in issue, deferred)

1. Fail-fast for sync mode when agent busy
2. Queue visibility via `work notify status <target>` command
3. Process health monitoring and auto-restart
4. Async mode for bash/telegram handlers

---

## Metadata

- **Investigated by**: Claude (GitHub Copilot CLI)
- **Timestamp**: 2026-02-04T06:06:09Z
- **Artifact**: `.claude/PRPs/issues/issue-1362.md`
- **Issue Author Analysis**: Comprehensive design including protocol research, implementation plan, and queueing strategy analysis
- **Priority Justification**: High-priority enhancement blocking documented feature for autonomous agent workflows
