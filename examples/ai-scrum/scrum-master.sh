#!/bin/bash

# Scrum Master Agent - receives work items via stdin as JSON
# Read JSON data from stdin
JSON_DATA=$(cat)

# Extract work items from JSON
WORK_ITEMS=$(echo "$JSON_DATA" | jq -r '.items[] | "\(.id):\(.title):\(.state):\(.priority)"')

if [ -z "$WORK_ITEMS" ]; then
    exit 0
fi

# Simulate scrum master actions based on the work items
echo "$WORK_ITEMS" | while IFS=':' read -r task_id title state priority; do
    if [ -n "$task_id" ]; then
        # Add clarifying comment
        work comment "$task_id" "Scrum Master: Task reviewed and prioritized" 2>/dev/null || true
        
        # Adjust priority if needed (example logic)
        if [[ "$title" == *"core"* ]] && [ "$priority" != "critical" ]; then
            work set "$task_id" --priority critical 2>/dev/null || true
            echo "  ↗️ $task_id priority → critical"
        fi
    fi
done
