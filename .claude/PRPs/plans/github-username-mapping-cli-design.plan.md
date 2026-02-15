# Feature: Adapter-Agnostic Username Mapping CLI Design (@notation Assignment)

## Summary

Enhance the work CLI to support @notation for team member assignment that automatically resolves to adapter-specific usernames, enabling intuitive team-based assignment (@tech-lead) across all backends (local-fs, GitHub, Linear, Jira, Azure DevOps). Implementation leverages existing TeamsEngine infrastructure with adapter-specific resolution capabilities.

## User Story

As a work CLI user working with any backend (local-fs, GitHub, Linear, Jira, ADO)
I want to assign work items using team role notation (@tech-lead)
So that I can assign work intuitively without memorizing backend-specific usernames

## Problem Statement

Users must remember and type exact backend-specific usernames when assigning work items, creating cognitive friction between team mental models (@tech-lead) and technical requirements (e.g., GitHub usernames, Jira account IDs, Linear user IDs). This leads to assignment errors and lookup overhead across different backends.

## Solution Statement

Add @notation resolution in the WorkEngine layer that automatically resolves team member IDs to backend-specific usernames via existing TeamsEngine platform mappings and adapter-specific resolution methods. Each adapter implements user resolution according to its capabilities, maintaining backward compatibility with direct username assignment across all backends.

## Metadata

| Field                  | Value                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Type                   | ENHANCEMENT                                                            |
| Complexity             | MEDIUM                                                                 |
| Systems Affected       | CLI command parsing, team context, WorkAdapter interface, all adapters |
| Dependencies           | @oclif/core v4.0.0, existing TeamsEngine                               |
| Estimated Tasks        | 10                                                                     |
| **Research Timestamp** | **2025-02-13T23:15:00Z**                                               |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ User runs work create --assignee john-doe-gh (GitHub context)                 ║
║           work create --assignee john.doe@corp.com (Jira context)             ║
║           work create --assignee user-uuid-123 (Linear context)               ║
║   ↓                                                                           ║
║ Must remember exact backend-specific username format                          ║
║   ↓                                                                           ║
║ CLI → Direct username → Specific adapter → Backend API                        ║
║   ↓                                                                           ║
║ ERROR if username wrong, no team context connection                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ User runs work create --assignee @tech-lead (any context)                     ║
║   ↓                                                                           ║
║ Natural team role assignment with adapter-aware validation                   ║
║   ↓                                                                           ║
║ CLI → @notation → AssigneeResolver → Adapter.resolveAssignee() → Backend     ║
║   ↓                                                                           ║
║ Clear error messages for invalid members, successful resolution               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location               | Before                                 | After                                                    | User Impact                                |
| ---------------------- | -------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `create.ts --assignee` | Must type exact backend username       | Can use @team-member notation across all backends        | Mental model alignment with team structure |
| Error feedback         | "Assignee not found" (generic)         | "Member not found: @tech-lead" or adapter-specific error | Faster debugging and resolution            |
| Mixed assignment       | `john-gh,external-user`                | `@tech-lead,external-user` (any backend)                 | Natural mixing of team and external users  |
| Discovery              | Manual lookup in teams.xml             | `work teams resolve @tech-lead`                          | Self-service username resolution           |
| Backend flexibility    | Remember different formats per backend | Consistent @notation across all backends                 | Seamless workflow across projects          |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File                                                       | Lines     | Why Read This                                        |
| -------- | ---------------------------------------------------------- | --------- | ---------------------------------------------------- |
| P0       | `src/cli/commands/create.ts`                               | 40-43     | Current --assignee flag implementation to EXTEND     |
| P0       | `src/core/teams-engine.ts`                                 | 182-202   | getMember() pattern to MIRROR for resolution         |
| P0       | `src/types/context.ts`                                     | 52-141    | WorkAdapter interface to EXTEND with user resolution |
| P1       | `src/types/teams.ts`                                       | 43-48, 94 | PlatformMappings interface and Member types          |
| P1       | `src/types/errors.ts`                                      | 149-159   | Error class pattern to FOLLOW                        |
| P1       | `src/adapters/local-fs/index.ts`                           | 29-50     | Adapter implementation pattern to FOLLOW             |
| P2       | `src/adapters/github/index.ts`                             | 28-50     | GitHub adapter pattern for user validation           |
| P2       | `tests/integration/adapters/github/github-adapter.test.ts` | 231-241   | Test pattern for assignee functionality              |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [TypeScript Optional Methods](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties) ✓ Current | Optional interface methods | Pattern for adapter capability extension | 2025-02-13T23:10:00Z |
| [GitHub REST API](https://docs.github.com/en/rest/issues/assignees) ✓ Current | Assignee validation | GitHub adapter validation patterns | 2025-02-13T23:12:00Z |
| [Linear GraphQL API](https://developers.linear.app/docs/graphql/working-with-the-graphql-api) ✓ Current | User management | Future Linear adapter patterns | 2025-02-13T23:13:00Z |
| [Zod v4 Docs](https://zod.dev/v4/) ✓ Current | Template literal validation | @notation syntax validation patterns | 2025-02-13T23:13:00Z |

---

## Patterns to Mirror

**ADAPTER_INTERFACE_EXTENSION:**

```typescript
// SOURCE: src/types/context.ts:52-141
// EXTEND THIS PATTERN:
export interface WorkAdapter {
  // ... existing methods ...

  /**
   * Resolve @notation or team-based assignment to adapter-specific username
   * Optional method - adapters implement based on their capabilities
   */
  resolveAssignee?(notation: string): Promise<string>;

  /**
   * Validate if a username/assignee is valid for this adapter
   * Optional method - adapters implement validation logic
   */
  validateAssignee?(assignee: string): Promise<boolean>;

  /**
   * Get information about supported assignee patterns for this adapter
   * Optional method - returns help text for users
   */
  getAssigneeHelp?(): Promise<string>;
}
```

**NAMING_CONVENTION:**

```typescript
// SOURCE: src/cli/commands/create.ts:40-43
// COPY THIS PATTERN:
assignee: Flags.string({
  char: 'a',
  description: 'assignee username or @team-member (adapter-specific resolution)',
}),
```

**GENERIC_ASSIGNEE_RESOLVER:**

```typescript
// NEW SERVICE - ADAPTER-AGNOSTIC PATTERN:
export class AssigneeResolver {
  constructor(
    private adapter: WorkAdapter,
    private teamsEngine: TeamsEngine
  ) {}

  async resolveAssignee(notation: string): Promise<string> {
    // Handle special patterns
    if (notation === '@me') {
      return this.resolveCurrentUser();
    }

    // If it's @notation, resolve through teams
    if (notation.startsWith('@')) {
      const resolvedUser = await this.resolveFromTeams(notation);

      // Let adapter do final mapping if it supports it
      if (this.adapter.resolveAssignee) {
        return this.adapter.resolveAssignee(resolvedUser);
      }

      return resolvedUser;
    }

    // Direct username - validate if adapter supports it
    if (this.adapter.validateAssignee) {
      const isValid = await this.adapter.validateAssignee(notation);
      if (!isValid) {
        throw new InvalidAssigneeError(notation);
      }
    }

    return notation;
  }
}
```

**ERROR_HANDLING:**

```typescript
// SOURCE: src/types/errors.ts:149-159
// COPY THIS PATTERN:
export class MemberNotFoundError extends WorkError {
  constructor(teamName: string, memberName: string) {
    super(
      `Member not found: ${teamName}/${memberName}`,
      'MEMBER_NOT_FOUND',
      404
    );
    this.name = 'MemberNotFoundError';
  }
}
```

**TEAMS_ENGINE_LOOKUP:**

```typescript
// SOURCE: src/core/teams-engine.ts:182-202
// COPY THIS PATTERN:
async getMember(teamId: string, memberId: string): Promise<Member> {
  // Implementation mirrors existing member resolution
}
```

**PLATFORM_MAPPING_ACCESS:**

```typescript
// SOURCE: src/types/teams.ts:43-48
// COPY THIS PATTERN:
export interface PlatformMappings {
  readonly github?: string | undefined;
  readonly slack?: string | undefined;
  readonly email?: string | undefined;
  readonly teams?: string | undefined;
}
```

**CLI_FLAG_EXTENSION:**

```typescript
// SOURCE: src/cli/base-command.ts:16-23
// COPY THIS PATTERN:
static override baseFlags = {
  format: Flags.string({
    char: 'f',
    description: 'output format',
    options: ['table', 'json'],
    default: 'table',
  }),
};
```

**TEST_STRUCTURE:**

```typescript
// SOURCE: tests/integration/adapters/github/github-adapter.test.ts:231-241
// COPY THIS PATTERN:
it('should create issue with assignee (@notation)', async () => {
  const request: CreateWorkItemRequest = {
    kind: 'task',
    title: 'Test: Assignee on create',
    description: 'Testing assignee functionality',
    assignee: '@tech-lead',
  };
  const workItem = await adapter.createWorkItem(request);
  // Expected result varies by adapter:
  // GitHub: expect(workItem.assignee).toBe('senior-architect-gh');
  // Local-fs: expect(workItem.assignee).toBe('@tech-lead'); // passthrough
  // Linear: expect(workItem.assignee).toBe('user-uuid-123');
});
```

---

## Current Best Practices Validation

**Security (GitHub REST API Verified):**

- [ ] Username validation follows GitHub API patterns (verified current)
- [ ] No credential exposure (@notation resolves to public usernames)
- [ ] Input sanitization for @notation syntax prevents injection
- [ ] Teams.xml remains trusted configuration source

**Performance (Current CLI Standards):**

- [ ] Resolution adds <50ms per assignee (within CLI <500ms startup target)
- [ ] Sequential processing acceptable for typical 1-2 assignees
- [ ] File-based resolution scales to teams <100 members
- [ ] Stateless operation maintains work CLI performance model

**Community Intelligence (GitHub CLI Verified):**

- [ ] @me notation follows established GitHub CLI patterns (gh issue create --assignee @me)
- [ ] Error message clarity matches current GitHub CLI standards
- [ ] Mixed assignment patterns align with community expectations
- [ ] TypeScript strict mode patterns follow current best practices

---

## Files to Change

| File                                        | Action | Justification                                                    |
| ------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `src/types/context.ts`                      | UPDATE | Add optional user resolution methods to WorkAdapter interface    |
| `src/core/assignee-resolver.ts`             | CREATE | New generic service for @notation resolution across all adapters |
| `src/types/assignee.ts`                     | CREATE | Type definitions for assignee resolution                         |
| `src/types/errors.ts`                       | UPDATE | Add assignee-specific error classes                              |
| `src/adapters/local-fs/index.ts`            | UPDATE | Implement simple passthrough user resolution                     |
| `src/adapters/github/index.ts`              | UPDATE | Implement GitHub-specific user resolution                        |
| `src/cli/commands/create.ts`                | UPDATE | Integrate assignee resolution into create flow                   |
| `src/cli/commands/teams.ts`                 | CREATE | Add `work teams resolve` utility command                         |
| `tests/unit/core/assignee-resolver.test.ts` | CREATE | Unit tests for resolution logic                                  |
| `tests/integration/cli/assignee.test.ts`    | CREATE | Integration tests for CLI @notation flow across adapters         |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Team management features** - teams.xml remains configuration-only, no CRUD operations
- **Real-time team synchronization** - file-based configuration maintained for simplicity
- **Advanced team role permissions** - simple platform mapping without role-based access
- **Multi-repository team contexts** - single teams.xml per work CLI context
- **@notification or @mention features** - purely username resolution, no notification logic
- **Historical assignment tracking** - stateless resolution without audit trails

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled using `make ci` or `npm test -- --coverage`.

**Coverage Target**: MVP 40% (per AGENTS.md guidelines)

### Task 1: UPDATE `src/types/context.ts`

- **ACTION**: EXTEND WorkAdapter interface with optional user resolution methods
- **IMPLEMENT**: Add resolveAssignee(), validateAssignee(), getAssigneeHelp() optional methods
- **MIRROR**: `src/types/context.ts:52-141` - follow existing interface patterns
- **PATTERN**: Optional methods allow adapters to implement based on capabilities
- **GOTCHA**: Mark all new methods as optional (?) to maintain backward compatibility
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - interface definition only

### Task 2: CREATE `src/types/assignee.ts`

- **ACTION**: CREATE type definitions for adapter-agnostic assignee resolution
- **IMPLEMENT**: AssigneeNotation, AssigneeResolutionResult, ResolverOptions types
- **MIRROR**: `src/types/teams.ts:43-48` - follow interface structure patterns
- **IMPORTS**: Import base types from teams.ts and work-item.ts
- **TYPES**: Support @member, @team/member, direct username, @me patterns
- **CURRENT**: Reference to Zod v4 template literal validation patterns
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: CREATE `src/core/assignee-resolver.ts`

- **ACTION**: CREATE generic assignee resolution service compatible with all adapters
- **IMPLEMENT**: AssigneeResolver class with resolveAssignee(), parseNotation() methods
- **MIRROR**: `src/core/teams-engine.ts:182-202` - follow member lookup patterns
- **IMPORTS**: `import { TeamsEngine } from './teams-engine'`, `import { WorkAdapter } from '../types'`
- **PATTERN**: Stateless service, async resolution, adapter-aware delegation
- **GOTCHA**: Handle @me resolution, gracefully handle adapters without resolution capabilities
- **CURRENT**: Adapter-agnostic design - use optional interface methods
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: resolution logic with different adapter types

### Task 4: UPDATE `src/types/errors.ts`

- **ACTION**: ADD assignee-specific error classes to existing error definitions
- **IMPLEMENT**: AssigneeNotationError, MemberNotFoundError, AmbiguousMemberError, InvalidAssigneeError
- **MIRROR**: `src/types/errors.ts:149-159` - follow existing WorkError pattern exactly
- **PATTERN**: Extend WorkError base class, include error codes and HTTP status codes
- **CURRENT**: Current error handling best practices from TypeScript ecosystem
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - simple error class definitions

### Task 5: UPDATE `src/adapters/local-fs/index.ts`

- **ACTION**: IMPLEMENT simple passthrough user resolution for local filesystem
- **IMPLEMENT**: Add resolveAssignee(), validateAssignee(), getAssigneeHelp() methods
- **MIRROR**: `src/adapters/local-fs/index.ts:29-50` - follow existing adapter patterns
- **PATTERN**: Simple 1:1 passthrough - accepts any assignee string as-is
- **GOTCHA**: Local-fs has no user management - all assignees valid, no transformation
- **VALIDATE**: `npm run type-check && npm test -- tests/unit/adapters/local-fs`
- **TEST_PYRAMID**: Add unit test for: local-fs assignee passthrough behavior

### Task 6: UPDATE `src/adapters/github/index.ts`

- **ACTION**: IMPLEMENT GitHub-specific user resolution and validation
- **IMPLEMENT**: Add resolveAssignee(), validateAssignee(), getAssigneeHelp() methods
- **MIRROR**: `src/adapters/github/index.ts:28-50` - follow existing GitHub adapter patterns
- **PATTERN**: Use GitHub API for user validation, support @me special case
- **GOTCHA**: Handle API rate limits, authenticate user validation calls
- **VALIDATE**: `npm run type-check && npm test -- tests/unit/adapters/github`
- **TEST_PYRAMID**: Add integration test for: GitHub user validation and @me resolution

### Task 7: CREATE `tests/unit/core/assignee-resolver.test.ts`

- **ACTION**: CREATE comprehensive unit tests for adapter-agnostic AssigneeResolver service
- **IMPLEMENT**: Test all resolution patterns, error cases, adapter compatibility
- **MIRROR**: `tests/integration/adapters/github/github-adapter.test.ts:231-241` - follow test structure
- **PATTERN**: describe/it blocks, mock both TeamsEngine and different WorkAdapter types
- **CURRENT**: Test with local-fs (passthrough) and GitHub (validation) adapter scenarios
- **VALIDATE**: `npm test -- tests/unit/core/assignee-resolver.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: @notation resolution across adapter types

### Task 8: UPDATE `src/cli/commands/create.ts`

- **ACTION**: INTEGRATE adapter-aware assignee resolution into existing create command flow
- **IMPLEMENT**: Add AssigneeResolver usage with current adapter context, update flag description
- **MIRROR**: `src/cli/commands/create.ts:40-43` - extend existing --assignee flag handling
- **IMPORTS**: `import { AssigneeResolver } from '../../core/assignee-resolver'`
- **PATTERN**: Resolve assignees early in command flow, handle resolution errors gracefully
- **GOTCHA**: Maintain backward compatibility, get active adapter from engine
- **CURRENT**: oclif v4.0.0 command patterns and flag validation
- **VALIDATE**: `npm run type-check && npm run build && npm test -- --coverage`
- **FUNCTIONAL**: `./bin/run.js create --assignee @tech-lead "Test issue"` - works with any context
- **TEST_PYRAMID**: Add E2E test for: complete create command workflow with @notation across contexts

### Task 9: CREATE `src/cli/commands/teams.ts`

- **ACTION**: CREATE utility command for team member resolution and adapter-specific debugging
- **IMPLEMENT**: `work teams resolve @member`, `work teams list`, `work teams adapter-help`
- **MIRROR**: `src/cli/base-command.ts:16-23` - follow base command patterns
- **PATTERN**: Extend BaseCommand, support JSON output format, show adapter capabilities
- **CURRENT**: oclif v4.0.0 command structure and help generation
- **VALIDATE**: `npm run type-check && npm run build`
- **FUNCTIONAL**: `./bin/run.js teams resolve @tech-lead` - shows adapter-specific resolution
- **TEST_PYRAMID**: Add integration test for: teams utility commands across different adapters

### Task 10: CREATE `tests/integration/cli/assignee.test.ts`

- **ACTION**: CREATE end-to-end integration tests for @notation CLI workflow across all adapters
- **IMPLEMENT**: Test create command with @notation in local-fs and GitHub contexts, error handling
- **MIRROR**: `tests/integration/adapters/github/github-adapter.test.ts:231-241` - follow integration patterns
- **PATTERN**: Real CLI command execution, test fixtures, adapter-specific validation
- **CURRENT**: Test both local-fs (passthrough) and GitHub (API validation) scenarios
- **VALIDATE**: `npm run test:integration`
- **TEST_PYRAMID**: Add critical user journey test for: full CLI workflow from @notation to backend creation

### Task 11: UPDATE CLI help and documentation

- **ACTION**: UPDATE command help text and flag descriptions for adapter-agnostic @notation support
- **IMPLEMENT**: Enhanced --assignee flag description, adapter-specific examples, error message clarity
- **MIRROR**: Existing CLI help patterns and oclif conventions
- **PATTERN**: Clear examples for different backends, usage patterns, troubleshooting guidance
- **CURRENT**: oclif v4.0.0 help generation and formatting standards
- **VALIDATE**: `./bin/run.js create --help && ./bin/run.js teams --help`
- **FUNCTIONAL**: Verify help text explains @notation usage across different contexts
- **TEST_PYRAMID**: No additional tests needed - documentation update only

---

## Testing Strategy

### Unit Tests to Write

| Test File                                   | Test Cases                           | Validates             |
| ------------------------------------------- | ------------------------------------ | --------------------- |
| `tests/unit/core/assignee-resolver.test.ts` | @notation parsing, member resolution | Core resolution logic |
| `tests/unit/types/assignee.test.ts`         | Type validation, schema parsing      | Type definitions      |
| `tests/integration/cli/assignee.test.ts`    | CLI command flow, error handling     | End-to-end workflow   |

### Edge Cases Checklist

- [ ] Empty @notation (`@`) - should show syntax error
- [ ] Malformed @notation (`@@tech-lead`) - should show syntax error
- [ ] Non-existent member (`@invalid-member`) - should show member not found
- [ ] Member without GitHub mapping - should show platform not configured
- [ ] Ambiguous member in multiple teams - should show disambiguation options
- [ ] Mixed assignment (`@tech-lead,external-user`) - should resolve @notation, keep direct
- [ ] Special notation (@me) - should resolve to current git user
- [ ] Teams.xml missing - should gracefully fallback with clear error
- [ ] Large teams (>50 members) - should maintain performance <500ms

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && ./bin/run.js teams resolve @tech-lead
```

**EXPECT**: Build succeeds, @notation resolution works across different adapter contexts

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/core/assignee-resolver.test.ts
```

**EXPECT**: All tests pass, coverage >= 40% for new assignee resolver code

### Level 4: FULL_SUITE

```bash
npm test -- --coverage && npm run build
```

**EXPECT**: All tests pass, build succeeds, overall coverage maintained

### Level 5: INTEGRATION_VALIDATION

```bash
npm run test:integration
```

**EXPECT**: Integration tests pass, CLI @notation workflow functions end-to-end

### Level 6: CURRENT_STANDARDS_VALIDATION

Manual verification of current best practices:

- [ ] Adapter interface extension follows TypeScript optional property patterns
- [ ] Local-fs and GitHub adapter implementations match established patterns
- [ ] TypeScript strict mode compliance maintained
- [ ] Error messages follow current CLI UX conventions
- [ ] Zod validation patterns use v4 template literals correctly

### Level 7: MANUAL_VALIDATION

Step-by-step manual testing:

1. **Setup**: Ensure teams.xml contains test team with platform mappings for different backends
2. **Local-fs context**: `work context set local && work create --assignee @tech-lead "Test local assignment"`
3. **GitHub context**: `work context set github && work create --assignee @tech-lead "Test GitHub assignment"`
4. **Mixed assignment**: `work create --assignee @tech-lead,external-user "Mixed test"`
5. **Error cases**: `work create --assignee @invalid-member "Error test"`
6. **Utility commands**: `work teams resolve @tech-lead`, `work teams adapter-help`
7. **Help text**: `work create --help` shows adapter-aware @notation examples

---

## Acceptance Criteria

- [ ] @notation resolves team members to adapter-specific usernames automatically
- [ ] Backward compatibility maintained for direct username assignment across all backends
- [ ] Mixed assignment patterns work (@tech-lead,external-user) regardless of backend
- [ ] Clear error messages for invalid @notation or missing members, adapter-aware
- [ ] Special @me notation resolves to current user (adapter-specific behavior)
- [ ] Utility commands enable self-service resolution debugging across adapters
- [ ] Local-fs adapter provides simple passthrough behavior
- [ ] GitHub adapter provides full API validation and resolution
- [ ] Level 1-4 validation commands pass with exit 0
- [ ] Unit tests cover >= 40% of new assignee resolver code
- [ ] Integration tests validate complete CLI workflow across different adapter types
- [ ] UX matches "After State" diagram - natural team-based assignment across backends
- [ ] **Implementation follows adapter pattern conventions**
- [ ] **No deprecated patterns or vulnerable dependencies**
- [ ] **Security recommendations current (no credential exposure)**
- [ ] **Performance within CLI startup <500ms target**

---

## Completion Checklist

- [ ] Task 1: WorkAdapter interface extended with user resolution methods
- [ ] Task 2: Type definitions created and validated
- [ ] Task 3: Generic AssigneeResolver service implemented and tested
- [ ] Task 4: Error classes added following existing patterns
- [ ] Task 5: Local-fs adapter user resolution implemented (passthrough)
- [ ] Task 6: GitHub adapter user resolution implemented (API validation)
- [ ] Task 7: Comprehensive unit tests written and passing
- [ ] Task 8: Create command integration complete and functional
- [ ] Task 9: Teams utility commands implemented with adapter awareness
- [ ] Task 10: Integration tests covering workflow across adapter types
- [ ] Task 11: CLI help text updated with adapter-specific @notation examples
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation succeeds
- [ ] Level 3: Unit tests pass with adequate coverage
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Integration validation passes
- [ ] Level 6: Current standards validation complete
- [ ] Level 7: Manual validation checklist complete
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 3 documentation queries (GitHub CLI, Zod v4)
**Web Intelligence Sources**: 2 community sources consulted (GitHub REST API docs, current CLI patterns)
**Last Verification**: 2025-02-13T23:15:00Z (all documentation verified current)
**Security Advisories Checked**: 1 verification (GitHub API assignee patterns current)
**Deprecated Patterns Avoided**: @oclif v3 patterns, Zod v3 syntax, legacy CLI argument parsing

---

## Risks and Mitigations

| Risk                                              | Likelihood | Impact | Mitigation                                          |
| ------------------------------------------------- | ---------- | ------ | --------------------------------------------------- |
| Team member ambiguity across multiple teams       | MEDIUM     | LOW    | Implement @team/member disambiguation syntax        |
| Performance impact on CLI startup                 | LOW        | MEDIUM | Lazy-load TeamsEngine, cache parsed teams.xml       |
| GitHub username changes breaking resolution       | LOW        | MEDIUM | Document teams.xml maintenance in CLI help          |
| Complex team hierarchy edge cases                 | MEDIUM     | LOW    | Start with simple @member patterns, iterate         |
| **Documentation staleness during implementation** | LOW        | MEDIUM | Context7 MCP re-verification before each major task |
| **Breaking changes in dependency versions**       | LOW        | HIGH   | Pin exact versions, validate before implementation  |

---

## Notes

### Architecture Decision Record

Selected WorkEngine-layer resolution over CLI-layer or adapter-layer approaches:

- **Reasoning**: Maintains separation of concerns, enables reuse across commands, leverages existing TeamsEngine
- **Trade-off**: Slightly later error feedback vs. clean architecture
- **Validation**: Aligns with current work CLI patterns and oclif best practices

### Current Intelligence Considerations

**GitHub CLI Evolution**: @me and @copilot patterns established as standard, provides precedent for work CLI @notation
**Zod v4 Adoption**: Template literal validation offers precise @notation syntax checking with proper TypeScript inference
**Community Feedback**: CLI username resolution is common pain point, @notation addressing widespread need

### Implementation Philosophy

This enhancement follows the work CLI core principle of "stateless command-line tool" - @notation resolution happens per-command without persistent state, maintaining the CLI's architectural integrity while dramatically improving user experience.
