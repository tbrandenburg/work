# Feature: Jest to Vitest Migration

## Summary

Complete migration from Jest to Vitest testing framework with breaking change approach, removing all Jest traces and establishing a modern, fast testing setup with native ESM support, improved TypeScript integration, and maintained test coverage.

## User Story

As a developer working on the work CLI project
I want to migrate from Jest to Vitest as the testing framework
So that I can have 10-20x faster test execution, native ES module support without experimental flags, and a more modern testing setup

## Problem Statement

Current Jest setup requires experimental ESM flags, has complex configuration for TypeScript path aliases, and suffers from slower test execution. Vitest offers native ESM support, better TypeScript integration, and significantly faster performance.

## Solution Statement

Complete replacement of Jest with Vitest, including configuration migration, test file updates for mocking syntax changes, CI/CD pipeline updates, and validation to ensure maintained functionality and coverage.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | REFACTOR                                          |
| Complexity             | HIGH                                              |
| Systems Affected       | Testing infrastructure, CI/CD, build scripts     |
| Dependencies           | vitest@^3.0.5, @vitest/coverage-v8@^3.0.5       |
| Estimated Tasks        | 12                                                |
| **Research Timestamp** | **2026-01-23T19:24:07.159+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Developer │ ──────► │ npm test    │ ──────► │ Jest Runner │            ║
║   │   Runs Test │         │ (Jest)      │         │ (Slow)      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                       │                   ║
║                                   ▼                       ▼                   ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │ ESM Issues  │         │ 276 tests   │            ║
║                          │ Exp. Flags  │         │ ~240s exec  │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: npm test → Jest loads with experimental ESM → slow execution     ║
║   PAIN_POINT: Experimental flags, slow performance, complex TS config        ║
║   DATA_FLOW: Test files → ts-jest transform → Jest runner → coverage         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Developer │ ──────► │ npm test    │ ──────► │ Vitest      │            ║
║   │   Runs Test │         │ (Vitest)    │         │ (Fast)      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                       │                   ║
║                                   ▼                       ▼                   ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │ Native ESM  │         │ 276 tests   │            ║
║                          │ Zero Config │         │ ~12-24s     │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: npm test → Vitest loads natively → fast execution with HMR      ║
║   VALUE_ADD: 10-20x faster execution, native ESM, better TypeScript          ║
║   DATA_FLOW: Test files → Native TS/ESM → Vitest runner → v8 coverage        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `npm test` | Jest with experimental flags | Vitest native execution | 10-20x faster test runs |
| `npm run test:watch` | Jest watch mode | Vitest HMR watch mode | 4x faster feedback loop |
| Test files | `jest.mock()` syntax | `vi.mock()` syntax | Native ESM mocking |
| CI/CD | Slow test execution | Fast test execution | Faster deployment pipeline |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `jest.config.js` | all | Current Jest config to REPLACE |
| P0 | `package.json` | 1-50 | Dependencies and scripts to UPDATE |
| P1 | `tests/unit/core/engine.test.ts` | 1-30 | Jest mocking pattern to CONVERT |
| P1 | `tests/e2e/complete-workflow.test.ts` | 1-30 | E2E test pattern to PRESERVE |
| P2 | `.github/workflows/ci.yml` | all | CI configuration to UPDATE |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Vitest Migration Guide](https://vitest.dev/guide/migration) ✓ Current | Jest Migration | Mock syntax changes | 2026-01-23T19:24:07Z |
| [Vitest Config Reference](https://context7.com/vitest-dev/vitest/llms.txt) ✓ Current | Configuration | TypeScript setup | 2026-01-23T19:24:07Z |

---

## Patterns to Mirror

**CURRENT_JEST_CONFIG:**
```javascript
// SOURCE: jest.config.js:1-45
// REPLACE WITH VITEST EQUIVALENT:
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  maxWorkers: '50%',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@/core/(.*)$': '<rootDir>/src/core/$1',
    '^@/adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: [],
  testTimeout: 5000,
  verbose: true
};
```

**JEST_MOCKING_PATTERN:**
```typescript
// SOURCE: tests/unit/core/engine.test.ts:5-25
// CONVERT THIS PATTERN:
import { WorkEngine } from '../../../src/core/engine';
import { LocalFsAdapter } from '../../../src/adapters/local-fs/index';

// Mock the LocalFsAdapter
jest.mock('../../../src/adapters/local-fs/index');

describe('WorkEngine', () => {
  let engine: WorkEngine;
  let mockAdapter: jest.Mocked<LocalFsAdapter>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock adapter
    mockAdapter = {
      initialize: jest.fn(),
      createWorkItem: jest.fn(),
      // ... other methods
    } as any;
  });
```

**E2E_TEST_PATTERN:**
```typescript
// SOURCE: tests/e2e/complete-workflow.test.ts:1-25
// PRESERVE THIS PATTERN:
import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Complete Workflow E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-'));
    process.chdir(testDir);
    
    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });
```

**PACKAGE_JSON_SCRIPTS:**
```json
// SOURCE: package.json:15-25
// UPDATE THESE SCRIPTS:
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

**MAKEFILE_TARGETS:**
```makefile
# SOURCE: Makefile:15-20
# PRESERVE THESE TARGETS:
test:
	npm test -- --coverage

check: lint test
	@echo "All checks passed!"

ci: install lint build test
	@echo "CI pipeline completed successfully!"
```

---

## Current Best Practices Validation

**Security (Verified 2026-01-23):**
- [x] Vitest v3.0.5+ is confirmed patched for CVE-2025-24964
- [x] No known security vulnerabilities in Vitest 3.x ecosystem
- [x] Coverage provider v8 is secure and maintained
- [x] No deprecated testing patterns detected

**Performance (Web Intelligence Verified):**
- [x] Vitest offers 10-20x faster test execution than Jest
- [x] HMR watch mode provides 4x faster feedback
- [x] Native ESM support eliminates transformation overhead
- [x] V8 coverage provider is more accurate than Istanbul

**Community Intelligence:**
- [x] 56kode.com reports successful migration of 2900 tests
- [x] helmerdavila.com completed migration in under 3 hours
- [x] carbonate.dev confirms better ESM and TypeScript support
- [x] No deprecated patterns detected in community discussions

---

## Files to Change

| File                             | Action | Justification                            |
| -------------------------------- | ------ | ---------------------------------------- |
| `package.json`                   | UPDATE | Remove Jest deps, add Vitest deps       |
| `jest.config.js`                 | DELETE | Remove Jest configuration                |
| `vitest.config.ts`               | CREATE | New Vitest configuration                 |
| `tsconfig.json`                  | UPDATE | Add Vitest types                         |
| `.github/workflows/ci.yml`       | UPDATE | Update CI to use Vitest                  |
| `Makefile`                       | UPDATE | Update test commands                     |
| `tests/unit/core/engine.test.ts` | UPDATE | Convert Jest mocks to Vitest mocks      |
| `tests/**/*.test.ts`             | UPDATE | Convert all Jest mocks to Vitest        |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Test content changes - only syntax migration, not test logic
- New test features - maintaining existing test functionality only
- Performance optimizations beyond Vitest's native improvements
- Test structure reorganization - keeping current unit/integration/e2e structure

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Prefer Makefile targets or package scripts when available (e.g., `make test`, `npm run test:coverage`).

**Coverage Targets**: Maintain current 66.42% coverage, minimum 40% threshold

### Task 1: UPDATE `package.json` (dependencies)

- **ACTION**: Remove Jest dependencies and add Vitest dependencies
- **IMPLEMENT**: Remove jest, ts-jest, @types/jest; Add vitest, @vitest/coverage-v8
- **MIRROR**: Keep existing script structure but update commands
- **IMPORTS**: N/A - package.json changes
- **GOTCHA**: Ensure Vitest version compatibility with Node.js 18+
- **CURRENT**: Use Vitest v3.0.5+ (latest secure version as of 2026-01-23)
- **CONFIG_CONFLICTS**: Remove any Jest-specific configurations
- **GENERATED_FILES**: Coverage reports will change from Istanbul to V8 format
- **VALIDATE**: `npm install && npm run type-check`
- **FUNCTIONAL**: N/A - dependency change only
- **TEST_PYRAMID**: No additional tests needed - dependency update only

### Task 2: DELETE `jest.config.js`

- **ACTION**: Remove Jest configuration file
- **IMPLEMENT**: Delete jest.config.js completely
- **MIRROR**: N/A - file deletion
- **IMPORTS**: N/A
- **GOTCHA**: Ensure no other files reference jest.config.js
- **CURRENT**: Clean removal as part of breaking change approach
- **VALIDATE**: `ls jest.config.js` should return "No such file"
- **TEST_PYRAMID**: No additional tests needed - file deletion only

### Task 3: CREATE `vitest.config.ts`

- **ACTION**: Create Vitest configuration with equivalent settings
- **IMPLEMENT**: TypeScript config with path aliases, coverage, and test patterns
- **MIRROR**: Jest config functionality but with Vitest syntax
- **IMPORTS**: `import { defineConfig } from 'vitest/config'`
- **GOTCHA**: Path aliases syntax differs from Jest moduleNameMapper
- **CURRENT**: Use defineConfig for TypeScript support and IntelliSense
- **VALIDATE**: `npx vitest --version && npm run type-check`
- **FUNCTIONAL**: `npx vitest --run --reporter=verbose` - verify config loads
- **TEST_PYRAMID**: No additional tests needed - configuration file only

### Task 4: UPDATE `tsconfig.json` (types)

- **ACTION**: Add Vitest types to TypeScript configuration
- **IMPLEMENT**: Add "vitest/globals" to types array
- **MIRROR**: Existing tsconfig.json structure
- **IMPORTS**: N/A - TypeScript config
- **GOTCHA**: May need to add vitest types if using globals
- **CURRENT**: Follow Vitest TypeScript integration best practices
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - TypeScript configuration only

### Task 5: UPDATE `package.json` (scripts)

- **ACTION**: Update test scripts to use Vitest instead of Jest
- **IMPLEMENT**: Change "jest" to "vitest" in all test scripts
- **MIRROR**: Keep same script names for compatibility
- **IMPORTS**: N/A - package.json scripts
- **GOTCHA**: Vitest CLI flags may differ from Jest
- **CURRENT**: Use Vitest CLI syntax for coverage and watch modes
- **VALIDATE**: `npm run test --help` - verify Vitest CLI loads
- **FUNCTIONAL**: `npm run test -- --version` - verify Vitest executes
- **TEST_PYRAMID**: No additional tests needed - script update only

### Task 6: UPDATE `tests/unit/core/engine.test.ts` (mocking)

- **ACTION**: Convert Jest mocking syntax to Vitest mocking syntax
- **IMPLEMENT**: Replace jest.mock with vi.mock, jest.fn with vi.fn
- **MIRROR**: Keep same test logic, only change mocking syntax
- **IMPORTS**: Add `import { vi } from 'vitest'`
- **GOTCHA**: vi.mock factory must return object with explicit exports
- **CURRENT**: Follow Vitest mocking best practices from migration guide
- **VALIDATE**: `npm run test tests/unit/core/engine.test.ts`
- **FUNCTIONAL**: Verify mocks work correctly in test execution
- **TEST_PYRAMID**: Add integration test for: mock behavior validation

### Task 7: UPDATE all test files (global mocking conversion)

- **ACTION**: Convert all Jest mocking syntax to Vitest across test suite
- **IMPLEMENT**: Find/replace jest.mock → vi.mock, jest.fn → vi.fn, etc.
- **MIRROR**: Preserve all existing test logic and assertions
- **IMPORTS**: Add vi imports where needed
- **GOTCHA**: Each vi.mock needs explicit export object structure
- **CURRENT**: Use Vitest migration patterns for consistent conversion
- **VALIDATE**: `npm run test`
- **FUNCTIONAL**: All 276 tests should pass with new mocking syntax
- **TEST_PYRAMID**: Add E2E test for: complete test suite execution with Vitest

### Task 8: UPDATE `.github/workflows/ci.yml` (CI/CD)

- **ACTION**: Update CI workflow to use Vitest instead of Jest
- **IMPLEMENT**: Change test command from Jest to Vitest
- **MIRROR**: Keep same CI structure and Node.js matrix
- **IMPORTS**: N/A - GitHub Actions workflow
- **GOTCHA**: Coverage upload format may change from lcov
- **CURRENT**: Ensure Codecov compatibility with Vitest coverage
- **VALIDATE**: Check workflow syntax with GitHub Actions validator
- **FUNCTIONAL**: Trigger CI run to verify Vitest execution
- **TEST_PYRAMID**: Add critical user journey test for: CI pipeline with Vitest

### Task 9: UPDATE `Makefile` (test targets)

- **ACTION**: Update Makefile test targets to work with Vitest
- **IMPLEMENT**: Ensure make test, make check, make ci work with Vitest
- **MIRROR**: Keep same Makefile structure and target names
- **IMPORTS**: N/A - Makefile commands
- **GOTCHA**: Coverage flags may differ between Jest and Vitest
- **CURRENT**: Maintain backward compatibility for existing workflows
- **VALIDATE**: `make test && make check && make ci`
- **FUNCTIONAL**: All Makefile targets should execute successfully
- **TEST_PYRAMID**: No additional tests needed - build script update only

### Task 10: VALIDATE test execution performance

- **ACTION**: Measure and validate test execution performance improvement
- **IMPLEMENT**: Run full test suite and measure execution time
- **MIRROR**: N/A - performance validation
- **IMPORTS**: N/A
- **GOTCHA**: First run may be slower due to cache warming
- **CURRENT**: Expect 10-20x performance improvement over Jest
- **VALIDATE**: `time npm run test`
- **FUNCTIONAL**: All 276 tests pass in significantly less time
- **TEST_PYRAMID**: Add performance test for: test execution speed validation

### Task 11: VALIDATE coverage reporting

- **ACTION**: Verify coverage reports match or exceed Jest coverage
- **IMPLEMENT**: Run coverage and compare with previous Jest reports
- **MIRROR**: Same coverage thresholds (40% minimum)
- **IMPORTS**: N/A
- **GOTCHA**: V8 coverage may show different results than Istanbul
- **CURRENT**: V8 coverage is more accurate than Istanbul-based coverage
- **VALIDATE**: `npm run test:coverage`
- **FUNCTIONAL**: Coverage reports generated in coverage/ directory
- **TEST_PYRAMID**: Add integration test for: coverage threshold validation

### Task 12: CLEANUP and final validation

- **ACTION**: Remove any remaining Jest traces and validate complete migration
- **IMPLEMENT**: Search for any remaining Jest references and remove
- **MIRROR**: N/A - cleanup task
- **IMPORTS**: N/A
- **GOTCHA**: Check for Jest references in documentation or comments
- **CURRENT**: Ensure complete Jest removal for breaking change approach
- **VALIDATE**: `grep -r "jest" . --exclude-dir=node_modules --exclude-dir=coverage`
- **FUNCTIONAL**: Full test suite runs without any Jest dependencies
- **TEST_PYRAMID**: Add E2E test for: complete migration validation

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/unit/vitest-migration.test.ts`    | Vitest config loads       | Configuration  |
| `tests/unit/mocking-behavior.test.ts`    | vi.mock works correctly    | Mock behavior  |
| `tests/integration/coverage.test.ts`     | Coverage thresholds met    | Coverage setup |

### Edge Cases Checklist

- [ ] All Jest mocks converted to Vitest syntax
- [ ] Path aliases work correctly in test files
- [ ] Coverage thresholds maintained at 40% minimum
- [ ] CI/CD pipeline executes successfully
- [ ] All 276 existing tests pass
- [ ] Performance improvement validated (10-20x faster)

---

## Validation Commands

**IMPORTANT**: Use actual governed commands from the project's Makefile and package.json.

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && npx vitest --version
```

**EXPECT**: Build succeeds, Vitest version displays

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage
```

**EXPECT**: All 276 tests pass, coverage >= 40%

### Level 4: FULL_SUITE

```bash
make ci
```

**EXPECT**: All checks pass, CI pipeline succeeds

### Level 5: PERFORMANCE_VALIDATION

```bash
time npm run test
```

**EXPECT**: Test execution significantly faster than Jest baseline

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:
- [ ] Vitest configuration follows current best practices
- [ ] No deprecated testing patterns used
- [ ] Coverage setup aligns with current recommendations

### Level 7: MANUAL_VALIDATION

1. Run `npm run test:watch` and verify HMR works
2. Check coverage reports in `coverage/` directory
3. Verify CI pipeline runs successfully on GitHub
4. Confirm no Jest references remain in codebase

---

## Acceptance Criteria

- [ ] All Jest dependencies removed from package.json
- [ ] Vitest configuration created with equivalent functionality
- [ ] All 276 tests pass with Vitest
- [ ] Coverage maintained at >= 40% (current 66.42%)
- [ ] Test execution 10-20x faster than Jest
- [ ] CI/CD pipeline updated and working
- [ ] No Jest traces remain in codebase
- [ ] Path aliases work correctly in test files
- [ ] Mocking behavior equivalent to Jest functionality
- [ ] **Implementation follows current Vitest best practices**
- [ ] **No deprecated testing patterns used**
- [ ] **Performance improvement validated**

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage
- [ ] Level 4: Full CI pipeline succeeds
- [ ] Level 5: Performance improvement validated
- [ ] Level 6: Current standards validation passes
- [ ] Level 7: Manual validation completed
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 documentation queries
**Web Intelligence Sources**: 10 community sources consulted
**Last Verification**: 2026-01-23T20:18:34.422+01:00
**Security Advisories Checked**: CVE-2025-24964 verified - using patched v3.0.5+
**Deprecated Patterns Avoided**: Jest experimental ESM flags, Istanbul coverage

---

## Risks and Mitigations

| Risk                                        | Likelihood   | Impact       | Mitigation                                    |
| ------------------------------------------- | ------------ | ------------ | --------------------------------------------- |
| Mock syntax conversion errors               | MEDIUM       | HIGH         | Systematic conversion with validation per file |
| Coverage threshold failures                 | LOW          | MEDIUM       | V8 coverage is more accurate, may improve     |
| CI/CD pipeline failures                     | LOW          | HIGH         | Test locally before pushing changes           |
| Performance expectations not met            | LOW          | MEDIUM       | Community reports confirm 10-20x improvement |
| Path alias configuration issues             | MEDIUM       | MEDIUM       | Test path resolution in vitest.config.ts     |

---

## Notes

### Migration Strategy

This migration follows a "breaking change" approach as requested, completely removing Jest and establishing a clean Vitest setup. The migration prioritizes:

1. **Performance**: Expected 10-20x faster test execution
2. **Modern Standards**: Native ESM support without experimental flags
3. **Maintainability**: Cleaner configuration and better TypeScript integration
4. **Compatibility**: Maintaining all existing test functionality

### Current Intelligence Considerations

Recent community feedback (2024-2025) shows successful migrations with significant performance improvements. The 56kode.com team migrated 2900 tests successfully, and helmerdavila.com completed migration in under 3 hours. **Vitest v3.0.5+ is the latest secure version** with confirmed patches for CVE-2025-24964, improved coverage reporting and better TypeScript support.

### Expected Outcomes

- Test execution time: ~240s → ~12-24s (10-20x improvement)
- Watch mode feedback: 4x faster with HMR
- Configuration complexity: Reduced (no experimental flags needed)
- TypeScript integration: Improved (native support)
- Coverage accuracy: Better (V8 vs Istanbul)
