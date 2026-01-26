#!/bin/bash

# Demo script - non-verbose by default, --verbose for details
VERBOSE=false
if [ "$1" = "--verbose" ]; then
    VERBOSE=true
fi

echo "⚙️ work CLI Demo - Agent Orchestration"
echo "======================================"

# Clean slate
if [ "$VERBOSE" = "true" ]; then
    echo "🧹 Cleaning existing tasks..."
    TASK_IDS=$(work list --format json | jq -r '.data[].id')
    for task_id in $TASK_IDS; do
        work delete "$task_id" 2>/dev/null || true
    done
else
    TASK_IDS=$(work list --format json | jq -r '.data[].id')
    for task_id in $TASK_IDS; do
        work delete "$task_id" > /dev/null 2>&1 || true
    done
fi

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

# Initialize tasks
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI initializing tasks..."
    ./init.sh "Demo project"
    echo "Initial state:"
    work list
    echo ""
else
    ./init.sh "Demo project" > /dev/null
    echo "⚙️ work CLI initialized 3 tasks"
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
    echo "📋 Final task status:"
    work list
    echo ""
    echo "📊 STATE SUMMARY:"
    work list --format json | jq -r '.data | group_by(.state) | .[] | "\(.[0].state): \(length) tasks"'
else
    FINAL_COUNT=$(work list --format json | jq '.data | length')
    FINAL_OPEN=$(work list --format json | jq '.data | map(select(.state != "closed")) | length')
    FINAL_CLOSED=$(work list --format json | jq '.data | map(select(.state == "closed")) | length')
    echo "✅ work CLI orchestration complete: $FINAL_OPEN open, $FINAL_CLOSED solved ($FINAL_COUNT total tasks)"
fi
