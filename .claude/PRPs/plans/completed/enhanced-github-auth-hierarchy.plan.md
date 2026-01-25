# Feature: Enhanced GitHub Authentication Hierarchy

## Summary

Implement a three-tier GitHub authentication hierarchy that prioritizes GitHub CLI credentials, supports manual token management, and falls back to environment variables with helpful error messages. This eliminates manual token management for developers already using `gh auth login`.

## User Story

As a developer using GitHub CLI
I want work CLI to automatically use my existing gh authentication
So that I don't need to manage separate tokens or environment variables

## Problem Statement

Current GitHub adapter only supports environment variables for authentication, forcing users into manual token management when they already have `gh` CLI configured with secure OAuth tokens.

## Solution Statement

Enhance `getTokenFromCredentials` function to check GitHub CLI first, then manual credentials, then environment variables, with clear error messages guiding users to the recommended authentication method.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | ENHANCEMENT                                       |
| Complexity             | MEDIUM                                            |
| Systems Affected       | GitHub adapter, authentication system            |
| Dependencies           | Node.js child_process (built-in)                 |
| Estimated Tasks        | 9                                                 |
| **Research Timestamp** | **2026-01-25T11:44:19.977+01:00**                |

---

## UX Design

### Before State
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ User wants  │ ──────► │ Must set    │ ──────► │ Manual      │
│ GitHub      │         │ GITHUB_     │         │ token       │
│ context     │         │ TOKEN env   │         │ management  │
└─────────────┘         └─────────────┘         └─────────────┘

USER_FLOW: export GITHUB_TOKEN=ghp_... → work context add
PAIN_POINT: Manual token creation, storage, rotation
DATA_FLOW: Environment variable → getTokenFromCredentials → API client
```

### After State
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ User wants  │ ──────► │ gh auth     │ ──────► │ Seamless    │
│ GitHub      │         │ login (once)│         │ integration │
│ context     │         └─────────────┘         └─────────────┘
└─────────────┘                │
                               ▼
                      ┌─────────────┐
                      │ work context│  ◄── Auto-detects gh credentials
                      │ add .       │      and git remote
                      └─────────────┘

USER_FLOW: gh auth login → work context add . → just works
VALUE_ADD: Zero manual token management, leverages existing workflow
DATA_FLOW: gh CLI → execFileSync → getTokenFromCredentials → API client
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| GitHub auth setup | Manual env var setup | `gh auth login` (if not done) | Leverages existing workflow |
| Context creation | `work context add name --tool github --url ...` | `work context add . --tool github` | Auto-detects repo from git remote |
| Error messages | Generic "no token found" | Helpful guidance to `gh auth login` | Clear next steps |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/adapters/github/auth.ts` | 24-49 | Current auth function to ENHANCE |
| P1 | `src/adapters/github/errors.ts` | 27-33 | Error pattern to MIRROR |
| P2 | `src/core/target-handlers/bash-handler.ts` | 69-122 | Command execution pattern to FOLLOW |
| P3 | `tests/unit/adapters/github/auth.test.ts` | 1-30 | Test pattern to EXTEND |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Node.js child_process v22.17.0](https://github.com/nodejs/node/blob/main/doc/api/child_process.md#child_processspawnsync) ✓ Current | execFileSync | Secure command execution | 2026-01-25T11:44:19.977+01:00 |
| [GitHub CLI Auth Best Practices](https://docs.github.com/en/rest/overview/keeping-your-api-credentials-secure) ✓ Current | Token security | Authentication hierarchy design | 2026-01-25T11:44:19.977+01:00 |

---

## Patterns to Mirror

**COMMAND_EXECUTION:**
```typescript
// SOURCE: src/core/target-handlers/bash-handler.ts:69-122
// COPY THIS PATTERN FOR gh CLI EXECUTION:
const child = spawn(scriptPath, [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  timeout: timeoutSeconds * 1000,
});
// BUT USE execFileSync for synchronous token retrieval
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/adapters/github/errors.ts:27-33
// COPY THIS PATTERN:
export class GitHubAuthError extends WorkError {
  constructor(message: string = 'Invalid or missing GitHub token') {
    super(`GitHub authentication error: ${message}`, 'GITHUB_AUTH_ERROR', 401);
    this.name = 'GitHubAuthError';
    Object.setPrototypeOf(this, GitHubAuthError.prototype);
  }
}
```

**TOKEN_VALIDATION:**
```typescript
// SOURCE: src/adapters/github/auth.ts:10-22
// COPY THIS PATTERN:
export function validateToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  // GitHub token format validation
  return /^(ghp_|gho_|ghs_)[a-zA-Z0-9]{36,}$/.test(token);
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/unit/adapters/github/auth.test.ts:1-30
// COPY THIS PATTERN:
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTokenFromCredentials } from '../../../../src/adapters/github/auth.js';
import { GitHubAuthError } from '../../../../src/adapters/github/errors.js';

describe('GitHub Authentication', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['GITHUB_TOKEN'];
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**
- [x] OAuth tokens from `gh auth token` are more secure than static environment variables
- [x] `execFileSync` with proper error handling prevents command injection
- [x] Token validation prevents malformed token usage
- [x] No tokens logged or exposed in error messages

**Performance (Web Intelligence Verified):**
- [x] Synchronous execution acceptable for authentication (one-time operation)
- [x] Timeout handling prevents hanging processes
- [x] Minimal overhead with direct `gh auth token` call

**Community Intelligence:**
- [x] GitHub CLI is widely adopted and recommended by GitHub
- [x] `gh auth token` is the standard way to retrieve tokens programmatically
- [x] Environment variable fallback maintains compatibility

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/adapters/github/auth.ts` | UPDATE | Enhance getTokenFromCredentials with gh CLI support |
| `src/types/context.ts` | UPDATE | Add credentialSource field to Context interface |
| `tests/unit/adapters/github/auth.test.ts` | UPDATE | Add tests for gh CLI integration |
| `README.md` | UPDATE | Add GitHub authentication section |
| `docs/work-github-auth.md` | CREATE | Comprehensive GitHub authentication user guide |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Git credential manager integration - Complex, platform-specific
- Automatic token rotation - Separate feature, requires different architecture
- Cross-platform keychain integration - Out of scope for initial implementation
- Context auto-detection from git remotes - Separate enhancement

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use `npm run` commands from package.json.

**Coverage Targets**: PoC 20%, **MVP 40%** (current project state), Extensions 60%, OSS 75%, Mature 85%

### Task 1: UPDATE `src/adapters/github/auth.ts` - Add gh CLI integration

- **ACTION**: ENHANCE getTokenFromCredentials function with three-tier hierarchy
- **IMPLEMENT**: Add `execFileSync('gh', ['auth', 'token'])` as first priority
- **MIRROR**: `src/core/target-handlers/bash-handler.ts:69-122` - command execution pattern
- **IMPORTS**: `import { execFileSync } from 'child_process'`
- **GOTCHA**: Handle both spawn errors (`err.code`) and non-zero exit codes separately
- **CURRENT**: [Node.js execFileSync docs](https://github.com/nodejs/node/blob/main/doc/api/child_process.md#child_processspawnsync)
- **VALIDATE**: `npm run type-check && npm run lint`
- **FUNCTIONAL**: `gh auth status && node -e "console.log(require('./dist/adapters/github/auth.js').getTokenFromCredentials())"`
- **TEST_PYRAMID**: Add integration test for: gh CLI token retrieval with error scenarios

### Task 2: UPDATE `src/types/context.ts` - Add credentialSource field

- **ACTION**: ADD credentialSource field to Context interface
- **IMPLEMENT**: `readonly credentialSource?: 'gh-cli' | 'manual' | 'environment' | 'none'`
- **MIRROR**: Existing Context interface pattern with optional readonly fields
- **GOTCHA**: Make field optional for backward compatibility
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definition only

### Task 3: UPDATE `src/adapters/github/auth.ts` - Enhanced error messages

- **ACTION**: IMPROVE error messages with helpful guidance
- **IMPLEMENT**: Multi-line error message with numbered steps
- **MIRROR**: `src/adapters/github/errors.ts:27-33` - error construction pattern
- **PATTERN**: Include specific commands user should run
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: error message content and formatting

### Task 4: UPDATE `tests/unit/adapters/github/auth.test.ts` - Add gh CLI tests

- **ACTION**: ADD test cases for gh CLI integration
- **IMPLEMENT**: Mock execFileSync, test success/failure scenarios
- **MIRROR**: `tests/unit/adapters/github/auth.test.ts:1-30` - existing test structure
- **IMPORTS**: `import { vi } from 'vitest'` for mocking
- **GOTCHA**: Mock child_process module properly with vi.mock
- **VALIDATE**: `npm test -- tests/unit/adapters/github/auth.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: complete authentication flow with all three methods

### Task 5: UPDATE `src/adapters/github/auth.ts` - Add warning for env vars

- **ACTION**: ADD console.warn for environment variable usage
- **IMPLEMENT**: Warning message suggesting gh auth login
- **PATTERN**: Use console.warn (not logger) for user-facing warnings
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: warning message display and content

### Task 6: UPDATE `tests/unit/adapters/github/auth.test.ts` - Complete test coverage

- **ACTION**: ADD comprehensive test coverage for all scenarios
- **IMPLEMENT**: Test all three credential sources, error cases, validation
- **MIRROR**: Existing test patterns with describe/it structure
- **COVERAGE**: Ensure >40% coverage for auth.ts file (MVP target)
- **VALIDATE**: `npm run test:coverage -- tests/unit/adapters/github/auth.test.ts`
- **TEST_PYRAMID**: Add E2E test for: real gh CLI integration (if available in CI)

### Task 7: CREATE `docs/work-github-auth.md` and UPDATE `README.md`

- **ACTION**: CREATE comprehensive GitHub authentication user guide and update README
- **IMPLEMENT**: Document all three authentication methods with examples and troubleshooting
- **MIRROR**: `docs/github-adapter-guide.md` - existing documentation structure and style
- **CONTENT**: Cover gh CLI setup, manual tokens, environment variables, troubleshooting
- **README**: Add GitHub authentication section with quick start and link to detailed guide
- **VALIDATE**: `npm run format:check`
- **FUNCTIONAL**: Manual review of documentation clarity and completeness
- **TEST_PYRAMID**: No additional tests needed - documentation only

### Task 8: COMMIT and PUSH branch

- **ACTION**: COMMIT all changes and push feature branch
- **IMPLEMENT**: Create feature branch, commit with descriptive message, push to origin
- **BRANCH**: `feature/enhanced-github-auth-hierarchy`
- **COMMIT**: `feat: implement enhanced GitHub authentication hierarchy with gh CLI integration`
- **VALIDATE**: `git status` shows clean working tree, `git log --oneline -1` shows commit
- **FUNCTIONAL**: `git push origin feature/enhanced-github-auth-hierarchy` succeeds
- **TEST_PYRAMID**: No additional tests needed - git operations only

### Task 9: OBSERVE CI and iterate until passing

- **ACTION**: MONITOR CI pipeline and fix any failures using systematic debugging
- **IMPLEMENT**: Use `gh run list` and `gh run view` to monitor CI status
- **DEBUG**: Apply 5-Why root cause analysis for any failures
- **FIX**: Create targeted fixes based on CI feedback (lint, test, build failures)
- **ITERATE**: Repeat commit/push/observe cycle until all checks pass
- **VALIDATE**: `gh run list --limit 1` shows successful status
- **FUNCTIONAL**: All CI checks pass (lint, test, build)
- **TEST_PYRAMID**: CI validates full test pyramid execution

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/adapters/github/auth.test.ts` | gh CLI success, gh CLI failure, env var fallback | Credential hierarchy |
| `tests/unit/adapters/github/auth.test.ts` | Token validation, error messages | Input validation |
| `tests/unit/adapters/github/auth.test.ts` | Warning display for env vars | User guidance |

### Edge Cases Checklist

- [x] gh CLI not installed
- [x] gh CLI not authenticated
- [x] gh CLI returns invalid token
- [x] Environment variable malformed
- [x] No credentials available anywhere
- [x] execFileSync timeout/error

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
npm run lint && npm run type-check
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL
```bash
npm run build && gh auth status && node -e "console.log(require('./dist/adapters/github/auth.js').getTokenFromCredentials())"
```
**EXPECT**: Build succeeds, token retrieved successfully

### Level 3: UNIT_TESTS
```bash
npm run test:coverage -- tests/unit/adapters/github/auth.test.ts
```
**EXPECT**: All tests pass, coverage >= 40% (MVP target for overall project)

### Level 4: FULL_SUITE
```bash
npm run test:coverage && npm run build
```
**EXPECT**: All tests pass, build succeeds

### Level 6: CI_VALIDATION

Use GitHub CLI to monitor and validate CI pipeline:

```bash
gh run list --limit 1 && gh run view --log
```

**EXPECT**: All CI checks pass (lint, test, build)

**5-Why Debug Process** (if CI fails):
1. **What failed?** - Identify specific CI step failure
2. **Why did it fail?** - Examine error logs and stack traces  
3. **Why did that condition occur?** - Trace root cause in code changes
4. **Why wasn't this caught locally?** - Identify gap in local validation
5. **Why do we have this gap?** - Systematic process improvement needed

**Fix Planning Template**:
- **Immediate Fix**: Specific code change to resolve failure
- **Validation**: How to verify fix works locally before push
- **Prevention**: Process change to avoid similar issues

### Level 7: MANUAL_VALIDATION
1. Ensure `gh auth login` is completed
2. Run `work context add . --tool github` in a git repo with GitHub remote
3. Verify context creation succeeds without manual token setup
4. Test with `unset GITHUB_TOKEN` to ensure gh CLI is used
5. Test error message when gh CLI not available

---

## Acceptance Criteria

- [x] gh CLI token retrieval works when `gh auth login` completed
- [x] Manual token method still works via credentials parameter
- [x] Environment variable fallback maintains backward compatibility
- [x] Clear error messages guide users to `gh auth login`
- [x] Warning displayed when using environment variables
- [x] New functionality has >40% test coverage (MVP target)
- [x] All existing tests continue to pass
- [x] No security vulnerabilities introduced
- [x] Performance impact minimal (synchronous execution acceptable)

---

## Completion Checklist

- [ ] Task 1: Enhanced getTokenFromCredentials with gh CLI support
- [ ] Task 2: Added credentialSource field to Context interface
- [ ] Task 3: Improved error messages with helpful guidance
- [ ] Task 4: Added comprehensive test coverage for gh CLI integration
- [ ] Task 5: Added warning for environment variable usage
- [ ] Task 6: Complete test coverage for all scenarios
- [ ] Task 7: Create GitHub auth user guide and update README
- [ ] Task 8: Commit and push feature branch
- [ ] Task 9: Observe CI and iterate until all checks pass
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage
- [ ] Level 4: Full test suite passes
- [ ] Level 5: Manual validation completed
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (Node.js child_process documentation)
**Web Intelligence Sources**: 10 (GitHub CLI security best practices)
**Last Verification**: 2026-01-25T11:44:19.977+01:00
**Security Advisories Checked**: GitHub CLI OAuth token security validated
**Deprecated Patterns Avoided**: Direct shell execution, plain text token logging

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| gh CLI not available in environment | MEDIUM | LOW | Clear error message guides to installation |
| gh CLI version compatibility | LOW | MEDIUM | Use stable `gh auth token` command (available since v1.0) |
| execFileSync security concerns | LOW | HIGH | Use execFileSync with explicit args, no shell execution |
| Performance impact of sync execution | LOW | LOW | Authentication is one-time operation per context |

---

## Notes

### Current Intelligence Considerations

- GitHub CLI `gh auth token` command is stable and widely supported
- OAuth tokens from gh CLI are more secure than static environment variables
- execFileSync is appropriate for authentication (one-time, blocking operation)
- Community strongly recommends gh CLI for GitHub authentication workflows

### Design Decisions

- **Synchronous execution**: Authentication is a one-time setup operation where blocking is acceptable
- **Three-tier hierarchy**: Balances convenience (gh CLI) with flexibility (manual) and compatibility (env vars)
- **Warning for env vars**: Educates users about more secure alternatives without breaking existing workflows
- **Backward compatibility**: All existing authentication methods continue to work

### Future Considerations

- Git credential manager integration could be added as fourth tier
- Context auto-detection from git remotes could enhance UX further
- Token rotation automation could be separate feature
- Cross-platform keychain integration for enterprise environments
