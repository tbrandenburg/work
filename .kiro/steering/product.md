# Product Overview

## Revolutionary Vision: Mixed Human-Agent Teams

### The Story Twist
**Before**: Human developers orchestrated agents to do their work - mostly one-developer scenarios.

**Now**: `work` enables revolutionary mixed human-agent teams where everyone operates on the same level, using the same communication mechanisms and development processes.

## Product Purpose
The work CLI is a unified, stateless command-line tool that gathers all participants - humans and agents - into one system. When `work` runs on schedule, it triggers both humans and agents to work on their tasks, creating true equal partnership in development workflows.

**The Innovation**: `work` provides the missing piece for mixed human-agent teams:
- **Agents get notified** and work on their tasks autonomously
- **Agents can assign tasks to humans** when needed  
- **Everyone operates on equal footing** with the same tools and processes
- **Same development cycle beat** glues everyone together
- **Interoperability** connects any task management system or notification target
- **Future A2A networks** for deeper agent-to-agent integration

This is the actual revolution: **true mixed human-agent teams** working together seamlessly.

## Target Users
- **Applied AI Engineers**: Setting up agent harnesses needing interoperable task management interfaces
- **Product & Business Owners**: Letting their ideas get reality through autonomous agent teams  
- **DevOps Engineers**: Who need to integrate task management into CI/CD workflows and automation
- **Technical Project Managers**: Who need unified visibility across different project management systems

## Key Features
- **Multi-Backend Support**: Unified interface for Jira, GitHub, Linear, Azure DevOps, and local filesystem ([docs/work-adapter-architecture.md](../docs/work-adapter-architecture.md))
- **Context-Based Scoping**: Explicit backend selection with isolated credentials and project boundaries ([docs/work-user-journey-context-and-query.md](../docs/work-user-journey-context-and-query.md), [docs/work-configuration-overview.md](../docs/work-configuration-overview.md))
- **Stateless Execution**: No daemon, no caching, predictable command-by-command execution ([docs/work-graph-ontology-and-runtime.md](../docs/work-graph-ontology-and-runtime.md))
- **Graph-Based Relations**: Explicit work item relationships (parent/child, blocks, duplicates, etc.)
- **Offline-First Capability**: Full functionality via local filesystem backend
- **Scriptable Interface**: Consistent commands suitable for automation and CI/CD integration ([docs/work-cli-spec.md](../docs/work-cli-spec.md))

## Business Objectives
- **Developer Productivity**: Reduce context switching between different project management tools
- **Workflow Standardization**: Provide consistent task management patterns across teams and projects
- **Tool Independence**: Prevent vendor lock-in while maintaining full feature access
- **Automation Enablement**: Support scriptable workflows and CI/CD integration

## User Journey
1. **Context Setup**: Configure contexts for different projects/backends (`work context add`)
2. **Work Item Management**: Create, start, close, and manage work items with consistent commands
3. **Cross-Tool Workflows**: Move work items between systems, maintain relations across backends
4. **Query and Reporting**: Use consistent query syntax to find and filter work items
5. **Integration**: Incorporate into existing development workflows and automation

The mental model: **contexts define scope, queries filter within scope** - detailed in [docs/work-user-journey-context-and-query.md](../docs/work-user-journey-context-and-query.md)

## References
For comprehensive technical details and specifications:
- **[Complete Documentation Index](../docs/README.md)** - Overview of all documentation
- **[CLI Specification](../docs/work-cli-spec.md)** - Complete command reference and interface definition
- **[User Journey Guide](../docs/work-user-journey-context-and-query.md)** - Context and querying mental model
- **[Architecture Overview](../docs/work-adapter-architecture.md)** - Multi-backend adapter design

## Success Criteria
- **Command Response Time**: < 2s for list operations with up to 1,000 items
- **CLI Startup Time**: < 500ms for immediate productivity
- **Cross-Backend Consistency**: Same mental model and commands work across all supported backends
- **Developer Adoption**: Measurable reduction in time spent switching between project management tools
- **Workflow Integration**: Successful incorporation into CI/CD pipelines and development automation
