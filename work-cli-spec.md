
# work — Unified Work Item CLI

This document defines the **final CLI interface** for the `work` tool.
It is a **tool-agnostic, context-based CLI** for managing work items across systems
such as Jira, GitHub, Linear, and Azure DevOps.

---

## 1. Core Lifecycle Commands

These commands define the **only core state transitions**.

```text
work create <title> [options] [@context]
work start  <wid>
work close  <wid>
work reopen <wid>
```

Lifecycle semantics:

- `create` → item enters **new**
- `start`  → **new → active**
- `close`  → **active|new → closed**
- `reopen` → **closed → active**

Core states are **derived**, never set directly.

---

## 2. Context Management

Contexts define **tool + scope + credentials**.

```text
work context add <name> [options]
work context set <name>
work context list
work context show [<name>]
work context remove <name>
```

Example:

```bash
work context add gh-core --tool github --repo org/core
work context set gh-core
```

---

## 3. Authentication (Context-Scoped)

Credentials are **always bound to a context**, never to a tool.

```text
work auth login [<context>]
work auth logout [<context>]
work auth status [<context>]
```

Rules:
- no global login
- no credential reuse across contexts
- missing or expired auth is a hard error

---

## 4. Work Item Access

```text
work get  <wid>
work list
  [where <expr>]
  [order by <field> [asc|desc]]
  [limit <n>]
  [@context]
```

### Filtering (`where`)

- Filters work items **inside the current context**
- Supports attributes and direct relations
- Never changes scope

Examples:

```bash
work list where state=active
work list where kind=task and child_of=EPIC-42
```

---

### Ordering (`order by`)

- Ordering is **always explicit**
- No implicit sorting is performed
- Ordering does not filter results

Examples:

```bash
work list order by priority desc
work list where state=active order by updated asc
```

Priority ordering is normalized (`low < medium < high`).

---

### Limiting (`limit`)

- Limits the number of returned items
- Applied **after filtering and ordering**
- Never implied

Example:

```bash
work list where priority=high order by priority desc limit 5
```

---

## 5. Attribute Management

```text
work set <wid> attr=value [attr=value ...]
```

Attribute categories:

- **Core**: `title`, `description`, `assignee`, `state` (read-only)
- **Capabilities**: `priority`, `estimate`, `due_date`
- **Native**: `<tool>.<field>` (e.g. `jira.story_points`)

---

## 6. Relations (Graph-Based)

Canonical relations:

```text
parent_of        child_of
precedes         succeeds
blocks           blocked_by
duplicates
duplicate_of     has_duplicate
relates_to
```

Relations form a directed or undirected graph between work items.

---

## 7. Link / Unlink Work Items

```text
work link   <wid> <relation> <wid>
work unlink <wid> <relation> <wid>
```

Examples:

```bash
work link 123 parent_of 456
work link 123 precedes 456
work link 123 duplicates 456
```

Constraints:
- only one parent per item
- no cycles in hierarchy or precedence

---

## 8. Move Between Contexts

```text
work move <wid> @target-context
```

Behavior:
- create equivalent item in target context
- link source and target items
- optionally close the source item

---

## 9. Comments

```text
work comment <wid> <text>
```

---

## 10. Deletion

```text
work delete <wid>
```

---

## 11. Schema & Discoverability

```text
work schema show
work schema show @context
work schema kinds
work schema attrs
work schema relations
```

---

## 12. Work Item ID Rules

Valid ID forms:

```text
123
jira-abc:456
gh-core:ISSUE-9
```

Rules:
- IDs are opaque
- native IDs are never parsed
- context resolution happens before API calls

---

## 13. UX & Grammar Rules

- verb always in position 1
- `@context` always last
- flat `attr=value` pairs
- no implicit tool guessing
- no global login

---

## 14. Command Overview (Flat)

```text
work
├── create
├── start
├── close
├── reopen
├── get
├── list
├── set
├── link
├── unlink
├── move
├── comment
├── delete
├── context
│   ├── add
│   ├── set
│   ├── list
│   ├── show
│   └── remove
├── auth
│   ├── login
│   ├── logout
│   └── status
└── schema
    ├── show
    ├── kinds
    ├── attrs
    └── relations
```

---

## 15. Mental Model

> Contexts define the boundary  
> Create creates existence  
> Start signals intent  
> Close finishes work  
> Reopen corrects reality  
> Everything else is metadata or relations
