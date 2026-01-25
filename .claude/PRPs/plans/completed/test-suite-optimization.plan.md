# Feature: Test Suite Performance Optimization

## Summary

Optimize the work CLI test suite by removing low-business-value tests (branch coverage, edge cases, redundant JSON tests) and consolidating similar functionality. This will reduce test execution time from 144s to approximately 60s (58% improvement) while maintaining quality coverage of critical user flows and business logic.

## User Story

As a developer working on the work CLI
I want a fast, focused test suite that runs in under 60 seconds
So that I can iterate quickly without sacrificing confidence in code quality

## Problem Statement

The current test suite takes 144 seconds to run with 346 tests, containing significant redundancy and low-value tests that focus on implementation details rather than user behavior. Many tests provide minimal defect detection value while consuming substantial execution time.

## Solution Statement

Systematically remove low-business-value tests (branch coverage, edge cases, redundant JSON validation) and consolidate similar tests into focused suites. Maintain high-value E2E tests, core engine tests, and integration tests while eliminating implementation detail testing.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | REFACTOR                                          |
| Complexity             | MEDIUM                                            |
| Systems Affected       | Test suite, CI/CD pipeline                       |
| Dependencies           | vitest@3.2.4, existing test infrastructure       |
| Estimated Tasks        | 8                                                 |
| **Research Timestamp** | **2026-01-25T20:28:53.973Z**                     |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Developer │ ──────► │  npm test   │ ──────► │   144s      │            ║
║   │   Changes   │         │   346 tests │         │   Wait      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ Many Low-   │                                      ║
║                          │ Value Tests │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: Developer makes change → runs tests → waits 144s → gets results ║
║   PAIN_POINT: Long feedback loop, many redundant/low-value tests             ║
║   DATA_FLOW: All 346 tests run regardless of business value                  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Developer │ ──────► │  npm test   │ ──────► │    ~60s     │            ║
║   │   Changes   │         │  ~146 tests │         │   Wait      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ High-Value  │  ◄── Focused on user behavior       ║
║                          │ Tests Only  │      and business logic             ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: Developer makes change → runs tests → waits ~60s → gets results ║
║   VALUE_ADD: 58% faster feedback loop, better defect detection per test      ║
║   DATA_FLOW: Only business-critical tests run, focused on user journeys      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `npm test` | 346 tests, 144s | ~146 tests, ~60s | 58% faster development cycle |
| CI/CD Pipeline | Long test runs | Faster feedback | Quicker deployment cycles |
| Developer Experience | Wait for redundant tests | Focus on meaningful failures | Better productivity |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `vitest.config.ts` | all | Current test configuration to PRESERVE |
| P0 | `package.json` | 10-25 | Test scripts and coverage thresholds |
| P1 | `tests/unit/core/engine.test.ts` | 1-50 | HIGH-value test pattern to MIRROR |
| P1 | `tests/e2e/complete-workflow.test.ts` | 1-30 | E2E test pattern to PRESERVE |
| P2 | `Makefile` | 40-60 | Test execution patterns |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Vitest Docs v3.2.4](https://vitest.dev/guide/performance.html) ✓ Current | Performance Guide | Test optimization techniques | 2026-01-25T20:28:53Z |
| [Vitest Coverage](https://vitest.dev/config/#coverage) ✓ Current | Coverage Configuration | Maintain coverage thresholds | 2026-01-25T20:28:53Z |

---

## Patterns to Mirror

**TEST_STRUCTURE_PATTERN:**
```typescript
// SOURCE: tests/unit/core/engine.test.ts:1-30
// COPY THIS PATTERN FOR REMAINING TESTS:
import { vi } from 'vitest';
import { WorkEngine } from '../../../src/core/engine';

describe('WorkEngine', () => {
  let engine: WorkEngine;
  let mockAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mocks
  });

  describe('createWorkItem', () => {
    it('should create a work item through adapter', async () => {
      // Test implementation
    });
  });
});
```

**E2E_TEST_PATTERN:**
```typescript
// SOURCE: tests/e2e/complete-workflow.test.ts:1-25
// PRESERVE THIS PATTERN:
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';

describe('Complete Workflow E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-'));
    process.chdir(testDir);
  });
});
```

**JSON_TEST_CONSOLIDATION_PATTERN:**
```typescript
// SOURCE: tests/unit/cli/json-output.test.ts:1-20
// MERGE WITH universal-json-support.test.ts:
describe('JSON Output Validation', () => {
  describe('Structured Response Format', () => {
    it('should output structured JSON for create command', () => {
      const result = execSync(`node ${binPath} create "Test JSON task" --format json`);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
    });
  });
});
```

---

## Current Best Practices Validation

**Performance (Context7 MCP Verified):**
- [ ] Vitest performance optimization techniques applied
- [ ] Coverage configuration optimized for speed
- [ ] Test parallelization maintained
- [ ] File shuffling disabled for consistent performance

**Test Quality (Web Intelligence Verified):**
- [ ] Focus on business-critical workflows validated
- [ ] Redundant test elimination follows current best practices
- [ ] Test pyramid principles maintained (70% unit, 20% integration, 10% E2E)
- [ ] Coverage thresholds preserved for quality assurance

**Community Intelligence:**
- [ ] Test Impact Analysis principles applied
- [ ] AI-driven testing approach considerations reviewed
- [ ] Modern test automation best practices followed
- [ ] Context-dependent testing principles applied

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `tests/unit/cli/commands/auth/login-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/auth/logout-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/auth/status-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/context/show-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/edit-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/schema/schema-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/schema/show-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/commands/unset-branches.test.ts` | DELETE | Low-value branch coverage testing |
| `tests/unit/cli/base-command-edge-cases.test.ts` | DELETE | Low-value edge case testing |
| `tests/unit/cli/formatter-edge-cases.test.ts` | DELETE | Low-value edge case testing |
| `tests/unit/cli/json-output-optimized.test.ts` | DELETE | Redundant JSON testing |
| `tests/unit/cli/universal-json-support-optimized.test.ts` | DELETE | Redundant JSON testing |
| `tests/unit/example.test.ts` | DELETE | Placeholder test file |
| `tests/integration/example.test.ts` | DELETE | Placeholder test file |
| `tests/e2e/example.test.ts` | DELETE | Placeholder test file |
| `tests/unit/cli/json-consolidated.test.ts` | CREATE | Consolidated JSON output testing |
| `tests/unit/core/query-focused.test.ts` | CREATE | Focused query testing (30 tests vs 112) |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **New test functionality** - Only removing/consolidating existing tests
- **Test framework changes** - Keeping vitest, not switching frameworks  
- **Coverage threshold changes** - Maintaining current 40% threshold
- **CI/CD pipeline changes** - Only affecting test execution time, not pipeline structure
- **Test data/fixtures changes** - Preserving existing test setup patterns

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use `make test` or `npm test -- --coverage` as available.

**Coverage Targets**: Maintain current 40% threshold, optimize for speed not coverage increase.

### Task 1: DELETE branch coverage test files

- **ACTION**: Remove all *-branches.test.ts files
- **IMPLEMENT**: Delete 8 branch coverage test files that test implementation details
- **RATIONALE**: Branch coverage tests provide minimal business value and focus on code paths rather than user behavior
- **CURRENT**: Following modern test automation best practices that prioritize business-critical workflows
- **VALIDATE**: `npm test && npm run type-check`
- **FUNCTIONAL**: `npm test` - verify remaining tests still pass
- **TEST_PYRAMID**: No additional tests needed - removing low-value tests only

### Task 2: DELETE edge case test files

- **ACTION**: Remove edge case test files
- **IMPLEMENT**: Delete base-command-edge-cases.test.ts and formatter-edge-cases.test.ts
- **RATIONALE**: Edge case tests for CLI framework and formatting are unlikely production scenarios
- **VALIDATE**: `npm test && npm run lint`
- **TEST_PYRAMID**: No additional tests needed - removing low-value tests only

### Task 3: DELETE redundant JSON test files

- **ACTION**: Remove optimized JSON test duplicates
- **IMPLEMENT**: Delete json-output-optimized.test.ts and universal-json-support-optimized.test.ts
- **RATIONALE**: These are duplicates of existing JSON output tests
- **VALIDATE**: `npm test`
- **TEST_PYRAMID**: No additional tests needed - removing duplicates only

### Task 4: DELETE example/placeholder test files

- **ACTION**: Remove all example.test.ts files
- **IMPLEMENT**: Delete placeholder test files from unit/, integration/, and e2e/ directories
- **RATIONALE**: Placeholder tests provide no business value
- **VALIDATE**: `npm test`
- **TEST_PYRAMID**: No additional tests needed - removing placeholder tests only

### Task 5: CREATE consolidated JSON test file

- **ACTION**: Merge json-output.test.ts and universal-json-support.test.ts
- **IMPLEMENT**: Create tests/unit/cli/json-consolidated.test.ts with essential JSON output tests
- **MIRROR**: `tests/unit/cli/json-output.test.ts:1-50` - preserve core JSON validation pattern
- **RATIONALE**: Consolidate redundant JSON testing into single focused file
- **CURRENT**: [Vitest Docs - Test Organization](https://vitest.dev/guide/test-organization.html)
- **VALIDATE**: `npm test -- tests/unit/cli/json-consolidated.test.ts`
- **FUNCTIONAL**: `node bin/run.js create "Test" --format json` - verify JSON output works
- **TEST_PYRAMID**: Consolidating existing tests - no additional coverage needed

### Task 6: DELETE original JSON test files

- **ACTION**: Remove original JSON test files after consolidation
- **IMPLEMENT**: Delete json-output.test.ts and universal-json-support.test.ts
- **RATIONALE**: Replaced by consolidated version in Task 5
- **VALIDATE**: `npm test`
- **TEST_PYRAMID**: No additional tests needed - replaced by consolidated version

### Task 7: CREATE focused query test file

- **ACTION**: Create streamlined query test file with core functionality only
- **IMPLEMENT**: Extract 30 most important tests from query.test.ts (481 lines) focusing on core parsing and execution
- **MIRROR**: `tests/unit/core/query.test.ts:1-50` - preserve test structure pattern
- **RATIONALE**: Query parsing is important but over-tested with 112 test cases
- **CURRENT**: [Vitest Performance Guide](https://vitest.dev/guide/performance.html) - focus on essential test cases
- **VALIDATE**: `npm test -- tests/unit/core/query-focused.test.ts`
- **FUNCTIONAL**: Test query parsing with `parseQuery('where state=active')` in Node REPL
- **TEST_PYRAMID**: Add integration test for: query execution with real work items

### Task 8: DELETE original query test file and verify performance

- **ACTION**: Remove original query.test.ts and measure performance improvement
- **IMPLEMENT**: Delete query.test.ts and run full test suite to measure time improvement
- **RATIONALE**: Replaced by focused version with essential tests only
- **VALIDATE**: `time npm test` - measure total execution time
- **FUNCTIONAL**: `npm test` - verify all remaining tests pass
- **EXPECTED**: Test execution time reduced from 144s to approximately 60s (58% improvement)
- **TEST_PYRAMID**: No additional tests needed - optimization complete

---

## Testing Strategy

### High-Value Tests to Preserve

| Test File | Test Cases | Business Value |
|-----------|------------|----------------|
| `tests/e2e/complete-workflow.test.ts` | Full user journey | HIGH - Core user flows |
| `tests/e2e/work-item-lifecycle.test.ts` | State transitions | HIGH - Critical business logic |
| `tests/unit/core/engine.test.ts` | Business logic | HIGH - Core functionality |
| `tests/integration/adapters/github/github-adapter.test.ts` | GitHub integration | HIGH - Key backend |

### Consolidated Test Structure

| New Test File | Consolidates | Test Count |
|---------------|--------------|------------|
| `tests/unit/cli/json-consolidated.test.ts` | json-output.test.ts + universal-json-support.test.ts | ~15 (from 61) |
| `tests/unit/core/query-focused.test.ts` | query.test.ts (focused) | ~30 (from 112) |

### Edge Cases Checklist

- [ ] Core query parsing functionality preserved
- [ ] Essential JSON output validation maintained  
- [ ] Critical user journey tests untouched
- [ ] Integration test coverage preserved
- [ ] Coverage thresholds maintained at 40%

---

## Validation Commands

**IMPORTANT**: Use project's governed commands from package.json and Makefile.

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && node bin/run.js create "Test task" --format json
```

**EXPECT**: Build succeeds, JSON output works correctly

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage
```

**EXPECT**: All tests pass, coverage >= 40%

### Level 4: FULL_SUITE_PERFORMANCE

```bash
time npm test
```

**EXPECT**: All tests pass in approximately 60 seconds (vs previous 144s)

### Level 5: MANUAL_VALIDATION

1. **Verify core functionality**: `node bin/run.js create "Test" && node bin/run.js list`
2. **Verify JSON output**: `node bin/run.js list --format json`
3. **Verify query functionality**: `node bin/run.js list where state=new`
4. **Check test count reduction**: Count remaining test files vs original

---

## Acceptance Criteria

- [ ] Test execution time reduced from 144s to ~60s (58% improvement)
- [ ] ~200 low-value test cases removed (branch coverage, edge cases, redundant JSON)
- [ ] High-value tests preserved (E2E workflows, core engine, GitHub integration)
- [ ] Coverage threshold maintained at 40%
- [ ] All remaining tests pass with exit 0
- [ ] Core CLI functionality unaffected
- [ ] JSON output functionality preserved
- [ ] Query parsing functionality preserved
- [ ] **No business-critical test coverage lost**

---

## Completion Checklist

- [ ] All 15 low-value test files deleted
- [ ] JSON tests consolidated into single focused file
- [ ] Query tests reduced from 112 to 30 essential cases
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage >= 40%
- [ ] Level 4: Full test suite runs in ~60 seconds
- [ ] Level 5: Manual validation confirms core functionality works
- [ ] Performance improvement of 58% achieved
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (Vitest documentation and performance optimization)
**Web Intelligence Sources**: 10 (Test automation best practices, performance optimization)
**Last Verification**: 2026-01-25T20:28:53Z
**Security Advisories Checked**: 0 (refactoring existing tests, no new dependencies)
**Deprecated Patterns Avoided**: Branch coverage testing, excessive edge case testing

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Accidentally removing critical test coverage | LOW | HIGH | Preserve all HIGH-value tests identified in analysis |
| Breaking existing CI/CD pipeline | LOW | MEDIUM | Maintain same test commands and coverage thresholds |
| Performance improvement less than expected | MEDIUM | LOW | Conservative estimate based on test count reduction |
| Coverage dropping below 40% threshold | LOW | MEDIUM | Monitor coverage during each deletion step |

---

## Notes

### Current Intelligence Considerations

Based on 2026 testing best practices research:
- **Test Impact Analysis**: Focus on business-critical workflows over implementation details
- **AI-driven testing**: Eliminate redundant tests that provide minimal defect detection value  
- **Context-dependent testing**: Preserve tests that validate real user scenarios
- **Performance optimization**: Modern test suites should provide fast feedback loops

### Performance Calculation

- **Current**: 346 tests in 144 seconds = 0.42s per test average
- **Removing**: ~200 low-value tests
- **Remaining**: ~146 high-value tests  
- **Expected**: 146 tests × 0.42s = ~61 seconds (58% improvement)
- **Conservative estimate**: ~60 seconds accounting for test overhead

### Quality Assurance

The optimization maintains quality by:
- Preserving all E2E tests that validate user journeys
- Keeping core engine and integration tests
- Maintaining coverage thresholds
- Focusing on business value over implementation details
