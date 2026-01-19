
# Technical Design: Multi-Backend Support via Adapters

This document describes how the `work` CLI supports **multiple project management backends simultaneously**
using a strict **adapter-based architecture**.

Supported backends:
- `local-fs`
- Jira
- GitHub
- Linear
- Azure DevOps (ADO)

The document also provides a **deep dive into `local-fs`** as a reference implementation.

---

## 1. Design Goals

1. Support multiple backends **at the same time**
2. Avoid lowest-common-denominator abstractions
3. Keep the CLI stable while adding/removing backends
4. Enable offline-first usage
5. Make adapters independently testable and replaceable

Non-goals:
- A unified global workflow
- Hiding native backend semantics
- Implicit fallback without user intent

---

## 2. Core Architectural Principle

> **All backends are adapters.**
>
> The core CLI never talks to Jira, GitHub, Linear, ADO, or the filesystem directly.

Instead:

```
CLI  →  Core Logic  →  Adapter Interface  →  Backend
```

This allows:
- multiple backends to coexist
- per-context configuration and authentication
- backend-specific behavior without CLI changes

---

## 3. Adapter Contract (TypeScript)

All adapters implement the same interface:

```ts
export interface WorkAdapter {
  readonly tool: string;

  authenticate?(ctx: Context): Promise<AuthState>;

  create(input: CreateInput): Promise<WorkItem>;
  get(id: NativeId): Promise<WorkItem>;
  list(filter: Filter): Promise<WorkItem[]>;

  start(id: NativeId): Promise<void>;
  close(id: NativeId): Promise<void>;
  reopen(id: NativeId): Promise<void>;

  set(id: NativeId, attrs: AttrMap): Promise<void>;

  link(source: NativeId, rel: Relation, target: NativeId): Promise<void>;
  unlink(source: NativeId, rel: Relation, target: NativeId): Promise<void>;
}
```

The **core**:
- resolves context
- enforces lifecycle rules
- validates relations
- delegates execution to the adapter

---

## 4. Context-Based Backend Selection

A **context** binds:
- adapter (`tool`)
- scope (repo, project, org, path)
- credentials

Example:

```bash
work context add gh-core --tool github --repo org/core
work context add personal --tool local-fs --path ~/tasks
```

Contexts are explicit and never inferred.

---

## 5. Supported Backends

### 5.1 `local-fs`

- filesystem-backed work item store
- no authentication
- full feature coverage
- reference implementation

### 5.2 Jira

- adapter wraps Jira REST APIs
- supports workflows via transitions
- supports rich relations and custom fields

### 5.3 GitHub

- adapter targets GitHub Issues and Projects
- lifecycle mapped via open/close + labels
- relations implemented via references and metadata

### 5.4 Linear

- adapter uses Linear GraphQL API
- opinionated workflow, minimal mapping
- native support for parent/child and blocking

### 5.5 Azure DevOps (ADO)

- adapter uses ADO Work Item APIs
- supports work item types and relations
- workflow transitions mapped via state changes

---

## 6. Deep Dive: `local-fs` Adapter

### 6.1 Why `local-fs` Exists

`local-fs` serves as:
- an offline-first backend
- a zero-config starting point
- a semantic reference for other adapters
- a testing backend for CI

It is **not** a fallback.
It is selected explicitly via context.

---

### 6.2 Filesystem Layout

With this (recommended)

```md
<root>/
├── projects/
│   └── default/
│       ├── items/
│       │   ├── 0001.md
│       │   ├── 0002.md
│       │   └── 0003.md
│       ├── links.json
│       └── meta.json
└── meta.json
```

Where:

- <root> = .work/
- default = implicit project name
- outer meta.json = workspace-level metadata (future use)

---

### 6.3 Work Item Representation

Each work item is a Markdown file with YAML frontmatter:

```md
---
id: 0001
kind: task
state: active
assignee: unassigned
priority: low
created: 2026-01-18
updated: 2026-01-19
---

Fix login bug
```

This maps 1:1 to the core data model.

---

### 6.4 Relations Storage

Relations are stored centrally in `links.json`:

```json
[
  { "from": "0001", "rel": "blocks", "to": "0002" },
  { "from": "0002", "rel": "child_of", "to": "0003" }
]
```

This forms a **directed graph**, identical to the core relation model.

---

### 6.5 Lifecycle Handling

| Core Command | `local-fs` Behavior |
|-------------|--------------------|
| `create` | create new file, state = new |
| `start` | update state → active |
| `close` | update state → closed |
| `reopen` | update state → active |

No workflow guessing. No hidden states.

---

### 6.6 Validation Responsibility

The `local-fs` adapter enforces:
- no parent cycles
- no precedence cycles
- one parent per item

Other adapters must meet or exceed this behavior.

---

### 6.7 Authentication

`local-fs` implements:

```ts
authenticate(): AuthState {
  return { authenticated: true };
}
```

This keeps the CLI uniform without special-casing.

---

## 7. Adapter Comparison Matrix

| Feature | local-fs | Jira | GitHub | Linear | ADO |
|------|----------|------|--------|--------|-----|
| Offline | ✅ | ❌ | ❌ | ❌ | ❌ |
| Parent/Child | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Precedence | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| Duplicates | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Custom Fields | ⚠️ | ✅ | ❌ | ❌ | ✅ |

⚠️ = capability-based or partial

---

## 8. Why This Scales

Because:
- the CLI is adapter-agnostic
- contexts isolate credentials and scope
- adapters are independently versioned
- `local-fs` defines the reference semantics

New backends can be added without:
- changing CLI commands
- breaking user workflows
- migrating existing contexts

---

## 9. Summary

- Multiple backends are supported **simultaneously**
- Adapters are the only integration point
- `local-fs` is a first-class backend and reference
- The CLI remains stable as the ecosystem grows

This architecture prioritizes **clarity, portability, and long-term maintainability**.
