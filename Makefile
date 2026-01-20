.PHONY: install test build lint clean format help

# Default target
help:
	@echo "Available commands:"
	@echo "  install    - Install dependencies"
	@echo "  test       - Run tests"
	@echo "  build      - Build the project"
	@echo "  lint       - Run linting"
	@echo "  clean      - Clean build artifacts"
	@echo "  format     - Format code"
	@echo "  dev        - Run in development mode"

install:
	npm install

test:
	npm test

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

# Compound targets
check: lint test
	@echo "All checks passed!"

ci: install check build
	@echo "CI pipeline completed successfully!"
