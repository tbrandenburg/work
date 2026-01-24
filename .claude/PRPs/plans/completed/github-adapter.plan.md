# Feature: GitHub Adapter Implementation

## Summary

Implement a GitHub Issues adapter for the work CLI that provides unified interface for managing GitHub Issues using the same commands and mental model as other backends. The adapter will use @octokit/rest for GitHub API integration with proper authentication, rate limiting, and error handling.

## User Story

As a developer using the work CLI
I want to manage GitHub Issues through the same unified interface
So that I can work with GitHub repositories without switching tools or learning different commands

## Problem Statement

The work CLI currently only supports local filesystem backend. Developers need to manage GitHub Issues using the same unified interface and commands, enabling seamless workflow across different project management systems without vendor lock-in.

## Solution Statement

Implement a GitHub adapter following the existing local-fs adapter pattern, using @octokit/rest for GitHub API integration. The adapter will map GitHub Issues to WorkItem interface, handle authentication via Personal Access Tokens, and provide rate limiting with automatic retry.

**PoC Validation**: A complete CRUD proof of concept has been successfully implemented in `dev/poc-github-adapter/` demonstrating:
- ✅ GitHub API authentication with Personal Access Tokens
- ✅ Full CRUD operations (Create, Read, Update, Delete/Close)
- ✅ GitHub Issue ↔ WorkItem mapping
- ✅ External API integration with adapter pattern
- ✅ Testing with https://github.com/tbrandenburg/playground

The PoC proves all core risks are mitigated and implementation can proceed with high confidence.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                    |
| Complexity             | MEDIUM (reduced from HIGH due to successful PoC)  |
| Systems Affected       | adapters, core, types, CLI commands              |
| Dependencies           | @octokit/rest, @octokit/plugin-throttling         |
| Estimated Tasks        | 13                                                |
| **Research Timestamp** | **2026-01-23T14:12:26+01:00**                     |
| **PoC Completed**      | **2026-01-23T15:58:49+01:00**                     |
| **PoC Location**       | **dev/poc-github-adapter/**                       |
| **Test Repository**    | **https://github.com/tbrandenburg/playground**    |
| **Test Environment**   | **GITHUB_TOKEN environment variable required**    |
| **Testing Focus**      | **Complete task workflow and CRUD operations**    |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   work CLI  │ ──────► │   Context   │ ──────► │   Error:    │            ║
║   │   Command   │         │   GitHub    │         │   No GitHub │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: work context add github-repo --adapter github                    ║
║   PAIN_POINT: GitHub adapter not implemented - only local-fs works           ║
║   DATA_FLOW: CLI → Context Resolution → Adapter Loading → FAIL               ║
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
║   │   work CLI  │ ──────► │   Context   │ ──────► │   GitHub    │            ║
║   │   Command   │         │   GitHub    │         │   Issues    │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                       │                   ║
║                                   ▼                       ▼                   ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │ GitHub API  │ ◄────── │ Rate Limit  │            ║
║                          │ Integration │         │ Management  │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: work create "Fix bug" --kind bug → GitHub Issue created         ║
║   VALUE_ADD: Unified interface for GitHub Issues with same commands          ║
║   DATA_FLOW: CLI → Context → GitHub Adapter → Octokit → GitHub API           ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `work context add` | Only local-fs supported | GitHub adapter available | Can connect to GitHub repos with `--adapter github --repo owner/repo` |
| `work create` | Local files only | Creates GitHub Issues | Same command syntax creates GitHub Issues |
| `work list` | Local work items only | GitHub Issues listed | Unified view of GitHub Issues with same query syntax |
| `work start/close` | Local state changes | GitHub Issue state changes | Same commands update GitHub Issue states |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/adapters/local-fs/index.ts` | 1-200 | Pattern to MIRROR exactly - WorkAdapter implementation |
| P1 | `src/types/context.ts` | 1-100 | WorkAdapter interface to IMPLEMENT |
| P2 | `src/types/errors.ts` | 1-80 | Error patterns to FOLLOW |
| P3 | `tests/unit/adapters/local-fs/id-generator.test.ts` | 1-50 | Test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Octokit REST v20.x](https://context7.com/octokit/rest.js/llms.txt) ✓ Current | Authentication & Rate Limiting | GitHub API client patterns | 2026-01-23T14:12:26 |
| [GitHub API Best Practices](https://the-pi-guy.com/blog/github_api_rate_limiting_and_best_practices/) ✓ Current | Rate limiting strategies | Exponential backoff patterns | 2026-01-23T14:12:26 |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/adapters/local-fs/index.ts:10-15
// COPY THIS PATTERN:
export class LocalFsAdapter implements WorkAdapter {
  private workDir: string = '';

  initialize(context: Context): Promise<void> {
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/types/errors.ts:15-25
// COPY THIS PATTERN:
export class WorkItemNotFoundError extends WorkError {
  constructor(id: string) {
    super(`Work item not found: ${id}`, 'WORK_ITEM_NOT_FOUND', 404);
    this.name = 'WorkItemNotFoundError';
    Object.setPrototypeOf(this, WorkItemNotFoundError.prototype);
  }
}
```

**ADAPTER_PATTERN:**
```typescript
// SOURCE: src/adapters/local-fs/index.ts:25-40
// COPY THIS PATTERN:
async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
  const id = await generateId(request.kind, this.workDir);
  const now = new Date().toISOString();
  
  const workItem: WorkItem = {
    id,
    kind: request.kind,
    title: request.title,
    description: request.description,
    state: 'new',
    priority: request.priority || 'medium',
    assignee: request.assignee,
    labels: request.labels || [],
    createdAt: now,
    updatedAt: now,
  };
  
  await saveWorkItem(workItem, this.workDir);
  return workItem;
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/unit/adapters/local-fs/id-generator.test.ts:1-25
// COPY THIS PATTERN:
describe('ID Generator', () => {
  const testDir = path.join(__dirname, 'test-work-dir');

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    await fs.mkdir(testDir, { recursive: true });
  });
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**
- [x] Personal Access Token authentication with @octokit/rest
- [x] Token stored in context credentials, never logged
- [x] Input validation for all GitHub API requests
- [x] Minimal token scopes (repo or public_repo)

**Performance (Web Intelligence Verified):**
- [x] @octokit/plugin-throttling for automatic rate limiting
- [x] Exponential backoff with jitter for retry logic
- [x] Pagination support for large issue lists
- [x] Stateless execution without caching

**Community Intelligence:**
- [x] @octokit/rest is the standard GitHub API client for Node.js
- [x] Rate limiting best practices include exponential backoff
- [x] Personal Access Tokens preferred over OAuth for CLI tools
- [x] GitHub Issues API is stable and well-documented

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `package.json` | UPDATE | Add @octokit/rest and @octokit/plugin-throttling dependencies |
| `src/adapters/github/index.ts` | CREATE | Main GitHub adapter implementation |
| `src/adapters/github/api-client.ts` | CREATE | GitHub API client wrapper with rate limiting |
| `src/adapters/github/mapper.ts` | CREATE | GitHub Issue ↔ WorkItem conversion |
| `src/adapters/github/auth.ts` | CREATE | Token management and validation |
| `src/adapters/github/types.ts` | CREATE | GitHub-specific type definitions |
| `src/adapters/github/errors.ts` | CREATE | GitHub-specific error classes |
| `src/adapters/index.ts` | UPDATE | Export GitHub adapter |
| `tests/unit/adapters/github/api-client.test.ts` | CREATE | Unit tests for API client |
| `tests/unit/adapters/github/mapper.test.ts` | CREATE | Unit tests for mapper |
| `tests/integration/adapters/github/github-adapter.test.ts` | CREATE | Integration tests with real GitHub API |
| `docs/github-adapter-guide.md` | CREATE | User guide for GitHub adapter setup and usage |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- OAuth authentication flow - Personal Access Tokens only for MVP
- GitHub Apps integration - future enhancement
- Issue comments management - basic description field only
- Advanced GitHub features (projects, milestones, assignees) - focus on core Issues API
- Webhook support - stateless execution model doesn't support real-time updates
- Local caching - violates stateless execution principle

---
## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Prefer Makefile targets or package scripts when available (e.g., `make test`, `npm run test:coverage`).

**Coverage Targets**: PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%

### Task 1: UPDATE `package.json` (dependencies)

- **ACTION**: ADD GitHub API dependencies
- **IMPLEMENT**: Add @octokit/rest and @octokit/plugin-throttling to dependencies
- **MIRROR**: Follow existing dependency pattern in package.json
- **IMPORTS**: `"@octokit/rest": "^20.0.0", "@octokit/plugin-throttling": "^8.0.0"`
- **GOTCHA**: Use latest stable versions, check npm registry for current versions
- **CURRENT**: [Octokit REST v20.x](https://context7.com/octokit/rest.js/llms.txt) - verified current
- **VALIDATE**: `npm install && npm run type-check`
- **FUNCTIONAL**: `npm list @octokit/rest @octokit/plugin-throttling` - verify packages installed
- **TEST_PYRAMID**: No additional tests needed - dependency update only

### Task 2: CREATE `src/adapters/github/types.ts`

- **ACTION**: CREATE GitHub-specific type definitions
- **IMPLEMENT**: GitHubConfig, GitHubIssue, GitHubRepository interfaces
- **MIRROR**: `src/types/context.ts:1-30` - interface definition pattern
- **IMPORTS**: `import { WorkItem } from '../../types/index.js'`
- **TYPES**: 
```typescript
export interface GitHubConfig {
  readonly owner: string;
  readonly repo: string;
  readonly token: string;
}

export interface GitHubIssue {
  readonly id: number;
  readonly number: number;
  readonly title: string;
  readonly body: string | null;
  readonly state: 'open' | 'closed';
  readonly labels: Array<{ name: string }>;
  readonly assignee: { login: string } | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly closed_at: string | null;
}
```
- **GOTCHA**: Use readonly properties for immutability, match GitHub API response structure
- **CURRENT**: [GitHub Issues API](https://docs.github.com/en/rest/issues/issues) - verified structure
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: CREATE `src/adapters/github/errors.ts`

- **ACTION**: CREATE GitHub-specific error classes
- **IMPLEMENT**: GitHubApiError, GitHubRateLimitError, GitHubAuthError
- **MIRROR**: `src/types/errors.ts:15-40` - error class pattern
- **PATTERN**: Extend WorkError, include code and statusCode
- **IMPORTS**: `import { WorkError } from '../../types/errors.js'`
- **CURRENT**: Follow existing error handling patterns from codebase
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - simple error class definitions

### Task 4: CREATE `src/adapters/github/auth.ts`

- **ACTION**: CREATE token management and validation
- **IMPLEMENT**: validateToken, getTokenFromContext functions
- **MIRROR**: `src/adapters/local-fs/index.ts:120-140` - context handling pattern
- **PATTERN**: Extract credentials from context, validate format, support CI_GITHUB_TOKEN fallback
- **IMPORTS**: `import { Context } from '../../types/context.js'`
- **GOTCHA**: GitHub tokens start with 'ghp_', 'gho_', or 'ghs_' - validate format. GitHub Actions secrets can't start with GITHUB_, use CI_GITHUB_TOKEN
- **CURRENT**: [GitHub Token Formats](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github) - verified patterns
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: Add integration test for: token validation with various formats and error cases

### Task 5: CREATE `src/adapters/github/api-client.ts`

- **ACTION**: CREATE GitHub API client wrapper with rate limiting
- **IMPLEMENT**: GitHubApiClient class with Octokit integration
- **MIRROR**: `src/adapters/local-fs/storage.ts:1-50` - async operations pattern
- **IMPORTS**: 
```typescript
import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { GitHubConfig, GitHubIssue } from './types.js';
```
- **PATTERN**: Initialize Octokit with throttling plugin, handle rate limits
- **GOTCHA**: Use throttling plugin with onRateLimit callback for retry logic
- **CURRENT**: [Octokit Throttling Plugin](https://context7.com/octokit/rest.js/llms.txt) - verified current usage
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: API client initialization and rate limiting behavior

### Task 6: CREATE `src/adapters/github/mapper.ts`

- **ACTION**: CREATE GitHub Issue ↔ WorkItem conversion
- **IMPLEMENT**: githubIssueToWorkItem, workItemToGitHubIssue functions
- **MIRROR**: `src/adapters/local-fs/storage.ts:40-80` - data transformation pattern
- **PATTERN**: Map GitHub Issue fields to WorkItem interface
- **IMPORTS**: `import { WorkItem, CreateWorkItemRequest } from '../../types/index.js'`
- **MAPPING**:
  - GitHub issue.number → WorkItem.id (as string)
  - GitHub issue.state → WorkItem.state ('open' → 'new', 'closed' → 'closed')
  - GitHub issue.labels → WorkItem.labels (extract name field)
  - GitHub issue.assignee → WorkItem.assignee (extract login field)
- **GOTCHA**: GitHub uses numeric IDs, work CLI uses string IDs - convert properly
- **CURRENT**: [GitHub Issues API Response](https://docs.github.com/en/rest/issues/issues#get-an-issue) - verified field structure
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: Add integration test for: bidirectional mapping with edge cases and null values

### Task 7: CREATE `src/adapters/github/index.ts`

- **ACTION**: CREATE main GitHub adapter implementation
- **IMPLEMENT**: GitHubAdapter class implementing WorkAdapter interface
- **MIRROR**: `src/adapters/local-fs/index.ts:1-200` - complete adapter structure
- **PATTERN**: Implement all WorkAdapter methods, use api-client and mapper
- **IMPORTS**: 
```typescript
import { WorkAdapter, Context, WorkItem, CreateWorkItemRequest, UpdateWorkItemRequest, Relation, WorkItemNotFoundError, AuthStatus, Schema } from '../../types/index.js';
import { GitHubApiClient } from './api-client.js';
import { githubIssueToWorkItem, workItemToGitHubIssue } from './mapper.js';
import { validateToken } from './auth.js';
```
- **GOTCHA**: GitHub doesn't support custom relations - implement basic parent/child via issue references
- **CURRENT**: Follow WorkAdapter interface exactly as defined in types
- **VALIDATE**: `npm run type-check && npm run lint`
- **FUNCTIONAL**: Create test context and verify adapter initializes without errors
- **TEST_PYRAMID**: Add E2E test for: complete adapter workflow with real GitHub API

### Task 8: UPDATE `src/adapters/index.ts`

- **ACTION**: UPDATE adapter exports to include GitHub
- **IMPLEMENT**: Export GitHubAdapter alongside LocalFsAdapter
- **MIRROR**: `src/adapters/index.ts:1-10` - existing export pattern
- **PATTERN**: Named exports for all adapters
- **IMPORTS**: `export { GitHubAdapter } from './github/index.js'`
- **VALIDATE**: `npm run type-check && npm run build`
- **FUNCTIONAL**: `node -e "console.log(require('./dist/adapters/index.js'))"` - verify exports
- **TEST_PYRAMID**: No additional tests needed - export file only

### Task 9: CREATE `tests/unit/adapters/github/auth.test.ts`

- **ACTION**: CREATE unit tests for authentication
- **IMPLEMENT**: Test token validation, context extraction
- **MIRROR**: `tests/unit/adapters/local-fs/id-generator.test.ts:1-50` - test structure
- **PATTERN**: Jest with describe/it blocks, beforeEach/afterEach cleanup
- **IMPORTS**: `import { validateToken, getTokenFromContext } from '@/adapters/github/auth'`
- **CURRENT**: Follow existing test patterns from codebase
- **VALIDATE**: `npm test -- tests/unit/adapters/github/auth.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: authentication flow with various token formats

### Task 10: CREATE `tests/unit/adapters/github/mapper.test.ts`

- **ACTION**: CREATE unit tests for data mapping
- **IMPLEMENT**: Test GitHub Issue ↔ WorkItem conversion
- **MIRROR**: `tests/unit/adapters/local-fs/id-generator.test.ts:1-50` - test structure
- **PATTERN**: Test both directions of mapping, edge cases, null values
- **IMPORTS**: `import { githubIssueToWorkItem, workItemToGitHubIssue } from '@/adapters/github/mapper'`
- **VALIDATE**: `npm test -- tests/unit/adapters/github/mapper.test.ts`
- **TEST_PYRAMID**: Add integration test for: mapping accuracy with real GitHub API responses

### Task 11: CREATE `tests/unit/adapters/github/api-client.test.ts`

- **ACTION**: CREATE unit tests for API client
- **IMPLEMENT**: Test Octokit initialization, rate limiting, error handling
- **MIRROR**: `tests/unit/adapters/local-fs/id-generator.test.ts:1-50` - test structure
- **PATTERN**: Mock Octokit responses, test retry logic
- **IMPORTS**: `import { GitHubApiClient } from '@/adapters/github/api-client'`
- **GOTCHA**: Mock @octokit/rest properly to avoid real API calls in unit tests
- **VALIDATE**: `npm test -- tests/unit/adapters/github/api-client.test.ts`
- **TEST_PYRAMID**: Add integration test for: real API client behavior with test repository

### Task 12: CREATE `tests/integration/adapters/github/github-adapter.test.ts`

- **ACTION**: CREATE integration tests with real GitHub API
- **IMPLEMENT**: Test complete adapter workflow with test repository
- **MIRROR**: `tests/e2e/work-item-lifecycle.test.ts:1-100` - integration test pattern
- **PATTERN**: Use real GitHub API with test repository, environment variables for token
- **IMPORTS**: `import { GitHubAdapter } from '@/adapters/github'`
- **TEST_REPO**: Use https://github.com/tbrandenburg/playground for integration testing
- **TOKEN**: GITHUB_TOKEN environment variable is already set and MUST be used for authentication
- **CRUD_FOCUS**: Test complete task workflow - Create, Read, Update, Delete/Close operations
- **POC_REFERENCE**: See `dev/poc-github-adapter/test.ts` for working CRUD test example
- **VALIDATE**: `GITHUB_TOKEN=$GITHUB_TOKEN npm test -- tests/integration/adapters/github/github-adapter.test.ts`
- **FUNCTIONAL**: Full CRUD cycle - Create issue, Read/List issues, Update issue state, Close issue
- **TEST_PYRAMID**: Add critical user journey test for: complete task workflow and all CRUD operations

### Task 13: CREATE `docs/github-adapter-guide.md`

- **ACTION**: CREATE user guide for GitHub adapter configuration and usage
- **IMPLEMENT**: Step-by-step setup, authentication, common workflows, troubleshooting
- **MIRROR**: `docs/work-user-journey-context-and-query.md:1-50` - documentation structure and style
- **PATTERN**: Practical examples with actual commands, clear sections
- **CONTENT**:
  - Prerequisites (GitHub token creation)
  - Context setup (`work context add`)
  - Authentication methods (env vars, context storage)
  - Common workflows (create, list, update issues)
  - Troubleshooting (rate limits, auth errors)
  - Token security best practices
- **GOTCHA**: Include token scope requirements (repo or public_repo)
- **CURRENT**: Reference current GitHub documentation for token creation
- **VALIDATE**: `make format` - ensure markdown formatting
- **FUNCTIONAL**: Follow guide manually to verify all steps work
- **TEST_PYRAMID**: No additional tests needed - documentation only

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/adapters/github/auth.test.ts` | token validation, context extraction | Authentication logic |
| `tests/unit/adapters/github/mapper.test.ts` | bidirectional mapping, edge cases | Data transformation |
| `tests/unit/adapters/github/api-client.test.ts` | initialization, rate limiting, errors | API client wrapper |

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/integration/adapters/github/github-adapter.test.ts` | CRUD operations, real API | Complete adapter workflow |

### Edge Cases Checklist

- [ ] Invalid GitHub tokens (malformed, expired)
- [ ] Rate limit exceeded scenarios
- [ ] Network failures and timeouts
- [ ] Repository not found (404 errors)
- [ ] Permission denied (403 errors)
- [ ] Malformed GitHub Issue responses
- [ ] Empty issue lists and pagination
- [ ] Issues with null/undefined fields
- [ ] Large issue descriptions (API limits)
- [ ] Special characters in issue titles

---

## Validation Commands

**IMPORTANT**: Use actual governed commands from project's Makefile and package.json.

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && node -e "console.log(require('./dist/adapters/index.js').GitHubAdapter)"
```

**EXPECT**: Build succeeds, GitHubAdapter class exported

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/adapters/github/
```

**EXPECT**: All tests pass, coverage >= 40% (MVP target)

**COVERAGE NOTE**: For isolated module testing:
```bash
npm test -- --coverage --collectCoverageFrom="src/adapters/github/**" tests/unit/adapters/github/
```

### Level 4: FULL_SUITE

```bash
npm test -- --coverage && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: INTEGRATION_VALIDATION

```bash
GITHUB_TOKEN=$GITHUB_TOKEN npm test -- tests/integration/adapters/github/
```

**EXPECT**: Integration tests pass with real GitHub API

**CRITICAL REQUIREMENTS**:
- **GITHUB_TOKEN environment variable is already set and MUST be used** - authentication required for all API operations
- **Test Repository**: https://github.com/tbrandenburg/playground - dedicated testing playground
- **CRUD Testing Focus**: Complete task workflow validation including Create, Read, Update, Delete/Close operations
- **Token Scope**: Ensure GITHUB_TOKEN has 'repo' scope for full access to test repository

**PoC Reference**: See `dev/poc-github-adapter/` for working CRUD implementation example
**Validation**: All major task operations must be tested against real GitHub Issues API

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:
- [ ] @octokit/rest usage follows current best practices
- [ ] Rate limiting implementation is up-to-date
- [ ] Authentication patterns are secure
- [ ] Error handling follows current standards

### Level 7: MANUAL_VALIDATION

**Test Repository**: https://github.com/tbrandenburg/playground
**Environment Setup**: GITHUB_TOKEN environment variable is already set with 'repo' scope and MUST be used
**Reference Implementation**: See `dev/poc-github-adapter/` for working example

**Complete Task Workflow Testing**:
1. **Context Setup**: `work context add test-github --adapter github --repo tbrandenburg/playground`
2. **Authentication**: Verify token validation using GITHUB_TOKEN environment variable
3. **CREATE**: `work create "Test CRUD workflow" --kind bug` - verify GitHub Issue creation
4. **READ**: `work list` - verify GitHub Issues appear in unified interface
5. **UPDATE**: `work start ISSUE-123` - verify GitHub Issue state changes to 'open'
6. **DELETE/CLOSE**: `work close ISSUE-123` - verify GitHub Issue properly closed

**CRUD Validation Requirements**:
- All operations must work seamlessly through work CLI unified interface
- GitHub API integration must handle authentication, rate limiting, and error cases
- Complete task workflow from creation to closure must be functional

**PoC Validation**: All CRUD operations have been proven to work in the PoC implementation.

---

## Acceptance Criteria

- [ ] All specified functionality implemented per user story
- [ ] Level 1-4 validation commands pass with exit 0
- [ ] Unit tests cover >= 40% of new code (MVP target)
- [ ] Code mirrors existing patterns exactly (naming, structure, error handling)
- [ ] No regressions in existing tests
- [ ] UX matches "After State" diagram
- [ ] **Implementation follows current best practices**
- [ ] **No deprecated patterns or vulnerable dependencies**
- [ ] **Security recommendations up-to-date**
- [ ] GitHub Issues can be created, read, updated, and listed through work CLI
- [ ] Rate limiting handled gracefully with retry logic
- [ ] Authentication works with Personal Access Tokens
- [ ] Error messages are clear and actionable
- [ ] **PoC validation**: All operations proven to work in `dev/poc-github-adapter/`
- [ ] **Integration testing**: Works with https://github.com/tbrandenburg/playground

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Integration tests with real GitHub API pass
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met
- [ ] Manual validation completed successfully

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (Octokit REST documentation, GitHub Issues API)
**Web Intelligence Sources**: 1 (GitHub API rate limiting best practices)
**Last Verification**: 2026-01-23T14:12:26+01:00
**Security Advisories Checked**: 1 (GitHub token security practices)
**Deprecated Patterns Avoided**: OAuth complexity (using PAT for MVP), GraphQL API (REST is simpler)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub API rate limiting | HIGH | MEDIUM | Use @octokit/plugin-throttling with exponential backoff |
| Authentication token security | MEDIUM | HIGH | Store in context credentials, never log, validate format |
| Network failures during API calls | MEDIUM | MEDIUM | Implement retry logic with timeout handling |
| GitHub API changes breaking adapter | LOW | HIGH | Use stable @octokit/rest client, pin versions |
| Documentation changes during implementation | LOW | MEDIUM | Context7 MCP re-verification during execution |
| Large repositories with many issues | MEDIUM | MEDIUM | Implement pagination, respect rate limits |

---

## Notes

### PoC Validation Results

**Location**: `dev/poc-github-adapter/`
**Test Repository**: https://github.com/tbrandenburg/playground
**Completion**: 2026-01-23T15:58:49+01:00

**Proven Capabilities**:
- ✅ GitHub API authentication with Personal Access Tokens
- ✅ Full CRUD operations (Create issue #139, Read, Update, Delete/Close)
- ✅ GitHub Issue ↔ WorkItem mapping (all fields correctly mapped)
- ✅ External API integration with adapter pattern
- ✅ Token scopes validation (repo scope confirmed)

**Key Findings**:
- GitHub CRUD operations are straightforward with @octokit/rest
- Issue creation/update/close all work as expected
- Pagination needed for repositories with many issues
- GitHub doesn't support true delete (only close)
- Token with `repo` scope provides full access

### Current Intelligence Considerations

- **@octokit/rest v20.x** is the current stable version with TypeScript support
- **@octokit/plugin-throttling v8.x** provides automatic rate limiting with retry
- **GitHub API v3** is stable and well-documented, preferred over GraphQL for simplicity
- **Personal Access Tokens** are recommended for CLI tools over OAuth flows
- **Rate limiting** is 5000 requests/hour for authenticated users, handled by throttling plugin

### Design Decisions

- **Stateless Execution**: No local caching to maintain consistency with architecture
- **Issue-Only Focus**: GitHub Issues API only, no Projects/Milestones for MVP
- **String ID Mapping**: Convert GitHub numeric IDs to strings for WorkItem compatibility
- **Basic Relations**: Use issue references for parent/child, no complex relation support
- **Error Transparency**: Clear error messages for common GitHub API failures

### Future Considerations

- **OAuth Authentication**: For GitHub Apps integration
- **Webhook Support**: Real-time updates (requires architecture changes)
- **Advanced Features**: Projects, Milestones, detailed assignee management
- **Caching Layer**: Performance optimization (requires stateless principle review)
