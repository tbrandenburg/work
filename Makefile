.PHONY: install test build lint clean format help publish publish-patch publish-minor publish-major

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
	@echo "  publish         - Publish to npm (interactive version bump)"
	@echo "  publish-patch   - Publish patch version (0.0.x)"
	@echo "  publish-minor   - Publish minor version (0.x.0)"
	@echo "  publish-major   - Publish major version (x.0.0)"

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
install-global: install build
	npm pack
	npm install -g --force ./tbrandenburg-work-*.tgz
	rm -f ./tbrandenburg-work-*.tgz

uninstall-global:
	npm uninstall -g @tbrandenburg/work

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

# Publishing targets
publish-check:
	@echo "🔍 Checking publishing preconditions..."
	@# Check if logged into npm
	@npm whoami > /dev/null || (echo "❌ Not logged into npm. Run 'npm login' first." && exit 1)
	@echo "✅ npm login verified"
	@# Check git status
	@git status --porcelain | grep -q . && (echo "❌ Working directory not clean. Commit or stash changes first." && exit 1) || echo "✅ Working directory clean"
	@# Check if on main/master branch
	@BRANCH=$$(git branch --show-current); \
	if [ "$$BRANCH" != "main" ] && [ "$$BRANCH" != "master" ]; then \
		echo "❌ Not on main/master branch (currently on $$BRANCH)"; \
		exit 1; \
	fi
	@echo "✅ On main/master branch"
	@# Check if remote is up to date
	@git fetch origin > /dev/null 2>&1 || true
	@LOCAL=$$(git rev-parse @); \
	REMOTE=$$(git rev-parse @{u} 2>/dev/null || echo ""); \
	if [ "$$REMOTE" != "" ] && [ "$$LOCAL" != "$$REMOTE" ]; then \
		echo "❌ Local branch is not up to date with remote. Pull latest changes first."; \
		exit 1; \
	fi
	@echo "✅ Branch is up to date with remote"
	@echo "✅ All preconditions met!"

# Interactive publish (lets user choose version type)
publish: publish-check validate
	@echo "🚀 Starting interactive publish process..."
	@echo "Current version: $$(node -p "require('./package.json').version")"
	@echo "Choose version bump type:"
	@echo "  1) patch (bug fixes)"
	@echo "  2) minor (new features)"
	@echo "  3) major (breaking changes)"
	@read -p "Enter choice (1-3): " choice; \
	case $$choice in \
		1) $(MAKE) publish-patch-internal ;; \
		2) $(MAKE) publish-minor-internal ;; \
		3) $(MAKE) publish-major-internal ;; \
		*) echo "❌ Invalid choice. Aborting." && exit 1 ;; \
	esac

# Direct version bump targets
publish-patch: publish-check validate
	$(MAKE) publish-patch-internal

publish-minor: publish-check validate
	$(MAKE) publish-minor-internal

publish-major: publish-check validate
	$(MAKE) publish-major-internal

# Internal publishing logic
publish-patch-internal:
	@echo "🔧 Bumping patch version..."
	npm version patch
	@$(MAKE) publish-internal

publish-minor-internal:
	@echo "🔧 Bumping minor version..."
	npm version minor
	@$(MAKE) publish-internal

publish-major-internal:
	@echo "🔧 Bumping major version..."
	npm version major
	@$(MAKE) publish-internal

publish-internal:
	@NEW_VERSION=$$(node -p "require('./package.json').version"); \
	echo "📦 Publishing version $$NEW_VERSION..."; \
	if [ -n "$$NPM_TOKEN" ]; then \
		npm publish --access public --//registry.npmjs.org/:_authToken=$$NPM_TOKEN; \
	else \
		npm publish --access public; \
	fi; \
	echo "🏷️  Creating git tag..."; \
	git push origin --tags; \
	git push; \
	echo "📋 Creating GitHub release..."; \
	if command -v gh >/dev/null 2>&1; then \
		gh release create "v$$NEW_VERSION" --title "v$$NEW_VERSION" --notes "Release v$$NEW_VERSION" --latest; \
	else \
		echo "⚠️  GitHub CLI (gh) not found. Install with 'brew install gh' to create releases automatically."; \
	fi; \
	echo "🎉 Successfully published $$NEW_VERSION!"
