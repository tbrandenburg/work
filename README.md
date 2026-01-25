# work CLI - Unified Task Management

The work CLI is a unified, stateless command-line tool that bridges AI agents and task management systems. It provides a consistent interface for managing work items across multiple backends (Jira, GitHub, Linear, Azure DevOps, local filesystem) without vendor lock-in.

**AI Integration Focus**: Eliminates the need for agents to fiddle with JSON task lists or markdown TODOs. Integrates AI agents into existing task management workflows while enabling essential human-in-the-loop oversight through notification mechanisms.

**Key Hypothesis**: We believe `work` will enable agents to work in real projects with several developers together. We'll know we're right when agents can not be distinguished from humans in the workflow or when agents involve humans in their workflow.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Git

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

4. **Run the CLI**
   ```bash
   work hello world --from oclif
   ```

## GitHub Authentication

The work CLI provides seamless GitHub integration with a three-tier authentication hierarchy:

### Quick Setup (Recommended)

```bash
# If you already use GitHub CLI
gh auth login  # (if not already authenticated)
work context add my-project --tool github --url https://github.com/owner/repo

# Start working immediately - no token management needed!
work list
```

### Authentication Methods

1. **GitHub CLI** (Recommended) - Uses your existing `gh auth login` credentials
2. **Manual Token** - Explicit token via `--token` parameter  
3. **Environment Variable** - `GITHUB_TOKEN` for CI/CD workflows

For detailed setup instructions, troubleshooting, and security best practices, see the [GitHub Authentication Guide](docs/work-github-auth.md).

## Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build project
npm run build

# Format code
npm run format
```

### Using Makefile

The project includes a Makefile for unified development commands:

```bash
# Install dependencies
make install

# Run all checks (lint + test)
make check

# Run full CI pipeline
make ci

# Clean build artifacts
make clean

# Format code
make format
```

### Project Structure

```
work-cli/
├── src/
│   ├── cli/           # Command parsing and CLI interface
│   ├── core/          # Core engine and graph logic
│   ├── adapters/      # Backend implementations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── tests/
│   ├── unit/          # Unit tests (70%)
│   ├── integration/   # Integration tests (20%)
│   └── e2e/           # End-to-end tests (10%)
├── docs/              # Documentation
└── scripts/           # Build and development scripts
```

### Code Quality

This project maintains high code quality standards:

- **TypeScript**: Strict mode with explicit types
- **Testing**: Jest with >80% coverage requirement
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier for consistent code style
- **CI/CD**: GitHub Actions for automated testing

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run type-check` | Run TypeScript type checking |
| `npm run clean` | Clean build artifacts |

## Target Users

- **Applied AI Engineers**: Setting up agent harnesses needing interoperable task management interfaces
- **Product & Business Owners**: Letting their ideas get reality through autonomous agent teams  
- **DevOps Engineers**: Who need to integrate task management into CI/CD workflows and automation
- **Technical Project Managers**: Who need unified visibility across different project management systems

## Documentation

Comprehensive technical documentation is available in [docs/](docs/):

- **[Complete Documentation Index](docs/README.md)** - Overview of all documentation
- **[CLI Specification](docs/work-cli-spec.md)** - Complete command reference
- **[Architecture Overview](docs/work-adapter-architecture.md)** - Multi-backend design
- **[User Journey Guide](docs/work-user-journey-context-and-query.md)** - Context and querying
- **[Performance Requirements](docs/work-nonfunctional-requirements.md)** - Quality attributes

## Contributing

1. Follow the coding standards in [AGENTS.md](AGENTS.md)
2. Write tests following the 70/20/10 pyramid
3. Update documentation for new features
4. Ensure all tests pass and coverage remains >80%

## License

MIT License - see [LICENSE](LICENSE) for details.
