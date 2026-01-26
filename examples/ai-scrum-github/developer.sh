#!/bin/bash

# Developer Agent - receives work items via stdin as JSON
# Read JSON data from stdin
JSON_DATA=$(cat)

# Extract work items from JSON
WORK_ITEMS=$(echo "$JSON_DATA" | jq -r '.items[] | "\(.id):\(.title):\(.state):\(.priority)"')

if [ -z "$WORK_ITEMS" ]; then
    exit 0
fi

# Simulate developer actions - focus on highest priority tasks
echo "$WORK_ITEMS" | head -2 | while IFS=':' read -r task_id title state priority; do
    if [ -n "$task_id" ]; then
        if [ "$state" = "new" ]; then
            # Start new tasks
            work start "$task_id" 2>/dev/null || true
            work comment "$task_id" "Developer: Started working on this task" 2>/dev/null || true
            echo "  ▶️ $task_id started"
        elif [ "$state" = "active" ]; then
            # Complete active tasks (50% chance)
            if [ $((RANDOM % 2)) -eq 0 ]; then
                work close "$task_id" 2>/dev/null || true
                work comment "$task_id" "Developer: Task completed" 2>/dev/null || true
                echo "  ✅ $task_id completed"
            else
                work comment "$task_id" "Developer: Making progress" 2>/dev/null || true
                echo "  🔄 $task_id in progress"
            fi
        fi
    fi
done
