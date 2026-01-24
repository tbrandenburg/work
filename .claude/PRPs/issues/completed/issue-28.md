# Investigation: Fix notification handler registration race condition

**Issue**: #28 (https://github.com/tbrandenburg/work/pull/28)
**Type**: BUG
**Investigated**: 2026-01-24T12:57:43.018Z

### Assessment

| Metric     | Value    | Reasoning                                                                                                    |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Severity   | HIGH     | CI tests failing, notification system completely broken, no workaround available for bash target handlers   |
| Complexity | LOW      | Single file change, simple synchronous import replacement, isolated to handler registration                  |
| Confidence | HIGH     | Clear root cause identified with specific error message and code path, well-understood async timing issue   |

---

## Problem Statement

The notification system CI tests are failing with "No handler registered for target type: bash" because the handler registration uses asynchronous dynamic imports that create a race condition where CLI commands execute before handlers are registered.

---

## Analysis

### Root Cause / Change Rationale

The notification handler registration in WorkEngine uses asynchronous dynamic imports but doesn't await them, causing CLI commands to execute before the bash handler is registered with the NotificationService.

### Evidence Chain

WHY: CI tests fail with "No handler registered for target type: bash"
↓ BECAUSE: NotificationService.sendNotification() can't find bash handler
Evidence: `src/core/notification-service.ts:24-26` - `if (!handler) { return { success: false, error: "No handler registered for target type: ${target.type}" }}`

↓ BECAUSE: registerNotificationHandler() uses async import that hasn't completed
Evidence: `src/core/engine.ts:49-53` - `import('./target-handlers/index.js').then(({ BashTargetHandler }) => { this.notificationService.registerHandler('bash', new BashTargetHandler()); })`

↓ ROOT CAUSE: Constructor calls registerNotificationHandler() without awaiting it
Evidence: `src/core/engine.ts:41` - `this.registerNotificationHandler();` (no await)

### Affected Files

| File            | Lines | Action | Description                                    |
| --------------- | ----- | ------ | ---------------------------------------------- |
| `src/core/engine.ts` | 47-54 | UPDATE | Replace async import with synchronous import   |

### Integration Points

- `src/cli/commands/notify/send.ts:47` creates new WorkEngine() and immediately calls sendNotification()
- `src/core/notification-service.ts:34-54` sendNotification() method depends on registered handlers
- All notify CLI commands depend on handler registration working synchronously

### Git History

- **Introduced**: 3422f02 - 2026-01-24 - "feat(notify): implement notification system with context persistence"
- **Last modified**: 3422f02 - same commit
- **Implication**: New feature with race condition bug, not a regression

---

## Implementation Plan

### Step 1: Replace async handler registration with synchronous import

**File**: `src/core/engine.ts`
**Lines**: 47-54
**Action**: UPDATE

**Current code:**

```typescript
// Line 47-54
private registerNotificationHandler(): void {
  // Import here to avoid circular dependencies
  import('./target-handlers/index.js').then(({ BashTargetHandler }) => {
    this.notificationService.registerHandler('bash', new BashTargetHandler());
  }).catch(() => {
    // Silently fail if handlers not available
  });
}
```

**Required change:**

```typescript
private registerNotificationHandler(): void {
  // Import synchronously - handlers are part of core system
  const { BashTargetHandler } = require('./target-handlers/index.js');
  this.notificationService.registerHandler('bash', new BashTargetHandler());
}
```

**Why**: Eliminates race condition by making handler registration synchronous, ensuring handlers are available immediately when WorkEngine is constructed.

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/core/engine.ts:37-38
// Pattern for synchronous adapter registration
this.registerAdapter('local-fs', new LocalFsAdapter());
```

---

## Edge Cases & Risks

| Risk/Edge Case | Mitigation      |
| -------------- | --------------- |
| Circular dependency | Target handlers are designed to be independent, no circular deps expected |
| Import failure | Remove try/catch since handlers are core functionality that must work |
| Module loading | Use require() for synchronous loading, handlers are always available |

---

## Validation

### Automated Checks

```bash
npm run type-check
npm test tests/e2e/notify-workflow.test.ts
npm run lint
```

### Manual Verification

1. Run `npm test tests/e2e/notify-workflow.test.ts` - all 4 tests should pass
2. Test CLI: `./bin/run.js notify target add test --type bash --script work:log`
3. Test CLI: `./bin/run.js notify send where priority=high to test`

---

## Scope Boundaries

**IN SCOPE:**
- Fix handler registration race condition
- Ensure synchronous handler availability

**OUT OF SCOPE (do not touch):**
- Handler implementation logic
- CLI command structure
- NotificationService interface
- Test structure or content

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-01-24T12:57:43.018Z
- **Artifact**: `.claude/PRPs/issues/issue-28.md`
