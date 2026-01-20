# Investigation: CI Pipeline Failures in Project Scaffolding PR

**Issue**: #7 (https://github.com/tbrandenburg/work/pull/7)
**Type**: BUG
**Investigated**: 2026-01-20T11:07:22Z

### Assessment

| Metric     | Value    | Reasoning                                                                                    |
| ---------- | -------- | -------------------------------------------------------------------------------------------- |
| Severity   | HIGH     | CI failures block PR merge and prevent development workflow from functioning properly       |
| Complexity | LOW      | Security vulnerabilities in dependencies require simple npm audit fix, no code changes      |
| Confidence | HIGH     | Clear evidence from npm audit output showing specific vulnerable packages and fix commands  |

---

## Problem Statement

The project scaffolding PR has failing CI checks preventing merge. Security audit fails due to 19 vulnerabilities (8 low, 11 high) in npm dependencies, and test jobs may be failing due to the same dependency issues or CI configuration problems.

---

## Analysis

### Root Cause / Change Rationale

The CI pipeline is failing because:

1. **Security audit failure**: npm audit detects 19 vulnerabilities in dependencies
2. **Vulnerable packages**: diff <8.0.3, glob 10.2.0-10.4.5, tar <=7.5.2
3. **Transitive dependencies**: Vulnerabilities come through oclif and jest dependency chains

### Evidence Chain

WHY: CI security job fails with exit code 1
↓ BECAUSE: npm audit --audit-level moderate detects vulnerabilities
Evidence: `npm audit` output shows 19 vulnerabilities (8 low, 11 high)

↓ BECAUSE: Dependencies have known security issues
Evidence: 
- diff <8.0.3: DoS vulnerability (GHSA-73rr-hh4g-fpgx)
- glob 10.2.0-10.4.5: Command injection (GHSA-5j98-mcp5-4vw2) 
- tar <=7.5.2: File overwrite vulnerability (GHSA-8qq5-rm4j-mr97)

↓ ROOT CAUSE: Outdated vulnerable dependencies in package.json
Evidence: Dependencies come through @oclif/plugin-plugins and jest/ts-jest chains

### Affected Files

| File            | Lines | Action | Description                    |
| --------------- | ----- | ------ | ------------------------------ |
| `package.json`  | 35-45 | UPDATE | Update vulnerable dependencies |
| `package-lock.json` | ALL | UPDATE | Regenerate after dependency updates |

### Integration Points

- `.github/workflows/ci.yml:47` runs `npm audit --audit-level moderate`
- All test jobs depend on `npm ci` which installs vulnerable packages
- oclif CLI framework depends on vulnerable npm packages

### Git History

- **Introduced**: 31f2b1d - 2026-01-20 - "feat(scaffolding): complete TypeScript CLI foundation"
- **Last modified**: Current commit
- **Implication**: New scaffolding introduced vulnerable dependencies through oclif and jest

---

## Implementation Plan

### Step 1: Fix Security Vulnerabilities

**File**: `package.json`
**Lines**: 35-45 (dependencies section)
**Action**: UPDATE

**Current vulnerable dependencies:**
```json
"@oclif/plugin-plugins": "^5.0.0"
```

**Required change:**
```json
"@oclif/plugin-plugins": "^3.1.0"
```

**Why**: npm audit suggests downgrading to avoid vulnerable npm dependency chain

### Step 2: Run npm audit fix

**Command**: `npm audit fix`
**Action**: EXECUTE

**Why**: Automatically fix vulnerabilities that don't require breaking changes

### Step 3: Regenerate package-lock.json

**File**: `package-lock.json`
**Action**: UPDATE

**Command**: `npm install`

**Why**: Ensure lock file reflects security fixes

### Step 4: Verify CI configuration

**File**: `.github/workflows/ci.yml`
**Lines**: 40-50
**Action**: VERIFY

**Check**: Ensure test jobs run after security fixes

---

## Patterns to Follow

**From codebase - package.json structure:**

```json
// SOURCE: package.json:30-50
// Pattern for dependency management
{
  "dependencies": {
    "@oclif/core": "^4.0.0",
    "@oclif/plugin-help": "^6.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0"
  }
}
```

---

## Edge Cases & Risks

| Risk/Edge Case | Mitigation |
| -------------- | ----------- |
| Breaking changes from dependency updates | Test locally before pushing |
| New vulnerabilities introduced | Run npm audit after each change |
| CI still fails after fixes | Check individual job logs for other issues |

---

## Validation

### Automated Checks

```bash
npm audit --audit-level moderate  # Should exit 0
npm ci                            # Should install without errors  
npm test                          # Should pass all tests
npm run type-check               # Should compile without errors
npm run lint                     # Should pass linting
```

### Manual Verification

1. Push changes and verify CI security job passes
2. Verify all test jobs pass in CI matrix (Node 18.x, 20.x, 22.x)
3. Confirm PR checks show green status

---

## Scope Boundaries

**IN SCOPE:**
- Fix security vulnerabilities in dependencies
- Update package.json and package-lock.json
- Verify CI pipeline passes

**OUT OF SCOPE (do not touch):**
- Core application code changes
- CI workflow configuration changes
- Test code modifications
- Documentation updates

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-01-20T11:07:22Z
- **Artifact**: `.claude/PRPs/issues/issue-7.md`
