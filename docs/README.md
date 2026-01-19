# work CLI Documentation Index

This folder contains comprehensive documentation for the `work` CLI - a unified, stateless command-line tool for managing work items across multiple project management backends (Jira, GitHub, Linear, Azure DevOps, and local filesystem).

## Core Documentation Files

### [work-cli-spec.md](work-cli-spec.md)
**Complete CLI specification and command reference**
- Defines all CLI commands, syntax, and lifecycle operations
- Core commands: create, start, close, reopen, get, list, set, edit
- Context management for multi-backend support
- Authentication, relations, notifications, and schema discovery
- Comprehensive command grammar and UX rules

### [work-user-journey-context-and-query.md](work-user-journey-context-and-query.md)
**Concrete user journey demonstrating context and querying**
- Step-by-step example: finding high-priority tasks under an epic
- Explains the mental model: context defines scope, queries filter within scope
- Demonstrates explicit relation traversal and ordering
- Shows how the same patterns work across all backends

### [work-adapter-architecture.md](work-adapter-architecture.md)
**Multi-backend support via adapter pattern**
- Architectural overview of adapter-based design
- Detailed comparison of supported backends (local-fs, Jira, GitHub, Linear, ADO)
- Deep dive into local-fs adapter as reference implementation
- Filesystem layout, work item representation, and validation rules

### [work-graph-ontology-and-runtime.md](work-graph-ontology-and-runtime.md)
**Internal graph model and stateless execution**
- Property graph ontology: WorkItem nodes and typed relation edges
- Runtime model using ephemeral graph slices (no global caching)
- Explains "stateless" execution: no daemon, no background processes
- Adapter interaction patterns and persistence models

### [work-local-fs-execution-flow.md](work-local-fs-execution-flow.md)
**Detailed execution flow for local filesystem backend**
- Step-by-step command execution from parsing to output
- Demonstrates minimal filesystem access (no full project scans)
- Shows graph slice assembly and query evaluation
- Proves stateless execution guarantees

### [work-c4-architecture.md](work-c4-architecture.md)
**C4 architecture diagrams in PlantUML format**
- System context: work CLI interacting with external systems
- Container diagram: internal CLI components and adapters
- Component diagram: detailed internal execution flow
- Runtime graph slice visualization

### [work-configuration-overview.md](work-configuration-overview.md)
**Configuration system and credential management**
- Two-stage configuration lookup (project-local and user-global)
- Security rules for credential isolation
- Context and notification target management
- Safe version control practices

### [work-nonfunctional-requirements.md](work-nonfunctional-requirements.md)
**Quality attributes and performance requirements**
- Performance targets: response times, startup, memory usage
- Scalability limits for different backends and data volumes
- Reliability: error handling, data integrity, availability
- Security: credential management, data protection
- Usability, compatibility, and maintainability standards

### [work-cli-tech-selection.md](work-cli-tech-selection.md)
**CLI technology selection and rationale**
- Records the technology choice for the CLI layer (oclif framework)
- Explains rationale for TypeScript/Node.js selection
- Documents alternatives considered and future TUI considerations
- Defines CLI layer scope and explicit non-goals
**Proof of concept implementation plan**
- Phase 1: Project scaffolding with modern TypeScript development workflow
- Phase 2: MVP implementation with complete local-fs adapter
- Testing pyramid compliance and comprehensive feature coverage
- Timeline, deliverables, and success criteria

## Key Concepts

- **Stateless CLI**: No daemon, no caching, ephemeral execution per command
- **Context-based scoping**: Explicit backend selection with isolated credentials
- **Adapter pattern**: Uniform interface across heterogeneous backends
- **Graph slices**: Minimal in-memory data structures for single command execution
- **Explicit relations**: Typed edges between work items (parent/child, blocks, duplicates)
- **Tool-agnostic**: Same mental model and commands work across all backends

## Architecture Highlights

- Multi-backend support without lowest-common-denominator limitations
- Offline-first capability via local-fs adapter
- No hidden synchronization or mirroring
- Predictable, scriptable command interface
- Independent adapter versioning and testing
