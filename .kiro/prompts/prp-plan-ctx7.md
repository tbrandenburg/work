---
description: Create comprehensive feature implementation plan with codebase analysis, real-time research, and current best practices validation
argument-hint: <feature description | path/to/prd.md>
---

<objective>
Transform "$ARGUMENTS" into a battle-tested implementation plan through systematic codebase exploration, real-time pattern validation, and current intelligence gathering.

**Core Principle**: PLAN ONLY - no code written. Create a context-rich document with current information that enables one-pass implementation success.

**Execution Order**: CODEBASE FIRST, REAL-TIME RESEARCH SECOND. Solutions must fit existing patterns before introducing new ones, verified against current standards.

**Agent Strategy**: Use Task tool with subagent_type="Explore" for codebase intelligence gathering. Use Context7 MCP and web search for real-time validation and current best practices.
</objective>

<context>
CLAUDE.md rules: @CLAUDE.md

**Directory Discovery** (run these to understand project structure):

- List root contents: `ls -la`
- Find main source directories: `ls -la */ 2>/dev/null | head -50`
- Identify project type from config files (package.json, pyproject.toml, Cargo.toml, go.mod, etc.)
- Check governed commands: Makefile targets and package scripts for lint/test/build

**IMPORTANT**: Do NOT assume `src/` exists. Common alternatives include:

- `app/` (Next.js, Rails, Laravel)
- `lib/` (Ruby gems, Elixir)
- `packages/` (monorepos)
- `cmd/`, `internal/`, `pkg/` (Go)
- Root-level source files (Python, scripts)

Discover the actual structure before proceeding.
</context>

<process>

## Phase 0: DETECT - Input Type Resolution

**Determine input type:**

| Input Pattern                                        | Type         | Action                               |
| ---------------------------------------------------- | ------------ | ------------------------------------ |
| Ends with `.prd.md`                                  | PRD file     | Parse PRD, select next phase         |
| Ends with `.md` and contains "Implementation Phases" | PRD file     | Parse PRD, select next phase         |
| File path that exists                                | Document     | Read and extract feature description |
| Free-form text                                       | Description  | Use directly as feature input        |
| Empty/blank                                          | Conversation | Use conversation context as input    |

### If PRD File Detected:

1. **Read the PRD file**
2. **Parse the Implementation Phases table** - find rows with `Status: pending`
3. **Check dependencies** - only select phases whose dependencies are `complete`
4. **Select the next actionable phase:**
   - First pending phase with all dependencies complete
   - If multiple candidates with same dependencies, note parallelism opportunity

5. **Extract phase context:**

   ```
   PHASE: {phase number and name}
   GOAL: {from phase details}
   SCOPE: {from phase details}
   SUCCESS SIGNAL: {from phase details}
   PRD CONTEXT: {problem statement, user, hypothesis from PRD}
   ```

6. **Report selection to user:**

   ```
   PRD: {prd file path}
   Selected Phase: #{number} - {name}

   {If parallel phases available:}
   Note: Phase {X} can also run in parallel (in separate worktree).

   Proceeding with Phase #{number}...
   ```

### If Free-form or Conversation Context:

- Proceed directly to Phase 1 with the input as feature description

**PHASE_0_CHECKPOINT:**

- [ ] Input type determined
- [ ] If PRD: next phase selected and dependencies verified
- [ ] Feature description ready for Phase 1

---

## Phase 1: PARSE - Feature Understanding

**EXTRACT from input:**

- Core problem being solved
- User value and business impact
- Feature type: NEW_CAPABILITY | ENHANCEMENT | REFACTOR | BUG_FIX
- Complexity: LOW | MEDIUM | HIGH
- Affected systems list

**FORMULATE user story:**

```
As a <user type>
I want to <action/goal>
So that <benefit/value>
```

**PHASE_1_CHECKPOINT:**

- [ ] Problem statement is specific and testable
- [ ] User story follows correct format
- [ ] Complexity assessment has rationale
- [ ] Affected systems identified

**GATE**: If requirements are AMBIGUOUS → STOP and ASK user for clarification before proceeding.

---

## Phase 2: EXPLORE - Codebase Intelligence

**CRITICAL: Use Task tool with subagent_type="Explore" and prompt for thoroughness="very thorough"**

Example Task invocation:

```
Explore the codebase to find patterns, conventions, and integration points
relevant to implementing: [feature description].

DISCOVER:
1. Similar implementations - find analogous features with file:line references
2. Naming conventions - extract actual examples of function/class/file naming
3. Error handling patterns - how errors are created, thrown, caught
4. Logging patterns - logger usage, message formats
5. Type definitions - relevant interfaces and types
6. Test patterns - test file structure, assertion styles
7. Integration points - where new code connects to existing
8. Dependencies - relevant libraries already in use
9. Governed commands - Makefile targets and package scripts for lint/test/build

Return ACTUAL code snippets from codebase, not generic examples.
```

**DOCUMENT discoveries in table format:**

| Category | File:Lines                                  | Pattern Description  | Code Snippet                              |
| -------- | ------------------------------------------- | -------------------- | ----------------------------------------- |
| NAMING   | `src/features/X/service.ts:10-15`           | camelCase functions  | `export function createThing()`           |
| ERRORS   | `src/features/X/errors.ts:5-20`             | Custom error classes | `class ThingNotFoundError`                |
| LOGGING  | `src/core/logging/index.ts:1-10`            | getLogger pattern    | `const logger = getLogger("domain")`      |
| TESTS    | `src/features/X/tests/service.test.ts:1-30` | describe/it blocks   | `describe("service", () => {`             |
| TYPES    | `src/features/X/models.ts:1-20`             | Drizzle inference    | `type Thing = typeof things.$inferSelect` |

### 2.5 Pattern Currency Verification (Context7 MCP)

After codebase exploration, verify discovered patterns against current standards:

- Check if discovered libraries have newer recommended patterns
- Validate security practices are still current
- Confirm performance patterns haven't been superseded
- Verify testing approaches align with current best practices

### 2.6 Dependency Version Verification

**CRITICAL**: Before specifying exact package versions in plans, verify they exist:

- Use Context7 MCP to check npm registry for specified versions
- For new dependencies, verify latest stable versions
- Document version constraints (minimum vs exact)
- Flag any version conflicts with existing dependencies

**Pattern**: Treat plan versions as minimums, allow flexibility for latest stable when specified versions unavailable

**PHASE_2_CHECKPOINT:**

- [ ] Explore agent launched and completed successfully
- [ ] At least 3 similar implementations found with file:line refs
- [ ] Code snippets are ACTUAL (copy-pasted from codebase, not invented)
- [ ] Integration points mapped with specific file paths
- [ ] Dependencies cataloged with versions from package.json
- [ ] **Patterns verified against current standards**
- [ ] **No deprecated practices detected**
- [ ] **Package versions verified to exist in registry**
- [ ] **Version conflicts with existing dependencies checked**

---

## Phase 3: RESEARCH - Real-time External Intelligence

**ONLY AFTER Phase 2 is complete** - solutions must fit existing codebase patterns first.

**Context7 MCP Documentation Access:**

- Query live API documentation for exact current signatures
- Access version-specific implementation guides
- Retrieve current security best practices
- Verify compatibility matrices and breaking changes

**Web Intelligence Gathering:**

- Recent Stack Overflow solutions and community discussions
- Framework-specific forums and maintainer recommendations
- Current performance benchmarks and optimization techniques
- Security advisories and vulnerability reports

**Enhanced Reference Format:**

```markdown
- [Library Docs v{version}](https://url#specific-section) ✓ Verified Current
  - KEY_INSIGHT: {current best practice discovered}
  - APPLIES_TO: {which task/file this affects}
  - GOTCHA: {recent issues discovered in community}
  - LAST_VERIFIED: {timestamp}
```

**PHASE_3_CHECKPOINT:**

- [ ] Documentation versions match package.json
- [ ] URLs include specific section anchors (not just homepage)
- [ ] Gotchas documented with mitigation strategies
- [ ] No conflicting patterns between external docs and existing codebase
- [ ] **All documentation links verified as current**
- [ ] **Recent community intelligence gathered**
- [ ] **Security advisories checked**

---

## Phase 3.5: VALIDATE - Research Currency Check

### Real-time Verification

Use Context7 MCP to validate research findings:

- Confirm all documentation is current (not cached/outdated)
- Verify library recommendations haven't changed
- Check for recent security updates or advisories
- Validate performance assumptions against current benchmarks

### Community Intelligence Cross-check

Use web search to verify:

- Recent community consensus aligns with research
- No major issues discovered since documentation was written
- Current maintainer recommendations match findings
- Recent blog posts or discussions don't contradict approach

**PHASE_3.5_CHECKPOINT:**

- [ ] All documentation verified as current
- [ ] No conflicting community intelligence found
- [ ] Security recommendations up-to-date
- [ ] Performance assumptions validated

---

## Phase 4: DESIGN - UX Transformation

**CREATE ASCII diagrams showing user experience before and after:**

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │            ║
║   │  Component  │         │   Current   │         │   Current   │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: [describe current step-by-step experience]                       ║
║   PAIN_POINT: [what's missing, broken, or inefficient]                        ║
║   DATA_FLOW: [how data moves through the system currently]                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Screen/   │ ──────► │   Action    │ ──────► │   Result    │            ║
║   │  Component  │         │    NEW      │         │    NEW      │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ NEW_FEATURE │  ◄── [new capability added]          ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: [describe new step-by-step experience]                           ║
║   VALUE_ADD: [what user gains from this change]                               ║
║   DATA_FLOW: [how data moves through the system after]                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**DOCUMENT interaction changes:**

| Location        | Before          | After       | User_Action | Impact        |
| --------------- | --------------- | ----------- | ----------- | ------------- |
| `/route`        | State A         | State B     | Click X     | Can now Y     |
| `Component.tsx` | Missing feature | Has feature | Input Z     | Gets result W |

**PHASE_4_CHECKPOINT:**

- [ ] Before state accurately reflects current system behavior
- [ ] After state shows ALL new capabilities
- [ ] Data flows are traceable from input to output
- [ ] User value is explicit and measurable

---

## Phase 5: ARCHITECT - Strategic Design

**ANALYZE deeply (use extended thinking if needed):**

- ARCHITECTURE_FIT: How does this integrate with the existing architecture?
- EXECUTION_ORDER: What must happen first → second → third?
- FAILURE_MODES: Edge cases, race conditions, error scenarios?
- PERFORMANCE: Will this scale? Database queries optimized?
- SECURITY: Attack vectors? Data exposure risks? Auth/authz?
- MAINTAINABILITY: Will future devs understand this code?

**Real-time Best Practices Validation (Context7 MCP + Web Search):**

- SECURITY: Query current OWASP recommendations and recent CVEs
- PERFORMANCE: Check for recent optimization techniques and benchmarks
- ARCHITECTURE: Validate against current framework recommendations
- COMPLIANCE: Verify against latest regulatory requirements

**DECIDE and document:**

**DECLARE architecture invariants (persistent vs ephemeral state, entities surviving across invocations, idempotent operations) and reference them in tests and acceptance criteria.**

```markdown
APPROACH_CHOSEN: [description]
RATIONALE: [why this over alternatives - reference codebase patterns and current best practices]

ALTERNATIVES_REJECTED:

- [Alternative 1]: Rejected because [specific reason + current standards check]
- [Alternative 2]: Rejected because [specific reason + current standards check]

NOT_BUILDING (explicit scope limits):

- [Item 1 - explicitly out of scope and why]
- [Item 2 - explicitly out of scope and why]
```

**PHASE_5_CHECKPOINT:**

- [ ] Approach aligns with existing architecture and patterns
- [ ] Dependencies ordered correctly (types → repository → service → routes)
- [ ] Edge cases identified with specific mitigation strategies
- [ ] Scope boundaries are explicit and justified
- [ ] **Current security best practices validated**
- [ ] **Performance assumptions verified against recent benchmarks**
- [ ] **Architecture decisions align with current framework recommendations**

---

## Phase 6: GENERATE - Implementation Plan File

**OUTPUT_PATH**: `.claude/PRPs/plans/{kebab-case-feature-name}.plan.md`

Create directory if needed: `mkdir -p .claude/PRPs/plans`

### 6.5 Plan Currency Validation

Before finalizing plan, use Context7 MCP to verify:

- All documentation links are current and accessible
- Library versions match latest stable releases
- Security recommendations haven't changed
- No deprecated patterns are being recommended

**If issues found:**

- Update plan with current information
- Document deviations from original research
- Re-verify critical dependencies

**PLAN_STRUCTURE** (the template to fill and save):

```markdown
# Feature: {Feature Name}

## Summary

{One paragraph: What we're building and high-level approach}

## User Story

As a {user type}
I want to {action}
So that {benefit}

## Problem Statement

{Specific problem this solves - must be testable}

## Solution Statement

{How we're solving it - architecture overview}

## Metadata

| Field                  | Value                                             |
| ---------------------- | ------------------------------------------------- |
| Type                   | NEW_CAPABILITY / ENHANCEMENT / REFACTOR / BUG_FIX |
| Complexity             | LOW / MEDIUM / HIGH                               |
| Systems Affected       | {comma-separated list}                            |
| Dependencies           | {external libs/services with versions}            |
| Estimated Tasks        | {count}                                           |
| **Research Timestamp** | **{Current date/time for context freshness}**     |

---

## UX Design

### Before State
```

{ASCII diagram - current user experience with data flows}

```

### After State
```

{ASCII diagram - new user experience with data flows}

````

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| {path/component} | {old behavior} | {new behavior} | {what changes for user} |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `path/to/critical.ts` | 10-50 | Pattern to MIRROR exactly |
| P1 | `path/to/types.ts` | 1-30 | Types to IMPORT |
| P2 | `path/to/test.ts` | all | Test pattern to FOLLOW |

**Current External Documentation (Verified Live):**
| Source | Section | Why Needed | Last Verified |
|--------|---------|------------|---------------|
| [Lib Docs v{version}](url#anchor) ✓ Current | {section name} | {specific reason} | {timestamp} |

---

## Patterns to Mirror

**NAMING_CONVENTION:**
```typescript
// SOURCE: src/features/example/service.ts:10-15
// COPY THIS PATTERN:
{actual code snippet from codebase}
````

**ERROR_HANDLING:**

```typescript
// SOURCE: src/features/example/errors.ts:5-20
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**LOGGING_PATTERN:**

```typescript
// SOURCE: src/features/example/service.ts:25-30
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**REPOSITORY_PATTERN:**

```typescript
// SOURCE: src/features/example/repository.ts:10-40
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**SERVICE_PATTERN:**

```typescript
// SOURCE: src/features/example/service.ts:40-80
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

**TEST_STRUCTURE:**

```typescript
// SOURCE: src/features/example/tests/service.test.ts:1-25
// COPY THIS PATTERN:
{actual code snippet from codebase}
```

---

## Current Best Practices Validation

**Security (Context7 MCP Verified):**

- [ ] Current OWASP recommendations followed
- [ ] Recent CVE advisories checked
- [ ] Authentication patterns up-to-date
- [ ] Data validation follows current standards

**Performance (Web Intelligence Verified):**

- [ ] Current optimization techniques applied
- [ ] Recent benchmarks considered
- [ ] Database patterns follow current best practices
- [ ] Caching strategies align with current recommendations

**Community Intelligence:**

- [ ] Recent Stack Overflow solutions reviewed
- [ ] Framework maintainer recommendations followed
- [ ] No deprecated patterns detected in community discussions
- [ ] Current testing approaches validated

---

## Files to Change

| File                             | Action | Justification                            |
| -------------------------------- | ------ | ---------------------------------------- |
| `src/features/new/models.ts`     | CREATE | Type definitions - re-export from schema |
| `src/features/new/schemas.ts`    | CREATE | Zod validation schemas                   |
| `src/features/new/errors.ts`     | CREATE | Feature-specific errors                  |
| `src/features/new/repository.ts` | CREATE | Database operations                      |
| `src/features/new/service.ts`    | CREATE | Business logic                           |
| `src/features/new/index.ts`      | CREATE | Public API exports                       |
| `src/core/database/schema.ts`    | UPDATE | Add table definition                     |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- {Item 1 - explicitly out of scope and why}
- {Item 2 - explicitly out of scope and why}

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

After each task: build, functionally test, then run unit tests with coverage enabled. Prefer Makefile targets or package scripts when available (e.g., `make test`, `npm run test:coverage`).

**Coverage Targets**: PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%

### Task 1: CREATE `src/core/database/schema.ts` (update)

- **ACTION**: ADD table definition to schema
- **IMPLEMENT**: {specific columns, types, constraints}
- **MIRROR**: `src/core/database/schema.ts:XX-YY` - follow existing table pattern
- **IMPORTS**: `import { pgTable, text, timestamp } from "drizzle-orm/pg-core"`
- **GOTCHA**: {known issue to avoid, e.g., "use uuid for id, not serial"}
- **CURRENT**: {Reference to verified current documentation}
- **CONFIG_CONFLICTS**: {Any known tool configuration conflicts, e.g., "ESLint projectService conflicts with explicit project setting"}
- **GENERATED_FILES**: {How to handle build artifacts in tooling, e.g., "exclude dist/ from linting scope"}
- **VALIDATE**: `{type-check-cmd} && {build-cmd} && {functional-test-cmd} && {test-with-coverage-cmd}`
- **FUNCTIONAL**: `{actual-usage-command}` - verify component works
- **TEST_PYRAMID**: {Add integration test for: ..., and/or Add E2E test for: ..., and/or Add critical user journey test for: ... OR No additional tests needed - {reason}}

### Task 2: CREATE `src/features/new/models.ts`

- **ACTION**: CREATE type definitions file
- **IMPLEMENT**: Re-export table, define inferred types
- **MIRROR**: `src/features/projects/models.ts:1-10`
- **IMPORTS**: `import { things } from "@/core/database/schema"`
- **TYPES**: `type Thing = typeof things.$inferSelect`
- **GOTCHA**: Use `$inferSelect` for read types, `$inferInsert` for write
- **CURRENT**: {Reference to verified current Drizzle documentation}
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - type definitions only

### Task 3: CREATE `src/features/new/schemas.ts`

- **ACTION**: CREATE Zod validation schemas
- **IMPLEMENT**: CreateThingSchema, UpdateThingSchema
- **MIRROR**: `src/features/projects/schemas.ts:1-30`
- **IMPORTS**: `import { z } from "zod/v4"` (note: zod/v4 not zod)
- **GOTCHA**: z.record requires two args in v4
- **CURRENT**: {Reference to verified current Zod v4 documentation}
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: Add integration test for: schema validation with edge cases and error messages

### Task 4: CREATE `src/features/new/errors.ts`

- **ACTION**: CREATE feature-specific error classes
- **IMPLEMENT**: ThingNotFoundError, ThingAccessDeniedError
- **MIRROR**: `src/features/projects/errors.ts:1-40`
- **PATTERN**: Extend base Error, include code and statusCode
- **CURRENT**: {Reference to current error handling best practices}
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: No additional tests needed - simple error class definitions

### Task 5: CREATE `src/features/new/repository.ts`

- **ACTION**: CREATE database operations
- **IMPLEMENT**: findById, findByUserId, create, update, delete
- **MIRROR**: `src/features/projects/repository.ts:1-60`
- **IMPORTS**: `import { db } from "@/core/database/client"`
- **GOTCHA**: Use `results[0]` pattern, not `.first()` - check noUncheckedIndexedAccess
- **CURRENT**: {Reference to current Drizzle query patterns}
- **VALIDATE**: `npx tsc --noEmit`
- **TEST_PYRAMID**: Add integration test for: database operations with transaction handling and error scenarios

### Task 6: CREATE `src/features/new/service.ts`

- **ACTION**: CREATE business logic layer
- **IMPLEMENT**: createThing, getThing, updateThing, deleteThing
- **MIRROR**: `src/features/projects/service.ts:1-80`
- **PATTERN**: Use repository, add logging, throw custom errors
- **IMPORTS**: `import { getLogger } from "@/core/logging"`
- **CURRENT**: {Reference to current service layer best practices}
- **VALIDATE**: `{type-check-cmd} && {lint-cmd}`
- **TEST_PYRAMID**: Add E2E test for: complete service workflow with authentication and authorization

### Task 7: CREATE `{source-dir}/features/new/index.ts`

- **ACTION**: CREATE public API exports
- **IMPLEMENT**: Export types, schemas, errors, service functions
- **MIRROR**: `{source-dir}/features/{example}/index.ts:1-20`
- **PATTERN**: Named exports only, hide repository (internal)
- **VALIDATE**: `{type-check-cmd} && {build-cmd} && {functional-test-cmd} && {test-with-coverage-cmd}`
- **FUNCTIONAL**: `{actual-usage-command}` - verify component works
- **TEST_PYRAMID**: No additional tests needed - export file only

### Task 8: CREATE `{source-dir}/features/new/tests/service.test.ts`

- **ACTION**: CREATE unit tests for service
- **IMPLEMENT**: Test each service function, happy path + error cases
- **MIRROR**: `{source-dir}/features/{example}/tests/service.test.ts:1-100`
- **PATTERN**: Use project's test framework (jest, vitest, bun:test, pytest, etc.)
- **CURRENT**: {Reference to current testing best practices}
- **VALIDATE**: `{test-cmd} {path-to-tests}`
- **TEST_PYRAMID**: Add critical user journey test for: end-to-end feature usage covering all major user paths

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `src/features/new/tests/schemas.test.ts` | valid input, invalid input | Zod schemas    |
| `src/features/new/tests/errors.test.ts`  | error properties           | Error classes  |
| `src/features/new/tests/service.test.ts` | CRUD ops, access control   | Business logic |

### Edge Cases Checklist

- [ ] Empty string inputs
- [ ] Missing required fields
- [ ] Unauthorized access attempts
- [ ] Not found scenarios
- [ ] Duplicate creation attempts
- [ ] {feature-specific edge case}

---

## Validation Commands

**IMPORTANT**: Replace these placeholders with actual governed commands from the project's Makefile or package.json/config. Prefer Makefile targets when they exist.

### Level 1: STATIC_ANALYSIS

```bash
{runner} run lint && {runner} run type-check
# Examples: make lint && make type-check, npm run lint && npm run type-check, ruff check . && mypy ., cargo clippy
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: BUILD_AND_FUNCTIONAL

```bash
{runner} run build && {functional-test-command}
# Examples: make build && ./bin/cli test-command, npm run build && npm start, cargo build && ./target/debug/app --version
```

**EXPECT**: Build succeeds, basic functionality works

### Level 3: UNIT_TESTS

```bash
{runner} test -- --coverage {path/to/feature/tests}
# Examples: make test-coverage, npm test -- --coverage, pytest --cov=., cargo test, go test ./...
```

**EXPECT**: All tests pass, coverage >= {target}% (PoC 20%, MVP 40%, Extensions 60%, OSS 75%, Mature 85%)

**COVERAGE NOTE**: When running isolated tests, use module-specific coverage to avoid global threshold failures:
```bash
# For isolated module testing:
{runner} test -- --coverage --collectCoverageFrom="{module-path}" {path/to/feature/tests}
# For global coverage validation, run full suite instead (Level 4)
```

### Level 4: FULL_SUITE

```bash
{runner} test -- --coverage && {runner} run build
# Examples: make test-coverage && make build, npm test -- --coverage && npm run build, cargo test && cargo build
```

**EXPECT**: All tests pass, build succeeds

### Level 4: DATABASE_VALIDATION (if schema changes)

Use Supabase MCP to verify:

- [ ] Table created with correct columns
- [ ] RLS policies applied
- [ ] Indexes created

### Level 5: BROWSER_VALIDATION (if UI changes)

Use Browser MCP to verify:

- [ ] UI renders correctly
- [ ] User flows work end-to-end
- [ ] Error states display properly

### Level 6: CURRENT_STANDARDS_VALIDATION

Use Context7 MCP to verify:

- [ ] Implementation follows current best practices
- [ ] No deprecated patterns used
- [ ] Security recommendations up-to-date
- [ ] Performance patterns current

### Level 7: MANUAL_VALIDATION

{Step-by-step manual testing specific to this feature}

---

## Acceptance Criteria

- [ ] All specified functionality implemented per user story
- [ ] Level 1-3 validation commands pass with exit 0
- [ ] Unit tests cover >= 80% of new code
- [ ] Code mirrors existing patterns exactly (naming, structure, logging)
- [ ] No regressions in existing tests
- [ ] UX matches "After State" diagram
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
- [ ] Level 4: Database validation passes (if applicable)
- [ ] Level 5: Browser validation passes (if applicable)
- [ ] Level 6: Current standards validation passes
- [ ] All acceptance criteria met

---

## Real-time Intelligence Summary

**Context7 MCP Queries Made**: {Number of documentation queries}
**Web Intelligence Sources**: {Number of community sources consulted}
**Last Verification**: {Timestamp of most recent documentation check}
**Security Advisories Checked**: {Number of security checks performed}
**Deprecated Patterns Avoided**: {List of outdated patterns identified and avoided}

---

## Risks and Mitigations

| Risk                                        | Likelihood   | Impact       | Mitigation                                    |
| ------------------------------------------- | ------------ | ------------ | --------------------------------------------- |
| {Risk description}                          | LOW/MED/HIGH | LOW/MED/HIGH | {Specific prevention/handling strategy}       |
| Documentation changes during implementation | LOW          | MEDIUM       | Context7 MCP re-verification during execution |
| Security vulnerabilities in dependencies    | MEDIUM       | HIGH         | Real-time security advisory monitoring        |

---

## Notes

{Additional context, design decisions, trade-offs, future considerations}

### Current Intelligence Considerations

{Document any recent library updates, security patches, or community recommendations that influenced the plan}

````

</process>

<output>
**OUTPUT_FILE**: `.claude/PRPs/plans/{kebab-case-feature-name}.plan.md`

**If input was from PRD file**, also update the PRD:

1. **Update phase status** in the Implementation Phases table:
   - Change the phase's Status from `pending` to `in-progress`
   - Add the plan file path to the PRP Plan column

2. **Edit the PRD file** with these changes

**REPORT_TO_USER** (display after creating plan):

```markdown
## Plan Created (Enhanced with Real-time Intelligence)

**File**: `.claude/PRPs/plans/{feature-name}.plan.md`

{If from PRD:}
**Source PRD**: `{prd-file-path}`
**Phase**: #{number} - {phase name}
**PRD Updated**: Status set to `in-progress`, plan linked

{If parallel phases available:}
**Parallel Opportunity**: Phase {X} can run concurrently in a separate worktree.
To start: `git worktree add -b phase-{X} ../project-phase-{X} && cd ../project-phase-{X} && /prp-plan {prd-path}`

**Summary**: {2-3 sentence feature overview}

**Complexity**: {LOW/MEDIUM/HIGH} - {brief rationale}

**Scope**:
- {N} files to CREATE
- {M} files to UPDATE
- {K} total tasks

**Key Patterns Discovered**:
- {Pattern 1 from Explore agent with file:line}
- {Pattern 2 from Explore agent with file:line}

**Real-time Intelligence Gathered**:
- {Number} Context7 MCP documentation queries
- {Number} web intelligence sources consulted
- {Number} security advisories checked
- Last verification: {timestamp}

**Current Standards Validation**:
- ✅ All documentation verified as current
- ✅ No deprecated patterns detected
- ✅ Security recommendations up-to-date
- ✅ Performance assumptions validated

**UX Transformation**:
- BEFORE: {one-line current state}
- AFTER: {one-line new state}

**Risks**:
- {Primary risk}: {mitigation}

**Confidence Score**: {1-10}/10 for one-pass implementation success
- {Rationale for score, including currency of information}

**Next Step**: To execute, run: `/prp-implement .claude/PRPs/plans/{feature-name}.plan.md`
````

</output>

<verification>
**FINAL_VALIDATION before saving plan:**

**CONTEXT_COMPLETENESS:**

- [ ] All patterns from Explore agent documented with file:line references
- [ ] External docs versioned to match package.json and verified current
- [ ] Integration points mapped with specific file paths
- [ ] Gotchas captured with mitigation strategies
- [ ] Every task has at least one executable validation command
- [ ] Validation commands use governed targets and coverage where available
- [ ] **Real-time documentation verification completed**

**IMPLEMENTATION_READINESS:**

- [ ] Tasks ordered by dependency (can execute top-to-bottom)
- [ ] Each task is atomic and independently testable
- [ ] No placeholders - all content is specific and actionable
- [ ] Pattern references include actual code snippets (copy-pasted, not invented)
- [ ] **Current best practices incorporated**

**PATTERN_FAITHFULNESS:**

- [ ] Every new file mirrors existing codebase style exactly
- [ ] No unnecessary abstractions introduced
- [ ] Naming follows discovered conventions
- [ ] Error/logging patterns match existing
- [ ] Test structure matches existing tests
- [ ] **No deprecated patterns recommended**

**VALIDATION_COVERAGE:**

- [ ] Every task has executable validation command
- [ ] All 7 validation levels defined where applicable
- [ ] Edge cases enumerated with test plans
- [ ] **Current standards validation included**

**UX_CLARITY:**

- [ ] Before/After ASCII diagrams are detailed and accurate
- [ ] Data flows are traceable
- [ ] User value is explicit and measurable

**CURRENCY_VERIFICATION:**

- [ ] All documentation links verified as current
- [ ] Security recommendations up-to-date
- [ ] Performance assumptions validated against recent benchmarks
- [ ] Community intelligence gathered and incorporated
- [ ] Research timestamp documented for context freshness

**NO_PRIOR_KNOWLEDGE_TEST**: Could an agent unfamiliar with this codebase implement using ONLY the plan with current information?
</verification>

<success_criteria>
**CONTEXT_COMPLETE**: All patterns, gotchas, integration points documented from actual codebase via Explore agent
**IMPLEMENTATION_READY**: Tasks executable top-to-bottom without questions, research, or clarification
**PATTERN_FAITHFUL**: Every new file mirrors existing codebase style exactly
**VALIDATION_DEFINED**: Every task has executable verification command
**UX_DOCUMENTED**: Before/After transformation is visually clear with data flows
**CURRENCY_VERIFIED**: All information verified as current through Context7 MCP and web intelligence
**ONE_PASS_TARGET**: Confidence score 8+ indicates high likelihood of first-attempt success with current best practices
</success_criteria>
