# Feature: Notify Command Implementation

## Summary

Implement the complete `work notify` command suite with bash target support, enabling query-based notifications to external scripts. This includes `work notify send`, `work notify target add/list/remove` commands following the existing CLI specification, with built-in bash script execution for logging notifications to `~/.work/notifications/`.

## User Story

As a developer using the work CLI
I want to send work item notifications to external scripts
So that I can integrate task management with external systems and enable human-in-the-loop AI workflows

## Problem Statement

The work CLI currently lacks notification capabilities, preventing integration with external systems and blocking AI agent workflows that require human input. Users need a way to query work items and send results to configurable targets, particularly bash scripts for custom processing.

## Solution Statement

Implement a complete notification system with bash target support that executes queries and sends results to configured scripts, enabling seamless integration with external tools and AI agent workflows.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | NEW_CAPABILITY                                    |
| Complexity             | MEDIUM                                            |
| Systems Affected       | CLI commands, Core engine, Type definitions       |
| Dependencies           | @oclif/core@4.0.0, Node.js child_process         |
| Estimated Tasks        | 13                                                |
| **Research Timestamp** | **2026-01-24T10:46:11.846+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │    User     │ ──────► │  Manual     │ ──────► │   External  │            ║
║   │   Query     │         │  Export     │         │   System    │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: User manually queries work items, copies data, pastes to tools   ║
║   PAIN_POINT: No automated integration, manual copy-paste, no AI workflows    ║
║   DATA_FLOW: work list → manual copy → external tool                          ║
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
║   │    User     │ ──────► │   Notify    │ ──────► │   Bash      │            ║
║   │   Query     │         │   Send      │         │   Script    │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                       │                   ║
║                                   ▼                       ▼                   ║
║                          ┌─────────────┐         ┌─────────────┐            ║
║                          │   Target    │         │ Notification│            ║
║                          │   Config    │         │    Log      │            ║
║                          └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: work notify send where <query> to <target> → automatic execution ║
║   VALUE_ADD: Automated integration, AI workflows, human-in-the-loop patterns  ║
║   DATA_FLOW: work query → notify engine → bash script → external system      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location        | Before          | After       | User_Action | Impact        |
| --------------- | --------------- | ----------- | ----------- | ------------- |
| CLI             | Manual export   | Automated   | notify send | Direct integration |
| Configuration   | No targets      | Target mgmt | target add  | Reusable configs |
| AI Workflows    | Not supported   | Enabled     | assignee handoff | Human-in-loop |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/cli/commands/auth/status.ts` | 1-62 | Command pattern to MIRROR exactly |
| P0 | `src/cli/base-command.ts` | 1-72 | Base class pattern and error handling |
| P0 | `src/cli/formatter.ts` | 1-82 | JSON output formatting pattern |
| P1 | `src/core/engine.ts` | 180-195 | Query execution pattern to FOLLOW |
| P1 | `src/types/context.ts` | 1-138 | Type definitions to EXTEND |
| P2 | `tests/e2e/complete-workflow.test.ts` | 1-30 | E2E test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [oclif.io](https://oclif.io/docs/api_reference) ✓ Current | Nested Commands | Subcommand structure | 2026-01-24T10:46:11Z |
| [Node.js Docs](https://nodejs.org/api/child_process.html) ✓ Current | child_process.spawn | Bash execution | 2026-01-24T10:46:11Z |

---

## Patterns to Mirror

**COMMAND_STRUCTURE:**
```typescript
// SOURCE: src/cli/commands/auth/status.ts:6-25
// COPY THIS PATTERN:
export default class AuthStatus extends BaseCommand {
  static override args = {
    context: Args.string({
      description: 'context name to check status (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Show authentication status';

  static override examples = [
    '<%= config.bin %> auth <%= command.id %>',
    '<%= config.bin %> auth <%= command.id %> my-project',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/cli/base-command.ts:50-72
// COPY THIS PATTERN:
protected handleError(error: string | Error, exitCode = 1): never {
  const argv = process.argv.slice(2);
  const isJsonMode =
    argv.includes('--format=json') ||
    (argv.includes('--format') &&
      argv[argv.indexOf('--format') + 1] === 'json');

  if (isJsonMode) {
    const errorOutput = formatError(error, 'json');
    process.stderr.write(errorOutput);
    process.exit(exitCode);
  }

  return this.error(error instanceof Error ? error.message : error, {
    exit: exitCode,
  });
}
```

**JSON_OUTPUT:**
```typescript
// SOURCE: src/cli/formatter.ts:15-25
// COPY THIS PATTERN:
export function formatOutput<T>(
  data: T,
  format: ResponseFormat,
  meta?: Meta
): string {
  if (format === 'json') {
    const response: SuccessResponse<T> = { data };
    if (meta) {
      response.meta = meta;
    }
    return JSON.stringify(response, null, 2) + '\n';
  }
  return String(data);
}
```

**ENGINE_INTEGRATION:**
```typescript
// SOURCE: src/core/engine.ts:182-195
// COPY THIS PATTERN:
async listWorkItems(queryString?: string): Promise<WorkItem[]> {
  await this.ensureDefaultContext();
  const adapter = this.getActiveAdapter();

  if (!queryString) {
    return adapter.listWorkItems();
  }

  const fullQuery = `where ${queryString}`;
  const query = parseQuery(fullQuery);
  const allItems = await adapter.listWorkItems();

  return executeQuery(allItems, query);
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/e2e/complete-workflow.test.ts:1-25
// COPY THIS PATTERN:
describe('Complete Workflow E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-'));
    process.chdir(testDir);
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });
```

---

## Current Best Practices Validation

**Security (Web Intelligence Verified):**
- [x] Current Node.js child_process security practices followed
- [x] Script path validation to prevent injection attacks
- [x] Environment variable sanitization
- [x] Timeout handling for script execution

**Performance (Web Intelligence Verified):**
- [x] Async spawn() for non-blocking execution
- [x] Stream handling for large outputs
- [x] Memory-efficient JSON processing
- [x] Background execution patterns

**Community Intelligence:**
- [x] oclif nested command patterns validated
- [x] TypeScript child_process typing best practices
- [x] CLI error handling standards current
- [x] JSON output formatting conventions verified

---

## Files to Change

| File                                          | Action | Justification                            |
| --------------------------------------------- | ------ | ---------------------------------------- |
| `src/types/notification.ts`                   | CREATE | Extensible notification type definitions |
| `src/core/notification-service.ts`            | CREATE | Notification engine with handler registry|
| `src/core/target-handlers/bash-handler.ts`    | CREATE | Bash target handler implementation       |
| `src/core/target-handlers/index.ts`           | CREATE | Target handler exports                   |
| `src/cli/commands/notify/send.ts`             | CREATE | notify send command implementation       |
| `src/cli/commands/notify/target/add.ts`       | CREATE | notify target add command                |
| `src/cli/commands/notify/target/list.ts`      | CREATE | notify target list command               |
| `src/cli/commands/notify/target/remove.ts`    | CREATE | notify target remove command             |
| `src/cli/commands/index.ts`                   | UPDATE | Export new notify commands               |
| `src/core/engine.ts`                          | UPDATE | Add notification service integration     |
| `src/types/context.ts`                        | UPDATE | Add notification target configuration    |
| `tests/e2e/notify-workflow.test.ts`           | CREATE | E2E tests for complete notify workflow   |
| `tests/unit/core/notification-service.test.ts`| CREATE | Unit tests for notification service      |
| `tests/unit/cli/commands/notify/send.test.ts` | CREATE | Unit tests for notify send command       |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Telegram target implementation - Next phase after extensible foundation
- Email target implementation - Next phase after extensible foundation
- Webhook targets (HTTP notifications) - Future enhancement
- Real-time/polling notifications - Stateless execution model
- Notification scheduling/cron - External responsibility
- Complex templating beyond basic variable substitution
- Target-specific authentication management - Simplified for MVP

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use `make ci` for complete validation.

**Coverage Targets**: PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%

**Extensibility Note**: This implementation creates the foundation for telegram and email targets by establishing a pluggable handler registry pattern. Future targets can be added by implementing the TargetHandler interface and registering with the NotificationService.

### Task 1: CREATE `src/types/notification.ts`

- **ACTION**: CREATE notification type definitions
- **IMPLEMENT**: NotificationTarget, NotificationRequest, target config interfaces with extensible design
- **MIRROR**: `src/types/context.ts:1-40` - follow interface pattern
- **IMPORTS**: None - pure type definitions
- **TYPES**: 
  ```typescript
  export type TargetType = 'bash' | 'telegram' | 'email';
  
  export interface NotificationTarget {
    readonly name: string;
    readonly type: TargetType;
    readonly config: TargetConfig;
  }
  
  export type TargetConfig = BashTargetConfig | TelegramTargetConfig | EmailTargetConfig;
  
  export interface BashTargetConfig {
    readonly type: 'bash';
    readonly script: string;
    readonly timeout?: number;
  }
  
  export interface TelegramTargetConfig {
    readonly type: 'telegram';
    readonly botToken: string;
    readonly chatId: string;
  }
  
  export interface EmailTargetConfig {
    readonly type: 'email';
    readonly to: string;
    readonly from?: string;
    readonly smtpHost?: string;
  }
  ```
- **GOTCHA**: Use readonly properties for immutability
- **CURRENT**: TypeScript 5.4+ interface patterns
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 2: CREATE `src/core/notification-service.ts`

- **ACTION**: CREATE notification execution engine with extensible target system
- **IMPLEMENT**: NotificationService class with target registry and pluggable handlers
- **MIRROR**: `src/core/engine.ts:22-50` - class structure pattern
- **IMPORTS**: `import { spawn } from 'child_process'`, notification types
- **PATTERN**: 
  ```typescript
  export class NotificationService {
    private targetHandlers = new Map<TargetType, TargetHandler>();
    
    constructor() {
      // Register built-in handlers
      this.registerHandler('bash', new BashTargetHandler());
    }
    
    registerHandler(type: TargetType, handler: TargetHandler): void
    async sendNotification(workItems: WorkItem[], target: NotificationTarget): Promise<void>
  }
  
  interface TargetHandler {
    send(workItems: WorkItem[], config: TargetConfig): Promise<void>;
  }
  ```
- **GOTCHA**: Use handler registry pattern for extensibility, validate config types at runtime
- **CURRENT**: TypeScript discriminated unions for type safety
- **VALIDATE**: `npx tsc --noEmit && npm run lint`
- **TEST_PYRAMID**: Add integration test for: handler registration and target type validation

### Task 3: CREATE `src/cli/commands/notify/send.ts`

- **ACTION**: CREATE notify send command
- **IMPLEMENT**: Parse query, execute via engine, send to target
- **MIRROR**: `src/cli/commands/list.ts:1-50` - query parsing pattern
- **IMPORTS**: `import { Args, Flags } from '@oclif/core'`, BaseCommand, WorkEngine
- **PATTERN**: 
  ```typescript
  static override args = {
    subcommand: Args.string({ description: 'where', required: true }),
    query: Args.string({ description: 'query expression', required: true }),
    to: Args.string({ description: 'to', required: true }),
    target: Args.string({ description: 'target name', required: true }),
  };
  ```
- **GOTCHA**: Validate 'where' and 'to' keywords, handle missing targets gracefully
- **CURRENT**: oclif 4.0 argument parsing patterns
- **VALIDATE**: `npx tsc --noEmit && npm run build && ./bin/run.js notify send --help`
- **FUNCTIONAL**: `./bin/run.js notify send where state=new to test-target` - verify parsing
- **TEST_PYRAMID**: Add E2E test for: complete notify send workflow with actual script execution

### Task 4: CREATE `src/cli/commands/notify/target/add.ts`

- **ACTION**: CREATE notify target add command
- **IMPLEMENT**: Add target configuration to context
- **MIRROR**: `src/cli/commands/context/add.ts:1-40` - configuration pattern
- **IMPORTS**: BaseCommand, WorkEngine, notification types
- **PATTERN**: 
  ```typescript
  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'target type',
      options: ['bash', 'telegram', 'email'],
      required: true,
    }),
    script: Flags.string({
      description: 'bash script path (for bash type)',
      dependsOn: ['type'],
    }),
    'bot-token': Flags.string({
      description: 'telegram bot token (for telegram type)',
      dependsOn: ['type'],
    }),
    'chat-id': Flags.string({
      description: 'telegram chat ID (for telegram type)',
      dependsOn: ['type'],
    }),
    to: Flags.string({
      description: 'email recipient (for email type)',
      dependsOn: ['type'],
    }),
  };
  ```
- **GOTCHA**: Validate target type and required flags per type, extensible validation logic
- **CURRENT**: File system validation best practices
- **VALIDATE**: `npx tsc --noEmit && ./bin/run.js notify target add --help`
- **FUNCTIONAL**: `./bin/run.js notify target add test --type bash --script /bin/echo`
- **TEST_PYRAMID**: Add integration test for: target configuration persistence and validation

### Task 5: CREATE `src/cli/commands/notify/target/list.ts`

- **ACTION**: CREATE notify target list command
- **IMPLEMENT**: List configured targets for active context
- **MIRROR**: `src/cli/commands/context/list.ts:1-30` - list pattern
- **IMPORTS**: BaseCommand, WorkEngine
- **PATTERN**: Table and JSON output formats
- **VALIDATE**: `npx tsc --noEmit && ./bin/run.js notify target list --format json`
- **FUNCTIONAL**: `./bin/run.js notify target list` - verify output formatting
- **TEST_PYRAMID**: No additional tests needed - simple list operation

### Task 6: CREATE `src/cli/commands/notify/target/remove.ts`

- **ACTION**: CREATE notify target remove command
- **IMPLEMENT**: Remove target from context configuration
- **MIRROR**: `src/cli/commands/context/remove.ts:1-30` - remove pattern
- **IMPORTS**: BaseCommand, WorkEngine
- **PATTERN**: Validate target exists before removal
- **VALIDATE**: `npx tsc --noEmit && ./bin/run.js notify target remove --help`
- **FUNCTIONAL**: `./bin/run.js notify target remove test-target`
- **TEST_PYRAMID**: Add integration test for: target removal and error handling

### Task 7: UPDATE `src/cli/commands/index.ts`

- **ACTION**: UPDATE command exports
- **IMPLEMENT**: Export new notify commands
- **MIRROR**: `src/cli/commands/index.ts:20-30` - export pattern
- **PATTERN**: Named exports for all notify subcommands
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - export file only

### Task 8: UPDATE `src/types/context.ts`

- **ACTION**: UPDATE Context interface
- **IMPLEMENT**: Add notificationTargets property
- **MIRROR**: `src/types/context.ts:35-45` - interface extension pattern
- **PATTERN**: Optional readonly array of NotificationTarget
- **GOTCHA**: Maintain backward compatibility with existing contexts
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: Add integration test for: context serialization with notification targets

### Task 9: UPDATE `src/core/engine.ts`

- **ACTION**: UPDATE WorkEngine class
- **IMPLEMENT**: Add notification methods (addTarget, removeTarget, listTargets, sendNotification)
- **MIRROR**: `src/core/engine.ts:100-150` - method pattern
- **IMPORTS**: NotificationService, notification types
- **PATTERN**: Delegate to NotificationService, handle context persistence
- **VALIDATE**: `npx tsc --noEmit && npm run build`
- **TEST_PYRAMID**: Add integration test for: engine notification integration with context management

### Task 10: CREATE `src/core/target-handlers/bash-handler.ts`

- **ACTION**: CREATE bash target handler implementation
- **IMPLEMENT**: BashTargetHandler class implementing TargetHandler interface
- **MIRROR**: `src/adapters/local-fs/index.ts:1-30` - adapter pattern
- **IMPORTS**: `import { spawn } from 'child_process'`, TargetHandler interface
- **PATTERN**: Implement send method, handle work:log built-in script
- **GOTCHA**: Handle built-in scripts vs custom scripts, timeout management
- **VALIDATE**: Test script execution manually
- **FUNCTIONAL**: Verify JSON logging works correctly
- **TEST_PYRAMID**: Add integration test for: bash handler with built-in and custom scripts

### Task 11: CREATE `src/core/target-handlers/index.ts`

- **ACTION**: CREATE target handler exports
- **IMPLEMENT**: Export all target handlers for registration
- **MIRROR**: `src/adapters/index.ts:1-10` - export pattern
- **PATTERN**: Named exports for handler classes
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - export file only

### Task 12: CREATE `tests/e2e/notify-workflow.test.ts`

- **ACTION**: CREATE E2E tests
- **IMPLEMENT**: Complete workflow tests for all user journeys
- **MIRROR**: `tests/e2e/complete-workflow.test.ts:1-50` - E2E pattern
- **PATTERN**: Test target management, notify send, human-in-loop workflow
- **VALIDATE**: `npm test tests/e2e/notify-workflow.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: end-to-end notification workflow covering all major user paths

### Task 13: CREATE `tests/unit/core/notification-service.test.ts`

- **ACTION**: CREATE unit tests for NotificationService
- **IMPLEMENT**: Test script execution, error handling, timeout scenarios
- **MIRROR**: `tests/unit/core/engine.test.ts:1-50` - unit test pattern
- **PATTERN**: Mock child_process.spawn, test edge cases
- **VALIDATE**: `npm test tests/unit/core/notification-service.test.ts -- --coverage`
- **TEST_PYRAMID**: Add integration test for: notification service with mocked script execution and error scenarios

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/unit/core/notification-service.test.ts` | script execution, timeouts | Service logic |
| `tests/unit/cli/commands/notify/send.test.ts` | argument parsing, validation | Command logic |
| `tests/e2e/notify-workflow.test.ts` | complete workflows | Integration |

### Edge Cases Checklist

- [ ] Non-existent script paths
- [ ] Script execution timeouts
- [ ] Invalid target configurations
- [ ] Missing notification targets
- [ ] Script execution failures
- [ ] Large JSON payloads to scripts
- [ ] Permission denied scenarios
- [ ] Human-in-the-loop assignee handoff pattern

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && ./bin/run.js notify --help
```

**EXPECT**: Build succeeds, help displays notify subcommands

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/core/notification-service.test.ts tests/unit/cli/commands/notify/
```

**EXPECT**: All tests pass, coverage >= 40% (MVP target)

### Level 4: FULL_SUITE

```bash
npm test -- --coverage && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: MANUAL_VALIDATION

1. **Setup target**: `./bin/run.js notify target add test-log --type bash --script work:log`
2. **Create work items**: `./bin/run.js create "Test notification" --priority high`
3. **Send notification**: `./bin/run.js notify send where priority=high to test-log`
4. **Verify log file**: Check `~/.work/notifications/` for JSON log file
5. **Test human-in-loop**: 
   - `./bin/run.js create "Need input" --assignee human-alice`
   - `./bin/run.js notify send where assignee=human-alice to test-log`
   - Verify notification contains assignee information

---

## Acceptance Criteria

- [ ] All notify commands implemented per CLI specification
- [ ] Bash target executes scripts with JSON data
- [ ] Built-in work:log script creates notification files
- [ ] Target configuration persists in context
- [ ] JSON and table output formats supported
- [ ] Human-in-the-loop assignee handoff pattern works
- [ ] Level 1-4 validation commands pass with exit 0
- [ ] Unit tests cover >= 40% of new code (MVP target)
- [ ] Code mirrors existing patterns exactly (naming, structure, error handling)
- [ ] No regressions in existing tests
- [ ] All user journeys from specification work end-to-end

---

## Completion Checklist

- [ ] All 12 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: Manual validation completed
- [ ] All acceptance criteria met
- [ ] Human-in-the-loop workflow tested

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (oclif patterns, Node.js child_process)
**Web Intelligence Sources**: 2 (oclif documentation, Node.js best practices)
**Last Verification**: 2026-01-24T10:46:11.846+01:00
**Security Advisories Checked**: Node.js child_process security patterns validated
**Deprecated Patterns Avoided**: exec() in favor of spawn(), synchronous file operations

---

## Risks and Mitigations

| Risk                                        | Likelihood   | Impact       | Mitigation                                    |
| ------------------------------------------- | ------------ | ------------ | --------------------------------------------- |
| Script execution security vulnerabilities   | MEDIUM       | HIGH         | Path validation, timeout limits, no shell=true |
| Large JSON payloads causing memory issues   | LOW          | MEDIUM       | Stream processing, size limits in service     |
| Script execution blocking CLI commands      | LOW          | MEDIUM       | Async spawn with proper error handling        |
| Context configuration corruption            | LOW          | MEDIUM       | Atomic writes, backup before modification     |

---

## Notes

### Design Decisions

- **Extensible target system**: Handler registry pattern enables easy addition of telegram/email targets
- **Discriminated unions**: TypeScript type safety for different target configurations
- **Built-in work:log script**: Provides immediate value without external dependencies  
- **Context-scoped targets**: Aligns with existing context isolation model
- **JSON data passing**: Standard format for script integration
- **Pluggable architecture**: NotificationService accepts handler registration for future targets

### Human-in-the-Loop Integration

The assignee handoff pattern enables AI agents to signal when human input is needed:
1. Agent assigns task to human when blocked
2. Human gets notified via `work notify send where assignee=human-name to alerts`
3. Human provides input and reassigns to agent
4. Agent detects reassignment via periodic notification queries

### Future Considerations

- **Telegram target**: Handler for Telegram Bot API integration (next phase)
- **Email target**: SMTP-based email notifications (next phase)
- **Webhook targets**: HTTP-based integrations for external services
- **Template system**: Custom message formatting beyond basic JSON
- **Notification history**: Audit logging and delivery tracking
- **Plugin system**: External npm packages as notification targets
- **Authentication management**: Secure credential storage per target type

### Current Intelligence Considerations

Implementation follows current oclif 4.0 patterns for nested commands and leverages modern Node.js child_process best practices for secure script execution. All patterns verified against 2024 community standards.
