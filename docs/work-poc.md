# work CLI — Proof of Concept Implementation Plan

This document outlines the first two implementation phases for the `work` CLI, focusing on establishing a solid foundation and delivering a functional MVP with the local-fs adapter.

---

## Phase 1: Project Scaffolding

### 1.1 Objectives

Establish a professional, first-class CLI project foundation that supports:

- Modern TypeScript development workflow
- Testing pyramid implementation
- CI/CD pipeline
- Documentation generation
- Release management

### 1.2 Deliverables

#### Project Structure

```
work-cli/
├── src/
│   ├── cli/           # Command parsing and CLI interface
│   ├── core/          # Core engine and graph logic
│   ├── adapters/      # Adapter implementations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── tests/
│   ├── unit/          # Unit tests (70%)
│   ├── integration/   # Integration tests (20%)
│   └── e2e/           # End-to-end tests (10%)
├── docs/              # Documentation (current content)
├── examples/          # Usage examples and demos
├── scripts/           # Build and development scripts
├── Makefile           # Unified development commands
└── .pre-commit-config.yaml  # Pre-commit hook configuration
```

#### Development Infrastructure

- **Package Management**: npm/yarn with lockfile
- **TypeScript Configuration**: Strict mode, path mapping
- **Testing Framework**: Jest with coverage reporting
- **Linting**: ESLint + Prettier
- **Build System**: TypeScript compiler + bundling
- **CI/CD**: GitHub Actions for test/build/release
- **Makefile**: Unified command interface for all development tasks
- **Pre-commit Hooks**: Automated code quality checks before commits

#### Documentation System

- **API Documentation**: TypeDoc generation
- **CLI Help**: Built-in help system
- **Examples**: Working code samples
- **Contributing Guide**: Development workflow

### 1.3 Success Criteria

- [ ] Clean `npm install && npm test && npm build` workflow
- [ ] Makefile with standardized commands (install, test, build, lint, clean)
- [ ] Pre-commit hooks preventing bad commits (lint, test, format)
- [ ] Test coverage reporting with >20% target (PoC)
- [ ] Automated CI pipeline with all checks passing
- [ ] Professional README with installation/usage
- [ ] Semantic versioning and release automation

---

## Phase 2: work MVP (local-fs adapter)

### 2.1 Objectives

Deliver a fully functional CLI with complete local-fs adapter support, demonstrating:

- Core work item lifecycle management
- Context-based scoping
- Graph-based relations
- Stateless execution model
- Testing pyramid compliance

### 2.2 Core Features

#### 2.2.1 Work Item Lifecycle

```bash
work create "Fix login bug" --kind task --priority high
work start TASK-001
work close TASK-001
work reopen TASK-001
```

#### 2.2.2 Data Access

```bash
work get TASK-001
work list
work list where state=active
work list where kind=task and priority=high
```

#### 2.2.3 Attribute Management

```bash
work set TASK-001 priority=high assignee=alice
work edit TASK-001 --title "Updated title" --priority medium
work unset TASK-001 assignee
```

#### 2.2.4 Relations

```bash
work link EPIC-001 parent_of TASK-001
work link TASK-001 blocks TASK-002
work unlink TASK-001 blocks TASK-002
```

#### 2.2.5 Context Management

```bash
work context add local-project --tool local-fs --path ./my-project
work context set local-project
work context list
work context show local-project
work context remove old-project
```

#### 2.2.6 Cleanup

```bash
work delete TASK-001
```

### 2.3 Technical Implementation

#### 2.3.1 Core Components

| Component        | Responsibility                     |
| ---------------- | ---------------------------------- |
| CLI Parser       | Command parsing and validation     |
| Context Resolver | Context selection and validation   |
| Query Planner    | Minimal data requirement analysis  |
| Local-fs Adapter | Filesystem-based work item storage |
| Graph Builder    | Ephemeral graph slice construction |
| Query Evaluator  | Where/order/limit evaluation       |
| Output Formatter | Human and machine-readable output  |

#### 2.3.2 Local-fs Implementation

**Filesystem Structure**:

```
.work/
└── projects/
    └── default/
        ├── items/
        │   ├── 0001.md
        │   ├── 0002.md
        │   └── 0003.md
        ├── links.json
        └── meta.json
```

**Work Item Format** (Markdown + YAML frontmatter):

```markdown
---
id: 0001
kind: task
state: active
title: Fix login bug
assignee: alice
priority: high
created: 2026-01-19T15:00:00Z
updated: 2026-01-19T15:30:00Z
---

Detailed description of the login bug and proposed solution.
```

**Relations Storage** (JSON):

```json
[
  { "from": "0001", "rel": "child_of", "to": "EPIC-001" },
  { "from": "0001", "rel": "blocks", "to": "0002" }
]
```

### 2.4 Testing Strategy (Pyramid Compliance)

#### 2.4.1 Unit Tests (70%)

- **Core Logic**: Query evaluation, relation validation, state transitions
- **Adapters**: Local-fs file operations, data parsing, error handling
- **Utilities**: ID generation, validation, formatting
- **Mocking**: Filesystem operations, external dependencies

#### 2.4.2 Integration Tests (20%)

- **Adapter Integration**: Full local-fs workflow with real filesystem
- **Context Resolution**: Multi-context scenarios
- **Graph Operations**: Complex relation scenarios
- **Error Scenarios**: Invalid data, missing files, permission issues

#### 2.4.3 End-to-End Tests (10%)

- **CLI Workflows**: Complete user journeys from command line
- **Cross-Feature**: Complex scenarios involving multiple commands
- **Performance**: Response time validation for NFR compliance
- **Real Usage**: Actual project scenarios

### 2.5 Success Criteria

#### 2.5.1 Functional Requirements

- [ ] All core commands implemented and working
- [ ] Context management fully functional
- [ ] Local-fs adapter complete with validation
- [ ] Query system supporting where/order/limit
- [ ] Relation management with cycle detection

#### 2.5.2 Non-Functional Requirements

- [ ] List operations < 2s for up to 1,000 items
- [ ] Memory usage < 100MB per command
- [ ] Test coverage > 40% with pyramid distribution (MVP)
- [ ] CLI startup < 500ms
- [ ] Comprehensive error handling

#### 2.5.3 Quality Gates

- [ ] All tests passing in CI
- [ ] No critical security vulnerabilities
- [ ] Documentation complete and accurate
- [ ] Performance benchmarks met
- [ ] Code review approval process

### 2.6 Deliverables

1. **Functional CLI**: Complete work CLI with all MVP features
2. **Local-fs Adapter**: Full implementation with validation
3. **Test Suite**: Comprehensive tests following pyramid approach
4. **Documentation**: Updated with implementation details
5. **Examples**: Working examples and tutorials
6. **Performance Benchmarks**: Baseline measurements for NFRs

---

## Implementation Timeline

### Phase 1: Project Scaffolding (1-2 weeks)

- Week 1: Project structure, build system, CI/CD
- Week 2: Testing framework, documentation system, polish

### Phase 2: work MVP (3-4 weeks)

- Week 1: Core engine and CLI parser
- Week 2: Local-fs adapter and context management
- Week 3: Relations, queries, and advanced features
- Week 4: Testing completion, documentation, performance tuning

---

## Risk Mitigation

### Technical Risks

- **Filesystem Performance**: Early benchmarking and optimization
- **Query Complexity**: Incremental implementation with validation
- **Memory Management**: Profiling and leak detection

### Project Risks

- **Scope Creep**: Strict MVP feature boundary
- **Testing Debt**: Test-driven development approach
- **Documentation Lag**: Continuous documentation updates

---

## Success Metrics

- **Functionality**: 100% of MVP features working
- **Quality**: >40% test coverage with pyramid distribution (MVP)
- **Performance**: All NFR targets met
- **Usability**: Positive feedback from initial users
- **Maintainability**: Clean code metrics and documentation
