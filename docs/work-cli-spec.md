
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
work list [where <expr>] [@context]
```

Filtering by core state:

```text
state = new | active | closed
```

Example:

```bash
work list where state=active
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

## 12. Editing Work Items

### 12.1 Purpose

This chapter defines how existing work items can be **edited in a controlled, explicit, and adapter-compatible way**.

Editing commands are **mutating operations** and always apply to **exactly one work item**.

Bulk edits, implicit mutations, or query-based updates are explicitly out of scope.

### 12.2 Command: `work edit`

#### 12.2.1 Synopsis

```text
work edit <wid> [--field <value>]...
```

#### 12.2.2 Description

Edits one or more **attributes** of a single work item identified by `<wid>`.

Each invocation:
- targets exactly one work item
- performs atomic updates per field
- fails if the adapter does not support the requested change

The command is **non-interactive by default** and fully scriptable.

#### 12.2.3 Supported Fields

The following fields are defined at the CLI level. Adapters may support a subset.

| Field | Description |
|----|----|
| `title` | Short summary |
| `description` | Long-form text |
| `priority` | `low | medium | high` |
| `assignee` | User identifier or `unassigned` |

State transitions are **not** handled by `work edit`.  
They must use lifecycle commands (`start`, `close`, `reopen`).

#### 12.2.4 Examples

```bash
work edit ABC-123 --title "Fix login bug"
work edit ABC-123 --priority high
work edit ABC-123 --assignee unassigned
work edit ABC-123 --description "Updated problem analysis"
```

Multiple fields may be updated in a single command:

```bash
work edit ABC-123 --priority high --assignee alice
```

#### 12.2.5 Optional Interactive Editing

```text
work edit <wid> --editor
```

When `--editor` is specified:
- the user’s `$EDITOR` is opened
- only the `description` field is edited
- adapters may reject this mode if unsupported

Interactive editing is **explicit opt-in** and never the default.

#### 12.2.6 Error Handling

The command fails if:
- `<wid>` does not exist
- the adapter does not support editing a field
- the update violates adapter constraints

Partial updates are **not allowed**. Either all requested fields are updated, or none are.

#### 12.2.7 Non-Goals

The following are intentionally not supported:
- editing multiple work items at once
- editing via `where` clauses
- implicit editors
- adapter-specific hidden fields

### 12.3 Command: `work unset`

#### 12.3.1 Synopsis

```text
work unset <wid> <field>
```

#### 12.3.2 Description

Clears the value of an optional field on a work item.

This command exists to avoid ambiguous empty values (e.g. `--assignee ""`).

#### 12.3.3 Examples

```bash
work unset ABC-123 assignee
work unset ABC-123 priority
```

---

## 13. Notifications

### 13.1 Purpose

This chapter defines a **stateless notification mechanism** for reporting work items that match a query.

Notifications reuse the **existing query model** (`where`, `order by`, `limit`) and send results to **named notification targets**.

Notifications are **explicit actions**, not background automation.

### 13.2 Conceptual Model

A notification consists of:
1. a query (`where` clause)
2. a target (identified by a user-defined name)
3. a one-time execution

No polling, scheduling, or real-time subscriptions are implied.

### 13.3 Command: `work notify send`

#### 13.3.1 Synopsis

```text
work notify send where <expr> to <target>
```

#### 13.3.2 Description

Executes a query and sends the resulting work items to the specified notification target.

The command:
- evaluates the query in the active context
- formats the result set
- delivers it to the target
- exits

#### 13.3.3 Examples

```bash
work notify send   where kind=task and priority=high   to slack-team
```

```bash
work notify send   where state=new   order by priority desc   limit 10   to email-me
```

#### 13.3.4 Failure Semantics

The command fails if:
- the target does not exist
- the adapter does not support the target type
- delivery fails

Query evaluation and delivery are treated as a single operation.

### 13.4 Notification Targets

#### 13.4.1 Definition

A notification target is:
- identified by a **user-defined name**
- scoped to a **context**
- bound to a **target type** (e.g. slack, email, local)

Targets are configuration, not runtime state.

### 13.5 Command: `work notify target add`

#### 13.5.1 Synopsis

```text
work notify target add <name> --type <type> [options]
```

#### 13.5.2 Description

Registers a new notification target under the given name.

Targets are:
- stored per user
- scoped to the active context
- referenced by name in `work notify send`

#### 13.5.3 Example

```bash
work notify target add slack-team   --type slack   --channel "#alerts"
```

### 13.6 Command: `work notify target list`

```text
work notify target list
```

Lists all configured notification targets for the current context.

### 13.7 Command: `work notify target remove`

```text
work notify target remove <name>
```

Removes a previously configured notification target.

### 13.8 Adapter Responsibilities

Adapters must explicitly declare:
- supported notification target types
- formatting constraints
- delivery guarantees

Adapters must not:
- introduce background execution
- schedule notifications
- persist query results

### 13.9 Non-Goals

The following are intentionally out of scope:
- scheduled notifications
- watchers or subscriptions
- triggers or automation rules
- real-time updates

### 13.10 Design Invariants

- Editing mutates **one work item explicitly**
- Notifications report **query results explicitly**
- All operations are **synchronous and stateless**
- No hidden automation or background state is introduced

---

## 14. Work Item ID Rules

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

## 15. UX & Grammar Rules

- verb always in position 1
- `@context` always last
- flat `attr=value` pairs
- no implicit tool guessing
- no global login

---

## 16. Command Overview (Flat)

```text
work
├── create
├── start
├── close
├── reopen
├── get
├── list
├── set
├── edit
├── unset
├── link
├── unlink
├── move
├── comment
├── delete
├── notify
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

## 17. Mental Model

> Contexts define the boundary  
> Create creates existence  
> Start signals intent  
> Close finishes work  
> Reopen corrects reality  
> Everything else is metadata or relations
