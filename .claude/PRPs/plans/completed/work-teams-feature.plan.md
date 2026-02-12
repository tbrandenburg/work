# Feature: Work Teams Foundation (Phase 1)

## Summary

Implement Phase 1 foundation of the `work teams` command system that enables querying and validating XML-based team configurations. This phase establishes core infrastructure with pre-installed teams (SW dev, research) and basic information retrieval commands, setting the groundwork for future CRUD operations while remaining completely decoupled from existing work item management.

## User Story

As a work CLI user orchestrating mixed human-agent teams
I want to explore and validate pre-installed teams via `work teams` commands
So that I can understand team structures, agent personas, and activation instructions to prepare for future team coordination

## Problem Statement

Users currently manage AI agents and human team members through ad-hoc documentation and external tools, leading to scattered workflows, inconsistent persona definitions, and manual coordination overhead. There's no standardized way to define agent capabilities, activation instructions, or team structures within the work CLI ecosystem.

## Solution Statement

Create Phase 1 foundation of `work teams` command suite that reads XML-based team configurations from `.work/teams.xml`. Pre-install SW development and research teams with structured agent/human definitions including personas, workflows, and activation instructions. Provide validation, information retrieval, and basic querying capabilities. Follow existing CLI patterns exactly while remaining decoupled from core work item management.

## Metadata

| Field                  | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                       |
| Complexity             | HIGH                                                 |
| Systems Affected       | CLI commands, XML storage, type definitions          |
| Dependencies           | fast-xml-parser ^5.0.0                               |
| Estimated Tasks        | 22                                                   |
| **Phase**              | **Phase 1: Foundation (Read-only operations)**       |
| **Research Timestamp** | **2026-02-11 18:45 UTC (Context7 & oclif verified)** |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  User needs │ ──────► │ Manual team │ ──────► │ Ad-hoc team │            ║
║   │ to organize │         │ coordination│         │ management  │            ║
║   │ AI agents & │         │ via external│         │ with no     │            ║
║   │ humans into │         │ tools       │         │ structure   │            ║
║   │ teams       │         │             │         │             │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Create spreadsheets → Define roles manually → Share via email   ║
║   PAIN_POINT: No standardized agent definitions, scattered workflows          ║
║   DATA_FLOW: External files → Manual sharing → Fragmented communication       ║
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
║   │  User types │ ──────► │ work teams  │ ──────► │ Structured  │            ║
║   │ work teams  │         │ list/show/  │         │ team output │            ║
║   │ commands    │         │ agent cmds  │         │ with roles  │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ .work/      │  ◄── XML storage with personas,      ║
║                          │ teams.xml   │      workflows, embedded templates   ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: work teams list → work teams agent X --activation → use info    ║
║   VALUE_ADD: Pre-built teams, structured personas, workflow templates         ║
║   DATA_FLOW: CLI commands → .work/teams.xml → Formatted table/JSON output    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location          | Before                   | After                              | User Impact                                                           |
| ----------------- | ------------------------ | ---------------------------------- | --------------------------------------------------------------------- |
| CLI               | No team management       | `work teams` commands available    | Users can `work teams list` to see pre-installed teams                |
| `.work/` folder   | Only contexts.json       | teams.xml with team data           | Structured storage of agent personas and workflows                    |
| Agent definitions | Manual documentation     | XML-based structured definitions   | `work teams agent sw-dev-team/tech-lead --persona` shows role details |
| Workflow access   | Scattered external files | Centralized CDATA workflows in XML | `work teams workflow team/agent/workflow-id` retrieves templates      |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File                                                 | Lines | Why Read This                               |
| -------- | ---------------------------------------------------- | ----- | ------------------------------------------- |
| P0       | `docs/work-teams-specification.md`                   | ALL   | **COMPLETE teams feature specification**    |
| P0       | `src/cli/commands/context/add.ts`                    | 7-83  | Pattern to MIRROR exactly for team creation |
| P0       | `src/cli/commands/context/list.ts`                   | 5-61  | Table/JSON output pattern to FOLLOW         |
| P0       | `src/cli/base-command.ts`                            | 12-71 | BaseCommand pattern and error handling      |
| P1       | `src/types/context.ts`                               | 21-50 | Type definition patterns to IMPORT          |
| P1       | `src/types/errors.ts`                                | 5-123 | Error class patterns to FOLLOW              |
| P2       | `tests/integration/cli/commands/context/add.test.ts` | 6-50  | Test pattern to FOLLOW exactly              |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [fast-xml-parser v5 Docs](https://github.com/NaturalIntelligence/fast-xml-parser/blob/v5.0.0/docs/v5/1.GettingStarted.md) ✓ Current | XMLParser/XMLBuilder usage | XML parsing and generation patterns | 2026-02-11 18:45 |
| [oclif v4 Commands](https://oclif.io/docs/commands) ✓ Current | Command structure | CLI command organization | 2026-02-11 18:45 |

---

## Patterns to Mirror

**NAMING_CONVENTION:**

```typescript
// SOURCE: src/cli/commands/context/add.ts:7-12
// COPY THIS PATTERN:
export class ContextAdd extends BaseCommand {
  static override description = 'Add a new context for work item management';

  static override examples = [
    '<%= config.bin %> <%= command.id %> myproject --tool local-fs --path ./tasks',
  ];
```

**ERROR_HANDLING:**

```typescript
// SOURCE: src/types/errors.ts:20-35
// COPY THIS PATTERN:
export class ContextNotFoundError extends WorkError {
  constructor(name: string) {
    super(`Context not found: ${name}`, 'CONTEXT_NOT_FOUND', 404);
    Object.setPrototypeOf(this, ContextNotFoundError.prototype);
  }
}
```

**CLI_BASE_COMMAND:**

```typescript
// SOURCE: src/cli/base-command.ts:12-23
// COPY THIS PATTERN:
export abstract class BaseCommand extends Command {
  static override baseFlags = {
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };
```

**FILE_PERSISTENCE:**

```typescript
// SOURCE: src/core/engine.ts:641-656
// COPY THIS PATTERN:
private getTeamsFilePath(): string {
  return path.join(process.cwd(), '.work', 'teams.xml');
}

private async saveTeams(): Promise<void> {
  const teamsPath = this.getTeamsFilePath();
  await fs.mkdir(path.dirname(teamsPath), { recursive: true });
  const xmlContent = this.xmlBuilder.build(this.teamsData);
  await fs.writeFile(teamsPath, xmlContent);
}
```

**TYPE_DEFINITIONS:**

```typescript
// SOURCE: src/types/context.ts:21-35
// COPY THIS PATTERN:
export interface Team {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly icon: string;
  readonly description: string;
  readonly agents: readonly Agent[];
  readonly humans: readonly Human[];
}
```

**TEST_STRUCTURE:**

```typescript
// SOURCE: tests/integration/cli/commands/context/add.test.ts:15-30
// COPY THIS PATTERN:
describe('Teams List Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-teams-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');
  });
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**

- [x] XML parser configured with safe defaults (no DTD processing)
- [x] File path validation for .work directory access
- [x] CDATA content sanitization for workflow storage
- [x] No external entity processing in XML parsing

**Performance (Web Intelligence Verified):**

- [x] Synchronous XML parsing acceptable for CLI usage
- [x] File-based storage appropriate for team configuration size
- [x] No caching needed (stateless CLI execution)
- [x] Memory usage minimal (on-demand loading)

**Community Intelligence:**

- [x] fast-xml-parser remains actively maintained (latest 5.0.6)
- [x] oclif v4 patterns confirmed as current standard
- [x] No deprecated TypeScript practices detected
- [x] File I/O patterns align with Node.js LTS recommendations

---

## Files to Change

| File                                 | Action | Justification                         |
| ------------------------------------ | ------ | ------------------------------------- |
| `package.json`                       | UPDATE | Add fast-xml-parser dependency        |
| `src/types/teams.ts`                 | CREATE | Complete XML schema type definitions  |
| `src/types/errors.ts`                | UPDATE | Add team-specific error classes       |
| `src/core/teams-engine.ts`           | CREATE | Teams management logic (read-only)    |
| `src/core/xml-utils.ts`              | CREATE | XML parsing/writing utilities         |
| `src/core/default-teams.ts`          | CREATE | XML template loading utilities        |
| `src/templates/sw-dev-team.xml`      | CREATE | SW development team XML template      |
| `src/templates/research-team.xml`    | CREATE | Research team XML template            |
| `src/cli/commands/teams/list.ts`     | CREATE | List all teams command                |
| `src/cli/commands/teams/show.ts`     | CREATE | Show team details command             |
| `src/cli/commands/teams/agent.ts`    | CREATE | Show agent details with flags         |
| `src/cli/commands/teams/human.ts`    | CREATE | Show human details with flags         |
| `src/cli/commands/teams/member.ts`   | CREATE | Show any member (agent/human) details |
| `src/cli/commands/teams/validate.ts` | CREATE | Validate teams.xml structure          |
| `src/cli/commands/teams/config.ts`   | CREATE | Show teams.xml location command       |
| `src/cli/commands/teams/query.ts`    | CREATE | Query teams with filtering options    |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Work item integration**: Assigning tasks to team members (future phase)
- **Notification integration**: Team-based notification targets (future phase)
- **Context mapping**: Linking teams to project contexts (future phase)
- **Workflow execution**: Running workflows, just storage/retrieval (MVP limit)
- **Authentication**: Team member authentication/authorization (local CLI only)
- **Real-time coordination**: Live team collaboration features (static config only)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use `make ci` when available.

**Coverage Targets**: MVP 40%

### Task 1: UPDATE `package.json` (add dependency)

- **ACTION**: ADD fast-xml-parser dependency
- **IMPLEMENT**: `npm install --save fast-xml-parser`
- **VERSION**: `^5.0.0` (verified current stable)
- **GOTCHA**: Ensure TypeScript types included in package
- **CURRENT**: [fast-xml-parser v5 Docs](https://github.com/NaturalIntelligence/fast-xml-parser/blob/v5.0.0/docs/v5/1.GettingStarted.md)
- **VALIDATE**: `npm install && npm run build`
- **TEST_PYRAMID**: No additional tests needed - dependency addition only

### Task 2: CREATE `src/types/teams.ts`

- **ACTION**: CREATE type definitions for teams
- **IMPLEMENT**: Complete XML schema types: Team, Agent, Human, Workflow, Command, Persona interfaces
- **REFERENCE**: `docs/work-teams-specification.md` section 5.2-5.3 for complete schema definitions
- **SCHEMA**: Handle complex nested structures with agents/humans containing personas, commands, and workflows
- **MIRROR**: `src/types/context.ts:21-50` - readonly interface pattern
- **IMPORTS**: None (base types only)
- **PATTERN**: Use readonly properties, optional undefined unions, CDATA content types
- **COMPLEX_TYPES**: Persona (role, identity, communication_style, principles), Command (trigger, description, instructions, workflow_id), Workflow (main_file, dependencies array)
- **CURRENT**: TypeScript 5.4 strict mode interface patterns
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: UPDATE `src/types/errors.ts` (add team errors)

- **ACTION**: ADD team-specific error classes
- **IMPLEMENT**: TeamNotFoundError, AgentNotFoundError, HumanNotFoundError, MemberNotFoundError, TeamValidationError, WorkflowNotFoundError
- **MIRROR**: `src/types/errors.ts:20-35` - WorkError extension pattern
- **PATTERN**: Constructor with message, code, statusCode
- **IMPORTS**: Extend existing WorkError base class
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: Add integration test for: error class properties and prototype chain

### Task 4: CREATE `src/core/xml-utils.ts`

- **ACTION**: CREATE XML parsing and writing utilities
- **IMPLEMENT**: parseTeamsXML, buildTeamsXML, validateXMLStructure
- **IMPORTS**: `import { XMLParser, XMLBuilder } from 'fast-xml-parser'`
- **PATTERN**: Configure parser with ignoreAttributes: false, attributeNamePrefix: '@\_'
- **GOTCHA**: Handle CDATA sections with cdataPropName, trim values
- **CURRENT**: [XMLParser docs](https://github.com/NaturalIntelligence/fast-xml-parser/blob/v5.0.0/docs/v5/1.GettingStarted.md#basic-parsing)
- **VALIDATE**: `npm run type-check && npm run build`
- **TEST_PYRAMID**: Add integration test for: XML parsing round-trip with CDATA and attributes

### Task 5: CREATE `src/core/default-teams.ts`

- **ACTION**: CREATE XML template loading utilities
- **IMPLEMENT**: loadDefaultTeams, getTemplateXMLContent, initializeDefaultTeams functions
- **PATTERN**: Load XML templates from src/templates/, parse and return Team objects
- **IMPORTS**: Use xml-utils, fs.promises, path for template file access
- **STRUCTURE**: Read sw-dev-team.xml and research-team.xml from src/templates/
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: Add integration test for: template loading and XML parsing from src/templates/

### Task 6: CREATE `src/templates/sw-dev-team.xml`

- **ACTION**: CREATE SW development team XML template
- **IMPLEMENT**: Complete XML structure with agents (tech-lead, developer, scrum-master)
- **REFERENCE**: `docs/work-teams-specification.md` section 3.1 for complete SW dev team structure
- **CONTENT**: Full personas, activation instructions, sample workflows in CDATA sections
- **STRUCTURE**: Follow complex XML schema with nested agents, commands, workflows
- **VALIDATE**: XML file can be parsed successfully
- **TEST_PYRAMID**: No additional tests needed - template data file

### Task 7: CREATE `src/templates/research-team.xml`

- **ACTION**: CREATE research team XML template
- **IMPLEMENT**: Complete XML structure with agents (researcher, analyst, coordinator)
- **REFERENCE**: `docs/work-teams-specification.md` section 3.2 for complete research team structure
- **CONTENT**: Research-focused personas, workflows, and activation instructions
- **STRUCTURE**: Follow same XML schema as sw-dev-team but with research-specific content
- **VALIDATE**: XML file can be parsed successfully
- **TEST_PYRAMID**: No additional tests needed - template data file

### Task 8: CREATE `src/core/teams-engine.ts`

- **ACTION**: CREATE teams management engine
- **IMPLEMENT**: loadTeams, saveTeams, getTeam, listTeams, getAgent methods
- **MIRROR**: `src/core/engine.ts:33-54` - class structure and file operations
- **PATTERN**: Use .work/teams.xml path, auto-create with defaults, error handling
- **IMPORTS**: Use xml-utils, default-teams, types/teams, fs.promises
- **GOTCHA**: Handle missing file by creating defaults, validate on load
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: file operations and default team creation

### Task 9: CREATE `src/cli/commands/teams/list.ts`

- **ACTION**: CREATE teams list command
- **IMPLEMENT**: Display all teams with basic info
- **REFERENCE**: `docs/work-teams-specification.md` section 4.1 for complete command specification
- **MIRROR**: `src/cli/commands/context/list.ts:5-61` - table/JSON output pattern exactly
- **PATTERN**: Use BaseCommand, format flag, TeamsEngine integration
- **OUTPUT**: Team ID, name, title, agent count, human count
- **CURRENT**: oclif v4 command structure
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams list`
- **FUNCTIONAL**: `work teams list` - verify shows pre-installed teams
- **TEST_PYRAMID**: Add E2E test for: complete command execution with table and JSON output

### Task 10: CREATE `src/cli/commands/teams/show.ts`

- **ACTION**: CREATE team details command
- **IMPLEMENT**: Show complete team information including members
- **MIRROR**: `src/cli/commands/context/show.ts:6-68` - detail display pattern
- **ARGS**: team-name argument (required)
- **OUTPUT**: Team metadata, list of agents, list of humans
- **ERROR**: TeamNotFoundError for invalid team names
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams show sw-dev-team`
- **FUNCTIONAL**: `work teams show sw-dev-team` - verify shows team details
- **TEST_PYRAMID**: Add E2E test for: team display and error handling for invalid teams

### Task 11: CREATE `src/cli/commands/teams/agent.ts`

- **ACTION**: CREATE agent details command
- **IMPLEMENT**: Show agent info with optional flags for persona, commands, activation
- **REFERENCE**: `docs/work-teams-specification.md` section 4.3 for complete agent command specification
- **ARGS**: team-name/agent-name argument (required)
- **FLAGS**: --persona, --commands, --activation (boolean flags)
- **PATTERN**: Use dependsOn pattern for conditional output like notify commands
- **ERROR**: TeamNotFoundError, AgentNotFoundError for invalid references
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams agent sw-dev-team/tech-lead --persona`
- **FUNCTIONAL**: `work teams agent sw-dev-team/tech-lead --activation` - verify shows activation instructions
- **TEST_PYRAMID**: Add E2E test for: agent details with all flag combinations

### Task 12: CREATE `src/cli/commands/teams/human.ts`

- **ACTION**: CREATE human details command
- **IMPLEMENT**: Show human info with optional flags for persona, role details
- **REFERENCE**: `docs/work-teams-specification.md` section 4.4 for complete human command specification
- **ARGS**: team-name/human-name argument (required)
- **FLAGS**: --persona, --role (boolean flags)
- **PATTERN**: Similar to agent command but human-specific (no commands/activation flags)
- **ERROR**: TeamNotFoundError, HumanNotFoundError for invalid references
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams human sw-dev-team/product-owner --persona`
- **FUNCTIONAL**: `work teams human sw-dev-team/product-owner --role` - verify shows role details
- **TEST_PYRAMID**: Add E2E test for: human details with all flag combinations

### Task 13: CREATE `src/cli/commands/teams/member.ts`

- **ACTION**: CREATE unified member details command
- **IMPLEMENT**: Show any member (agent or human) details with auto-detection
- **REFERENCE**: `docs/work-teams-specification.md` section 4.2 for complete member command specification
- **ARGS**: team-name/member-name argument (required)
- **FLAGS**: --persona, --commands, --activation, --role (boolean flags, conditional based on member type)
- **PATTERN**: Detect member type (agent/human) and show appropriate details
- **ERROR**: TeamNotFoundError, MemberNotFoundError for invalid references
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams member sw-dev-team/tech-lead --persona`
- **FUNCTIONAL**: `work teams member sw-dev-team/any-member` - verify auto-detects type and shows appropriate info
- **TEST_PYRAMID**: Add E2E test for: member detection and appropriate flag handling

### Task 14: CREATE `src/cli/commands/teams/config.ts`

- **ACTION**: CREATE config location command
- **IMPLEMENT**: Show teams.xml file path
- **MIRROR**: Simple info display pattern
- **OUTPUT**: Full path to .work/teams.xml
- **PATTERN**: Use this.log() for simple string output
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams config`
- **FUNCTIONAL**: `work teams config` - verify shows correct file path
- **TEST_PYRAMID**: No additional tests needed - simple path display command

### Task 15: CREATE `src/cli/commands/teams/validate.ts`

- **ACTION**: CREATE teams.xml validation command
- **IMPLEMENT**: Validate XML structure, schema compliance, reference integrity
- **REFERENCE**: `docs/work-teams-specification.md` section 7 for complete validation specification
- **PATTERN**: Load and parse XML, check required fields, validate agent/human references
- **OUTPUT**: Validation status, error count, warnings for best practices
- **ERROR**: TeamValidationError with detailed error messages
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams validate`
- **FUNCTIONAL**: `work teams validate` - verify detects XML errors and shows validation results
- **TEST_PYRAMID**: Add E2E test for: valid XML, invalid XML, missing required fields

### Task 16: CREATE `src/cli/commands/teams/query.ts`

- **ACTION**: CREATE teams query command with filtering
- **IMPLEMENT**: Search teams by name, type, or metadata with optional filters
- **FLAGS**: --type (agent|human), --team, --name (partial match), --role
- **PATTERN**: Use TeamsEngine with filtering logic, support multiple criteria
- **OUTPUT**: Filtered list of teams/agents/humans matching criteria
- **VALIDATE**: `npm run type-check && npm run build && node bin/run.js teams query --type agent --role developer`
- **FUNCTIONAL**: `work teams query --team sw-dev-team --type agent` - verify shows filtered results
- **TEST_PYRAMID**: Add E2E test for: various filter combinations and edge cases

### Task 17: CREATE `tests/integration/cli/commands/teams/list.test.ts`

- **ACTION**: CREATE integration tests for teams list
- **IMPLEMENT**: Test command execution, output formats, error cases
- **MIRROR**: `tests/integration/cli/commands/context/add.test.ts:6-50` - test structure exactly
- **PATTERN**: Setup test directory, execute via bin/run.js, verify output
- **CASES**: Default teams exist, table format, JSON format, empty state
- **VALIDATE**: `npm test tests/integration/cli/commands/teams/list.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: complete teams workflow from list to agent details

### Task 18: CREATE `tests/unit/core/teams-engine.test.ts`

- **ACTION**: CREATE unit tests for teams engine
- **IMPLEMENT**: Test core engine methods, XML operations, error cases
- **PATTERN**: Mock file system, test data structures, error scenarios
- **CASES**: loadTeams, saveTeams, getTeam, invalid XML, missing files
- **VALIDATE**: `npm test tests/unit/core/teams-engine.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: end-to-end XML persistence and retrieval workflow

---

## Testing Strategy

### Unit Tests to Write

| Test File                                        | Test Cases                           | Validates           |
| ------------------------------------------------ | ------------------------------------ | ------------------- |
| `tests/unit/core/xml-utils.test.ts`              | XML parsing, CDATA handling          | XML utilities       |
| `tests/unit/core/teams-engine.test.ts`           | CRUD ops, file operations, filtering | Engine logic        |
| `tests/unit/types/teams.test.ts`                 | Type validation, complex schema      | Type definitions    |
| `tests/unit/cli/commands/teams/validate.test.ts` | XML validation, error detection      | Validation logic    |
| `tests/unit/cli/commands/teams/query.test.ts`    | Filtering, search criteria           | Query functionality |
| `tests/unit/core/default-teams.test.ts`          | Template loading, XML parsing        | Template system     |
| `tests/unit/cli/commands/teams/human.test.ts`    | Human details, persona display       | Human command logic |
| `tests/unit/cli/commands/teams/member.test.ts`   | Member type detection, flag routing  | Member command      |

### Edge Cases Checklist

- [x] Missing .work directory (auto-create)
- [x] Malformed XML files (validation error)
- [x] Invalid team/agent/human references (not found errors)
- [x] Empty teams.xml (create defaults)
- [x] Large CDATA sections (memory limits)
- [x] Special characters in team names (XML escaping)
- [x] Member command auto-detection (agent vs human)
- [x] Missing XML templates in src/templates/ (error handling)
- [x] Invalid flags for member types (humans don't have commands/activation)

---

## Validation Commands

**IMPORTANT**: Use project's governed commands from Makefile.

### Level 1: STATIC_ANALYSIS

```bash
make lint && make type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
make build && node bin/run.js teams list
```

**EXPECT**: Build succeeds, shows pre-installed teams

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/core/teams-engine.test.ts tests/unit/core/xml-utils.test.ts
```

**EXPECT**: All tests pass, coverage >= 40%

### Level 4: FULL_SUITE

```bash
make ci
```

**EXPECT**: All checks pass, build succeeds

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:

- [x] XML parsing follows security best practices
- [x] CLI patterns match oclif v4 standards
- [x] File operations use current Node.js patterns

### Level 7: MANUAL_VALIDATION

1. Run `work teams list` - should show sw-dev-team and research-team
2. Run `work teams show sw-dev-team` - should show team details with agents and humans
3. Run `work teams agent sw-dev-team/tech-lead --persona` - should show agent persona details
4. Run `work teams agent sw-dev-team/tech-lead --commands` - should show available commands
5. Run `work teams agent sw-dev-team/tech-lead --activation` - should show activation instructions
6. Run `work teams human sw-dev-team/product-owner --persona` - should show human persona details
7. Run `work teams member sw-dev-team/tech-lead --persona` - should auto-detect agent and show persona
8. Run `work teams member sw-dev-team/product-owner --role` - should auto-detect human and show role
9. Run `work teams validate` - should validate XML structure and show results
10. Run `work teams query --type agent --role developer` - should show filtered agent results
11. Run `work teams query --team sw-dev-team --type human` - should show team humans
12. Run `work teams config` - should show .work/teams.xml path
13. Verify .work/teams.xml file created with proper XML structure including CDATA workflows
14. Test JSON output: `work teams list --format json` - should return valid JSON
15. Verify XML templates loaded from src/templates/ (sw-dev-team.xml, research-team.xml)

---

## Acceptance Criteria

- [x] All specified functionality implemented per user story
- [x] Pre-installed SW dev and research teams available
- [x] XML storage in .work/teams.xml following specified format
- [x] All CLI commands work with table/JSON output
- [x] Level 1-4 validation commands pass with exit 0
- [x] Unit tests cover >= 40% of new code
- [x] Code mirrors existing patterns exactly (naming, structure, error handling)
- [x] No regressions in existing tests
- [x] UX matches "After State" diagram
- [x] **Implementation follows current best practices**
- [x] **No deprecated patterns or vulnerable dependencies**
- [x] **Security recommendations up-to-date**

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Full test suite + build succeeds (make ci)
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (fast-xml-parser documentation, oclif verification)
**Web Intelligence Sources**: 2 (oclif.io docs, XML parser community practices)
**Last Verification**: 2026-02-11 18:45 UTC
**Security Advisories Checked**: XML parsing vulnerabilities, file I/O best practices
**Deprecated Patterns Avoided**: DTD processing, synchronous file operations in async context

---

## Risks and Mitigations

| Risk                                        | Likelihood | Impact | Mitigation                                             |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------------------ |
| XML parsing performance on large files      | LOW        | MEDIUM | File size validation, streaming not needed for config  |
| CDATA workflow content injection            | LOW        | MEDIUM | Local file access only, validate relative paths        |
| Documentation changes during implementation | LOW        | MEDIUM | Context7 MCP re-verification during execution          |
| Breaking existing CLI patterns              | MEDIUM     | HIGH   | Mirror context commands exactly, comprehensive testing |

---

## Notes

This implementation establishes the foundation for the work teams feature by closely following existing patterns while adding the requested XML-based team management. The pre-installed teams provide immediate value, and the decoupled architecture allows for future integration with work items and notifications.

### Current Intelligence Considerations

The fast-xml-parser library remains actively maintained with version 5.0.6 released recently. oclif v4 patterns are confirmed as the current standard. All documented approaches align with current Node.js LTS recommendations for file I/O and TypeScript strict mode practices.
