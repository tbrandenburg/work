# Investigation: Un-skip ACP handler JSON-RPC error test

**Issue**: #1188 (https://github.com/tbrandenburg/work/issues/1188)
**Type**: CHORE
**Investigated**: 2026-02-03T09:38:48.655Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                              |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Test coverage quality improvement, not blocking functionality since error handling already works in production                        |
| Complexity | LOW    | Single test file modification, test setup issue (missing handler registration), no production code changes                            |
| Confidence | HIGH   | Root cause clearly identified: test creates fresh process without calling setupMessageHandler, preventing stdout event registration |

---

## Problem Statement

The test 'should handle JSON-RPC error response' at line 329 of `tests/unit/core/target-handlers/acp-handler.test.ts` is currently skipped (using `it.skip`), but the JSON-RPC error handling functionality it tests is fully implemented and working in production code. The test was skipped when added in commit 9819c27 due to a test setup issue, not because the feature was missing.

---

## Analysis

### Root Cause / Change Rationale

The test creates a fresh `ACPTargetHandler` and fresh process mock but never calls `setupMessageHandler()` to wire up the stdout event listener. Without this setup, when the test emits data on stdout, there's no listener to parse the JSON-RPC message and call `handleMessage()`, so the promise never gets rejected.

**The error handling itself is fully implemented and correct** - this is purely a test infrastructure issue.

### Evidence Chain

**WHY**: Test is skipped
↓ **BECAUSE**: Test doesn't work as written (likely fails or hangs)
Evidence: `tests/unit/core/target-handlers/acp-handler.test.ts:329` - `it.skip('should handle JSON-RPC error response'`

↓ **BECAUSE**: Fresh process mock has no stdout event listener registered
Evidence: `tests/unit/core/target-handlers/acp-handler.test.ts:332-339`:
```typescript
const freshHandler = new ACPTargetHandler();
const freshProcess = {
  stdin: { write: vi.fn() },
  stdout: new EventEmitter(),  // ← Created but no listeners attached
  stderr: new EventEmitter(),
  killed: false,
  kill: vi.fn(),
  on: vi.fn(),
};
```

↓ **BECAUSE**: Test never calls `setupMessageHandler()` on the fresh process
Evidence: Missing call - contrast with how `ensureProcess()` works in `src/core/target-handlers/acp-handler.ts:104`:
```typescript
this.setupMessageHandler(child);  // ← This wires up stdout listener
```

↓ **ROOT CAUSE**: Without `setupMessageHandler()`, the stdout.on('data') listener is never attached
Evidence: `src/core/target-handlers/acp-handler.ts:114-133`:
```typescript
private setupMessageHandler(child: ChildProcess): void {
  let buffer = '';
  child.stdout?.on('data', (data: Buffer) => {  // ← This listener is never added in test
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const msg = JSON.parse(line) as ACPMessage;
          this.handleMessage(msg);  // ← So this is never called
        }
      }
    }
  });
}
```

**Production Code Verification**: The error handling IS implemented correctly:
Evidence: `src/core/target-handlers/acp-handler.ts:136-145`:
```typescript
private handleMessage(msg: ACPMessage): void {
  if (msg.id && this.pendingRequests.has(msg.id)) {
    const { resolve, reject } = this.pendingRequests.get(msg.id)!;
    this.pendingRequests.delete(msg.id);
    
    if (msg.error) {
      reject(new ACPError(msg.error.message, 'ACP_RPC_ERROR'));  // ✅ Correct
    } else {
      resolve(msg.result);
    }
  }
}
```

### Affected Files

| File                                                          | Lines   | Action | Description                                  |
| ------------------------------------------------------------- | ------- | ------ | -------------------------------------------- |
| `tests/unit/core/target-handlers/acp-handler.test.ts`        | 329-364 | UPDATE | Un-skip test and add setupMessageHandler call |

### Integration Points

- Test uses `ACPTargetHandler` private methods via `(handler as any)` type assertion
- Test relies on `setupMessageHandler()` to wire stdout → handleMessage → promise rejection
- No production code changes needed - error handling already works

### Git History

- **Test added**: commit 9819c27 - "test: increase ACP handler coverage from 14% to 96%+"
- **Test status**: Skipped since initial addition (was `it.skip` from the start)
- **Implication**: Test was added with known setup issue, deferred for later fix
- **Production code**: Error handling implemented correctly since ACP feature was added

---

## Implementation Plan

### Step 1: Call setupMessageHandler on fresh process

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Lines**: 329-364
**Action**: UPDATE

**Current code:**

```typescript
it.skip('should handle JSON-RPC error response', async () => {
  // Use fresh process and handler to avoid interference
  const freshHandler = new ACPTargetHandler();
  const freshProcess = {
    stdin: { write: vi.fn() },
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    killed: false,
    kill: vi.fn(),
    on: vi.fn(),
  };

  const requestPromise = (freshHandler as any).sendRequest(
    freshProcess,
    'initialize',
    {},
    1 // 1 second timeout
  );

  // Send error response immediately (using setImmediate to ensure event loop processing)
  process.nextTick(() => {
    freshProcess.stdout.emit(
      'data',
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -1, message: 'Method not found' },
      }) + '\n'
    );
  });

  // Advance timers to process event
  vi.advanceTimersByTime(10);

  await expect(requestPromise).rejects.toThrow('Method not found');
});
```

**Required change:**

```typescript
it('should handle JSON-RPC error response', async () => {  // ← Remove .skip
  // Use fresh process and handler to avoid interference
  const freshHandler = new ACPTargetHandler();
  const freshProcess = {
    stdin: { write: vi.fn() },
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    killed: false,
    kill: vi.fn(),
    on: vi.fn(),
  };

  // ← ADD THIS: Wire up the message handler
  (freshHandler as any).setupMessageHandler(freshProcess);

  const requestPromise = (freshHandler as any).sendRequest(
    freshProcess,
    'initialize',
    {},
    1 // 1 second timeout
  );

  // Send error response immediately (using setImmediate to ensure event loop processing)
  process.nextTick(() => {
    freshProcess.stdout.emit(
      'data',
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -1, message: 'Method not found' },
      }) + '\n'
    );
  });

  // Advance timers to process event
  vi.advanceTimersByTime(10);

  await expect(requestPromise).rejects.toThrow('Method not found');
});
```

**Why**: Calling `setupMessageHandler(freshProcess)` registers the stdout event listener that parses JSON and calls `handleMessage()`, which then rejects the promise with the error message.

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:104-105
// Pattern for process setup - always call setupMessageHandler after spawn
this.setupMessageHandler(child);
this.setupErrorHandler(child, key);
```

```typescript
// SOURCE: tests/unit/core/target-handlers/acp-handler.test.ts:299-327
// Pattern for testing sendRequest - timeout test works because it doesn't need message handler
it('should timeout if no response', async () => {
  mockProcess = {
    stdin: { write: vi.fn() },
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    killed: false,
    kill: vi.fn(),
    on: vi.fn(),
  };
  
  const requestPromise = (handler as any).sendRequest(
    mockProcess,
    'initialize',
    {},
    0.1
  );
  
  vi.advanceTimersByTime(150);
  await expect(requestPromise).rejects.toThrow('ACP process timed out');
});
```

**Key difference**: Timeout test doesn't need `setupMessageHandler` because timeout fires internally. Error response test needs it because the response comes via stdout events.

---

## Edge Cases & Risks

| Risk/Edge Case                                  | Mitigation                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Test might still fail due to timing issues      | Use `process.nextTick` (already in test) to ensure event is emitted after promise is created   |
| Fake timers might interfere with event loop     | Keep `vi.advanceTimersByTime(10)` to allow event loop to process                               |
| Fresh handler might have state from other tests | Test already creates `freshHandler` and `freshProcess` - this isolation is correct              |
| setupMessageHandler is private method           | Test already uses `(handler as any)` pattern for private method access - this is acceptable     |

---

## Validation

### Automated Checks

```bash
# Run the specific test
npm test -- tests/unit/core/target-handlers/acp-handler.test.ts

# Run full test suite to ensure no regressions
npm test

# Verify linting
npm run lint

# Full CI check
make ci
```

### Manual Verification

1. Run test file and verify "should handle JSON-RPC error response" passes
2. Check test output shows the test is no longer skipped
3. Verify test coverage for acp-handler.ts remains high (should stay at 96%+)
4. Confirm no other tests are affected

---

## Scope Boundaries

**IN SCOPE:**

- Un-skip the JSON-RPC error response test (remove `.skip`)
- Add `setupMessageHandler()` call in test setup
- Verify test passes

**OUT OF SCOPE (do not touch):**

- Production code in `src/core/target-handlers/acp-handler.ts` (error handling already works)
- Other tests in the file
- Test timeout values or timing logic (already correct)
- ACPError class or error handling implementation (already correct)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-03T09:38:48.655Z
- **Artifact**: `.claude/PRPs/issues/issue-1188.md`
