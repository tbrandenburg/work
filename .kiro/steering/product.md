# Product Overview

## Product Purpose
The work CLI is a unified, stateless command-line tool that bridges the gap between AI agents and task management systems. It enables developers, teams, and AI agents to manage work items across multiple project management backends without being locked into a single tool, providing a consistent interface and mental model for task management whether using Jira, GitHub Issues, Linear, Azure DevOps, or local filesystem storage.

**AI Integration Focus**: As AI agents increasingly work in development environments, `work` provides the missing piece for robust agent harnesses - eliminating the need for agents to fiddle with JSON task lists or markdown TODOs. It integrates AI agents into existing task management workflows while enabling essential human-in-the-loop oversight through notification mechanisms.

## Target Users
- **Developers and Engineering Teams**: Who work across multiple projects using different project management tools
- **DevOps Engineers**: Who need to integrate task management into CI/CD workflows and automation
- **Technical Project Managers**: Who need unified visibility across different project management systems
- **Freelancers and Consultants**: Who work with clients using various project management tools

## Key Features
- **Multi-Backend Support**: Unified interface for Jira, GitHub, Linear, Azure DevOps, and local filesystem ([docs/work-adapter-architecture.md](../docs/work-adapter-architecture.md))
- **Context-Based Scoping**: Explicit backend selection with isolated credentials and project boundaries ([docs/work-user-journey-context-and-query.md](../docs/work-user-journey-context-and-query.md))
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
