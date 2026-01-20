# work CLI - Unified Task Management for AI Agents

## Problem Statement

Software engineers building agent harnesses and AI-human collaborative workflows are forced to integrate with multiple proprietary task management APIs (Jira, GitHub, Linear, Azure DevOps) or resort to fragile JSON task lists and markdown TODOs. This creates vendor lock-in, increases integration complexity, and prevents agents from seamlessly working alongside humans in existing project management workflows.

## Evidence

- 2025-2026 is the era of multi-agent orchestration, but current solutions lack unified task management interfaces
- Agent harnesses currently rely on JSON task lists or direct vendor API integration
- Existing integrations are point-to-point (Jira↔Azure DevOps) rather than hub-and-spoke
- No lightweight CLI exists for CI/CD and agent harness integration across all major platforms
- Model Context Protocol (MCP) provides agent-tool communication but lacks task management abstraction

## Proposed Solution

A unified, stateless CLI tool that provides a consistent interface for managing work items across multiple project management backends. Uses an adapter pattern to support Jira, GitHub, Linear, Azure DevOps, and local filesystem storage without vendor lock-in, enabling both AI agents and humans to collaborate seamlessly through a single command interface.

## Key Hypothesis

We believe `work` will enable agents work in real projects with several developers together.
We'll know we're right when agents can not be distinguished from humans in the workflow or when agents involve humans in their workflow.

## What We're NOT Building

- **Own task management software** - We integrate with existing tools, not replace them
- **Task management backend** - We're an interface layer, not a storage system
- **High-level orchestration platform** - We focus on task management, not workflow orchestration
- **Non-technical user interfaces** - CLI-first for developers and agents

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Agent-human workflow indistinguishability | Qualitative assessment | User feedback and workflow analysis |
| Human-in-the-loop engagement via notifications | >80% response rate | Notification response tracking |
| Cross-backend task management adoption | 3+ backends per user | Context usage analytics |
| CLI response time | <2s for list operations | Performance benchmarks |

## Open Questions

- [ ] Performance issues with large-scale task management systems
- [ ] Adapter integration complexity and maintenance overhead  
- [ ] CLI UX acceptance among target users
- [ ] Notification delivery reliability across different channels

---

## Users & Context

**Primary User**
- **Who**: Applied AI engineers setting up agent harnesses needing interoperable task management interfaces
- **Current behavior**: Direct API integration with individual task management systems or JSON task lists
- **Trigger**: Need to deploy agents in multi-developer, multi-tool environments
- **Success state**: Agents seamlessly participate in existing project workflows

**Secondary User**
- **Who**: Product & Business Owners letting their ideas get reality through autonomous agent teams
- **Current behavior**: Manual coordination between human developers and emerging agent capabilities
- **Trigger**: Want to set up comprehensive agentic scrum teams
- **Success state**: Autonomous idea realization through agent-human collaboration

**Job to Be Done**
When `work` is implemented, I want to set up a comprehensive agentic scrum team communicating via tasks so I can realize ideas autonomously.

**Non-Users**
- Non-technical users who need GUI interfaces
- Deep coders who prefer direct API integration
- Teams using single task management systems without agent integration needs

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | All core work commands with local-fs adapter | Proves concept and enables offline development |
| Must | Context-based multi-backend scoping | Essential for multi-tool environments |
| Must | Telegram notifications for human-in-the-loop | Critical for agent-human collaboration |
| Should | GitHub project integration | Most common developer workflow integration |
| Could | Additional backend adapters (Jira, Linear, ADO) | Expands market reach but not essential for validation |
| Could | TUI interface (`work ui`) | Nice UX improvement but CLI-first approach |
| Won't | Custom task management backend | Explicitly out of scope |

### MVP Scope

Phase 1: Project scaffolding with modern TypeScript development workflow
Phase 2: Complete local-fs adapter with all core work commands (create, start, close, get, list, set, edit, link, context management)

### User Flow

1. **Setup Context**: `work context add local-project --tool local-fs --path ./tasks`
2. **Agent Creates Task**: `work create "Implement user authentication" --kind task --priority high`
3. **Agent Works**: `work start TASK-001`, `work set TASK-001 assignee=agent-alpha`
4. **Human Notification**: `work notify send where assignee=human to telegram-dev`
5. **Human Collaboration**: `work get TASK-001`, `work comment TASK-001 "Needs OAuth2 integration"`
6. **Task Completion**: `work close TASK-001`

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- Adapter pattern isolates backend complexity and enables independent testing
- Stateless execution model prevents caching issues and ensures predictable behavior
- Property graph model provides consistent mental model across all backends
- TypeScript/Node.js with oclif framework for professional CLI development

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Multi-backend API complexity | Medium | Adapter pattern isolates complexity per backend |
| Performance with large datasets | Medium | Ephemeral graph slices and minimal data loading |
| Authentication management | Low | Context-scoped credential isolation |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Project Scaffolding | Modern TypeScript development workflow, testing framework, CI/CD | in-progress | - | - | [project-scaffolding.plan.md](.claude/PRPs/plans/project-scaffolding.plan.md) |
| 2 | Core Engine & Local-fs MVP | Complete work CLI with local-fs adapter and all core commands | in-progress | - | 1 | [core-engine-local-fs-mvp.plan.md](.claude/PRPs/plans/core-engine-local-fs-mvp.plan.md) |
| 3 | Notification System | Telegram integration for human-in-the-loop workflows | pending | with 4 | 2 | - |
| 4 | GitHub Integration | GitHub Projects adapter for developer workflow integration | pending | with 3 | 2 | - |
| 5 | Additional Adapters | Jira, Linear, Azure DevOps adapters for broader ecosystem support | pending | - | 3, 4 | - |

### Phase Details

**Phase 1: Project Scaffolding**
- **Goal**: Establish professional CLI development foundation
- **Scope**: TypeScript setup, testing pyramid, CI/CD, documentation system
- **Success signal**: Clean `npm install && npm test && npm build` workflow

**Phase 2: Core Engine & Local-fs MVP**
- **Goal**: Prove the core concept with complete local-fs implementation
- **Scope**: All work commands, context management, graph operations, query system
- **Success signal**: Full user journey working with local filesystem backend

**Phase 3: Notification System**
- **Goal**: Enable human-in-the-loop workflows through notifications
- **Scope**: Telegram integration, notification targets, query-based alerts
- **Success signal**: Agents can successfully trigger human involvement

**Phase 4: GitHub Integration**
- **Goal**: Connect to most common developer workflow platform
- **Scope**: GitHub Projects adapter, issue management, PR integration
- **Success signal**: Seamless work item management in GitHub-based projects

**Phase 5: Additional Adapters**
- **Goal**: Expand to enterprise task management platforms
- **Scope**: Jira, Linear, Azure DevOps adapters with full feature parity
- **Success signal**: Same commands work across all supported backends

### Parallelism Notes

Phases 3 and 4 can run in parallel as they are independent feature additions to the core engine. Phase 5 requires the notification system and GitHub integration to be complete for comprehensive testing.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| CLI Framework | oclif (TypeScript) | Commander.js, Yargs, Custom | Professional CLI features, TypeScript support, extensive ecosystem |
| Architecture Pattern | Adapter Pattern | Direct Integration, Plugin System | Isolates backend complexity, enables independent testing |
| Primary Backend | local-fs | GitHub, Jira | Offline-first, no external dependencies, reference implementation |
| Notification Channel | Telegram | Slack, Email, Webhooks | Simple API, widely used by developers, reliable delivery |

---

## Research Summary

**Market Context**
- 2025-2026 is the era of multi-agent orchestration with frameworks like LangGraph, CrewAI, AutoGen
- Current solutions focus on high-level orchestration but lack unified task management
- Existing tools are vendor-specific (Capybara) or session-focused (CLI Agent Orchestrator)
- Model Context Protocol provides agent-tool communication standard but lacks task management layer

**Technical Context**
- Comprehensive architecture and specifications already documented
- Clear technology stack selected (TypeScript/Node.js, oclif)
- Detailed POC implementation plan exists
- Testing strategy defined with pyramid approach (70% unit, 20% integration, 10% e2e)
- No implementation exists yet - pure design phase ready for development

---

*Generated: 2026-01-19T23:29:36.873+01:00*
*Status: DRAFT - needs validation*
