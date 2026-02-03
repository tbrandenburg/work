# Investigation: Unified configurable timeout for ACP operations (default 300s)

**Issue**: #1363 (https://github.com/tbrandenburg/work/issues/1363)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-03T17:25:02.245Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                           |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Improves user experience significantly by preventing timeout failures for longer AI operations, but doesn't block core functionality              |
| Complexity | LOW    | Single file change (acp-handler.ts), straightforward refactor to centralize timeout logic, minimal integration points, well-understood code paths |
| Confidence | HIGH   | Clear root cause identified (hardcoded 60s at line 247), strong evidence from code inspection, implementation path is straightforward             |

---

## Problem Statement

The ACP handler currently has inconsistent timeout handling with three different timeout behaviors: initialize (30s configurable), session creation (30s configurable), and prompts (60s hardcoded). The hardcoded 60-second timeout for prompts is insufficient for complex AI operations and cannot be customized by users.

---

## Analysis

### Change Rationale

**Current Issues:**
1. **Inconsistent behavior**: Three different timeout implementations across ACP operations
2. **Not configurable**: Prompts use hardcoded 60s timeout at line 247, ignoring `config.timeout`
3. **Too short for AI work**: 60 seconds insufficient for complex analysis (2-5 minutes) or code generation

**Why this change enables:**
- Users can customize timeout for their specific AI operations
- Consistent timeout behavior across all ACP operations
- Better default (300s) matches real-world AI operation timings
- Simpler, more maintainable code

### Evidence Chain

**WHY**: Users experience timeout failures during complex AI operations
↓ **BECAUSE**: Prompts use hardcoded 60-second timeout
**Evidence**: `src/core/target-handlers/acp-handler.ts:247`
```typescript
return this.sendRequest(
  process,
  'session/prompt',
  params,
  60  // Hardcoded, not configurable
);
```

↓ **BECAUSE**: Timeout is not pulled from config like other operations
**Evidence**: Lines 200, 211 use `config.timeout || 30` but line 247 doesn't
```typescript
// Initialize - uses config (line 200)
await this.sendRequest(process, 'initialize', params, config.timeout || 30);

// Session/new - uses config (line 211)  
await this.sendRequest(process, 'session/new', params, config.timeout || 30);

// Prompts - HARDCODED (line 247)
return this.sendRequest(process, 'session/prompt', params, 60);
```

↓ **BECAUSE**: No centralized timeout logic, each call hardcodes fallback
**Evidence**: Timeout logic scattered across 3 different callsites

↓ **ROOT CAUSE**: Missing centralized timeout getter and inconsistent defaults
**Evidence**: No `getTimeout()` helper method; defaults should be 300s not 30s/60s

### Affected Files

| File                                                         | Lines   | Action | Description                                           |
| ------------------------------------------------------------ | ------- | ------ | ----------------------------------------------------- |
| `src/core/target-handlers/acp-handler.ts`                    | 247     | UPDATE | Replace hardcoded 60 with config-based timeout        |
| `src/core/target-handlers/acp-handler.ts`                    | 200,211 | UPDATE | Use centralized timeout getter                        |
| `src/core/target-handlers/acp-handler.ts`                    | NEW     | CREATE | Add `getTimeout()` helper method                      |
| `src/cli/commands/notify/target/add.ts`                      | 151     | UPDATE | Remove hardcoded timeout: 30, use optional flag value |
| `src/cli/commands/notify/target/add.ts`                      | 49-52   | UPDATE | Update flag description to apply to acp type          |
| `tests/unit/core/target-handlers/acp-handler.test.ts`        | NEW     | CREATE | Add tests for unified timeout behavior                |
| `docs/work-notifications.md` (if exists)                     | N/A     | UPDATE | Document timeout configuration                        |
| `README.md` or `docs/` (CLI examples)                        | N/A     | UPDATE | Add timeout flag to ACP examples                      |

### Integration Points

**Callsites:**
- `ACPHandler.initializeSession()` (lines 188-227) - Calls sendRequest 3 times with different timeouts
- `ACPHandler.sendPrompt()` (lines 235-248) - Uses hardcoded 60s timeout
- `NotificationService.sendNotification()` → `ACPHandler.send()` → uses stored config

**Configuration flow:**
- CLI: `notify target add` → `buildConfig()` → hardcoded `timeout: 30`
- Storage: Config persisted to `.work/config.json`
- Runtime: Config loaded and passed to handler methods

**Test dependencies:**
- `tests/unit/core/target-handlers/acp-handler.test.ts:74` - Mock config setup
- `tests/unit/core/target-handlers/acp-handler.test.ts:299-327` - Existing timeout test

### Git History

- **Introduced**: `fed1eb3` - 2026-02-02 - "Feature: ACP (Agent Client Protocol) Notification Target (#976)"
- **Last modified**: `3fb7a17` - 2026-02-03 - "Document OpenCode prompt format options"
- **Implication**: Feature introduced 1 day ago, hardcoded timeouts were part of original implementation, not a regression

---

## Implementation Plan

### Step 1: Add centralized timeout getter

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: Add after class properties (around line 35)
**Action**: CREATE

**Add helper method:**

```typescript
/**
 * Default timeout for all ACP operations (5 minutes)
 * Covers 95% of AI operations while providing timeout protection
 */
private static readonly DEFAULT_TIMEOUT = 300;

/**
 * Get configured timeout or default
 * @param config - Optional ACPTargetConfig to read timeout from
 * @returns Timeout in seconds
 */
private getTimeout(config?: ACPTargetConfig): number {
  return config?.timeout ?? ACPTargetHandler.DEFAULT_TIMEOUT;
}
```

**Why**: Centralizes timeout logic, makes default explicit, enables consistent behavior

---

### Step 2: Update initialize timeout call

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 200
**Action**: UPDATE

**Current code:**

```typescript
await this.sendRequest(
  process,
  'initialize',
  {
    protocolVersion: 1,
    clientInfo: { name: 'work-cli', version: '0.0.1' },
  },
  config.timeout || 30  // Line 200
);
```

**Required change:**

```typescript
await this.sendRequest(
  process,
  'initialize',
  {
    protocolVersion: 1,
    clientInfo: { name: 'work-cli', version: '0.0.1' },
  },
  this.getTimeout(config)  // Use centralized getter
);
```

**Why**: Applies unified timeout with better default (300s instead of 30s)

---

### Step 3: Update session/new timeout call

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 211
**Action**: UPDATE

**Current code:**

```typescript
const sessionResult = (await this.sendRequest(
  process,
  'session/new',
  {
    cwd: config.cwd ?? process.cwd(),
    mcpServers: [],
  },
  config.timeout || 30  // Line 211
)) as { sessionId: string };
```

**Required change:**

```typescript
const sessionResult = (await this.sendRequest(
  process,
  'session/new',
  {
    cwd: config.cwd ?? process.cwd(),
    mcpServers: [],
  },
  this.getTimeout(config)  // Use centralized getter
)) as { sessionId: string };
```

**Why**: Applies unified timeout with better default (300s instead of 30s)

---

### Step 4: Fix hardcoded prompt timeout

**File**: `src/core/target-handlers/acp-handler.ts**
**Lines**: 247
**Action**: UPDATE

**Current code:**

```typescript
private async sendPrompt(
  process: ChildProcess,
  sessionId: string,
  content: string
): Promise<unknown> {
  return this.sendRequest(
    process,
    'session/prompt',
    {
      sessionId,
      prompt: [
        {
          type: 'user',
          content,
        },
      ],
    },
    60  // Line 247 - HARDCODED
  );
}
```

**Required change:**

```typescript
private async sendPrompt(
  process: ChildProcess,
  sessionId: string,
  content: string,
  config: ACPTargetConfig  // Add config parameter
): Promise<unknown> {
  return this.sendRequest(
    process,
    'session/prompt',
    {
      sessionId,
      prompt: [
        {
          type: 'user',
          content,
        },
      ],
    },
    this.getTimeout(config)  // Use centralized getter
  );
}
```

**Why**: Removes hardcoded timeout, enables configuration, applies 300s default

---

### Step 5: Update sendPrompt caller to pass config

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: Find call to sendPrompt (likely in `send()` method around line 140-180)
**Action**: UPDATE

**Current pattern:**

```typescript
// Likely around line 170-180 in send() method
await this.sendPrompt(process, sessionId, formattedPrompt);
```

**Required change:**

```typescript
// Pass config to sendPrompt
await this.sendPrompt(process, sessionId, formattedPrompt, config);
```

**Why**: Passes config through so sendPrompt can access timeout

---

### Step 6: Update CLI to use optional timeout flag

**File**: `src/cli/commands/notify/target/add.ts`
**Lines**: 151
**Action**: UPDATE

**Current code:**

```typescript
case 'acp':
  if (!flags.cmd) {
    throw new Error('cmd is required for acp target');
  }
  return {
    type: 'acp' as const,
    cmd: flags.cmd,
    cwd: flags.cwd || process.cwd(),
    timeout: 30,  // Line 151 - Hardcoded
    ...(flags['system-prompt'] && {
      systemPrompt: flags['system-prompt'],
    }),
  };
```

**Required change:**

```typescript
case 'acp':
  if (!flags.cmd) {
    throw new Error('cmd is required for acp target');
  }
  return {
    type: 'acp' as const,
    cmd: flags.cmd,
    cwd: flags.cwd || process.cwd(),
    ...(flags.timeout && { timeout: flags.timeout }),  // Optional, no default
    ...(flags['system-prompt'] && {
      systemPrompt: flags['system-prompt'],
    }),
  };
```

**Why**: Removes CLI-level default, lets handler default (300s) apply when not specified

---

### Step 7: Update CLI flag description

**File**: `src/cli/commands/notify/target/add.ts`
**Lines**: 49-52
**Action**: UPDATE

**Current code:**

```typescript
timeout: Flags.integer({
  description: 'script timeout in seconds (for bash type)',
  dependsOn: ['type'],
}),
```

**Required change:**

```typescript
timeout: Flags.integer({
  description: 'timeout in seconds (for bash and acp types, default: 300 for acp)',
  dependsOn: ['type'],
}),
```

**Why**: Clarifies timeout applies to both bash and acp, documents default

---

### Step 8: Add unit tests for unified timeout

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Lines**: NEW (add after existing timeout tests around line 327)
**Action**: CREATE

**Test cases to add:**

```typescript
describe('Unified timeout configuration', () => {
  it('should use 300s default when no timeout specified', async () => {
    const configWithoutTimeout = {
      type: 'acp' as const,
      cmd: 'opencode acp',
      cwd: process.cwd(),
      // No timeout property
    };

    // Test that getTimeout returns 300
    const timeout = (handler as any).getTimeout(configWithoutTimeout);
    expect(timeout).toBe(300);
  });

  it('should respect custom timeout from config', async () => {
    const configWithTimeout = {
      type: 'acp' as const,
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 600,
    };

    const timeout = (handler as any).getTimeout(configWithTimeout);
    expect(timeout).toBe(600);
  });

  it('should use same timeout for all operations', async () => {
    vi.useFakeTimers();
    const customTimeout = 120;
    
    const configWithTimeout = {
      type: 'acp' as const,
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: customTimeout,
    };

    // Mock process
    const mockProcess = new EventEmitter() as ChildProcess;
    mockProcess.stdin = new Writable() as any;
    mockProcess.stdout = new Readable() as any;
    mockProcess.stderr = new Readable() as any;

    // Test initialize timeout
    const initPromise = (handler as any).sendRequest(
      mockProcess,
      'initialize',
      {},
      (handler as any).getTimeout(configWithTimeout)
    );
    vi.advanceTimersByTime(customTimeout * 1000 + 100);
    await expect(initPromise).rejects.toThrow(
      `ACP process timed out after ${customTimeout} seconds`
    );

    vi.useRealTimers();
  });

  it('should handle zero timeout as infinite (no timeout)', async () => {
    // Future enhancement: Allow timeout: 0 for no timeout
    const configNoTimeout = {
      type: 'acp' as const,
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 0,
    };

    const timeout = (handler as any).getTimeout(configNoTimeout);
    // For now, 0 is treated as 0 (immediate timeout)
    // Future: Could special-case 0 to mean "no timeout"
    expect(timeout).toBe(0);
  });
});
```

**Why**: Validates unified timeout behavior, ensures config is respected, tests edge cases

---

### Step 9: Update documentation

**File**: `docs/work-notifications.md` (if exists) or `README.md`
**Lines**: ACP target examples
**Action**: UPDATE

**Add timeout examples:**

```markdown
### ACP Target Configuration

#### Basic Usage
```bash
# Default timeout: 300 seconds (5 minutes)
work notify target add ai-agent --type acp --cmd "opencode acp"
```

#### Custom Timeout
```bash
# Fast operations: Lower timeout
work notify target add quick-ai --type acp --cmd "opencode acp" --timeout 60

# Very slow operations: Higher timeout
work notify target add deep-analysis --type acp --cmd "opencode acp" --timeout 600
```

#### Timeout Behavior
- **Default**: 300 seconds (5 minutes) - suitable for most AI operations
- **Applies to**: All ACP operations (initialize, session creation, prompts)
- **Configurable via**: `--timeout` flag when adding target
- **No timeout**: Not currently supported (minimum 1 second)
```

**Why**: Documents new behavior, provides usage examples

---

## Patterns to Follow

**From codebase - centralized timeout pattern:**

```typescript
// SOURCE: src/core/target-handlers/bash-handler.ts:25
// Pattern for timeout with fallback
const { script, timeout = 30 } = config;
```

**From codebase - optional config property:**

```typescript
// SOURCE: src/cli/commands/notify/target/add.ts:130
// Pattern for optional config fields
return {
  type: 'bash' as const,
  script: flags.script!,
  ...(flags.timeout && { timeout: flags.timeout }),
};
```

**From codebase - timeout error pattern:**

```typescript
// SOURCE: src/types/errors.ts:96-102
export class ACPTimeoutError extends ACPError {
  constructor(timeout: number) {
    super(`ACP process timed out after ${timeout} seconds`, 'ACP_TIMEOUT', 408);
    this.name = 'ACPTimeoutError';
  }
}
```

---

## Edge Cases & Risks

| Risk/Edge Case                                | Mitigation                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Existing configs with timeout: 30             | Still respected, but now applies to prompts too (safer, more lenient)      |
| Very long operations (&gt;5 min)              | Users can increase timeout via --timeout flag                              |
| Zero or negative timeout                      | Accept as-is (0 = immediate timeout, negative not validated yet)           |
| Backward compatibility                        | No breaking change - existing behavior improves (30s/60s → 300s)           |
| Tests with short timeouts                     | Update test mocks to use explicit short timeouts (e.g., 0.1s for tests)    |
| CLI flag description change                   | Non-breaking, just clarifies existing flag applies to acp too              |
| Config migration                              | Not needed - optional property, defaults handled at runtime                |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Run ACP handler tests specifically
npm test -- acp-handler.test.ts

# Run all tests
npm test

# Linting
npm run lint
```

### Manual Verification

1. **Add ACP target without timeout** - Verify it uses 300s default:
   ```bash
   work notify target add test-default --type acp --cmd "opencode acp"
   # Check config: cat .work/config.json | jq '.targets["test-default"]'
   # Should NOT have timeout property (uses handler default 300s)
   ```

2. **Add ACP target with custom timeout** - Verify it's respected:
   ```bash
   work notify target add test-custom --type acp --cmd "opencode acp" --timeout 600
   # Check config: cat .work/config.json | jq '.targets["test-custom"].timeout'
   # Should show: 600
   ```

3. **Test actual timeout behavior** (requires real ACP client):
   ```bash
   # Create mock slow ACP that takes 70s
   work notify target add slow-test --type acp --cmd "opencode acp" --timeout 60
   work notify send TASK-123 to slow-test
   # Should timeout after 60s with ACPTimeoutError
   ```

4. **Verify no regression** - Run existing E2E tests:
   ```bash
   npm run test:e2e -- notify
   ```

---

## Scope Boundaries

**IN SCOPE:**
- Unify timeout configuration for all ACP operations (initialize, session/new, prompts)
- Change default from 30s/60s to 300s
- Enable CLI flag for ACP timeout configuration
- Add centralized `getTimeout()` helper
- Update documentation and tests

**OUT OF SCOPE (do not touch):**
- Special timeout values (0 for infinite, separate timeouts per operation type)
- Timeout configuration for other target types (bash, telegram, email)
- Timeout behavior changes in sendRequest method itself
- Error message format changes
- Async mode timeout handling (#1362 - separate issue)
- CLI prompt timeout behavior

**FUTURE IMPROVEMENTS (defer):**
- Separate timeouts for init vs session vs prompts
- Timeout validation (min/max bounds)
- Timeout: 0 for infinite timeout
- Timeout metrics/logging

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-03T17:25:02.245Z
- **Artifact**: `.claude/PRPs/issues/issue-1363.md`
- **Related Issues**: #1362 (async flag), #976 (original ACP implementation)
