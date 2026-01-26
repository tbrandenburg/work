#!/bin/bash

# Developer Agent - receives work items via stdin as JSON
# Read JSON data from stdin
JSON_DATA=$(cat)

# Extract work items from JSON
WORK_ITEMS=$(echo "$JSON_DATA" | jq -r '.items[] | "\(.id):\(.title):\(.state):\(.priority)"')

if [ -z "$WORK_ITEMS" ]; then
    exit 0
fi

# Since GitHub doesn't support "active" state, we work with new tasks
# Process up to 2 tasks: sometimes start, sometimes complete directly
echo "$WORK_ITEMS" | head -2 | while IFS=':' read -r task_id title state priority; do
    if [ -n "$task_id" ]; then
        # 50% chance to complete task directly, 50% to start it
        if [ $((RANDOM % 2)) -eq 0 ]; then
            # Complete the task directly
            work close "$task_id" 2>/dev/null || true
            work comment "$task_id" "Developer: Task completed" 2>/dev/null || true
            echo "  ✅ $task_id completed"
        else
            # Start the task (though it stays in 'new' state in GitHub)
            work start "$task_id" 2>/dev/null || true
            work comment "$task_id" "Developer: Started working on this task" 2>/dev/null || true
            echo "  ▶️ $task_id started"
        fi
    fi
done
