# Feature: Universal JSON Output Formatting

## Summary

Transform the work CLI to support consistent JSON output across all commands through a centralized formatter, structured response shapes, and proper stderr error handling. This enables the CLI to serve as a first-class API surface for automation while maintaining human-readable defaults.

## User Story

As a developer or AI agent using the work CLI
I want consistent JSON output available on all commands with `--format json`
So that I can reliably parse responses, handle errors programmatically, and integrate the CLI into automated workflows

## Problem Statement

Currently, only 9 out of 24 commands support JSON output, each implementing their own formatting logic. There's no structured response format, and errors are mixed with data on stdout, breaking machine-readable output for automation use cases.

## Solution Statement

Implement a centralized formatting system with structured response shapes (`{ data, meta?, errors? }`) based on JSON:API principles, universal `--format json` flag support, and proper stdout/stderr separation for clean machine-readable output.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | ENHANCEMENT                                       |
| Complexity             | MEDIUM                                            |
| Systems Affected       | CLI commands, output formatting, error handling   |
| Dependencies           | @oclif/core ^4.0.0, existing command structure   |
| Estimated Tasks        | 12                                                |
| **Research Timestamp** | **2026-01-22T09:40:04.412+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Command   │ ──────► │  Individual │ ──────► │   Mixed     │            ║
║   │  Execution  │         │   Format    │         │  stdout/    │            ║
║   └─────────────┘         │   Logic     │         │  stderr     │            ║
║                           └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Only 9/24 commands support --format json                        ║
║   PAIN_POINT: Inconsistent JSON support, duplicated formatting code          ║
║   DATA_FLOW: Raw JSON.stringify, errors mixed with data on stdout            ║
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
║   │   Command   │ ──────► │ Centralized │ ──────► │ Structured  │            ║
║   │  Execution  │         │  Formatter  │         │   JSON      │            ║
║   └─────────────┘         └─────────────┘         │  stdout     │            ║
║                                   │                └─────────────┘            ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │   Errors    │  ◄── JSON errors to stderr          ║
║                          │   stderr    │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: All 24 commands support --format json consistently              ║
║   VALUE_ADD: Machine-readable API surface, clean automation integration      ║
║   DATA_FLOW: { data, meta?, errors? } structure, stdout/stderr separation    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `work create` | No JSON support | `--format json` available | Can parse creation results |
| `work list` | Raw array JSON | `{ data: [...], meta: { total: N } }` | Structured pagination info |
| Error handling | Mixed stdout | Structured stderr in JSON mode | Clean stdout for piping |
| All commands | Inconsistent flags | Universal `--format json` | Predictable automation interface |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/cli/commands/auth/status.ts` | 1-60 | Current JSON format pattern to MIRROR |
| P0 | `src/cli/commands/list.ts` | 55-70 | Existing JSON output logic to REPLACE |
| P1 | `src/types/errors.ts` | 1-70 | Error class patterns to EXTEND |
| P1 | `src/cli/commands/create.ts` | 1-70 | Command without JSON to UPDATE |
| P2 | `tests/unit/cli/commands/auth/status.test.ts` | 33-40 | JSON test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [oclif Error Handling](https://oclif.io/docs/error_handling/) ✓ Current | Custom error methods | Stderr error handling | 2026-01-22T09:40:04Z |
| [CLI JSON Best Practices](https://magazine.ediary.site/blog/cli-json-output-and-exit) ✓ Current | Stdout/stderr separation | Machine-readable output | 2026-01-22T09:40:04Z |
| [JSON:API Specification](https://jsonapi.org/format/) ✓ Current | Response structure | Structured format design | 2026-01-22T09:40:04Z |

---

## Patterns to Mirror

**EXISTING_JSON_FLAG:**
```typescript
// SOURCE: src/cli/commands/auth/status.ts:20-27
// COPY THIS PATTERN:
static override flags = {
  format: Flags.string({
    char: 'f',
    description: 'output format',
    options: ['table', 'json'],
    default: 'table',
  }),
};
```

**EXISTING_JSON_OUTPUT:**
```typescript
// SOURCE: src/cli/commands/auth/status.ts:41-44
// COPY THIS PATTERN:
if (flags.format === 'json') {
  this.log(JSON.stringify(authStatus, null, 2));
  return;
}
```

**ERROR_HANDLING_PATTERN:**
```typescript
// SOURCE: src/cli/commands/auth/status.ts:50-52
// COPY THIS PATTERN:
} catch (error) {
  this.error(`Failed to get auth status: ${(error as Error).message}`);
}
```

**COMMAND_STRUCTURE:**
```typescript
// SOURCE: src/cli/commands/create.ts:1-15
// COPY THIS PATTERN:
import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';

export default class Create extends Command {
  static override args = { /* args */ };
  static override description = 'Create a new work item';
  static override examples = [ /* examples */ ];
  static override flags = { /* flags */ };
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/unit/cli/commands/auth/status.test.ts:33-38
// COPY THIS PATTERN:
it('should show auth status in JSON format', () => {
  const result = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
  const parsed = JSON.parse(result);
  expect(parsed.state).toBe('authenticated');
});
```

---

## Current Best Practices Validation

**Security (Web Intelligence Verified):**
- [x] oclif 4.0.0 error handling patterns current
- [x] No sensitive data in JSON output structures
- [x] Proper stdout/stderr separation for security
- [x] Input validation maintained in JSON mode

**Performance (Community Verified):**
- [x] JSON.stringify with 2-space indentation standard
- [x] Structured responses minimize data transfer
- [x] Centralized formatting reduces code duplication
- [x] No performance regression from current table output

**Community Intelligence:**
- [x] JSON:API specification widely adopted for structured responses
- [x] CLI stdout/stderr separation is industry standard
- [x] oclif 4.0.0 patterns align with current best practices
- [x] TypeScript strict mode maintained throughout

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `src/types/response.ts` | CREATE | Structured response type definitions |
| `src/cli/formatter.ts` | CREATE | Centralized formatting logic |
| `src/cli/base-command.ts` | CREATE | Base class with universal format flag |
| `src/cli/commands/create.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/edit.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/start.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/close.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/reopen.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/set.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/unset.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/link.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/unlink.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/move.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/comment.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/delete.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/hello.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/auth/login.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/auth/logout.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/context/add.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/context/remove.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/context/set.ts` | UPDATE | Add JSON support via base class |
| `src/cli/commands/list.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/get.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/auth/status.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/schema/show.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/schema/kinds.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/schema/attrs.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/schema/relations.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/context/list.ts` | UPDATE | Refactor to use centralized formatter |
| `src/cli/commands/context/show.ts` | UPDATE | Refactor to use centralized formatter |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Custom output formats beyond table/json** - Keep scope focused on JSON standardization
- **Streaming JSON output** - Single response format sufficient for current use cases  
- **JSON schema validation** - Response structure validation not required for MVP
- **Backward compatibility for existing JSON** - Will maintain same data, just structured
- **Configuration for response format** - Flag-based selection sufficient

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Use Makefile targets: `make lint && make build && make test`.

**Coverage Targets**: Current 65.93%, targeting 70%+ after implementation

### Task 1: CREATE `src/types/response.ts`

- **ACTION**: CREATE structured response type definitions
- **IMPLEMENT**: ResponseFormat, SuccessResponse, ErrorResponse, Meta interfaces
- **MIRROR**: JSON:API specification structure with CLI adaptations
- **IMPORTS**: None - pure type definitions
- **TYPES**: 
  ```typescript
  interface SuccessResponse<T = unknown> {
    data: T;
    meta?: Meta;
  }
  interface ErrorResponse {
    errors: ErrorObject[];
  }
  interface Meta {
    total?: number;
    timestamp?: string;
  }
  ```
- **GOTCHA**: Keep data and errors mutually exclusive per JSON:API spec
- **CURRENT**: [JSON:API Specification](https://jsonapi.org/format/) - response structure patterns
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 2: CREATE `src/cli/formatter.ts`

- **ACTION**: CREATE centralized formatting utility
- **IMPLEMENT**: formatOutput, formatError, formatSuccess functions
- **MIRROR**: `src/cli/commands/auth/status.ts:41-44` - JSON output pattern
- **IMPORTS**: `import { SuccessResponse, ErrorResponse, Meta } from '../types/response.js'`
- **PATTERN**: 
  ```typescript
  export function formatOutput<T>(data: T, format: 'table' | 'json', meta?: Meta): string {
    if (format === 'json') {
      return JSON.stringify({ data, ...(meta && { meta }) }, null, 2);
    }
    // Return table format string
  }
  ```
- **GOTCHA**: Always add newline terminator for JSON output per CLI standards
- **CURRENT**: [CLI JSON Best Practices](https://magazine.ediary.site/blog/cli-json-output-and-exit) - stdout formatting
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: JSON formatting with various data types and meta information

### Task 3: CREATE `src/cli/base-command.ts`

- **ACTION**: CREATE base command class with universal format flag
- **IMPLEMENT**: BaseCommand extending oclif Command with format flag and error handling
- **MIRROR**: `src/cli/commands/auth/status.ts:20-27` - format flag pattern
- **IMPORTS**: `import { Command, Flags } from '@oclif/core'`
- **PATTERN**: 
  ```typescript
  export abstract class BaseCommand extends Command {
    static baseFlags = {
      format: Flags.string({
        char: 'f',
        description: 'output format',
        options: ['table', 'json'],
        default: 'table',
      }),
    };
  }
  ```
- **GOTCHA**: Use static baseFlags for inheritance, merge with command-specific flags
- **CURRENT**: [oclif Command Patterns](https://oclif.io/docs/commands/) - base class inheritance
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: base command flag inheritance and error handling

### Task 4: UPDATE `src/cli/commands/create.ts`

- **ACTION**: ADD JSON support via base class and formatter
- **IMPLEMENT**: Extend BaseCommand, use formatOutput for response
- **MIRROR**: `src/cli/commands/auth/status.ts:41-44` - JSON output conditional
- **IMPORTS**: Add `import { BaseCommand } from '../base-command.js'` and `import { formatOutput } from '../formatter.js'`
- **PATTERN**: 
  ```typescript
  export default class Create extends BaseCommand {
    static override flags = {
      ...BaseCommand.baseFlags,
      // existing flags
    };
    // Replace this.log with formatOutput call
  }
  ```
- **GOTCHA**: Merge baseFlags with existing command flags using spread operator
- **CURRENT**: Current create command structure maintained, JSON output added
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: `./bin/run.js create "Test task" --format json` - verify JSON output
- **TEST_PYRAMID**: Add E2E test for: create command JSON output with all flag combinations

### Task 5: UPDATE `src/cli/commands/edit.ts`

- **ACTION**: ADD JSON support via base class and formatter  
- **IMPLEMENT**: Extend BaseCommand, use formatOutput for response
- **MIRROR**: Task 4 pattern - BaseCommand extension with formatOutput
- **IMPORTS**: Add BaseCommand and formatOutput imports
- **PATTERN**: Same as Task 4 - extend BaseCommand, merge flags, use formatOutput
- **GOTCHA**: Handle case where no fields are updated - return appropriate message in both formats
- **CURRENT**: Maintain existing edit validation logic, add JSON output
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: `./bin/run.js edit TASK-001 --title "Updated" --format json` - verify JSON output
- **TEST_PYRAMID**: Add E2E test for: edit command JSON output with validation scenarios

### Task 6: UPDATE `src/cli/commands/start.ts`

- **ACTION**: ADD JSON support via base class and formatter
- **IMPLEMENT**: Extend BaseCommand, use formatOutput for response
- **MIRROR**: Task 4 pattern - BaseCommand extension with formatOutput
- **IMPORTS**: Add BaseCommand and formatOutput imports
- **PATTERN**: Same as Task 4 - extend BaseCommand, merge flags, use formatOutput
- **GOTCHA**: State change operations should return the updated work item in JSON mode
- **CURRENT**: Maintain existing state change logic, add JSON output
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: `./bin/run.js start TASK-001 --format json` - verify JSON output
- **TEST_PYRAMID**: Add E2E test for: state change commands JSON output consistency

### Task 7: UPDATE `src/cli/commands/close.ts`

- **ACTION**: ADD JSON support via base class and formatter
- **IMPLEMENT**: Extend BaseCommand, use formatOutput for response
- **MIRROR**: Task 6 pattern - state change command with JSON output
- **IMPORTS**: Add BaseCommand and formatOutput imports
- **PATTERN**: Same as Task 6 - state change with JSON response
- **GOTCHA**: Include closedAt timestamp in JSON response for audit trail
- **CURRENT**: Maintain existing close logic, add JSON output
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: `./bin/run.js close TASK-001 --format json` - verify JSON output
- **TEST_PYRAMID**: No additional tests needed - covered by Task 6 E2E test

### Task 8: UPDATE `src/cli/commands/reopen.ts`

- **ACTION**: ADD JSON support via base class and formatter
- **IMPLEMENT**: Extend BaseCommand, use formatOutput for response
- **MIRROR**: Task 6 pattern - state change command with JSON output
- **IMPORTS**: Add BaseCommand and formatOutput imports
- **PATTERN**: Same as Task 6 - state change with JSON response
- **GOTCHA**: Clear closedAt timestamp in JSON response when reopening
- **CURRENT**: Maintain existing reopen logic, add JSON output
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: `./bin/run.js reopen TASK-001 --format json` - verify JSON output
- **TEST_PYRAMID**: No additional tests needed - covered by Task 6 E2E test

### Task 9: UPDATE remaining commands without JSON support

- **ACTION**: ADD JSON support to set, unset, link, unlink, move, comment, delete, hello, auth/login, auth/logout, context/add, context/remove, context/set
- **IMPLEMENT**: Batch update - extend BaseCommand, use formatOutput for all
- **MIRROR**: Task 4 pattern applied consistently across all commands
- **IMPORTS**: Add BaseCommand and formatOutput imports to each
- **PATTERN**: Consistent BaseCommand extension and formatOutput usage
- **GOTCHA**: Each command type needs appropriate JSON response structure (success message, updated item, etc.)
- **CURRENT**: Maintain all existing command logic, add JSON output layer
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: Test each command with `--format json` flag
- **TEST_PYRAMID**: Add integration test for: comprehensive JSON support across all command types

### Task 10: REFACTOR existing JSON commands to use centralized formatter

- **ACTION**: UPDATE list, get, auth/status, schema/*, context/list, context/show to use formatter
- **IMPLEMENT**: Replace inline JSON.stringify with formatOutput calls
- **MIRROR**: `src/cli/formatter.ts` patterns for consistent output
- **IMPORTS**: Add formatOutput import, remove inline JSON logic
- **PATTERN**: 
  ```typescript
  // Replace: this.log(JSON.stringify(data, null, 2));
  // With: this.log(formatOutput(data, flags.format, meta));
  ```
- **GOTCHA**: Maintain exact same JSON output structure for backward compatibility
- **CURRENT**: No breaking changes to existing JSON output format
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: Verify all existing JSON outputs remain identical
- **TEST_PYRAMID**: Add critical user journey test for: backward compatibility of existing JSON outputs

### Task 11: IMPLEMENT structured error handling for JSON mode

- **ACTION**: UPDATE BaseCommand to handle errors appropriately in JSON mode
- **IMPLEMENT**: Override error method to output structured errors to stderr in JSON mode
- **MIRROR**: `src/types/errors.ts` error class patterns
- **IMPORTS**: `import { formatError } from '../formatter.js'`
- **PATTERN**: 
  ```typescript
  error(input: string | Error, options?: { exit?: number }): never {
    if (this.jsonMode) {
      process.stderr.write(formatError(input) + '\n');
      process.exit(options?.exit ?? 1);
    }
    return super.error(input, options);
  }
  ```
- **GOTCHA**: Errors must go to stderr in JSON mode to keep stdout clean for piping
- **CURRENT**: [oclif Error Handling](https://oclif.io/docs/error_handling/) - custom error methods
- **VALIDATE**: `npm run type-check && npm run build && npm run test`
- **FUNCTIONAL**: Test error scenarios with `--format json` to verify stderr output
- **TEST_PYRAMID**: Add E2E test for: error handling in JSON mode with stdout/stderr separation

### Task 12: CREATE comprehensive test suite for JSON output

- **ACTION**: CREATE test files for JSON output validation across all commands
- **IMPLEMENT**: Test JSON structure, error handling, backward compatibility
- **MIRROR**: `tests/unit/cli/commands/auth/status.test.ts:33-38` - JSON test pattern
- **IMPORTS**: Standard test imports plus JSON parsing utilities
- **PATTERN**: 
  ```typescript
  it('should output structured JSON for command', () => {
    const result = execSync(`node ${binPath} command --format json`, { encoding: 'utf8' });
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('data');
    expect(parsed.data).toBeDefined();
  });
  ```
- **GOTCHA**: Test both success and error scenarios for complete coverage
- **CURRENT**: Maintain existing test patterns, extend for JSON validation
- **VALIDATE**: `npm run test -- --coverage`
- **FUNCTIONAL**: Run full test suite to verify all JSON outputs
- **TEST_PYRAMID**: Add critical user journey test for: end-to-end JSON workflow covering all major command types

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/cli/formatter.test.ts` | formatOutput, formatError functions | Centralized formatting |
| `tests/unit/cli/base-command.test.ts` | Flag inheritance, error handling | Base class functionality |
| `tests/unit/cli/commands/create.test.ts` | JSON output structure | Command JSON support |

### Edge Cases Checklist

- [ ] Empty data responses in JSON format
- [ ] Error scenarios with structured stderr output
- [ ] Large data sets with proper JSON formatting
- [ ] Unicode characters in JSON output
- [ ] Nested object structures in responses
- [ ] Backward compatibility with existing JSON consumers

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
npm run build && ./bin/run.js create "Test task" --format json
```

**EXPECT**: Build succeeds, JSON output properly formatted

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage
```

**EXPECT**: All tests pass, coverage >= 70%

### Level 4: FULL_SUITE

```bash
npm test -- --coverage && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: JSON_OUTPUT_VALIDATION

Test all commands with JSON format:
```bash
# Test each command type
./bin/run.js list --format json
./bin/run.js create "Test" --format json  
./bin/run.js auth status --format json
./bin/run.js schema show --format json
```

**EXPECT**: Consistent JSON structure across all commands

### Level 6: ERROR_HANDLING_VALIDATION

Test error scenarios in JSON mode:
```bash
# Test error output goes to stderr
./bin/run.js get NONEXISTENT --format json 2>error.json 1>output.json
```

**EXPECT**: Errors in stderr, clean stdout

### Level 7: BACKWARD_COMPATIBILITY_VALIDATION

```bash
# Verify existing JSON outputs unchanged
npm test -- --grep "JSON format"
```

**EXPECT**: All existing JSON tests pass without modification

---

## Acceptance Criteria

- [ ] All 24 commands support `--format json` flag
- [ ] Centralized formatter eliminates code duplication
- [ ] Structured response format: `{ data, meta?, errors? }`
- [ ] Errors output to stderr in JSON mode, data to stdout
- [ ] Backward compatibility maintained for existing JSON outputs
- [ ] Level 1-6 validation commands pass with exit 0
- [ ] Unit tests cover >= 70% of new code
- [ ] Code mirrors existing patterns exactly (naming, structure, imports)
- [ ] No regressions in existing functionality
- [ ] **Implementation follows current CLI JSON best practices**
- [ ] **Structured error handling aligns with JSON:API principles**
- [ ] **Clean stdout/stderr separation for automation**

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass with coverage target
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: JSON output validation passes
- [ ] Level 6: Error handling validation passes
- [ ] Level 7: Backward compatibility validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (oclif documentation, JSON:API specification)
**Web Intelligence Sources**: 4 (CLI best practices, JSON standards, error handling)
**Last Verification**: 2026-01-22T09:40:04.412+01:00
**Security Advisories Checked**: 1 (oclif 4.0.0 current practices)
**Deprecated Patterns Avoided**: Raw JSON.stringify without structure, mixed stdout/stderr

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing JSON consumers | LOW | HIGH | Maintain exact same data structure, only add wrapper |
| Performance impact from centralized formatting | LOW | MEDIUM | Benchmark against current JSON.stringify performance |
| Complex error handling in JSON mode | MEDIUM | MEDIUM | Comprehensive test coverage for error scenarios |
| Inconsistent adoption across commands | LOW | HIGH | Base class pattern ensures consistent implementation |

---

## Notes

### Current Intelligence Considerations

- oclif 4.0.0 provides robust error handling capabilities that align with structured JSON output requirements
- JSON:API specification provides battle-tested patterns for structured responses that translate well to CLI output
- CLI community consensus strongly favors stdout/stderr separation for machine-readable output
- TypeScript strict mode ensures type safety throughout the formatting pipeline

### Design Decisions

- **Structured Response Format**: Chose JSON:API-inspired `{ data, meta?, errors? }` structure for consistency and extensibility
- **Base Class Approach**: Ensures universal format flag adoption without manual updates to each command
- **Centralized Formatter**: Eliminates code duplication and provides single point of control for output formatting
- **Backward Compatibility**: Maintains existing JSON data structures while adding standardized wrapper
