# Feature: Enhanced Where Clause Features

## Summary

Enhance the existing query parsing system to support comparison operators (>, <, >=, <=, !=), logical operators (AND, OR, NOT), and date/time comparisons. This transforms the basic field=value filtering into a robust query language that matches the CLI specification examples while maintaining backward compatibility.

## User Story

As a work CLI user
I want to use advanced query operators in where clauses
So that I can filter work items with complex conditions like "priority=high AND state=active" or "createdAt>2024-01-01"

## Problem Statement

The current where clause implementation only supports simple field=value equality comparisons with comma-separated conditions. The CLI specification shows examples using "AND" operators and the notification system expects more sophisticated querying capabilities.

## Solution Statement

Replace the existing simple query parser with a new structured query language supporting comparison operators, logical operators, and date parsing. Use a clean implementation that removes the comma-separated fallback and implements proper operator precedence.

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | ENHANCEMENT                                       |
| Complexity             | MEDIUM                                            |
| Systems Affected       | core/query, types/errors, CLI commands           |
| Dependencies           | None (pure TypeScript implementation)             |
| Estimated Tasks        | 6                                                 |
| **Research Timestamp** | **2026-01-21T20:40:20.631+01:00**                |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │ work list   │ ──────► │ Simple      │ ──────► │ Basic       │            ║
║   │ where       │         │ field=value │         │ filtering   │            ║
║   │ state=active│         │ parsing     │         │ only        │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: work list where state=active,priority=high (comma-separated)     ║
║   PAIN_POINT: Cannot use AND/OR logic, no comparison operators               ║
║   DATA_FLOW: Query string → split by comma → field=value pairs → filter      ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │ work list   │ ──────► │ Enhanced    │ ──────► │ Advanced    │            ║
║   │ where       │         │ query       │         │ filtering   │            ║
║   │ priority>med│         │ parsing     │         │ with logic  │            ║
║   │ AND state=  │         │             │         │             │            ║
║   │ active      │         │             │         │             │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ Date/Time   │  ◄── createdAt>2024-01-01            ║
║                          │ Comparisons │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: work list where priority=high AND state=active                   ║
║   VALUE_ADD: Complex queries, date filtering, logical combinations            ║
║   DATA_FLOW: Query string → parse AST → evaluate conditions → filter         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `work list where` | `state=active,priority=high` | `state=active AND priority=high` | Must use logical operators |
| `work list where` | Only equality | `priority>medium` | Can use comparison operators |
| `work list where` | String dates only | `createdAt>2024-01-01` | Can filter by date ranges |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `src/core/query.ts` | 1-150 | Pattern to EXTEND exactly |
| P1 | `src/types/errors.ts` | 1-50 | Error pattern to MIRROR |
| P2 | `tests/unit/core/query.test.ts` | 1-100 | Test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [filter-query-parser npm](https://www.npmjs.com/package/filter-query-parser) ✓ Current | Grammar section | Comparison operators reference | 2026-01-21T20:40:20.631+01:00 |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/core/query.ts:10-15
// COPY THIS PATTERN:
export function parseQuery(query: string): QueryOptions {
  const options: QueryOptions = {};
  // ... implementation
}
```

**ERROR_HANDLING:**
```typescript
// SOURCE: src/types/errors.ts:25-35
// COPY THIS PATTERN:
export class InvalidQueryError extends WorkError {
  constructor(query: string, reason: string) {
    super(`Invalid query "${query}": ${reason}`, 'INVALID_QUERY', 400);
    this.name = 'InvalidQueryError';
    Object.setPrototypeOf(this, InvalidQueryError.prototype);
  }
}
```

**FILTER_PATTERN:**
```typescript
// SOURCE: src/core/query.ts:65-85
// COPY THIS PATTERN:
function filterWorkItems(workItems: WorkItem[], whereClause: string): WorkItem[] {
  // Parse and apply conditions
  return workItems.filter(item => {
    // Evaluation logic
  });
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: tests/unit/core/query.test.ts:1-25
// COPY THIS PATTERN:
describe('Query System', () => {
  describe('parseQuery', () => {
    it('should parse simple where clause', () => {
      const query = parseQuery('where state=active');
      expect(query.where).toBe('state=active');
    });
  });
});
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**
- [ ] Input validation prevents injection attacks
- [ ] Date parsing uses safe methods
- [ ] No eval() or dynamic code execution

**Performance (Web Intelligence Verified):**
- [ ] Parser uses efficient string operations
- [ ] No regex catastrophic backtracking
- [ ] Minimal memory allocation for large datasets

**Community Intelligence:**
- [ ] TypeScript strict mode compatibility verified
- [ ] No deprecated Date constructor usage
- [ ] Modern JavaScript features used appropriately

---

## Files to Change

| File                             | Action | Justification                            |
| -------------------------------- | ------ | ---------------------------------------- |
| `src/core/query.ts`              | UPDATE | Add enhanced parsing and evaluation      |
| `src/types/errors.ts`            | UPDATE | Add query syntax error types             |
| `tests/unit/core/query.test.ts`  | UPDATE | Add comprehensive test coverage          |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Complex nested parentheses - keep to single level grouping
- Regular expression operators (LIKE patterns) - use simple string matching
- Custom operator plugins - fixed set of operators only
- Query optimization/indexing - maintain simple linear filtering
- SQL-style JOIN operations - single work item filtering only
- Backward compatibility with comma-separated syntax - clean break from old format

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Prefer Makefile targets or package scripts when available (e.g., `make test`, `npm run test:coverage`).

**Coverage Targets**: PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%

### Task 1: UPDATE `src/types/errors.ts` (add query syntax errors)

- **ACTION**: ADD new error classes for query syntax validation
- **IMPLEMENT**: QuerySyntaxError, UnsupportedOperatorError, InvalidDateError
- **MIRROR**: `src/types/errors.ts:25-35` - follow existing error pattern
- **IMPORTS**: No new imports needed
- **GOTCHA**: Use Object.setPrototypeOf for proper instanceof checks
- **CURRENT**: Follow existing WorkError base class pattern
- **VALIDATE**: `npm run type-check`
- **FUNCTIONAL**: `node -e "const {QuerySyntaxError} = require('./dist/types/errors.js'); console.log(new QuerySyntaxError('test', 'reason'))"`
- **TEST_PYRAMID**: No additional tests needed - simple error class definitions

### Task 2: UPDATE `src/core/query.ts` (replace with new query AST types)

- **ACTION**: REPLACE existing QueryOptions interface and add AST types
- **IMPLEMENT**: QueryCondition, ComparisonOperator, LogicalOperator interfaces
- **MIRROR**: `src/types/work-item.ts:1-20` - follow type definition pattern
- **IMPORTS**: Import new error types from errors.ts
- **TYPES**: `type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<='`
- **GOTCHA**: Use readonly properties for immutable AST nodes
- **CURRENT**: Follow existing TypeScript strict mode patterns
- **VALIDATE**: `npm run type-check`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: UPDATE `src/core/query.ts` (replace with tokenizer function)

- **ACTION**: REPLACE parseQuery function with tokenizer
- **IMPLEMENT**: tokenizeQuery function with operator recognition
- **MIRROR**: `src/core/query.ts:15-35` - follow existing parsing pattern
- **PATTERN**: Return array of tokens with type and value
- **GOTCHA**: Handle quoted strings and escape sequences properly
- **CURRENT**: Use modern JavaScript string methods, avoid regex complexity
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: tokenizer with various operator combinations

### Task 4: UPDATE `src/core/query.ts` (replace with parser function)

- **ACTION**: REPLACE existing parsing logic with parseWhereClause function
- **IMPLEMENT**: Recursive descent parser for logical expressions
- **MIRROR**: `src/core/query.ts:40-60` - follow existing function structure
- **PATTERN**: Build tree structure with logical and comparison nodes
- **IMPORTS**: Use new error types for syntax validation
- **CURRENT**: Handle precedence: comparison operators before logical operators
- **VALIDATE**: `npm run type-check && npm run lint`
- **TEST_PYRAMID**: Add integration test for: parser with nested logical expressions

### Task 5: UPDATE `src/core/query.ts` (add date parsing and evaluator)

- **ACTION**: ADD parseValue and evaluateCondition functions
- **IMPLEMENT**: ISO date parsing and recursive AST evaluation
- **MIRROR**: `src/core/query.ts:100-120` - follow existing value handling
- **PATTERN**: Detect date strings, convert to Date objects, walk AST tree
- **GOTCHA**: Use new Date() constructor safely, validate ISO format
- **CURRENT**: Support ISO 8601 format (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss)
- **VALIDATE**: `npm run type-check && npm run lint`
- **FUNCTIONAL**: `./bin/run.js create "Test task" --priority high && ./bin/run.js list where priority=high`
- **TEST_PYRAMID**: Add E2E test for: complete query evaluation with all operator types

### Task 6: UPDATE `tests/unit/core/query.test.ts` (replace with comprehensive tests)

- **ACTION**: REPLACE existing tests with new query feature tests
- **IMPLEMENT**: Tests for operators, logical combinations, date comparisons, error cases
- **MIRROR**: `tests/unit/core/query.test.ts:1-100` - follow existing test structure
- **PATTERN**: Use describe/it blocks with clear test names
- **CURRENT**: Test both success and error paths for each operator
- **VALIDATE**: `npm test -- --coverage tests/unit/core/query.test.ts`
- **TEST_PYRAMID**: Add critical user journey test for: end-to-end query functionality covering all major operator combinations

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/unit/core/query.test.ts`          | Comparison operators       | >, <, >=, <=, != |
| `tests/unit/core/query.test.ts`          | Logical operators          | AND, OR, NOT   |
| `tests/unit/core/query.test.ts`          | Date comparisons           | ISO date parsing |
| `tests/unit/core/query.test.ts`          | Error conditions           | Syntax validation |

### Edge Cases Checklist

- [ ] Empty query strings
- [ ] Invalid operator combinations
- [ ] Malformed date strings
- [ ] Unrecognized field names
- [ ] Mixed logical operators (AND/OR precedence)
- [ ] Quoted strings with special characters
- [ ] Case sensitivity in operators
- [ ] Whitespace handling

---

## Validation Commands

**IMPORTANT**: Replace these placeholders with actual governed commands from the project's Makefile or package.json/config. Prefer Makefile targets when they exist.

### Level 1: STATIC_ANALYSIS

```bash
make lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
make build && ./bin/run.js create "Test task" --priority high && ./bin/run.js list where priority=high
```

**EXPECT**: Build succeeds, enhanced query works

### Level 3: UNIT_TESTS

```bash
npm test -- --coverage tests/unit/core/query.test.ts
```

**EXPECT**: All tests pass, coverage >= 40% (MVP target)

### Level 4: FULL_SUITE

```bash
make test && make build
```

**EXPECT**: All tests pass, build succeeds

### Level 5: CLI_VALIDATION

```bash
make validate-cli
```

**EXPECT**: CLI functionality works with enhanced queries

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:
- [ ] Implementation follows current TypeScript best practices
- [ ] No deprecated Date parsing methods used
- [ ] Security recommendations up-to-date

### Level 7: MANUAL_VALIDATION

1. Test simple queries: `work list where state=active`
2. Test comparison operators: `work list where priority>medium`
3. Test logical operators: `work list where state=active AND priority=high`
4. Test date comparisons: `work list where createdAt>2024-01-01`
5. Test error handling: `work list where invalid_syntax`

---

## Acceptance Criteria

- [ ] All comparison operators (>, <, >=, <=, !=) work correctly
- [ ] Logical operators (AND, OR, NOT) function as expected
- [ ] Date/time comparisons support ISO 8601 format
- [ ] Clean break from old comma-separated syntax
- [ ] Level 1-5 validation commands pass with exit 0
- [ ] Unit tests cover >= 40% of new code (MVP target)
- [ ] Code mirrors existing patterns exactly (naming, structure, error handling)
- [ ] CLI specification examples work: `priority=high AND state=active`
- [ ] **Implementation follows current best practices**
- [ ] **No deprecated patterns or vulnerable dependencies**
- [ ] **Security recommendations up-to-date**

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Build and functional validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Full test suite + build succeeds
- [ ] Level 5: CLI validation passes
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: 2 (query-string library documentation)
**Web Intelligence Sources**: 3 (npm packages, TypeScript operators, query parsers)
**Last Verification**: 2026-01-21T20:40:20.631+01:00
**Security Advisories Checked**: 1 (input validation best practices)
**Deprecated Patterns Avoided**: eval() usage, unsafe Date parsing, regex catastrophic backtracking

---

## Risks and Mitigations

| Risk                                        | Likelihood   | Impact       | Mitigation                                    |
| ------------------------------------------- | ------------ | ------------ | --------------------------------------------- |
| Performance degradation on large datasets  | MEDIUM       | MEDIUM       | Maintain linear filtering, avoid complex parsing |
| Date parsing edge cases                    | MEDIUM       | LOW          | Strict ISO 8601 validation with clear errors |
| Documentation changes during implementation | LOW          | MEDIUM       | Context7 MCP re-verification during execution |

---

## Notes

The implementation prioritizes simplicity and clean design over backward compatibility. The parser uses a straightforward recursive descent approach rather than a complex grammar engine, keeping the codebase maintainable while meeting the CLI specification requirements. This is a breaking change that removes the comma-separated query syntax in favor of proper logical operators.

### Current Intelligence Considerations

The filter-query-parser library provides excellent reference patterns for comparison operators and logical expressions, but we're implementing a lighter-weight solution that fits the existing codebase patterns. Date parsing follows modern JavaScript best practices with ISO 8601 support.
