
# Internal Graph Ontology and Runtime Model

This document explains the **internal property-graph ontology** used by `work`,
how that graph is **materialized at runtime**, and what **“stateless”** means in
practice for the CLI.

The goal is to make one thing explicit:

> `work` does **not** rebuild, mirror, or cache entire projects.
> It operates on **ephemeral graph slices** that exist only for the duration of a command.

---

## 1. The Core Graph Ontology

### 1.1 Ontology Overview

At its core, `work` models task management as a **property graph**:

- **Nodes** represent work items
- **Edges** represent explicit relationships
- **Properties** capture minimal, stable metadata

This ontology is deliberately small and stable.

**Standards Alignment**: `work` aligns its core concepts with [OSLC CM vocabulary](https://docs.oasis-open.org/oslc-domains/cm/v3.0/cm-v3.0.html) where possible, while deliberately exceeding it with a graph-based internal model that supports explicit relationships and cross-tool workflows.

---

### 1.2 Node: `WorkItem`

`WorkItem` is the only mandatory node type.

**Core properties:**

| Property | Type | Description |
|--------|------|-------------|
| `id` | string | Context-qualified, opaque identifier |
| `kind` | string | task, epic, bug, etc. |
| `state` | enum | `new`, `active`, `closed` |
| `title` | string | Human-readable title |
| `description` | string | Optional text |
| `assignee` | string | `unassigned` allowed |
| `priority` | enum | `low`, `medium`, `high` |
| `createdAt` | timestamp | Creation time |
| `updatedAt` | timestamp | Last modification |

Extensions and tool-specific data are namespaced and optional.

---

### 1.3 Edge Types (Relations)

Edges are **typed and explicit**.

| Relation | Directed | Meaning |
|--------|----------|--------|
| `child_of` | yes | Hierarchy |
| `parent_of` | yes | Inverse hierarchy |
| `precedes` | yes | Temporal dependency |
| `succeeds` | yes | Inverse |
| `blocks` | yes | Blocking dependency |
| `blocked_by` | yes | Inverse |
| `duplicates` | no | Symmetric equivalence |
| `duplicate_of` | yes | Canonical duplicate |
| `relates_to` | no | Weak association |

Edges never carry workflow state.

---

## 2. Runtime Graph Model (Graph Slices)

### 2.1 No Global Graph

`work` **never builds or maintains a full project graph**.

Specifically, it does **not**:

- mirror all Jira issues
- cache all GitHub issues
- preload all `local-fs` items
- maintain an in-memory database

There is **no “second Jira” or “second GitHub”** inside `work`.

---

### 2.2 Graph Slices

Instead, `work` operates on **graph slices**.

A graph slice is:

- the minimal set of nodes and edges
- required to execute a single command
- materialized in memory
- discarded immediately after use

---

### 2.3 Examples of Graph Slices

#### `work get 123`

Materialized slice:
- node `123`
- optionally its direct relations

Nothing else.

---

#### `work list where child_of=EPIC-42`

Materialized slice:
- node `EPIC-42`
- its direct children
- no unrelated items

---

#### `work link A blocks B`

Materialized slice:
- node `A`
- node `B`
- validation of constraints
- persist edge
- discard slice

---

## 3. Adapter Interaction at Runtime

Adapters are queried **lazily** and **minimally**.

For each command:

1. Context is resolved
2. Adapter queries are scoped to the command
3. Results are projected into graph nodes/edges
4. Graph invariants are validated
5. Results are returned
6. All in-memory data is discarded

Adapters are never asked to “dump everything”.

---

## 4. Persistence Model

Persistence depends on the backend:

### `local-fs`
- Nodes: Markdown files
- Edges: `links.json`
- The filesystem *is* the persisted graph

### Remote tools (Jira, GitHub, Linear, ADO)
- Primary data lives in the tool
- `work` projects tool data into graph form on demand
- Only cross-tool or tool-independent relations may be persisted locally

There is no global cache.

---

## 5. Statelessness: What It Means (and What It Does Not)

### 5.1 Stateless CLI

`work` is stateless in execution:

- no daemon
- no background process
- no long-lived memory
- each invocation is independent

---

### 5.2 Stateless Does NOT Mean

Stateless does **not** mean:

- no persistence
- no data model
- no semantic authority
- no validation

Git, Terraform, and kubectl are stateless in the same sense.

---

### 5.3 Precise Definition

> **`work` is stateless as a process, but stateful in meaning.**

State exists:
- in backend tools
- in `local-fs`
- in explicit user actions

Not in the CLI process.

---

## 6. Why This Design Matters

This approach ensures:

- predictable semantics
- minimal API usage
- no hidden synchronization
- no stale caches
- consistent behavior across tools

It also keeps the implementation small, testable, and honest.

---

## 7. One-Sentence Summary

> `work` uses a small, stable property-graph ontology and evaluates ephemeral graph slices per command, remaining stateless as a process while preserving authoritative semantics.

