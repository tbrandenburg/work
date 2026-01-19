
# work — C4 Architecture Diagrams (Corrected)

This document contains **C4 PlantUML diagrams** for the `work` CLI.
All entity definitions follow **C4 rules**: **no line breaks inside element definitions**.

---

## 1. System Context Diagram

```plantuml
@startuml
!include <C4/C4_Context>

title work — System Context

Person(user, "User / Developer", "Uses the work CLI to manage tasks")

System(work, "work CLI", "Stateless CLI for unified task management")

System_Ext(jira, "Jira", "Issue & project management")
System_Ext(github, "GitHub", "Issues & Projects")
System_Ext(linear, "Linear", "Product management")
System_Ext(ado, "Azure DevOps", "Work item tracking")
System_Ext(fs, "Local Filesystem", "local-fs backend (.work directory)")

Rel(user, work, "Uses", "CLI")
Rel(work, jira, "Reads/Writes work items", "REST API")
Rel(work, github, "Reads/Writes work items", "REST / GraphQL")
Rel(work, linear, "Reads/Writes work items", "GraphQL")
Rel(work, ado, "Reads/Writes work items", "REST API")
Rel(work, fs, "Reads/Writes files", "Filesystem")

@enduml
```

---

## 2. Container Diagram

```plantuml
@startuml
!include <C4/C4_Container>

title work — Containers

Person(user, "User / Developer")

Container(cli, "CLI Process", "Node.js + TypeScript", "Parses commands and orchestrates execution")
Container(core, "Core Engine", "TypeScript", "Context resolution, query planning, graph slice evaluation")
Container(adapterRegistry, "Adapter Registry", "TypeScript", "Resolves adapters based on context")

Container(localFs, "local-fs Adapter", "TypeScript", "Filesystem-backed work items (.work/)")
Container(jiraAdapter, "Jira Adapter", "TypeScript", "Jira REST API integration")
Container(githubAdapter, "GitHub Adapter", "TypeScript", "GitHub Issues & Projects integration")
Container(linearAdapter, "Linear Adapter", "TypeScript", "Linear GraphQL integration")
Container(adoAdapter, "ADO Adapter", "TypeScript", "Azure DevOps REST API integration")

Rel(user, cli, "Invokes", "CLI")
Rel(cli, core, "Delegates commands", "In-process")
Rel(core, adapterRegistry, "Resolves adapter", "In-process")

Rel(adapterRegistry, localFs, "Uses")
Rel(adapterRegistry, jiraAdapter, "Uses")
Rel(adapterRegistry, githubAdapter, "Uses")
Rel(adapterRegistry, linearAdapter, "Uses")
Rel(adapterRegistry, adoAdapter, "Uses")

@enduml
```

---

## 3. Component Diagram (Inside the CLI)

```plantuml
@startuml
!include <C4/C4_Component>

title work CLI — Internal Components (Graph Slice Execution)

Container(cli, "CLI Process", "Node.js + TypeScript")

Component(parser, "Command Parser", "TypeScript", "Parses CLI input into command AST")
Component(contextResolver, "Context Resolver", "TypeScript", "Resolves active or overridden context")
Component(queryPlanner, "Query Planner", "TypeScript", "Determines minimal data required")
Component(adapterRegistry, "Adapter Registry", "TypeScript", "Selects adapter by context.tool")
Component(adapter, "Work Adapter", "TypeScript", "local-fs / Jira / GitHub / Linear / ADO")
Component(graphBuilder, "Graph Builder", "TypeScript", "Projects raw data into graph slices")
Component(evaluator, "Query Evaluator", "TypeScript", "Applies where / order by / limit")
Component(formatter, "Output Formatter", "TypeScript", "Formats results for CLI output")

Rel(cli, parser, "Invokes")
Rel(parser, contextResolver, "Provides command AST")
Rel(contextResolver, queryPlanner, "Provides scoped command")
Rel(queryPlanner, adapterRegistry, "Requests adapter")
Rel(adapterRegistry, adapter, "Resolves")

Rel(adapter, graphBuilder, "Returns raw data")
Rel(graphBuilder, evaluator, "Builds graph slice")
Rel(evaluator, formatter, "Produces result set")
Rel(formatter, cli, "Writes output")

@enduml
```

---

## 4. Runtime Graph Slice Concept

```plantuml
@startuml
!include <C4/C4_Component>

title Ephemeral Graph Slice (Runtime Concept)

Component(slice, "Graph Slice (in-memory)", "Property Graph", "Minimal nodes and edges for one command")
Component(nodes, "WorkItem Nodes", "Data", "Tasks, epics, etc.")
Component(edges, "Relation Edges", "Data", "child_of, blocks, precedes, duplicates")

Rel(slice, nodes, "Contains")
Rel(slice, edges, "Contains")

@enduml
```

---

## Notes

- All C4 elements use **single-line definitions**
- Diagrams are compatible with **plantuml.com**
- Architecture reflects **stateless execution with ephemeral graph slices**
