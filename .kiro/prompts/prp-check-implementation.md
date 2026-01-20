---
description: Adversarial validation of completed plan implementation to catch hallucinations, overemphasis, and hidden issues
argument-hint: <path/to/completed-plan.md>
---

# prp-check-implementation.md

**Purpose**: Adversarial validation of completed plan implementation to catch hallucinations, overemphasis, and hidden issues.

**Input**: Completed plan file path  
**Output**: Structured findings report with actionable todos

---

## EXECUTION INSTRUCTIONS

**CRITICAL**: Use the internal todo tool to work through this verification systematically. This is a checklist-driven process that requires:

1. **Todo-Based Processing**: Create a todo list for each verification category
2. **Evidence Collection**: Document actual findings, not assumptions  
3. **Comprehensive Coverage**: Verify ALL tasks from the plan, not just a sample
4. **Structured Reporting**: Build the findings report as you complete each todo

**Process Flow**:
- Load and parse the plan file completely
- Create todos for: plan extraction, task verification, validation commands, quality gates, functional tests
- Work through each todo systematically, checking off completed items
- Document findings for each completed verification step
- Generate comprehensive findings report

**Do not skip todos or provide summary-only results. Each task must be individually verified and checked off.**

---

## Execution Protocol

### 1. Load Plan and Extract Requirements

Input plan file: $ARGUMENTS

**Extract**:
- [ ] All tasks from "Step-by-Step Tasks" section
- [ ] Validation commands from "Validation Commands" section  
- [ ] Acceptance criteria from "Acceptance Criteria" section
- [ ] Coverage targets and thresholds
- [ ] Required file changes (CREATE/UPDATE list)

### 2. Adversarial Task Verification

**For each task in the plan**:

```markdown
## Task {N}: {Description}

**Plan Requirement**: {exact task description from plan}

### File Verification
- [ ] File exists: `{file-path}`
- [ ] File contains required functionality: {specific requirement}
- [ ] File follows specified pattern: {pattern reference}

### Implementation Check
```bash
# Verify actual implementation
ls -la {file-path}
grep -n "{key-function}" {file-path}
```

**Findings**:
- ❌ **MISSING**: {what's missing}
- ⚠️ **PARTIAL**: {what's incomplete}  
- ✅ **COMPLETE**: {what's verified}
```

### 3. Validation Command Execution

**Run each validation command from plan (if available)**:

```bash
# Execute exact commands from plan
{validation-command-1}
{validation-command-2}
```

**Record Results**:
```markdown
### Validation: {command}
**Expected**: {expected-result-from-plan}
**Actual**: {actual-result}
**Status**: ❌ FAIL | ⚠️ PARTIAL | ✅ PASS
**Gap**: {specific-issue-if-any}
```

### 4. Coverage and Quality Gates

```bash
# Check actual coverage vs plan targets
npm test -- --coverage
```

**Verify**:
- [ ] Statement coverage ≥ {plan-target}%
- [ ] Branch coverage ≥ {plan-target}%  
- [ ] Function coverage ≥ {plan-target}%
- [ ] Line coverage ≥ {plan-target}%

### 5. Functional Reality Check

**Test actual CLI functionality (if planned and possible)**:

```bash
# Verify each command works as specified
./bin/run.js --help
./bin/run.js {command-1} {test-args}
./bin/run.js {command-2} {test-args}
```

**Check**:
- [ ] All commands listed in help
- [ ] Commands execute without errors
- [ ] Output matches expected format
- [ ] Error handling works correctly

### 6. File System Verification

**Check expected artifacts**:

```bash
# Verify directory structure
find . -name "{expected-pattern}" -type f
ls -la {expected-directory}/
```

**Validate**:
- [ ] All CREATE files exist
- [ ] All UPDATE files modified  
- [ ] Directory structure matches plan
- [ ] No unexpected files created

---

## Findings Report Template

```markdown
# Implementation Verification Report

**Plan**: {plan-file-path}
**Verification Date**: {timestamp}
**Status**: ❌ FAILED | ⚠️ ISSUES | ✅ VERIFIED

---

## Executive Summary

**Tasks Completed**: {X}/{Y}
**Validations Passing**: {X}/{Y}  
**Critical Issues**: {count}
**Minor Issues**: {count}

---

## Critical Findings (BLOCKERS)

### ❌ Finding 1: {Issue Title}
**Task**: {task-number} - {task-description}
**Issue**: {specific-problem}
**Evidence**: 
```bash
{command-that-shows-issue}
# Output: {actual-output}
```
**Required Action**: 
- [ ] {specific-todo-1}
- [ ] {specific-todo-2}

---

## Minor Findings (IMPROVEMENTS)

### ⚠️ Finding 2: {Issue Title}  
**Task**: {task-number}
**Issue**: {specific-problem}
**Required Action**:
- [ ] {specific-todo}

---

## Verification Status by Category

### Tasks Implementation
- ✅ {completed-task-count} tasks fully implemented
- ⚠️ {partial-task-count} tasks partially implemented  
- ❌ {missing-task-count} tasks missing/broken

### Validation Gates
- ✅ Type checking: {status}
- ✅ Linting: {status}
- ❌ Test coverage: {actual}% (target: {target}%)
- ✅ Build: {status}
- ⚠️ Functional tests: {issues-found}

### Quality Metrics
- **Coverage**: {actual}% vs {target}% target
- **Test Count**: {actual} vs {expected} tests
- **File Changes**: {actual} vs {expected} files

---

## Action Items (Priority Order)

### 🔥 Critical (Must Fix)
- [ ] {critical-todo-1}
- [ ] {critical-todo-2}

### ⚠️ Important (Should Fix)  
- [ ] {important-todo-1}
- [ ] {important-todo-2}

### 💡 Minor (Nice to Fix)
- [ ] {minor-todo-1}

---

## Next Steps

1. **Address Critical Findings**: Fix all ❌ issues first
2. **Re-run Verification**: Execute this check again after fixes
3. **Address Important Findings**: Fix ⚠️ issues  
4. **Final Verification**: Confirm all todos completed

**Estimated Fix Time**: {time-estimate}
**Complexity**: LOW | MEDIUM | HIGH
```

---

## Adversarial Mindset

**Assume**:
- Implementation claims are exaggerated
- Tests might be superficial  
- Coverage might be gamed
- Files might be empty stubs
- Commands might not actually work

**Verify**:
- Actually run every command
- Check file contents, not just existence
- Test error cases, not just happy paths
- Measure real coverage, not reported numbers
- Validate against plan requirements, not implementation claims

**Report**:
- Specific gaps with evidence
- Actionable todos with clear acceptance criteria
- Priority levels for efficient fixing
- No false positives - only real issues

This creates a systematic, evidence-based verification that catches the exact issues we encountered: coverage bypassing, missing functionality, and validation gaps.
