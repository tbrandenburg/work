# Investigation: Add dedicated agent assignment field for first-class AI agent support

**Issue**: #1572 (https://github.com/tbrandenburg/work/issues/1572)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-07T20:01:37.505Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                 |
|------------|--------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Priority   | HIGH   | Core to work CLI's mission of mixed human-agent teams; agents currently second-class via labels, blocking product vision fulfillment     |
| Complexity | MEDIUM | Requires changes across 12+ files (types, CLI, adapters, query engine, tests) but follows established assignee field pattern exactly     |
| Confidence | HIGH   | Clear requirements, assignee field provides exact blueprint to mirror, existing patterns well-tested, no architectural unknowns          |

---

## Problem Statement

Work CLI's mission is "revolutionary mixed human-agent teams where everyone operates on the same level," but currently humans have a first-class `assignee` field while agents are relegated to label conventions (`agent:X`). This creates verbose queries, no semantic distinction, no validation, and poor visibility. Agents deserve dedicated `agent?: string` field parallel to `assignee` for equal status.

---

## Analysis

### Root Cause / Change Rationale

**WHY add agent field?**
↓ BECAUSE: Work CLI vision is equal human-agent teams, but current implementation treats agents as second-class
Evidence: Issue description shows label-based workaround (`--labels agent:X` vs `--assignee john`) and lists 6 specific limitations

↓ BECAUSE: Labels are generic metadata, not semantically distinct from other labels
Evidence: `src/types/work-item.ts:28` - `labels: readonly string[]` has no type safety for agent identification

↓ BECAUSE: Query engine requires verbose label syntax (`where label=agent:X`) vs simple field access
Evidence: `src/core/query.ts:461` - `assignee` has dedicated case, labels don't distinguish agent from other labels

↓ ROOT CAUSE: No dedicated field in WorkItem type for agent assignment
Evidence: `src/types/work-item.ts:20-32` - WorkItem has `assignee?: string` but no parallel `agent` field

### Evidence Chain

WHY: Agents treated as second-class citizens
↓ BECAUSE: No dedicated field in type system
Evidence: `src/types/work-item.ts:27` - Only `assignee?: string | undefined` exists

↓ BECAUSE: Original MVP focused on human workflow, agent support added via convention
Evidence: Git history shows assignee added in commit 02bb9eb (MVP implementation), no agent field planned

↓ ROOT CAUSE: Need to add `agent?: string` field to WorkItem type and wire through entire stack
Evidence: Assignee implementation in `work-item.ts:27,45,53` provides exact pattern to mirror

### Affected Files

| File                                    | Lines     | Action | Description                                           |
|-----------------------------------------|-----------|--------|-------------------------------------------------------|
| `src/types/work-item.ts`                | 20-32     | UPDATE | Add `agent?: string \| undefined` to WorkItem         |
| `src/types/work-item.ts`                | 40-47     | UPDATE | Add `agent` to CreateWorkItemRequest                  |
| `src/types/work-item.ts`                | 49-55     | UPDATE | Add `agent` to UpdateWorkItemRequest                  |
| `src/cli/commands/create.ts`            | 40-43,65  | UPDATE | Add `--agent` flag and wire to request                |
| `src/cli/commands/set.ts`               | 36-38,61  | UPDATE | Add `--agent` flag for updates                        |
| `src/cli/commands/unset.ts`             | 12,39-40  | UPDATE | Add 'agent' to field options                          |
| `src/cli/commands/get.ts`               | 48        | UPDATE | Display agent field in output                         |
| `src/core/query.ts`                     | 461,634   | UPDATE | Add agent field support to query engine               |
| `src/adapters/local-fs/storage.ts`      | 40        | UPDATE | Add agent to frontmatter serialization                |
| `src/adapters/local-fs/index.ts`        | 57,87     | UPDATE | Handle agent in create/update methods                 |
| `src/adapters/github/mapper.ts`         | 19,49     | UPDATE | Map agent field to/from GitHub (label-based)          |
| `tests/unit/types/work-item.test.ts`    | 35        | UPDATE | Add agent to test fixture                             |
| `tests/unit/core/query.test.ts`         | NEW       | CREATE | Add agent query tests                                 |
| `tests/integration/cli/commands/*.ts`   | MULTIPLE  | UPDATE | Add agent flag tests for create/set/unset/get         |
| `tests/integration/adapters/*/**.ts`    | MULTIPLE  | UPDATE | Test agent storage/retrieval per adapter              |

### Integration Points

**Type System → CLI**
- `src/cli/commands/create.ts:65` - Reads `flags.agent` into `CreateWorkItemRequest.agent`
- `src/cli/commands/set.ts:61` - Reads `flags.agent` into `UpdateWorkItemRequest.agent`

**CLI → Engine**
- `src/cli/commands/create.ts:72` - Calls `engine.createWorkItem(request)` with agent
- `src/cli/commands/set.ts:78` - Calls `engine.updateWorkItem(id, request)` with agent

**Engine → Adapters**
- `src/core/engine.ts` - Delegates to `adapter.createWorkItem()` and `adapter.updateWorkItem()`
- Adapters must persist agent field in backend-specific format

**Adapters → Storage**
- Local-FS: `src/adapters/local-fs/storage.ts:40` - Serialize agent in YAML frontmatter
- GitHub: `src/adapters/github/mapper.ts:19,49` - Map agent to/from `agent:*` label

**Query Engine → Filtering**
- `src/core/query.ts:461` - Extract agent value via `getFieldValue(item, 'agent')`
- `src/core/query.ts:634` - Filter by agent in `filterWorkItems()` WHERE clause

**CLI → Display**
- `src/cli/commands/get.ts:48` - Display agent field in single item view
- `src/cli/commands/list.ts` - Display agent in table format (if added)

### Git History

- **assignee introduced**: Commit 02bb9eb (2024) - "feat(core): implement complete work CLI engine with local-fs adapter"
- **assignee GitHub fix**: Commit 6d60cb3 (2026-02-07) - "Fix: GitHub adapter ignores assignee field"
- **Implication**: Assignee is established pattern; agent follows same implementation path recently validated

---

## Implementation Plan

### Step 1: Add agent field to WorkItem type

**File**: `src/types/work-item.ts`
**Lines**: 20-32
**Action**: UPDATE

**Current code:**
```typescript
export interface WorkItem {
  readonly id: string;
  readonly kind: WorkItemKind;
  readonly title: string;
  readonly description?: string | undefined;
  readonly state: WorkItemState;
  readonly priority: Priority;
  readonly assignee?: string | undefined;
  readonly labels: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string | undefined;
}
```

**Required change:**
```typescript
export interface WorkItem {
  readonly id: string;
  readonly kind: WorkItemKind;
  readonly title: string;
  readonly description?: string | undefined;
  readonly state: WorkItemState;
  readonly priority: Priority;
  readonly assignee?: string | undefined;
  readonly agent?: string | undefined;  // 🆕 AI/automation agent assignee
  readonly labels: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string | undefined;
}
```

**Why**: Core type must include agent field for type safety across entire system

---

### Step 2: Add agent to CreateWorkItemRequest

**File**: `src/types/work-item.ts`
**Lines**: 40-47
**Action**: UPDATE

**Current code:**
```typescript
export interface CreateWorkItemRequest {
  readonly title: string;
  readonly kind: WorkItemKind;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly labels?: readonly string[] | undefined;
}
```

**Required change:**
```typescript
export interface CreateWorkItemRequest {
  readonly title: string;
  readonly kind: WorkItemKind;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly agent?: string | undefined;  // 🆕 AI agent assignment
  readonly labels?: readonly string[] | undefined;
}
```

**Why**: Create operation must accept agent parameter from CLI

---

### Step 3: Add agent to UpdateWorkItemRequest

**File**: `src/types/work-item.ts`
**Lines**: 49-55
**Action**: UPDATE

**Current code:**
```typescript
export interface UpdateWorkItemRequest {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly labels?: readonly string[] | undefined;
}
```

**Required change:**
```typescript
export interface UpdateWorkItemRequest {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly agent?: string | undefined;  // 🆕 AI agent update
  readonly labels?: readonly string[] | undefined;
}
```

**Why**: Update operation must support changing agent assignment

---

### Step 4: Add --agent flag to create command

**File**: `src/cli/commands/create.ts`
**Lines**: 40-43, 65
**Action**: UPDATE

**Current code:**
```typescript
// Line 40-43 (flags section)
assignee: Flags.string({
  char: 'a',
  description: 'assignee username',
}),

// Line 65 (request building)
const request: CreateWorkItemRequest = {
  title: args.title,
  kind: flags.kind as WorkItemKind,
  description: flags.description,
  priority: flags.priority as Priority,
  assignee: flags.assignee,
  labels: flags.labels,
};
```

**Required change:**
```typescript
// Add flag after assignee (line ~44)
agent: Flags.string({
  description: 'AI agent or automation assignee',
}),

// Update request building (line 65)
const request: CreateWorkItemRequest = {
  title: args.title,
  kind: flags.kind as WorkItemKind,
  description: flags.description,
  priority: flags.priority as Priority,
  assignee: flags.assignee,
  agent: flags.agent,  // 🆕 Wire agent flag
  labels: flags.labels,
};
```

**Why**: Users need CLI flag to assign agent during creation

---

### Step 5: Add --agent flag to set command

**File**: `src/cli/commands/set.ts`
**Lines**: 36-38, 61, 85
**Action**: UPDATE

**Current code:**
```typescript
// Line 36-38 (flags)
assignee: Flags.string({
  description: 'update work item assignee',
}),

// Line 61 (request building)
if (flags.assignee) updateRequest.assignee = flags.assignee;

// Line 85 (output)
if (workItem.assignee) this.log(`Assignee: ${workItem.assignee}`);
```

**Required change:**
```typescript
// Add flag after assignee (line ~39)
agent: Flags.string({
  description: 'update AI agent assignee',
}),

// Add to request building (line ~62)
if (flags.agent) updateRequest.agent = flags.agent;

// Add to output (line ~86)
if (workItem.agent) this.log(`Agent: ${workItem.agent}`);
```

**Why**: Users need to update agent assignment on existing items

---

### Step 6: Add agent to unset command

**File**: `src/cli/commands/unset.ts`
**Lines**: 12, 39-40
**Action**: UPDATE

**Current code:**
```typescript
// Line 12 (field options)
field: Args.string({
  description: 'field name',
  options: ['assignee', 'description'],
  required: true,
}),

// Line 39-40 (handler)
if (args.field === 'assignee') {
  updateRequest.assignee = undefined;
}
```

**Required change:**
```typescript
// Line 12 (add agent option)
field: Args.string({
  description: 'field name',
  options: ['assignee', 'agent', 'description'],  // 🆕 Add agent
  required: true,
}),

// Line 39-40 (add agent handler)
if (args.field === 'assignee') {
  updateRequest.assignee = undefined;
} else if (args.field === 'agent') {
  updateRequest.agent = undefined;  // 🆕 Clear agent
}
```

**Why**: Users need to clear agent assignment

---

### Step 7: Display agent in get command

**File**: `src/cli/commands/get.ts`
**Lines**: 48
**Action**: UPDATE

**Current code:**
```typescript
this.log(`Assignee:    ${workItem.assignee || 'Unassigned'}`);
```

**Required change:**
```typescript
this.log(`Assignee:    ${workItem.assignee || 'Unassigned'}`);
this.log(`Agent:       ${workItem.agent || 'None'}`);  // 🆕 Show agent
```

**Why**: Users need visibility into agent assignments when viewing items

---

### Step 8: Add agent support to query engine

**File**: `src/core/query.ts`
**Lines**: 461, 634
**Action**: UPDATE

**Current code:**
```typescript
// Line 461 (getFieldValue)
case 'assignee':
  return item.assignee || '';

// Line 634 (filterWorkItems simple filtering)
case 'assignee':
  return item.assignee === value;
```

**Required change:**
```typescript
// Line 461 (add agent case after assignee)
case 'assignee':
  return item.assignee || '';
case 'agent':
  return item.agent || '';  // 🆕 Extract agent value

// Line 634 (add agent filtering after assignee)
case 'assignee':
  return item.assignee === value;
case 'agent':
  return item.agent === value;  // 🆕 Filter by agent
```

**Why**: `work list where agent=X` queries must work

---

### Step 9: Store agent in Local-FS frontmatter

**File**: `src/adapters/local-fs/storage.ts`
**Lines**: 34-45
**Action**: UPDATE

**Current code:**
```typescript
const frontmatter = {
  id: workItem.id,
  kind: workItem.kind,
  title: workItem.title,
  state: workItem.state,
  priority: workItem.priority,
  assignee: workItem.assignee,
  labels: workItem.labels,
  createdAt: workItem.createdAt,
  updatedAt: workItem.updatedAt,
  closedAt: workItem.closedAt,
};
```

**Required change:**
```typescript
const frontmatter = {
  id: workItem.id,
  kind: workItem.kind,
  title: workItem.title,
  state: workItem.state,
  priority: workItem.priority,
  assignee: workItem.assignee,
  agent: workItem.agent,  // 🆕 Serialize agent
  labels: workItem.labels,
  createdAt: workItem.createdAt,
  updatedAt: workItem.updatedAt,
  closedAt: workItem.closedAt,
};
```

**Why**: Local-FS adapter must persist agent to file

---

### Step 10: Handle agent in Local-FS create method

**File**: `src/adapters/local-fs/index.ts`
**Lines**: 46-65
**Action**: UPDATE

**Current code:**
```typescript
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
```

**Required change:**
```typescript
const workItem: WorkItem = {
  id,
  kind: request.kind,
  title: request.title,
  description: request.description,
  state: 'new',
  priority: request.priority || 'medium',
  assignee: request.assignee,
  agent: request.agent,  // 🆕 Pass agent through
  labels: request.labels || [],
  createdAt: now,
  updatedAt: now,
};
```

**Why**: Create operation must initialize agent field

---

### Step 11: Handle agent in Local-FS update method

**File**: `src/adapters/local-fs/index.ts`
**Lines**: 75-94
**Action**: UPDATE

**Current code:**
```typescript
const updated: WorkItem = {
  ...existing,
  title: request.title ?? existing.title,
  description: request.description ?? existing.description,
  priority: request.priority ?? existing.priority,
  assignee: request.assignee ?? existing.assignee,
  labels: request.labels ?? existing.labels,
  updatedAt: now,
};
```

**Required change:**
```typescript
const updated: WorkItem = {
  ...existing,
  title: request.title ?? existing.title,
  description: request.description ?? existing.description,
  priority: request.priority ?? existing.priority,
  assignee: request.assignee ?? existing.assignee,
  agent: request.agent ?? existing.agent,  // 🆕 Update agent with nullish coalescing
  labels: request.labels ?? existing.labels,
  updatedAt: now,
};
```

**Why**: Update must support changing or preserving agent

---

### Step 12: Map agent in GitHub adapter (read)

**File**: `src/adapters/github/mapper.ts`
**Lines**: 11-25
**Action**: UPDATE

**Current code:**
```typescript
export function githubIssueToWorkItem(issue: GitHubIssue): WorkItem {
  return {
    id: issue.number.toString(),
    kind: 'task',
    title: issue.title,
    description: issue.body || undefined,
    state: mapGitHubState(issue.state),
    priority: extractPriorityFromLabels(issue.labels),
    assignee: issue.assignee?.login,
    labels: mapGitHubLabelsToWorkLabels(issue.labels),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at || undefined,
  };
}
```

**Required change:**
```typescript
export function githubIssueToWorkItem(issue: GitHubIssue): WorkItem {
  // Extract agent from labels
  const agentLabel = issue.labels.find((l) =>
    typeof l === 'string' ? l.startsWith('agent:') : l.name?.startsWith('agent:')
  );
  const agent = agentLabel
    ? (typeof agentLabel === 'string' ? agentLabel : agentLabel.name || '')
        .replace('agent:', '')
    : undefined;

  return {
    id: issue.number.toString(),
    kind: 'task',
    title: issue.title,
    description: issue.body || undefined,
    state: mapGitHubState(issue.state),
    priority: extractPriorityFromLabels(issue.labels),
    assignee: issue.assignee?.login,
    agent: agent,  // 🆕 Extract from agent:* label
    labels: mapGitHubLabelsToWorkLabels(issue.labels)
      .filter((l) => !l.startsWith('agent:')),  // 🆕 Remove agent: from labels
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at || undefined,
  };
}
```

**Why**: GitHub adapter must read agent from `agent:*` label and hide from labels array

---

### Step 13: Map agent in GitHub adapter (write)

**File**: `src/adapters/github/mapper.ts`
**Lines**: 30-53
**Action**: UPDATE

**Current code:**
```typescript
export function workItemToGitHubIssue(request: CreateWorkItemRequest) {
  const result: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  } = {
    title: request.title,
  };

  if (request.description) {
    result.body = request.description;
  }

  const labels = [...(request.labels || [])];
  if (request.priority) {
    labels.push(`priority:${request.priority}`);
  }
  if (labels.length > 0) {
    result.labels = labels;
  }

  if (request.assignee) {
    result.assignees = [request.assignee];
  }

  return result;
}
```

**Required change:**
```typescript
export function workItemToGitHubIssue(request: CreateWorkItemRequest) {
  const result: {
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  } = {
    title: request.title,
  };

  if (request.description) {
    result.body = request.description;
  }

  const labels = [...(request.labels || [])];
  if (request.priority) {
    labels.push(`priority:${request.priority}`);
  }
  if (request.agent) {
    labels.push(`agent:${request.agent}`);  // 🆕 Store agent as label
  }
  if (labels.length > 0) {
    result.labels = labels;
  }

  if (request.assignee) {
    result.assignees = [request.assignee];
  }

  return result;
}
```

**Why**: GitHub adapter must store agent as `agent:*` label for persistence

---

### Step 14: Add agent to unit test fixtures

**File**: `tests/unit/types/work-item.test.ts`
**Lines**: 30-41
**Action**: UPDATE

**Current code:**
```typescript
it('should create a valid WorkItem object', () => {
  const workItem: WorkItem = {
    id: 'TASK-001',
    kind: 'task',
    title: 'Test Work Item',
    description: 'Test Description',
    state: 'new',
    priority: 'high',
    assignee: 'testuser',
    labels: ['label1', 'label2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  expect(workItem.id).toBe('TASK-001');
  expect(workItem.assignee).toBe('testuser');
});
```

**Required change:**
```typescript
it('should create a valid WorkItem object', () => {
  const workItem: WorkItem = {
    id: 'TASK-001',
    kind: 'task',
    title: 'Test Work Item',
    description: 'Test Description',
    state: 'new',
    priority: 'high',
    assignee: 'testuser',
    agent: 'test-agent',  // 🆕 Include agent in fixture
    labels: ['label1', 'label2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  expect(workItem.id).toBe('TASK-001');
  expect(workItem.assignee).toBe('testuser');
  expect(workItem.agent).toBe('test-agent');  // 🆕 Verify agent
});
```

**Why**: Unit tests must validate agent field exists and behaves correctly

---

### Step 15: Add query engine tests for agent

**File**: `tests/unit/core/query.test.ts`
**Action**: UPDATE (add new test cases)

**Required change:**
```typescript
describe('Query engine - agent field', () => {
  const items: WorkItem[] = [
    {
      id: 'TASK-001',
      kind: 'task',
      title: 'Task 1',
      state: 'new',
      priority: 'high',
      assignee: 'human',
      agent: 'code-reviewer',
      labels: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'TASK-002',
      kind: 'task',
      title: 'Task 2',
      state: 'new',
      priority: 'medium',
      assignee: 'human2',
      labels: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('should filter by agent', () => {
    const result = executeQuery(items, 'agent=code-reviewer');
    expect(result.length).toBe(1);
    expect(result[0].agent).toBe('code-reviewer');
  });

  it('should handle agent is null', () => {
    const result = executeQuery(items, 'agent is null');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('TASK-002');
  });

  it('should combine agent and assignee filters', () => {
    const result = executeQuery(items, 'agent=code-reviewer and assignee=human');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('TASK-001');
  });
});
```

**Why**: Query filtering by agent must be tested

---

### Step 16: Add integration test for create with agent

**File**: `tests/integration/cli/commands/create.test.ts`
**Action**: UPDATE (add new test case)

**Required change:**
```typescript
it('should create work item with agent', () => {
  const result = execSync(
    `node ${binPath} create "Test task" --agent code-reviewer`,
    { encoding: 'utf8', cwd: testDir }
  );

  expect(result).toContain('Created task TASK-001');
  
  const getResult = execSync(`node ${binPath} get TASK-001`, {
    encoding: 'utf8',
    cwd: testDir,
  });
  
  expect(getResult).toContain('Agent:');
  expect(getResult).toContain('code-reviewer');
});

it('should create work item with both assignee and agent', () => {
  const result = execSync(
    `node ${binPath} create "Team task" --assignee john --agent code-reviewer`,
    { encoding: 'utf8', cwd: testDir }
  );

  expect(result).toContain('Created task TASK-001');
  
  const getResult = execSync(`node ${binPath} get TASK-001`, {
    encoding: 'utf8',
    cwd: testDir,
  });
  
  expect(getResult).toContain('Assignee:');
  expect(getResult).toContain('john');
  expect(getResult).toContain('Agent:');
  expect(getResult).toContain('code-reviewer');
});
```

**Why**: CLI integration must verify agent flag works end-to-end

---

### Step 17: Add integration test for set agent

**File**: `tests/integration/cli/commands/set.test.ts`
**Action**: UPDATE (add new test case)

**Required change:**
```typescript
it('should update agent', () => {
  execSync(`node ${binPath} create "Test task"`, { cwd: testDir, stdio: 'pipe' });
  
  const result = execSync(`node ${binPath} set TASK-001 --agent code-reviewer`, {
    encoding: 'utf8',
    cwd: testDir,
  });

  expect(result).toContain('Updated task TASK-001');
  expect(result).toContain('Agent: code-reviewer');
});

it('should change agent', () => {
  execSync(`node ${binPath} create "Test task" --agent old-agent`, {
    cwd: testDir,
    stdio: 'pipe',
  });
  
  const result = execSync(`node ${binPath} set TASK-001 --agent new-agent`, {
    encoding: 'utf8',
    cwd: testDir,
  });

  expect(result).toContain('Agent: new-agent');
});
```

**Why**: Agent updates must be tested

---

### Step 18: Add integration test for unset agent

**File**: `tests/integration/cli/commands/unset.test.ts`
**Action**: UPDATE (add new test case)

**Required change:**
```typescript
it('should clear agent field', () => {
  execSync(`node ${binPath} create "Test task" --agent code-reviewer`, {
    cwd: testDir,
    stdio: 'pipe',
  });
  
  const result = execSync(`node ${binPath} unset TASK-001 agent`, {
    encoding: 'utf8',
    cwd: testDir,
  });

  expect(result).toContain('Cleared agent from task TASK-001');
  
  const getResult = execSync(`node ${binPath} get TASK-001`, {
    encoding: 'utf8',
    cwd: testDir,
  });
  
  expect(getResult).toContain('Agent:       None');
});
```

**Why**: Agent clearing must be tested

---

### Step 19: Add GitHub adapter integration tests

**File**: `tests/integration/adapters/github/github-adapter.test.ts`
**Action**: UPDATE (add new test cases)

**Required change:**
```typescript
it.skipIf(skipTests)('should create issue with agent', async () => {
  const adapter = new GitHubAdapter(context);
  
  const workItem = await adapter.createWorkItem({
    title: 'Test with agent',
    kind: 'task',
    agent: 'code-reviewer',
  });

  expect(workItem.agent).toBe('code-reviewer');
  
  // Verify GitHub issue has agent: label
  const issue = await gh.rest.issues.get({
    owner: 'tbrandenburg',
    repo: 'work',
    issue_number: parseInt(workItem.id),
  });
  
  expect(issue.data.labels.some((l) => 
    (typeof l === 'string' ? l : l.name) === 'agent:code-reviewer'
  )).toBe(true);
  
  // Cleanup
  await adapter.deleteWorkItem(workItem.id);
});

it.skipIf(skipTests)('should update issue agent', async () => {
  const adapter = new GitHubAdapter(context);
  
  const created = await adapter.createWorkItem({
    title: 'Test update agent',
    kind: 'task',
  });
  
  const updated = await adapter.updateWorkItem(created.id, {
    agent: 'test-agent',
  });
  
  expect(updated.agent).toBe('test-agent');
  
  // Cleanup
  await adapter.deleteWorkItem(created.id);
});

it.skipIf(skipTests)('should read agent from label', async () => {
  const adapter = new GitHubAdapter(context);
  
  // Create issue with agent label directly via GitHub API
  const issue = await gh.rest.issues.create({
    owner: 'tbrandenburg',
    repo: 'work',
    title: 'Test read agent',
    labels: ['agent:code-reviewer'],
  });
  
  const workItem = await adapter.getWorkItem(issue.data.number.toString());
  
  expect(workItem.agent).toBe('code-reviewer');
  expect(workItem.labels).not.toContain('agent:code-reviewer');
  
  // Cleanup
  await adapter.deleteWorkItem(workItem.id);
});
```

**Why**: GitHub adapter label mapping must be tested end-to-end

---

### Step 20: Update documentation

**File**: `README.md`
**Action**: UPDATE (add agent examples)

**Required change:**
Add section after assignee examples:
```markdown
### Agent Assignment

Assign work to AI agents or automation:

```bash
# Create with agent
work create "Review code" --agent code-reviewer

# Both human and agent
work create "Deploy feature" --assignee john --agent deployment-bot

# Update agent
work set TASK-001 --agent test-writer

# Clear agent
work unset TASK-001 agent

# Query by agent
work list where agent=code-reviewer
work list where agent is null
```
```

**Why**: Users need documentation for new agent feature

---

## Patterns to Follow

**From codebase - mirror these exactly:**

### Type Definition Pattern
```typescript
// SOURCE: src/types/work-item.ts:27
// Pattern: Optional string field with undefined union
readonly assignee?: string | undefined;

// APPLY TO:
readonly agent?: string | undefined;
```

### CLI Flag Pattern
```typescript
// SOURCE: src/cli/commands/create.ts:40-43
// Pattern: Simple string flag with description
assignee: Flags.string({
  char: 'a',
  description: 'assignee username',
}),

// APPLY TO:
agent: Flags.string({
  description: 'AI agent or automation assignee',
}),
```

### Query Engine Pattern
```typescript
// SOURCE: src/core/query.ts:461
// Pattern: Return empty string for undefined values
case 'assignee':
  return item.assignee || '';

// APPLY TO:
case 'agent':
  return item.agent || '';
```

### Update Request Pattern
```typescript
// SOURCE: src/adapters/local-fs/index.ts:87
// Pattern: Nullish coalescing for optional updates
assignee: request.assignee ?? existing.assignee,

// APPLY TO:
agent: request.agent ?? existing.agent,
```

### Display Pattern
```typescript
// SOURCE: src/cli/commands/get.ts:48
// Pattern: Show field with fallback text
this.log(`Assignee:    ${workItem.assignee || 'Unassigned'}`);

// APPLY TO:
this.log(`Agent:       ${workItem.agent || 'None'}`);
```

---

## Edge Cases & Risks

| Risk/Edge Case                           | Mitigation                                                                                       |
|------------------------------------------|--------------------------------------------------------------------------------------------------|
| GitHub backward compatibility            | Map agent:* labels to agent field on read, write back as labels - seamless migration            |
| Existing issues with agent: labels       | Auto-migration: GitHub adapter detects agent:* and populates agent field, no data loss          |
| Agent doesn't exist in notify targets    | Phase 2 feature (validation) - Phase 1 accepts any string like assignee does                    |
| Empty string vs undefined for agent      | Use undefined consistently (like assignee), empty string in --agent "" clears field in set.ts   |
| Query engine null handling               | Follow assignee pattern: `agent is null` matches undefined/null, `agent=''` matches empty       |
| Local-FS frontmatter with undefined      | YAML omits undefined fields naturally, reads back as undefined                                  |
| GitHub labels array vs agent field mismatch | Remove agent:* from labels array after extraction to avoid duplication                       |
| Test fixtures missing agent              | Not breaking - agent is optional, but should add to key tests for coverage                      |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests (fast iteration)
npm run test:unit

# Full test suite
npm test

# Coverage check (must maintain >60%)
npm test -- --coverage
```

### Manual Verification

1. **Create with agent**: `work create "Task" --agent code-reviewer` → `work get TASK-001` shows Agent: code-reviewer
2. **Update agent**: `work set TASK-001 --agent new-agent` → Agent changes
3. **Clear agent**: `work unset TASK-001 agent` → Agent shows "None"
4. **Query by agent**: `work list where agent=code-reviewer` → Filters correctly
5. **GitHub persistence**: Create/update via GitHub context → Verify `agent:*` label on GitHub issue
6. **Local-FS persistence**: Check `.work/tasks/TASK-*.md` frontmatter includes `agent: X`
7. **Mixed assignee+agent**: `work create "Task" --assignee human --agent bot` → Both display correctly
8. **No regression**: Existing assignee workflows continue working

---

## Scope Boundaries

**IN SCOPE:**
- Add `agent?: string` field to WorkItem type and requests
- CLI flags: `--agent` for create/set, `agent` for unset
- Query engine: `where agent=X`, `where agent is null`
- Local-FS adapter: Store agent in frontmatter
- GitHub adapter: Map agent ↔ `agent:*` label
- Display agent in get/list output
- Unit/integration/e2e tests for agent field
- Basic README examples

**OUT OF SCOPE (future work):**
- Agent validation (Phase 2)
- Agent auto-routing in notify (Phase 3)
- Agent capabilities/skills (Phase 4)
- Jira/Linear/ADO adapter support (add when adapters implemented)
- Agent autocomplete (Phase 2)
- Agent status tracking (Phase 3)
- Breaking changes to existing label-based workflows (maintain backward compatibility)

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-07T20:01:37.505Z
- **Artifact**: `.claude/PRPs/issues/issue-1572.md`
- **Estimated effort**: 1-2 weeks (20 file changes, comprehensive testing)
- **Dependencies**: None - independent feature
- **Related issues**: #1566 (assignee field - parallel implementation)
