# Investigation: Enhancement: Add exception handling for ACP notification callbacks

**Issue**: #1050 (https://github.com/tbrandenburg/work/issues/1050)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-02T18:44:35+01:00

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                           |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Improves robustness of new feature (PR #1031) but not user-facing failure; prevents edge-case process crashes from user callback errors            |
| Complexity | LOW    | Single file change (acp-handler.ts), 5 lines added, one test case; no architectural changes or integration points beyond existing notification flow |
| Confidence | HIGH   | Issue description provides exact location, solution, and test case; code exploration confirms straightforward implementation with clear patterns    |

---

## Problem Statement

The ACP handler's `onNotification` callback (added in PR #1031) is invoked synchronously within an EventEmitter handler without exception protection. If the user-provided callback throws, it crashes the Node.js process. Need to add try-catch protection for graceful error handling.

---

## Analysis

### Change Rationale

The notification callback feature was added in commit `a3165be` (Feb 2, 2026) to enable streaming notifications from ACP targets. However, the implementation invokes the user-provided callback directly from an EventEmitter data handler without defensive error handling.

**Risk scenario:**
1. User provides `onNotification: () => { throw new Error('oops') }`
2. EventEmitter stdout `data` event → `setupMessageHandler()` → `handleMessage()` → callback throws
3. Unhandled exception propagates to EventEmitter
4. Node.js process crashes

**Best practice:** User-provided callbacks should always be wrapped in try-catch to prevent process-level failures.

### Evidence Chain

WHY: Process crashes when user callback throws
↓ BECAUSE: Callback invoked without exception protection
Evidence: `src/core/target-handlers/acp-handler.ts:144` - Direct invocation:
```typescript
} else if (msg.method && this.currentConfig?.onNotification) {
  // Handle notifications by invoking callback
  this.currentConfig.onNotification(msg.method, msg.params);
}
```

↓ BECAUSE: Called from EventEmitter handler with no outer try-catch
Evidence: `src/core/target-handlers/acp-handler.ts:111-129` - setupMessageHandler:
```typescript
child.stdout?.on('data', (data: Buffer) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line) as ACPMessage;
        this.handleMessage(msg);  // ← Calls into unprotected callback
      } catch {
        // Only catches JSON parse errors, not callback errors
      }
    }
  }
});
```

↓ ROOT CAUSE: Missing try-catch around callback invocation at line 144
Evidence: Existing try-catch only protects JSON parsing (line 122-126), not callback execution

### Affected Files

| File                                                  | Lines   | Action | Description                                  |
| ----------------------------------------------------- | ------- | ------ | -------------------------------------------- |
| `src/core/target-handlers/acp-handler.ts`             | 144     | UPDATE | Add try-catch around callback invocation     |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | ~540    | UPDATE | Add test case for throwing callback          |
| `.claude/PRPs/issues/issue-1050.md`                   | NEW     | CREATE | This investigation artifact                  |

### Integration Points

- **Callers**: EventEmitter stdout `data` handler → `setupMessageHandler()` → `handleMessage()` → `onNotification` callback
- **Dependencies**: 
  - `ACPTargetConfig` interface in `src/types/notification.ts:44` defines callback signature
  - No other files reference `onNotification`
- **Impact**: Isolated to ACP handler notification path; no ripple effects

### Git History

- **Introduced**: `a3165be` - 2026-02-02 - "Fix: Add streaming notification support to ACP handler (#995) (#1031)"
- **Last modified**: `a3165be` (same commit)
- **Implication**: Very recent feature (same day); no legacy usage patterns to worry about

---

## Implementation Plan

### Step 1: Add try-catch protection around callback invocation

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 142-145
**Action**: UPDATE

**Current code:**
```typescript
// Line 142-145
} else if (msg.method && this.currentConfig?.onNotification) {
  // Handle notifications by invoking callback
  this.currentConfig.onNotification(msg.method, msg.params);
}
```

**Required change:**
```typescript
// Line 142-150 (after change)
} else if (msg.method && this.currentConfig?.onNotification) {
  // Handle notifications by invoking callback
  try {
    this.currentConfig.onNotification(msg.method, msg.params);
  } catch (error) {
    console.error('Error in notification callback:', error);
    // Continue processing - don't let callback errors crash the handler
  }
}
```

**Why**: Prevents user callback exceptions from crashing the process while maintaining notification flow for valid callbacks.

---

### Step 2: Add test case for throwing callback

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Lines**: After line 538 (in the "notification handling" describe block)
**Action**: UPDATE

**Test case to add:**
```typescript
it('should handle callback exceptions gracefully', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  const configWithThrowingCallback: ACPTargetConfig = {
    ...mockConfig,
    onNotification: () => {
      throw new Error('Callback error');
    },
  };

  (handler as any).ensureProcess(configWithThrowingCallback);
  (handler as any).currentConfig = configWithThrowingCallback;

  const notification = {
    jsonrpc: '2.0',
    method: 'session/update',
    params: { test: true },
  };

  // Should not throw - error should be caught and logged
  expect(() => {
    mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');
  }).not.toThrow();

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    'Error in notification callback:',
    expect.any(Error)
  );

  consoleErrorSpy.mockRestore();
});
```

**Why**: Verifies exception handling works correctly and errors are logged without crashing.

---

## Patterns to Follow

### Error Handling Pattern from Same File

**SOURCE**: `src/core/target-handlers/acp-handler.ts:122-126`
**Pattern for**: JSON parsing with silent error handling
```typescript
try {
  const msg = JSON.parse(line) as ACPMessage;
  this.handleMessage(msg);
} catch {
  // Ignore parse errors (partial messages)
}
```

**Adaptation**: Use similar structure but add logging since callback errors are user errors (not expected like partial JSON).

---

### Console Logging Pattern from Same File

**SOURCE**: `src/core/target-handlers/acp-handler.ts:151`
**Pattern for**: Error logging in event handlers
```typescript
child.on('error', (error: Error) => {
  console.error(`ACP process error:`, error);
  this.processes.delete(key);
});
```

**Mirror exactly**: Use `console.error` with descriptive prefix and error object.

---

### Test Pattern for Exception Handling

**SOURCE**: `tests/unit/core/target-handlers/acp-handler.test.ts:523-538`
**Pattern for**: Testing that operations don't throw
```typescript
it('should ignore notifications when no callback registered', () => {
  (handler as any).ensureProcess(mockConfig);
  (handler as any).currentConfig = mockConfig;

  const notification = {
    jsonrpc: '2.0',
    method: 'session/update',
    params: { progress: 50 },
  };

  expect(() => {
    mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');
  }).not.toThrow();
});
```

**Mirror exactly**: Same structure with `expect(() => { ... }).not.toThrow()`, add console.error spy.

---

## Edge Cases & Risks

| Risk/Edge Case                      | Mitigation                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| Callback throws after partial work  | Try-catch isolates to single notification; subsequent notifications unaffected |
| Error object is not Error instance  | console.error handles any value type gracefully                                |
| Performance impact of try-catch     | Negligible - only in notification path, not hot path                           |
| Silent failures if logging disabled | Acceptable - process stability is primary goal                                 |

---

## Validation

### Automated Checks

```bash
# Type check
npm run type-check

# Run ACP handler tests specifically
npm test acp-handler

# Full test suite
npm test

# Lint
npm run lint
```

### Manual Verification

1. Run the new test case: `npm test -- --testNamePattern="should handle callback exceptions gracefully"`
2. Verify test passes and console.error is called
3. Verify no other tests regress
4. Optionally: Create a manual test script with throwing callback to verify runtime behavior

---

## Scope Boundaries

**IN SCOPE:**
- Add try-catch around `onNotification` callback invocation in acp-handler.ts
- Add test case for throwing callback
- Log errors with console.error

**OUT OF SCOPE (do not touch):**
- Changing callback signature or ACPTargetConfig interface
- Adding custom error types (ACPCallbackError, etc.) - keep it simple
- Implementing retry logic or callback validation
- Adding logging infrastructure beyond console.error
- Updating documentation (issue mentions it, but implementation is self-evident)
- Modifying other handlers or notification systems

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-02T18:44:35+01:00
- **Artifact**: `.claude/PRPs/issues/issue-1050.md`
- **Related PR**: #1031 (introduced the feature)
- **Parent Issue**: #995 (streaming notifications)
