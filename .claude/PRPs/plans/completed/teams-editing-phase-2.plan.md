# Feature: Teams Editing - Phase 2

## Summary

Implement comprehensive team editing capabilities for the work CLI, transforming it from read-only team management to full CRUD operations for teams, agents, and humans. This adds creation, editing, deletion, and import/export functionality with validation, backup, and recovery mechanisms.

## User Story

As a work CLI user managing development teams
I want to create, edit, and remove teams, agents, and humans through CLI commands
So that I can customize team structures for my projects without manual XML editing

## Problem Statement

Users currently cannot modify team configurations through the CLI - they must manually edit XML files, which creates a high technical barrier, risk of syntax errors, and potential data corruption without backup mechanisms.

## Solution Statement

Add comprehensive CRUD operations through new CLI commands that provide validated, safe team management with automatic backups, structured input validation, and user-friendly error messages.

## Metadata

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                            |
| Complexity             | HIGH                                                      |
| Systems Affected       | CLI commands, TeamsEngine, XML parsing, file operations   |
| Dependencies           | @oclif/core@^4.0.0, fast-xml-parser@^4.5.0, vitest@^2.0.0 |
| Estimated Tasks        | 16                                                        |
| **Research Timestamp** | **2026-02-12T17:45:00Z**                                  |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  User Wants │ ──────► │   Manual    │ ──────► │    Risk     │            ║
║   │ Team Changes│         │ XML Editing │         │ Corruption  │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║          │                        │                        │                  ║
║          │                        ▼                        ▼                  ║
║          │               ┌─────────────┐         ┌─────────────┐            ║
║          │               │   Navigate  │         │     No      │            ║
║          └──────────────►│ .work/teams │────────►│   Backup    │            ║
║                          │   .xml      │         │  Recovery   │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Want team change → Open text editor → Edit XML → Save → Hope   ║
║   PAIN_POINT: High technical barrier, no validation, risk of corruption      ║
║   DATA_FLOW: User → Text Editor → Direct XML Modification → File System      ║
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
║   │  User Wants │ ──────► │CLI Commands │ ──────► │    Safe     │            ║
║   │ Team Changes│         │   (CRUD)    │         │  Operations │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                        │                  ║
║                                   ▼                        ▼                  ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │   Input     │         │  Automatic  │            ║
║                          │ Validation  │────────►│   Backup    │            ║
║                          │   & Parse   │         │  Creation   │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                   │                        │                  ║
║                                   ▼                        ▼                  ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │Teams Engine │         │Confirmation │            ║
║                          │  Updates    │ ──────► │  Messages   │            ║
║                          │ (Validated) │         │ & Rollback  │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Want team change → Run CLI command → Get confirmation          ║
║   VALUE_ADD: Safe operations, validation, backup/restore, user-friendly      ║
║   DATA_FLOW: User → CLI → TeamsEngine → XML Utils → Validated File Write     ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location         | Before                                      | After                                                                                          | User Impact                                 |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Team Creation    | Manual XML editing with full schema         | `work teams create mobile-dev --description "Mobile app team" --icon "📱"`                     | Simple CLI command instead of XML knowledge |
| Adding Agent     | Copy/paste XML blocks, manage IDs manually  | `work teams add-agent mobile-dev ios-specialist --title "iOS Developer" --from-file agent.xml` | Structured command with validation          |
| Editing Member   | Navigate XML, find element, edit attributes | `work teams edit-agent mobile-dev/ios-specialist --title "Senior iOS Developer"`               | Direct member addressing with path syntax   |
| Removing Members | Delete XML blocks, risk orphaned references | `work teams remove-agent mobile-dev/ios-specialist`                                            | Safe removal with dependency checking       |
| Validation       | No validation until CLI usage breaks        | `work teams validate --verbose`                                                                | Proactive validation with detailed feedback |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File                                   | Lines   | Why Read This                                             |
| -------- | -------------------------------------- | ------- | --------------------------------------------------------- |
| P0       | `docs/work-teams-specification.md`     | 269-456 | Complete CLI command interface specification to IMPLEMENT |
| P0       | `src/cli/commands/edit.ts`             | 37-83   | Pattern to MIRROR exactly for CRUD operations             |
| P0       | `src/cli/commands/teams/member.ts`     | 39-48   | Path validation pattern for team-id/member-id             |
| P0       | `src/core/teams-engine.ts`             | 113-476 | Existing teams operations to extend                       |
| P1       | `docs/work-teams-specification.md`     | 44-141  | XML schema and file structure to FOLLOW                   |
| P1       | `src/types/teams.ts`                   | 78-106  | Types to IMPORT and extend                                |
| P1       | `src/types/errors.ts`                  | 125-179 | Error pattern to FOLLOW for team editing errors           |
| P2       | `docs/work-teams-specification.md`     | 704-727 | Error handling and validation requirements                |
| P2       | `src/core/xml-utils.ts`                | 61-107  | XML parsing/building patterns to USE                      |
| P2       | `tests/unit/core/teams-engine.test.ts` | 1-41    | Test pattern to FOLLOW                                    |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [OCLIF Core v4.0](https://oclif.io/docs/introduction) ✓ Current | Command & Flags API | CLI command patterns | 2026-02-12T17:45:00Z |
| [fast-xml-parser v4.5](https://github.com/naturalintelligence/fast-xml-parser) ✓ Current | CDATA & Validation | XML manipulation patterns | 2026-02-12T17:45:00Z |
| [Vitest v4.0](https://vitest.dev/guide/features.html) ✓ Current | Mocking & Testing | Test patterns | 2026-02-12T17:45:00Z |

---

## Patterns to Mirror

**NAMING_CONVENTION:**

```typescript
// SOURCE: src/cli/commands/edit.ts:37-45
// COPY THIS PATTERN:
export default class Edit extends BaseCommand {
  static override flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ description: 'update work item title' }),
    description: Flags.string({ description: 'update work item description' }),
    priority: Flags.string({ description: 'update work item priority', options: ['low', 'medium', 'high', 'critical'] }),
  };
```

**ERROR_HANDLING:**

```typescript
// SOURCE: src/types/errors.ts:125-145
// COPY THIS PATTERN:
export class TeamNotFoundError extends WorkError {
  constructor(name: string) {
    super(`Team not found: ${name}`, 'TEAM_NOT_FOUND', 404);
    this.name = 'TeamNotFoundError';
    Object.setPrototypeOf(this, TeamNotFoundError.prototype);
  }
}
```

**LOGGING_PATTERN:**

```typescript
// SOURCE: src/cli/commands/teams/member.ts:136-138
// COPY THIS PATTERN:
try {
  const member = await engine.getMember(teamId, memberId);
} catch (error) {
  this.error(`Failed to show member: ${(error as Error).message}`);
}
```

**PATH_VALIDATION:**

```typescript
// SOURCE: src/cli/commands/teams/member.ts:39-48
// COPY THIS PATTERN:
const pathParts = args.memberPath.split('/');
if (pathParts.length !== 2) {
  this.error('Member path must be in format: team-id/member-id');
}
const [teamId, memberId] = pathParts;
if (!teamId || !memberId) {
  this.error('Member path must be in format: team-id/member-id');
}
```

**OUTPUT_FORMAT:**

```typescript
// SOURCE: src/cli/formatter.ts:20-35
// COPY THIS PATTERN:
export function formatOutput<T>(
  data: T,
  format: ResponseFormat,
  meta?: Meta
): string {
  if (format === 'json') {
    const response: SuccessResponse<T> = { data };
    if (meta) response.meta = meta;
    return JSON.stringify(response, null, 2) + '\n';
  }
  return String(data);
}
```

**XML_BUILDING:**

```typescript
// SOURCE: src/core/xml-utils.ts:108-120
// COPY THIS PATTERN:
export function buildTeamsXML(teamsData: TeamsData): string {
  const builder = new XMLBuilder({
    format: true,
    indentBy: '  ',
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
  });
  return xmlDeclaration + builder.build({ teams: teamsData });
}
```

**TEST_STRUCTURE:**

```typescript
// SOURCE: tests/unit/core/teams-engine.test.ts:1-20
// COPY THIS PATTERN:
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

vi.mock('../../../src/core/xml-utils', () => ({
  parseTeamsXML: vi.fn(),
  buildTeamsXML: vi.fn(),
}));

describe('TeamsEngine', () => {
  let engine: TeamsEngine;

  beforeEach(async () => {
    engine = new TeamsEngine();
    vi.clearAllMocks();
  });
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**

- ✅ XML external entity processing disabled in fast-xml-parser v4.5
- ✅ Input validation prevents path traversal attacks
- ✅ No eval() or unsafe dynamic execution
- ✅ File operations use safe path resolution

**Performance (Web Intelligence Verified):**

- ✅ fast-xml-parser v4.5 optimized for large XML files
- ✅ Memory-efficient parsing with streaming support
- ✅ Atomic file operations prevent corruption
- ✅ Lazy loading of teams data

**Community Intelligence:**

- ✅ OCLIF v4.0 current patterns followed (November 2025 release)
- ✅ fast-xml-parser v4.5 CDATA handling best practices
- ✅ Vitest v4.0 testing patterns (concurrent test support)
- ✅ No deprecated patterns detected in codebase exploration

---

## Files to Change

| File                                     | Action | Justification                       |
| ---------------------------------------- | ------ | ----------------------------------- |
| `src/cli/commands/teams/create.ts`       | CREATE | Team creation command               |
| `src/cli/commands/teams/edit.ts`         | CREATE | Team editing command                |
| `src/cli/commands/teams/remove.ts`       | CREATE | Team removal command                |
| `src/cli/commands/teams/add-agent.ts`    | CREATE | Agent addition command              |
| `src/cli/commands/teams/edit-agent.ts`   | CREATE | Agent editing command               |
| `src/cli/commands/teams/remove-agent.ts` | CREATE | Agent removal command               |
| `src/cli/commands/teams/add-human.ts`    | CREATE | Human addition command              |
| `src/cli/commands/teams/edit-human.ts`   | CREATE | Human editing command               |
| `src/cli/commands/teams/remove-human.ts` | CREATE | Human removal command               |
| `src/cli/commands/teams/import.ts`       | CREATE | Import teams command                |
| `src/cli/commands/teams/export.ts`       | CREATE | Export teams command                |
| `src/core/teams-engine.ts`               | UPDATE | Add CRUD methods to existing engine |
| `src/types/errors.ts`                    | UPDATE | Add team editing specific errors    |
| `src/types/teams.ts`                     | UPDATE | Add editing operation types         |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Workflow execution engine - Future Phase 4
- Team-based work item assignment - Future Phase 3
- Real-time team collaboration features - Future Phase 4
- Web UI for team management - Out of scope
- Team templates and cloning - Future Phase 4
- Integration with external team management systems - Not planned

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled.

**Coverage Target**: MVP 40% (adding significant new capability)

**CRITICAL**: All CLI command implementations MUST strictly follow the command interface specified in `docs/work-teams-specification.md` sections 4.1-4.6 (lines 269-456). Each task references specific specification sections to ensure exact compliance with the documented API.

### Task 1: UPDATE `src/types/errors.ts`

- **ACTION**: ADD team editing specific error classes
- **IMPLEMENT**: TeamEditingError, DuplicateTeamIdError, InvalidTeamConfigError, BackupFailedError
- **MIRROR**: `src/types/errors.ts:125-179` - follow existing error pattern exactly
- **IMPORTS**: Extend WorkError base class
- **PATTERN**: Include descriptive messages, error codes, HTTP status codes
- **GOTCHA**: Use Object.setPrototypeOf for proper inheritance in TypeScript
- **CURRENT**: Following current error handling best practices (no breaking changes in v4+ standards)
- **VALIDATE**: `npm run lint && npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - simple error class definitions

### Task 2: UPDATE `src/types/teams.ts`

- **ACTION**: ADD types for editing operations
- **IMPLEMENT**: CreateTeamRequest, UpdateTeamRequest, CreateAgentRequest, UpdateAgentRequest, CreateHumanRequest, UpdateHumanRequest
- **MIRROR**: `src/types/teams.ts:78-106` - follow existing interface patterns
- **SPEC**: Follow `docs/work-teams-specification.md:614-651` - team/agent/human type structures
- **TYPES**: Use Partial<> for updates, Required<> for creation where appropriate
- **GOTCHA**: Keep readonly properties in base interfaces, make mutable in request types
- **CURRENT**: TypeScript 5.0+ patterns with strict mode enabled
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: CREATE `src/cli/commands/teams/create.ts`

- **ACTION**: CREATE team creation command
- **IMPLEMENT**: Team creation with id, name, title, description, icon flags
- **MIRROR**: `src/cli/commands/create.ts:53-88` - follow existing create pattern
- **SPEC**: Follow `docs/work-teams-specification.md:290-300` - team creation command interface
- **IMPORTS**: `import { BaseCommand } from '../../base-command'`, `import { TeamsEngine } from '../../../core/teams-engine'`
- **FLAGS**: --name, --title, --description, --icon with validation
- **GOTCHA**: Team ID must be unique and valid (alphanumeric-hyphens)
- **CURRENT**: OCLIF v4.0 command patterns with proper flag definitions
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams create test-team --help`
- **FUNCTIONAL**: `./bin/dev.js teams create test-team --name "Test Team" --description "Test description"`
- **TEST_PYRAMID**: Add integration test for: team creation workflow with validation and error cases

### Task 4: CREATE `src/cli/commands/teams/edit.ts`

- **ACTION**: CREATE team editing command
- **IMPLEMENT**: Team metadata editing with optional flags
- **MIRROR**: `src/cli/commands/edit.ts:37-83` - follow existing edit pattern exactly
- **SPEC**: Follow `docs/work-teams-specification.md:294-297` - team editing command interface
- **ARGS**: team-id as required argument
- **FLAGS**: --name, --title, --description, --icon (all optional)
- **PATTERN**: Build update object from provided flags only
- **GOTCHA**: Only update fields that are provided (don't overwrite with undefined)
- **CURRENT**: OCLIF v4.0 selective update patterns
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams edit --help`
- **FUNCTIONAL**: `./bin/dev.js teams edit test-team --name "Updated Name"`
- **TEST_PYRAMID**: Add E2E test for: complete team editing workflow with partial updates

### Task 5: CREATE `src/cli/commands/teams/remove.ts`

- **ACTION**: CREATE team removal command with safety checks
- **IMPLEMENT**: Team deletion with confirmation and backup
- **MIRROR**: Pattern similar to edit but with destructive operation safety
- **SPEC**: Follow `docs/work-teams-specification.md:299-300` - team removal command interface
- **ARGS**: team-id as required argument
- **FLAGS**: --force (skip confirmation), --no-backup (skip backup creation)
- **SAFETY**: Require confirmation unless --force, create backup unless --no-backup
- **GOTCHA**: Check for team existence before attempting removal
- **CURRENT**: CLI best practices for destructive operations
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams remove --help`
- **FUNCTIONAL**: `./bin/dev.js teams remove test-team --force`
- **TEST_PYRAMID**: Add integration test for: removal workflow with backup creation and confirmation

### Task 6: CREATE `src/cli/commands/teams/add-agent.ts`

- **ACTION**: CREATE agent addition command
- **IMPLEMENT**: Add new agent to existing team
- **MIRROR**: `src/cli/commands/teams/create.ts` pattern but for nested resource
- **SPEC**: Follow `docs/work-teams-specification.md:402-407` - add-agent command interface
- **ARGS**: team-id, agent-id as required arguments
- **FLAGS**: --name, --title, --icon, --from-file (for full agent definition)
- **PATH_VALIDATION**: Follow `src/cli/commands/teams/member.ts:39-48` pattern
- **GOTCHA**: Ensure agent ID unique within team, validate team exists first
- **CURRENT**: OCLIF v4.0 nested resource creation patterns
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams add-agent --help`
- **FUNCTIONAL**: `./bin/dev.js teams add-agent test-team new-agent --name "New Agent" --title "Developer"`
- **TEST_PYRAMID**: Add integration test for: agent addition with validation and team existence checks

### Task 7: CREATE `src/cli/commands/teams/edit-agent.ts`

- **ACTION**: CREATE agent editing command
- **IMPLEMENT**: Edit existing agent in team
- **MIRROR**: `src/cli/commands/teams/edit.ts` but for member path
- **SPEC**: Follow `docs/work-teams-specification.md:408-410` - edit-agent command interface
- **ARGS**: agent-path in format team-id/agent-id
- **FLAGS**: --name, --title, --icon (all optional)
- **PATH_VALIDATION**: Use exact pattern from `src/cli/commands/teams/member.ts:39-48`
- **GOTCHA**: Validate both team and agent exist before attempting edit
- **CURRENT**: OCLIF v4.0 path-based resource editing
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams edit-agent --help`
- **FUNCTIONAL**: `./bin/dev.js teams edit-agent test-team/new-agent --title "Senior Developer"`
- **TEST_PYRAMID**: Add E2E test for: agent editing with path validation and partial updates

### Task 8: CREATE `src/cli/commands/teams/remove-agent.ts`

- **ACTION**: CREATE agent removal command
- **IMPLEMENT**: Remove agent from team safely
- **MIRROR**: `src/cli/commands/teams/remove.ts` but for nested resource
- **ARGS**: agent-path in format team-id/agent-id
- **FLAGS**: --force, --no-backup
- **PATH_VALIDATION**: Use `src/cli/commands/teams/member.ts:39-48` pattern
- **SAFETY**: Confirmation and backup like team removal
- **GOTCHA**: Check agent exists and has no dependencies before removal
- **CURRENT**: Safe destructive operations for nested resources
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams remove-agent --help`
- **FUNCTIONAL**: `./bin/dev.js teams remove-agent test-team/new-agent --force`
- **TEST_PYRAMID**: Add integration test for: agent removal with dependency checking and backup

### Task 9: CREATE `src/cli/commands/teams/add-human.ts`

- **ACTION**: CREATE human addition command
- **IMPLEMENT**: Add human member to team
- **MIRROR**: `src/cli/commands/teams/add-agent.ts` but for human-specific fields
- **SPEC**: Follow `docs/work-teams-specification.md:379-386` - add-human command interface
- **ARGS**: team-id, human-id as required arguments
- **FLAGS**: --name, --title, --icon, --email, --github, --timezone, --working-hours
- **PATTERN**: Human-specific validation (email format, timezone validation)
- **GOTCHA**: Platform usernames should be validated for basic format
- **CURRENT**: Human-centric team management best practices
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams add-human --help`
- **FUNCTIONAL**: `./bin/dev.js teams add-human test-team john-doe --name "John Doe" --email "john@example.com"`
- **TEST_PYRAMID**: Add integration test for: human addition with platform validation and contact info

### Task 10: CREATE `src/cli/commands/teams/edit-human.ts`

- **ACTION**: CREATE human editing command
- **IMPLEMENT**: Edit human member details
- **MIRROR**: `src/cli/commands/teams/edit-agent.ts` but with human-specific flags
- **ARGS**: human-path in format team-id/human-id
- **FLAGS**: --name, --title, --icon, --email, --github, --timezone, --working-hours, --status
- **PATH_VALIDATION**: Use `src/cli/commands/teams/member.ts:39-48` pattern
- **PATTERN**: Validate email format, timezone names, time format for working hours
- **GOTCHA**: Contact info changes should be validated but allow partial updates
- **CURRENT**: Human resource management with privacy considerations
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams edit-human --help`
- **FUNCTIONAL**: `./bin/dev.js teams edit-human test-team/john-doe --email "john.doe@example.com"`
- **TEST_PYRAMID**: Add E2E test for: human editing with contact validation and partial updates

### Task 11: CREATE `src/cli/commands/teams/remove-human.ts`

- **ACTION**: CREATE human removal command
- **IMPLEMENT**: Remove human from team
- **MIRROR**: `src/cli/commands/teams/remove-agent.ts` exact pattern
- **ARGS**: human-path in format team-id/human-id
- **FLAGS**: --force, --no-backup
- **PATH_VALIDATION**: Use `src/cli/commands/teams/member.ts:39-48` pattern
- **SAFETY**: Same confirmation and backup pattern as other remove commands
- **GOTCHA**: Check human exists before removal attempt
- **CURRENT**: Consistent removal patterns across resource types
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams remove-human --help`
- **FUNCTIONAL**: `./bin/dev.js teams remove-human test-team/john-doe --force`
- **TEST_PYRAMID**: Add integration test for: human removal workflow with backup and confirmation

### Task 12: CREATE `src/cli/commands/teams/import.ts`

- **ACTION**: CREATE teams import command
- **IMPLEMENT**: Import teams from XML file with conflict resolution
- **MIRROR**: File import patterns from codebase (check for similar operations)
- **SPEC**: Follow `docs/work-teams-specification.md:431-435` - import command interface
- **ARGS**: file path as required argument
- **FLAGS**: --merge (merge vs replace), --conflict-strategy (ask|skip|replace), --validate-only
- **PATTERN**: Parse file, validate, handle conflicts, backup before import
- **GOTCHA**: Large files might need streaming, validate before importing
- **CURRENT**: Import/export best practices with validation and conflict resolution
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams import --help`
- **FUNCTIONAL**: `echo '<teams><team id="test">...</team></teams>' > test.xml && ./bin/dev.js teams import test.xml`
- **TEST_PYRAMID**: Add integration test for: import workflow with conflict resolution and validation

### Task 13: CREATE `src/cli/commands/teams/export.ts`

- **ACTION**: CREATE teams export command
- **IMPLEMENT**: Export teams to XML file with filtering options
- **MIRROR**: Export patterns similar to import but reverse direction
- **SPEC**: Follow `docs/work-teams-specification.md:424-430` - export command interface
- **ARGS**: output file path as optional argument (default to stdout)
- **FLAGS**: --team (specific team), --agent (specific agent), --human (specific human), --format (xml|json)
- **PATTERN**: Generate XML/JSON from teams data, handle file output
- **GOTCHA**: Ensure output directory exists, handle stdout vs file output
- **CURRENT**: Export utilities with multiple format support
- **VALIDATE**: `npm run lint && npx tsc --noEmit && ./bin/dev.js teams export --help`
- **FUNCTIONAL**: `./bin/dev.js teams export teams-backup.xml`
- **TEST_PYRAMID**: Add integration test for: export functionality with different formats and filtering

### Task 14: UPDATE `src/core/teams-engine.ts` (add CRUD methods)

- **ACTION**: ADD public CRUD methods to TeamsEngine
- **IMPLEMENT**: createTeam, updateTeam, deleteTeam, addAgent, updateAgent, removeAgent, addHuman, updateHuman, removeHuman, importTeams, exportTeams
- **MIRROR**: `src/core/teams-engine.ts:113-476` - follow existing method patterns
- **PATTERN**: Use existing saveTeams(), loadTeams(), validateTeams() private methods
- **IMPORTS**: Import new error types and request types
- **GOTCHA**: Ensure proper backup before destructive operations, validate IDs are unique
- **CURRENT**: Engine pattern with transaction-like operations
- **VALIDATE**: `npm run lint && npx tsc --noEmit`
- **TEST_PYRAMID**: Add integration test for: all CRUD operations with validation, backup, and error scenarios

### Task 15: CREATE `tests/unit/cli/commands/teams/crud.test.ts`

- **ACTION**: CREATE unit tests for new CRUD commands
- **IMPLEMENT**: Test all new CLI commands with mocked TeamsEngine
- **MIRROR**: `tests/unit/core/teams-engine.test.ts:1-41` - follow existing test structure
- **PATTERN**: Mock TeamsEngine, test command parsing, flag handling, error cases
- **TEST_CASES**: Success cases, validation errors, missing teams/agents, flag combinations
- **GOTCHA**: Mock file system operations, use vi.clearAllMocks() in beforeEach
- **CURRENT**: Vitest v4.0 testing patterns with proper mocking
- **VALIDATE**: `npm run test:unit -- tests/unit/cli/commands/teams/crud.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: complete CRUD workflow end-to-end

### Task 16: CREATE `tests/integration/cli/commands/teams-editing.test.ts`

- **ACTION**: CREATE integration tests for teams editing workflow
- **IMPLEMENT**: Test complete workflows with real file operations
- **MIRROR**: `tests/integration/cli/commands/edit.test.ts:26-46` - follow integration test pattern
- **PATTERN**: Use execSync with real CLI commands, test actual file changes
- **TEST_CASES**: Create team → Add agent → Edit agent → Remove agent → Remove team
- **GOTCHA**: Clean up test files, use unique team IDs to avoid conflicts
- **CURRENT**: Integration testing best practices with filesystem operations
- **VALIDATE**: `npm run test:integration -- tests/integration/cli/commands/teams-editing.test.ts`
- **TEST_PYRAMID**: Add E2E test for: complete user journey covering all editing scenarios

---

## Testing Strategy

### Unit Tests to Write

| Test File                                      | Test Cases                            | Validates             |
| ---------------------------------------------- | ------------------------------------- | --------------------- |
| `tests/unit/cli/commands/teams/create.test.ts` | team creation, validation, duplicates | CLI command parsing   |
| `tests/unit/cli/commands/teams/edit.test.ts`   | partial updates, missing teams        | Edit command logic    |
| `tests/unit/core/teams-engine-crud.test.ts`    | CRUD operations, backup creation      | Engine business logic |
| `tests/unit/types/teams-requests.test.ts`      | Type validation, required fields      | Type definitions      |

### Edge Cases Checklist

- [ ] Empty string inputs for required fields
- [ ] Duplicate team/agent/human IDs
- [ ] Missing teams.xml file during edit operations
- [ ] Invalid XML structure in import files
- [ ] Network drive or permission issues during backup
- [ ] Large teams.xml files (memory constraints)
- [ ] Concurrent modifications to teams.xml
- [ ] Invalid email formats for humans
- [ ] Invalid timezone specifications
- [ ] XML entities and CDATA handling in import

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npx tsc --noEmit
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && ./bin/dev.js teams create test-team --help
```

**EXPECT**: Build succeeds, help text displays correctly

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/cli/commands/teams/
```

**EXPECT**: All tests pass, coverage >= 40% for new modules

### Level 4: FULL_SUITE

```bash
npm test -- --coverage && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: MANUAL_VALIDATION

1. Create a test team: `./bin/dev.js teams create test-team --name "Test Team"`
2. Add an agent: `./bin/dev.js teams add-agent test-team dev-agent --name "Developer"`
3. Edit the agent: `./bin/dev.js teams edit-agent test-team/dev-agent --title "Senior Dev"`
4. List teams to verify: `./bin/dev.js teams list`
5. Remove agent: `./bin/dev.js teams remove-agent test-team/dev-agent --force`
6. Remove team: `./bin/dev.js teams remove test-team --force`
7. Verify team is gone: `./bin/dev.js teams list`

---

## Acceptance Criteria

- [ ] All CRUD operations implemented per teams specification
- [ ] Level 1-4 validation commands pass with exit 0
- [ ] Unit tests cover >= 40% of new code (MVP target)
- [ ] Code mirrors existing patterns exactly (naming, structure, logging, error handling)
- [ ] No regressions in existing teams tests
- [ ] UX matches "After State" diagram - CLI commands replace manual XML editing
- [ ] **Implementation follows current OCLIF v4.0 best practices**
- [ ] **XML handling uses secure fast-xml-parser v4.5 patterns**
- [ ] **Test patterns follow current Vitest v4.0 standards**

---

## Completion Checklist

- [ ] All 16 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage >= 40%
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Manual validation workflow completed
- [ ] All acceptance criteria met
- [ ] No breaking changes to existing teams functionality

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (fast-xml-parser documentation, security validation)
**Web Intelligence Sources**: 3 (OCLIF docs, Vitest features, community best practices)
**Last Verification**: 2026-02-12T17:45:00Z
**Security Advisories Checked**: 1 (XML external entity processing disabled)
**Deprecated Patterns Avoided**: All current - no legacy patterns detected in codebase exploration

---

## Risks and Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                         |
| ------------------------------------------- | ---------- | ------ | -------------------------------------------------- |
| XML file corruption during editing          | MEDIUM     | HIGH   | Automatic backup before all destructive operations |
| Large teams.xml files causing memory issues | LOW        | MEDIUM | Streaming XML parsing and incremental updates      |
| Concurrent access corrupting teams.xml      | LOW        | HIGH   | File locking or atomic write operations            |
| Breaking existing teams functionality       | MEDIUM     | HIGH   | Comprehensive test coverage and integration tests  |
| Documentation changes during implementation | LOW        | MEDIUM | Context7 MCP re-verification during execution      |

---

## Notes

### Implementation Strategy

This implementation builds directly on the existing teams infrastructure (Phase 1) by extending the TeamsEngine with CRUD operations and adding corresponding CLI commands. The approach maintains consistency with existing work CLI patterns while adding comprehensive editing capabilities.

### Current Intelligence Considerations

- OCLIF v4.0 patterns are current and stable (November 2025 release)
- fast-xml-parser v4.5 CDATA handling is essential for workflow content
- Vitest v4.0 concurrent testing patterns improve test performance
- No deprecated XML or CLI patterns detected in current codebase

### Future Integration Points

This Phase 2 implementation prepares the foundation for:

- Phase 3: Team-work item integration with assignment capabilities
- Phase 4: Workflow execution and advanced team features
- Import/export capabilities enable team sharing and backup strategies

The editing capabilities enable users to customize teams for specific project needs without technical XML barriers, significantly improving the user experience and reducing the risk of configuration errors.
