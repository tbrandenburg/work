# work CLI - Revolutionary Mixed Human-Agent Teams

https://github.com/user-attachments/assets/4019fdba-05bc-4008-8c26-75e37c43672f

## The Story Twist: From Human-Orchestrated to Equal Partnership

**Before**: Human developers orchestrated agents to do their work - mostly one-developer scenarios.

<div align="center">
<img src="https://raw.githubusercontent.com/tbrandenburg/work/main/docs/work-before.drawio.svg" style="max-width: 100%; height: auto;">
</div>

**Now**: `work` enables revolutionary mixed human-agent teams where everyone operates on the same level, using the same communication mechanisms and development processes.

<div align="center">
<img src="https://raw.githubusercontent.com/tbrandenburg/work/main/docs/work-vision.drawio.svg" style="max-width: 100%; height: auto;">
</div>

## The Innovation

`work` gathers all participants - humans and agents - into one unified system. When `work` runs on schedule, it triggers both humans and agents to work on their tasks. Assignees can be set by anyone, but the engine keeps running autonomously:

- **Agents get notified** and work on their tasks
- **Agents can assign tasks to humans** when needed  
- **Everyone operates on equal footing**
- **Same development cycle beat** glues everyone together
- **Interoperability** connects any task management system or notification target
- **Future A2A networks** for deeper agent-to-agent integration

This is the actual revolution: **true mixed human-agent teams** working together seamlessly.

## Choose Your Path

**🚀 Just want to try it?** → [5-Minute Quick Start](docs/getting-started/quick-start.md)

**📚 New to task management CLIs?** → [Complete GitHub Workflow Tutorial](examples/ai-scrum-github/README.md)

**🔧 Integrating with existing workflow?** → [GitHub Authentication Guide](docs/work-github-auth.md)

**🤖 Setting up AI agents?** → [AI Scrum Examples](examples/)

**❓ Having issues?** → [Documentation Index](docs/README.md)

## Real-World Examples

### For Solo Developers
```bash
# Track personal projects across GitHub repos
work context add my-project --tool github --url https://github.com/me/my-app
work create "Add dark mode" --kind feature
```

### For Teams
```bash
# Coordinate team work with notifications
work notify add telegram --chat-id team-chat
work create "Deploy v2.1" --assignee devops-team
work notify send DEPLOY-456  # Alerts team
```

### For AI Agents
```bash
# Agents can manage their own work items
work create "Refactor user service" --assignee ai-agent --automated
work start TASK-789 --comment "AI agent beginning refactor"
```

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
