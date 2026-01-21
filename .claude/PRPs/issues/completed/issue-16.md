# Investigation: CI Coverage Threshold Failure

**Issue**: #16 (https://github.com/tbrandenburg/work/pull/16)
**Type**: BUG
**Investigated**: 2026-01-21T18:28:02.875+01:00

### Assessment

| Metric     | Value    | Reasoning                                                                                                    |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Severity   | MEDIUM   | CI pipeline blocked preventing merge, but proper solution is to improve test coverage                       |
| Complexity | MEDIUM   | Multiple test files need updates, requires understanding command logic and error paths                       |
| Confidence | HIGH     | Clear root cause identified with concrete evidence from git history and CI logs                             |

---

## Problem Statement

The CI pipeline fails with "coverage threshold for branches (30%) not met: 26.72%". The auth/schema commands implementation added new code paths but insufficient branch coverage tests, causing the overall branch coverage to drop below the required 30% threshold.

---

## Analysis

### Root Cause / Change Rationale

The auth and schema commands have 0% branch coverage because the tests only cover the happy path. Critical branches like error handling, conditional logic, and format options are untested.

### Evidence Chain

WHY: CI fails with "coverage threshold for branches (30%) not met: 26.72%"
↓ BECAUSE: New auth/schema commands have 0% branch coverage
Evidence: Coverage report shows `src/cli/commands/auth: 34.54% stmts, 0% branch`

↓ BECAUSE: Tests only cover happy path, missing error cases and conditional branches
Evidence: Current tests don't test error handling, context arguments, or format options

↓ ROOT CAUSE: Insufficient test coverage for new command branches
Evidence: Lines 20-38 in auth commands and 30-68 in schema commands are uncovered

### Affected Files

| File                                  | Lines  | Action | Description                                    |
| ------------------------------------- | ------ | ------ | ---------------------------------------------- |
| `tests/unit/cli/commands/auth/*.test.ts` | NEW    | UPDATE | Add branch coverage tests for error cases     |
| `tests/unit/cli/commands/schema/*.test.ts` | NEW    | UPDATE | Add branch coverage tests for conditional logic |

### Integration Points

- Auth commands have conditional context setting and error handling
- Schema commands have format branching (table vs JSON) and error handling
- All commands have try/catch blocks that need error case testing

### Coverage Analysis

**Critical Missing Branches:**
- Error handling in try/catch blocks (0% coverage)
- Conditional context argument handling (0% coverage) 
- Format option branching in schema commands (0% coverage)
- Optional field display logic (authStatus.expiresAt, etc.)

---

## Implementation Plan

### Step 1: Add error handling branch tests for auth commands

**Files**: `tests/unit/cli/commands/auth/*.test.ts`
**Action**: UPDATE

**Missing branches to test:**
- Engine authentication failure (catch block)
- Context argument handling (if args.context)
- Optional expiresAt display logic

### Step 2: Add format and error branch tests for schema commands

**Files**: `tests/unit/cli/commands/schema/*.test.ts`  
**Action**: UPDATE

**Missing branches to test:**
- JSON format option (if flags.format === 'json')
- Engine schema failure (catch block)
- Context argument handling (if args.context)
- Optional description display logic

### Step 3: Add comprehensive error simulation tests

**Files**: All command test files
**Action**: UPDATE

**Test scenarios to add:**
- Mock engine methods to throw errors
- Test both format options (table/json)
- Test with and without context arguments
- Test optional field display branches

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: tests/unit/cli/commands/auth/login.test.ts:25-35
// Pattern for error handling tests
it('should handle authentication error', () => {
  // Mock engine to throw error
  jest.spyOn(WorkEngine.prototype, 'authenticate').mockRejectedValue(new Error('Auth failed'));
  
  expect(() => {
    execSync(`node ${binPath} auth login`, { encoding: 'utf8', stdio: 'pipe' });
  }).toThrow();
});

// Pattern for format option testing
it('should support JSON format', () => {
  const result = execSync(`node ${binPath} schema show --format json`, { encoding: 'utf8' });
  expect(() => JSON.parse(result)).not.toThrow();
});

// Pattern for conditional branch testing  
it('should handle context argument', () => {
  const result = execSync(`node ${binPath} auth login mycontext`, { encoding: 'utf8' });
  expect(result).toContain('Authentication successful');
});
```

---

## Edge Cases & Risks

| Risk/Edge Case                    | Mitigation                                                    |
| --------------------------------- | ------------------------------------------------------------- |
| Mocking engine methods breaks tests | Use proper jest.spyOn with restore in afterEach            |
| Format tests are brittle          | Test JSON.parse() success rather than exact format          |
| Context tests affect other tests  | Use isolated test directories and proper cleanup            |

---

## Validation

### Automated Checks

```bash
npm run type-check   # Verify no TypeScript errors
npm test -- --coverage  # Verify coverage reaches 30% branches
npm run lint         # Verify no linting issues
```

### Manual Verification

1. Verify branch coverage increases from 26.72% to >30%
2. Confirm all new tests pass and are meaningful
3. Ensure error cases are properly tested without breaking functionality

---

## Scope Boundaries

**IN SCOPE:**

- Adding branch coverage tests for auth/schema commands
- Testing error handling, format options, and conditional logic
- Achieving 30% branch coverage threshold

**OUT OF SCOPE (do not touch):**

- Modifying jest.config.js thresholds (keep at 30%)
- Changing command implementation logic
- Adding tests for existing commands (focus on new auth/schema only)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-01-21T18:28:02.875+01:00
- **Artifact**: `.claude/PRPs/issues/issue-16.md`
