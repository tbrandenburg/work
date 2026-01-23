# work CLI - Agent Guidelines

You are not rewarded for progress.
You are rewarded for correctness under adversarial scrutiny.

Assume earlier conclusions are wrong
until re‑proven with fresh evidence.

## Project Overview
The work CLI is a unified, stateless command-line tool that bridges AI agents and task management systems (Jira, GitHub, Linear, Azure DevOps, local filesystem). It provides a consistent interface for managing work items across multiple backends without vendor lock-in.

Considerable effort has been invested in planning and designing this system to ensure robust architecture and clear implementation guidelines.

## Core principles

### Keep it simple
- Do not over engineer
- Keep it simple
- Keep core code and principles well tested

### YAGNI
- Justify every line of code you write

Keep in mind that we are early in development and we do not have any users yet, so do not be afraid of breaking things. We also do not need complicated backwards compatibility since we are building core primitives first.

## Project Structure
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
├── tests/             # Test files (unit/integration/e2e)
├── docs/              # Documentation
├── scripts/           # Build and development scripts
├── examples/          # Usage examples and sample configurations
├── dev/               # Intermediate and temporary files (gitignored)
└── .kiro/             # Kiro CLI configuration
```

### Root Directory Rules
Keep the root directory clean. Only these files are allowed:
- `package.json`, `package-lock.json` - Node.js project files
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Testing configuration
- `eslint.config.js`, `.prettierrc` - Code quality tools
- `Makefile` - Development commands
- `README.md`, `AGENTS.md` - Documentation
- `.gitignore`, `.gitattributes` - Git configuration
- `LICENSE` - Project license

All other files must be organized into appropriate subdirectories.

**Temporary Development Files**: Place todos, notes, scratch files, and other development artifacts in `dev/` (gitignored). This keeps the root clean while preserving work-in-progress materials.

## Code Quality Standards

### TypeScript Standards
- Use strict mode with explicit types
- Never use `any` - prefer specific types or `unknown`
- Use camelCase for variables/functions, PascalCase for classes
- Enable all strict TypeScript compiler options

### Code Structure
- Add JSDoc comments for all public APIs
- Implement explicit error handling with typed errors
- No silent failures - always handle or propagate errors
- Follow Prettier formatting (auto-applied)
- Use meaningful variable and function names

### Language Constraints
FORBIDDEN WITHOUT EXHAUSTIVE PROOF:
- "most"
- "all"
- "nearly"
- "already"
- "looks complete"

To use these words, you MUST:
- show a complete enumeration
- show total count
- show zero unknowns

### Tool Completeness Rule
TOOL COMPLETENESS RULE:
Any tool with limits (max_files, pagination, sampling)
MUST be looped until exhaustion.

If exhaustion is impossible:
- Declare the result INCOMPLETE
- Do NOT draw conclusions

### Testing Requirements
- Write tests following 70/20/10 pyramid (unit/integration/e2e)
- Maintain >80% test coverage
- Mock external dependencies in unit tests
- Test files: `*.test.ts` or `*.spec.ts`
- Hard rule: after a coding session, before reporting back to the user run `make ci` to test the changes and fix issues until the test suite passes.

### Security Practices
- Validate and sanitize all user inputs
- Never log sensitive data (credentials, tokens, PII)
- Never read credentials into context - always check existence only, pipe to secure storage, or redact values
- Use explicit error types without exposing internal details
- Implement proper credential isolation per context

### Architecture Principles
- **Stateless Execution**: No daemon, no caching, ephemeral graph slices
- **Adapter Pattern**: Uniform interface for all backends
- **CLI Framework**: Use oclif for command parsing and help
- **Separation of Concerns**: CLI parses intent, core implements semantics

### Performance Requirements
- List operations: <2s for up to 1,000 items
- CLI startup: <500ms
- Memory usage: <100MB per command
- Test coverage: >80%

### File Naming Conventions
- TypeScript files: camelCase with `.ts` extension
- Test files: `*.test.ts` or `*.spec.ts`
- Configuration files: kebab-case
- Documentation: kebab-case with `.md` extension

## Documentation Reference
Detailed technical documentation is available in `docs/`:

- **[README.md](docs/README.md)** - Complete documentation index and overview
- **[work-cli-spec.md](docs/work-cli-spec.md)** - Complete CLI specification and command reference
- **[work-adapter-architecture.md](docs/work-adapter-architecture.md)** - Multi-backend support via adapter pattern
- **[work-graph-ontology-and-runtime.md](docs/work-graph-ontology-and-runtime.md)** - Internal graph model and stateless execution
- **[work-local-fs-execution-flow.md](docs/work-local-fs-execution-flow.md)** - Detailed execution flow for local filesystem backend
- **[work-c4-architecture.md](docs/work-c4-architecture.md)** - C4 architecture diagrams in PlantUML format
- **[work-configuration-overview.md](docs/work-configuration-overview.md)** - Configuration system and credential management
- **[work-user-journey-context-and-query.md](docs/work-user-journey-context-and-query.md)** - Concrete user journey demonstrating context and querying
- **[work-nonfunctional-requirements.md](docs/work-nonfunctional-requirements.md)** - Quality attributes and performance requirements
- **[work-cli-tech-selection.md](docs/work-cli-tech-selection.md)** - CLI technology selection and rationale
- **[work-poc.md](docs/work-poc.md)** - Proof of concept implementation plan

Product requirements and strategic vision:
- **[work-cli-unified-task-management.prd.md](.claude/PRPs/prds/work-cli-unified-task-management.prd.md)** - Complete product requirements document with problem statement, solution architecture, and implementation phases
