# Investigation: Fix XML generation issue causing invalid `<__cdata>` tags

**Issue**: Fast-xml-parser v5.4.1 creating invalid `<__cdata>` XML tags instead of proper CDATA sections
**Type**: BUG
**Investigated**: 2026-02-26T20:45:00Z

### Assessment

| Metric     | Value | Reasoning                                                                                                              |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------- |
| Severity   | HIGH  | Breaks core team management functionality, 11 integration tests failing, all team creation/editing operations affected |
| Complexity | LOW   | Single file fix with 4 specific lines to change, isolated to XML generation logic, well-understood code path           |
| Confidence | HIGH  | Clear root cause identified with exact line numbers, confirmed by CI logs and generated XML inspection                 |

---

## Problem Statement

The work-cli XML generation system is creating invalid `<__cdata>` tags instead of proper CDATA sections, causing all team management operations to fail with "Invalid tag name: \_\_cdata" errors during XML parsing.

---

## Analysis

### Root Cause / Change Rationale

The issue is a double-nesting problem in CDATA object handling within the XML generation process.

### Evidence Chain

WHY: 11 integration tests failing with "XML parsing failed: Invalid tag name: **cdata"
↓ BECAUSE: XMLBuilder is generating invalid `<**cdata>`tags in generated XML
Evidence:`.work/teams.xml`shows`<instructions><**cdata><![CDATA[content]]></**cdata></instructions>`instead of`<instructions><![CDATA[content]]></instructions>`

↓ BECAUSE: CDATA objects are being double-nested before passing to XMLBuilder
Evidence: `src/core/xml-utils.ts:508` - `xmlCmd.instructions = { __cdata: cmd.instructions };` wraps already-CDATA objects

↓ BECAUSE: Parsing creates CDATA objects but building assumes strings
Evidence: `src/core/xml-utils.ts:321` - `instructions: cmd.instructions || cmd.__cdata || undefined,` assigns CDATA objects to instructions field

↓ ROOT CAUSE: Missing type checking before wrapping content in CDATA objects
Evidence: `src/core/xml-utils.ts:508,527,542,555` - No validation whether content is already a CDATA object

### Affected Files

| File                    | Lines           | Action | Description                             |
| ----------------------- | --------------- | ------ | --------------------------------------- |
| `src/core/xml-utils.ts` | 508,527,542,555 | UPDATE | Add CDATA type checking before wrapping |

### Integration Points

- `src/cli/commands/teams/` - All team commands depend on XML parsing/generation
- `tests/integration/cli/commands/teams-editing.test.ts` - 10/11 tests failing
- `tests/integration/cli/commands/teams/agent.test.ts` - 1/4 tests failing
- Template files: `src/templates/sw-dev-team.xml`, `src/templates/research-team.xml`

### Git History

- **Introduced**: 7a06421 - 2026-02-15 - "Feat: Complete XML-based team management system with TypeScript fixes (#1801)"
- **Last modified**: 43df7bf - 2026-02-26 (security fixes)
- **Implication**: Bug present since initial XML system implementation, not a regression

---

## Implementation Plan

### Step 1: Fix command instructions CDATA handling

**File**: `src/core/xml-utils.ts`
**Lines**: 505-509
**Action**: UPDATE

**Current code:**

```typescript
// Line 506-508
if (cmd.instructions) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  xmlCmd.instructions = { __cdata: cmd.instructions };
}
```

**Required change:**

```typescript
if (cmd.instructions) {
  // Handle both string and already-parsed CDATA objects
  if (typeof cmd.instructions === 'string') {
    xmlCmd.instructions = { __cdata: cmd.instructions };
  } else if (
    cmd.instructions &&
    typeof cmd.instructions === 'object' &&
    cmd.instructions.__cdata
  ) {
    // Already a CDATA object from parsing, use as-is
    xmlCmd.instructions = cmd.instructions;
  } else {
    // Fallback for other types - convert to string then wrap
    xmlCmd.instructions = { __cdata: String(cmd.instructions) };
  }
}
```

**Why**: Prevents double-nesting when instructions are already CDATA objects from XML parsing

---

### Step 2: Fix activation instructions CDATA handling

**File**: `src/core/xml-utils.ts`
**Lines**: 523-529
**Action**: UPDATE

**Current code:**

```typescript
if (agent.activation) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  xmlAgent.activation = {
    '@_critical': agent.activation.critical ? 'MANDATORY' : 'false',
    instructions: { __cdata: agent.activation.instructions },
  };
}
```

**Required change:**

```typescript
if (agent.activation) {
  xmlAgent.activation = {
    '@_critical': agent.activation.critical ? 'MANDATORY' : 'false',
    instructions:
      typeof agent.activation.instructions === 'string'
        ? { __cdata: agent.activation.instructions }
        : agent.activation.instructions &&
            typeof agent.activation.instructions === 'object' &&
            agent.activation.instructions.__cdata
          ? agent.activation.instructions
          : { __cdata: String(agent.activation.instructions) },
  };
}
```

**Why**: Same double-nesting fix for activation instructions

---

### Step 3: Fix workflow main_file CDATA handling

**File**: `src/core/xml-utils.ts`
**Lines**: 540-544
**Action**: UPDATE

**Current code:**

```typescript
main_file: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  __cdata: wf.main_file.content,
},
```

**Required change:**

```typescript
main_file: typeof wf.main_file.content === 'string'
  ? { __cdata: wf.main_file.content }
  : wf.main_file.content && typeof wf.main_file.content === 'object' && wf.main_file.content.__cdata
    ? wf.main_file.content
    : { __cdata: String(wf.main_file.content) },
```

**Why**: Fix double-nesting for workflow main file content

---

### Step 4: Fix workflow dependencies CDATA handling

**File**: `src/core/xml-utils.ts`
**Lines**: 551-556
**Action**: UPDATE

**Current code:**

```typescript
file: wf.dependencies.map((dep: any) => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  '@_path': dep.path,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  __cdata: dep.content,
})),
```

**Required change:**

```typescript
file: wf.dependencies.map((dep: any) => ({
  '@_path': dep.path,
  ...(typeof dep.content === 'string'
    ? { __cdata: dep.content }
    : dep.content && typeof dep.content === 'object' && dep.content.__cdata
      ? dep.content
      : { __cdata: String(dep.content) }
  ),
})),
```

**Why**: Fix double-nesting for workflow dependency content

---

### Step 5: Regenerate teams.xml with corrected XML generation

**File**: `.work/teams.xml`
**Action**: UPDATE (will be regenerated automatically)

**Test command to trigger regeneration:**

```bash
# Remove the corrupted XML file
rm .work/teams.xml
# Run any team command to regenerate
npm run test -- tests/integration/cli/commands/teams-editing.test.ts
```

**Why**: Remove invalid XML to force regeneration with corrected logic

---

## Patterns to Follow

**From codebase - mirror these exactly:**

```typescript
// SOURCE: src/core/xml-utils.ts:321
// Pattern for handling both string and CDATA object inputs
instructions: cmd.instructions || cmd.__cdata || undefined,
```

**CDATA object detection pattern:**

```typescript
// Check if value is already a CDATA object
if (value && typeof value === 'object' && value.__cdata) {
  // Already a CDATA object, use as-is
  return value;
} else if (typeof value === 'string') {
  // String value, wrap in CDATA
  return { __cdata: value };
} else {
  // Other types, convert to string then wrap
  return { __cdata: String(value) };
}
```

---

## Edge Cases & Risks

| Risk/Edge Case                      | Mitigation                                 |
| ----------------------------------- | ------------------------------------------ |
| CDATA content is null/undefined     | Fallback to String() conversion            |
| Content is number or boolean        | Convert to string before wrapping          |
| Malformed CDATA objects             | Type checking prevents double-nesting      |
| Breaking existing XML functionality | Only affects generation, parsing unchanged |

---

## Validation

### Automated Checks

```bash
# Type checking
npm run type-check

# Integration tests - should pass after fix
npm test tests/integration/cli/commands/teams-editing.test.ts
npm test tests/integration/cli/commands/teams/agent.test.ts

# Full test suite
npm test

# Linting
npm run lint
```

### Manual Verification

1. Run `npm test tests/integration/cli/commands/teams-editing.test.ts` - all 11 tests should pass
2. Inspect generated `.work/teams.xml` - should contain proper `<![CDATA[...]]>` sections, no `<__cdata>` tags
3. Verify CI passes after push - no "Invalid tag name: \_\_cdata" errors

---

## Scope Boundaries

**IN SCOPE:**

- Fix double-nesting in XML generation logic (4 specific lines)
- Ensure proper CDATA object type checking
- Fix failing integration tests

**OUT OF SCOPE (do not touch):**

- XML parsing logic (already works correctly)
- fast-xml-parser configuration (correct as-is)
- Template XML files (already have proper CDATA format)
- Other XML functionality not related to CDATA

---

## Metadata

- **Investigated by**: Claude
- **Timestamp**: 2026-02-26T20:45:00Z
- **Artifact**: `.claude/PRPs/issues/investigation-xml-cdata-issue.md`
