# AI Scrum PoC

Demonstrates AI agents collaborating through work CLI's notification system in a scrum-like workflow.

**Location**: `examples/ai-scrum/`

## Quick Start

```bash
# Demo version (shows work CLI orchestration)
./demo.sh

# Verbose version (full details)
./demo.sh --verbose
```

## Manual Usage

```bash
# 1. Initialize tasks
./init.sh "My Project"

# 2. Run scrum cycles
./scrum-cycle.sh
```

## Architecture

Uses work CLI's notification system to orchestrate AI agents:

- **⚙️ work CLI** - Central orchestrator that notifies agents and tracks task state
- **Scrum Master** - Analyzes and prioritizes tasks when notified by work CLI
- **Developer** - Works on high-priority tasks when notified by work CLI  
- **Reviewer** - Reviews completed work when notified by work CLI

The work CLI maintains task state and coordinates agent collaboration through its notification system.

## Prerequisites

- work CLI installed and available in PATH (`work --help` should work)
- opencode CLI available for real mode (`opencode --help` should work)
- jq for JSON parsing (`jq --version` should work)

## Usage

1. Initialize tasks for a project:
```bash
./init.sh "opentui snake game with state-of-the-art project setup"
```

2. Test full cycle (init + 3 scrum cycles in dry-run):
```bash
./test-full-cycle.sh
```

3. Run single scrum cycle in dry-run mode:
```bash
./scrum-cycle.sh true
```

4. Run real scrum cycle (requires opencode CLI):
```bash
./scrum-cycle.sh false
# or just:
./scrum-cycle.sh
```

## What it proves

- work CLI can coordinate multiple AI agents
- Agents can read/write tasks through CLI
- Basic scrum workflow (plan → develop → review) works

## Limitations

- Hardcoded prompts
- No error handling
- Simplified task management
- Assumes opencode CLI works
