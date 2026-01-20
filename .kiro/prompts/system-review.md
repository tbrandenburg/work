---
description: Analyze implementation against plan for process improvements
argument-hint: <plan> <execution-report> <focus-notes>
---

# System Review

## Analysis Inputs

**Plan file:** $1  
**Execution report:** $2  
**Focus notes (optional):** $3

If focus notes are provided, treat them as **review directives** that highlight specific concerns, questions, or areas of emphasis for this system review.  
They do NOT replace standard analysis steps, but should influence prioritization, depth, and examples.

Perform a meta-level analysis of how well the implementation followed the plan and identify process improvements.

## Purpose

**System review is NOT code review.** You're not looking for bugs in the code – you're looking for bugs in the process.

**Your job:**

- Analyze plan adherence and divergence patterns
- Identify which divergences were justified vs problematic
- Surface process improvements that prevent future issues
- Suggest updates to steering documents, plan templates, commands
- Explicitly address any items raised in **Focus notes**, if provided

**Philosophy:**

- Good divergence reveals plan limitations → improve planning
- Bad divergence reveals unclear requirements → improve communication
- Repeated issues reveal missing automation → create commands

## Context & Inputs

You will analyze four key artifacts:

**Plan Command:**  
Read this to understand the planning process and what instructions guide plan creation.  
`.kiro/prompts/prp-plan-ctx7.md`

**Generated Plan:**  
Read this to understand what the agent was SUPPOSED to do.  
Plan file: `$1`

**Execute Command:**  
Read this to understand the execution process and what instructions guide implementation.  
`.kiro/prompts/prp-implement-ctx7.md`

**Execution Report:**  
Read this to understand what the agent ACTUALLY did and why.  
Execution report: `$2`

**Focus Notes (Optional):**  
If provided, read `$3` and use it to:
- Prioritize certain divergences
- Examine specific decisions more deeply
- Validate or refute stated concerns
- Ensure requested topics are explicitly discussed in findings

## Analysis Workflow

### Step 1: Understand the Planned Approach

Read the generated plan (`$1`) and extract:

- What features were planned?
- What architecture was specified?
- What validation steps were defined?
- What patterns were referenced?

### Step 2: Understand the Actual Implementation

Read the execution report (`$2`) and extract:

- What was implemented?
- What diverged from the plan?
- What challenges were encountered?
- What was skipped and why?

### Step 3: Classify Each Divergence

For each divergence identified in the execution report, classify as:

**Good Divergence ✅** (Justified):

- Plan assumed something that didn't exist in the codebase
- Better pattern discovered during implementation
- Performance optimization needed
- Security issue discovered that required different approach

**Bad Divergence ❌** (Problematic):

- Ignored explicit constraints in plan
- Created new architecture instead of following existing patterns
- Took shortcuts that introduce tech debt
- Misunderstood requirements

### Step 4: Trace Root Causes

For each problematic divergence, identify the root cause:

- Was the plan unclear? Where and why?
- Was context missing? Where and why?
- Was validation missing? Where and why?
- Was a manual step repeated? Where and why?

### Step 5: Generate Process Improvements

Based on patterns across divergences **and any Focus notes**, suggest:

- **Steering document updates:** Universal patterns or anti-patterns to document
- **Plan command updates:** Instructions that need clarification or missing steps
- **New commands:** Manual processes that should be automated
- **Validation additions:** Checks that would catch issues earlier

## Output Format

Save your analysis to:  
`.agents/system-reviews/[feature-name]-review.md`

### Report Structure:

#### Meta Information

- Plan reviewed: `$1`
- Execution report: `$2`
- Focus notes: `$3` (if provided)
- Date: [current date]

#### Overall Alignment Score: __/10

Scoring guide:

- 10: Perfect adherence, all divergences justified
- 7–9: Minor justified divergences
- 4–6: Mix of justified and problematic divergences
- 1–3: Major problematic divergences

#### Divergence Analysis

For each divergence from the execution report:

```yaml
divergence: [what changed]
planned: [what plan specified]
actual: [what was implemented]
reason: [agent's stated reason from report]
classification: good ✅ | bad ❌
justified: yes/no
root_cause: [unclear plan | missing context | etc]
