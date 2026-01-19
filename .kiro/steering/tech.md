# Technical Architecture

## Technology Stack
- **Primary Language**: TypeScript/Node.js
- **CLI Framework**: oclif (TypeScript-based, widely adopted for serious CLIs)
- **Testing**: Jest with comprehensive test pyramid (70% unit, 20% integration, 10% e2e)
- **Build System**: TypeScript compiler with bundling
- **Package Management**: npm/yarn with lockfiles
- **Code Quality**: ESLint + Prettier with pre-commit hooks
- **CI/CD**: GitHub Actions for automated testing and releases

## Architecture Overview
- **Adapter Pattern**: Multi-backend support via uniform adapter interface
- **Stateless Execution**: No daemon, no caching, ephemeral graph slices per command
- **Property Graph Model**: WorkItem nodes with typed relation edges
- **Context-Based Scoping**: Explicit backend selection with isolated credentials
- **Local-fs Reference**: Filesystem-backed implementation as semantic reference

## Development Environment
- **Node.js**: Latest LTS version
- **TypeScript**: Strict mode with path mapping
- **CLI Framework**: oclif for command parsing, flag handling, help & completion
- **Development Tools**: Makefile for unified commands, pre-commit hooks
- **Testing Framework**: Jest with coverage reporting >80%
- **Documentation**: TypeDoc generation, built-in CLI help with oclif

## Code Standards
- **TypeScript**: Strict mode, explicit types, no any
- **Formatting**: Prettier with consistent configuration
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Documentation**: JSDoc comments for public APIs
- **Error Handling**: Explicit error types, no silent failures

## Testing Strategy
- **Testing Pyramid**: 70% unit tests, 20% integration tests, 10% end-to-end tests
- **Unit Tests**: Core logic, adapters, query evaluation with mocking
- **Integration Tests**: Adapter-backend interactions, context resolution
- **E2E Tests**: Full CLI workflows, cross-feature scenarios
- **Performance Tests**: Response time validation for NFR compliance

## Deployment Process
- **Build**: TypeScript compilation with bundling
- **Testing**: Automated test suite with coverage requirements
- **Release**: Semantic versioning with automated GitHub releases
- **Distribution**: npm package with cross-platform support
- **CI/CD**: GitHub Actions with quality gates

## Performance Requirements
- **List Operations**: < 2s for up to 1,000 items
- **CLI Startup**: < 500ms for immediate productivity
- **Memory Usage**: < 100MB per command execution
- **Graph Slices**: < 10MB for typical queries

## Security Considerations
- **Credential Isolation**: Per-context authentication with secure storage
- **Input Validation**: Sanitization and validation for all user inputs
- **API Security**: Proper OAuth 2.0 implementation for remote backends
- **Data Protection**: No sensitive data in logs or temporary files
