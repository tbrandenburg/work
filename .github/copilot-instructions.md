# Copilot Instructions for work CLI

## Overview
Unified stateless CLI bridging AI agents and task management systems (GitHub, Jira, Linear, ADO, local-fs). TypeScript (strict mode), Node.js ≥18, oclif v4, Vitest. ~2,300 lines. Adapter pattern architecture.

**Product Vision**: Revolutionary mixed human-agent teams where everyone operates on equal footing. Agents get notified, work autonomously, and can assign tasks to humans. Same development cycle beat glues everyone together. Read `.kiro/steering/product.md` for full vision.

**Structure**: `src/{cli,core,adapters,types,utils}`, `tests/{unit,integration,e2e}`, `docs/`, compiled to `dist/`. Keep root clean. Temp files go in `dev/`.

## Build & Validation (CRITICAL)

**After code changes, ALWAYS run**: `make ci` (2-3 min: install → lint → build → test)

**Individual Commands** (validated, order matters):
1. `npm install` - After changing package.json
2. `npm run type-check` - TypeScript strict mode (~2-5s)
3. `npm run lint` / `npm run lint:fix` - ESLint, must pass (~2-5s)
4. `npm run build` - Compile to dist/ (~3-10s) - REQUIRED before testing
5. `npm test` - All tests (60-90s due to GitHub API calls - DO NOT cancel early!)
   - `npm run test:unit` - Faster for dev (~40s)
   - `npm test -- --coverage` - With coverage (>60% required)
6. `npm run format` - Auto-format (Prettier)
7. `npm run clean` - Remove dist/ and coverage/

**Common Sequences**:
```bash
make ci                    # Full validation (recommended)
make clean && make ci      # Fresh build
make check                 # lint + test only
make install-global        # Build and install globally
```

## Configuration Files
- **tsconfig.json**: Strict TS, path aliases (@/cli/*, @/core/*, @/adapters/*)
- **vitest.config.ts**: 30s timeout, 60% coverage threshold
- **eslint.config.mjs**: Flat config, no `any` allowed
- **.prettierrc**: semi, singleQuote, 80 char width
- **Makefile**: Unified CI/CD commands

## TypeScript Rules (Strict Mode)
- **NEVER use `any`** - use specific types or `unknown` (ESLint error)
- camelCase variables/functions, PascalCase classes
- JSDoc for public APIs
- Explicit error handling (no silent failures)
- Path aliases: `import { X } from '@/cli/Y'`
- All strict checks enabled: noImplicitAny, strictNullChecks, noUnusedLocals, exactOptionalPropertyTypes, etc.

## Testing (70/20/10 Pyramid)
- Unit (70%): Mock external deps
- Integration (20%): Test adapters
- E2E (10%): Full workflows with GitHub/Telegram
- Files: `*.test.ts` or `*.spec.ts`
- Coverage: >60% (lines, functions, branches, statements)

## CI/CD & Pre-commit
**GitHub Actions** (.github/workflows/ci.yml): Runs on push/PR to main/develop
- Test matrix: Node 18.x, 20.x, 22.x
- Steps: install (npm ci) → type-check → lint → build → test GitHub tokens → test with coverage → Codecov
- Security job: npm audit (moderate level)

**Pre-commit hooks** (.pre-commit-config.yaml): If installed, runs format:check, lint, type-check, tests (~2 min).

## Common Issues & Solutions

### Tests Take 60-90+ Seconds
**Normal** - GitHub API calls, network latency, E2E workflows. DO NOT cancel before 2 minutes.

### GitHub API Rate Limits
Tests use authenticated GitHub CLI for higher limits. Verify: `gh auth status`

### Build Succeeds but Tests Fail
ALWAYS run `npm run build` before `npm test`. Use `make ci` for correct order.

### Linting Errors About `any`
Replace with specific types or `unknown`. No exceptions.

### TypeScript Path Aliases Not Resolving
Already configured via vite-tsconfig-paths in vitest.config.ts.

## Environment Variables
`.env` (never commit - use .env.example as template):
- `GITHUB_TOKEN` or `CI_GITHUB_TOKEN` - Required for integration/e2e tests
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` - Optional for Telegram tests

## Architecture & Code Organization

**Core Principles** (from .kiro/steering/architecture.md):
1. **Stateless execution** - No daemon, ephemeral graph slices, no caching
2. **Adapter pattern** - Uniform interface for backends (GitHub, local-fs, future: Jira/Linear/ADO)
3. **Property graph model** - WorkItem nodes with typed relations (parent_of, blocks, etc.)
4. **Context-based scoping** - Explicit selection, credential isolation per context

**Key Files**:
- `src/cli/commands/*` - oclif command implementations
- `src/core/engine.ts` - Main execution engine
- `src/core/graph.ts` - Graph model
- `src/adapters/{github,local-fs}/` - Backend implementations
- `bin/run.js` - CLI entry point

**Guidelines from AGENTS.md**:
- Keep it simple, YAGNI principle
- No over-engineering
- >60% test coverage required
- Tool Completeness Rule: Loop pagination until exhaustion
- Avoid "most", "all", "nearly" without exhaustive proof

**Performance targets**: List ops <2s (1k items), CLI startup <500ms, memory <100MB.

## Documentation
**Steering Documents** (MUST READ - Core principles):
- **.kiro/steering/architecture.md** - Stateless execution, adapter pattern, graph model
- **.kiro/steering/product.md** - Revolutionary mixed human-agent teams vision
- **.kiro/steering/structure.md** - Project layout and organization
- **.kiro/steering/tech.md** - Technology stack and standards

**Technical Docs**:
- **docs/README.md** - Documentation index
- **docs/work-cli-spec.md** - Complete CLI reference
- **docs/work-adapter-architecture.md** - Adapter design
- **docs/work-graph-ontology-and-runtime.md** - Graph model
- **AGENTS.md** - Agent development guidelines

## Quick Reference After Changes
```bash
make ci  # One-stop validation (install → lint → build → test)
```

All commands validated. Trust these instructions - they work.
