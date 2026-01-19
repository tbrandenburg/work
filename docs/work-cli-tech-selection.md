
# CLI Technology Selection — `work`

This document records the **technology choice for the `work` CLI layer** and the rationale behind it.
It is intended as a lightweight, durable reference.

---

## Scope

This decision applies **only to the command-line interface layer**:
- command parsing
- flag handling
- help & completion
- command dispatch

It does **not** apply to:
- core domain logic
- adapters
- data model
- persistence
- TUI (future work)

---

## Selected Technology

### CLI Framework: **oclif**

- **Language:** TypeScript / Node.js
- **Status:** Actively maintained
- **Adoption:** Widely used for large, long-lived CLIs

`oclif` is the primary and mandatory framework for the `work` CLI.

---

## Rationale

oclif was selected because it:

- is the most widely accepted framework for serious TypeScript CLIs
- scales well with many commands and subcommands
- provides strong conventions without hiding control flow
- supports shell completions and rich help generation
- keeps CLI concerns separate from core logic

The guiding principle is:

> The CLI parses intent; the core implements semantics.

---

## Explicit Non-Goals

The CLI layer must not contain:

- business logic
- query evaluation
- graph construction
- adapter behavior
- caching or background processes

It remains a **thin orchestration layer**.

---

## TUI Consideration (Future Work)

- **TUI framework:** OpenTUI
- **Status:** Not implemented
- **Command:** `work ui` is reserved

OpenTUI may be introduced later for interactive exploration, but it must not:

- affect CLI semantics
- introduce a daemon
- require persistent runtime state

---

## Alternatives Considered

| Option | Reason Not Selected |
|------|---------------------|
| Commander.js | Less structure for large CLIs |
| Yargs | Heavier API, less opinionated |
| Custom parser | Reinvents solved problems |
| Vorpal / Gluegun | Lower modern adoption |

---

## Consequences

- Commands are isolated and testable
- Core logic is framework-agnostic
- Future UI work is non-breaking
- The CLI remains scriptable and deterministic

---

## Summary

> **oclif** provides a stable, community-standard foundation for the `work` CLI while keeping all domain semantics outside the CLI layer.
