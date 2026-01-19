# Product Overview

## Product Purpose
The work CLI is a unified, stateless command-line tool that enables developers and teams to manage work items across multiple project management backends without being locked into a single tool. It provides a consistent interface and mental model for task management whether using Jira, GitHub Issues, Linear, Azure DevOps, or local filesystem storage.

## Target Users
- **Developers and Engineering Teams**: Who work across multiple projects using different project management tools
- **DevOps Engineers**: Who need to integrate task management into CI/CD workflows and automation
- **Technical Project Managers**: Who need unified visibility across different project management systems
- **Freelancers and Consultants**: Who work with clients using various project management tools

## Key Features
- **Multi-Backend Support**: Unified interface for Jira, GitHub, Linear, Azure DevOps, and local filesystem
- **Context-Based Scoping**: Explicit backend selection with isolated credentials and project boundaries
- **Stateless Execution**: No daemon, no caching, predictable command-by-command execution
- **Graph-Based Relations**: Explicit work item relationships (parent/child, blocks, duplicates, etc.)
- **Offline-First Capability**: Full functionality via local filesystem backend
- **Scriptable Interface**: Consistent commands suitable for automation and CI/CD integration

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

## Success Criteria
- **Command Response Time**: < 2s for list operations with up to 1,000 items
- **CLI Startup Time**: < 500ms for immediate productivity
- **Cross-Backend Consistency**: Same mental model and commands work across all supported backends
- **Developer Adoption**: Measurable reduction in time spent switching between project management tools
- **Workflow Integration**: Successful incorporation into CI/CD pipelines and development automation
