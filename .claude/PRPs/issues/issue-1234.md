# Investigation: Make WHERE clause optional in 'work notify send' for consistency with 'work list'

**Issue**: #1234 (https://github.com/tbrandenburg/work/issues/1234)
**Type**: ENHANCEMENT
**Investigated**: 2026-02-03T07:49:05.684Z

### Assessment

| Metric     | Value  | Reasoning                                                                                                                                           |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority   | MEDIUM | Improves developer experience and consistency across CLI commands, but not blocking any work - addresses usability gap in existing functionality  |
| Complexity | LOW    | Single file change (send.ts), no architectural changes, reuses existing engine capabilities, follows established pattern from list.ts             |
| Confidence | HIGH   | Clear requirement, existing pattern to follow in list.ts, engine already supports undefined queryString, minimal risk of side effects             |

---

## Problem Statement

The `work notify send` command currently requires a WHERE clause or message/ID, while `work list` allows listing all items without filters. This inconsistency creates confusion and makes it cumbersome to send notifications for all work items at once.

---

## Analysis

### Root Cause / Change Rationale

**Current Design**: The notify send command was built with strict argument validation requiring minimum 3 arguments, preventing the `work notify send to <target>` syntax.

**Evidence Chain**:

WHY: Cannot send notifications for all items without filtering
↓ BECAUSE: Parser validation requires at least 3 arguments
Evidence: `src/cli/commands/notify/send.ts:29-33`
```typescript
if (args.length < 3) {
  this.error(
    'Invalid syntax. Use: work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
  );
}
```

↓ BECAUSE: Parser expects WHERE/message/ID as first argument, doesn't handle "to" as first arg
Evidence: `src/cli/commands/notify/send.ts:46-100`
```typescript
if (args[0] === 'where') {
  // Full syntax: where <query> to <target>
  // ...
} else if (args[1] === 'to') {
  // Message or shorthand syntax
  // ...
} else {
  this.error('Invalid syntax...');
}
```

↓ ROOT CAUSE: Manual argv parsing doesn't handle optional WHERE clause pattern
Evidence: `src/cli/commands/notify/send.ts:24-27` - uses manual argv parsing instead of oclif Args pattern like list.ts does

**Solution Rationale**: 
- Engine already supports `listWorkItems(undefined)` (line 292-297 in engine.ts)
- List command demonstrates the pattern with optional args (list.ts:15-24, 41-55)
- No new syntax needed, just allow existing WHERE clause to be optional
- Maintains backward compatibility with all three existing syntaxes

### Affected Files

| File                                         | Lines  | Action | Description                                    |
| -------------------------------------------- | ------ | ------ | ---------------------------------------------- |
| `src/cli/commands/notify/send.ts`            | 29-100 | UPDATE | Refactor argument parsing to handle optional WHERE |
| `tests/integration/cli/commands/notify/send.test.ts` | END    | UPDATE | Add test for "all items" syntax                |

### Integration Points

- **Engine**: `engine.listWorkItems(query)` at line 121 - already handles undefined
- **Engine**: `engine.sendNotification(workItems, target)` at line 124 - unchanged
- **Engine**: `engine.sendPlainNotification(message, target)` at line 107 - unchanged
- **No breaking changes**: All three existing syntaxes continue to work

### Git History

- **Introduced**: 3ce3527 - 2026-01-24 - "feat: Implement notification system with context persistence (#28)"
- **Enhanced**: 5286d8f - 2026-02-01 - "Fix: Add shorthand syntax support for notify send (#853) (#857)"
- **Enhanced**: b507448 - 2026-02-02 - "feat(notify): Add support for sending plain text messages (#929)"
- **Implication**: Recent feature additions, no legacy constraints - good time to add consistency

---

## Implementation Plan

### Step 1: Refactor argument parsing to handle "to <target>" syntax

**File**: `src/cli/commands/notify/send.ts`
**Lines**: 29-100
**Action**: UPDATE

**Current code:**

```typescript
// Lines 29-33
if (args.length < 3) {
  this.error(
    'Invalid syntax. Use: work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
  );
}

let message: string | null = null;
let query: string | null = null;
let target: string;

// Lines 46-100
if (args[0] === 'where') {
  // Full syntax: where <query> to <target>
  if (args.length < 4) {
    this.error('Expected: work notify send where <query> to <target>');
  }

  const toIndex = args.indexOf('to');
  if (toIndex === -1) {
    this.error('Expected "to" keyword before target name');
  }

  query = args.slice(1, toIndex).join(' ');
  target = args.slice(toIndex + 1).join(' ');

  if (!query || !target) {
    this.error('Expected: work notify send where <query> to <target>');
  }
} else if (args[1] === 'to') {
  // Message or shorthand syntax
  if (args[0]?.includes(' ') || args[0]?.includes('\n')) {
    message = args[0] || '';
    target = args.slice(2).join(' ');
    
    if (!target) {
      this.error('Expected target name after "to"');
    }
    
    if (!message || !message.trim()) {
      this.error('Message cannot be empty');
    }
  } else {
    // Shorthand syntax: <id> to <target>
    if (!args[0]) {
      this.error('Task ID cannot be empty');
    }
    
    query = `id=${args[0]}`;
    target = args.slice(2).join(' ');

    if (!target) {
      this.error('Expected target name after "to"');
    }
  }
} else {
  this.error(
    'Invalid syntax. Use: work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
  );
}
```

**Required change:**

```typescript
// Lines 29-33 - Update minimum args check
if (args.length < 2) {
  this.error(
    'Invalid syntax. Use: work notify send to <target> OR work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
  );
}

let message: string | null = null;
let query: string | null = null;
let target: string;

// Lines 46-100 - Add handling for "to <target>" as first pattern
if (args[0] === 'to') {
  // NEW: All items syntax: work notify send to <target>
  target = args.slice(1).join(' ');
  
  if (!target) {
    this.error('Expected target name after "to"');
  }
  
  // query remains null - will send all items
} else if (args[0] === 'where') {
  // Full syntax: where <query> to <target>
  if (args.length < 4) {
    this.error('Expected: work notify send where <query> to <target>');
  }

  const toIndex = args.indexOf('to');
  if (toIndex === -1) {
    this.error('Expected "to" keyword before target name');
  }

  query = args.slice(1, toIndex).join(' ');
  target = args.slice(toIndex + 1).join(' ');

  if (!query || !target) {
    this.error('Expected: work notify send where <query> to <target>');
  }
} else if (args[1] === 'to') {
  // Message or shorthand syntax
  if (args[0]?.includes(' ') || args[0]?.includes('\n')) {
    message = args[0] || '';
    target = args.slice(2).join(' ');
    
    if (!target) {
      this.error('Expected target name after "to"');
    }
    
    if (!message || !message.trim()) {
      this.error('Message cannot be empty');
    }
  } else {
    // Shorthand syntax: <id> to <target>
    if (!args[0]) {
      this.error('Task ID cannot be empty');
    }
    
    query = `id=${args[0]}`;
    target = args.slice(2).join(' ');

    if (!target) {
      this.error('Expected target name after "to"');
    }
  }
} else {
  this.error(
    'Invalid syntax. Use: work notify send to <target> OR work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
  );
}
```

**Why**: This adds the "all items" pattern by checking for `args[0] === 'to'` before other patterns, leaving `query` as null which the engine already handles correctly.

---

### Step 2: Update examples to include new syntax

**File**: `src/cli/commands/notify/send.ts`
**Lines**: 9-15
**Action**: UPDATE

**Current code:**

```typescript
static override examples = [
  '<%= config.bin %> notify <%= command.id %> "This is a multi-line\nstatus update" to alerts',
  '<%= config.bin %> notify <%= command.id %> TASK-001 to alerts',
  '<%= config.bin %> notify <%= command.id %> where state=new to alerts',
  '<%= config.bin %> notify <%= command.id %> where priority=high to team-notifications',
  '<%= config.bin %> notify <%= command.id %> where assignee=human-alice to human-alerts',
];
```

**Required change:**

```typescript
static override examples = [
  '<%= config.bin %> notify <%= command.id %> to alerts',
  '<%= config.bin %> notify <%= command.id %> "This is a multi-line\nstatus update" to alerts',
  '<%= config.bin %> notify <%= command.id %> TASK-001 to alerts',
  '<%= config.bin %> notify <%= command.id %> where state=new to alerts',
  '<%= config.bin %> notify <%= command.id %> where priority=high to team-notifications',
  '<%= config.bin %> notify <%= command.id %> where assignee=human-alice to human-alerts',
];
```

**Why**: Add the new "all items" syntax as the first example to highlight the feature.

---

### Step 3: Update engine call to handle null query

**File**: `src/cli/commands/notify/send.ts`
**Lines**: 119-121
**Action**: UPDATE

**Current code:**

```typescript
} else {
  // Execute query to get work items
  const workItems = await engine.listWorkItems(query!);
```

**Required change:**

```typescript
} else {
  // Execute query to get work items (undefined = all items)
  const workItems = await engine.listWorkItems(query || undefined);
```

**Why**: Pass `undefined` explicitly when query is null to match the engine's signature and list.ts pattern (line 57). Removes non-null assertion operator.

---

### Step 4: Add test for new "all items" syntax

**File**: `tests/integration/cli/commands/notify/send.test.ts`
**Lines**: After line 61 (before closing brace)
**Action**: UPDATE

**Test case to add:**

```typescript
it('should support sending all items without WHERE clause', () => {
  const binPath = join(originalCwd, 'bin/run.js');
  
  // Create a test work item
  execSync(
    `node ${binPath} create task "Test item" --context default`,
    { stdio: 'pipe' }
  );
  
  // Configure a notification target (alerts)
  execSync(
    `mkdir -p ${testDir}/.work/projects/default`,
    { stdio: 'pipe' }
  );
  
  execSync(
    `echo '{"targets":{"alerts":{"type":"console","enabled":true}}}' > ${testDir}/.work/projects/default/notifications.json`,
    { stdio: 'pipe' }
  );
  
  // Should not throw - sends all items to alerts
  const output = execSync(
    `node ${binPath} notify send to alerts`,
    { encoding: 'utf8' }
  );
  
  expect(output).toContain('Notification sent successfully');
  expect(output).toContain('alerts');
});
```

**Why**: Validates that the new syntax works end-to-end, mirroring the pattern from list.ts behavior.

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/cli/commands/list.ts:41-57
// Pattern for handling optional WHERE clause with undefined
let whereClause: string | undefined;

// Handle new positional syntax: work list where "query"
if (args.subcommand === 'where') {
  if (!args.query) {
    this.error('Query expression required after "where"');
  }
  whereClause = args.query;
} else if (args.subcommand && !args.query) {
  // Handle case where query is provided as first arg without "where"
  whereClause = args.subcommand;
} else if (flags.where) {
  // Backward compatibility with --where flag
  whereClause = flags.where;
}

const workItems = await engine.listWorkItems(whereClause); // ← undefined OK
```

**Key principle**: Let the variable remain undefined when no filter is provided, the engine handles it.

---

## Edge Cases & Risks

| Risk/Edge Case                                | Mitigation                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Empty target name (`work notify send to`)    | Existing validation catches this: "Expected target name after 'to'"              |
| Breaking existing syntaxes                    | New check comes BEFORE existing ones, doesn't interfere                          |
| Large number of items to notify               | Engine already handles this (no pagination), user responsibility to filter       |
| Confusion with message syntax                 | Message syntax requires content before "to", different parse path                |

---

## Validation

### Automated Checks

```bash
npm run type-check
npm test -- tests/integration/cli/commands/notify/send.test.ts
npm run lint
```

### Manual Verification

1. **Test new syntax**: `work notify send to alerts` (should send all items)
2. **Test backward compatibility**:
   - `work notify send "message" to alerts` (plain message)
   - `work notify send TASK-001 to alerts` (single item)
   - `work notify send where state=new to alerts` (filtered query)
3. **Verify help text**: `work notify send --help` (should show new example)
4. **Compare with list**: `work list` and `work notify send to alerts` should query same items

---

## Scope Boundaries

**IN SCOPE:**

- Add support for `work notify send to <target>` without WHERE clause
- Update argument parsing to check for "to" as first argument
- Update examples to demonstrate new syntax
- Add integration test for new syntax
- Maintain backward compatibility with all three existing syntaxes

**OUT OF SCOPE (do not touch):**

- Changes to engine.listWorkItems() (already supports undefined)
- Changes to sendNotification() or sendPlainNotification() methods
- Refactoring to oclif Args pattern (could be future improvement)
- Adding pagination or limiting for large result sets
- Changes to other notify subcommands (list, configure)
- Changes to notification target configuration

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-03T07:49:05.684Z
- **Artifact**: `.claude/PRPs/issues/issue-1234.md`
