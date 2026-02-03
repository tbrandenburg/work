# Investigation: GitHub adapter only fetches first 100 issues (missing pagination)

**Issue**: #1361 (https://github.com/tbrandenburg/work/issues/1361)
**Type**: BUG
**Investigated**: 2026-01-27T12:00:00Z

### Assessment

| Metric     | Value    | Reasoning                                                                                                                                                                       |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Severity   | HIGH     | Affects 92% of issues in large repos (1,195/1,295 issues inaccessible), breaks discoverability, impacts real workflows like prioritization scripts                           |
| Complexity | MEDIUM   | Requires 2 files (api-client.ts, index.ts), pagination loop logic, interface changes needed, moderate risk but well-understood solution pattern                               |
| Confidence | HIGH     | Root cause clearly identified in api-client.ts:41-55 (no pagination loop), evidence from issue report confirms behavior, GitHub API pagination pattern is well-documented |

---

## Problem Statement

The GitHub adapter's `listIssues()` method only fetches the first 100 issues from a repository, making 92% of issues (1,195 out of 1,295) inaccessible via `work list` in the tbrandenburg/work repository. While individual issues can be retrieved with `work get <id>`, they cannot be discovered through list operations.

---

## Analysis

### Root Cause / Change Rationale

**Evidence Chain:**

**WHY**: Users report only 100 issues appear in `work list` output for repos with 1,295+ issues
↓ **BECAUSE**: The GitHub adapter's `listIssues()` method only returns the first page
**Evidence**: `src/adapters/github/api-client.ts:41-55`
```typescript
async listIssues(): Promise<GitHubIssue[]> {
  const response = await this.octokit.rest.issues.listForRepo({
    owner: this.config.owner,
    repo: this.config.repo,
    state: 'all',
    per_page: 100,  // ⚠️ Hard-coded limit
  });
  return response.data as GitHubIssue[];  // ⚠️ Only first page
}
```

↓ **BECAUSE**: No pagination loop exists to fetch subsequent pages
**Evidence**: Method returns `response.data` directly without checking `response.headers.link` or using page iteration

↓ **BECAUSE**: GitHub API limits results to 100 per page and requires explicit pagination
**Evidence**: GitHub API documentation specifies max `per_page: 100` and provides Link header for next pages

↓ **ROOT CAUSE**: Missing pagination implementation in `listIssues()` method
**Evidence**: `src/adapters/github/api-client.ts:47` - Returns after single API call with no loop or iterator

### Affected Files

| File                                  | Lines  | Action | Description                                |
| ------------------------------------- | ------ | ------ | ------------------------------------------ |
| `src/adapters/github/api-client.ts`   | 41-55  | UPDATE | Add pagination loop to listIssues()        |
| `src/types/context.ts`                | 52-141 | UPDATE | Add optional pagination params to interface |
| `tests/unit/adapters/github/api-client.test.ts` | NEW    | UPDATE | Add pagination test cases                  |
| `tests/integration/adapters/github/github-adapter.test.ts` | 103-120 | UPDATE | Add test for repos with >100 issues (if feasible) |

### Integration Points

- `src/adapters/github/index.ts:186-206` - `listWorkItems()` method calls `apiClient.listIssues()`
- `src/cli/commands/list/index.ts` - Consumes work items via adapter
- `examples/work-item-prioritization/prioritize.sh` - Uses `work list` for batch operations

### Git History

- **Introduced**: c7d9c66 - 2026-01-24 - "feat(adapters): implement GitHub Issues adapter with unified CLI interface (#27)"
- **Last modified**: 87d0d15 - "feat: implement enhanced GitHub authentication hierarchy with gh CLI integration (#30)"
- **Implication**: Original implementation oversight, not a regression; existed since adapter was created

---

## Implementation Plan

### Step 1: Add Pagination Loop to `listIssues()`

**File**: `src/adapters/github/api-client.ts`
**Lines**: 41-55
**Action**: UPDATE

**Current code:**
```typescript
async listIssues(): Promise<GitHubIssue[]> {
  try {
    const response = await this.octokit.rest.issues.listForRepo({
      owner: this.config.owner,
      repo: this.config.repo,
      state: 'all',
      per_page: 100,
    });

    return response.data as GitHubIssue[];
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Required change:**
```typescript
async listIssues(options: { maxPages?: number } = {}): Promise<GitHubIssue[]> {
  const { maxPages = 20 } = options; // Default: up to 2,000 issues
  
  try {
    const allIssues: GitHubIssue[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const response = await this.octokit.rest.issues.listForRepo({
        owner: this.config.owner,
        repo: this.config.repo,
        state: 'all',
        per_page: 100,
        page,
      });

      const pageData = response.data as GitHubIssue[];
      allIssues.push(...pageData);

      // Stop if we got fewer than 100 results (last page)
      hasMore = pageData.length === 100;
      page++;
    }

    return allIssues;
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Why**: 
- Uses simple pagination loop (page counter)
- Safety limit via `maxPages` parameter (default 20 = 2,000 issues)
- Stops automatically when last page reached (< 100 results)
- Maintains backward compatibility (optional parameter with default)

---

### Step 2: Update GitHub Adapter to Pass Pagination Options

**File**: `src/adapters/github/index.ts`
**Lines**: 186-206
**Action**: UPDATE

**Current code:**
```typescript
async listWorkItems(query?: string): Promise<WorkItem[]> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  const githubIssues = await this.apiClient.listIssues();
  let workItems = githubIssues.map(githubIssueToWorkItem);
  // ... query filtering ...
}
```

**Required change:**
```typescript
async listWorkItems(query?: string): Promise<WorkItem[]> {
  if (!this.apiClient) {
    throw new GitHubAuthError(
      'Not authenticated. Call authenticate() first.'
    );
  }

  // Fetch all issues with pagination (up to 2,000 by default)
  const githubIssues = await this.apiClient.listIssues({ maxPages: 20 });
  let workItems = githubIssues.map(githubIssueToWorkItem);
  // ... query filtering ...
}
```

**Why**: Explicitly passes pagination options to use the new parameter

---

### Step 3: Add Unit Tests for Pagination

**File**: `tests/unit/adapters/github/api-client.test.ts`
**Lines**: NEW section
**Action**: UPDATE

**Test cases to add:**

```typescript
describe('listIssues pagination', () => {
  it('should fetch all pages when repo has >100 issues', async () => {
    // Mock first page (100 items)
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      title: `Issue ${i + 1}`,
      state: 'open',
      // ... other required fields
    }));

    // Mock second page (50 items - last page)
    const page2 = Array.from({ length: 50 }, (_, i) => ({
      id: i + 101,
      number: i + 101,
      title: `Issue ${i + 101}`,
      state: 'open',
      // ... other required fields
    }));

    mockOctokit.rest.issues.listForRepo
      .mockResolvedValueOnce({ data: page1 } as any)
      .mockResolvedValueOnce({ data: page2 } as any);

    const client = new GitHubApiClient(mockConfig);
    const result = await client.listIssues();

    expect(result).toHaveLength(150);
    expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledTimes(2);
    expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 100 })
    );
    expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, per_page: 100 })
    );
  });

  it('should respect maxPages limit', async () => {
    // Mock 100 items per page (simulating large repo)
    const page = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      title: `Issue ${i + 1}`,
      state: 'open',
    }));

    mockOctokit.rest.issues.listForRepo.mockResolvedValue({ data: page } as any);

    const client = new GitHubApiClient(mockConfig);
    const result = await client.listIssues({ maxPages: 3 });

    // Should stop after 3 pages even if more exist
    expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(300);
  });

  it('should stop fetching when page returns <100 results', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      title: `Issue ${i + 1}`,
      state: 'open',
    }));

    const page2 = Array.from({ length: 25 }, (_, i) => ({
      id: i + 101,
      number: i + 101,
      title: `Issue ${i + 101}`,
      state: 'open',
    }));

    mockOctokit.rest.issues.listForRepo
      .mockResolvedValueOnce({ data: page1 } as any)
      .mockResolvedValueOnce({ data: page2 } as any);

    const client = new GitHubApiClient(mockConfig);
    const result = await client.listIssues({ maxPages: 10 });

    // Should stop after 2 pages (page 2 has <100 results)
    expect(mockOctokit.rest.issues.listForRepo).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(125);
  });
});
```

---

### Step 4: Update Integration Tests (Optional - Document Limitation)

**File**: `tests/integration/adapters/github/github-adapter.test.ts`
**Lines**: 103-120
**Action**: UPDATE (add comment)

**Current code:**
```typescript
it.skipIf(skipTests)('should list issues from repository', async () => {
  const workItems = await adapter.listWorkItems();

  expect(Array.isArray(workItems)).toBe(true);
  expect(workItems.length).toBeGreaterThanOrEqual(0);
  // ... checks first 5 items ...
});
```

**Required change:**
```typescript
it.skipIf(skipTests)('should list issues from repository', async () => {
  const workItems = await adapter.listWorkItems();

  expect(Array.isArray(workItems)).toBe(true);
  expect(workItems.length).toBeGreaterThanOrEqual(0);
  
  // Note: Test repo may have >100 issues but we test with defaults
  // Full pagination is tested in unit tests
  // For repos with 1,295+ issues, this should now fetch all (up to maxPages limit)
  
  // ... checks first 5 items ...
});
```

**Why**: Integration test can't reliably verify pagination without a test repo with exactly >100 issues. Document the limitation and rely on unit tests.

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/adapters/github/api-client.ts:67-91
// Pattern for error handling with typed error conversion
async getIssue(issueNumber: number): Promise<GitHubIssue> {
  try {
    const response = await this.octokit.rest.issues.get({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
    });

    return response.data as GitHubIssue;
  } catch (error: unknown) {
    const apiError = error as { message: string; status?: number };
    throw new GitHubApiError(apiError.message, apiError.status || 500);
  }
}
```

**Pattern**: Use try/catch with typed error conversion to GitHubApiError

---

## Edge Cases & Risks

| Risk/Edge Case                            | Mitigation                                                   |
| ----------------------------------------- | ------------------------------------------------------------ |
| Repository with >2,000 issues (>20 pages) | `maxPages` parameter limits fetch; consider increasing default or making configurable |
| API rate limiting during pagination       | Octokit throttling plugin already configured; will auto-retry |
| Empty repository (0 issues)               | Loop handles empty first page correctly (length === 0)       |
| Network failure mid-pagination            | Error thrown and propagated; partial results discarded       |
| Performance degradation for large repos   | Acceptable tradeoff; ~1-2s per 1,000 issues; can optimize later with caching |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Run unit tests for GitHub adapter
npm test -- tests/unit/adapters/github/api-client.test.ts

# Run all tests
npm test

# Linting
npm run lint
```

### Manual Verification

1. **Test with repository with >100 issues:**
   ```bash
   work context add test-large --tool github --url https://github.com/tbrandenburg/work
   work context set test-large
   work auth login
   work list --format json | jq 'length'
   # Expected: >100 (should show 1,295 issues)
   ```

2. **Verify specific older issue is now accessible:**
   ```bash
   work list | grep "#852"
   # Expected: Found (previously missing)
   ```

3. **Check performance:**
   ```bash
   time work list > /dev/null
   # Expected: <5s for 1,295 issues
   ```

4. **Verify no regression for small repos:**
   ```bash
   work context add test-small --tool github --url https://github.com/octocat/Hello-World
   work context set test-small
   work list
   # Expected: Works as before (likely <100 issues)
   ```

---

## Scope Boundaries

**IN SCOPE:**
- Fix `listIssues()` to fetch all pages up to `maxPages` limit
- Add unit tests for pagination logic
- Update adapter to use new pagination
- Default limit of 20 pages (2,000 issues)

**OUT OF SCOPE (do not touch):**
- Changing `WorkAdapter` interface to expose pagination params to CLI (future enhancement)
- Implementing streaming/cursor-based pagination (optimization for later)
- Adding caching layer for list results (separate performance issue)
- Modifying other adapters (local-fs works differently)
- Adding pagination to other GitHub methods (createIssue, updateIssue, etc. - single item ops)

---

## Metadata

- **Investigated by**: Claude (GitHub Copilot CLI)
- **Timestamp**: 2026-01-27T12:00:00Z
- **Artifact**: `.claude/PRPs/issues/issue-1361.md`
- **Complexity Reasoning**: 2 files modified (api-client, index), straightforward pagination logic, well-tested pattern, moderate integration risk
- **Confidence Reasoning**: Root cause clearly identified with code evidence, GitHub API pagination is standard pattern, solution verified in issue discussion
