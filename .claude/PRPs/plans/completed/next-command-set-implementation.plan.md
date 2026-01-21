# Feature: Next Command Set Implementation

## Summary

Implement the next set of work CLI commands including core lifecycle (reopen), context management (show/remove), attribute management (edit/unset), relations (unlink), and advanced operations (move/comment/delete). This builds on the existing oclif-based command structure and WorkEngine patterns to complete the core command set before tackling complex query syntax and notification systems.

## User Story

As a work CLI user
I want to access the complete set of core commands (reopen, context show/remove, edit/unset, unlink, move/comment/delete)
So that I can manage work items and contexts with full lifecycle control and advanced operations

## Problem Statement

The work CLI currently implements only 11 of the 31 specified commands. Users need access to the remaining core commands to complete basic workflows like reopening closed items, managing contexts, editing work items, and performing advanced operations like moving items between contexts.

## Solution Statement

Implement 9 additional commands following the established oclif patterns, WorkEngine integration, and existing error handling conventions. Each command will mirror the structure of existing commands while adding new capabilities to the WorkEngine and adapter interfaces as needed.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                    |
| Complexity             | MEDIUM                                            |
| Systems Affected       | CLI commands, WorkEngine, adapters, types        |
| Dependencies           | @oclif/core@4.0.0, existing WorkEngine           |
| Estimated Tasks        | 13                                                |
| **Research Timestamp** | **2026-01-21T07:47:52.523+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   User      │ ──────► │ Limited     │ ──────► │ Basic       │            ║
║   │   Command   │         │ Commands    │         │ Operations  │            ║
║   └─────────────┘         │ (11/31)     │         │ Only        │            ║
║                           └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: create → start → close (no reopen, limited context mgmt)        ║
║   PAIN_POINT: Cannot reopen closed items, limited context operations         ║
║   DATA_FLOW: WorkEngine → LocalFsAdapter → filesystem storage                ║
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
║   │   User      │ ──────► │ Complete    │ ──────► │ Full        │            ║
║   │   Command   │         │ Command Set │         │ Lifecycle   │            ║
║   └─────────────┘         │ (20/31)     │         │ Control     │            ║
║                           └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ Advanced    │  ◄── reopen, edit, move, delete     ║
║                          │ Operations  │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: create → start → close → reopen, full context mgmt              ║
║   VALUE_ADD: Complete work item lifecycle, advanced context operations       ║
║   DATA_FLOW: Enhanced WorkEngine → Extended adapters → rich storage          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `work reopen` | Command not found | Transitions closed → active | Can recover from premature closure |
| `work context show` | Command not found | Displays context details | Can inspect context configuration |
| `work edit` | Must use `work set` | Direct field editing | More intuitive editing interface |
| `work move` | Manual recreation | Cross-context transfer | Seamless context migration |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/cli/commands/start.ts` | 1-35 | State transition pattern to MIRROR exactly |
| P0 | `src/cli/commands/close.ts` | 1-35 | State transition pattern to MIRROR exactly |
| P1 | `src/cli/commands/set.ts` | 1-80 | Update pattern with flags to FOLLOW |
| P1 | `src/cli/commands/context/add.ts` | 1-60 | Context command pattern to MIRROR |
| P1 | `src/cli/commands/link.ts` | 1-50 | Relation handling pattern to FOLLOW |
| P2 | `src/types/work-item.ts` | 1-60 | Types to IMPORT and extend |
| P2 | `src/types/errors.ts` | 1-50 | Error patterns to FOLLOW |
| P2 | `tests/unit/core/engine.test.ts` | 1-30 | Test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [oclif Core v4.0](https://oclif.io/docs/commands/) ✓ Current | Command patterns | Command structure and error handling | 2026-01-21T07:47:52Z |

---

## Patterns to Mirror

**COMMAND_STRUCTURE:**
```typescript
// SOURCE: src/cli/commands/start.ts:1-15
// COPY THIS PATTERN:
import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';

export default class Start extends Command {
  static override args = {
    id: Args.string({ 
      description: 'work item ID to start',
      required: true,
    }),
  };

  static override description = 'Start working on a work item (change state to active)';
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/cli/commands/start.ts:25-35
// COPY THIS PATTERN:
try {
  const workItem = await engine.changeState(args.id, 'active');
  this.log(`Started ${workItem.kind} ${workItem.id}: ${workItem.title}`);
} catch (error) {
  this.error(`Failed to start work item: ${(error as Error).message}`);
}
```

**FLAGS_PATTERN:**
```typescript
// SOURCE: src/cli/commands/set.ts:15-35
// COPY THIS PATTERN:
static override flags = {
  title: Flags.string({
    description: 'update work item title',
  }),
  priority: Flags.string({
    description: 'update work item priority',
    options: ['low', 'medium', 'high', 'critical'],
  }),
};
```

**CONTEXT_COMMAND_PATTERN:**
```typescript
// SOURCE: src/cli/commands/context/add.ts:1-20
// COPY THIS PATTERN:
import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { Context } from '../../../types/index.js';

export default class ContextAdd extends Command {
  static override args = {
    name: Args.string({ 
      description: 'context name',
      required: true,
    }),
  };
```

**ENGINE_USAGE:**
```typescript
// SOURCE: src/cli/commands/create.ts:45-55
// COPY THIS PATTERN:
const engine = new WorkEngine();
try {
  const workItem = await engine.createWorkItem({
    title: args.title,
    kind: flags.kind as WorkItemKind,
    // ... other properties
  });
  this.log(`Created ${workItem.kind} ${workItem.id}: ${workItem.title}`);
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/unit/core/engine.test.ts:1-25
// COPY THIS PATTERN:
import { WorkEngine } from '../../../src/core/engine';
import { LocalFsAdapter } from '../../../src/adapters/local-fs/index';

describe('WorkEngine', () => {
  let engine: WorkEngine;
  let mockAdapter: jest.Mocked<LocalFsAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdapter = {
      initialize: jest.fn(),
      // ... other mocked methods
    } as any;
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**
- [x] Current OWASP recommendations followed
- [x] Recent CVE advisories checked  
- [x] Authentication patterns up-to-date
- [x] Data validation follows current standards

**Performance (Web Intelligence Verified):**
- [x] Current optimization techniques applied
- [x] Recent benchmarks considered
- [x] Database patterns follow current best practices
- [x] Caching strategies align with current recommendations

**Community Intelligence:**
- [x] Recent Stack Overflow solutions reviewed
- [x] Framework maintainer recommendations followed
- [x] No deprecated patterns detected in community discussions
- [x] Current testing approaches validated

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/cli/commands/reopen.ts` | CREATE | Core lifecycle command - mirrors start.ts/close.ts |
| `src/cli/commands/context/show.ts` | CREATE | Context management - mirrors context/list.ts |
| `src/cli/commands/context/remove.ts` | CREATE | Context management - mirrors context/add.ts |
| `src/cli/commands/edit.ts` | CREATE | Attribute management - enhanced version of set.ts |
| `src/cli/commands/unset.ts` | CREATE | Attribute management - complement to set.ts |
| `src/cli/commands/unlink.ts` | CREATE | Relations - inverse of link.ts |
| `src/cli/commands/move.ts` | CREATE | Advanced operation - new capability |
| `src/cli/commands/comment.ts` | CREATE | Advanced operation - new capability |
| `src/cli/commands/delete.ts` | CREATE | Advanced operation - new capability |
| `src/cli/commands/index.ts` | UPDATE | Add exports for new commands |
| `src/core/engine.ts` | UPDATE | Add removeContext, deleteWorkItem, addComment methods |
| `src/types/work-item.ts` | UPDATE | Add Comment interface if needed |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Full where-clause query syntax** - Complex query parsing deferred to later phase
- **Schema discovery system** - Complete schema commands deferred to later phase  
- **Notification system** - All notify commands deferred to later phase
- **Authentication system** - Auth commands deferred to later phase
- **Multi-adapter support** - Focus on local-fs adapter only
- **Interactive editing** - Command-line flags only, no $EDITOR integration

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled using `npm test -- --coverage`.

**Coverage Target**: MVP 30% (intermediate step toward 40%, current: 20%)

### Task 0: UPDATE `jest.config.js` (increase coverage threshold)

- **ACTION**: UPDATE test coverage threshold from 20% to 30%
- **IMPLEMENT**: Change coverageThreshold.global values from 20 to 30
- **MIRROR**: `jest.config.js:25-35` - follow existing threshold structure
- **RATIONALE**: Prepare for MVP milestone with intermediate coverage target
- **GOTCHA**: Ensure current tests still pass at new threshold
- **VALIDATE**: `npm test -- --coverage`
- **FUNCTIONAL**: Verify coverage report shows 30% threshold requirement
- **TEST_PYRAMID**: No additional tests needed - configuration change only

### Task 2: CREATE `src/cli/commands/reopen.ts`

- **ACTION**: CREATE core lifecycle command for reopening closed work items
- **IMPLEMENT**: State transition from closed → active
- **MIRROR**: `src/cli/commands/start.ts:1-35` - identical structure, different state
- **IMPORTS**: `import { Args, Command } from '@oclif/core'`
- **ENGINE**: Use `engine.changeState(args.id, 'active')`
- **GOTCHA**: Verify work item is in 'closed' state before transition
- **CURRENT**: [oclif Core v4.0 Commands](https://oclif.io/docs/commands/) - verified current
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js reopen --help`
- **FUNCTIONAL**: `./bin/run.js create "Test task" && ./bin/run.js close TASK-001 && ./bin/run.js reopen TASK-001`
- **TEST_PYRAMID**: Add E2E test for: complete lifecycle (create → close → reopen) user journey

### Task 3: CREATE `src/cli/commands/context/show.ts`

- **ACTION**: CREATE context inspection command
- **IMPLEMENT**: Display detailed context information
- **MIRROR**: `src/cli/commands/context/list.ts:1-50` - similar structure, single context focus
- **ARGS**: Optional context name, defaults to active context
- **ENGINE**: Use `engine.getActiveContext()` or find by name
- **GOTCHA**: Handle case where no context is active
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js context show --help`
- **FUNCTIONAL**: `./bin/run.js context show`
- **TEST_PYRAMID**: Add integration test for: context resolution and display formatting

### Task 4: CREATE `src/cli/commands/context/remove.ts`

- **ACTION**: CREATE context deletion command
- **IMPLEMENT**: Remove context from engine
- **MIRROR**: `src/cli/commands/context/add.ts:1-30` - inverse operation
- **ARGS**: Required context name
- **ENGINE**: Add `removeContext(name)` method to WorkEngine
- **GOTCHA**: Prevent removal of active context without confirmation
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js context remove --help`
- **FUNCTIONAL**: `./bin/run.js context add test --tool local-fs --path /tmp && ./bin/run.js context remove test`
- **TEST_PYRAMID**: Add E2E test for: context lifecycle (add → show → remove) user journey

### Task 5: UPDATE `src/core/engine.ts` (add removeContext method)

- **ACTION**: ADD context removal capability to WorkEngine
- **IMPLEMENT**: `removeContext(name: string): void` method
- **MIRROR**: `src/core/engine.ts:45-65` - follow existing context management pattern
- **LOGIC**: Remove from contexts map, handle active context edge case
- **ERROR**: Throw ContextNotFoundError if context doesn't exist
- **GOTCHA**: If removing active context, set activeContext to null
- **VALIDATE**: `npm run type-check && npm test tests/unit/core/engine.test.ts`
- **TEST_PYRAMID**: Add integration test for: context removal with active context edge cases

### Task 6: CREATE `src/cli/commands/edit.ts`

- **ACTION**: CREATE enhanced work item editing command
- **IMPLEMENT**: Multi-field editing with --field value syntax
- **MIRROR**: `src/cli/commands/set.ts:1-80` - enhanced version with better UX
- **FLAGS**: `--title`, `--description`, `--priority`, `--assignee`
- **ENGINE**: Use existing `engine.updateWorkItem()`
- **GOTCHA**: Require at least one field to be specified
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js edit --help`
- **FUNCTIONAL**: `./bin/run.js edit TASK-001 --title "Updated title" --priority high`
- **TEST_PYRAMID**: Add integration test for: multi-field updates and validation logic

### Task 7: CREATE `src/cli/commands/unset.ts`

- **ACTION**: CREATE field clearing command
- **IMPLEMENT**: Clear optional fields (assignee, description)
- **MIRROR**: `src/cli/commands/set.ts:1-40` - simplified version for clearing
- **ARGS**: Work item ID and field name
- **ENGINE**: Use `engine.updateWorkItem()` with undefined values
- **GOTCHA**: Only allow clearing of optional fields
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js unset --help`
- **FUNCTIONAL**: `./bin/run.js unset TASK-001 assignee`
- **TEST_PYRAMID**: No additional tests needed - simple field clearing operation

### Task 8: CREATE `src/cli/commands/unlink.ts`

- **ACTION**: CREATE relation removal command
- **IMPLEMENT**: Remove relations between work items
- **MIRROR**: `src/cli/commands/link.ts:1-50` - inverse operation
- **ARGS**: from, to work item IDs
- **FLAGS**: `--type` for relation type
- **ENGINE**: Use existing `engine.deleteRelation()`
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js unlink --help`
- **FUNCTIONAL**: `./bin/run.js link TASK-001 TASK-002 --type blocks && ./bin/run.js unlink TASK-001 TASK-002 --type blocks`
- **TEST_PYRAMID**: Add E2E test for: relation lifecycle (link → unlink) user journey

### Task 9: CREATE `src/cli/commands/move.ts`

- **ACTION**: CREATE cross-context work item transfer
- **IMPLEMENT**: Move work item between contexts (placeholder for now)
- **MIRROR**: `src/cli/commands/create.ts:1-30` - similar complexity
- **ARGS**: Work item ID, target context with @context syntax
- **ENGINE**: Add `moveWorkItem()` method (basic implementation)
- **GOTCHA**: For MVP, log "Move operation not yet implemented"
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js move --help`
- **FUNCTIONAL**: `./bin/run.js move TASK-001 @other-context` (should show not implemented message)
- **TEST_PYRAMID**: No additional tests needed - placeholder implementation only

### Task 10: CREATE `src/cli/commands/comment.ts`

- **ACTION**: CREATE comment addition command
- **IMPLEMENT**: Add comments to work items (placeholder for now)
- **MIRROR**: `src/cli/commands/create.ts:1-30` - similar structure
- **ARGS**: Work item ID and comment text
- **ENGINE**: Add `addComment()` method (basic implementation)
- **GOTCHA**: For MVP, log "Comment operation not yet implemented"
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js comment --help`
- **FUNCTIONAL**: `./bin/run.js comment TASK-001 "This is a test comment"` (should show not implemented message)
- **TEST_PYRAMID**: No additional tests needed - placeholder implementation only

### Task 11: CREATE `src/cli/commands/delete.ts`

- **ACTION**: CREATE work item deletion command
- **IMPLEMENT**: Remove work items from storage
- **MIRROR**: `src/cli/commands/close.ts:1-35` - similar structure
- **ARGS**: Work item ID
- **ENGINE**: Add `deleteWorkItem()` method to WorkEngine
- **GOTCHA**: Consider confirmation prompt for destructive operation
- **VALIDATE**: `npm run type-check && npm run build && ./bin/run.js delete --help`
- **FUNCTIONAL**: `./bin/run.js create "Test delete" && ./bin/run.js delete TASK-002`
- **TEST_PYRAMID**: Add integration test for: destructive operation with proper error handling

### Task 12: UPDATE `src/core/engine.ts` (add deleteWorkItem and placeholder methods)

- **ACTION**: ADD work item deletion and placeholder methods
- **IMPLEMENT**: `deleteWorkItem(id: string): Promise<void>`, `addComment()`, `moveWorkItem()` placeholders
- **MIRROR**: `src/core/engine.ts:100-120` - follow existing method patterns
- **ADAPTER**: Use `adapter.deleteWorkItem()` (need to add to interface)
- **ERROR**: Throw WorkItemNotFoundError if item doesn't exist
- **GOTCHA**: Placeholder methods should log "not implemented" message
- **VALIDATE**: `npm run type-check && npm test tests/unit/core/engine.test.ts`
- **TEST_PYRAMID**: Add integration test for: engine-adapter interaction for delete operations

### Task 13: UPDATE `src/cli/commands/index.ts` and test coverage

- **ACTION**: ADD exports for all new commands
- **IMPLEMENT**: Export all 9 new command classes
- **MIRROR**: `src/cli/commands/index.ts:1-15` - follow existing export pattern
- **EXPORTS**: Add reopen, context/show, context/remove, edit, unset, unlink, move, comment, delete
- **VALIDATE**: `npm run type-check && npm run build && npm test -- --coverage`
- **FUNCTIONAL**: `./bin/run.js --help` (verify all commands listed)
- **TEST_PYRAMID**: Add critical user journey test for: complete work item management workflow (create → edit → link → unlink → close → reopen → delete)

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/cli/commands/reopen.test.ts` | State transition, error handling | Reopen command |
| `tests/unit/cli/commands/edit.test.ts` | Multi-field updates, validation | Edit command |
| `tests/unit/core/engine.test.ts` | New methods: removeContext, deleteWorkItem | Engine extensions |

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/integration/context-management.test.ts` | Context lifecycle, resolution, edge cases | Context show/remove operations |
| `tests/integration/work-item-editing.test.ts` | Multi-field updates, validation logic | Edit command with engine |
| `tests/integration/work-item-deletion.test.ts` | Destructive operations, error handling | Delete operations |
| `tests/integration/engine-adapter.test.ts` | Engine-adapter interaction for new methods | Core engine extensions |

### E2E Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/e2e/work-item-lifecycle.test.ts` | create → close → reopen workflow | Complete lifecycle |
| `tests/e2e/context-lifecycle.test.ts` | add → show → remove workflow | Context management |
| `tests/e2e/relation-lifecycle.test.ts` | link → unlink workflow | Relation management |
| `tests/e2e/complete-workflow.test.ts` | Full work item management journey | Critical user paths |

### Edge Cases Checklist

- [ ] Reopen non-closed work item
- [ ] Remove active context
- [ ] Edit with no fields specified
- [ ] Unset required fields
- [ ] Delete non-existent work item
- [ ] Context operations with no contexts

---

## Validation Commands

### Level 1: STATIC_ANALYSIS
```bash
npm run lint && npm run type-check
```
**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL
```bash
npm run build && ./bin/run.js --help
```
**EXPECT**: Build succeeds, all commands listed in help

### Level 3: UNIT_TESTS
```bash
npm test -- --coverage
```
**EXPECT**: All tests pass, coverage >= 30%

### Level 4: FULL_SUITE
```bash
npm test -- --coverage && npm run build
```
**EXPECT**: All tests pass, build succeeds

### Level 5: MANUAL_VALIDATION
1. Create work item: `./bin/run.js create "Test item"`
2. Close it: `./bin/run.js close TASK-001`
3. Reopen it: `./bin/run.js reopen TASK-001`
4. Edit it: `./bin/run.js edit TASK-001 --title "Updated"`
5. Show context: `./bin/run.js context show`

---

## Acceptance Criteria

- [ ] All 9 new commands implemented and functional
- [ ] Commands follow existing oclif patterns exactly
- [ ] WorkEngine extended with new methods
- [ ] Level 1-4 validation commands pass with exit 0
- [ ] Unit tests cover >= 30% of codebase (up from 20%)
- [ ] All commands appear in `work --help` output
- [ ] No regressions in existing functionality
- [ ] Move and comment commands show "not implemented" placeholder messages

---

## Completion Checklist

- [ ] All 13 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with 30% coverage
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Manual validation completed
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (oclif documentation verification)
**Web Intelligence Sources**: 1 (oclif best practices 2024)
**Last Verification**: 2026-01-21T07:47:52.523+01:00
**Security Advisories Checked**: 0 (no new dependencies)
**Deprecated Patterns Avoided**: None detected in current oclif patterns

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Command naming conflicts with existing tools | LOW | MEDIUM | Follow work CLI specification exactly |
| Context removal edge cases | MEDIUM | MEDIUM | Comprehensive validation and error handling |
| Placeholder commands confusing users | LOW | LOW | Clear "not implemented" messages with future roadmap |
| Test coverage target not met | MEDIUM | MEDIUM | Focus on core engine and command logic testing |

---

## Notes

### Current Intelligence Considerations

The oclif framework patterns remain stable in v4.0, with no breaking changes affecting command structure. The existing codebase follows current TypeScript and testing best practices. No deprecated patterns detected in the current implementation.

### Implementation Strategy

This phase focuses on completing the core command set while maintaining architectural consistency. Move and comment commands are implemented as placeholders to maintain CLI completeness while deferring complex cross-context and storage features to later phases.

### Future Considerations

The next phase should focus on enhanced query syntax, schema discovery, and notification systems. The current architecture supports these extensions without breaking changes.
