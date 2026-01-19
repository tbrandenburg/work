# Architecture Principles

## Core Design Philosophy
The work CLI is built on three foundational principles that ensure scalability, maintainability, and user predictability.

**See [C4 Architecture Diagrams](../docs/work-c4-architecture.md) for visual system overview and component relationships.**

## Stateless Execution Model
- **No Daemon**: Each command runs independently without background processes ([docs/work-graph-ontology-and-runtime.md](../docs/work-graph-ontology-and-runtime.md))
- **Ephemeral Graph Slices**: Commands operate on minimal in-memory data structures, discarded after execution
- **No Global Caching**: No hidden synchronization or stale data issues
- **Predictable Behavior**: Same command always produces same result given same backend state

## Adapter Pattern Architecture
- **Uniform Interface**: All backends implement identical adapter contract ([docs/work-adapter-architecture.md](../docs/work-adapter-architecture.md))
- **Backend Independence**: CLI remains stable as backends are added/removed
- **No Lowest-Common-Denominator**: Each adapter can expose full backend capabilities
- **Isolated Testing**: Adapters can be tested independently without external dependencies

## Property Graph Data Model
- **WorkItem Nodes**: Minimal, stable core properties (id, kind, state, title, etc.)
- **Typed Relations**: Explicit edges (parent_of, blocks, duplicates, relates_to)
- **Graph Invariants**: Cycle detection, relation validation, consistency enforcement
- **Tool-Agnostic**: Same mental model works across all supported backends

## Context-Based Scoping
- **Explicit Selection**: No implicit tool guessing or global configuration
- **Credential Isolation**: Authentication scoped per context, never shared
- **Project Boundaries**: Clear separation between different work environments
- **Mental Model**: "Contexts define scope, queries filter within scope"

## Implementation Details
See detailed architecture documentation:
- [C4 Architecture Diagrams](../docs/work-c4-architecture.md)
- [Local Filesystem Execution Flow](../docs/work-local-fs-execution-flow.md)
- [Proof of Concept Plan](../docs/work-poc.md)
