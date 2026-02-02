# Investigation: Enhancement: Add capability configuration support to ACP handler

**Issue**: #998 (https://github.com/tbrandenburg/work/issues/998)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-02T18:13:22Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                    |
| ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Not blocking MVP (marked Phase 2), but enables important security controls for production use and follows protocol best practices            |
| Complexity | LOW    | Changes limited to 2 files (type definition + handler), ~40 lines total, simple passthrough logic with no new algorithms or integration risk |
| Confidence | HIGH   | Clear requirements from PoC examples, straightforward type addition, existing handler structure supports it with minimal modification        |

---

## Problem Statement

The ACP handler currently uses minimal capabilities (`capabilities: {}`) in protocol initialization. Users need the ability to configure fine-grained permissions (file system, terminal, editor access) to enable security controls for AI agent interactions, following the ACP protocol's capability negotiation pattern demonstrated in the PoC.

---

## Analysis

### Change Rationale

**Why this change is needed:**

The Agent Client Protocol supports a rich capability negotiation system (as demonstrated in `dev/poc-opencode-server/README.md:118-120`) that allows clients to specify what permissions an AI agent should have:

```javascript
capabilities: {
  fileSystem: { readTextFile: true, writeTextFile: true },
  terminal: { create: true, sendText: true },
  editor: { applyDiff: true, openFile: true }
}
```

Currently, the work CLI hardcodes an empty capabilities object (`src/core/target-handlers/acp-handler.ts:194`), which:
1. Prevents users from restricting AI permissions
2. Doesn't follow ACP protocol best practices
3. Blocks Phase 2 security features

**What this enables:**

- Users can configure which operations the AI can perform
- Security-conscious deployments can restrict file/terminal/editor access
- Follows the ACP protocol specification
- Maintains backward compatibility (defaults to current `{}` behavior)

### Evidence Chain

**WHY**: Users cannot configure AI agent permissions
↓ **BECAUSE**: ACPTargetConfig type doesn't include a capabilities field
**Evidence**: `src/types/notification.ts:38-45` - Current interface has no capabilities property

↓ **BECAUSE**: Handler was implemented with MVP-minimal approach
**Evidence**: `src/core/target-handlers/acp-handler.ts:194` - Comment says "Minimal capabilities for MVP"

↓ **ROOT CAUSE**: Missing type definition and passthrough logic
**Evidence**: Need to add `capabilities?: ACPCapabilities` to config type and pass `config.capabilities || {}` in handler

### Affected Files

| File                                           | Lines    | Action | Description                                  |
| ---------------------------------------------- | -------- | ------ | -------------------------------------------- |
| `src/types/notification.ts`                    | 38-45    | UPDATE | Add ACPCapabilities type and config field    |
| `src/core/target-handlers/acp-handler.ts`      | 194      | UPDATE | Use config.capabilities instead of hardcoded |
| `tests/unit/core/target-handlers/acp-handler.test.ts` | NEW      | UPDATE | Add test cases for capability configuration  |

### Integration Points

- **Notification Service** (`src/core/notification-service.ts:37-56`) - Receives config and passes to handler
- **TargetConfig Union** (`src/types/notification.ts:13-17`) - ACPTargetConfig is part of discriminated union
- **Initialize Protocol** (`acp-handler.ts:185-197`) - Where capabilities are sent to ACP client
- **Test Suite** (`tests/unit/core/target-handlers/acp-handler.test.ts`) - Needs test coverage for new field

### Git History

- **Introduced**: `fed1eb3` - 2024 - "Feature: ACP (Agent Client Protocol) Notification Target (#976)"
- **Last modified**: `5266143` - Recent - "Fix: Add exception handling for ACP notification callbacks"
- **Implication**: Feature is stable (PR merged), enhancement is additive, no breaking changes expected

---

## Implementation Plan

### Step 1: Define ACPCapabilities type

**File**: `src/types/notification.ts`
**Lines**: Before line 38 (add new type)
**Action**: CREATE TYPE

**Add new type definition:**

```typescript
/**
 * ACP client capabilities for permission control
 * @see dev/poc-opencode-server/README.md:111-133 for protocol examples
 */
export interface ACPCapabilities {
  fileSystem?: {
    readTextFile?: boolean;
    writeTextFile?: boolean;
    listDirectory?: boolean;
  };
  terminal?: {
    create?: boolean;
    sendText?: boolean;
  };
  editor?: {
    applyDiff?: boolean;
    openFile?: boolean;
  };
}
```

**Why**: Provides strongly-typed structure matching ACP protocol specification

---

### Step 2: Add capabilities field to ACPTargetConfig

**File**: `src/types/notification.ts`
**Lines**: 38-45
**Action**: UPDATE

**Current code:**

```typescript
export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string; // Mutable to allow session persistence
  onNotification?: (method: string, params: unknown) => void; // Optional streaming callback
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
  onNotification?: (method: string, params: unknown) => void; // Optional streaming callback
  capabilities?: ACPCapabilities; // Optional client capabilities for permission control
}
```

**Why**: Allows users to configure capabilities in their target config

---

### Step 3: Use configured capabilities in handler

**File**: `src/core/target-handlers/acp-handler.ts`
**Lines**: 194
**Action**: UPDATE

**Current code:**

```typescript
        capabilities: {}, // Minimal capabilities for MVP
```

**Required change:**

```typescript
        capabilities: config.capabilities || {}, // Use configured capabilities or default to minimal
```

**Why**: Passes user-configured capabilities to ACP client during initialization, defaults to current behavior if not provided

---

### Step 4: Add test cases for capability configuration

**File**: `tests/unit/core/target-handlers/acp-handler.test.ts`
**Action**: UPDATE
**Lines**: Add new describe block after existing tests

**Test cases to add:**

```typescript
describe('Capability Configuration', () => {
  it('should send configured capabilities to ACP client', async () => {
    // Arrange: Config with specific capabilities
    const configWithCapabilities: ACPTargetConfig = {
      type: 'acp',
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 30,
      capabilities: {
        fileSystem: {
          readTextFile: true,
          writeTextFile: false,
        },
        terminal: {
          create: true,
        },
      },
    };

    // Mock initialize response
    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
        }) + '\n'
      );
    }, 10);

    // Mock session/create response
    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: { sessionId: 'test-session-123' },
        }) + '\n'
      );
    }, 20);

    // Mock notify response
    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          result: null,
        }) + '\n'
      );
    }, 30);

    // Act
    await handler.send(mockWorkItems, configWithCapabilities);
    vi.advanceTimersByTime(100);

    // Assert: Check that initialize request includes capabilities
    const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
      const data = call[0];
      return data.includes('"method":"initialize"');
    });

    expect(initializeCall).toBeDefined();
    const initializeData = JSON.parse(initializeCall[0]);
    expect(initializeData.params.capabilities).toEqual({
      fileSystem: {
        readTextFile: true,
        writeTextFile: false,
      },
      terminal: {
        create: true,
      },
    });
  });

  it('should default to empty capabilities when not configured', async () => {
    // Arrange: Config without capabilities
    const configNoCapabilities: ACPTargetConfig = {
      type: 'acp',
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 30,
    };

    // Mock responses (same pattern as above)
    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
        }) + '\n'
      );
    }, 10);

    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: { sessionId: 'test-session-123' },
        }) + '\n'
      );
    }, 20);

    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          result: null,
        }) + '\n'
      );
    }, 30);

    // Act
    await handler.send(mockWorkItems, configNoCapabilities);
    vi.advanceTimersByTime(100);

    // Assert: Should default to empty object (current MVP behavior)
    const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
      const data = call[0];
      return data.includes('"method":"initialize"');
    });

    expect(initializeCall).toBeDefined();
    const initializeData = JSON.parse(initializeCall[0]);
    expect(initializeData.params.capabilities).toEqual({});
  });

  it('should handle partial capability configuration', async () => {
    // Arrange: Config with only fileSystem capabilities
    const configPartialCapabilities: ACPTargetConfig = {
      type: 'acp',
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 30,
      capabilities: {
        fileSystem: {
          readTextFile: true,
        },
      },
    };

    // Mock responses
    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
        }) + '\n'
      );
    }, 10);

    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          result: { sessionId: 'test-session-123' },
        }) + '\n'
      );
    }, 20);

    setTimeout(() => {
      mockProcess.stdout.emit(
        'data',
        JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          result: null,
        }) + '\n'
      );
    }, 30);

    // Act
    await handler.send(mockWorkItems, configPartialCapabilities);
    vi.advanceTimersByTime(100);

    // Assert: Should pass through partial config as-is
    const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
      const data = call[0];
      return data.includes('"method":"initialize"');
    });

    expect(initializeCall).toBeDefined();
    const initializeData = JSON.parse(initializeCall[0]);
    expect(initializeData.params.capabilities).toEqual({
      fileSystem: {
        readTextFile: true,
      },
    });
  });
});
```

**Why**: Ensures capability configuration works correctly, maintains backward compatibility, and handles partial configurations

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/types/notification.ts:10-24
// Pattern for optional configuration fields with documentation
export interface EmailTargetConfig {
  readonly type: 'email';
  readonly to: string | string[];
  readonly from?: string; // Optional with clear semantics
  readonly subject?: string; // Optional with defaults
  // ...more optional fields
}
```

**Rationale**: Follow same pattern for optional capabilities field

```typescript
// SOURCE: tests/unit/core/target-handlers/acp-handler.test.ts:70-76
// Pattern for test config setup
mockConfig = {
  type: 'acp',
  cmd: 'opencode acp',
  cwd: process.cwd(),
  timeout: 30,
};
```

**Rationale**: Extend test configs with capabilities field for test cases

```typescript
// SOURCE: src/core/target-handlers/acp-handler.ts:190-193
// Pattern for versioned client info
clientInfo: {
  name: 'work-cli',
  version: '0.2.7',
},
```

**Rationale**: Keep existing structure, only modify capabilities line

---

## Edge Cases & Risks

| Risk/Edge Case                              | Mitigation                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Backward compatibility                      | Capabilities field is optional, defaults to `{}` (current behavior)       |
| Invalid capability structure from user      | TypeScript types enforce structure, no runtime validation needed yet      |
| ACP server doesn't support capabilities     | Server's responsibility to handle/ignore, protocol allows empty object    |
| Conflicting capabilities (e.g., read=false) | Pass through as-is, let ACP server interpret and enforce                  |
| Test suite timeout/flakiness                | Tests use fake timers, follow existing patterns from line 33-35           |
| Version skew with protocol                  | Capability structure matches PoC examples (lines 111-133), spec-compliant |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Run all ACP handler tests
npm test -- acp-handler.test.ts

# Run full test suite
npm test

# Lint check
npm run lint
```

### Manual Verification

1. **Type Definition Check**: Verify ACPCapabilities type exports correctly and ACPTargetConfig accepts it
2. **Backward Compatibility**: Create config without capabilities, verify handler still works (defaults to `{}`)
3. **Capability Passthrough**: Create config with capabilities, add debug logging to verify they're sent in initialize request
4. **Test Coverage**: Run `npm test -- --coverage` and verify new code is covered

### Example Usage Test

Create a test config file to manually verify:

```typescript
// test-capabilities.ts
import { ACPTargetConfig } from './src/types/notification';

const config: ACPTargetConfig = {
  type: 'acp',
  cmd: 'opencode acp',
  capabilities: {
    fileSystem: {
      readTextFile: true,
      writeTextFile: false,
    },
  },
};

console.log('Config valid:', config);
```

Run: `npx tsx test-capabilities.ts` - should compile and run without errors

---

## Scope Boundaries

**IN SCOPE:**

- Add ACPCapabilities type definition
- Add capabilities field to ACPTargetConfig
- Update handler to use config.capabilities || {}
- Add test cases for capability configuration
- Update inline documentation/comments

**OUT OF SCOPE (do not touch):**

- Runtime validation of capability structure (future Phase 2 work)
- ACP server-side enforcement (server's responsibility)
- Capability negotiation/fallback logic (protocol handles)
- Other target handlers (email, bash, telegram)
- CLI command interface changes (config file only)
- Documentation updates (not required for internal types)
- Capability permission checking/validation (future security layer)

**DEFERRED TO FUTURE:**

- User-facing documentation examples (wait for Phase 2 rollout)
- Migration guide (no breaking changes needed)
- Advanced capability features (dynamic negotiation, runtime checks)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-02T18:13:22Z
- **Artifact**: `.claude/PRPs/issues/issue-998.md`
- **Related PR**: #976 (ACP feature implementation - merged)
- **Phase**: 2 (Post-MVP enhancement)
- **Breaking Change**: No
- **Estimated LOC**: +40 lines (type: 20, handler: 1, tests: 120)
