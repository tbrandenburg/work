# work CLI - Unified Task Management

The work CLI is a unified, stateless command-line tool that bridges AI agents and task management systems. It provides a consistent interface for managing work items across multiple backends (Jira, GitHub, Linear, Azure DevOps, local filesystem) without vendor lock-in.

**AI Integration Focus**: Eliminates the need for agents to fiddle with JSON task lists or markdown TODOs. Integrates AI agents into existing task management workflows while enabling essential human-in-the-loop oversight through notification mechanisms.

**Key Hypothesis**: We believe `work` will enable agents to work in real projects with several developers together. We'll know we're right when agents can not be distinguished from humans in the workflow or when agents involve humans in their workflow.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Git
- Kiro CLI installed and authenticated (for development)

## Quick Start

1. **Clone and setup**
   ```bash
   git clone https://github.com/username/work-cli
   cd work-cli
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Install globally**
   ```bash
   npm install -g .
   ```

4. **Set up your first context**
   ```bash
   # Local filesystem backend (offline-first)
   work context add local --tool local-fs --path ./work-items
   work context set local
   
   # Or GitHub backend
   work context add gh-project --tool github --repo org/project
   work context set gh-project
   ```

5. **Create and manage work items**
   ```bash
   work create "Implement user authentication" --kind feature
   work list --state new
   work start WORK-1
   work close WORK-1
   ```

## Target Users

- **Applied AI Engineers**: Setting up agent harnesses needing interoperable task management interfaces
- **Product & Business Owners**: Letting their ideas get reality through autonomous agent teams  
- **DevOps Engineers**: Who need to integrate task management into CI/CD workflows and automation
- **Technical Project Managers**: Who need unified visibility across different project management systems

## Architecture & Codebase Overview

### System Architecture
- **CLI Framework**: oclif (TypeScript) for command parsing and help
- **Core Engine**: Stateless execution with ephemeral graph slices
- **Adapters**: Uniform interface for multiple backends
- **Property Graph**: WorkItem nodes with typed relation edges
- **Context System**: Explicit backend selection with credential isolation

### Directory Structure
```
work-cli/
├── src/
│   ├── cli/           # Command parsing and CLI interface
│   ├── core/          # Core engine and graph logic
│   ├── adapters/      # Backend implementations
│   │   ├── local-fs/  # Local filesystem adapter
│   │   ├── jira/      # Jira adapter
│   │   ├── github/    # GitHub adapter
│   │   ├── linear/    # Linear adapter
│   │   └── ado/       # Azure DevOps adapter
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── tests/             # Test files (70% unit, 20% integration, 10% e2e)
├── docs/              # Comprehensive technical documentation
├── scripts/           # Build and development scripts
├── examples/          # Usage examples and sample configurations
└── .kiro/             # Kiro CLI configuration and steering
```

### Key Components
- **Context Manager** (`src/core/context.ts`): Backend selection and credential management
- **Graph Engine** (`src/core/graph.ts`): Property graph operations and query evaluation
- **Adapter Interface** (`src/adapters/base.ts`): Uniform backend contract
- **Local-FS Adapter** (`src/adapters/local-fs/`): Reference implementation and offline capability
- **CLI Commands** (`src/cli/commands/`): oclif-based command definitions

## Deep Dive

### Core Concepts

**Stateless Execution**: No daemon, no caching, ephemeral graph slices per command
- Each command runs independently
- No hidden synchronization or stale data
- Predictable behavior: same command → same result

**Context-Based Scoping**: Explicit backend selection with isolated credentials
- `work context add <name> --tool <backend> [options]`
- Mental model: "contexts define scope, queries filter within scope"
- No implicit tool guessing or global configuration

**Adapter Pattern**: Uniform interface across heterogeneous backends
- Same commands work across all supported backends
- No lowest-common-denominator limitations
- Independent adapter versioning and testing

### Command Categories

**Core Lifecycle**
```bash
work create <title> [options]    # Create new work item
work start <wid>                 # Start working on item
work close <wid>                 # Close completed item
work reopen <wid>                # Reopen closed item
```

**Query & Discovery**
```bash
work list [query]                # List work items with filtering
work get <wid>                   # Get detailed work item info
work search <text>               # Full-text search
```

**Relations & Structure**
```bash
work set <wid> --parent <parent-wid>     # Set hierarchical relations
work set <wid> --blocks <blocked-wid>    # Set dependency relations
work list --under <epic-wid>             # Query by relations
```

### Backend Support

| Backend | Status | Features | Authentication |
|---------|--------|----------|----------------|
| **local-fs** | ✅ Complete | Full offline capability | None required |
| **GitHub** | 🚧 Planned | Issues, Projects, PRs | OAuth 2.0 |
| **Jira** | 🚧 Planned | Issues, Epics, Sprints | API Token |
| **Linear** | 🚧 Planned | Issues, Projects, Teams | API Key |
| **Azure DevOps** | 🚧 Planned | Work Items, Boards | PAT |

### Notification System
- **Telegram Integration**: Human-in-the-loop workflows via notifications
- **Query-Based Alerts**: `work notify send where assignee=human to telegram-dev`
- **Agent-Human Collaboration**: Seamless handoffs between automated and manual work

### Performance Characteristics
- **List operations**: < 2s for up to 1,000 items
- **CLI startup**: < 500ms for immediate productivity
- **Memory usage**: < 100MB per command execution
- **Graph slices**: < 10MB for typical queries

## Troubleshooting

### Common Issues

**Context not found**
- Check available contexts: `work context list`
- Set active context: `work context set <name>`
- Verify context configuration: `work context show <name>`

**Backend authentication errors**
- Verify credentials in context configuration
- Check API token/key permissions and expiration
- Review backend-specific authentication requirements

**Command execution slow**
- Check backend API rate limits and quotas
- Verify network connectivity to remote backends
- Consider using local-fs backend for offline work

**Work item not found**
- Verify work item ID format for current backend
- Check if item exists in current context scope
- Use `work search` to find items by title or content

### Performance Optimization

**Local-FS Backend**
- Keep work item files organized in subdirectories
- Use `.work/` directory in project root for better performance
- Regular cleanup of closed items to maintain speed

**Remote Backends**
- Use specific queries to reduce API calls
- Leverage caching where available
- Monitor API usage to avoid rate limiting

### Getting Help
- View command help: `work <command> --help`
- Check configuration: `work context show`
- Review logs for detailed error information
- Consult documentation: [docs/README.md](docs/README.md)

## Development

### Prerequisites
- Node.js 18+ with npm/yarn
- TypeScript 5.0+
- Jest for testing
- Kiro CLI for development workflows

### Setup
```bash
git clone https://github.com/username/work-cli
cd work-cli
npm install
npm run build
npm test
```

### Testing Strategy
- **Unit Tests (70%)**: Core logic, adapters, query evaluation
- **Integration Tests (20%)**: Adapter-backend interactions, context resolution  
- **End-to-End Tests (10%)**: Full CLI workflows, cross-feature scenarios
- **Coverage Target**: >80% test coverage

### Code Quality Standards
- TypeScript strict mode with explicit types
- JSDoc comments for all public APIs
- Explicit error handling with typed errors
- Prettier formatting with ESLint
- No `any` types - prefer specific types or `unknown`

### Contributing
1. Follow the coding standards in [AGENTS.md](AGENTS.md)
2. Write tests following the 70/20/10 pyramid
3. Update documentation for new features
4. Ensure all tests pass and coverage remains >80%

## Documentation

Comprehensive technical documentation is available in [docs/](docs/):

- **[Complete Documentation Index](docs/README.md)** - Overview of all documentation
- **[CLI Specification](docs/work-cli-spec.md)** - Complete command reference
- **[Architecture Overview](docs/work-adapter-architecture.md)** - Multi-backend design
- **[User Journey Guide](docs/work-user-journey-context-and-query.md)** - Context and querying
- **[Performance Requirements](docs/work-nonfunctional-requirements.md)** - Quality attributes

## License

MIT License - see [LICENSE](LICENSE) for details.
