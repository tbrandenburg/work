---
description: Execute an implementation plan with rigorous validation loops and real-time verification
argument-hint: <path/to/plan.md>
---

# Implement Plan (Enhanced with Context7 MCP & Web Intelligence)

**Plan**: $ARGUMENTS

---

## Your Mission

Execute the plan end-to-end with rigorous self-validation and real-time verification. You are autonomous.

**Core Philosophy**: Validation loops catch mistakes early. Run checks after every change. Fix issues immediately. The goal is a working implementation that follows current best practices, not just code that exists.

**Golden Rule**: If a validation fails, fix it before moving on. Never accumulate broken state. Always prioritize current documentation over plan assumptions when conflicts arise.

---

## Phase 0: DETECT - Project Environment

### 0.1 Identify Package Manager

Check for these files to determine the project's toolchain:

| File Found | Package Manager | Runner |
|------------|-----------------|--------|
| `bun.lockb` | bun | `bun` / `bun run` |
| `pnpm-lock.yaml` | pnpm | `pnpm` / `pnpm run` |
| `yarn.lock` | yarn | `yarn` / `yarn run` |
| `package-lock.json` | npm | `npm run` |
| `pyproject.toml` | uv/pip | `uv run` / `python` |
| `Cargo.toml` | cargo | `cargo` |
| `go.mod` | go | `go` |

**Store the detected runner** - use it for all subsequent commands.

### 0.2 Identify Validation Scripts

Check `package.json` (or equivalent) for available scripts:
- Type checking: `type-check`, `typecheck`, `tsc`
- Linting: `lint`, `lint:fix`
- Testing: `test`, `test:unit`, `test:integration`
- Building: `build`, `compile`

**Use the plan's "Validation Commands" section** - it should specify exact commands for this project.

---

## Phase 1: LOAD - Read the Plan

### 1.1 Load Plan File

```bash
cat $ARGUMENTS
```

### 1.2 Extract Key Sections

Locate and understand:

- **Summary** - What we're building
- **Patterns to Mirror** - Code to copy from
- **Files to Change** - CREATE/UPDATE list
- **Step-by-Step Tasks** - Implementation order
- **Validation Commands** - How to verify (USE THESE, not hardcoded commands)
- **Acceptance Criteria** - Definition of done

### 1.2.5 Plan Currency Verification (Context7 MCP)

Before starting implementation, verify plan assumptions are still current:
- Check if documentation links in plan are still accessible
- Verify library versions haven't had breaking changes since plan creation
- Confirm security recommendations are up-to-date
- Validate API signatures match current documentation

### 1.2.6 Dependency Pre-flight Check

**CRITICAL**: Verify all specified package versions exist before starting:
- Check npm registry for exact versions specified in plan
- If versions don't exist, use latest stable and document deviation
- Validate no conflicts with existing package.json dependencies
- Flag any security advisories for specified versions

### 1.3 Validate Plan Exists

**If plan not found:**

```
Error: Plan not found at $ARGUMENTS

Create a plan first: /prp-plan "feature description"
```

**PHASE_1_CHECKPOINT:**

- [ ] Plan file loaded
- [ ] Key sections identified
- [ ] Tasks list extracted
- [ ] **Plan assumptions verified as current**
- [ ] **Documentation links validated**
- [ ] **Package versions verified to exist**
- [ ] **No dependency conflicts detected**

---

## Phase 2: PREPARE - Git State

### 2.1 Check Current State

```bash
git branch --show-current
git status --porcelain
git worktree list
```

### 2.2 Branch Decision

| Current State     | Action                                               |
| ----------------- | ---------------------------------------------------- |
| In worktree       | Use it (log: "Using worktree")                       |
| On main, clean    | Create branch: `git checkout -b feature/{plan-slug}` |
| On main, dirty    | STOP: "Stash or commit changes first"                |
| On feature branch | Use it (log: "Using existing branch")                |

### 2.3 Sync with Remote

```bash
git fetch origin
git pull --rebase origin main 2>/dev/null || true
```

**PHASE_2_CHECKPOINT:**

- [ ] On correct branch (not main with uncommitted work)
- [ ] Working directory ready
- [ ] Up to date with remote

---

## Phase 2.5: INTELLIGENCE - Pre-execution Validation

### 2.5.1 Plan Freshness Check

Use Context7 MCP to verify plan assumptions:
- Documentation links still valid and current
- Library versions haven't had breaking changes
- Security recommendations unchanged since plan creation

### 2.5.2 Dependency Security Scan

Quick web search for:
- Recent CVE reports for project dependencies
- Security advisories from library maintainers
- Known issues with specific version combinations

**If critical issues found:**
- STOP implementation
- Update plan or create new plan with current information
- Document why original plan was outdated

**PHASE_2.5_CHECKPOINT:**
- [ ] Plan assumptions verified as current
- [ ] No critical security issues detected
- [ ] Safe to proceed with implementation

---

## Phase 3: EXECUTE - Implement Tasks

**For each task in the plan's Step-by-Step Tasks section:**

### 3.1 Read Context

1. Read the **MIRROR** file reference from the task
2. Understand the pattern to follow
3. Read any **IMPORTS** specified
4. **Verify current patterns (Context7 MCP):** Cross-check MIRROR patterns against live documentation
5. **Community validation:** Quick scan for recent issues with this implementation approach
6. **Security check:** Verify no recent vulnerabilities in dependencies being used

### 3.2 Implement

1. Make the change exactly as specified
2. Follow the pattern from MIRROR reference
3. Handle any **GOTCHA** warnings
4. Apply any current best practices discovered in verification

### 3.3 Validate Immediately

**After EVERY file change, run the type-check command from the plan's Validation Commands section.**

Common patterns:
- `{runner} run type-check` (JS/TS projects)
- `mypy .` (Python)
- `cargo check` (Rust)
- `go build ./...` (Go)

**If types fail:**

1. Read the error
2. Fix the issue
3. Re-run type-check
4. Only proceed when passing

### 3.4 Track Progress

Log each task as you complete it:

```
Task 1: CREATE src/features/x/models.ts ✅
Task 2: CREATE src/features/x/service.ts ✅
Task 3: UPDATE src/routes/index.ts ✅
```

**Deviation Handling:**
If you must deviate from the plan:

- Note WHAT changed
- Note WHY it changed (e.g., "package version didn't exist", "current documentation differs", "configuration conflict detected")
- **Note if deviation was due to current documentation**
- **Note if deviation was due to package availability**
- **Note if deviation was due to configuration conflicts**
- Continue with the deviation documented

**Configuration Conflict Resolution:**
If tool configurations conflict (e.g., ESLint projectService vs project settings):
1. Try the plan's approach first
2. If it fails, simplify configuration (remove conflicting options)
3. Document the conflict and resolution
4. Verify the simplified config still provides intended functionality

**PHASE_3_CHECKPOINT:**

- [ ] All tasks executed in order
- [ ] Each task passed type-check
- [ ] Deviations documented
- [ ] **Current patterns verified and applied**

---

## Phase 3.5: VERIFY - Real-time Implementation Validation

### 3.5.1 API Compatibility Check

Use Context7 MCP to verify:
- All API calls in implemented code match current documentation signatures
- No deprecated methods are being used
- Import statements reference current library exports

### 3.5.2 Security Validation

Quick web scan for:
- Recent security advisories for dependencies used
- Current security best practices for implemented patterns
- Known vulnerabilities in library versions

### 3.5.3 Community Intelligence

Check for:
- Recent Stack Overflow discussions about similar implementations
- GitHub issues related to the patterns being used
- Framework maintainer recommendations that might affect implementation

**If issues found:**
1. Document the discrepancy
2. Update implementation to match current standards
3. Note deviation in implementation log

**PHASE_3.5_CHECKPOINT:**
- [ ] API signatures verified against live docs
- [ ] No security vulnerabilities detected
- [ ] Implementation aligns with current community best practices

---

## Phase 4: VALIDATE - Full Verification

### 4.1 Static Analysis

**Run the type-check and lint commands from the plan's Validation Commands section.**

Common patterns:
- JS/TS: `{runner} run type-check && {runner} run lint`
- Python: `ruff check . && mypy .`
- Rust: `cargo check && cargo clippy`
- Go: `go vet ./...`

**Must pass with zero errors.**

If lint errors:

1. Run the lint fix command (e.g., `{runner} run lint:fix`, `ruff check --fix .`)
2. Re-check
3. Manual fix remaining issues

### 4.1.5 Current Standards Validation

Use Context7 MCP to verify implementation follows current best practices:
- Security patterns align with latest OWASP recommendations
- Performance patterns match current optimization techniques
- Testing approaches follow current framework recommendations

**Must align with current industry standards.**

### 4.2 Unit Tests

**You MUST write or update tests for new code.** This is not optional.

**Test requirements:**

1. Every new function/feature needs at least one test
2. Edge cases identified in the plan need tests
3. Update existing tests if behavior changed

**Write tests**, then run the test command from the plan.

Common patterns:
- JS/TS: `{runner} test` or `{runner} run test`
- Python: `pytest` or `uv run pytest`
- Rust: `cargo test`
- Go: `go test ./...`

**If tests fail:**

1. Read failure output
2. Determine: bug in implementation or bug in test?
3. Fix the actual issue
4. Re-run tests
5. Repeat until green

### 4.3 Build Check

**Run the build command from the plan's Validation Commands section.**

Common patterns:
- JS/TS: `{runner} run build`
- Python: N/A (interpreted) or `uv build`
- Rust: `cargo build --release`
- Go: `go build ./...`

**Must complete without errors.**

### 4.4 Integration Testing (if applicable)

**If the plan involves API/server changes, use the integration test commands from the plan.**

Example pattern:
```bash
# Start server in background (command varies by project)
{runner} run dev &
SERVER_PID=$!
sleep 3

# Test endpoints (adjust URL/port per project config)
curl -s http://localhost:{port}/health | jq

# Stop server
kill $SERVER_PID
```

### 4.5 Edge Case Testing

Run any edge case tests specified in the plan.

**PHASE_4_CHECKPOINT:**

- [ ] Type-check passes (command from plan)
- [ ] Lint passes (0 errors)
- [ ] Tests pass (all green)
- [ ] Build succeeds
- [ ] Integration tests pass (if applicable)
- [ ] **Current standards validation passes**
- [ ] **Security validation complete**

---

## Phase 5: REPORT - Create Implementation Report

### 5.1 Create Report Directory

```bash
mkdir -p .claude/PRPs/reports
```

### 5.2 Generate Report

**Path**: `.claude/PRPs/reports/{plan-name}-report.md`

```markdown
# Implementation Report

**Plan**: `$ARGUMENTS`
**Source Issue**: #{number} (if applicable)
**Branch**: `{branch-name}`
**Date**: {YYYY-MM-DD}
**Status**: {COMPLETE | PARTIAL}

---

## Summary

{Brief description of what was implemented}

---

## Assessment vs Reality

Compare the original investigation's assessment with what actually happened:

| Metric     | Predicted   | Actual   | Reasoning                                                                      |
| ---------- | ----------- | -------- | ------------------------------------------------------------------------------ |
| Complexity | {from plan} | {actual} | {Why it matched or differed - e.g., "discovered additional integration point"} |
| Confidence | {from plan} | {actual} | {e.g., "root cause was correct" or "had to pivot because X"}                   |

**If implementation deviated from the plan, explain why:**

- {What changed and why - based on what you discovered during implementation}

---

## Real-time Verification Results

| Check | Result | Details |
|-------|--------|---------|
| Documentation Currency | ✅/❌ | All references verified current |
| API Compatibility | ✅/❌ | Signatures match live documentation |
| Security Status | ✅/❌ | No vulnerabilities detected |
| Community Alignment | ✅/❌ | Follows current best practices |

## Context7 MCP Queries Made

- {Number} documentation verifications
- {Number} API compatibility checks  
- {Number} security scans
- Last verification: {timestamp}

## Community Intelligence Gathered

- {Number} recent issue discussions reviewed
- {Number} security advisories checked
- {Number} updated patterns identified

---

## Tasks Completed

| #   | Task               | File       | Status |
| --- | ------------------ | ---------- | ------ |
| 1   | {task description} | `src/x.ts` | ✅     |
| 2   | {task description} | `src/y.ts` | ✅     |

---

## Validation Results

| Check       | Result | Details               |
| ----------- | ------ | --------------------- |
| Type check  | ✅     | No errors             |
| Lint        | ✅     | 0 errors, N warnings  |
| Unit tests  | ✅     | X passed, 0 failed    |
| Build       | ✅     | Compiled successfully |
| Integration | ✅/⏭️  | {result or "N/A"}     |
| **Current Standards** | ✅ | **Verified against live documentation** |

---

## Files Changed

| File       | Action | Lines     |
| ---------- | ------ | --------- |
| `src/x.ts` | CREATE | +{N}      |
| `src/y.ts` | UPDATE | +{N}/-{M} |

---

## Deviations from Plan

{List any deviations with rationale, including those due to current documentation, or "None"}

---

## Issues Encountered

{List any issues and how they were resolved, or "None"}

---

## Tests Written

| Test File       | Test Cases               |
| --------------- | ------------------------ |
| `src/x.test.ts` | {list of test functions} |

---

## Next Steps

- [ ] Review implementation
- [ ] Create PR: `gh pr create` (if applicable)
- [ ] Merge when approved
```

### 5.3 Update Source PRD (if applicable)

**Check if plan was generated from a PRD:**
- Look in the plan file for `Source PRD:` reference
- Or check if plan filename matches a phase pattern

**If PRD source exists:**

1. Read the PRD file
2. Find the phase row in the Implementation Phases table
3. Update the phase:
   - Change Status from `in-progress` to `complete`
4. Save the PRD

### 5.4 Archive Plan

```bash
mkdir -p .claude/PRPs/plans/completed
mv $ARGUMENTS .claude/PRPs/plans/completed/
```

**PHASE_5_CHECKPOINT:**

- [ ] Report created at `.claude/PRPs/reports/`
- [ ] PRD updated (if applicable) - phase marked complete
- [ ] Plan moved to completed folder

---

## Phase 6: OUTPUT - Report to User

```markdown
## Implementation Complete

**Plan**: `$ARGUMENTS`
**Source Issue**: #{number} (if applicable)
**Branch**: `{branch-name}`
**Status**: ✅ Complete

### Validation Summary

| Check      | Result          |
| ---------- | --------------- |
| Type check | ✅              |
| Lint       | ✅              |
| Tests      | ✅ ({N} passed) |
| Build      | ✅              |
| **Current Standards** | ✅ |

### Real-time Verification

- **Documentation**: All references verified current
- **Security**: No vulnerabilities detected
- **Community**: Follows latest best practices

### Files Changed

- {N} files created
- {M} files updated
- {K} tests written

### Deviations

{If none: "Implementation matched the plan."}
{If any: Brief summary of what changed and why, including current documentation updates}

### Artifacts

- Report: `.claude/PRPs/reports/{name}-report.md`
- Plan archived to: `.claude/PRPs/plans/completed/`

{If from PRD:}
### PRD Progress

**PRD**: `{prd-file-path}`
**Phase Completed**: #{number} - {phase name}

| # | Phase | Status |
|---|-------|--------|
{Updated phases table showing progress}

**Next Phase**: {next pending phase, or "All phases complete!"}
{If next phase can parallel: "Note: Phase {X} can also start now (parallel)"}

To continue: `/prp-plan {prd-path}`

### Next Steps

1. Review the report (especially if deviations noted)
2. Create PR: `gh pr create` or `/prp-pr`
3. Merge when approved
{If more phases: "4. Continue with next phase: `/prp-plan {prd-path}`"}
```

---

## Handling Failures

### Type Check Fails

1. Read error message carefully
2. Fix the type issue
3. Re-run the type-check command
4. Don't proceed until passing

### Tests Fail

1. Identify which test failed
2. Determine: implementation bug or test bug?
3. Fix the root cause (usually implementation)
4. Re-run tests
5. Repeat until green

### Lint Fails

1. Run the lint fix command for auto-fixable issues
2. Manually fix remaining issues
3. Re-run lint
4. Proceed when clean

### Build Fails

1. Usually a type or import issue
2. Check the error output
3. Fix and re-run

### Integration Test Fails

1. Check if server started correctly
2. Verify endpoint exists
3. Check request format
4. Fix implementation and retry

### Documentation Mismatch (Context7 MCP)
1. Live documentation differs from plan assumptions
2. Update implementation to match current API
3. Document the change as deviation from plan
4. Re-run verification

### Package Version Unavailable
1. Specified version doesn't exist in registry
2. Use latest stable version that satisfies minimum requirements
3. Document version substitution with rationale
4. Verify compatibility with existing dependencies

### Configuration Conflicts
1. Tool configurations conflict (e.g., ESLint projectService + project settings)
2. Simplify configuration by removing conflicting options
3. Test that simplified config still provides intended functionality
4. Document the conflict and resolution approach

### Security Advisory Found (Web Search)
1. Vulnerability detected in dependency or pattern
2. Update to secure version or alternative approach
3. Re-run security validation
4. Document security fix in report

### Community Best Practice Change
1. Recent community consensus differs from implementation
2. Evaluate if change is necessary for this project
3. Update if critical, or document decision to maintain current approach
4. Note rationale in deviation log

---

## Success Criteria

- **TASKS_COMPLETE**: All plan tasks executed
- **TYPES_PASS**: Type-check command exits 0
- **LINT_PASS**: Lint command exits 0 (warnings OK)
- **TESTS_PASS**: Test command all green
- **BUILD_PASS**: Build command succeeds
- **REPORT_CREATED**: Implementation report exists
- **PLAN_ARCHIVED**: Original plan moved to completed
- **CURRENT_STANDARDS**: Implementation verified against live documentation
- **SECURITY_CLEAN**: No vulnerabilities detected in dependencies
