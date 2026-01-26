#!/bin/bash

# Main scrum cycle using work notify commands
VERBOSE=${1:-false}

if [ "$VERBOSE" = "true" ]; then
    echo "🔄 Starting Scrum Cycle with Notify Commands..."
fi

# 1. Scrum Master Phase - analyze all open tasks
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI notifies Scrum Master agent to prioritise and review tasks..."
    work notify send where 'state!=closed' to scrum-master
else
    echo "⚙️ work CLI notifies Scrum Master agent to prioritise and review tasks"
    # Get tasks and send to agent directly
    OPEN_TASKS=$(work list --format json | jq -c '{timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"), itemCount: (.data | length), items: [.data[] | select(.state != "closed")]}')
    if [ "$OPEN_TASKS" != '{"timestamp":"","itemCount":0,"items":[]}' ]; then
        AGENT_OUTPUT=$(echo "$OPEN_TASKS" | ./scrum-master.sh 2>&1 | grep "^  " | sed 's/^  /  /' | sed 's/^/[Scrum Master] /')
        if [ -n "$AGENT_OUTPUT" ]; then
            echo "$AGENT_OUTPUT"
        fi
    fi
    sleep 1
fi

if [ "$VERBOSE" = "true" ]; then
    echo ""
fi

# 2. Developer Phase - work on high priority tasks  
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI notifies Developer agent to execute for task..."
    work notify send where 'priority=high OR priority=critical' to developer
else
    echo "⚙️ work CLI notifies Developer agent to execute for task"
    # Get high priority NEW tasks first, then medium if no high priority available
    HIGH_PRIORITY_TASKS=$(work list --format json | jq -c '{timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"), itemCount: (.data | length), items: [.data[] | select((.priority == "high" or .priority == "critical") and .state != "closed")]}')
    
    # If no high priority tasks, get medium priority NEW tasks
    HIGH_COUNT=$(echo "$HIGH_PRIORITY_TASKS" | jq '.items | length')
    if [ "$HIGH_COUNT" = "0" ]; then
        MEDIUM_PRIORITY_TASKS=$(work list --format json | jq -c '{timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"), itemCount: (.data | length), items: [.data[] | select(.priority == "medium" and .state == "new")][0:2]}')
        MEDIUM_COUNT=$(echo "$MEDIUM_PRIORITY_TASKS" | jq '.items | length')
        if [ "$MEDIUM_COUNT" != "0" ]; then
            AGENT_OUTPUT=$(echo "$MEDIUM_PRIORITY_TASKS" | ./developer.sh 2>&1 | grep "^  " | sed 's/^  /  /' | sed 's/^/[Developer] /')
            if [ -n "$AGENT_OUTPUT" ]; then
                echo "$AGENT_OUTPUT"
            fi
        fi
    else
        AGENT_OUTPUT=$(echo "$HIGH_PRIORITY_TASKS" | ./developer.sh 2>&1 | grep "^  " | sed 's/^  /  /' | sed 's/^/[Developer] /')
        if [ -n "$AGENT_OUTPUT" ]; then
            echo "$AGENT_OUTPUT"
        fi
    fi
    sleep 1
fi

if [ "$VERBOSE" = "true" ]; then
    echo ""
fi

# 3. Reviewer Phase - review all tasks (focus on closed ones)
if [ "$VERBOSE" = "true" ]; then
    echo "⚙️ work CLI notifies Reviewer agent to review task completion..."
    work notify send where 'state=closed OR state=active' to reviewer
else
    echo "⚙️ work CLI notifies Reviewer agent to review task completion"
    # Get only closed tasks for review (not active ones)
    REVIEW_TASKS=$(work list --format json | jq -c '{timestamp: now | strftime("%Y-%m-%dT%H:%M:%SZ"), itemCount: (.data | length), items: [.data[] | select(.state == "closed")]}')
    if [ "$REVIEW_TASKS" != '{"timestamp":"","itemCount":0,"items":[]}' ]; then
        AGENT_OUTPUT=$(echo "$REVIEW_TASKS" | ./reviewer.sh 2>&1 | grep "^  " | sed 's/^  /  /' | sed 's/^/[Reviewer] /')
        if [ -n "$AGENT_OUTPUT" ]; then
            echo "$AGENT_OUTPUT"
        fi
    fi
    sleep 1
fi

if [ "$VERBOSE" = "true" ]; then
    echo ""
    echo "✅ Scrum cycle complete!"
    echo "📋 Final task status:"
    work list
fi
