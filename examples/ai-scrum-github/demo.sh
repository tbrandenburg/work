#!/bin/bash

# Demo script - GitHub version
VERBOSE=false
if [ "$1" = "--verbose" ]; then
    VERBOSE=true
fi

echo "⚙️ work CLI Demo - Agent Orchestration (GitHub)"
echo "==============================================="

# Setup GitHub context
echo "🔧 Setting up GitHub context..."
work context add github-demo --tool github --url https://github.com/tbrandenburg/work > /dev/null 2>&1 || true
work context set github-demo

# Authenticate with GitHub
echo "🔐 Authenticating with GitHub..."
work auth login > /dev/null 2>&1

# Test GitHub connection
echo "🔍 Testing GitHub connection..."
if ! work list > /dev/null 2>&1; then
    echo "❌ GitHub authentication failed!"
    echo ""
    echo "Please ensure you have:"
    echo "1. GitHub CLI authenticated: gh auth login"
    echo "2. Or GITHUB_TOKEN environment variable set"
    echo "3. Access to repository: tbrandenburg/work"
    echo ""
    echo "Current auth status:"
    gh auth status 2>/dev/null || echo "GitHub CLI not authenticated"
    echo ""
    echo "To fix:"
    echo "  gh auth login"
    echo "  work context set github-demo"
    echo "  work list  # should work without errors"
    exit 1
fi

echo "✅ GitHub connection successful!"

# Setup notification targets
if [ "$VERBOSE" = "true" ]; then
    echo "🔧 Setting up notification targets..."
    work notify target add scrum-master --type bash --script ./scrum-master.sh --timeout 60
    work notify target add developer --type bash --script ./developer.sh --timeout 60
    work notify target add reviewer --type bash --script ./reviewer.sh --timeout 60
else
    work notify target add scrum-master --type bash --script ./scrum-master.sh --timeout 60 > /dev/null 2>&1
    work notify target add developer --type bash --script ./developer.sh --timeout 60 > /dev/null 2>&1
    work notify target add reviewer --type bash --script ./reviewer.sh --timeout 60 > /dev/null 2>&1
fi

echo "🔧 Initialize tasks..."

# Initialize tasks
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI initializing GitHub issues..."
    ./init.sh "GitHub Demo project"
    echo "Initial state:"
    work list
    echo ""
else
    ./init.sh "GitHub Demo project" > /dev/null
    echo "⚙️ work CLI initialized 3 GitHub issues"
fi

# Run 5 cycles
for i in {1..5}; do
    echo ""
    echo "🔄 Cycle $i"
    echo "--------"
    ./scrum-cycle.sh "$VERBOSE"
    
    if [ "$VERBOSE" = "false" ]; then
        # Show task count summary
        TASK_COUNT=$(work list --format json | jq '.data | length')
        OPEN_COUNT=$(work list --format json | jq '.data | map(select(.state != "closed")) | length')
        CLOSED_COUNT=$(work list --format json | jq '.data | map(select(.state == "closed")) | length')
        ACTIVE_COUNT=$(work list --format json | jq '.data | map(select(.state == "active")) | length')
        
        echo "⚙️ work CLI reports: $OPEN_COUNT open, $CLOSED_COUNT solved, $ACTIVE_COUNT active ($TASK_COUNT total)"
    fi
done

echo ""
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI orchestration complete!"
    echo "📋 Final GitHub issues status:"
    work list
    echo ""
    echo "📊 STATE SUMMARY:"
    work list --format json | jq -r '.data | group_by(.state) | .[] | "\(.[0].state): \(length) tasks"'
    echo ""
    echo "🔗 View issues at: https://github.com/tbrandenburg/work/issues"
else
    FINAL_COUNT=$(work list --format json | jq '.data | length')
    FINAL_OPEN=$(work list --format json | jq '.data | map(select(.state != "closed")) | length')
    FINAL_CLOSED=$(work list --format json | jq '.data | map(select(.state == "closed")) | length')
    echo "✅ work CLI orchestration complete: $FINAL_OPEN open, $FINAL_CLOSED solved ($FINAL_COUNT total GitHub issues)"
    echo "🔗 View at: https://github.com/tbrandenburg/work/issues"
fi

# Clean up demo issues
echo ""
echo "🧹 Cleaning up demo issues..."
if [ "$VERBOSE" = "true" ]; then
    DEMO_ISSUES=$(work list --format json | jq -r '.data[] | select(.title | contains("Demo project") or contains("Code review follow-up") or contains("Setup project") or contains("Implement core") or contains("Add tests")) | .id')
    for task_id in $DEMO_ISSUES; do
        echo "  🧹 Deleting demo issue $task_id..."
        work delete "$task_id" 2>/dev/null || true
    done
else
    DEMO_ISSUES=$(work list --format json | jq -r '.data[] | select(.title | contains("Demo project") or contains("Code review follow-up") or contains("Setup project") or contains("Implement core") or contains("Add tests")) | .id')
    for task_id in $DEMO_ISSUES; do
        work delete "$task_id" > /dev/null 2>&1 || true
    done
fi
echo "✅ Demo cleanup complete!"
