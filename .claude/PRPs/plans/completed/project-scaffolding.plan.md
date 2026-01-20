# Feature: Project Scaffolding

## Summary

Establish a professional TypeScript CLI development foundation with modern tooling, testing infrastructure, and CI/CD pipeline. Creates the complete project structure and development workflow needed for implementing the work CLI, following the exact specifications from project documentation.

## User Story

As a developer working on the work CLI
I want a professional TypeScript development foundation with testing and CI/CD
So that I can efficiently build and maintain the CLI with quality assurance

## Problem Statement

No development foundation exists for the work CLI project. Developers need a complete, professional TypeScript project setup with quality gates, testing infrastructure, and automation to efficiently implement the unified task management CLI.

## Solution Statement

Create a complete TypeScript/Node.js project scaffolding using oclif CLI framework, Jest testing, ESLint/Prettier code quality tools, and GitHub Actions CI/CD pipeline. Follow the exact project structure and technology choices documented in the project specifications.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | NEW_CAPABILITY                                    |
| Complexity       | MEDIUM                                            |
| Systems Affected | Development workflow, build system, testing, CI/CD |
| Dependencies     | Node.js LTS, oclif v4.0, Jest v30, TypeScript 5.4+ |
| Estimated Tasks  | 12                                                |

---

## UX Design

### Before State
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Developer  │ ──────► │   Manual    │ ──────► │   Error     │
│   Wants     │         │   Setup     │         │   Prone     │
│   to Code   │         │   Process   │         │   Result    │
└─────────────┘         └─────────────┘         └─────────────┘

USER_FLOW: Developer manually creates package.json, tsconfig.json,
           jest.config.js, eslint.config.js, .prettierrc, Makefile
PAIN_POINT: Time-consuming setup, inconsistent configurations,
            missing quality gates, no CI/CD pipeline
DATA_FLOW: No structured workflow - ad-hoc file creation
```

### After State
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Developer  │ ──────► │  Professional│ ──────► │  Ready to   │
│   Wants     │         │  TypeScript  │         │  Implement  │
│   to Code   │         │  Foundation  │         │  Features   │
└─────────────┘         └─────────────┘         └─────────────┘
                                │
                                ▼
                       ┌─────────────┐
                       │ Quality     │  ◄── Testing, Linting, CI/CD
                       │ Assurance   │
                       └─────────────┘

USER_FLOW: Run scaffolding commands → Get complete development setup
VALUE_ADD: Professional foundation with quality gates and automation
DATA_FLOW: Structured project → Build system → Quality checks → Deploy
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Project root | Empty directory | Complete TypeScript project | Can start coding immediately |
| Development workflow | Manual setup | Automated quality gates | Consistent code quality |
| CI/CD | No automation | GitHub Actions pipeline | Automated testing and deployment |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `docs/work-poc.md` | 15-50 | Exact project structure to CREATE |
| P0 | `.kiro/steering/tech.md` | 1-30 | Technology stack decisions |
| P0 | `docs/work-cli-tech-selection.md` | 15-25 | oclif framework requirements |
| P1 | `AGENTS.md` | 30-55 | Code quality standards and root file rules |
| P1 | `.kiro/steering/architecture.md` | all | Architecture principles to follow |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [oclif v4.0 Docs](https://oclif.io/docs/introduction/) | Getting Started | CLI framework setup patterns |
| [ts-jest Documentation](/websites/kulshekhar_github_io_ts-jest) | Configuration | TypeScript testing setup with Jest |
| [TypeScript-ESLint](/typescript-eslint/typescript-eslint) | Flat Config | Modern ESLint setup with projectService |
| [ESLint Config Prettier](/prettier/eslint-config-prettier) | Flat Config Integration | Prettier + ESLint compatibility |

---

## Patterns to Mirror

**PROJECT_STRUCTURE:**
```typescript
// SOURCE: docs/work-poc.md:15-35
// COPY THIS PATTERN:
work-cli/
├── src/
│   ├── cli/           # Command parsing and CLI interface
│   ├── core/          # Core engine and graph logic
│   ├── adapters/      # Adapter implementations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities
├── tests/
│   ├── unit/          # Unit tests (70%)
│   ├── integration/   # Integration tests (20%)
│   └── e2e/           # End-to-end tests (10%)
```

**TYPESCRIPT_CONFIG:**
```typescript
// SOURCE: .kiro/steering/tech.md:15-20
// COPY THIS PATTERN:
// TypeScript: Strict mode with path mapping
// Enable all strict TypeScript compiler options
```

**TESTING_STRATEGY:**
```typescript
// SOURCE: .kiro/steering/tech.md:25-30
// COPY THIS PATTERN:
// Testing Pyramid: 70% unit tests, 20% integration tests, 10% end-to-end tests
// Jest with coverage reporting >80%
```

**ROOT_FILE_RULES:**
```typescript
// SOURCE: AGENTS.md:30-40
// COPY THIS PATTERN:
// Only these files allowed in root:
// package.json, package-lock.json, tsconfig.json, jest.config.js,
// eslint.config.js, .prettierrc, Makefile, README.md, AGENTS.md,
// .gitignore, .gitattributes, LICENSE
```

**CODE_STANDARDS:**
```typescript
// SOURCE: AGENTS.md:45-55
// COPY THIS PATTERN:
// TypeScript strict mode, explicit types, no any
// camelCase for variables/functions, PascalCase for classes
// JSDoc comments for public APIs
```

**PERFORMANCE_TARGETS:**
```typescript
// SOURCE: .kiro/steering/tech.md:45-50
// COPY THIS PATTERN:
// CLI Startup: < 500ms for immediate productivity
// List Operations: < 2s for up to 1,000 items
// Memory Usage: < 100MB per command execution
```

**JEST_CONFIG:**
```javascript
// SOURCE: Context7 /websites/kulshekhar_github_io_ts-jest
// COPY THIS PATTERN:
// Use: npx ts-jest config:init
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**ESLINT_CONFIG:**
```javascript
// SOURCE: Context7 /typescript-eslint/typescript-eslint
// COPY THIS PATTERN:
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslintConfigPrettier,
];
```

---

## Files to Change

| File                             | Action | Justification                            |
| -------------------------------- | ------ | ---------------------------------------- |
| `package.json`                   | CREATE | Node.js project configuration with oclif dependencies |
| `tsconfig.json`                  | CREATE | TypeScript strict mode with path mapping |
| `jest.config.js`                 | CREATE | Jest testing configuration with coverage |
| `eslint.config.mjs`              | CREATE | ESLint configuration for TypeScript with flat config |
| `.prettierrc`                    | CREATE | Prettier formatting configuration |
| `Makefile`                       | CREATE | Unified development commands |
| `.github/workflows/ci.yml`       | CREATE | GitHub Actions CI/CD pipeline |
| `.pre-commit-config.yaml`        | CREATE | Pre-commit hooks for quality gates |
| `src/` directory structure       | CREATE | Source code organization |
| `tests/` directory structure     | CREATE | Test organization (unit/integration/e2e) |
| `scripts/` directory             | CREATE | Build and development scripts |
| `README.md`                      | UPDATE | Installation and usage instructions |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- CLI command implementations - Phase 2 scope
- Core business logic or adapters - Phase 2 scope  
- Actual work item functionality - Phase 2 scope
- Advanced documentation - Already exists comprehensively
- Deployment infrastructure beyond CI/CD - Not required
- UI/TUI components - Explicitly future work per docs
- Database or persistence setup - Not needed for scaffolding
- Authentication or security features - Phase 2+ scope

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `package.json`

- **ACTION**: CREATE Node.js project configuration
- **IMPLEMENT**: oclif dependencies, scripts, project metadata
- **MIRROR**: Standard oclif project structure from docs
- **IMPORTS**: `@oclif/core`, `typescript`, `jest`, `eslint`, `prettier`
- **GOTCHA**: Use exact versions to avoid conflicts - oclif v4.0, Jest v30, TypeScript 5.4+
- **VALIDATE**: `npm install` - dependencies must install without errors

### Task 2: CREATE `tsconfig.json`

- **ACTION**: CREATE TypeScript configuration
- **IMPLEMENT**: Strict mode, path mapping, oclif compatibility
- **MIRROR**: `.kiro/steering/tech.md` TypeScript standards
- **PATTERN**: Enable all strict compiler options, path mapping for clean imports
- **GOTCHA**: Set `moduleResolution: "node"` for oclif compatibility
- **VALIDATE**: `npx tsc --noEmit` - types must compile

### Task 3: CREATE directory structure

- **ACTION**: CREATE source and test directories
- **IMPLEMENT**: `src/cli/`, `src/core/`, `src/adapters/`, `src/types/`, `src/utils/`, `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **MIRROR**: `docs/work-poc.md:15-35` exact structure
- **PATTERN**: Follow documented organization exactly
- **VALIDATE**: `ls -la src/ tests/` - directories must exist

### Task 4: CREATE `jest.config.js`

- **ACTION**: CREATE Jest testing configuration
- **IMPLEMENT**: Use ts-jest preset for TypeScript support, coverage reporting, test environment
- **MIRROR**: Context7 ts-jest patterns: `npx ts-jest config:init` approach
- **PATTERN**: `testEnvironment: "node"` for CLI tools, coverage >80% target
- **GOTCHA**: Use `ts-jest` preset, not manual transform configuration
- **VALIDATE**: `npm test` - Jest must run (even with no tests)

### Task 5: CREATE `eslint.config.mjs`

- **ACTION**: CREATE ESLint configuration with flat config
- **IMPLEMENT**: TypeScript-ESLint with projectService, Prettier integration
- **MIRROR**: Context7 typescript-eslint patterns: `import tseslint from 'typescript-eslint'`
- **PATTERN**: Use `projectService: true`, `recommendedTypeChecked`, flat config format
- **GOTCHA**: Use `eslint.config.mjs` (not .js), import `eslint-config-prettier/flat`
- **VALIDATE**: `npm run lint` - ESLint must run without errors

### Task 6: CREATE `.prettierrc`

- **ACTION**: CREATE Prettier formatting configuration
- **IMPLEMENT**: Consistent formatting rules
- **PATTERN**: Standard TypeScript formatting preferences
- **GOTCHA**: Ensure compatibility with ESLint configuration
- **VALIDATE**: `npm run format` - Prettier must format files

### Task 7: CREATE `Makefile`

- **ACTION**: CREATE unified development commands
- **IMPLEMENT**: install, test, build, lint, clean, format commands
- **MIRROR**: `docs/work-poc.md` Makefile requirements
- **PATTERN**: Cross-platform commands using npm scripts
- **GOTCHA**: Use tabs not spaces in Makefile
- **VALIDATE**: `make install && make test && make build` - all commands work

### Task 8: CREATE `.github/workflows/ci.yml`

- **ACTION**: CREATE GitHub Actions CI/CD pipeline
- **IMPLEMENT**: Test, lint, build, coverage reporting
- **PATTERN**: Standard Node.js CI workflow with quality gates
- **GOTCHA**: Use Node.js LTS version matrix
- **VALIDATE**: Push to GitHub - CI pipeline must pass

### Task 9: CREATE `.pre-commit-config.yaml`

- **ACTION**: CREATE pre-commit hooks
- **IMPLEMENT**: Lint, format, test hooks
- **PATTERN**: Prevent bad commits with automated checks
- **GOTCHA**: Requires pre-commit package installation
- **VALIDATE**: `pre-commit run --all-files` - hooks must pass

### Task 10: CREATE basic source files

- **ACTION**: CREATE minimal TypeScript files for structure
- **IMPLEMENT**: `src/index.ts`, `src/cli/index.ts` with basic exports
- **PATTERN**: Minimal files that compile and pass linting
- **VALIDATE**: `npm run build` - TypeScript must compile

### Task 11: CREATE basic test files

- **ACTION**: CREATE minimal test files for structure
- **IMPLEMENT**: `tests/unit/example.test.ts`, `tests/integration/example.test.ts`
- **PATTERN**: Basic test structure that passes
- **VALIDATE**: `npm test` - tests must pass with coverage

### Task 12: UPDATE `README.md`

- **ACTION**: UPDATE README with installation and usage
- **IMPLEMENT**: Installation instructions, development workflow
- **MIRROR**: Professional README structure
- **PATTERN**: Clear setup instructions for new developers
- **VALIDATE**: Follow README instructions - setup must work

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/unit/example.test.ts`             | Basic functionality        | Test framework |
| `tests/integration/example.test.ts`      | Integration scenarios      | Integration setup |
| `tests/e2e/example.test.ts`              | End-to-end workflows       | E2E setup |

### Edge Cases Checklist

- [ ] Node.js version compatibility (LTS versions)
- [ ] Package installation on different platforms
- [ ] TypeScript compilation with strict mode
- [ ] ESLint and Prettier configuration conflicts
- [ ] Jest test discovery and execution
- [ ] CI/CD pipeline on different Node.js versions
- [ ] Makefile cross-platform compatibility

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
npm run lint && npm run type-check
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS

```bash
npm test
```

**EXPECT**: All tests pass, coverage >= 80%

### Level 3: FULL_SUITE

```bash
npm test && npm run build
```

**EXPECT**: All tests pass, build succeeds

### Level 4: MAKEFILE_VALIDATION

```bash
make install && make test && make build && make lint
```

**EXPECT**: All Makefile commands work correctly

### Level 5: CI_VALIDATION

Push to GitHub repository:

- [ ] CI pipeline passes
- [ ] All quality gates pass
- [ ] Coverage reporting works

### Level 6: MANUAL_VALIDATION

1. Clone repository to fresh directory
2. Follow README installation instructions
3. Run `npm install && npm test && npm run build`
4. Verify all commands work as documented

---

## Acceptance Criteria

- [ ] Clean `npm install && npm test && npm build` workflow
- [ ] Makefile with standardized commands (install, test, build, lint, clean)
- [ ] Pre-commit hooks preventing bad commits (lint, test, format)
- [ ] Test coverage reporting with >80% target
- [ ] Automated CI pipeline with all checks passing
- [ ] Professional README with installation/usage
- [ ] Project structure matches docs/work-poc.md exactly
- [ ] All configuration files follow documented standards
- [ ] TypeScript strict mode enabled with path mapping
- [ ] ESLint and Prettier integration working

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (lint + type-check) passes
- [ ] Level 2: Unit tests pass
- [ ] Level 3: Full test suite + build succeeds
- [ ] Level 4: Makefile commands work
- [ ] Level 5: CI pipeline passes
- [ ] Level 6: Manual validation successful
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk               | Likelihood   | Impact       | Mitigation                              |
| ------------------ | ------------ | ------------ | --------------------------------------- |
| Version conflicts between dependencies | MEDIUM | HIGH | Pin exact versions, test compatibility |
| Platform compatibility (Makefile) | LOW | MEDIUM | Use cross-platform npm scripts |
| CI/CD pipeline failures | LOW | MEDIUM | Test locally first, use standard Node.js workflow |
| TypeScript path resolution issues | LOW | HIGH | Follow oclif documentation exactly |

---

## Notes

This scaffolding phase creates the foundation for all future development. The project structure and tooling choices are based on comprehensive documentation analysis and follow the exact specifications from the project's steering documents. The setup prioritizes developer productivity, code quality, and maintainability while adhering to the documented architecture principles.

Key design decisions:
- oclif v4.0 for CLI framework (mandatory per docs)
- Jest v30 for testing with TypeScript 5.4+ requirement
- ESLint + Prettier for code quality with modern flat config
- GitHub Actions for CI/CD with Node.js LTS matrix
- Makefile for unified cross-platform development commands
- Strict TypeScript configuration for maximum type safety
