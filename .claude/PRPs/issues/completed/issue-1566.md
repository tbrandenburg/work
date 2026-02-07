# Investigation: Bug: GitHub adapter ignores assignee field in create/set commands

**Issue**: #1566 (https://github.com/tbrandenburg/work/issues/1566)
**Type**: BUG
**Investigated**: 2026-02-07T17:54:59.122Z

### Assessment

| Metric     | Value    | Reasoning                                                                                                                                        |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Severity   | HIGH     | Core feature advertised via CLI flags is completely non-functional, breaking team workflows and causing user confusion with silent failures      |
| Complexity | LOW      | Simple propagation of existing field through 4 files following established labels pattern - no architectural changes or integration complexity   |
| Confidence | HIGH     | Clear evidence from code inspection shows exact gap: read path works perfectly, write path simply omits assignee field at each propagation layer |

---

## Problem Statement

The work CLI accepts `--assignee` flags in `create` and `set` commands but silently ignores them when creating or updating GitHub issues. The adapter correctly **reads** assignees from GitHub but fails to **write** them back. Manual GitHub API calls work perfectly, confirming this is purely a CLI implementation gap.

---

## Analysis

### Root Cause / Evidence Chain

**WHY**: `work set 1564 --assignee tbrandenburg` doesn't set the assignee
↓ **BECAUSE**: `updateWorkItem()` doesn't pass assignee to API client

**Evidence**: `src/adapters/github/index.ts:133-148`
```typescript
const updates: { title?: string; body?: string; labels?: string[] } = {};
// ❌ No assignee field in type

if (request.labels !== undefined) {
  updates.labels = [...request.labels];
}
// ❌ Missing: if (request.assignee !== undefined) { ... }
```

↓ **BECAUSE**: API client doesn't accept assignee parameter

**Evidence**: `src/adapters/github/api-client.ts:109-117`
```typescript
async updateIssue(
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    // ❌ Missing: assignees?: string[];
  }
): Promise<GitHubIssue>
```

↓ **BECAUSE**: Mapper function omits assignee from output

**Evidence**: `src/adapters/github/mapper.ts:30-48`
```typescript
export function workItemToGitHubIssue(request: CreateWorkItemRequest): {
  title: string;
  body?: string;
  labels?: string[];  // ✅ Labels included
  // ❌ Missing: assignees?: string[];
} {
  if (request.labels && request.labels.length > 0) {
    result.labels = [...request.labels];
  }
  // ❌ Missing: if (request.assignee) { result.assignees = [request.assignee]; }
}
```

↓ **ROOT CAUSE**: Assignee field never propagated from WorkItem types to GitHub API calls

The read path works perfectly (`githubIssueToWorkItem` on line 20 correctly extracts `issue.assignee?.login`), but the write path at three layers (mapper → API client → adapter) simply omits the assignee field despite:
1. WorkItem types defining `assignee?: string` field
2. GitHub API fully supporting `assignees` array
3. CLI schema advertising the feature
4. Labels using the exact pattern we need to mirror

### Affected Files

| File                              | Lines       | Action | Description                                    |
| --------------------------------- | ----------- | ------ | ---------------------------------------------- |
| `src/adapters/github/api-client.ts` | 88-107, 109-130 | UPDATE | Add assignees parameter to create/update methods |
| `src/adapters/github/mapper.ts`     | 30-48       | UPDATE | Add assignees to workItemToGitHubIssue return    |
| `src/adapters/github/index.ts`      | 76-91, 116-157  | UPDATE | Pass assignee through create/update operations   |
| `tests/unit/adapters/github/mapper.test.ts` | 102-119 | UPDATE | Fix test expectations to include assignee        |
| `tests/integration/adapters/github/adapter.test.ts` | NEW | CREATE | Add integration tests for assignee operations    |

### Integration Points

- **CLI commands** (`src/cli/commands/*.ts`) already pass `--assignee` flag to adapters
- **WorkItem types** (`src/types/work-item.ts:40-55`) already define `assignee?: string`
- **GitHub API** (`octokit.rest.issues.create/update`) already support `assignees` array
- **Mapper read path** (`mapper.ts:20`) already reads `issue.assignee?.login` correctly

No integration changes needed - all layers already support the field, just need to connect them.

### Git History

- **Introduced**: c7d9c66 - 2026-01-24 - "feat(adapters): implement GitHub Issues adapter with unified CLI interface (#27)"
- **Last modified**: 80a12bf - "Fix: GitHub adapter pagination for repos with >100 issues (#1361) (#1450)"
- **Implication**: Original implementation omitted assignee write path; has been missing since initial adapter implementation (2 weeks old)

---

## Implementation Plan

### Step 1: Update API Client Type for updateIssue

**File**: `src/adapters/github/api-client.ts`
**Lines**: 109-117
**Action**: UPDATE

**Current code:**
```typescript
async updateIssue(
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
  }
): Promise<GitHubIssue> {
```

**Required change:**
```typescript
async updateIssue(
  issueNumber: number,
  updates: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed';
    labels?: string[];
    assignees?: string[];  // ✅ ADD THIS
  }
): Promise<GitHubIssue> {
```

**Why**: API client must accept assignees array to pass to Octokit. GitHub API expects array format even for single assignee.

---

### Step 2: Update API Client createIssue Signature

**File**: `src/adapters/github/api-client.ts`
**Lines**: 88-107
**Action**: UPDATE

**Current code:**
```typescript
async createIssue(
  title: string,
  body?: string,
  labels?: string[]
): Promise<GitHubIssue> {
  try {
    const response = await this.octokit.rest.issues.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body: body || '',
      labels: labels || [],
    });
    return response.data as GitHubIssue;
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Required change:**
```typescript
async createIssue(
  title: string,
  body?: string,
  labels?: string[],
  assignees?: string[]  // ✅ ADD THIS
): Promise<GitHubIssue> {
  try {
    const response = await this.octokit.rest.issues.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body: body || '',
      labels: labels || [],
      assignees: assignees || [],  // ✅ ADD THIS
    });
    return response.data as GitHubIssue;
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Why**: Enable createIssue to accept and pass assignees array to GitHub API. Mirrors labels parameter pattern.

---

### Step 3: Update Mapper to Include Assignees

**File**: `src/adapters/github/mapper.ts`
**Lines**: 30-48
**Action**: UPDATE

**Current code:**
```typescript
export function workItemToGitHubIssue(request: CreateWorkItemRequest): {
  title: string;
  body?: string;
  labels?: string[];
} {
  const result: { title: string; body?: string; labels?: string[] } = {
    title: request.title,
  };

  if (request.description) {
    result.body = request.description;
  }

  if (request.labels && request.labels.length > 0) {
    result.labels = [...request.labels];
  }

  return result;
}
```

**Required change:**
```typescript
export function workItemToGitHubIssue(request: CreateWorkItemRequest): {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];  // ✅ ADD THIS
} {
  const result: { 
    title: string; 
    body?: string; 
    labels?: string[];
    assignees?: string[];  // ✅ ADD THIS
  } = {
    title: request.title,
  };

  if (request.description) {
    result.body = request.description;
  }

  if (request.labels && request.labels.length > 0) {
    result.labels = [...request.labels];
  }

  if (request.assignee) {  // ✅ ADD THIS
    result.assignees = [request.assignee];
  }

  return result;
}
```

**Why**: Convert single assignee from WorkItem format to array format expected by GitHub API. Only include assignees field if assignee is provided.

---

### Step 4: Update Adapter createWorkItem

**File**: `src/adapters/github/index.ts`
**Lines**: 76-91
**Action**: UPDATE

**Current code:**
```typescript
async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  const issueParams = workItemToGitHubIssue(request);
  const githubIssue = await this.apiClient.createIssue(
    issueParams.title,
    issueParams.body,
    issueParams.labels
  );

  return githubIssueToWorkItem(githubIssue);
}
```

**Required change:**
```typescript
async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  const issueParams = workItemToGitHubIssue(request);
  const githubIssue = await this.apiClient.createIssue(
    issueParams.title,
    issueParams.body,
    issueParams.labels,
    issueParams.assignees  // ✅ ADD THIS
  );

  return githubIssueToWorkItem(githubIssue);
}
```

**Why**: Pass assignees from mapper through to API client. Completes the create path.

---

### Step 5: Update Adapter updateWorkItem

**File**: `src/adapters/github/index.ts`
**Lines**: 116-157
**Action**: UPDATE

**Current code:**
```typescript
async updateWorkItem(
  id: string,
  request: UpdateWorkItemRequest
): Promise<WorkItem> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  const issueNumber = this.parseIssueNumber(id);

  const updates: { title?: string; body?: string; labels?: string[] } = {};

  if (request.title !== undefined) {
    updates.title = request.title;
  }

  if (request.description !== undefined) {
    updates.body = request.description;
  }

  if (request.labels !== undefined) {
    updates.labels = [...request.labels];
  }

  try {
    const githubIssue = await this.apiClient.updateIssue(
      issueNumber,
      updates
    );
    return githubIssueToWorkItem(githubIssue);
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    if (apiError.status === 404) {
      throw new GitHubNotFoundError(`Issue ${issueNumber} not found`);
    }
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Required change:**
```typescript
async updateWorkItem(
  id: string,
  request: UpdateWorkItemRequest
): Promise<WorkItem> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  const issueNumber = this.parseIssueNumber(id);

  const updates: { 
    title?: string; 
    body?: string; 
    labels?: string[];
    assignees?: string[];  // ✅ ADD THIS
  } = {};

  if (request.title !== undefined) {
    updates.title = request.title;
  }

  if (request.description !== undefined) {
    updates.body = request.description;
  }

  if (request.labels !== undefined) {
    updates.labels = [...request.labels];
  }

  if (request.assignee !== undefined) {  // ✅ ADD THIS
    updates.assignees = request.assignee ? [request.assignee] : [];
  }

  try {
    const githubIssue = await this.apiClient.updateIssue(
      issueNumber,
      updates
    );
    return githubIssueToWorkItem(githubIssue);
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    if (apiError.status === 404) {
      throw new GitHubNotFoundError(`Issue ${issueNumber} not found`);
    }
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Why**: Check for assignee in update request and convert to array format. Empty string clears assignee (empty array). Mirrors labels pattern exactly.

---

### Step 6: Fix Mapper Unit Test

**File**: `tests/unit/adapters/github/mapper.test.ts`
**Lines**: 102-119
**Action**: UPDATE

**Current code:**
```typescript
it('should convert CreateWorkItemRequest to GitHub issue params', () => {
  const request: CreateWorkItemRequest = {
    kind: 'task',
    title: 'New Task',
    description: 'Task description',
    priority: 'high',
    assignee: 'developer',
    labels: ['feature', 'urgent'],
  };

  const githubParams = workItemToGitHubIssue(request);

  expect(githubParams).toEqual({
    title: 'New Task',
    body: 'Task description',
    labels: ['feature', 'urgent'],
  });
});
```

**Required change:**
```typescript
it('should convert CreateWorkItemRequest to GitHub issue params', () => {
  const request: CreateWorkItemRequest = {
    kind: 'task',
    title: 'New Task',
    description: 'Task description',
    priority: 'high',
    assignee: 'developer',
    labels: ['feature', 'urgent'],
  };

  const githubParams = workItemToGitHubIssue(request);

  expect(githubParams).toEqual({
    title: 'New Task',
    body: 'Task description',
    labels: ['feature', 'urgent'],
    assignees: ['developer'],  // ✅ ADD THIS
  });
});
```

**Why**: Test was providing assignee but not expecting it in output. Update expectation to match new behavior.

---

### Step 7: Add Mapper Test for Empty Assignee

**File**: `tests/unit/adapters/github/mapper.test.ts`
**Lines**: After existing workItemToGitHubIssue test
**Action**: CREATE

**Test case to add:**
```typescript
it('should not include assignees field when assignee is undefined', () => {
  const request: CreateWorkItemRequest = {
    kind: 'task',
    title: 'Unassigned Task',
    labels: ['feature'],
  };

  const githubParams = workItemToGitHubIssue(request);

  expect(githubParams).toEqual({
    title: 'Unassigned Task',
    labels: ['feature'],
  });
  expect(githubParams).not.toHaveProperty('assignees');
});

it('should convert assignee to assignees array', () => {
  const request: CreateWorkItemRequest = {
    kind: 'task',
    title: 'Assigned Task',
    assignee: 'tbrandenburg',
  };

  const githubParams = workItemToGitHubIssue(request);

  expect(githubParams.assignees).toEqual(['tbrandenburg']);
});
```

**Why**: Verify mapper correctly handles both presence and absence of assignee field.

---

### Step 8: Add Integration Test for Assignee Operations

**File**: `tests/integration/adapters/github/adapter.test.ts`
**Lines**: NEW test describe block
**Action**: CREATE

**Test cases to add:**
```typescript
describe('Assignee operations', () => {
  it('should create issue with assignee', async () => {
    const adapter = new GitHubAdapter();
    await adapter.authenticate({ useGitHubCLI: true });

    const request: CreateWorkItemRequest = {
      kind: 'task',
      title: 'Test: Assignee on create',
      description: 'Testing assignee functionality',
      assignee: 'tbrandenburg',
    };

    const workItem = await adapter.createWorkItem(request);

    expect(workItem.assignee).toBe('tbrandenburg');

    // Cleanup
    await adapter.apiClient?.deleteIssue?.(parseInt(workItem.id));
  });

  it('should update issue assignee', async () => {
    const adapter = new GitHubAdapter();
    await adapter.authenticate({ useGitHubCLI: true });

    // Create unassigned issue
    const created = await adapter.createWorkItem({
      kind: 'task',
      title: 'Test: Assignee update',
    });

    // Update with assignee
    const updated = await adapter.updateWorkItem(created.id, {
      assignee: 'tbrandenburg',
    });

    expect(updated.assignee).toBe('tbrandenburg');

    // Cleanup
    await adapter.apiClient?.deleteIssue?.(parseInt(created.id));
  });

  it('should clear assignee with empty string', async () => {
    const adapter = new GitHubAdapter();
    await adapter.authenticate({ useGitHubCLI: true });

    // Create assigned issue
    const created = await adapter.createWorkItem({
      kind: 'task',
      title: 'Test: Clear assignee',
      assignee: 'tbrandenburg',
    });

    expect(created.assignee).toBe('tbrandenburg');

    // Clear assignee
    const updated = await adapter.updateWorkItem(created.id, {
      assignee: '',
    });

    expect(updated.assignee).toBeUndefined();

    // Cleanup
    await adapter.apiClient?.deleteIssue?.(parseInt(created.id));
  });
});
```

**Why**: Validate complete assignee lifecycle (create with assignee, update assignee, clear assignee) against real GitHub API.

---

## Patterns to Follow

**From codebase - mirror labels pattern exactly:**

```typescript
// SOURCE: src/adapters/github/index.ts:144-146
// Pattern for optional array fields in updates
if (request.labels !== undefined) {
  updates.labels = [...request.labels];
}

// APPLY TO ASSIGNEE:
if (request.assignee !== undefined) {
  updates.assignees = request.assignee ? [request.assignee] : [];
}
```

```typescript
// SOURCE: src/adapters/github/mapper.ts:42-44
// Pattern for conditional field inclusion
if (request.labels && request.labels.length > 0) {
  result.labels = [...request.labels];
}

// APPLY TO ASSIGNEE:
if (request.assignee) {
  result.assignees = [request.assignee];
}
```

**Key differences from labels:**
- WorkItem uses `assignee: string` (singular), GitHub API uses `assignees: string[]` (array)
- Empty string assignee should map to empty array (clears all assignees)
- Undefined assignee should omit field (no change to existing assignees)

---

## Edge Cases & Risks

| Risk/Edge Case                          | Mitigation                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Invalid assignee (non-collaborator)     | GitHub API returns 422 error with clear message - let it propagate to user         |
| Empty string assignee                   | Map to empty array `[]` to clear assignees (existing GitHub behavior)             |
| Undefined assignee in update            | Omit field from updates object (preserve existing assignees)                       |
| Multiple assignees (GitHub supports)    | Current WorkItem type is `assignee: string` - single assignee only for now         |
| TypeScript strict mode violations       | All changes use explicit types, no `any`, matches existing patterns                |
| Breaking existing functionality         | Only adding new field propagation - no changes to existing logic                   |
| Test coverage regression                | New tests added, existing tests updated to reflect new behavior                    |

---

## Validation

### Automated Checks

```bash
npm install                    # Ensure dependencies
npm run type-check             # TypeScript strict mode
npm run lint                   # ESLint validation
npm run build                  # Compile to dist/
npm test                       # Full test suite with new tests
npm test -- --coverage         # Verify >60% coverage maintained
```

### Manual Verification

1. **Create with assignee:**
   ```bash
   work create "Test assignee" --assignee tbrandenburg
   work get {issue-id}  # Verify assignee shown
   gh issue view {issue-id}  # Verify on GitHub
   ```

2. **Update assignee:**
   ```bash
   work set {issue-id} --assignee tbrandenburg
   work get {issue-id}  # Verify assignee changed
   ```

3. **Clear assignee:**
   ```bash
   work set {issue-id} --assignee ""
   work get {issue-id}  # Verify "Unassigned"
   ```

4. **Verify no regression:**
   ```bash
   work list  # Ensure list still works
   work create "No assignee test"  # Ensure create without assignee works
   work set {issue-id} --title "New title"  # Ensure other fields still update
   ```

---

## Scope Boundaries

**IN SCOPE:**

- Add assignee field propagation through adapter layers (API client, mapper, adapter)
- Update unit tests to reflect new behavior
- Add integration tests for assignee operations
- Handle single assignee only (matching current WorkItem type)
- Support clearing assignee with empty string

**OUT OF SCOPE (do not touch):**

- Multiple assignees support (GitHub allows this but WorkItem type is singular)
- Assignee validation before API call (let GitHub API handle validation)
- Priority field (separate issue mentioned in original report)
- Other adapters (Jira, Linear, ADO) - GitHub only for now
- CLI command changes (already accept `--assignee` flag)
- WorkItem type changes (already defines `assignee?: string`)
- Documentation updates (can be done after implementation verified)
- Error handling beyond existing patterns (GitHub API errors already propagate)

---

## Metadata

- **Investigated by**: Claude (GitHub Copilot CLI)
- **Timestamp**: 2026-02-07T17:54:59.122Z
- **Artifact**: `.claude/PRPs/issues/issue-1566.md`
- **Issue URL**: https://github.com/tbrandenburg/work/issues/1566
- **Issue Author**: tbrandenburg (Tom Brandenburg)
- **Issue Created**: 2026-01-24 (2 weeks ago)
- **Issue State**: OPEN
- **Labels**: bug, enhancement
