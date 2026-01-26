.PHONY: install test build lint clean format help

# Default target
help:
	@echo "Available commands:"
	@echo "  install         - Install dependencies"
	@echo "  install-global  - Install CLI globally"
	@echo "  uninstall-global- Remove global CLI installation"
	@echo "  test            - Run tests"
	@echo "  build           - Build the project"
	@echo "  lint            - Run linting"
	@echo "  clean           - Clean build artifacts"
	@echo "  format          - Format code"
	@echo "  dev             - Run in development mode"
	@echo "  validate-cli    - Test CLI functionality"
	@echo "  validate-filesystem - Check .work directory"
	@echo "  validate        - Run complete validation"
	@echo "  check           - Run lint + test"
	@echo "  ci              - Run full CI pipeline"

install:
	npm install

test:
	npm test -- --coverage

test-unit:
	npm test -- tests/unit

test-integration:
	npm test -- tests/integration

build:
	npm run build

lint:
	npm run lint

clean:
	npm run clean

format:
	npm run format

dev:
	npm run dev

# Installation targets
install-global:
	npm install -g .

uninstall-global:
	npm uninstall -g work-cli

# Validation targets (from plan)
validate-cli:
	@echo "Testing CLI functionality..."
	./bin/run.js create "Test task" --kind task
	./bin/run.js list
	./bin/run.js start TASK-001 || true
	./bin/run.js close TASK-001 || true
	@echo "CLI validation completed!"

validate-filesystem:
	@echo "Checking .work directory structure..."
	@test -d .work/projects/default || echo "Missing .work/projects/default"
	@test -f .work/projects/default/id-counter.json || echo "Missing id-counter.json"
	@test -f .work/projects/default/links.json || echo "Missing links.json"
	@echo "Filesystem validation completed!"

# Compound targets
check: lint test
	@echo "All checks passed!"

validate: check build validate-cli validate-filesystem
	@echo "Full validation completed!"

ci: install lint build test
	@echo "CI pipeline completed successfully!"
