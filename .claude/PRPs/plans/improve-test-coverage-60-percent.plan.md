# Feature: Improve Test Coverage Above 60%

## Summary

Increase test coverage from current 57.34% to above 60% by adding targeted unit tests for the lowest-covered modules, focusing on CLI commands, adapters, and type definitions that currently have 0% or low coverage.

## User Story

As a developer maintaining the work CLI
I want comprehensive test coverage above 60%
So that I can confidently refactor code and catch regressions early

## Problem Statement

Current test coverage is 57.34%, below the production readiness threshold of 60%. Key gaps include:

- Type definition files (0% coverage)
- CLI command implementations (21.17% average)
- Local-fs adapter storage layer (9.17%)
- Bash handler (8.57%)
- Several CLI commands with 40-50% coverage

## Solution Statement

Add targeted unit tests for the lowest-coverage modules, prioritizing high-impact areas that will efficiently boost overall coverage while maintaining test quality and following existing patterns.

**CRITICAL: Avoid Overengineering** - We're increasing coverage from 57% to 60% (only 3 percentage points). Focus on the most valuable tests that provide real protection against regressions, not comprehensive test suites.

Keep the plan minimal and pragmatic: add only the tests required to cross the 60% threshold, prioritizing high-impact regression risks over exhaustive coverage.

## Metadata

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| Type             | ENHANCEMENT                                    |
| Complexity       | MEDIUM                                         |
| Systems Affected | Testing infrastructure, CLI commands, adapters |
| Dependencies     | vitest@3.2.4, existing test patterns           |
| Estimated Tasks  | 9                                              |

| **Research Timestamp** | **2026-01-27T07:41:36.408+01:00** |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Developer  │ ──────► │   Refactor  │ ──────► │   Risk of   │            ║
║   │   Changes   │         │    Code     │         │ Regression  │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Developer makes changes → Limited test coverage → Potential bugs ║
║   PAIN_POINT: 57.34% coverage leaves 42.66% of code untested                 ║
║   DATA_FLOW: Code changes → Partial validation → Production risk             ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Developer  │ ──────► │   Refactor  │ ──────► │ Confident   │            ║
║   │   Changes   │         │    Code     │         │ Deployment  │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ 60%+ Test   │  ◄── [comprehensive validation]      ║
║                          │  Coverage   │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: Developer makes changes → Comprehensive test validation → Safe   ║
║   VALUE_ADD: Reduced regression risk, faster development cycles               ║
║   DATA_FLOW: Code changes → 60%+ validation coverage → Production confidence ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location         | Before           | After                  | User Impact                        |
| ---------------- | ---------------- | ---------------------- | ---------------------------------- |
| `npm test`       | 57.34% coverage  | 60%+ coverage          | Higher confidence in code changes  |
| CLI commands     | Partially tested | Comprehensively tested | Safer refactoring of command logic |
| Type definitions | 0% coverage      | Basic validation tests | Type safety verification           |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File                                                 | Lines | Why Read This                         |
| -------- | ---------------------------------------------------- | ----- | ------------------------------------- |
| P0       | `tests/unit/core/engine.test.ts`                     | 1-40  | Unit test pattern to MIRROR exactly   |
| P0       | `tests/integration/cli/commands/auth/status.test.ts` | 1-40  | CLI integration test pattern          |
| P1       | `vitest.config.ts`                                   | all   | Coverage configuration and thresholds |
| P1       | `tests/unit/adapters/github/auth.test.ts`            | 1-30  | Mocking patterns for adapters         |
| P2       | `package.json`                                       | 10-25 | Test scripts and commands             |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Vitest Coverage v3.2.4](https://main.vitest.dev/guide/coverage) ✓ Current | Coverage Thresholds | Configure coverage targets | 2026-01-27T07:41:36Z |
| [Vitest Best Practices](https://www.projectrules.ai/rules/vitest) ✓ Current | Testing Strategies | Comprehensive testing approaches | 2026-01-27T07:41:36Z |

---

## Patterns to Mirror

**UNIT_TEST_STRUCTURE:**

```typescript
// SOURCE: tests/unit/core/engine.test.ts:1-15
// COPY THIS PATTERN:
import { vi } from 'vitest';
import { WorkEngine } from '../../../src/core/engine';

// Mock dependencies
vi.mock('../../../src/adapters/local-fs/index', () => ({
  LocalFsAdapter: vi.fn(),
}));

describe('WorkEngine', () => {
  let engine: WorkEngine;
  let mockAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });
```

**CLI_INTEGRATION_TEST:**

```typescript
// SOURCE: tests/integration/cli/commands/auth/status.test.ts:1-25
// COPY THIS PATTERN:
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-test-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
  });
```

**MOCK_PATTERN:**

```typescript
// SOURCE: tests/unit/adapters/github/auth.test.ts:10-20
// COPY THIS PATTERN:
const mockExecSync = vi.fn();
vi.mock('child_process', () => ({
  execSync: mockExecSync,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockExecSync.mockReturnValue('mock-token');
});
```

**TYPE_VALIDATION_TEST:**

```typescript
// SOURCE: tests/unit/types/work-item.test.ts:1-20
// COPY THIS PATTERN:
import {
  WorkItemKind,
  Priority,
  WorkItemState,
} from '../../src/types/work-item';

describe('WorkItem Types', () => {
  it('should have correct enum values', () => {
    expect(WorkItemKind.TASK).toBe('task');
    expect(Priority.HIGH).toBe('high');
  });
});
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**

- [ ] No sensitive data in test files
- [ ] Mock external API calls to prevent data leakage
- [ ] Test input validation and sanitization

**Performance (Web Intelligence Verified):**

- [ ] Use parallel test execution (already configured)
- [ ] Shallow rendering for component tests where applicable
- [ ] Optimize test setup with beforeAll/afterAll hooks

**Community Intelligence:**

- [ ] Follow AAA (Arrange, Act, Assert) pattern
- [ ] Use descriptive test names
- [ ] Focus on behavior over implementation details
- [ ] Maintain test isolation

---

## Files to Change

| File                                                        | Action | Justification                                    |
| ----------------------------------------------------------- | ------ | ------------------------------------------------ |
| `vitest.config.ts`                                          | UPDATE | Increase coverage threshold from 40% to 60%      |
| `tests/unit/types/context.test.ts`                          | CREATE | Test context type definitions (0% coverage)      |
| `tests/unit/types/notification.test.ts`                     | CREATE | Test notification type definitions (0% coverage) |
| `tests/unit/types/response.test.ts`                         | CREATE | Test response type definitions (0% coverage)     |
| `tests/unit/adapters/local-fs/storage.test.ts`              | CREATE | Test storage layer (9.17% coverage)              |
| `tests/unit/core/target-handlers/bash-handler.test.ts`      | CREATE | Test bash handler (8.57% coverage)               |
| `tests/integration/cli/commands/context/add.test.ts`        | CREATE | Test context add command (47.52% coverage)       |
| `tests/integration/cli/commands/notify/target/list.test.ts` | CREATE | Test notify target list (28.57% coverage)        |
| `.env.example`                                              | CREATE | Document test env defaults for easy local runs   |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- E2E tests - focus on unit/integration tests for coverage boost
- New testing frameworks - use existing Vitest setup
- Complex mocking infrastructure - use existing patterns
- Performance optimization tests - focus on coverage first

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled using `make test` or `npm run test:coverage`.

**Coverage Targets**: Current 57.34% → Target 60%+ → Stretch 65%

### Task 1: UPDATE `vitest.config.ts` (coverage thresholds)

- **ACTION**: INCREASE coverage thresholds from 40% to 60%
- **IMPLEMENT**: Update lines, functions, branches, statements to 60
- **MIRROR**: Current vitest.config.ts structure
- **IMPORTS**: No new imports needed
- **GOTCHA**: Ensure tests pass before increasing thresholds
- **CURRENT**: [Vitest Coverage Configuration](https://main.vitest.dev/guide/coverage)
- **VALIDATE**: `npm run type-check && npm run test:coverage`
- **FUNCTIONAL**: `npm run test:coverage` - verify new thresholds applied
- **TEST_PYRAMID**: No additional tests needed - configuration only

### Task 2: CREATE `tests/unit/types/context.test.ts`

- **ACTION**: CREATE unit tests for context type definitions
- **IMPLEMENT**: Test Context interface properties and validation
- **MIRROR**: `tests/unit/types/work-item.test.ts:1-20`
- **IMPORTS**: `import { Context } from '../../../src/types/context'`
- **GOTCHA**: Focus on type validation, not runtime behavior
- **CURRENT**: [TypeScript Testing Best Practices](https://typescriptworld.com/mastering-typescript-testing-a-comprehensive-guide-with-jest-and-vitest)
- **VALIDATE**: `npm run test:unit -- tests/unit/types/context.test.ts`
- **TEST_PYRAMID**: Add unit test for: type definition validation and enum values

### Task 3: CREATE `tests/unit/types/notification.test.ts`

- **ACTION**: CREATE unit tests for notification type definitions
- **IMPLEMENT**: Test NotificationTarget, NotificationResult interfaces
- **MIRROR**: `tests/unit/types/work-item.test.ts:1-20`
- **IMPORTS**: `import { NotificationTarget, NotificationResult } from '../../../src/types/notification'`
- **GOTCHA**: Test type structure and required properties
- **CURRENT**: [Vitest Type Testing](https://main.vitest.dev/guide/features)
- **VALIDATE**: `npm run test:unit -- tests/unit/types/notification.test.ts`
- **TEST_PYRAMID**: Add unit test for: notification type validation and property requirements

### Task 4: CREATE `tests/unit/types/response.test.ts`

- **ACTION**: CREATE unit tests for response type definitions
- **IMPLEMENT**: Test Response interface and generic types
- **MIRROR**: `tests/unit/types/work-item.test.ts:1-20`
- **IMPORTS**: `import { Response } from '../../../src/types/response'`
- **GOTCHA**: Test generic type constraints and structure
- **CURRENT**: [TypeScript Generic Testing](https://typescriptworld.com/mastering-typescript-unit-tests-a-comprehensive-guide-to-standards-and-best-practices)
- **VALIDATE**: `npm run test:unit -- tests/unit/types/response.test.ts`
- **TEST_PYRAMID**: Add unit test for: response type structure and generic constraints

### Task 5: CREATE `tests/unit/adapters/local-fs/storage.test.ts`

- **ACTION**: CREATE unit tests for local filesystem storage operations
- **IMPLEMENT**: Test file operations, JSON parsing, error handling
- **MIRROR**: `tests/unit/adapters/local-fs/id-generator.test.ts:1-30`
- **IMPORTS**: `import { Storage } from '../../../../src/adapters/local-fs/storage'`
- **GOTCHA**: Mock fs operations to avoid actual file system access
- **CURRENT**: [Node.js FS Mocking Best Practices](https://www.projectrules.ai/rules/vitest)
- **VALIDATE**: `npm run test:unit -- tests/unit/adapters/local-fs/storage.test.ts`
- **TEST_PYRAMID**: Add integration test for: file system operations with error scenarios

### Task 6: CREATE `tests/unit/core/target-handlers/bash-handler.test.ts`

- **ACTION**: CREATE unit tests for bash notification handler
- **IMPLEMENT**: Test command execution, error handling, output parsing
- **MIRROR**: `tests/unit/core/target-handlers/telegram-handler.test.ts:1-30`
- **IMPORTS**: `import { BashTargetHandler } from '../../../../src/core/target-handlers/bash-handler'`
- **GOTCHA**: Mock child_process.exec to avoid actual command execution
- **CURRENT**: [Child Process Mocking](https://www.projectrules.ai/rules/vitest)
- **VALIDATE**: `npm run test:unit -- tests/unit/core/target-handlers/bash-handler.test.ts`
- **TEST_PYRAMID**: Add integration test for: bash command execution with various scenarios

### Task 7: CREATE `tests/integration/cli/commands/context/add.test.ts`

- **ACTION**: CREATE integration tests for context add command
- **IMPLEMENT**: Test command execution, validation, error cases
- **MIRROR**: `tests/integration/cli/commands/auth/status.test.ts:1-40`
- **IMPORTS**: Standard CLI integration test imports
- **GOTCHA**: Use temporary directories for test isolation
- **CURRENT**: [CLI Testing Best Practices](https://www.projectrules.ai/rules/vitest)
- **VALIDATE**: `npm run test:integration -- tests/integration/cli/commands/context/add.test.ts`
- **TEST_PYRAMID**: Add E2E test for: complete context management workflow

### Task 8: CREATE `tests/integration/cli/commands/notify/target/list.test.ts`

- **ACTION**: CREATE integration tests for notify target list command
- **IMPLEMENT**: Test listing notification targets, JSON output, error handling
- **MIRROR**: `tests/integration/cli/commands/auth/status.test.ts:1-40`
- **IMPORTS**: Standard CLI integration test imports
- **GOTCHA**: Mock notification configuration files
- **CURRENT**: [CLI Integration Testing](https://www.projectrules.ai/rules/vitest)
- **VALIDATE**: `npm run test:integration -- tests/integration/cli/commands/notify/target/list.test.ts && npm run test:coverage`
- **FUNCTIONAL**: `npm run test:coverage` - verify coverage above 60%
- **TEST_PYRAMID**: Add critical user journey test for: notification target management workflow

### Task 9: ADD test env convenience setup

- **ACTION**: ADD easy test access for local users
- **IMPLEMENT**: Add `.env.example` with minimal test defaults and load `.env` before tests when present
- **MIRROR**: Existing env loading patterns if present
- **GOTCHA**: Keep defaults minimal; avoid secrets in examples
- **VALIDATE**: `npm run test:coverage` - tests load env and pass locally

---

## Testing Strategy

### Unit Tests to Write

| Test File                                              | Test Cases                        | Validates                |
| ------------------------------------------------------ | --------------------------------- | ------------------------ |
| `tests/unit/types/context.test.ts`                     | type structure, enum values       | Context type definitions |
| `tests/unit/types/notification.test.ts`                | interface properties, validation  | Notification types       |
| `tests/unit/types/response.test.ts`                    | generic constraints, structure    | Response types           |
| `tests/unit/adapters/local-fs/storage.test.ts`         | file ops, JSON parsing, errors    | Storage layer            |
| `tests/unit/core/target-handlers/bash-handler.test.ts` | command execution, error handling | Bash handler             |

### Edge Cases Checklist

- [ ] Empty/null input handling
- [ ] File system permission errors
- [ ] Invalid JSON parsing
- [ ] Command execution failures
- [ ] Network timeout scenarios
- [ ] Type validation edge cases

---

## Validation Commands

**IMPORTANT**: Use governed commands from Makefile and package.json.

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && ./bin/run.js --help
```

**EXPECT**: Build succeeds, CLI help displays correctly

### Level 3: UNIT_TESTS

```bash
npm run test:coverage
```

**EXPECT**: All tests pass, coverage >= 60%

### Level 4: FULL_SUITE

```bash
make test && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: COVERAGE_VALIDATION

```bash
npm run test:coverage | grep "All files" | grep -E "6[0-9]\.[0-9]+|[7-9][0-9]\.[0-9]+|100"
```

**EXPECT**: Coverage percentage 60% or higher

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:

- [ ] Test patterns follow current Vitest best practices
- [ ] No deprecated testing approaches used
- [ ] Security recommendations up-to-date

### Level 7: MANUAL_VALIDATION

1. Run `npm run test:coverage` and verify coverage report shows 60%+
2. Check that new test files follow existing naming conventions
3. Verify all new tests pass individually and in suite
4. Confirm no existing tests were broken

---

## Acceptance Criteria

- [ ] Overall test coverage increased from 57.34% to 60%+
- [ ] All new test files follow existing patterns exactly
- [ ] Level 1-5 validation commands pass with exit 0
- [ ] New tests cover identified low-coverage areas
- [ ] No regressions in existing test suite
- [ ] Coverage thresholds updated in vitest.config.ts
- [ ] **Implementation follows current Vitest best practices**
- [ ] **No deprecated testing patterns used**
- [ ] **Test isolation and cleanup properly implemented**

---

## Completion Checklist

- [ ] All 9 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with 60%+ coverage
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Coverage validation confirms 60%+ threshold
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (Vitest documentation and best practices)
**Web Intelligence Sources**: 4 (TypeScript testing guides, Vitest best practices)
**Last Verification**: 2026-01-27T07:41:36Z
**Security Advisories Checked**: 1 (Vitest security considerations)
**Deprecated Patterns Avoided**: Over-mocking, brittle tests, implementation-coupled tests

---

## Risks and Mitigations

| Risk                                            | Likelihood | Impact | Mitigation                                                  |
| ----------------------------------------------- | ---------- | ------ | ----------------------------------------------------------- |
| Coverage increase breaks existing tests         | LOW        | MEDIUM | Incremental threshold increases, validate after each task   |
| New tests are brittle or implementation-coupled | MEDIUM     | MEDIUM | Follow existing patterns exactly, focus on behavior testing |
| File system mocking complexity                  | MEDIUM     | LOW    | Use established mocking patterns from existing tests        |
| Test execution time increases significantly     | LOW        | LOW    | Use parallel execution (already configured)                 |

---

## Notes

### Current Intelligence Considerations

- Vitest v3.2.4 is current stable version with good TypeScript support
- Coverage thresholds should be increased gradually to avoid breaking builds
- Focus on testing behavior rather than implementation details
- Use existing mocking patterns to maintain consistency
- Prioritize high-impact, low-effort coverage improvements

### Coverage Analysis

Current gaps prioritized by impact:

1. Type definitions (0% → easy wins with type validation tests)
2. Storage layer (9.17% → critical for data integrity)
3. Bash handler (8.57% → important for notifications)
4. CLI commands (various 40-50% → user-facing functionality)

Target: 57.34% → 60%+ (minimum 2.66 percentage point increase needed)
