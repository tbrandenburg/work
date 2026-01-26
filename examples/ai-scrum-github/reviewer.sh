#!/bin/bash

# Reviewer Agent - receives work items via stdin as JSON
# Read JSON data from stdin
JSON_DATA=$(cat)

# Extract work items from JSON
WORK_ITEMS=$(echo "$JSON_DATA" | jq -r '.items[] | "\(.id):\(.title):\(.state):\(.priority)"')

if [ -z "$WORK_ITEMS" ]; then
    exit 0
fi

# Create a simple session tracking file for reviewed tasks
REVIEWED_FILE="/tmp/reviewed_tasks_$$"
touch "$REVIEWED_FILE"

# Focus on closed tasks for review
CLOSED_TASKS=$(echo "$WORK_ITEMS" | grep ":closed:")

if [ -n "$CLOSED_TASKS" ]; then
    echo "$CLOSED_TASKS" | while IFS=':' read -r task_id title state priority; do
        if [ -n "$task_id" ]; then
            # Check if already reviewed in this session
            if ! grep -q "^$task_id$" "$REVIEWED_FILE" 2>/dev/null; then
                # Mark as reviewed
                echo "$task_id" >> "$REVIEWED_FILE"
                
                # 30% chance to reopen for more work
                if [ $((RANDOM % 10)) -lt 3 ]; then
                    work reopen "$task_id" 2>/dev/null || true
                    work comment "$task_id" "Reviewer: Needs additional work" 2>/dev/null || true
                    echo "  🔄 $task_id reopened"
                else
                    work comment "$task_id" "Reviewer: Approved" 2>/dev/null || true
                    echo "  ✅ $task_id approved"
                fi
            fi
        fi
    done
fi

# Always create a follow-up task
work create "Code review follow-up task" --kind task --priority medium 2>/dev/null || true
echo "  ➕ Follow-up task created"
