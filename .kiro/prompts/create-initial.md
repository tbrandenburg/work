# Generate INITIAL.md and AGENTS.md for PRP Project

Create a comprehensive INITIAL.md and AGENTS.md from guided questionnaire for PRP project setup.

## Instructions

This command will guide you through an interactive questionnaire to create both INITIAL.md (feature requirements) and AGENTS.md (AI agent guidelines) files for your PRP project.

## Process

### Phase 1: Project Context Discovery

**Question 1: Project Overview**
```
What is your project about? Include:
- Project name (lowercase, hyphens for spaces)
- One-sentence description of what it does
- Is this a new project or adding to existing code?
```

**Question 2: Tech Stack**
```
What's your technology stack?
- Primary language (Python, TypeScript, etc.)
- Framework (FastAPI, Express, Next.js, etc.)
- Database (PostgreSQL, MongoDB, none, etc.)
- Package manager (npm, pip, uv, poetry, etc.)
- AI/ML libraries if applicable (Pydantic AI, LangChain, etc.)

If unsure about any choices, say "I don't know" and I'll research recommendations.
```

**Question 3: Development Environment**
```
What are your development commands?
- Start dev server: (e.g., "npm run dev", "uvicorn main:app --reload")
- Run tests: (e.g., "pytest", "npm test")
- Lint/type check: (e.g., "ruff check . && mypy .", "npm run lint")
- Virtual environment (Python): (venv, poetry, conda, uv)
```

### Phase 2: Code Standards & Structure

**Question 4: Code Organization**
```
How do you organize your code?
- Max file length: (200, 300, 500 lines, or no limit)
- Organization style:
  A) By feature: auth/models.py, auth/services.py, auth/routes.py
  B) By layer: models/auth.py, services/auth.py, routes/auth.py  
  C) Single files: auth.py contains everything
- Linter/formatter: (ruff, eslint+prettier, etc.)
- Type checking: (mypy, typescript strict, none)
```

**Question 5: Testing Requirements**
```
What are your testing standards?
- Framework: (pytest, jest, vitest, etc.)
- Test location: (/tests folder, alongside files, both)
- Required test types: (unit only, unit+integration, unit+integration+e2e)
- Minimum coverage: (happy path, happy+edge, happy+edge+error cases)
```

### Phase 3: Feature Definition

**Question 6: Feature Description**
```
Describe the feature you want to build in detail:
- What it does
- Main components/endpoints/tools
- Inputs and outputs  
- Any external integrations needed
- Who uses it and how

Take your time - more detail = better results.
```

**Question 7: Component Breakdown**
```
Break this into specific components. For each one:
- Component name
- Purpose (what it does)
- Inputs (what data it receives)
- Outputs (what it produces/returns)

Example:
- "UserAuthenticator" - validates user credentials, takes email/password, returns JWT token
- "DataProcessor" - transforms raw data, takes CSV file, returns cleaned JSON
```

**Question 8: External Dependencies**
```
Does this feature need external APIs or services?
For each one list:
- Service name (e.g., "OpenAI API", "Stripe", "GitHub API")
- What you'll use it for
- Documentation URL (if known, otherwise I'll find it)
```

### Phase 4: Examples & Patterns

**Question 9: Existing Examples**
```
Do you have code examples the AI should follow?
- Yes, in examples/ folder
- Yes, elsewhere in codebase (specify paths)
- No examples, but I can describe patterns
- No examples yet

If yes, for each example:
- File path
- What pattern it demonstrates
```

**Question 10: External References**
```
Any external repositories, tutorials, or documentation the AI should reference?
Examples:
- "https://github.com/example/repo - shows the pattern I want"
- "FastAPI documentation for async endpoints"
- "Pydantic AI official examples"
```

### Phase 5: Gotchas & Quality Assurance

**Question 11: Common Mistakes**
```
What mistakes do AI coding assistants commonly make with your stack?
Examples:
- "Forgets to close database connections"
- "Uses wrong import style"
- "Doesn't handle async properly"
- "Uses outdated API methods"

If unsure, I'll research common gotchas for your stack.
```

**Question 12: Library-Specific Requirements**
```
Any specific library quirks or requirements?
Examples:
- "Pydantic v2 requires model_validate() not parse_obj()"
- "FastAPI routes must be async for database calls"
- "This ORM doesn't support batch inserts over 1000 records"
```

**Question 13: Security & Additional Concerns**
```
Security and additional requirements:
- Authentication type (JWT, OAuth, API keys, none)
- Input validation requirements
- Rate limiting needs
- Additional files to create (.env.example, README, migrations, etc.)
```

### Phase 6: Success Criteria

**Question 14: Definition of Done**
```
How will you know this feature is complete?
List specific, measurable criteria:
Examples:
- "User can authenticate via email/password"
- "API returns results in under 200ms"
- "All endpoints have proper error handling"
- "Tests achieve 90% coverage"
```

**Question 15: Manual Verification**
```
What manual tests should verify it works?
Examples:
- "POST to /api/auth with valid credentials returns JWT"
- "Running CLI with --help shows usage instructions"
- "Dashboard loads and displays user data"
```

### Phase 7: File Generation

After collecting all answers, I will:

1. **Generate INITIAL.md** with structure:
   ```markdown
   ## FEATURE:
   [Detailed feature description]
   
   ### Components
   [Component breakdown with inputs/outputs]
   
   ## EXAMPLES:
   [Existing patterns to follow]
   
   ## DOCUMENTATION:
   [All documentation URLs with descriptions]
   
   ## OTHER CONSIDERATIONS:
   [Gotchas, security, additional files, success criteria]
   ```

2. **Generate AGENTS.md** with structure:
   ```markdown
   # Project Guidelines for AI Assistant
   
   ## Project Overview
   [Project name and description]
   
   ## Tech Stack
   [Complete technology stack]
   
   ## Code Structure & Modularity
   [File organization, naming conventions, modularity rules]
   
   ## Testing & Reliability
   [Test framework, requirements, commands]
   
   ## Development Commands
   [All development workflow commands]
   
   ## Style & Conventions
   [Linting, formatting, documentation style]
   
   ## Known Gotchas
   [Stack-specific mistakes to avoid]
   
   ## AI Behavior Rules
   [How the AI assistant should behave]
   ```

3. **Web Research Integration**: If you say "I don't know" to any question, I'll search for:
   - Framework comparisons and recommendations
   - Official documentation URLs
   - Common gotchas and best practices
   - Project structure recommendations

4. **Quality Verification**: Before generating files, I'll confirm:
   - All tech choices are consistent
   - Development commands work together
   - Documentation URLs are valid
   - Success criteria are measurable

## Usage Examples

**For a new Python FastAPI project:**
```
Project: task-management-api
Description: REST API for managing tasks with team collaboration
Stack: Python + FastAPI + PostgreSQL + pytest
Feature: User authentication with JWT tokens
```

**For a TypeScript React dashboard:**
```
Project: analytics-dashboard  
Description: Real-time analytics dashboard with charts
Stack: TypeScript + React + Express + PostgreSQL + Vitest
Feature: Interactive data visualization with filtering
```

**For an AI agent project:**
```
Project: research-assistant
Description: AI agent that researches topics and creates summaries
Stack: Python + Pydantic AI + OpenAI + pytest
Feature: Multi-source research with citation tracking
```

## Output

This command will create:
- `INITIAL.md` - Feature requirements for immediate implementation
- `AGENTS.md` - AI assistant guidelines for the entire project

Both files will be optimized for AI agents to understand your project context and implement features successfully.

## Notes

- Answer questions one at a time for best results
- Say "I don't know" when uncertain - I'll research for you
- Be specific in feature descriptions for better outcomes
- Review generated files and ask for adjustments if needed