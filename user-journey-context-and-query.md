
# User Journey: Querying High-Priority Tasks Under an Epic

This document describes a **single, concrete user journey** that demonstrates
how project scoping, querying, and relations work together in the `work` CLI.

The goal of this journey is to answer the question:

> *How do I get the highest-priority tasks under one epic in a specific project?*

---

## 1. Mental Model (What the User Needs to Know)

Before touching the CLI, the user must understand two core rules:

1. **Context defines scope**
   - Tool
   - Project
   - Credentials

2. **Queries never change scope**
   - The `where` clause only filters items *inside* the current context
   - Projects are never selected via `where`

In short:

> **Context answers “where am I?”**  
> **`where` answers “which items here?”**

---

## 2. Step 1: Create or Select a Context

The user starts by selecting the project they want to work in.

### Example: Jira project `ABC`

```bash
work context add jira-abc --tool jira --project ABC
work context set jira-abc
```

At this point, the scope is fixed:

- Tool: Jira
- Project: ABC
- Authentication: Jira credentials for this project

Every command now operates **only inside this project** unless overridden.

---

## 3. Step 2: Understand the Data Model

Inside the selected context:

- Epics and tasks are work items
- Tasks are related to epics via `child_of`
- Priority is a capability attribute (`low < medium < high`)

There is **no implicit hierarchy or sorting**.

Everything must be explicit.

---

## 4. Step 3: Query Tasks Under an Epic

The user wants all tasks under a specific epic.

```bash
work list where kind=task and child_of=EPIC-42
```

This means:

- only tasks
- directly linked to epic `EPIC-42`
- inside the currently selected project

No other projects are touched.

---

## 5. Step 4: Filter by Priority

To narrow the result to high-priority tasks:

```bash
work list where kind=task and child_of=EPIC-42 and priority=high
```

Filtering is declarative and portable across backends.

---

## 6. Step 5: Order by Priority

Filtering alone does not imply ordering.

To see the highest priority items first:

```bash
work list   where kind=task and child_of=EPIC-42   order by priority desc
```

Ordering is explicit and predictable.

---

## 7. Step 6: (Optional) Limit Results

If the user only wants the top results:

```bash
work list   where kind=task and child_of=EPIC-42   order by priority desc   limit 5
```

Limiting is explicit and never implied.

---

## 8. Complete Command (Final Form)

Putting everything together:

```bash
work list   where kind=task and child_of=EPIC-42   order by priority desc   limit 5   @jira-abc
```

This command:

- operates in Jira project `ABC`
- selects tasks under a specific epic
- orders them by priority
- returns only the most relevant items

---

## 9. Why This Design Matters

This journey demonstrates key design principles:

- **No hidden scope changes**
- **No implicit graph traversal**
- **No implicit ordering**
- **Full portability across tools**

The same mental model applies to:

- `local-fs`
- GitHub
- Linear
- Azure DevOps

---

## 10. Takeaway

> **Select scope with context.**  
> **Filter with `where`.**  
> **Traverse relations explicitly.**  
> **Order and limit explicitly.**

This keeps the CLI predictable, scalable, and honest.
