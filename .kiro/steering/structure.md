# Project Structure

## Directory Layout
```
work-cli/
├── src/
│   ├── cli/           # Command parsing and CLI interface
│   ├── core/          # Core engine and graph logic
│   ├── adapters/      # Adapter implementations
│   │   ├── local-fs/  # Local filesystem adapter
│   │   ├── jira/      # Jira adapter
│   │   ├── github/    # GitHub adapter
│   │   ├── linear/    # Linear adapter
│   │   └── ado/       # Azure DevOps adapter
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── tests/
│   ├── unit/          # Unit tests (70%)
│   ├── integration/   # Integration tests (20%)
│   └── e2e/           # End-to-end tests (10%)
├── docs/              # Documentation
├── examples/          # Usage examples and demos
├── scripts/           # Build and development scripts
├── .kiro/             # Kiro CLI configuration
├── Makefile           # Unified development commands
└── package.json       # Node.js project configuration
```

## File Naming Conventions
- **TypeScript files**: camelCase with `.ts` extension
- **Test files**: `*.test.ts` or `*.spec.ts`
- **Configuration files**: kebab-case (e.g., `eslint.config.js`)
- **Documentation**: kebab-case with `.md` extension
- **Adapters**: Directory per backend with `index.ts` entry point

## Module Organization
- **CLI Layer**: Command parsing, validation, and user interface
- **Core Engine**: Context resolution, query planning, graph operations
- **Adapter Layer**: Backend-specific implementations with uniform interface
- **Types**: Shared TypeScript interfaces and type definitions
- **Utils**: Cross-cutting concerns and helper functions

## Configuration Files
- **package.json**: Node.js dependencies and scripts
- **tsconfig.json**: TypeScript compiler configuration
- **jest.config.js**: Testing framework configuration
- **eslint.config.js**: Code linting rules
- **.prettierrc**: Code formatting configuration
- **Makefile**: Development workflow commands

## Documentation Structure
- **README.md**: Project overview and quick start
- **docs/**: Comprehensive documentation ([docs/README.md](../docs/README.md) provides complete index)
  - **work-cli-spec.md**: Complete CLI specification and command reference
  - **work-adapter-architecture.md**: Multi-backend support via adapter pattern
  - **work-graph-ontology-and-runtime.md**: Internal graph model and stateless execution
  - **work-local-fs-execution-flow.md**: Detailed execution flow for local filesystem backend
  - **work-c4-architecture.md**: C4 architecture diagrams in PlantUML format
  - **work-user-journey-context-and-query.md**: Concrete user journey demonstrating context and querying
  - **work-nonfunctional-requirements.md**: Quality attributes and performance requirements
  - **work-cli-tech-selection.md**: CLI technology selection and rationale
  - **work-poc.md**: Proof of concept implementation plan
- **examples/**: Working code samples and tutorials

## Asset Organization
- **scripts/**: Build, development, and deployment scripts
- **examples/**: Sample configurations and usage patterns
- **docs/**: All documentation and diagrams

## Build Artifacts
- **dist/**: Compiled TypeScript output
- **coverage/**: Test coverage reports
- **node_modules/**: npm dependencies (gitignored)
- ***.log**: Log files (gitignored)

## Environment-Specific Files
- **.env.example**: Template for environment variables
- **jest.config.js**: Test environment configuration
- **.github/workflows/**: CI/CD pipeline definitions
- **Makefile**: Cross-platform development commands
