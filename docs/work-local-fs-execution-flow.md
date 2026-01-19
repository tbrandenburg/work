
# User Journey Execution Flow — local-fs Adapter

This document describes **how a single user command is executed internally**
when using the `local-fs` adapter, with a focus on:

- no full-project scans
- no caching or mirroring
- ephemeral, in-memory graph slices
- strict stateless CLI execution

The example command used throughout this document is:

```bash
work list   where kind=task and child_of=EPIC-42   order by priority desc   limit 5
```

Assumptions:
- active context: `local`
- tool: `local-fs`
- root directory: `.work/`
- project: `default`

---

## 1. Filesystem Ground Truth

```text
my-project/
└── .work/
    └── projects/
        └── default/
            ├── items/
            │   ├── EPIC-42.md
            │   ├── 0001.md
            │   ├── 0002.md
            │   └── 0003.md
            ├── links.json
            └── meta.json
```

Important properties:
- this is **not** a database
- files are not preloaded
- only accessed on demand

---

## 2. Command Parsing (No IO)

The CLI parses the command into an abstract syntax tree (AST).

```ts
ListCommand {
  type: "list",
  where: AND(
    EQ("kind", "task"),
    EQ("child_of", "EPIC-42")
  ),
  orderBy: { field: "priority", direction: "desc" },
  limit: 5
}
```

No filesystem access occurs at this stage.

---

## 3. Context Resolution

The active context is resolved.

```ts
Context {
  name: "local",
  tool: "local-fs",
  root: ".work",
  project: "default"
}
```

This defines the execution boundary.

---

## 4. Query Planning

The query planner determines the **minimal data requirements**.

```ts
QueryPlan {
  requiredKinds: ["task"],
  requiredRelations: ["child_of"],
  rootIds: ["EPIC-42"],
  requiredFields: ["priority"]
}
```

This plan guarantees no unnecessary filesystem access.

---

## 5. Adapter Resolution

The adapter registry selects the `LocalFsAdapter`.

```ts
const adapter = adapterRegistry.get("local-fs");
```

---

## 6. Relation Resolution (Filesystem Read #1)

The adapter resolves children of the epic.

```ts
adapter.findByRelation("child_of", "EPIC-42", { kind: "task" });
```

Filesystem access:
- `.work/projects/default/links.json`

Resulting IDs:
```text
0001, 0002
```

No item files are read yet.

---

## 7. Item Loading (Filesystem Read #2)

Only required items are loaded.

```ts
adapter.loadItems(["0001", "0002"], {
  fields: ["title", "priority", "state"]
});
```

Filesystem access:
- `items/0001.md`
- `items/0002.md`

Unrelated items are never touched.

---

## 8. Graph Slice Assembly (Ephemeral)

The raw data is projected into a graph slice.

```ts
GraphSlice {
  nodes: {
    "0001": { kind: "task", priority: "high" },
    "0002": { kind: "task", priority: "medium" }
  },
  edges: [
    { from: "0001", type: "child_of", to: "EPIC-42" },
    { from: "0002", type: "child_of", to: "EPIC-42" }
  ]
}
```

This graph:
- exists only in memory
- contains the minimal required data
- is discarded after evaluation

---

## 9. Query Evaluation

The core evaluates the query.

Execution order:
1. apply `where`
2. apply `order by`
3. apply `limit`

```ts
evaluator.evaluate(slice, where, orderBy, limit);
```

Result:
```text
0001, 0002
```

---

## 10. Output Formatting

The results are formatted for display.

```text
ID     Title            Priority
0001   Fix login bug    high
0002   Improve logging  medium
```

---

## 11. Stateless Execution Guarantee

After the command completes:

- no memory is retained
- no cache is written
- no background state exists
- no global project scan occurred

Only these files were accessed:
- `links.json`
- `0001.md`
- `0002.md`

---

## 12. Key Guarantee

> **For `local-fs`, every `work` command touches only the files strictly required to answer that command.**

This guarantee defines the correctness and performance model of `work`.

---

## 13. Summary

- `work` is stateless as a process
- semantic meaning is preserved via ephemeral graph slices
- `local-fs` is a first-class adapter, not a fallback
- the design scales from filesystem to SaaS backends

This execution model is intentional, minimal, and future-proof.
