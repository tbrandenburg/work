# Investigation: Complete work CLI core engine with local-fs adapter

**Issue**: #9 (https://github.com/tbrandenburg/work/pull/9)
**Type**: BUG
**Investigated**: 2026-01-20T14:51:58.921+01:00

### Assessment

| Metric     | Value  | Reasoning                                                                                    |
| ---------- | ------ | -------------------------------------------------------------------------------------------- |
| Severity   | HIGH   | CI pipeline completely broken across all Node.js versions, blocking PR merge                |
| Complexity | LOW    | Single configuration file fix, no code logic changes required                                |
| Confidence | HIGH   | Clear ESM/CommonJS mismatch error with well-documented solution                              |

---

## Problem Statement

The PR introduces a complete work CLI implementation but CI tests are failing across all Node.js versions (18.x, 20.x, 22.x) due to an ESM configuration mismatch. The project is configured as an ES module but Jest configuration uses CommonJS syntax.

---

## Analysis

### Root Cause / Change Rationale

**WHY**: Tests fail with "ReferenceError: module is not defined in ES module scope"
↓ **BECAUSE**: `jest.config.js` uses `module.exports` (CommonJS syntax)
Evidence: `jest.config.js:1` - `module.exports = {`

↓ **BECAUSE**: Project is configured as ESM with `"type": "module"` in package.json
Evidence: `package.json:4` - `"type": "module"`

↓ **ROOT CAUSE**: Configuration file format mismatch between ESM project and CommonJS config
Evidence: Jest tries to load `jest.config.js` as ESM but finds CommonJS syntax

### Affected Files

| File            | Lines | Action | Description                        |
| --------------- | ----- | ------ | ---------------------------------- |
| `jest.config.js` | ALL   | UPDATE | Convert to ESM syntax or rename to .cjs |

### Integration Points

- CI pipeline runs `npm test` which invokes Jest
- Jest loads configuration from `jest.config.js`
- No other files depend on Jest configuration format

### Git History

- **Introduced**: 8a71364 - 2026-01-20 - "feat(core): implement complete work CLI engine with local-fs adapter"
- **Last modified**: 8a71364 - 2026-01-20
- **Implication**: New issue introduced in current PR, not a regression

---

## Implementation Plan

### Step 1: Fix Jest Configuration for ESM

**File**: `jest.config.js`
**Lines**: 1-50
**Action**: UPDATE

**Current code:**

```javascript
// Line 1
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  // ... rest of config
};
```

**Required change:**

```javascript
// Convert to ESM export syntax
export default {
  preset: 'ts-jest/presets/default-esm',
  // ... rest of config (unchanged)
};
```

**Why**: ESM projects require ES module syntax for configuration files

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```javascript
// SOURCE: package.json:3
// Pattern for ESM configuration
"type": "module"
```

---

## Edge Cases & Risks

| Risk/Edge Case | Mitigation      |
| -------------- | --------------- |
| Jest version compatibility | Current Jest 29.x supports ESM configs |
| Node.js version support | All target versions (18+) support ESM |

---

## Validation

### Automated Checks

```bash
npm run type-check   # Should pass (already passing)
npm test            # Should run tests successfully
npm run lint        # Should pass (already passing)
```

### Manual Verification

1. Run `npm test` locally to verify Jest loads configuration
2. Verify all existing tests still pass
3. Check CI pipeline passes on all Node.js versions

---

## Scope Boundaries

**IN SCOPE:**
- Fix Jest configuration file format
- Ensure CI pipeline passes

**OUT OF SCOPE (do not touch):**
- Jest configuration options (keep all existing settings)
- Test files or test logic
- Other configuration files

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-01-20T14:51:58.921+01:00
- **Artifact**: `.claude/PRPs/issues/issue-9.md`
